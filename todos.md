# Bugs found by me

## YOUR STARTING POINT page - clicking height arrows sets height to 100

TBD - very minor bug, ignore for now.

# Improvements

1. [x] In Nutrition page, the Protein and Fat presets are nice, but I need more precise adjusting. For protein I want to be able to change decimals, e.g. 1.8 to 2.5, and for Fats I want to be able to change percentages from 15% to 30%.

2. [x] Rename the app to "Fitness Journey" throughout the UI, package metadata, and documentation. Retain original storage identifiers and migration history for compatibility.

3. [x] Add a cancel button to the "Your plan" section that resets to saved targets. Also make the Your plan text bigger, as big as Daily Calories

4. [x] Refactor the "Your plan" card so that it's expanded by default. Move the live preview of kcal and macros to the top and make it bigger. The weekly goal mini cards' content need to be on 2 lines.

5. I don't like the Activity level presets, they're too far apart, they shoudl be more flexible to one's real activities. E.g. if I do 3 weight training sessions a week, I'm exactky between Light and Moderate, while the calories of each presets differ greatly, affecting my progress. Firstly, research how this calorie count really works, I heard it's something like if I want to lose 0.25kg body fat a week, I need to have 0.25\*some_number\*7days calorie deficit in that week. Write this in a md file. Secondly, maybe there's a better way to track this in general. E.g. we coudl add new fields for activities - my average lifting session burnt kcal per hour + how long the session was, and also my burnt kcal for 5km, 7km and 10km runs. Then I would just fill out these for each week to see what really I do burn. Append this to the same md file. Use UI examples/graphs if suitable.

# Features

1. [x] For females, implement a menstrual cycle logging at the bottom of Body page (needs updates in db schema). The body weight chart will have a toggle to enable cycles to be reflected in there as a colored background. This is to give perspective about how weight changes with the cycle.
