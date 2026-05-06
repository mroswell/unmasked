---
term: "stratification"
aliases: ["stratified", "stratify", "stratified analysis"]
short_def: "Splitting an analysis into subgroups — by age, sex, or year — so each subgroup is compared against a more relevant baseline, helping control for confounding."
category: "statistical-method"
---

Stratification is a technique for controlling confounding by dividing the data into subgroups and analyzing each one separately. A safety analysis stratified by age, for example, would compare reports for older adults only against other reports for older adults, rather than mixing all ages into a single baseline.

In the FDA's data-mining work, MGPS analyses are typically stratified by year to account for time-dependent reporting patterns. The report quotes Dr. Craig Zinderman discussing a Szarfman-DuMouchel analysis: "I don't pretend to understand it, but sounds like they are suggesting an analysis not stratified by year." Stratification is the older, manual approach to confounding control; RGPS uses regression instead, which can adjust for several variables simultaneously without slicing the data into smaller and smaller bins.
