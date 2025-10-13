# Tech Stack Selection

**Date:** 2025-10-13
**Decision By:** Claude
**Sprint:** Sprint 1 - Foundation

---

## Decision

Selected **Next.js** as the primary framework with supporting technologies for the Halo MVP.

---

## Full Stack

### Frontend
- **Next.js 15** (React framework)
- **TypeScript** (type safety)
- **TailwindCSS** (utility-first styling)
- **React 18.3** (UI library)

### Backend
- **Next.js API Routes** (serverless API endpoints)
- **Node.js 20.11** (runtime environment)

### Database
- **better-sqlite3** (development - file-based SQL)
- **PostgreSQL** (production - when deploying)
- **Reason for dual approach:** SQLite is perfect for local dev (zero setup), PostgreSQL for production (scalable, reliable)

### File Storage
- **Local filesystem** (MVP - uploads folder)
- **Future:** Cloud storage (AWS S3, Cloudinary) when scaling

### Email
- **Nodemailer** (email sending library)
- **Gmail SMTP** (MVP email service - free tier)
- **Future:** SendGrid or AWS SES for higher volume

### QR Code Generation
- **qrcode** package (Node.js QR code generator)

### Deployment
- **Vercel** (recommended - Next.js native, free tier)
- **Alternative:** Netlify, Heroku, DigitalOcean

---

## Rationale

### Why Next.js?

**Pros:**
1. **All-in-one solution:** Handles both frontend and backend (API routes)
2. **Fast development:** Built-in routing, API routes, TypeScript support
3. **Performance:** Server-side rendering, automatic code splitting, image optimization
4. **SEO-friendly:** Server-side rendering for landing pages
5. **Easy deployment:** Vercel has zero-config deployment for Next.js
6. **Great DX:** Hot reload, error messages, TypeScript integration
7. **Production-ready:** Used by major companies (Airbnb, Netflix, TikTok)
8. **File-based routing:** Intuitive structure for our pages (`/c/[slug]`)

**Cons:**
1. Slightly more complex than vanilla HTML/JS
2. Requires understanding of React concepts

**Decision:** Pros far outweigh cons for this MVP. Speed to market and built-in features are critical.

---

### Why TypeScript?

**Pros:**
1. Catch errors before runtime
2. Better IDE support (autocomplete, refactoring)
3. Self-documenting code
4. Easier to maintain as project grows
5. Industry standard for modern web apps

**Cons:**
1. Slightly slower initial development (writing types)
2. Learning curve (minimal with modern TypeScript)

**Decision:** TypeScript is worth the small upfront cost for long-term maintainability.

---

### Why TailwindCSS?

**Pros:**
1. **Fast development:** No need to write custom CSS
2. **Mobile-first:** Built-in responsive utilities
3. **Consistency:** Design system out of the box
4. **Small bundle:** Only includes used classes
5. **Easy to customize:** Extend with custom colors, spacing, etc.

**Cons:**
1. Class names can get long
2. Requires learning Tailwind utilities

**Decision:** Tailwind is the fastest way to build responsive, professional-looking UIs. Perfect for MVP.

---

### Why SQLite (dev) + PostgreSQL (prod)?

**Pros:**
1. **SQLite (dev):**
   - Zero setup (file-based database)
   - Perfect for local development
   - Fast prototyping
   - No separate database server needed

2. **PostgreSQL (prod):**
   - Industry standard
   - Scalable and reliable
   - Supported by all major hosting platforms
   - Advanced features (full-text search, JSON, etc.)

**Cons:**
1. Need to manage two database systems
2. Schema might differ slightly (use SQL standard to minimize)

**Decision:** SQLite gets us moving fast, PostgreSQL is production-ready. We'll abstract database access so switching is easy.

---

### Why Local File Storage (MVP)?

**Pros:**
1. Zero external dependencies
2. No API keys needed
3. Fast setup
4. Free

**Cons:**
1. Not scalable long-term
2. Lost if server goes down (need backups)
3. Harder to manage in distributed systems

