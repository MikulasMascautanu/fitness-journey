# Bugs found by me

## YOUR STARTING POINT page - clicking height arrows sets height to 100

TBD - very minor bug, ignore for now.

# Improvements

1. [x] In Nutrition page, the Protein and Fat presets are nice, but I need more precise adjusting. For protein I want to be able to change decimals, e.g. 1.8 to 2.5, and for Fats I want to be able to change percentages from 15% to 30%.

2. [x] Rename the app to "Fitness Journey" throughout the UI, package metadata, and documentation. Retain original storage identifiers and migration history for compatibility.

3. [x] Add a cancel button to the "Your plan" section that resets to saved targets. Also make the Your plan text bigger, as big as Daily Calories

4. [x] Refactor the "Your plan" card so that it's expanded by default. Move the live preview of kcal and macros to the top and make it bigger. The weekly goal mini cards' content need to be on 2 lines.

5. I don't like the Activity level presets, they're too far apart, they shoudl be more flexible to one's real activities. E.g. if I do 3 weight training sessions a week, I'm exactky between Light and Moderate, while the calories of each presets differ greatly.

# Features

1. [x] For females, implement a menstrual cycle logging at the bottom of Body page (needs updates in db schema). The body weight chart will have a toggle to enable cycles to be reflected in there as a colored background. This is to give perspective about how weight changes with the cycle.
