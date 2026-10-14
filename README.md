# Fit Log

A desktop-first fitness journal with Body and Nutrition routes, responsive phone input, Google accounts, and offline entry. Built with React, TypeScript, Vite, Supabase, IndexedDB, and lightweight SVG charts.

## Run locally

Requires Node.js 22.12+ (tested on Node.js 24).

```sh
npm ci
npm run dev
```

Open the printed local URL. **Explore the demo** works without a backend. It contains sample entries and persists changes in this browser; it does not create an account or sync to the cloud. Leave the demo to return to sign-in. Clearing this site's browser storage resets the demo and also removes any locally cached real-account records and unsynced changes.

## Configure real accounts

1. Create a [Supabase project](https://supabase.com/dashboard). In its SQL editor, run [`supabase/migrations/202610130001_fit_log.sql`](supabase/migrations/202610130001_fit_log.sql). This creates profiles, body entries, and food days, with ownership policies and one entry per account/date. Then run [`supabase/migrations/202610150001_precise_macro_targets.sql`](supabase/migrations/202610150001_precise_macro_targets.sql) to enable custom protein and fat targets. For an existing installation, run only the new migration. Alternatively apply all pending migrations through the Supabase CLI.
2. Copy `.env.example` to `.env.local`. Set `VITE_SUPABASE_URL` to the project URL and `VITE_SUPABASE_PUBLISHABLE_KEY` to the project's publishable key (a legacy anon key also works). Both are public browser configuration; access control is enforced by database row-level security. **Never put a service-role key or an OAuth client secret in a `VITE_` variable.**
3. Follow [Supabase's Google provider setup](https://supabase.com/docs/guides/auth/social-login/auth-google). Create a Google web OAuth client. Add the Supabase callback URL shown in its Authentication → Sign In / Providers → Google settings to Google's authorized redirect URIs. Store the Google client ID and secret in Supabase's Google provider configuration and enable the provider.
4. In Supabase Authentication → URL Configuration, set the production Site URL when available. Allow `http://localhost:5173`, `http://127.0.0.1:5173`, and the exact production origin as redirect URLs. Add `http://127.0.0.1:4173` only if you need to verify real sign-in in the production preview.
5. Restart Vite after changing environment variables. Choose **Continue with Google**, then enter sex, birthdate, and height. A real account starts with no tracking entries. Log a weight to enable calorie targets.

No Supabase project or Google OAuth credentials are included in the repository. Real Google sign-in and database policy verification require the above setup.

## Build and check

```sh
npm test                 # calculation and persistence tests
npm run build            # TypeScript and production build, including PWA
npm run preview          # serve the production build locally
npx playwright install chromium   # once, if Chromium isn't already available
npm run test:e2e          # browser tests against the production build
```

Browser tests cover desktop and phone layouts, both themes, Body logging and overwrite, female caliper labels, nutrition settings/logging, reload persistence, sign-out, offline navigation/entry, concurrent saves from two tabs, and manifest assets. Run `npm run build` before browser tests after source changes. Playwright starts and stops its own preview server on port 4173. Screenshots and failure traces are written to ignored `test-results/`. To use an existing Chromium installation, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE` to its executable path.

The browser tests use the explicitly labeled local demo. To check the backend after setup, sign in with two Google accounts and verify that each starts with its own profile and records; confirm via the Supabase API that one account cannot select or insert another account's rows. Also verify offline saves sync after reconnecting and that pending changes stay with their account when switching users.

## Storage and offline behavior

- Protein targets accept 0.1–5 g/kg in 0.1 increments; fat targets accept 15–30% in 1% increments. The original presets remain available as shortcuts.
- Profiles store birthdate, sex used by the equations, height, activity, and macro/weekly-goal settings.
- Body entries store weight, optional measurements, optional complete three-site calipers, and the calculated body-fat estimate. Age is calculated on the entry date. Changing a profile later does not recalculate saved body-fat history.
- Nutrition uses the latest dated weight and current profile. History differences and the dashed calorie target line use the **current** target. Macros are rounded for display only.
- Dates are local calendar dates, never converted from a UTC timestamp. The database permits a one-day timezone margin; the form rejects dates after local today.
- IndexedDB stores each account's records and a durable pending-write queue. Writes update the visible app only after local storage succeeds. Repeated saves of a date replace that entry. Failed uploads remain queued and retry on reconnection, focus, every 30 seconds while pending, or **Retry**.
- The queue prioritizes the profile before dependent entries. An edit made while an older save uploads remains pending until that newer revision is acknowledged. The server uses last-received-save behavior for the same account/date; it does not merge fields across devices.
- Sign-out hides account data and stops further queued uploads. Local records and pending saves remain on this device and are loaded only when that account signs in again. The sidebar shows pending changes before sign-out. Returning to an account after sign-out requires online authentication; an already signed-in account with cached data can log offline. An expired session may need online reauthentication to reopen the app or sync.
- The service worker caches the application shell and its assets, not Supabase API responses. First sign-in and initial account loading need a connection. Offline saves sync while the app is open; OS background synchronization is not required.

The estimates use the formulas in `goal.md`, with validation for adults aged 18–120. They are estimates rather than measured metabolism/body composition. No food database, workouts, or social features are included.

## Install and deploy

Deploy `dist/` to a static host over HTTPS. Configure the host to serve `index.html` for application routes such as `/nutrition` and `/account`; otherwise direct navigation will return 404 before the service worker is installed. Build with the public Supabase environment variables set and allow the deployed origin in Supabase's redirect settings. The build assumes the app lives at the domain root.

The production build creates `manifest.webmanifest`, `sw.js`, and install icons. Chromium browsers offer an **Install** prompt when supported; Safari users can use Share → Add to Home Screen. Service workers require HTTPS or localhost. New versions show a reload prompt so an update does not silently discard an unfinished form.

No site has been published. Regenerate the code-drawn icons with `npm run icons` if changing the branding.

See [`goal.md`](goal.md) for the brief and [`docs/implementation-plan.md`](docs/implementation-plan.md) for the approved approach.
