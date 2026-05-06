---
term: "truncation"
aliases: ["truncation bias", "truncated", "truncate", "truncating"]
short_def: "Cutting off part of a dataset — for example, by date — in a way that can hide signals or distort the comparison group used in disproportionality analysis."
category: "statistical-method"
---

Truncation refers to the practice of restricting an analysis to a subset of the available data, typically by time. For instance, an analyst might limit a VAERS query to reports filed within a specific date range, or exclude very old reports that pre-date a particular surveillance system.

Truncation is sometimes legitimate — analysts may want to focus on a particular reporting period — but it can also introduce bias. If recent reports are excluded, lagging adverse-event reports may never enter the analysis. If old reports are excluded, the comparison baseline can shift in ways that change which signals appear above threshold. The report and outside researchers (notably David Wiseman) have flagged truncation, alongside masking and filtering, as a way that signals can be lost from disproportionality analyses of VAERS data.
