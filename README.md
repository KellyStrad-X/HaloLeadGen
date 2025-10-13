# Halo Lead Generation

> Turn neighborhood damage into verified, high-intent roofing leads

Halo helps roofing contractors capture attention from nearby homeowners after storms by hosting simple, localized splash pages (QR-driven landing pages) that showcase authentic photos of local storm damage and invite nearby homeowners to request inspections.

---

## 📋 MVP Overview

**Status:** Sprint 1 - Foundation Complete ✅

**Goal:** Prove that homeowners are more likely to submit contact info when they see authentic local damage.

**Success Metric:** At least one lead submission from a single QR-driven campaign.

---

## 🏗️ Project Structure

```
HaloLG-CB/
├── app/                    # Next.js app directory
│   ├── api/               # API routes (future)
│   ├── c/                 # Campaign landing pages (future)
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # Reusable React components (future)
├── lib/                   # Utility libraries
│   └── db.ts             # Database abstraction layer
├── database/              # Database files and scripts
│   ├── migrations/        # Database migrations (future)
│   ├── seeds/            # Seed data scripts
│   │   └── seed.ts       # Test data seeder
│   ├── schema.sql        # Database schema definition
│   ├── init.ts           # Database initialization script
│   └── test-queries.ts   # Query testing script
├── uploads/               # File storage (gitignored)
│   ├── campaigns/        # Campaign photo uploads
│   └── qr-codes/         # Generated QR code images
├── docs/                  # Documentation
├── misc/                  # Miscellaneous files
│   └── decisions/        # Architecture decision records
└── README.md             # This file
```

---

## 🚀 Tech Stack

### Core
- **Next.js 15** - React framework (frontend + backend)
- **TypeScript** - Type-safe JavaScript
- **TailwindCSS** - Utility-first styling

### Database
- **SQLite** (better-sqlite3) - Development database
- **PostgreSQL** - Production database (future)

### Additional Libraries
- **qrcode** - QR code generation
- **nodemailer** - Email notifications

### Deployment
- **Vercel** (recommended) - Free tier, Next.js optimized

**Rationale:** See [Tech Stack Decision](misc/decisions/2025-10-13_tech-stack-selection.md)

---

## 🛠️ Setup Instructions

### Prerequisites

- **Node.js** 20.x or higher
- **npm** 10.x or higher
- **Git**

### Installation

1. **Clone the repository**
   ```bash
   git clone git@github.com:KellyStrad-X/HaloLeadGen.git
   cd HaloLG-CB
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Initialize the database**
   ```bash
   npm run db:seed
   ```

   This will:
   - Create the SQLite database file
   - Initialize the schema
   - Seed with test data (2 contractors, 3 campaigns, 5 leads, 8 photos)

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   ```
   http://localhost:3000
   ```

---

## 📦 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (http://localhost:3000) |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:init` | Initialize database (schema only) |
| `npm run db:seed` | Initialize database with test data |
| `npm run db:reset` | Delete database and re-seed |

---

## 🗄️ Database

### Schema

The database has 4 main tables:

1. **contractors** - Roofing contractors using Halo
2. **campaigns** - Neighborhood-specific lead gen campaigns
3. **leads** - Homeowner submissions (contact info)
4. **photos** - Damage photos uploaded to campaigns

See [database/schema.sql](database/schema.sql) for full schema.

### Test Database

After running `npm run db:seed`, you'll have:

- **2 contractors:**
  - John Smith (Smith Roofing & Repair)
  - Maria Garcia (Garcia Brothers Roofing)

- **3 campaigns:**
  - Oak Ridge Subdivision, Dallas TX
  - Meadowbrook Heights, Fort Worth TX
  - Lakeside Village, Plano TX

- **5 leads** across the campaigns
- **8 photos** across the campaigns

### Test Queries

Run database tests:
```bash
npx tsx database/test-queries.ts
```

This verifies:
- All tables are created
- Data is seeded correctly
- JOIN queries work
- Slug lookups work

