#!/bin/bash
# M2 Stage 1 — Download source documents listed in scripts/download-manifest.json
# into raw/, recording size + sha256 + fetch time in raw/manifest.json.
#
# Idempotent: re-runs skip files already present unless --force is given.
#
# NOTE: Although the manifest field is named pdf_url for historical reasons,
# 10 of the 19 source documents are Excel spreadsheets (.xls / .xlsx) rather
# than PDFs. The per-entry "ext" field controls the local file extension.
set -euo pipefail

cd "$(dirname "$0")/.."

MANIFEST=scripts/download-manifest.json
RAW_DIR=raw
mkdir -p "$RAW_DIR"

OUT_MANIFEST="$RAW_DIR/manifest.json"
TMP_OUT=$(mktemp)
echo "[]" > "$TMP_OUT"

count=$(jq 'length' "$MANIFEST")
echo "Downloading $count documents..."

failed=0
for i in $(seq 0 $((count - 1))); do
  ID=$(jq -r ".[$i].id" "$MANIFEST")
  PDF_URL=$(jq -r ".[$i].pdf_url" "$MANIFEST")
  TITLE=$(jq -r ".[$i].title" "$MANIFEST")
  KIND=$(jq -r ".[$i].kind" "$MANIFEST")
  EXT=$(jq -r ".[$i].ext // \"pdf\"" "$MANIFEST")
  OUT_PATH="$RAW_DIR/$ID.$EXT"

  if [[ "$PDF_URL" == "null" || -z "$PDF_URL" ]]; then
    echo "  [skip] $ID (no source URL)"
    continue
  fi

  if [[ -f "$OUT_PATH" ]] && [[ "${1:-}" != "--force" ]]; then
    echo "  [skip] $ID (already downloaded)"
  else
    echo "  [fetch] $ID  <-  $PDF_URL"
    if ! curl -sSL --fail -o "$OUT_PATH.tmp" "$PDF_URL"; then
      echo "  [FAIL] $ID  ($PDF_URL)"
      rm -f "$OUT_PATH.tmp"
      failed=$((failed + 1))
      continue
    fi
    mv "$OUT_PATH.tmp" "$OUT_PATH"
  fi

  SIZE=$(stat -f%z "$OUT_PATH")
  SHA=$(shasum -a 256 "$OUT_PATH" | awk '{print $1}')
  FETCHED_AT=$(date -u +%Y-%m-%dT%H:%M:%SZ)

  jq \
    --arg id "$ID" \
    --arg title "$TITLE" \
    --arg url "$PDF_URL" \
    --arg kind "$KIND" \
    --arg ext "$EXT" \
    --argjson size "$SIZE" \
    --arg sha "$SHA" \
    --arg fetched "$FETCHED_AT" \
    --arg path "$OUT_PATH" \
    '. += [{id: $id, title: $title, source_url: $url, kind: $kind, ext: $ext, byte_size: $size, sha256: $sha, fetched_at: $fetched, local_path: $path}]' \
    "$TMP_OUT" > "$TMP_OUT.next" && mv "$TMP_OUT.next" "$TMP_OUT"
done

mv "$TMP_OUT" "$OUT_MANIFEST"
echo "Done. Manifest: $OUT_MANIFEST"

total=$(jq '[.[].byte_size] | add' "$OUT_MANIFEST")
echo "Total bytes downloaded: $total"
echo "Total MB: $(echo "scale=2; $total / 1048576" | bc)"

if [[ $failed -gt 0 ]]; then
  echo "WARNING: $failed download(s) failed."
  exit 1
fi
