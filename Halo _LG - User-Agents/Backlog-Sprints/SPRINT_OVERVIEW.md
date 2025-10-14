# Halo MVP - Sprint Overview

**Project:** Halo Lead Generation Platform for Roofing Contractors
**Created:** 2025-10-13
**Total Sprints:** 4
**Estimated Timeline:** 7-11 days (75-95 hours)

---

## Project Goal

Build an MVP that proves homeowners are more likely to submit contact info when they see authentic local roof damage. Success metric: **At least one lead submission from a single QR-driven campaign.**

---

## Sprint Breakdown

### Sprint 1: Foundation & Setup
**Duration:** 1-2 days (8-12 hours)
**Goal:** Establish project foundation with working tech stack and database

**Key Deliverables:**
- Project structure and git repository
- Tech stack selected and documented
- Database schema designed and implemented
- "Hello World" application running
- Test data seeded

**Files:**
- `/Backlog-Sprints/Sprints/SPRINT_01_Foundation.md`

---

### Sprint 2: Landing Page & Lead Capture
**Duration:** 2-3 days (17-22 hours)
**Goal:** Build homeowner-facing landing page with photo gallery and working lead capture form

**Key Deliverables:**
- Responsive landing page (mobile-first)
- Photo gallery supporting unlimited photos
- Lead capture form with validation
- Form submission API and database storage
- Dynamic page generation per campaign

**Files:**
- `/Backlog-Sprints/Sprints/SPRINT_02_Landing_Page.md`

---

### Sprint 3: Campaign Setup & Admin
**Duration:** 2-3 days (17-22 hours)
**Goal:** Build contractor-facing campaign creation flow with photo upload and QR code generation

**Key Deliverables:**
- Campaign creation form
- Multi-photo upload system (unlimited photos)
- Photo compression and storage
- QR code generation
- Confirmation page with downloadable assets
- Clear distribution instructions

**Files:**
- `/Backlog-Sprints/Sprints/SPRINT_03_Campaign_Setup.md`

---

### Sprint 4: Integration, Testing & Launch
**Duration:** 2-3 days (18-24 hours)
**Goal:** Complete end-to-end testing, implement lead notifications, deploy to production, and validate MVP

**Key Deliverables:**
- Lead email notification system
- End-to-end testing complete
- All critical bugs fixed
- Documentation complete
- Production deployment
- First real campaign live
- MVP validated (1+ leads captured)

**Files:**
- `/Backlog-Sprints/Sprints/SPRINT_04_Integration_Launch.md`

---

## Total Effort Estimate

**Conservative:** 75 hours (9-10 days at 8 hrs/day)
**Realistic:** 85 hours (10-11 days at 8 hrs/day)
**With buffer:** 95 hours (12 days at 8 hrs/day)

---

## Critical Path

1. **Sprint 1** must complete first (foundation)
2. **Sprint 2** and **Sprint 3** could partially overlap:
   - Landing page development (Sprint 2)
   - Campaign setup development (Sprint 3)
   - But both need Sprint 1 database and foundation
3. **Sprint 4** requires Sprint 2 and 3 complete (integration)

**Recommended Approach:** Sequential sprints (1 → 2 → 3 → 4) to minimize complexity and maintain focus.

---

## Key Features by Sprint

| Feature | Sprint | Priority | Hours |
|---------|--------|----------|-------|
| Project setup & database | 1 | P0 | 8-12 |
| Landing page UI | 2 | P0 | 6-8 |
| Lead capture form | 2 | P0 | 4-5 |
| Dynamic page generation | 2 | P0 | 4-5 |
| Campaign creation form | 3 | P0 | 3-4 |
| Photo upload system | 3 | P0 | 8-10 |
| QR code generation | 3 | P0 | 3-4 |
| Lead notifications | 4 | P0 | 4-5 |
| End-to-end testing | 4 | P0 | 4-6 |
| Production deployment | 4 | P0 | 4-5 |
| Documentation | 4 | P1 | 2-3 |

---

