# OCR strategy evaluation for an 11M-page corpus

## Context

The current site processes 19 documents (~1,000 pages total) with `ocrmypdf` (Tesseract under the hood) running locally — see `scripts/02-ocr-pdfs.sh`. The user is now considering a corpus of **11 million pages** from the same source. That's a four-orders-of-magnitude increase. The local pipeline is the wrong tool at this scale.

The user proposed a three-stage pipeline:

| Stage                              | Cost (11M)      | Wall time   | Notes                              |
|------------------------------------|-----------------|-------------|------------------------------------|
| 1. OCR (cheap baseline)            | $11K – $16K     | 3 – 7 days  | Tesseract or Mistral over the corpus |
| 2. Premium re-OCR on hits (~1%)    | $1.5K – $5K     | 1 – 2 days  | Document AI / Textract on survivors |
| 3. Indexing + embeddings           | $100 – $500     | 2 – 4 days  | Open source (Tantivy/Elasticsearch + small embedding model) |

This document evaluates that pipeline, prices the alternatives, flags hidden costs, and recommends a refined approach.

## Verdict on the proposed pipeline

**The two-tier "cheap-baseline + premium-on-hits" structure is the right shape.** OCRing 11M pages with a premium service ($1.50/1K pages × 11M = $16.5K base, $50–65/1K for forms/tables = $550K) is wasteful when most pages won't ever be read. Cheap-first-then-promote is how every serious large-corpus pipeline does it.

Two concerns with the table as written:

1. **The cost row for stage 1 is reasonable but tight.** $0.001/page is the floor: Mistral OCR's posted rate, or a self-hosted Tesseract/Surya/PaddleOCR setup on cloud GPUs at scale. Hitting that price requires real engineering investment — orchestration, resumability, monitoring, cost guardrails. Budget in dev time, not just per-page cost.

2. **Stage 1 wall time of 3–7 days assumes massive parallelism.** A single workstation OCRing 11M pages serially is ~250 days at 2 sec/page. To hit 5 days you need ~25 parallel workers minimum. Cloud serverless (Lambda + queue) or a Kubernetes job cluster handles this cleanly; ad-hoc shell scripts don't.

3. **Stage 3 cost ($100–500) is suspiciously low for managed services.** OpenSearch / Elasticsearch managed clusters that can index 11M docs comfortably run $200–500 *per month*, not as a one-time cost. Self-hosted on a single beefy box (Tantivy, Quickwit, or Meilisearch) is closer to your stated budget but needs ops attention.

## Cost reality check, by tool

| Tool                              | $/1K pages          | 11M cost   | Notes                                    |
|-----------------------------------|---------------------|------------|------------------------------------------|
| Tesseract / OCRmyPDF (self-host)  | ~$0.50 (compute)    | ~$5,500    | Cheap if you own the infra; needs orchestration |
| Surya / PaddleOCR on cloud GPU    | ~$0.30–0.80         | ~$3K–9K    | Higher quality than Tesseract; needs GPU |
| Mistral OCR API                   | ~$1.00              | ~$11,000   | Newer service, decent quality, simple API |
| AWS Textract (basic OCR)          | ~$1.50              | ~$16,500   | Solid quality; volume discounts past 1M |
| AWS Textract (forms/tables)       | ~$50–65             | ~$550K+    | Only worth it on the 1% premium pass |
| Google Document AI (general OCR)  | ~$1.50              | ~$16,500   | Good for layout-heavy material |
| Azure Read API                    | ~$1.00–1.50         | ~$11K–16K  | Comparable to GCP/AWS |
| Gemini 1.5 Flash (vision)         | ~$0.10              | ~$1,100    | Cheap but quality variable on dense layouts; great for triage |
| Claude / GPT-4o vision            | ~$10–50             | $110K–550K | Excellent quality but only for premium pass on hits |

**Reading this table:** the cheap baseline really can land at ~$11K, but only if the implementation chooses Mistral OCR or a self-hosted Surya/Paddle pipeline. Tesseract on managed infra is cheaper still but the quality drop matters for follow-on retrieval recall.

