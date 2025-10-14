# Halo MVP – Sprint 1 User Summary

**Sprint:** Sprint 1 - Foundation & Setup
**Period:** 2025-10-13 to 2025-10-13
**Written By:** GPT5 (Project Manager)
**Date:** 2025-10-13

---

## Sprint Overview

**Goal:** Establish Halo’s technical foundation with a running app skeleton, documented stack, and working database.

**Status:** Ahead

---

## What Got Done

### Completed Features
1. **Project Scaffolding & Tooling**
   - **What it does:** Sets up the Next.js app with TypeScript, TailwindCSS, linting scripts, and environment templates so future work starts from a clean baseline.
   - **Why it matters:** Gives Claude a dependable workspace and keeps future sprints focused on features instead of plumbing.
   - **Status:** Complete and tested

2. **Database Schema & Seed Pipeline**
   - **What it does:** Introduces the campaigns/leads/photos schema, automated migrations, and seed data plus smoke-test queries.
   - **Why it matters:** Ensures landing pages and lead flows have reliable data to draw from in Sprint 2 and beyond.
   - **Status:** Complete and tested

### Technical Progress
- **Backend/Database:** Implemented SQLite schema with seeding and validation scripts, plus helper utilities for slug generation and future PostgreSQL migration.
- **Frontend/UI:** Delivered a working Next.js shell with Tailwind styling and a status indicator that the foundation is ready.
- **Integration:** Verified app boots locally against the seeded database; scripts confirm tables, relationships, and sample data are in place.

---

## What's Working

### Wins This Sprint
- Finished all foundation work in ~2 hours versus the 8–12 hour estimate.
- Automated seeding and query tests provide quick confidence checks for future data changes.
- Decision log and README offer clear documentation for onboarding or audits.

### Demo-Ready Items
The following are ready to show or test:
- [x] Local dev environment (`npm run dev`) displaying Sprint 1 readiness banner.
- [x] Database tooling (`npm run db:seed`, `npx tsx database/test-queries.ts`) proving schema, seed data, and joins.

---

## What Needs Attention

### Outstanding Work
1. **Landing Page Experience**
   - **Current status:** Not started
   - **What's left:** Build responsive gallery, campaign data loading, and homeowner lead form.
   - **Expected completion:** Sprint 2

2. **Contractor Campaign Setup**
   - **Current status:** Not started
   - **What's left:** Form flow, multi-photo upload, QR generation, confirmation screens.
   - **Expected completion:** Sprint 3

### Issues or Blockers
- **Placeholder assets:** Photo paths referenced in the seed data do not yet point to real images.
  - **Impact:** Low – only affects visual polish during Sprint 2 demos.
  - **Plan:** Add representative images while building the landing gallery.

---

## Technical Context (Moderate Detail)

### How It Works
The app now runs on Next.js 15 with TypeScript, giving us a single codebase for both pages and API routes. TailwindCSS powers styling so Claude can move quickly on responsive layouts next sprint. On the data side, a SQLite database (via the `better-sqlite3` driver) stores contractors, campaigns, leads, and photos; initialization scripts bootstrap the schema, seed sample records, and verify relationships. Because Next.js can call server-side utilities directly, landing pages will soon pull campaign content straight from this database without extra middleware, and later we can swap SQLite for PostgreSQL by reusing the shared abstraction layer in `lib/db.ts`.

### Key Technical Decisions
1. **Framework Choice**
   - **What we chose:** Next.js 15 with TypeScript and TailwindCSS.
   - **Why:** Combines frontend + backend in one stack, accelerates development, and keeps deployment simple on Vercel.
   - **Trade-off:** Slightly higher learning curve than static pages, but the productivity gains are worth it.

2. **Database Strategy**
   - **What we chose:** SQLite for development with a path to PostgreSQL in production.
   - **Why:** SQLite needs zero setup for rapid iteration, while the schema stays portable for future scaling.
   - **Trade-off:** We’ll need migration tooling when promoting to PostgreSQL, but abstraction work already started.

3. **Local File Storage (MVP)**
   - **What we chose:** Store uploads on the filesystem for now.
   - **Why:** Removes external dependencies during MVP; accelerates QR and photo work in Sprints 3–4.
   - **Trade-off:** Not horizontally scalable, so we’ll revisit cloud storage post-MVP.

---

## What's Next

### Sprint Goals (Upcoming)
1. **Sprint 2 – Landing Page & Lead Capture**
   - Expected timeline: Kick off immediately; wrap within 2–3 days.
   - Depends on: Newly seeded campaigns and database helpers (already in place).

2. **Sprint 3 – Campaign Setup & QR Assets**
   - Expected timeline: Begins after Sprint 2 completes (~3–5 days from now).
   - Depends on: Landing page endpoints to connect QR links and confirm campaign slugs.

### Upcoming Milestones
- **Sprint 2 Complete** – Target 2025-10-16
  - What this unlocks: Demoable homeowner flow from QR scan through lead submission.

- **Sprint 3 Complete** – Target 2025-10-19
  - What this unlocks: Contractor onboarding experience and QR distribution package.

---

## Questions & Decisions Needed

### For Your Review
1. **Email Provider Confirmation**
   - **Context:** We plan to use Gmail SMTP via Nodemailer during Sprint 4 but can switch to SendGrid/SES if you prefer.
   - **Options:** Stay with Gmail (fastest), provision SendGrid (better deliverability), or choose another provider.
   - **Recommendation:** Approve Gmail for MVP to keep Sprint 4 simple; upgrade once lead volume scales.
   - **Urgency:** This Sprint (needs decision before Sprint 4 setup).

2. **Pilot Contractor Selection**
   - **Context:** Sprint 4 requires a real campaign to validate the MVP.
   - **Options:** Nominate an existing partner, source a new beta contractor, or delay validation.
   - **Recommendation:** Identify and brief a contractor during Sprint 2 so campaign assets are ready on time.
   - **Urgency:** Blocking for Sprint 4 launch tasks.

---

## Budget & Velocity

### Time Spent This Sprint
- **Development hours:** ~1.5 hours
- **Testing/debugging:** ~0.5 hours (seed scripts + query validation)
- **Planning/coordination:** ~0.25 hours (documentation and decision log)
- **Total:** ~2.25 hours

### Velocity Notes
We’re running well ahead of schedule thanks to a smooth Next.js setup and reusable tooling. Expect velocity to normalize once feature-heavy sprints begin.

---

## Glossary (For This Summary)

**Next.js:** A framework that lets us build the website and backend in one place, making development and deployment faster.  
**SQLite:** A lightweight database stored in a single file—ideal for development before we scale to a full server.  
**TailwindCSS:** A styling system that provides prebuilt classes so pages can be made responsive quickly without writing lots of custom CSS.

---

End of User Summary
