---
term: "RGPS"
aliases: ["Regression-Adjusted Gamma Poisson Shrinker", "RGPS model", "RGPS algorithm", "Regression-Adjusted GPS"]
short_def: "Regression-Adjusted Gamma Poisson Shrinker — an updated data-mining algorithm that controls for masking effects, first described in a 2012 Oracle white paper."
category: "statistical-method"
source: "original"
---

The Regression-Adjusted Gamma Poisson Shrinker, or RGPS, is an Empirical Bayesian data-mining algorithm that builds on MGPS. As the report defines it, RGPS was "first outlined in a 2012 Oracle white paper by William DuMouchel" and is "an update to MGPS that controls for masking effects."

In a March 2021 briefing to senior FDA officials, Dr. Ana Szarfman described RGPS's performance as "superior" to MGPS, explaining that RGPS "can better adjust for both, masking (false negatives) and confounding (false positives)" because it "incorporates more information into the signal generation process. This leads to a lower rate of missed signals and less false alerts."

When applied to VAERS data on the COVID-19 vaccines, RGPS surfaced safety signals that MGPS did not, including signals for sudden cardiac death, Bell's palsy, and pulmonary infarction. Despite repeated internal advocacy from the algorithm's own co-authors, the FDA continued to rely on MGPS rather than adopt RGPS during the COVID-19 vaccination program.
