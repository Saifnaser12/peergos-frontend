---
name: KPI Data Shape
description: Shape of /api/kpi-data response and how to consume it correctly
---

## API Response Shape
`/api/kpi-data` returns an **array** with a single object:
```json
[{ "id": 1, "companyId": 1, "period": "FY-2025-2026", "revenue": "1618000", "vatDue": "53920", "citDue": "0", "expenses": "1097780" }]
```

## Correct Usage
```typescript
const currentKpi = Array.isArray(kpiData) && kpiData.length > 0 ? kpiData[0] : null;
const revenue = parseFloat(currentKpi?.revenue || '0');
const vatDue = parseFloat(currentKpi?.vatDue || '0');
```

**Why:** Fields are strings not numbers (Drizzle ORM decimal type). Do NOT destructure as `{metric, value}` pairs — that's the wrong shape.

## Demo Data (DO NOT reseed)
- company_id=1, ABC Trading LLC, TRN 100123456700003
- Revenue: AED 1,618,000 | VAT Due: AED 53,920 | CIT: 0 (SBR applied)