**Decision:** Perfect for MVP. We'll add cloud storage (S3, Cloudinary) in Phase 2 when scaling.

---

### Why Nodemailer + Gmail SMTP?

**Pros:**
1. Free for low volume
2. Easy setup (just email and app password)
3. Reliable delivery
4. No credit card needed for MVP

**Cons:**
1. Gmail has sending limits (500/day)
2. Not suitable for high volume
3. Deliverability can be tricky

**Decision:** Perfect for MVP testing. We'll switch to SendGrid/AWS SES before scaling to multiple contractors.

---

## Alternatives Considered

### 1. Plain HTML/CSS/JS + Express
**Why not chosen:**
- More manual setup required
- No built-in TypeScript support
- Have to configure routing, bundling, etc.
- Slower development overall

### 2. React + Separate Node.js Backend
**Why not chosen:**
- More complex setup (two separate apps)
- Need to manage CORS
- Two deployments instead of one
- Next.js provides all benefits in one

### 3. Python + Flask
**Why not chosen:**
- Team has Node.js expertise
- Next.js ecosystem is more mature for this use case
- Harder to find hosting with Python + database
- No advantage for this particular project

### 4. WordPress or No-Code Tools
**Why not chosen:**
- Less flexible for custom features
- Harder to add QR generation, custom forms, etc.
- Vendor lock-in
- Not as maintainable for complex features

---

## Architecture Overview

```
┌─────────────────────────────────────────┐
│           Next.js Application           │
├─────────────────────────────────────────┤
│                                         │
│  Frontend (React Components)            │
│  ├── Landing pages (/c/[slug])         │
│  ├── Campaign setup (/create-campaign) │
│  └── Forms & UI components             │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  Backend (API Routes)                   │
│  ├── POST /api/campaigns               │
│  ├── POST /api/leads                   │
│  ├── POST /api/campaigns/[id]/photos   │
│  └── GET  /api/campaigns/[id]          │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  Database Layer                         │
│  ├── SQLite (dev)                      │
│  └── PostgreSQL (production)           │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  External Services                      │
│  ├── Nodemailer (email)                │
│  ├── QRCode library (QR generation)    │
│  └── Filesystem (file storage)         │
│                                         │
└─────────────────────────────────────────┘
```

---

## Migration Path (MVP → Production)

### Phase 1: MVP (Current)
- Next.js + SQLite + Local file storage + Gmail SMTP
- Deploy to Vercel free tier

### Phase 2: Scale (Post-MVP)
- Switch to PostgreSQL
- Add cloud storage (S3 or Cloudinary)
- Switch to SendGrid or AWS SES
- Add caching (Redis)
- Add monitoring (Sentry)

### Phase 3: Enterprise
- Multi-region deployment
- CDN for images
- Advanced analytics
- CRM integrations
- Mobile app (React Native)

---

## Validation

**To validate this stack works, we need:**
- [ ] Next.js dev server runs successfully
- [ ] Can create a basic page
- [ ] Can create an API route
- [ ] Can connect to SQLite database
- [ ] Can upload a file
- [ ] Can send an email (test)
- [ ] Can generate a QR code

**Status:** Next.js setup complete. Testing next.

---

## Dependencies Installed

```json
"dependencies": {
  "next": "^15.0.0",
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "qrcode": "^1.5.3",
  "nodemailer": "^6.9.8",
  "better-sqlite3": "^11.0.0"
},
"devDependencies": {
  "@types/node": "^20",
  "@types/react": "^18",
  "@types/react-dom": "^18",
  "@types/nodemailer": "^6.4.14",
  "@types/qrcode": "^1.5.5",
  "typescript": "^5",
  "eslint": "^8",
  "eslint-config-next": "^15.0.0",
  "tailwindcss": "^3.4.0",
  "postcss": "^8",
  "autoprefixer": "^10.0.1"
}
```

---

**Decision Status:** ✅ Approved and Implemented
**Next Steps:** Test Next.js server, then build database schema
