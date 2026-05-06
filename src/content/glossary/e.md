---
term: "E"
aliases: ["expected count"]
short_def: "The expected count — how many reports of a given product+event pair you'd see under the null hypothesis (no association), based on marginal totals."
category: "metric"
source: "additional"
---

**E** is the expected count for a product+event cell of the disproportionality contingency table — the number of reports you would expect under the null hypothesis that the product and the event are statistically independent. It is computed from the marginal row and column totals: roughly, (reports for this product) times (reports for this event) divided by (total reports). The ratio of observed to expected, **N / E**, is the relative reporting ratio (RR), which Empirical Bayes algorithms like MGPS and RGPS then shrink toward the group average to produce more reliable estimates such as **EBGM** and **ERAM**.
