# Halo Lead Generation

> Turn neighborhood damage into verified, high-intent roofing leads

---

## 🎯 Product Overview

Halo helps roofing contractors capture leads from nearby homeowners after storms by creating neighborhood-specific landing pages accessed via QR codes. Contractors upload photos of local roof damage, distribute QR codes in the area, and homeowners scan to see real damage from their neighborhood and request free inspections.

**Core Flow:**
1. Contractor creates campaign with damage photos
2. System generates unique QR code + landing page
3. Contractor distributes QR codes (door hangers, signs, flyers)
4. Homeowner scans QR → views local damage → submits contact info
5. Contractor receives lead notification

---

## 🎯 MVP Goal

**Success Metric:** At least one lead submission from a real QR-driven campaign in a neighborhood

**Why it matters:** Proves that homeowners are more likely to submit contact info when they see authentic local damage versus generic marketing.

---

## 🤖 Agent Workflow & Roles

This project is built using an AI-assisted development workflow with clearly defined roles:

### Team Structure

**👨‍💻 Claude (Developer Agent)**
- Implements features according to sprint plans
- Writes code, tests, and documentation
- Maintains detailed session logs after each work session
- Creates Targeted Fix briefs when blocked or encountering scope changes
- Works autonomously in secure VM environment
- **Logs:** `Agents/Claude/Logs/`

**📊 GPT5 (Project Manager Agent)**
- Reviews Claude's detailed logs after each sprint
- Translates technical progress into User Summaries
- Writes in accessible language (high-level overview + moderate technicality)
- Tracks progress against backlog and timeline
- Makes sprint/priority decisions when needed
- **Summaries:** `User/User Summaries/`

**🎯 Product Owner (Human)**
- Receives concise User Summaries from GPT5
- Makes product and business decisions
- Provides feedback and direction
- Validates MVP success
- Does not need deep technical knowledge

### Development Flow

```
┌──────────────────────────────────────────────────────┐
│  1. Sprint Planning                                  │
│     - Backlog items defined                          │
│     - Acceptance criteria clear                      │
└────────────────┬─────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────┐
│  2. Claude Codes (Autonomous)                        │
│     - Implements features                            │
│     - Writes tests                                   │
│     - Commits to git                                 │
│     - Documents decisions                            │
└────────────────┬─────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────┐
│  3. Session Log Created                              │
│     - Detailed technical log by Claude               │
│     - What was done, how, and why                    │
│     - Blockers, decisions, next steps                │
└────────────────┬─────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────┐
│  4. GPT5 Reviews & Summarizes                        │
│     - Reads Claude's technical log                   │
│     - Writes User Summary (non-technical)            │
│     - Highlights progress, decisions, blockers       │
└────────────────┬─────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────┐
│  5. User Reviews Summary                             │
│     - Understands progress without technical details │
│     - Makes decisions on questions/blockers          │
│     - Approves or adjusts direction                  │
└────────────────┬─────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────┐
│  6. Next Sprint (Loop back to #1)                    │
└──────────────────────────────────────────────────────┘
```

### Security & Environment

**VM Execution:**
- All agent development work happens in a secure virtual machine
- Provides maximum security while allowing autonomous operation
- Limited access to production systems and secrets

**Host vs VM:**
- **VM:** Code development, testing, git commits, documentation
- **Host:** Secret keys, production access, real device testing, external service authentication

### Templates & Documentation

**For Agents:**
- **Restart Brief Template** - Session handoff documentation
- **Targeted Fix Template** - Blocker/scope change documentation
- **Agent Guidelines** - Operational instructions and protocols

**For User:**
- **User Summary Template** - Non-technical progress reports from GPT5

**Project Documentation:**
- **Master Backlog** - All features and tasks
- **Sprint Plans** - Detailed sprint breakdowns
- **Decision Records** - Key technical decisions with rationale

---

## 🚀 Quick Start

```bash
# Clone repository
git clone git@github.com:KellyStrad-X/HaloLeadGen.git
cd HaloLG-CB

# Install dependencies
npm install

# Initialize database with test data
npm run db:seed

# Start development server
npm run dev

# Visit http://localhost:3000
```

---

## 🛠️ Tech Stack

- **Next.js 15** - Full-stack React framework (frontend + backend)
- **TypeScript** - Type-safe development
- **TailwindCSS** - Utility-first styling
- **SQLite** - Development database (PostgreSQL for production)
- **Nodemailer** - Email notifications
- **qrcode** - QR code generation

---

## 📦 NPM Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run db:seed      # Initialize database with test data
npm run db:reset     # Reset database (delete and re-seed)
```

---

## 📊 Sprint Progress

### ✅ Sprint 1: Foundation (Complete)
- Project structure and git setup
- Next.js + TypeScript + Tailwind configured
- Database schema and seeding
- Test data and queries verified

### ✅ Sprint 2: Landing Page (Complete)
- Dynamic campaign pages (`/c/[slug]`)
- Dark theme with ice blue accents
- Photo gallery with lightbox
- Lead capture form with validation
- API endpoint for form submission

### ⏳ Sprint 3: Campaign Setup (Upcoming)
- Campaign creation form
- Multi-photo upload system
- QR code generation
- Confirmation page with assets

### ⏳ Sprint 4: Integration & Launch (Upcoming)
- Lead email notifications
- End-to-end testing
- Production deployment
- MVP validation with real campaign

---

## 📁 Key Directories

```
HaloLG-CB/
├── app/              # Next.js pages and API routes
├── components/       # Reusable React components
├── lib/              # Utilities and database layer
├── database/         # Schema, seeds, and migrations
├── uploads/          # Photo storage (gitignored)
└── misc/decisions/   # Architecture decision records
```

---

## 🎨 Design System

**Color Palette:**
- Primary: Ice Blue (#00D4FF)
- Dark: Black (#000000)
- Mid: Dark Grey (#1A1A1A, #2D2D2D)
- Light: Medium Grey (#4A4A4A)
- Accent: Light Grey (#E0E0E0)

**Design Direction:**
- Sleek, clean, modern, professional
- Dark theme with high contrast
- Ice blue accents (matches Halo logo)
- Trust-building and credible
- Mobile-first responsive design

---

## 📚 Documentation

**For Development:**
- [Sprint Plans](../Backlog-Sprints/Sprints/)
- [Master Backlog](../Backlog-Sprints/MASTER_BACKLOG.md)
- [MVP Overview](../Backlog-Sprints/HALO%20MVP%20OVERVIEW.txt)

**For Agents:**
- [Agent Guidelines](../Agents/AGENT_GUIDELINES.md)
- [Templates](../Agents/Templates/)

**Session Logs:**
- [Claude's Logs](../Agents/Claude/Logs/)
- [User Summaries](../User/User%20Summaries/)

---

## 📄 License

Proprietary - All rights reserved

---

**Current Version:** 0.1.0 (Sprint 1 Complete)
**Last Updated:** 2025-10-13