---

## 🌟 Features (MVP Scope)

### Sprint 1: Foundation ✅
- [x] Project structure
- [x] Next.js + TypeScript + TailwindCSS setup
- [x] Database schema (SQLite)
- [x] Database seeding
- [x] Test queries

### Sprint 2: Landing Page (Next)
- [ ] Responsive landing page design
- [ ] Photo gallery (unlimited photos)
- [ ] Lead capture form
- [ ] Form validation
- [ ] Dynamic page generation (`/c/[slug]`)

### Sprint 3: Campaign Setup
- [ ] Campaign creation form
- [ ] Multi-photo upload
- [ ] QR code generation
- [ ] Confirmation page

### Sprint 4: Integration & Launch
- [ ] Lead email notifications
- [ ] End-to-end testing
- [ ] Production deployment
- [ ] MVP validation (real campaign)

---

## 🔧 Development Workflow

### Branch Naming
- `feature/agent-name/feature-description`
- `fix/agent-name/bug-description`
- `docs/agent-name/doc-description`

### Commit Message Format
```
<type>: <brief description>

<optional detailed description>

<optional footer>
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

**Example:**
```
feat: add photo upload component

- Support multiple file selection
- Preview before upload
- Drag and drop interface
```

---

## 🧪 Testing

### Manual Testing (Current)
- Database queries tested with `database/test-queries.ts`
- Next.js dev server tested and working

### Future Testing
- Unit tests (Jest)
- Integration tests
- End-to-end tests (Playwright)
- Mobile device testing (iOS, Android)

---

## 📝 Environment Variables

Create a `.env.local` file for local development:

```env
# Database
DATABASE_URL=./database/halo.db

# Email (configure in Sprint 4)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# File Storage
UPLOAD_DIR=./uploads

# Application
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

> **Note:** `.env.local` is gitignored. Never commit secrets to the repository.

---

## 🚢 Deployment (Sprint 4)

### Vercel (Recommended)

1. Connect GitHub repository to Vercel
2. Configure environment variables
3. Deploy with zero config

### Alternative Platforms
- Netlify
- Heroku
- DigitalOcean
- AWS (EC2, Elastic Beanstalk)

---

## 📚 Documentation

- [MVP Overview](../Backlog-Sprints/HALO%20MVP%20OVERVIEW.txt)
- [Sprint Plans](../Backlog-Sprints/Sprints/)
- [Master Backlog](../Backlog-Sprints/MASTER_BACKLOG.md)
- [Tech Stack Decision](misc/decisions/2025-10-13_tech-stack-selection.md)
- [Agent Guidelines](../Agents/AGENT_GUIDELINES.md)

---

## 🤝 Team Roles

- **Claude** (Developer) - Implements features, writes code
- **GPT5** (Project Manager) - Reviews progress, writes user summaries
- **Product Owner** - Makes decisions, validates MVP

---

## 📊 Sprint 1 Progress

### Completed ✅
- Project structure set up
- Git repository initialized and connected to GitHub
- Next.js + TypeScript + TailwindCSS configured
- Database schema designed
- SQLite database created
- Database seeded with test data
- Database queries tested and working
- Documentation complete

### Next Steps
- Begin Sprint 2: Landing Page development
- Create dynamic campaign pages (`/c/[slug]`)
- Build lead capture form
- Design photo gallery

---

## 🐛 Known Issues

- None (Sprint 1 just completed)

---

## 💡 Future Enhancements (Post-MVP)

- Multiple landing page templates
- Contractor dashboard for viewing leads
- Advanced analytics (views, conversions)
- Photo geotag verification
- Subscription billing
- Mobile field app for contractors
- Automated neighborhood targeting
- CRM integrations
- Lead management tools

---

## 📄 License

Proprietary - All rights reserved

---

## 📞 Support

For issues or questions, contact the development team.

---

**Last Updated:** 2025-10-13
**Version:** 0.1.0 (Sprint 1 Complete)
