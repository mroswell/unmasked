---
term: "RR"
aliases: ["Relative Reporting Ratio", "Relative Risk"]
short_def: "Relative Reporting Ratio — the raw observed-over-expected ratio (N / E) for a product+event pair. No Bayesian shrinkage applied; sensitive to small counts."
category: "metric"
source: "additional"
---

In MGPS/RGPS output tables, **RR** is the Relative Reporting Ratio (sometimes labeled "Relative Risk"): the raw ratio of observed to expected reports for a product+event pair, **N / E**. Unlike EBGM or ERAM, RR has no Bayesian shrinkage applied — it is the direct output of the contingency table without correction for small-sample noise.

That makes RR useful as a sanity check (a quick view of how disproportionate the raw reporting is) but unreliable as a signal threshold, because a single report against an extremely low expected count can produce a huge RR that does not survive shrinkage. The Empirical Bayes algorithms exist precisely to discount these unstable cells.
