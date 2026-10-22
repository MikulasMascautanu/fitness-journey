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

**Body fat method** (updated by Improvement #6): Durnin–Womersley 4-site percentage lookup using biceps, triceps, subscapular, and suprailiac for both sexes. Use the published male/female percentages from [Durnin & Womersley (1974), Table 9, p. 95](https://doi.org/10.1079/BJN19740060). Select the column from profile sex and age on the measurement date: male 17–29 or female 16–29, then 30–39, 40–49, 50+. The app accepts adults 18+.

Use exact published values for table rows and linear interpolation for totals between rows. Reject totals outside the selected column's available range. Show the age band, total millimetres, interpolation when applicable, and a link to the [statically served tables](public/reference/durnin-womersley.html). Delete historical three-site skinfold readings and estimates, retaining weight and circumference measurements. Only four-site body-fat estimates are supported.

**History list**: most recent entries (date, weight, body fat %, waist).

## Nutrition section

**Daily target card**: calories, maintenance (TDEE), BMR, and a protein/carbs/fat split bar with grams.

**Calculation**:

- BMR (Mifflin-St Jeor): `10*kg + 6.25*cm - 5*age + 5` (male) or `- 161` (female). Weight = latest Body entry.
- TDEE = BMR \* activity factor (1.2 sedentary, 1.375 light, 1.55 moderate, 1.725 high)
- Target kcal = TDEE + (kg_per_week \* 7700 / 7)
- Protein = g per kg bodyweight (0.1–5 in 0.1 increments; presets 1.6 / 2.0 / 2.4), fat = % of kcal (15–30 in 1% increments; presets 20 / 25 / 30), carbs = remaining kcal / 4

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
BodyEntry: id, account_id, date (unique per account), weight_kg, body_fat_pct?, body_fat_method?, skinfold_1_mm?, skinfold_2_mm?, skinfold_3_mm?, skinfold_4_mm?, waist?, chest?, hips?, arm?, thigh?, neck?
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
| Fitness Journey    |  Body                                 |
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

Confirmed on 2026-10-13:

- React + TypeScript + Vite, implemented in this repository
- Supabase Postgres and Google sign-in, with per-account row-level security
- Lightweight SVG charts
- Web manifest + service worker, with IndexedDB storage and an offline sync queue
- No existing Supabase project: include migrations and setup instructions in `README.md`

## Working agreement

Commit the work in reasonable chunks. Each commit should be one coherent, working step (for example: project scaffold, account and data model, body fat calculation with tests, Body tab UI, nutrition calculation with tests, Nutrition tab UI, PWA setup), not one giant commit at the end and not a commit per file.
Write clear commit messages that say what changed and why.
Keep the app buildable and tests passing at every commit.

## Definition of done (v1)

- [ ] Account with sex, age/birthdate, height; sign in and out — implemented; live Google authentication awaits Supabase setup
- [x] Left-side nav with Body and Nutrition routes
- [x] Body: log weight, measurements, calipers; live body fat %; metric chart; history
- [x] Nutrition: TDEE/BMR calculator, kg/week goal presets with percentage, macro split, daily log, calories chart, history
- [ ] Data persists per account — local isolation and sync queue tested; live database ownership checks await Supabase setup
- [x] Works well on a phone (input) and on desktop (review)
- [x] Installable as a PWA
- [x] Unit tests for the body fat and calorie/macro calculations

## Implementation status (2026-10-13)

The app is implemented and available locally with `npm run dev`. **Explore the demo** works without backend credentials and clearly labels its sample data. Real accounts start empty.

Verified: production build, 27 unit tests, and 14 Chromium browser checks across desktop and mobile viewports. Browser checks cover both themes, form entry/editing, reload persistence, female caliper sites, nutrition settings, offline deep navigation and entry, install assets, sign-out, and concurrent saves from two tabs. Desktop and mobile screenshots were reviewed.

The two unchecked items have implementation and setup documentation but need a Supabase project and configured Google OAuth for live verification. Follow `README.md` and run the supplied migration, then test Google sign-in/out, cloud synchronization, and isolation between two real accounts. No deployment has been made.