## What's missing from the proposed pipeline

### Pre-OCR triage

FOIA productions are full of:
- **Blank/separator pages** — often 20–40% of a production. OCRing them wastes money.
- **Heavily redacted pages** — black bars confuse OCR; the text outside the redactions is usually short. Worth detecting.
- **Bates-stamp-only pages** — single-line page with a stamp. Cheap to detect; trivially summarized.
- **Already-text-layer PDFs** — born-digital PDFs (testimony, statements) that don't need OCR at all. We already handle this with `--skip-text`.

A 5-minute classifier (page-area histogram + simple thresholding) before stage 1 can cut OCR volume by 30%+ on FOIA-style productions. Concrete impact: trims $11K → $7-8K.

### Storage costs

11M searchable PDFs at ~50–150KB each = 0.5–1.5 TB. That's not free.

- S3 Standard: ~$25/mo per TB
- S3 Glacier Instant Retrieval: ~$4/mo per TB (but $0.01/GB retrieval = $5–15 per pull)
- B2 / Cloudflare R2: ~$5/mo per TB, no egress fees (egress matters for this site)

R2 is the obvious pick for a public archive: pay $5–15/mo plus zero egress to serve PDFs to readers.

### Compute infrastructure for stage 1

Three credible patterns:

**A. Serverless fan-out** — Lambda or Cloud Run + SQS / Pub/Sub queue. 11M pages, 2 sec each, $0.0000167/sec Lambda compute = ~$370 in compute (cheap!) + Mistral/Textract per-page fees on top. Pros: no ops; auto-scales. Cons: 15-minute Lambda max; need to chunk PDFs into pages first.

**B. Kubernetes Job array** — k8s job with N parallel workers, each pulling from a queue. Standard pattern; full control. Pros: cheap if you're already on k8s; resumable. Cons: ops investment.

**C. One-off cloud GPU for Surya/Paddle** — rent an A100 for a week ($300–700 on RunPod or Vast.ai). 11M pages / 10K pages per hour = 1100 hours = ~46 days. Need 8–16 GPUs in parallel: $5K–10K total. Pros: highest-quality open-source OCR; full control. Cons: needs distributed-job tooling.

Our current `scripts/02-ocr-pdfs.sh` is none of these — it's a serial bash loop. Whatever stage 1 looks like at scale is a complete rewrite, not an extension.

### Indexing + embeddings, more honestly

The user's stage 3 budget assumes self-hosted open-source. That's correct for cost, but worth being explicit:

- **BM25-only retrieval** (Tantivy / Quickwit / Lucene) — covers 80%+ of "find documents containing phrase X" use cases. Single beefy server can index 11M pages overnight. Storage: ~10–30 GB index for the corpus. Cost: a $50/mo cloud VM.
- **Add embeddings** (bge-small-en-v1.5 at 384 dims, or all-MiniLM at 384 dims) — semantic recall for "find documents related to topic Y". Encoding 11M pages on a single GPU is a ~2-day job; storage is 11M × 1.5KB = 16 GB. Search via a vector DB (Qdrant, Weaviate, Milvus, pgvector) — ~$50–100/mo for a small managed instance.
- **Hybrid (BM25 + embeddings)** — the right answer for serious retrieval; reranks BM25 candidates with cosine similarity. The user's $100–500 estimate fits this if self-hosted.

**Recommendation: build BM25 first, add embeddings only after seeing how queries actually fall.** Most people overspend on embeddings before they have a real retrieval workload.

### Quality/recall thresholds for stage 2

The "1% hits" assumption needs interrogation. What drives that 1%?

- If "hit" = "matched a search query," recall depends on stage-1 OCR quality. Tesseract on FOIA scans typically has 90–96% character accuracy on body text, much worse on redactions and signatures. That's enough to find documents but not enough to support exact-quote search reliably.
- A more nuanced threshold: stage 2 fires on (a) any document an analyst opened from a search result, AND (b) any document above a relevance score threshold from BM25/embedding.
- Plan for **3–5% premium re-OCR**, not 1%, as a safety margin. That bumps stage-2 cost from $1.5K–5K to $4K–25K depending on volume.

