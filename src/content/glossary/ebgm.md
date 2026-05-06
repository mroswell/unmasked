---
term: "EBGM"
aliases: ["EB95", "Empirical Bayes Geometric Mean"]
short_def: "Empirical Bayes Geometric Mean — the central (shrinkage) estimate of the relative reporting ratio under MGPS. Together with EB05 and EB95, it forms the 90% credible interval."
category: "metric"
source: "additional"
---

**EBGM** is the Empirical Bayes Geometric Mean: the central, shrinkage-corrected point estimate of the relative reporting ratio produced by MGPS for a given product+event pair. It is the geometric mean of the posterior distribution. The 5th and 95th percentiles of that same posterior are reported as **EB05** and **EB95**, which together form a 90% credible interval around EBGM.

The shrinkage step is what distinguishes EBGM from the raw N/E ratio (RR): when N is small, the raw ratio is noisy and easily inflated, and the Empirical Bayes machinery pulls the estimate toward the group average, leaving only differences that the data actually support. FDA's signal threshold has historically been EB05 > 2.0 — meaning the lower bound of the credible interval must exceed twice the expected reporting rate — though Dr. Ana Szarfman's analyses noted that any EBGM above 1 already indicates disproportional reporting.
