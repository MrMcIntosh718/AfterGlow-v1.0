# AfterGlow Repository Cleanup & Review

Date: 2026-11-05
Scope: Uploaded ZIP only; no GitHub remote access or live repository push was performed.

## Safe cleanup applied
- Removed `components/.vs/` Visual Studio workspace state, Copilot session/index databases, and local UI state.
- Removed `lib/itinerary.ts.tmp` (temporary duplicate of `lib/itinerary.ts`).
- Removed `tsconfig.tsbuildinfo` (generated TypeScript build cache).
- Removed `.env.local` from the cleaned archive. It contained credentials/tokens; rotate the values because the uploaded archive included them.
- Preserved `.env.example`, source files, lockfile, and existing project documentation.

## Important architecture findings (not silently rewritten)
1. **Two app stacks are mixed together.** `package.json` runs Vite and `tsconfig.json` only includes `src/`; meanwhile `app/` and `lib/` contain a Next.js App Router implementation and API routes. The active Vite build does not compile or serve those Next route files. Decide which app is canonical before deleting either tree or changing build scripts.
2. **Documentation contradicts package scripts.** README describes Next.js, `npm run typecheck`, and `npm start`, but the supplied `package.json` currently has Vite scripts `dev`, `build`, and `lint`; `typecheck` and `start` are absent.
3. **`.env.local` was included in the upload.** `.gitignore` excludes it, but archive inclusion means values should be considered exposed. Rotate Ticketmaster, Mapbox, PassKit, and affiliate credentials as applicable. Keep only placeholders in shared archives.
4. **Dependency installation timed out** in this environment, so I could not run the Vite build or TypeScript checks. No claim that source errors are fixed or that the app builds successfully.
5. **No verified duplicate source files beyond `lib/itinerary.ts.tmp` were removed.** `src/` and `app/` look like separate implementations, not safely interchangeable duplicates.

## Recommended next decision
Choose one:
- **Next.js canonical:** migrate package scripts/dependencies and TypeScript config to Next, validate `app/` + `lib/`, then decide whether `src/` is a legacy app to archive/remove.
- **Vite canonical:** keep `src/` as the app and identify whether `app/` + `lib/` is an abandoned Next implementation before removing it. Do not delete it based on filenames alone.

## Validation
- ZIP extraction and file inventory: completed.
- Safe cleanup: completed.
- `npm install`: timed out.
- TypeScript / production build: not run because dependencies were not installed.
- GitHub push: not performed.
