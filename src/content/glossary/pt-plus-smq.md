---
term: "PT_plus_SMQ"
aliases: ["PT+SMQ"]
short_def: "PT_plus_SMQ — a column in MGPS/RGPS output where each row is either a single Preferred Term (PT) or a Standardized MedDRA Query (SMQ), as the adverse-event identifier."
category: "regulatory"
source: "additional"
---

**PT_plus_SMQ** is the column header used in MGPS and RGPS output tables to identify the adverse event under analysis. Each row's identifier is either a single MedDRA **Preferred Term** (a granular medical concept like "Bell's palsy") or a **Standardized MedDRA Query** (a curated grouping of related PTs like "Cardiac arrhythmias terms"). Mixing the two in one column lets the analysis surface signals at multiple levels of clinical specificity in the same run — granular enough to spot a single PT spike, broad enough to detect patterns that only become visible when related PTs are pooled.
