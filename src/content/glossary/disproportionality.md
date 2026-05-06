---
term: "disproportionality"
aliases: ["disproportionality analysis", "disproportionate reporting", "disproportionality signal"]
short_def: "An excess of reports for a particular product-event pair compared to other products in the same database — the basic statistical concept that drives signal detection."
category: "statistical-method"
---

Disproportionality is the core idea behind data-mining safety surveillance: a particular adverse event is reported much more often for one product than for the rest of the products in the database. If a heart-attack report shows up after Vaccine A at ten times the rate it appears for all other vaccines combined, that is a disproportionate reporting pattern worth a closer look.

A disproportionality analysis is the formal version of this comparison. The report quotes HHS describing EB data mining as a "statistical method for identifying disproportionality (excess of reported [adverse events]) for [a] product relative to other products) in large database[s]." Disproportionality alone does not prove that a product caused an event — it only flags a statistical association that warrants further investigation.

Disproportionality analyses are vulnerable to masking: if many products in the database produce similar reports, the "excess" for any one of them can be diluted, and a real signal can fail to cross the alert threshold.
