---
term: "SMQ"
aliases: ["Standardized MedDRA Query"]
short_def: "Standardized MedDRA Query — a curated grouping of MedDRA Preferred Terms that together represent a clinical concept (e.g., 'Cardiac arrhythmias terms')."
category: "regulatory"
source: "additional"
---

A **Standardized MedDRA Query**, or **SMQ**, is an officially curated grouping of MedDRA Preferred Terms that together represent a clinically meaningful concept — for example, "Cardiac arrhythmias terms" bundles dozens of individual PTs (atrial fibrillation, ventricular tachycardia, bradycardia, and so on) under a single label. SMQs are published and maintained alongside MedDRA itself, so analysts across the FDA, EMA, and industry use the same definitions.

In safety-signal detection, querying by SMQ lets analysts surface signals at a clinically coherent level instead of having to enumerate every relevant PT by hand. Disproportionality outputs frequently show both PT-level and SMQ-level rows in the same table.