## MVP Feature Checklist

By the end of Sprint 4, these features should be complete:

**Public Site (Homeowner-Facing):**
- [ ] Clean landing page template
- [ ] Responsive design (mobile-first)
- [ ] Photo gallery (unlimited photos)
- [ ] Lead capture form
- [ ] Form validation
- [ ] Success/error states

**Admin/Contractor Side:**
- [ ] Campaign setup form
- [ ] Multi-photo upload (unlimited)
- [ ] Photo compression
- [ ] QR code generation
- [ ] QR code download
- [ ] Confirmation page with assets

**Backend:**
- [ ] Database schema
- [ ] Campaign creation API
- [ ] Lead submission API
- [ ] Photo upload API
- [ ] Lead-to-campaign association
- [ ] Email notifications

**Deployment:**
- [ ] Production hosting
- [ ] HTTPS enabled
- [ ] Environment variables configured
- [ ] Database deployed
- [ ] Email service configured

**Validation:**
- [ ] Real campaign created
- [ ] QR codes distributed
- [ ] At least 1 lead captured

---

## Post-MVP Roadmap (Future Sprints)

**Not included in MVP, but planned for Phase 2:**
- Contractor dashboard for viewing leads
- Advanced analytics (views, conversions, etc.)
- Multiple landing page templates
- Photo geotag verification
- Subscription billing
- Mobile field app for contractors
- Automated neighborhood targeting
- Lead management tools (status tracking, notes, etc.)
- CRM integrations
- Multi-user contractor accounts

---

## Success Criteria

**MVP is successful if:**
1. One contractor can create a campaign in <10 minutes
2. QR code scans successfully on phones
3. Landing page loads in <3 seconds on mobile
4. At least one homeowner submits a lead
5. Contractor receives email notification within 1 minute
6. Contractor can follow up with lead information

**If these criteria are met, the core concept is validated and Halo can scale.**

---

## Templates & Documentation

**Templates Created:**
- `Restart_Brief_Template.md` - For Claude to document session progress
- `User_Summary_Template.md` - For GPT5 to write user-friendly summaries
- `Targeted_Fix_Template.md` - For documenting blockers or out-of-scope changes

**Key Documents:**
- `MASTER_BACKLOG.md` - Complete backlog with all epics and stories
- `HALO MVP OVERVIEW.txt` - Original MVP specification
- `SPRINT_01_Foundation.md` - Sprint 1 details
- `SPRINT_02_Landing_Page.md` - Sprint 2 details
- `SPRINT_03_Campaign_Setup.md` - Sprint 3 details
- `SPRINT_04_Integration_Launch.md` - Sprint 4 details
- `SPRINT_OVERVIEW.md` - This file (high-level summary)

---

## Team Roles

**Claude (Developer):**
- Implements features per sprint plan
- Maintains Restart Briefs for session handoffs
- Creates Targeted Fix briefs for blockers
- Commits code and documents decisions

**GPT5 (Project Manager):**
- Reviews Claude's logs after each sprint
- Writes User Summaries for the product owner
- Tracks progress against backlog
- Makes decisions on scope and priorities

**Product Owner (You):**
- Receives high-level summaries from GPT5
- Makes product decisions
- Provides feedback and direction
- Validates MVP success

---

## Notes

- Photo upload changed from "3-5 photos" to unlimited (support 10-20+ photos)
- Keep MVP lean - focus on one complete user flow
- Technical choices should prioritize speed to market
- Document all decisions as you go
- Success = 1 lead from 1 real campaign

---

## Next Steps

1. Review this sprint plan
2. Spin up GPT5 for project management
3. Begin Sprint 1: Foundation & Setup
4. Claude creates Restart Brief after each session
5. GPT5 reviews and creates User Summary after each sprint
6. Iterate through sprints 1 → 2 → 3 → 4
7. Deploy and validate MVP
8. Celebrate or iterate based on results!

---

**Prepared by:** Claude
**Date:** 2025-10-13
**Status:** Ready to begin Sprint 1
