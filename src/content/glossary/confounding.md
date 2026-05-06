---
term: "confounding"
aliases: ["confounder", "confounders", "confounded", "confound"]
short_def: "When an outside factor — like age or calendar year — distorts an apparent link between a product and an adverse event, producing false positives or hiding real effects."
category: "statistical-method"
---

Confounding happens when something other than the product itself explains the relationship between the product and an adverse event. If older patients are more likely to receive a particular vaccine and also more likely to have heart attacks, the apparent association between the vaccine and heart attacks may simply reflect the age of the people who took it. Age, in that case, is the confounder.

In data-mining safety surveillance, common confounders include calendar year (because reporting volume changes over time), patient age, and exposure patterns that differ across products. RGPS, the algorithm Dr. Szarfman advocated for, "automatically identifies and corrects for confounders," in her words — by contrast, MGPS requires analysts to handle confounding through stratification or other manual adjustments.

Confounding can produce false positives (apparent signals that vanish once you adjust for the lurking variable) or false negatives (real effects that disappear into the noise).
