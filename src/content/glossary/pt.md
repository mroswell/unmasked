---
term: "PT"
aliases: ["Preferred Term", "MedDRA Preferred Term"]
short_def: "MedDRA Preferred Term — a specific medical concept (e.g., 'Bell's palsy', 'Sudden cardiac death') used to code adverse events in VAERS."
category: "regulatory"
source: "additional"
---

A **Preferred Term**, or **PT**, is the standard granular adverse-event label in **MedDRA**, the medical-terminology dictionary regulators use to code reports in databases like VAERS. Each PT names a single distinct clinical concept — examples include "Bell's palsy," "Sudden cardiac death," and "Pulmonary embolism." When an adverse event is reported, MedDRA-trained coders map the narrative to the closest PT so that downstream signal-detection tools can group identical events together regardless of how the original report was worded. PTs are the most common unit of analysis in disproportionality output, often appearing alongside broader **SMQ** groupings.
