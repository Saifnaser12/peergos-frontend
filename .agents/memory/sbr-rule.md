---
name: UAE CIT Small Business Relief rule
description: Revenue ≤ AED 3M triggers 0% CIT via Small Business Relief; must be applied consistently everywhere
---
The rule: `citDue = revenue <= 3_000_000 ? 0 : (netIncome <= 375_000 ? 0 : (netIncome - 375_000) * 0.09)`

**Why:** UAE CT Law Art. 21 — SBR applies to taxable persons with revenue ≤ AED 3M. The older code used the 375k net-income threshold only, which would incorrectly show CIT > 0 for an SME with 1.6M revenue but 500k net income.

**How to apply:** Anywhere CIT is computed (KPI endpoint, CIT page, AI assistant stat cards) — always check revenue ≤ 3M first.
