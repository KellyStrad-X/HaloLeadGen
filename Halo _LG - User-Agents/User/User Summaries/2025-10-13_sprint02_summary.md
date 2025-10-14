# Halo MVP – Sprint 2 User Summary

**Sprint:** Sprint 2 - Landing Page & Lead Capture  
**Period:** 2025-10-13 to 2025-10-13  
**Written By:** GPT5 (Project Manager)  
**Date:** 2025-10-13

---

## Sprint Overview

**Goal:** Deliver the homeowner-facing experience: dynamic campaign pages, rich photo gallery, and a working lead form backed by the database.  
**Status:** Ahead

---

## What Got Done

### Completed Features
1. **Dynamic Landing Pages**
   - **What it does:** Generates `/c/[slug]` pages on the fly, pulling contractor info, neighborhood copy, and campaign photos straight from the database `app/c/[slug]/page.tsx:17`.
   - **Why it matters:** Homeowners now see proof from their own neighborhood, which is the MVP’s core trust driver.
   - **Status:** Complete and tested

2. **Lead Capture Pipeline**
   - **What it does:** Client-side validation, a responsive dark-themed form, and a secure API that stores leads while blocking duplicates `components/LeadForm.tsx:38` `app/api/leads/route.ts:17`.
   - **Why it matters:** Ensures every QR scan can convert into a structured, actionable lead without manual effort.
   - **Status:** Complete and tested

### Technical Progress
- **Backend/Database:** API route validates input, ensures campaign is active, and prevents repeat submissions within an hour before inserting into `leads` `app/api/leads/route.ts:62`.
- **Frontend/UI:** Dark Halo palette, gallery lightbox, trust-building copy, and responsive layouts tuned for mobile-first consumption `app/c/[slug]/page.tsx:90` `tailwind.config.js:1`.
- **Integration:** The landing form posts through `/api/leads`, writing to SQLite and returning clear success/error states that the UI renders in real time `components/LeadForm.tsx:86`.

---

## What's Working

### Wins This Sprint
- Full homeowner journey (view photos → submit details) works end-to-end without console errors.
- Duplicate submission guard and comprehensive validation reduce noisy leads before they reach contractors `app/api/leads/route.ts:80`.
- 404 experience guides users if a QR points to an inactive or mistyped campaign `app/c/[slug]/not-found.tsx:5`.

### Demo-Ready Items
The following are ready to show or test:
- [x] Campaign landing page at `/c/oak-ridge-subdivision-dallas-tx`, including hero, gallery, CTA, and form `app/c/[slug]/page.tsx:71`.
- [x] Lead submission flow that writes to the database and surfaces success/error messaging `components/LeadForm.tsx:100`.

---

## What Needs Attention

### Outstanding Work
1. **Campaign Photo Assets**
   - **Current status:** Gallery renders placeholders referencing filenames `components/PhotoGallery.tsx:31`.
   - **What's left:** Drop in real neighborhood photos before field testing.
   - **Expected completion:** Sprint 3 (during campaign setup work).

2. **Contractor Campaign Setup**
   - **Current status:** Not started.
   - **What's left:** Multi-step form, multi-photo upload, QR generation, confirmation packets.
   - **Expected completion:** Sprint 3.

### Issues or Blockers
- **SQLite WAL/SHM Artifacts:** Running the app in WAL mode leaves `halo.db-wal` and `halo.db-shm` files unignored; they are currently untracked in git status `git status -sb`.  
  - **Impact:** Low, but clutters repo hygiene.  
  - **Plan:** Extend `.gitignore` or clean before pushes (can fold into Sprint 3 housekeeping).

---

## Technical Context (Moderate Detail)

