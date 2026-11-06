# AfterGlow Repository Audit

**Audit date:** 2026-11-05  
**Branch:** `cleanup/production-framework-and-audit`  
**Scope:** framework/runtime consistency, fabricated event data, and audit documentation

## Executive summary

The repository is currently mixed-framework. `package.json` runs Express with Vite (`tsx server.ts`, `vite build`), while the repository also contains a Next.js App Router implementation (`app/page.tsx` and `app/api/*`) and `next.config.ts`. The README describes Next.js, but the package scripts and declared dependencies do not currently make Next.js the runnable production framework.

**Recommended production framework: Next.js.** The App Router implementation is the better canonical target because it already contains event search and API routes. However, this audit does not silently switch runtime scripts or delete the legacy app: the current package manifest does not declare Next.js, and the full import/dependency/build impact has not been validated. Framework consolidation must be completed as a separate, verified migration.

## Verified findings

### Framework mismatch

- `package.json` scripts: `dev` and `start` execute `tsx server.ts`; `build` executes `tsc && vite build`.
- `package.json` declares Express, Vite, and Vite React tooling, but does not declare Next.js.
- `README.md` claims the app is built with Next.js and describes Next.js 16 requirements. This conflicts with the package manifest.
- `app/page.tsx` imports `searchEvents` from `lib/partners` and implements an App Router home page. This proves a Next.js code path exists, not that it is currently the production entry point.

### Fabricated legacy event output

`server.ts` transforms Ticketmaster data but fills missing provider values with invented values and constructs unsupported marketplace data. Examples include:

- default price range `{ min: 45, max: 180 }` and fallback minimum prices;
- calculated Ticketmaster fees and totals not supplied by the provider;
- hardcoded SeatGeek and DICE prices, fees, counts, deal labels, and stock;
- fixed reliability scores, ratings, and default event doors/time/date values;
- randomized review counts using `Math.random()`;
- generated lineup and descriptive text.

These values are not source-backed marketplace availability and must not be exposed as real listings. `server.ts` is a legacy Express/Vite path and should be retired only after the Next.js runtime migration preserves any still-required endpoints.

### Provider integrations

The active Next.js event search in `app/page.tsx` delegates to `lib/partners`. The current partner module is Ticketmaster-backed. Google Places, PassKit, and flight integrations are described in repository code/docs as templates or inactive integrations; they should not be described as live unless implementation and credentials are verified.

### Demo fixture data

`src/data/mockEvents.ts` contains hand-authored event examples with dates, performers, descriptions, ratings, review counts, price tiers, availability counts, and competitor marketplace comparisons. These are demo fixtures, not provider records. Remove them from the production path and label any retained fixtures unmistakably as demo data.

## Documentation corrections

- This report is the canonical current audit; older audit/review documents should be treated as historical unless revalidated.
- README claims about Next.js runtime and commands need to match the actual package scripts after framework consolidation.
- Keep milestone changelogs as historical records. Do not use them as proof that current main-branch code passes validation.
- Setup documentation should list only verified active integrations and actual environment variables.

## Safe remediation sequence

1. Inventory every route and behavior in the Next.js App Router and legacy Express/Vite server.
2. Confirm the Next.js version/dependencies and lockfile state; add or change dependencies only with explicit approval because the existing manifest lacks Next.js.
3. Move required legacy endpoint behavior into canonical Next.js routes, without fabricated prices, fees, ratings, inventory, or competitor comparisons.
4. Replace production mock imports with provider-backed results or explicit empty/error states. Keep demo fixtures isolated and clearly labeled if needed for UI development.
5. Remove legacy Vite/Express files and obsolete mock data only after import/reference checks show they are unused.
6. Consolidate stale audit documents and update README/setup docs to the actual runtime.
7. Run dependency installation, typecheck, lint, build, and API smoke tests locally. GitHub file editing alone cannot establish these checks.

## Validation status

- Source inspection: completed for `package.json`, `README.md`, `server.ts`, `app/page.tsx`, and `src/data/mockEvents.ts`.
- Local install/typecheck/build/API smoke tests: **not run**; no local checkout/runtime was available through the GitHub connector.
- Framework migration: **not performed** in this audit because Next.js is not declared in the current package manifest and the full route/dependency migration has not been validated.
- Fabricated legacy server data: identified; do not use as production output.
- Documentation consolidation: this report establishes the canonical audit. Individual historical documents should be removed only after their contents and references are checked.

## Evidence paths

- `package.json`
- `README.md`
- `server.ts`
- `app/page.tsx`
- `src/data/mockEvents.ts`
- `lib/partners/index.ts`
- `lib/partners/ticketmaster.ts`
- `next.config.ts
