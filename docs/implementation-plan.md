# Fit Log implementation plan

Status: defaults approved. Include Supabase setup instructions; no backend project exists yet.

Implementation is complete for local review. Production build, 27 unit tests, and 14 desktop/mobile browser checks pass. Real Google OAuth and hosted row-level security remain unverified until a Supabase project is configured. See `README.md` for setup and `goal.md` for the verification checklist.

## Proposed defaults

- React + TypeScript + Vite for the web app, built in this repository.
- Supabase Auth with Google sign-in and Postgres with row-level security for per-account storage.
- Handwritten SVG charts for body trends and the fourteen-day calorie chart.
- A web manifest and service worker, generated with `vite-plugin-pwa`, for installation and cached application assets. IndexedDB stores account-scoped records and pending offline changes.
- Vitest for calculation and persistence tests. Production build and type checking run at each implementation milestone.

Google authentication needs a configured Supabase project and Google OAuth provider. Include SQL migrations, an environment-variable template, and setup instructions; actual sign-in verification requires that configuration. Never place a service-role key or Google client secret in browser code.

## Data and behavior

- Store birthdate and derive age using calendar dates. Keep entry dates as local `YYYY-MM-DD` strings to avoid UTC date shifts.
- A profile belongs to its authenticated user. Body and nutrition records use `(account_id, date)` uniqueness; saving an existing date updates that record. Database policies enforce account ownership on reads and writes.
- Calculate body fat only with all three valid skinfold readings and a complete profile. Save the calculated percentage with the entry so later birthdays do not change historical results. Use age on the measurement date for backdated entries.
- Nutrition targets use the latest dated body weight and the current profile. Display a clear missing-profile or missing-weight state instead of inventing data. Reject a macro configuration that leaves negative carbohydrate calories.
- Use the current target for the nutrition chart and history differences, labeled accordingly. Render the last fourteen calendar days, including gaps where nothing was logged.
- Cache records and offline writes under the authenticated account ID. Keep pending writes across reloads, retry when the application reconnects, and show whether changes are local or synced. The server applies the last successfully received save for a date.
- Do not cache authenticated API responses in the service worker. Clear displayed account data immediately on sign-out. Pending changes must never be submitted under another account; make pending-save status visible before signing out.
- First sign-in requires a network connection. Offline entry is available after authentication and initial application loading; an expired session may require sign-in before pending writes can sync.

## Coherent implementation commits

1. Scaffold React, TypeScript, Vite, test tooling, and the responsive navigation shell.
2. Add account profiles, Google authentication, database migrations/policies, and account-scoped persistence.
3. Implement and test Jackson–Pollock/Siri and Mifflin–St Jeor, target, and macro calculations.
4. Build the Body summary, entry form, live caliper preview, metric chart, and history.
5. Build Nutrition settings, targets, goal percentages, daily logging, chart, and history.
6. Add install assets, offline application loading, pending-write synchronization, and persistence tests.
7. Complete responsive/accessibility checks and setup documentation; update the definition of done only where verified.

Keep each commit buildable and its applicable tests passing. Commit locally in reasonable chunks as requested; deployment is not part of the proposed defaults.

## Verification

- Test both sex-specific equations against independently calculated expected values, birthdays and date boundaries, missing/invalid input, each activity multiplier and goal preset, and macro calorie totals.
- Verify date overwrite behavior, ownership constraints, offline queue reload/retry, and account changes during pending synchronization.
- Check empty states, form errors, keyboard access, light/dark appearance, narrow-screen navigation, and desktop layout.
- Build production assets and check the manifest and service-worker output. Verify offline loading and installability in a browser where available.
- Once a backend is configured, verify real Google sign-in/out and isolation between two accounts. Report any unavailable external verification explicitly.

## References checked

- [Vite getting started](https://vite.dev/guide/): the installed Node.js 24 runtime satisfies the documented runtime requirement.
- [Supabase Google sign-in](https://supabase.com/docs/guides/auth/social-login/auth-google): provider setup and redirect configuration.
- [Supabase Auth](https://supabase.com/docs/guides/auth): authentication and database row-level authorization.
- [Vite PWA service-worker registration](https://vite-pwa-org.netlify.app/guide/register-service-worker): generated service-worker registration.

The linked Claude prototype could not be accessed through the browsing tool. The wireframe and written requirements in `goal.md` remain the available UI reference.
