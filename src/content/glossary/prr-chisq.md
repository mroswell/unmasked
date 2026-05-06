---
term: "PRR_CHISQ"
aliases: ["PRR chi-squared"]
short_def: "Chi-squared test statistic associated with the PRR — a measure of statistical significance for the proportional reporting ratio."
category: "metric"
source: "additional"
---

**PRR_CHISQ** is the chi-squared test statistic that accompanies the Proportional Reporting Ratio in disproportionality output tables. Where PRR tells you the size of the reporting disproportion, PRR_CHISQ tells you how unlikely that disproportion is to have arisen by chance alone, given the observed and expected counts. Higher chi-squared values correspond to lower p-values and a stronger statistical case that the disproportion is real rather than noise. Common signal-detection rules combine a PRR threshold with a minimum PRR_CHISQ (often around 4) to filter out small or unstable cells.
