# Raptor Scaling Values Analysis

## Understanding the Relationships

### metalCostFactor Pattern

The relationship between `hpmulti` and `metalCostFactor` follows the formula:

```
metalCostFactor × hpmulti ≈ 0.70-0.75
```

**Verification with existing values:**

| hpmulti | metalCostFactor | Product |
|---------|----------------|---------|
| 1.3 | 0.576923077 | 0.75 |
| 1.5 | 0.466666667 | 0.70 |
| 1.7 | 0.411764706 | 0.70 |
| 2.0 | 0.35 | 0.70 |
| 2.5 | 0.3 | 0.75 |
| 3.0 | 0.25 | 0.75 |
| 4.0 | 0.1875 | 0.75 |
| 5.0 | 0.15 | 0.75 |

The pattern predominantly uses **0.75** for higher multipliers.

### workerTimeMultiplier Pattern

- **hpmulti ≤ 2.0:** `0.5` (constant)
- **hpmulti = 2.5:** `0.6` (peak)
- **hpmulti = 3.0:** `0.55` (slight decrease)
- **hpmulti = 4.0:** `0.45` (continues down)
- **hpmulti = 5.0:** `0.25` (significant drop)

---

## Calculated Values for New Entries

### hpmulti = 0.5
- **metalCostFactor:** `1.5` (calculated as 0.75 / 0.5)
- **workerTimeMultiplier:** `0.5` (follows low-hpmulti pattern)

### hpmulti = 0.8
- **metalCostFactor:** `0.9375` (calculated as 0.75 / 0.8)
- **workerTimeMultiplier:** `0.5` (follows low-hpmulti pattern)

---

## Complete CSV Table

```csv
hpmulti,metalCostFactor,workerTimeMultiplier
0.5,1.5,0.5
0.8,0.9375,0.5
1.3,0.576923077,0.5
1.5,0.466666667,0.5
1.7,0.411764706,0.5
2,0.35,0.5
2.5,0.3,0.6
3,0.25,0.55
4,0.1875,0.45
5,0.15,0.25
default,1,0.5
```

---

## Game Balance Interpretation

**metalCostFactor** represents the inverse relationship between raptor strength and resource value:
- Weaker raptors (hpmulti < 1) → Higher metal value when killed
- Stronger raptors (hpmulti > 1) → Lower metal value proportionally

This prevents stronger raptors from being disproportionately valuable as loot, maintaining game balance.