---
term: "EB data mining"
aliases: ["Empirical Bayesian data mining", "Empirical Bayes data mining", "EB Data Mining", "Empirical Bayesian (\"EB\") Data Mining", "Empirical Bayes Geometric Mean"]
short_def: "Empirical Bayesian data mining — the statistical method federal health agencies use to scan adverse-event databases for disproportionate combinations of products and events."
category: "statistical-method"
---

As the report defines it, Empirical Bayesian ("EB") data mining is "the data mining method utilized by federal health agencies to identify statistical associations between products and adverse events." HHS describes it as a "statistical method for identifying disproportionality (excess of reported [adverse events]) for [a] product relative to other products) in large database[s]."

In practice, EB data mining looks at every drug-event pair in a database like VAERS and asks whether a particular pair is reported at a higher rate than would be expected by chance, given the overall reporting volume. The "Bayesian" part refers to the way the algorithm shrinks unstable estimates from rare events toward a more reliable group average — a statistical technique that reduces noise without erasing real signals.

CDC officials publicly called EB data mining the "gold standard" for disproportionality analysis. The FDA's preferred implementation has been MGPS, run through Oracle's Empirica Signal software. The method has known blind spots, however — most notably the masking phenomenon documented in this report.
