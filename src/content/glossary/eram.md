---
term: "ERAM"
aliases: ["ER05", "ER95", "Empirical Regression-Adjusted Mean"]
short_def: "Empirical Regression-Adjusted Mean — the central estimate of the relative reporting ratio under RGPS. ER05 and ER95 are the 5th and 95th percentiles."
category: "metric"
source: "additional"
---

**ERAM** is the RGPS counterpart of EBGM: the central, shrinkage-corrected point estimate of the relative reporting ratio for a product+event pair, but produced by the Regression-Adjusted Gamma Poisson Shrinker rather than the original MGPS. The accompanying **ER05** and **ER95** are the 5th and 95th percentiles of the posterior distribution, forming a 90% credible interval around ERAM.

The "regression-adjusted" part is what differentiates ERAM from EBGM. RGPS layers a regression on top of the MGPS framework that controls for stratification confounders — most importantly the masking effects that occur when one product (such as a high-volume COVID-19 vaccine) inflates the comparison baseline and hides real signals for similar products. When applied to the VAERS COVID-19 data, RGPS surfaced safety signals that MGPS did not.
