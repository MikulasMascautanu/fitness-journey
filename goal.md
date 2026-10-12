# Goal: Fitness Tracker Web App

Build a personal fitness web app for tracking body progress and nutrition over time. It is a **web app first**. It should be installable as a PWA so values can be entered quickly from a phone, but the desktop layout is the primary design target.

## Scope

Two sections, reachable from a **left-side navigation menu** (collapses to a top bar on narrow screens):

1. **Body**: weight, body part measurements, body fat % calculated from caliper readings
2. **Nutrition**: calorie and macro calculator, daily logging, goal presets

Both sections show **history graphs**.

Out of scope for v1: workout logging, food database / barcode scanning, social features.

## Accounts

- Users have an account. **Sex, age, and height are stored on the account**.
- Body fat and BMR calculations read sex and age from the account profile.

## Body section

**Summary**: latest weight, change since first entry, latest body fat %.

**Chart**: one chart with a metric switcher: Weight, Body fat, Waist, Chest, Hips, Arm, Thigh, Neck.

**Log entry form** (one entry per date; saving the same date overwrites):

- Date (defaults to today), weight (kg)
- Measurements in cm (all optional): waist, chest, hips, arm, thigh, neck
- Caliper skinfolds in mm, with live body fat % preview

**Body fat formula**: Jackson-Pollock 3-site, then Siri.

| Sex    | Sites                      | Density (D), S = sum of 3 sites in mm                     |
| ------ | -------------------------- | --------------------------------------------------------- |
| Male   | chest, abdomen, thigh      | `1.10938 - 0.0008267*S + 0.0000016*S^2 - 0.0002574*age`   |
| Female | triceps, suprailiac, thigh | `1.0994921 - 0.0009929*S + 0.0000023*S^2 - 0.0001392*age` |

`body fat % = 495 / D - 450`. Form labels for the 3 sites change with the account's sex.

**History list**: most recent entries (date, weight, body fat %, waist).

## Nutrition section

**Daily target card**: calories, maintenance (TDEE), BMR, and a protein/carbs/fat split bar with grams.

**Calculation**:

- BMR (Mifflin-St Jeor): `10*kg + 6.25*cm - 5*age + 5` (male) or `- 161` (female). Weight = latest Body entry.
- TDEE = BMR \* activity factor (1.2 sedentary, 1.375 light, 1.55 moderate, 1.725 high)
- Target kcal = TDEE + (kg_per_week \* 7700 / 7)
- Protein = g per kg bodyweight (options 1.6 / 2.0 / 2.4), fat = % of kcal (20 / 25 / 30), carbs = remaining kcal / 4

**Weekly goal presets**: defined in kg per week, with the equivalent percentage of maintenance in parentheses (computed from the user's TDEE, so it updates with their numbers):

| Preset      | Example label       |
| ----------- | ------------------- |
| -0.5 kg/wk  | `-0.5 kg/wk (-18%)` |
| -0.25 kg/wk | `-0.25 kg/wk (-9%)` |
| 0           | `Maintain (0%)`     |
| +0.25 kg/wk | `+0.25 kg/wk (+9%)` |
| +0.5 kg/wk  | `+0.5 kg/wk (+18%)` |

(Percentages above are illustrative for a ~3000 kcal TDEE.)

**Daily log**: date, calories, protein, carbs, fat. One entry per date.

**Chart**: daily calories as bars (last 14 days) with a dashed target line. Days above target are visually muted.

**History list**: date, kcal, macros, difference from target.

## Data model (suggested)

```
Account:  id, sex ('m'|'f'), age (or birthdate), height_cm, activity, protein_g_per_kg, fat_pct, goal_kg_per_week
BodyEntry: id, account_id, date (unique per account), weight_kg, body_fat_pct?, skinfold_1_mm?, skinfold_2_mm?, skinfold_3_mm?, waist?, chest?, hips?, arm?, thigh?, neck?
FoodDay:  id, account_id, date (unique per account), kcal, protein_g, carbs_g, fat_g
```

Prefer storing `birthdate` over `age` so age stays correct over time.

## UI direction

- Left sidebar: app name, Body, Nutrition, account info pinned at the bottom
- Content column is max ~760px wide, card-based, with a large key number at the top of each section
- Light and dark themes via `prefers-color-scheme`
- Charts are simple SVG or Chart.js; no heavy dependencies
- Mobile: sidebar becomes a horizontal top bar; inputs use numeric keyboards (`inputmode="decimal"`), large touch targets

```
Desktop wireframe

+----------+-----------------------------------------+
| Fit Log    |  Body                                 |
|            |  +---------------------------------+  |
| > Body     |  | 86.9 kg        -4.4 kg since 08/17||
|   Nutri-   |  +---------------------------------+  |
|   tion     |  | [Weight][Body fat][Waist]...    |  |
|            |  |  ~~~~ line chart ~~~~           |  |
|            |  +---------------------------------+  |
|            |  | Log today: weight, date,        |  |
| somebody   |  | measurements, calipers -> BF %  |  |
| @gmail.com |  +---------------------------------+  |
+----------+-----------------------------------------+
```

A working HTML prototype of this UI exists: https://claude.ai/artifact/1ygVsZSUdo7dCWRDgUYQoM

## Technical decisions to make

These are open; propose defaults and confirm before building:

- Framework and stack (suggested: a modern SPA framework + TypeScript)
- Backend and auth for per-account data (suggested: a hosted option such as Supabase, or a small API with SQLite/Postgres)
- Charting library (SVG by hand vs Chart.js / Recharts)
- PWA: web manifest + service worker for install and offline entry

## Definition of done (v1)

- [ ] Account with sex, age/birthdate, height; sign in and out
- [ ] Left-side nav with Body and Nutrition routes
- [ ] Body: log weight, measurements, calipers; live body fat %; metric chart; history
- [ ] Nutrition: TDEE/BMR calculator, kg/week goal presets with percentage, macro split, daily log, calories chart, history
- [ ] Data persists per account
- [ ] Works well on a phone (input) and on desktop (review)
- [ ] Installable as a PWA
- [ ] Unit tests for the body fat and calorie/macro calculations
