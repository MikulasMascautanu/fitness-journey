# Bugs found by me

## YOUR STARTING POINT page - clicking height arrows sets height to 100

TBD - very minor bug, ignore for now.

# Improvements

1. [x] In Nutrition page, the Protein and Fat presets are nice, but I need more precise adjusting. For protein I want to be able to change decimals, e.g. 1.8 to 2.5, and for Fats I want to be able to change percentages from 15% to 30%.

2. [x] Rename the app to "Fitness Journey" throughout the UI, package metadata, and documentation. Retain original storage identifiers and migration history for compatibility.

3. [x] Add a cancel button to the "Your plan" section that resets to saved targets. Also make the Your plan text bigger, as big as Daily Calories

4. [x] Refactor the "Your plan" card so that it's expanded by default. Move the live preview of kcal and macros to the top and make it bigger. The weekly goal mini cards' content need to be on 2 lines.

5. [x] I don't like the Activity level presets, they're too far apart, they shoudl be more flexible to one's real activities. E.g. if I do 3 weight training sessions a week, I'm exactky between Light and Moderate, while the calories of each presets differ greatly, affecting my progress. Firstly, research how this calorie count really works, I heard it's something like if I want to lose 0.25kg body fat a week, I need to have 0.25\*some_number\*7days calorie deficit in that week. Write this in a md file. Secondly, maybe there's a better way to track this in general. E.g. we coudl add new fields for activities - my average lifting session burnt kcal per hour + how long the session was, and also my burnt kcal for 5km, 7km and 10km runs. Then I would just fill out these for each week to see what really I do burn. Append this to the same md file. Use UI examples/graphs if suitable.

   Research and proposal: [Flexible activity and calorie planning](docs/activity-calorie-research.md). Includes calculations, sources, activity templates, and UI examples; feature implementation remains proposed.

6. [x] Remake the current caliper body fat caluclations to be the "Durnin–Womersley 4-Site Skinfold Method". The resulting percentage should be taken from the corresponding male/female tables (research and find them). It needs to automatically decide what age to pick based on current profile, and show the user a hint that the percentage was calculated based on for example "age 20-29, measured 50mm in total" or something similar so its transparent. There should also be a link to the tables in the hint, leading to a statically served file/path.

   Uses the original 1974 Table 9 percentages with sex and age on the entry date. [Static reference tables](public/reference/durnin-womersley.html) include source links and interpolation rules. Apply the four-site and cleanup migrations (`202610220001`, `202610220002`) before deploying. The database cleanup deletes three-site caliper data while retaining weight and circumference history. The one-time browser cleanup has been retired.

# Features

1. [x] For females, implement a menstrual cycle logging at the bottom of Body page (needs updates in db schema). The body weight chart will have a toggle to enable cycles to be reflected in there as a colored background. This is to give perspective about how weight changes with the cycle.

2. I want to have a way to set portion sizes for registered users (could be its own tab, does not matter) for meat (raw grams) and carbs (raw grams). Users will be able to set their own, not for others, and they will appear in the list. This is something that will be used/referenced in an upcoming recipes/cookbook tab (dont implement this yet) where the recipes' ingredients will change live based on picked number of portions of picked user.

3. Implement a new tab called "Recipes" for gathering of different cooking recipes, like a cookbook of either full recipes, or just drafts that I wrote when creating a new recipe on the spot. There will be labels/categories for these so we know which need human input to finish up. In the future, we will add more labels like "sweet", "vegetarian", and so on, so keep that in mind. These labels will be listed as buttons at the top, when clicked the list will be filtered accordingly. When submitting a new recipe, we can upload a photo (from phone), title, add labels, add ingredients as one "line" for each, instructions, time needed to cook (total, no separate prep vs cooking times), and any other fields you think are needed - suggest if some are needed and ask me to confirm them explicitly.
