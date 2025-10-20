# Repository Guidelines

## Project Structure & Module Organization
Halo Lead Gen is a Next.js 15 app rooted in `app/`. Route groups like `app/(authenticated)` and `app/(marketing)` isolate dashboards and public flows while `app/c` holds the QR landing pages. API endpoints live in `app/api`. Shared UI lives under `components/`, while cross-cutting logic (auth, geocoding, Firebase, mailer) is in `lib/`. SQLite schema, seeds, and reset scripts are in `database/`. Static assets (logos, photo decks) sit in `public/` and marketing references in `public/campaign-hero-photos`. Keep experimental assets inside `misc/`.

## Build, Test, and Development Commands
- `npm run dev` — launch Next dev server at `http://localhost:3000`.
- `npm run build` / `npm run start` — compile production bundle, then run it.
- `npm run lint` — run the Next + ESLint config; fix actionable warnings before merging.
- `npm run db:init` — create `database/halo.db` from `schema.sql`.
- `npm run db:seed` / `npm run db:reset` — populate or rebuild the local DB (reset drops the file).
- `npm run seed:firestore` — load Firebase seed data for previewing remote flows.

## Coding Style & Naming Conventions
Write TypeScript-first React components. Use PascalCase for components (`components/LeadForm.tsx`), camelCase for helpers, and uppercase snake case for constants in `lib/constants`. Layout files live in route segments (`page.tsx`, `layout.tsx`) with 2-space indentation. Prefer Tailwind utility classes defined in `app/globals.css`; only add component-scoped styles when utilities fall short. Run `npm run lint -- --fix` before opening a PR.

## Testing Guidelines
The project does not include a Jest or Playwright harness yet; rely on linting, type safety, and targeted manual QA. Exercise the QR landing flow by running `npm run dev`, visiting `/c/[campaign-slug]`, and submitting the lead form. When touching SQLite or Firebase code, rebuild the local DB (`npm run db:reset`) and confirm seeds load without errors. Document any new manual test steps in the PR description.

## Commit & Pull Request Guidelines
Follow the existing imperative commit style (`Add campaign filter`, `Refactor lead details modal`). Squash small commits before review. Each PR should describe the problem, the solution, and the test evidence; attach screenshots or screen recordings for UI changes. Link backlog tickets where applicable and call out impacts to seeds or environment variables. Ensure lint passes and databases are seeded before requesting review.

## Security & Configuration Tips
Keep secrets in `.env.local`; never commit keys for Firebase, SendGrid, or Google Maps. Generated artifacts such as `database/halo.db` and `.next/` stay out of version control. Review `firestore.rules` and `storage.rules` when introducing new collections or buckets.