## Recommended pipeline

A revised version of the proposed table:

| Stage  | Action                                                            | Cost         | Wall time   |
|--------|-------------------------------------------------------------------|--------------|-------------|
| 0      | **Triage**: classify pages (blank / Bates-only / redacted-heavy / text-rich); skip the first three from stage 1 | <$50         | 1 day       |
| 1      | **Cheap OCR** on text-rich subset (~7M pages after triage). Mistral OCR API or self-hosted Surya/Paddle on cloud GPU. | $7K–$10K   | 3–7 days    |
| 2      | **BM25 indexing** (Quickwit / Tantivy) + page-level metadata in Postgres or DuckDB | $50–200    | 2–3 days    |
| 3      | **Premium re-OCR** on documents that surface in searches OR analysts open OR rank highly. Document AI for forms; Claude/GPT-4o for tables/handwriting. Plan ~3% volume. | $4K–10K    | 1–2 days (rolling, not bulk) |
| 4      | **Add embeddings** only after stage 2 surfaces the actual query distribution; bge-small-en-v1.5 self-hosted | $300–800   | 2–4 days    |
| —      | **Storage**: Cloudflare R2 for OCR'd PDFs (~1 TB)                 | $5–15/mo     | —           |
| —      | **Search hosting**: $50–100/mo VM for the index server             | ongoing      | —           |

**Total upfront**: ~$11K–20K for stages 0–4.
**Ongoing**: ~$60–120/mo for storage + search.
**Wall time**: 2–3 weeks end-to-end with a serious engineering effort, 4–6 weeks with one engineer working it part-time.

## Key questions to resolve before kicking off

1. **What is the 11M-page corpus?** Full VAERS FOIA production? A specific FOIA bulk release? The answer drives layout assumptions (forms/tables/scanned-emails ratio) and language assumptions (English-only?).
2. **Quality target.** Are we aiming for "find documents containing topic X" (looser) or "extract structured data from forms with high fidelity" (tighter)? The two require different stage-1 tools.
3. **Hosting model.** Is this corpus going to live behind the public site at `signals.coviddocuments.com`, or is it a research corpus accessed only by a small number of analysts? The first needs Cloudflare R2 + careful PDF.js setup; the second can be a private bucket with downloadable archives.
4. **Budget ceiling.** Is the user willing to spend $20K to ingest the corpus, with $100–200/mo ongoing? Or is $5K hard ceiling and the rest is volunteer compute?
5. **Timeline pressure.** Is there an event or hearing this needs to be ready for? Affects whether to use managed services (faster, more $) vs. self-hosted (cheaper, more time).
6. **Existing infrastructure.** AWS account? GCP? Cloudflare? Personal cloud or org? Affects which patterns are pragmatic.

## How this connects to the current repo

The current `scripts/02-ocr-pdfs.sh` does NOT scale. It will need to be replaced — not extended — for the 11M-page work. That said, the architectural patterns we've already proven *do* extend:

- **`pdf-parse` for unified text extraction** in `scripts/06-extract-text.mjs` is a sound base — the per-page text extraction logic is the same regardless of corpus size.
- **Catalog JSON per document** in `src/content/documents/` doesn't scale to 11M entries; the file-per-document pattern needs to become a single SQLite/Postgres table.
- **Pagefind for search** is great for our current ~26 pages but stops being viable around 10K pages. Quickwit / Meilisearch is the natural step up.
- **Cloudflare R2 + signed URLs** would be a good replacement for `public/documents/` once the corpus exceeds GitHub Pages limits.

If the 11M corpus is a future direction, the current site should be treated as a prototype for a much larger system, not the system itself. The data model and search patterns we've built are good prototypes; the storage, OCR, and indexing infrastructure all need to be replaced.
