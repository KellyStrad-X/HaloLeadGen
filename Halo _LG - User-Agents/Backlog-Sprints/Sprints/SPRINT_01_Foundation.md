# Sprint 1: Foundation & Setup

**Sprint Duration:** 1-2 days
**Sprint Goal:** Establish project foundation with working tech stack and database
**Estimated Effort:** 8-12 hours

---

## Sprint Objective

Set up the development environment, choose the tech stack, and build the database schema that will support the entire MVP. By the end of this sprint, we should have a working "Hello World" application with database connectivity.

---

## Sprint Backlog

### 1. Development Environment Setup [E1-S1]
**Priority:** P0
**Estimated:** 2-3 hours

**Tasks:**
- [ ] Create project directory structure
  - `/frontend` or `/client` for public-facing code
  - `/backend` or `/server` for API
  - `/database` for migrations and seeds
  - `/docs` for documentation
  - `/misc` for decisions and notes
- [ ] Initialize git repository
- [ ] Create .gitignore (node_modules, .env, uploads, etc.)
- [ ] Set up package.json with basic dependencies
- [ ] Configure linter and formatter (ESLint, Prettier)
- [ ] Create README with basic setup instructions
- [ ] Document folder structure

**Acceptance Criteria:**
- ✓ Clean folder structure in place
- ✓ Git initialized with first commit
- ✓ .gitignore prevents sensitive files
- ✓ README explains how to get started

---

### 2. Technology Stack Selection [E1-S3]
**Priority:** P0
**Estimated:** 2-3 hours

**Tasks:**
- [ ] Choose frontend approach
  - **Option 1:** Plain HTML/CSS/JS (fastest for MVP)
  - **Option 2:** React (more scalable)
  - **Option 3:** Next.js (SSR + API routes in one)
- [ ] Choose backend framework
  - **Option 1:** Node.js + Express (JavaScript everywhere)
  - **Option 2:** Next.js API routes (no separate backend)
  - **Option 3:** Python + Flask (if preferred)
- [ ] Choose database
  - **Option 1:** SQLite (quick start, file-based)
  - **Option 2:** PostgreSQL (production-ready)
- [ ] Choose file storage for photos
  - **Option 1:** Local filesystem (MVP)
  - **Option 2:** Cloud storage like AWS S3, Cloudinary (future)
- [ ] Choose email service
  - **Option 1:** Nodemailer + Gmail SMTP (free, easy)
  - **Option 2:** SendGrid, Mailgun, AWS SES (scalable)
- [ ] Document stack decision in `/misc/decisions/tech_stack.md`
- [ ] Create basic "Hello World" app with chosen stack
- [ ] Verify all pieces can talk to each other

**Recommended MVP Stack (Fast & Simple):**
- **Frontend:** Next.js (handles both frontend and API routes)
- **Database:** SQLite for dev, PostgreSQL for production
- **File Storage:** Local filesystem (uploads folder)
- **Email:** Nodemailer + Gmail SMTP
- **Hosting:** Vercel (free tier, Next.js native support)

**Acceptance Criteria:**
- ✓ Stack chosen and documented with rationale
- ✓ "Hello World" app runs successfully
- ✓ Basic routing works
- ✓ Can connect to database

---

### 3. Database Design & Setup [E1-S2]
**Priority:** P0
**Estimated:** 4-6 hours

**Tasks:**
- [ ] Design database schema
  - **contractors** table
  - **campaigns** table
  - **leads** table
  - **photos** table
- [ ] Document schema with relationships in `/database/schema.md`
- [ ] Create database (SQLite file or PostgreSQL instance)
- [ ] Write migration scripts
  - Create tables
  - Add indexes for performance
  - Set up foreign keys
- [ ] Write seed script for test data
  - 1-2 test contractors
  - 2-3 test campaigns
  - 5-10 test leads
  - Sample photos
- [ ] Test database queries
  - Insert contractor
  - Create campaign
  - Add photos to campaign
  - Submit lead
  - Query leads by campaign
- [ ] Create database helper functions/ORM setup

**Schema Design:**

```sql
-- contractors table
CREATE TABLE contractors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  company TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- campaigns table
CREATE TABLE campaigns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  contractor_id INTEGER NOT NULL,
  neighborhood_name TEXT NOT NULL,
  page_slug TEXT UNIQUE NOT NULL, -- for clean URLs like /c/oak-ridge-dallas
  qr_code_path TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  status TEXT DEFAULT 'active', -- active, paused, completed
  FOREIGN KEY (contractor_id) REFERENCES contractors(id)
);

-- leads table
CREATE TABLE leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  campaign_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  notes TEXT,
  submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  status TEXT DEFAULT 'new', -- new, contacted, qualified, closed
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
);

-- photos table
CREATE TABLE photos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  campaign_id INTEGER NOT NULL,
  image_path TEXT NOT NULL,
  upload_order INTEGER NOT NULL, -- for displaying in correct order
  uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
);

-- indexes for performance
CREATE INDEX idx_campaigns_contractor ON campaigns(contractor_id);
CREATE INDEX idx_leads_campaign ON leads(campaign_id);
CREATE INDEX idx_photos_campaign ON photos(campaign_id);
CREATE INDEX idx_campaigns_slug ON campaigns(page_slug);
```

**Acceptance Criteria:**
- ✓ Database created and accessible
- ✓ All tables exist with correct schema
- ✓ Foreign key relationships work
- ✓ Seed data loads successfully
- ✓ Can query data from application code
- ✓ Schema documented

---

## Sprint Deliverables

By end of Sprint 1:
- [ ] Project structure set up
- [ ] Git repository initialized
- [ ] Tech stack chosen and documented
- [ ] Basic app running (Hello World)
- [ ] Database created with schema
- [ ] Test data seeded
- [ ] Database queries working from app
- [ ] Setup instructions documented

---

## Definition of Done

- [ ] All code committed to git with clear commit messages
- [ ] README updated with setup instructions
- [ ] Another developer could clone and run the project
- [ ] Database schema documented
- [ ] Tech stack decision documented in `/misc/decisions/`
- [ ] No hardcoded secrets (use .env file)
- [ ] Sprint 1 Restart Brief created

---

## Testing Checklist

- [ ] Application starts without errors
- [ ] Can connect to database
- [ ] Can insert test data
- [ ] Can query test data
- [ ] Environment variables load correctly

---

## Risks & Dependencies

**Risks:**
- Tech stack choice might need adjustment if issues arise
- Database choice (SQLite vs PostgreSQL) affects deployment

**Mitigation:**
- Keep architecture flexible
- Document assumptions
- Use abstraction layers (ORM) so database can be swapped

**Dependencies:**
- None (this is foundational work)

---

## Notes for Next Sprint

- Sprint 2 will build the landing page on this foundation
- Ensure API route structure is clear (REST or similar)
- Keep database queries simple for now (optimize later)
- Photo storage location should be configurable

---

**Sprint Owner:** Claude
**Prepared:** 2025-10-13
