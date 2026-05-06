---
term: "MGPS"
aliases: ["Multi-item Gamma Poisson Shrinker", "MGPS model", "MGPS algorithm"]
short_def: "Multi-item Gamma Poisson Shrinker — the data-mining algorithm the FDA used to scan VAERS for safety signals. Invented by William DuMouchel in 1999."
category: "statistical-method"
source: "original"
---

The Multi-item Gamma Poisson Shrinker, or MGPS, is the Empirical Bayesian data-mining algorithm the FDA has long used to identify statistically significant safety signals in adverse event reporting databases like VAERS. As the report describes it, MGPS "was originally developed by William DuMouchel in 1999" and is the algorithm at the heart of the FDA's "gold standard" disproportionality analysis.

In practice, MGPS scans large databases of spontaneous adverse-event reports and flags drug-event pairs that show up disproportionately often compared to a baseline of all other reports. The FDA's threshold for declaring a statistically significant signal was when the lower bound of MGPS's reporting estimate (EB05) exceeded 2.0.

MGPS has a known limitation: it is vulnerable to masking. When one or more products in the database generate enormous volumes of reports — as the COVID-19 vaccines did — the MGPS-generated baseline can be inflated to the point where real signals for similar products are hidden. Dr. Szarfman, one of the FDA officials who helped adopt MGPS in the first place, advocated internally for replacing it with a newer algorithm (RGPS) that adjusts for masking.
