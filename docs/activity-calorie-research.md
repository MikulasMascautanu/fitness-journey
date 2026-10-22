# Flexible activity and calorie planning

Research and product proposal for Improvements #5. Reviewed 18 October 2026.

## Recommendation

Replace the exercise-frequency presets with an editable estimate of everyday energy expenditure plus a weekly activity plan. Let users save lifting sessions and 5 km, 7 km, and 10 km runs as reusable templates, then record what they completed. Review the estimate against several weeks of food logs and weight trends.

The immediate answer: using the conventional **7,700 kcal/kg planning approximation**, a goal of losing 0.25 kg/week means **1,925 kcal/week**, or **275 kcal/day**, below estimated maintenance. Multiply kilograms by 7,700 for the weekly amount; **divide by seven** for the daily amount. This is a starting estimate, not a promise of losing exactly 0.25 kg of body fat.

This document contains the requested research followed by a proposed design. The proposed activity fields and UI are not implemented.

## 1. How the calorie calculation works

### Energy expenditure and the current app

Total daily energy expenditure (TDEE) includes resting energy, digestion, and physical activity. Activity includes both workouts and everyday movement such as walking, housework, and work. Counting gym visits alone cannot describe all of these. [National Academies, Dietary Reference Intakes for Energy](https://www.ncbi.nlm.nih.gov/books/NBK591031/).

The app's [`energy()` function](../src/lib/calculations.ts) currently calculates:

```text
resting kcal/day = 10 × weight_kg + 6.25 × height_cm − 5 × age_years + sex_constant
sex_constant    = +5 for male, −161 for female
maintenance     = resting kcal/day × activity multiplier
intake target   = maintenance + goal_kg_per_week × 7,700 / 7
```

The resting equation is Mifflin–St Jeor. Its original study predicted resting energy expenditure; the app calls this value `bmr`. It estimates an individual value rather than measuring it. [Mifflin et al., 1990](https://pubmed.ncbi.nlm.nih.gov/2305711/?dopt=Abstract).

The app's activity multipliers are 1.2, 1.375, 1.55, and 1.725. Its Light description says 1–3 active days/week and Moderate says 3–5, so three sessions fit both labels. Those labels are app heuristics; they are not part of the original Mifflin equation.

For an **illustrative resting expenditure of 1,700 kcal/day**, the existing code gives:

| Setting | Multiplier | Maintenance, kcal/day | Target for −0.25 kg/week, kcal/day |
| --- | ---: | ---: | ---: |
| Sedentary | 1.2 | 2,040 | 1,765 |
| Light | 1.375 | 2,337.5 | 2,062.5 |
| Arithmetic midpoint, currently unavailable | 1.4625 | 2,486.25 | 2,211.25 |
| Moderate | 1.55 | 2,635 | 2,360 |

Light to Moderate changes the target by **297.5 kcal/day**, or **2,082.5 kcal/week**—more than the planned 1,925 kcal weekly deficit. The concern about the presets is justified. However, three lifting sessions do not establish that the midpoint is correct: duration, session intensity, occupation, and movement outside training still matter.

### Weekly deficit, daily deficit, and body fat

```text
planned weekly deficit = 0.25 kg/week × 7,700 kcal/kg = 1,925 kcal/week
average daily deficit  = 1,925 / 7 = 275 kcal/day
```

For an illustrative maintenance of 2,400 kcal/day:

```text
weekly maintenance = 2,400 × 7 = 16,800 kcal
weekly intake plan = 16,800 − 1,925 = 14,875 kcal
daily average      = 14,875 / 7 = 2,125 kcal
```

The 7,700 conversion is the approximate kilogram equivalent of the historical 3,500 kcal/pound rule. Weight change includes fat and lean tissue, and energy expenditure changes as body weight changes. A fixed calorie reduction therefore does not produce a constant rate of loss indefinitely. Hall's dynamic model addresses these effects. [Hall et al., 2011, full paper](https://www.nccor.org/annualreport2013/downloads/Obesity-3.pdf).

**Body fat is not interchangeable with scale weight.** Hall's model assigns stored fat about 39.5 MJ/kg, approximately 9,440 kcal/kg; lean tissue has a different energy density. Neither that number nor 7,700 can guarantee selective fat loss from a prescribed deficit. Keep the UI wording “weekly weight goal,” and avoid reporting calculated “fat burned.” [Hall et al., 2011](https://www.nccor.org/annualreport2013/downloads/Obesity-3.pdf).

Early changes in water and glycogen also affect the energy content of observed weight loss. This makes a short interval on the scale a poor way to verify a precise fat-loss prediction. [Heymsfield et al., Energy Content of Weight Loss](https://pmc.ncbi.nlm.nih.gov/articles/PMC3810417/).

For longer-term goal-date predictions, the [NIDDK Body Weight Planner](https://www.niddk.nih.gov/health-information/weight-management/body-weight-planner) is an established alternative. For this app, retain 7,700 as an explicitly approximate planning conversion and review the estimate as data accumulates.

## 2. A more useful activity model

The sections below are proposed product choices and worked arithmetic, not a clinically validated prediction algorithm.

### Compare the options

| Approach | Benefit | Limitation | Proposed role |
| --- | --- | --- | --- |
| Custom activity multiplier | Immediately removes large preset jumps | Still asks users to guess total activity | Small interim improvement |
| Everyday baseline + weekly workouts | Explains changes in training volume; supports personal templates | Both baseline and workout calories remain estimates | Recommended planning interface |
| Intake + weight-trend calibration | Adjusts the estimate to observed results | Needs consistent logs; sensitive to missing food and water changes | Periodic review after enough data |

A continuous multiplier alone would improve flexibility, but adding decimal places does not establish accuracy. Prefer a directly editable **“Everyday maintenance, excluding workouts”** value in kcal/day. Offer `resting estimate × 1.2` only as an initial suggestion for someone with little everyday movement. A physically active job or substantial walking needs a different baseline. Show the assumptions alongside the suggestion.

### Count additional workout energy once

Distinguish these inputs:

| Input | Meaning | Treatment |
| --- | --- | --- |
| Gross/total workout calories | All energy during the workout, including resting energy | Subtract the energy already covered for that time |
| Active calories above rest | Resting energy has already been removed | Do not subtract rest again; check whether the workout replaced other activity |
| Whole-day total calories | Resting and active expenditure for the entire day | Never add this to an everyday baseline |

For a model-based estimate, the Compendium defines one MET as approximately 1 kcal/kg/hour. Using that convention consistently:

```text
gross workout kcal ≈ MET × weight_kg × duration_hours
extra workout kcal ≈ (workout_MET − displaced_activity_MET) × weight_kg × duration_hours
```

Subtracting 1 MET estimates energy above rest. A workout replacing walking or physical work adds less than that. For a first version, use **above-rest calories as an explicit approximation**, with an editable baseline that is reviewed against outcomes. Do not present this as a complete accounting of displaced activity. [Compendium definitions](https://pacompendium.com/).

Use one source per workout: a template, a MET estimate, or a device/manual entry. An override replaces the estimate. A workout already represented by an overall activity multiplier must not be added again. Likewise, run steps must not generate a second calorie credit through daily step totals.

The 2017 Shcherbina study found substantial energy-expenditure error in the seven wrist devices it tested. That does not establish the error of every current watch, but supports retaining source labels and treating device calories as estimates. [Shcherbina et al., original study](https://pmc.ncbi.nlm.nih.gov/articles/PMC5491979/).

Activity energy also need not translate one-for-one into additional daily expenditure: compensatory changes can occur elsewhere. Careau et al. reported an association consistent with compensation in a large observational dataset. This does **not** justify applying its population average as a fixed personal discount. [Careau et al., 2021](https://pubmed.ncbi.nlm.nih.gov/34453886/).

### Lifting template: kcal/hour × time

Save a personal rate and the convention it uses. For example, an **illustrative user-entered active rate of 250 kcal/hour** produces:

| Duration | Extra kcal/session | Three sessions/week | Daily average contribution |
| --- | ---: | ---: | ---: |
| 45 minutes | 187.5 | 562.5 | 80.4 |
| 60 minutes | 250 | 750 | 107.1 |
| 75 minutes | 312.5 | 937.5 | 133.9 |

These are arithmetic examples, not recommended personal burn rates. Define whether the saved hourly rate describes the whole session including rest between sets. Record duration on the same basis; do not apply a vigorous exercise rate to an hour with extensive downtime.

If no personal estimate is available, the 2024 Adult Compendium lists 3.5 MET for a multi-exercise resistance session and 6.0 MET for vigorous weight training. Using the 3.5 MET entry for an illustrative 80 kg adult over one hour gives 280 gross kcal and 200 kcal above rest. The 6.0 MET entry would give 480 gross and 400 above rest; it represents a different activity description, not an uncertainty interval. [Compendium conditioning activities](https://pacompendium.com/conditioning-exercise/).

The Adult Compendium is intended for ages 19–59; the app currently accepts a broader age range. Any implementation offering MET defaults should use an appropriate source for the person's age and circumstances rather than silently extrapolating. [2024 Adult Compendium publication](https://pmc.ncbi.nlm.nih.gov/articles/PMC10818145/).

### Running templates: 5 km, 7 km, and 10 km

Provide three editable shortcuts plus a custom distance. Each template can save usual duration and estimated active calories for the run. Actual duration and a per-session calorie override remain editable. Changing distance should prompt a fresh estimate rather than reuse a fixed 5 km calorie value.

For a reproducible model example, assume an **80 kg adult running at 10 km/hour**. The Compendium's 6–6.3 mph entry is 9.3 MET, which includes this speed. [Compendium running activities](https://pacompendium.com/running/).

| Run | Time at 10 km/hour | Gross kcal, `9.3 × 80 × hours` | Above-rest kcal, `8.3 × 80 × hours` |
| --- | ---: | ---: | ---: |
| 5 km | 30 minutes | 372 | 332 |
| 7 km | 42 minutes | 520.8 | 464.8 |
| 10 km | 60 minutes | 744 | 664 |

These estimates assume the stated pace and activity description. Hills, terrain, and individual differences limit their accuracy. Preserve the entered source and calculation assumptions. Recalculate future MET estimates when weight changes; preserve the weight and estimate used for historical sessions.

### Weekly calculation and worked example

```text
B = everyday maintenance excluding workouts, kcal/day
E = sum of estimated extra workout calories for the week
g = signed weekly weight goal, kg/week (negative means loss)

estimated weekly expenditure = 7 × B + E
planned weekly intake        = 7 × B + E + g × 7,700
average daily intake target   = B + E / 7 + g × 7,700 / 7
```

For **B = 2,040**, three one-hour lifting sessions at the illustrative active rate of 250 kcal/hour, and one 5 km run at the estimate above:

| Component | kcal/week |
| --- | ---: |
| Everyday expenditure | 14,280 |
| Lifting | 750 |
| Running | 332 |
| Estimated total expenditure | 15,362 |
| Planned deficit for −0.25 kg/week | 1,925 |
| Planned intake | 13,437 |

The resulting daily average is **1,919.6 kcal**, displayed as approximately **1,920 kcal/day**. Keep full precision internally. The differing result from the preset table comes from explicitly chosen baseline and session assumptions; it is not evidence that this is the user's true maintenance.

Default to a steady daily target based on the planned week. On completion, replace a planned workout with its completed version; do not sum both. A skipped session contributes zero. Offer a deliberate plan revision when the schedule changes, and show the revised weekly estimate without silently rewriting past daily targets.

A completed-week review uses completed workouts. During the week, show completed activity separately from the forecast. An unlogged day is unknown until the user confirms rest or completes the log. Never treat missing food as zero when calculating a deficit.

## 3. Proposed UI

Keep these controls inside Nutrition, alongside “Your plan.” These sketches use the worked example, not personal measurements.

```text
YOUR PLAN
About 1,920 kcal/day       Weekly weight goal: −0.25 kg
Everyday maintenance      [2,040] kcal/day   [Edit assumptions]
Planned workouts          +1,082 kcal/week
Planned deficit            1,925 kcal/week
                          [Cancel] [Save plan]

ACTIVITY TEMPLATES
Lifting    [250] kcal/hour    [Active above rest ▾]
           Usual duration [60] min, including rests
Run 5 km   [332] active kcal  [30] min
Run 7 km   [465] active kcal  [42] min
Run 10 km  [664] active kcal  [60] min
           [Add custom activity]

THIS WEEK                       [Previous] [Next]
Mon  Lifting   60 min   ~250 kcal   Completed  [Edit]
Wed  Lifting   60 min   ~250 kcal   Completed  [Edit]
Fri  Lifting   60 min   ~250 kcal   Planned    [Complete]
Sun  Run 5 km  30 min   ~332 kcal   Planned    [Complete]
Completed: ~500 kcal   Forecast: ~1,082 kcal
Estimated extra activity above rest
           [Add session] [Copy last week's plan]
```

Copying a prior week creates planned entries, never automatically completed sessions. Saving or editing a template affects future entries; existing sessions retain their saved values unless explicitly edited.

For the weekly review, show daily intake bars, a saved target line, and a separate small activity chart with completed bars and outlined planned bars. Label all values and provide a table so color is not the only distinction. The summary should expose its arithmetic:

```text
WEEK REVIEW — all seven food and activity days confirmed
Estimated expenditure       15,362 kcal
Logged intake               13,437 kcal
Estimated deficit            1,925 kcal
Planned deficit              1,925 kcal
Weight trend                 Review over several weeks
```

For an incomplete week, replace the full-week deficit with a clearly dated partial summary and a separate forecast. Do not display a percentage “fat-loss achieved” based on the calorie ledger.

## 4. Review the estimate against actual results

Proposal: use a rolling **28-day review**, consistent food logging, and several comparable weigh-ins each week. Show a seven-day average for readability and estimate the slope from dated measurements over the review window. The 28-day window is a product heuristic, not a universal biological threshold. Delay suggestions when logs are incomplete or the trend is unstable.

A simple short-window calibration, using the same approximate conversion, is:

```text
s = signed weight trend in kg/day
estimated total maintenance = average logged intake − 7,700 × s
estimated everyday baseline = estimated total maintenance − average logged extra activity/day
```

For an illustrative intake of 2,200 kcal/day and a trend of −0.20 kg/week:

```text
estimated total maintenance = 2,200 − 7,700 × (−0.20 / 7) = 2,420 kcal/day
if extra activity averages 150 kcal/day:
estimated everyday baseline = 2,420 − 150 = 2,270 kcal/day
```

Subtracting average activity is essential: setting the baseline to 2,420 and then adding workouts again would double count them. This is an inference from energy balance, not a direct measurement. It cannot distinguish food under-reporting from metabolic or workout-estimation error.

Present a suggested baseline with the underlying dates and data coverage, and let the user apply it to future plans. Avoid automatic target changes after one weigh-in. Keep the existing menstrual-cycle overlay available as context when reviewing weight trends; do not apply a fixed cycle-related weight correction.

## 5. Implementation outline for a later feature

1. **Planning mode:** retain existing accounts on their current calculation until they choose the new mode. Add everyday baseline and effective-date plan records. Never reinterpret a saved 1.55 multiplier as a baseline excluding workouts.
2. **Templates:** name, activity kind, usual minutes/distance, calculation method, calorie convention, source, and either an hourly rate, fixed session calories, or a Compendium code/MET value.
3. **Sessions:** account, local date, planned/completed/skipped status, actual duration/distance, source inputs, weight used, normalized extra kcal, and calculation version. Permit multiple sessions per day. A completion updates its planned record.
4. **Weekly review:** Monday–Sunday boundaries using local dates, food/activity completeness, completed totals, forecast totals, and the plan that was effective at the time. Separate missing activity from confirmed rest.
5. **Persistence:** add Supabase migrations and ownership policies; extend IndexedDB records, offline queue, synchronization, deletion handling, and account isolation. Relevant starting points are [`types.ts`](../src/lib/types.ts), [`repository.ts`](../src/lib/repository.ts), and [`Nutrition.tsx`](../src/components/Nutrition.tsx).
6. **Historical targets:** the current calorie chart compares all entries with the current target. Add dated target snapshots for the new review so a plan change does not rewrite historical comparisons. Reuse current protein/fat settings and carbohydrate validation when deriving macros from a new calorie target.

If implementing only the interim custom multiplier, update the TypeScript union, profile validation, UI, and database constraint together. The original [`profiles.activity` constraint](../supabase/migrations/202610130001_fit_log.sql) currently accepts only the four preset values; use a new migration.

Acceptance checks for implementation should cover the 275 kcal/day example, minute/hour conversion, gross versus active handling, preventing duplicate workout credits, planned-to-completed replacement, multiple sessions per date, missing versus zero logs, historical stability after template/weight edits, and offline synchronization with account isolation. The research deliverable itself requires arithmetic, links, and document review rather than application tests.