### How It Works
Each campaign page is a server component that loads contractor details and ordered photos in a single query, ensuring SSR-ready content for SEO and instant page loads `app/c/[slug]/page.tsx:20`. The gallery is a client component with lightbox navigation, giving homeowners an immersive look at damage evidence even before real photos arrive `components/PhotoGallery.tsx:14`. Lead submission runs through a controlled form with tailored validation per field, then posts JSON to a Next.js API route; on the server we re-validate, confirm the campaign is active, block rapid duplicates, and store the lead with status `new` for downstream workflows `app/api/leads/route.ts:94`. This architecture keeps the stack cohesive—React on the front, SQLite via `better-sqlite3` on the back—while remaining portable to PostgreSQL later.

### Key Technical Decisions
1. **Duplicate Lead Throttling**
   - **What we chose:** Reject the same email submitting to the same campaign within one hour `app/api/leads/route.ts:80`.
   - **Why:** Reduces spam and accidental double submits, keeping contractor alerts meaningful.
   - **Trade-off:** Very eager homeowners might need to wait an hour; we can adjust the window after real-world feedback.

2. **Dark Halo Theme Adoption**
   - **What we chose:** Custom Tailwind palette with a black/ice-blue brand look `tailwind.config.js:5`.
   - **Why:** Delivers a memorable, trust-focused aesthetic consistent with Halo’s positioning.
   - **Trade-off:** Requires careful contrast management; current components follow accessibility checks.

3. **Placeholder Imagery Strategy**
   - **What we chose:** Keep gallery scaffolding with placeholders until real photos are available `components/PhotoGallery.tsx:31`.
   - **Why:** Lets us validate layout, lightbox, and performance now; swap assets during Sprint 3 without structural changes.
   - **Trade-off:** Demo visuals are abstract until photos land, so coordinate assets before stakeholder demos.

---

## What's Next

### Sprint Goals (Upcoming)
1. **Sprint 3 – Campaign Setup & QR Assets**
   - Expected timeline: Start immediately; target completion within 2–3 days.
   - Depends on: Existing database schema and landing pages to tie QR links to campaigns.

2. **Sprint 4 – Notifications & Launch Prep**
   - Expected timeline: Follows Sprint 3 completion.
   - Depends on: Campaign creation flow (for generating real QR links) and finalized email provider selection.

### Upcoming Milestones
- **Contractor Flow Live** – Target 2025-10-16  
  - What this unlocks: Ability to spin up real campaigns with QR assets.

- **MVP Validation Run** – Target 2025-10-19  
  - What this unlocks: Field test with a real contractor to capture the first lead.

---

## Questions & Decisions Needed

1. **Provide Real Photo Assets**
   - **Context:** Gallery currently shows placeholders; real images will lift credibility in demos and production.
   - **Options:** a) Supply sample storm photos now, b) Wait for contractor upload tooling in Sprint 3.
   - **Recommendation:** Provide a small photo set during Sprint 3 so we can test gallery performance and polish the presentation.
   - **Urgency:** This Sprint.

2. **Email Provider Confirmation**
   - **Context:** Sprint 4 will wire up contractor notifications through Nodemailer.
   - **Options:** Gmail SMTP (default), SendGrid, AWS SES.
   - **Recommendation:** Approve Gmail for MVP to stay fast; earmark SendGrid for post-MVP scale.
   - **Urgency:** Before Sprint 4 setup.

---

## Budget & Velocity

### Time Spent This Sprint
- **Development hours:** ~2.0 hours
- **Testing/debugging:** ~0.4 hours (form/API validation, multi-browser checks)
- **Planning/coordination:** ~0.2 hours (log documentation, review)
- **Total:** ~2.6 hours

### Velocity Notes
Sprint 2 closed at roughly 15% of its estimated effort thanks to strong reuse of Sprint 1 scaffolding. Expect cadence to even out as file upload and QR work introduce more integration steps.

---

## Glossary (For This Summary)

**Lightbox:** A fullscreen view that lets users cycle through photos without leaving the page.  
**API Route:** A backend endpoint hosted inside Next.js that processes form submissions.  
**WAL (Write-Ahead Log):** SQLite’s temporary file that tracks recent changes; we’ll hide it from git to keep the repo tidy.

---

End of User Summary
