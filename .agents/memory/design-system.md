---
name: UAE Fintech Design System
description: Brand tokens and component patterns applied across all pages in Peergos
---

## Brand Colors
- Navy (primary): `#0A3A5C` — hover `#0D4A75`
- Emerald (accent/success): `#0E9F6E`
- Gold: `#C9A227`
- Background: `#F6F8FA`
- Border: `#E5EAF0`

## Card Pattern
```
rounded-xl border border-[#E5EAF0] shadow-sm hover:shadow-md transition-shadow
```

## Stat Card Pattern
- Container: `p-5`, flex justify-between
- Label: `text-[11px] font-semibold text-gray-500 uppercase tracking-widest`
- Value: `text-[26px] font-bold tabular-nums mt-1`
- Icon chip: `w-11 h-11 rounded-xl flex items-center justify-center`, color-specific bg `rgba(R,G,B,0.10)`

## Tab Pattern
```
TabsList: bg-gray-100/70 p-1 rounded-xl h-auto
TabsTrigger: rounded-lg text-[13px] data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-[#0A3A5C] data-[state=active]:font-semibold px-4 py-2
```

## Primary Button
```jsx
style={{ backgroundColor: '#0A3A5C' }}
onMouseEnter={e => e.currentTarget.style.backgroundColor = '#0D4A75'}
onMouseLeave={e => e.currentTarget.style.backgroundColor = '#0A3A5C'}
className="h-9 text-[13px] font-semibold text-white"
```

## Skeleton Shimmer (replaces "Loading..." text)
```jsx
<div className="animate-pulse rounded bg-gray-200/80 h-8 w-40" />
```

## Empty State
```jsx
<div className="flex flex-col items-center justify-center py-16 text-center">
  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
    <Icon className="w-6 h-6 text-gray-400" />
  </div>
  <p className="text-[13px] text-gray-500">{message}</p>
</div>
```

## Page Header
```jsx
<h1 className="text-[22px] font-bold text-gray-900">{title}</h1>
<p className="text-[13px] text-gray-500 mt-0.5">{subtitle}</p>
```

**Why:** Government-grade fintech aesthetic — professional, trustworthy, UAE-appropriate. Applied across all pages in Run 1 (dashboard, sidebar, topbar) and Run 2 (all remaining pages).
