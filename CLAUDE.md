# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## 📚 Targeted Documentation

**New agents**: See [`Claude.MD/`](./Claude.MD/) for area-specific guides!

**Quick links**:
- [Quick Start Guide](./Claude.MD/QUICK-START.md) - 5-minute onboarding
- [Recent Changes](./Claude.MD/RECENT-CHANGES.md) - Latest implementations
- [Area Guides](./Claude.MD/areas/) - Dashboard, Campaigns, Leads, Maps, Analytics
- [Pattern Guides](./Claude.MD/patterns/) - API, Auth, Firebase, Components

**Use case**: "Review `Claude.MD/areas/DASHBOARD.md` and get ready to work on dashboard features"

---

## Project Overview

**Halo Lead Generation** is a Next.js application that helps roofing contractors capture leads from homeowners after storms by creating neighborhood-specific landing pages accessed via QR codes. Contractors upload photos of local roof damage, distribute QR codes in the area, and homeowners scan to see real damage from their neighborhood and request free inspections.

**Tech Stack:**
- **Framework:** Next.js 15 (App Router)
- **Database:** Firebase Firestore (replaced SQLite)
- **Authentication:** Firebase Auth
- **Storage:** Firebase Storage
- **Styling:** Tailwind CSS
- **Maps:** Google Maps JavaScript API (@vis.gl/react-google-maps)
- **Email:** SendGrid
- **QR Codes:** qrcode library

## Essential Commands

### Development
```bash
npm run dev              # Start development server (localhost:3000)
npm run build           # Build for production
npm run start           # Start production server
npm run lint            # Run ESLint
```

### Database Management
```bash
npm run db:init         # Initialize Firestore (uses firebase-admin)
npm run db:seed         # Initialize and seed Firestore with test data
npm run seed:firestore  # Seed Firestore directly
```

**Note:** The SQLite commands (`npm run db:reset`) and schema.sql are legacy artifacts. The project now uses Firebase Firestore exclusively.

## Architecture

### Database Layer (Firestore)

The application uses **two separate Firestore client libraries** for different contexts:

1. **Client-side (`lib/firestore.ts`):**
   - Uses Firebase client SDK (`firebase/firestore`)
   - For public-facing pages (landing pages, lead submission forms)
   - Read operations for campaigns, photos, contractors
   - Lead submission from homeowners

2. **Server-side (`lib/firestore-admin.ts`):**
   - Uses Firebase Admin SDK (`firebase-admin/firestore`)
   - For authenticated API routes and server operations
   - All write operations (create campaigns, update leads, etc.)
   - Dashboard data queries
   - Returns data with `Admin` suffix in function names (e.g., `createCampaignAdmin`)

**Key Collections:**
- `contractors` - Contractor profiles
- `campaigns` - QR code campaigns with settings
- `leads` - Homeowner lead submissions
- `photos` - Campaign damage photos stored in Firebase Storage
- `contractor_branding` - Company logos, crew member photos, trust badges

**Important:** When querying Firestore, always serialize Timestamp objects to ISO strings before sending to client components. Both firestore files have helper functions for this (`serializeTimestamp`, `serializeCampaign`, etc.).

### Authentication Flow

- **Firebase Authentication** for all user management
- Client-side: `lib/auth-context.tsx` provides React context with `useAuth()` hook
- Server-side: API routes verify Firebase ID tokens via `adminAuth.verifyIdToken()`
- Protected routes use `(authenticated)` route group with `AuthProvider` wrapper
- Public campaign landing pages at `/c/[slug]` require no authentication

### Route Structure

```
app/
├── (authenticated)/        # Protected routes requiring login
│   ├── dashboard/          # Main contractor dashboard
│   │   ├── page.tsx        # Dashboard summary
│   │   ├── campaigns/      # Campaign management
│   │   └── jobs/           # Job pipeline (promoted leads)
│   ├── create-campaign/    # Campaign creation flow
│   ├── login/              # Login page
│   └── signup/             # Registration page
├── (marketing)/            # Public marketing pages
│   └── page.tsx            # Homepage
├── c/[slug]/               # Public campaign landing pages (QR destinations)
├── campaign/[id]/success/  # Lead submission success page
└── api/                    # API routes
    ├── campaigns/          # Campaign CRUD operations
    ├── leads/              # Lead management
    ├── dashboard/          # Dashboard data aggregation
    ├── upload/             # Firebase Storage uploads
    └── contractor-branding/ # Branding settings
```

### Firebase Storage

All images (damage photos, logos, crew photos) are stored in Firebase Storage:
- Campaign photos: Uploaded during campaign creation
- Contractor branding: Uploaded via `/api/upload` route
- Returns public URLs with download tokens for direct access
- Upload size limit: 50MB (configured in `next.config.js`)

### Map Features

The application has **three distinct map implementations**:

1. **Campaign Map (`components/CampaignMap.tsx`):**
   - Shows leads for a specific campaign on the campaign detail page
   - Geocodes lead addresses using server-side Geocoding API
   - Used in dashboard campaign details

2. **Halo Map (`components/HaloMap.tsx`):**
   - Dashboard overview map showing all campaigns for a contractor
   - Shows campaign locations based on `showcaseAddress`
   - Obfuscates completed job locations for privacy
   - Caches geocoded locations in Firestore (`geocodedLocation` field)

3. **Landing Page Map Modal (`components/MapModal.tsx`):**
   - Public-facing map shown to homeowners on landing pages
   - Displays service radius around campaign location
   - No lead data shown

**Geocoding Strategy:**
- Server-side only: Uses `lib/geocoding.ts` with server-side Google Maps API key
- Caches results in Firestore to avoid repeated API calls
- Falls back gracefully if geocoding fails

### Lead to Job Promotion Pipeline

Leads can be promoted to "Jobs" for tracking through the inspection/completion lifecycle:

1. **Lead statuses:** `new`, `contacted`, `qualified`, `closed`, `lost`
2. **Job statuses:** `scheduled`, `in_progress`, `completed`
3. Promotion creates `job` object within lead document with additional fields:
   - `scheduledInspectionDate`
   - `inspector`
   - `internalNotes`
   - `promotedAt`
   - `completedAt`
4. Promoted leads are filtered from the leads pipeline and shown in jobs pipeline
5. API routes: `/api/dashboard/jobs/` for job management

### Email Notifications

- **Provider:** SendGrid
- **Configuration:** `lib/mailer.ts`
- Triggered on lead submission
- Sends to contractor email from campaign

### QR Code Generation

- QR codes generated server-side when campaign is created
- Stored in Firebase Storage as PNG files
- API route: `/api/campaigns/[id]/generate-qr`
- Links to landing page at `/c/[slug]`

## Important Implementation Notes

### Firestore Data Serialization

**Critical:** Next.js cannot serialize Firestore Timestamp objects in server components or API responses. Always convert Timestamps to ISO strings:

```typescript
import { Timestamp } from 'firebase/firestore';

function serializeTimestamp(timestamp: Timestamp): string {
  return timestamp.toDate().toISOString();
}
```

Both `lib/firestore.ts` and `lib/firestore-admin.ts` have helper functions that do this automatically.

### Campaign Status Normalization

The database has legacy inconsistencies with campaign status:
- Field can be `campaignStatus` OR `status`
- Values can be `'Active'/'Inactive'` OR `'active'/'paused'/'completed'`

Always use normalization functions:
- `normalizeCampaignStatus()` in `lib/firestore.ts`
- `normalizeCampaignStatusAdmin()` in `lib/firestore-admin.ts`

### Duplicate Lead Prevention

Before submitting a lead, check for duplicates using `isDuplicateLead()` or `isDuplicateLeadAdmin()`:
- Checks same email + campaignId within 60 minutes
- Prevents spam submissions
- Requires composite Firestore index (Firebase will prompt on first use)

### Storm Information Feature

Campaigns can include optional storm metadata displayed on landing pages:
```typescript
interface StormInfo {
  enabled: boolean;
  stormDate: string;
  windSpeed: string;
  hailSize: string;
  affectedAreas: string;
  additionalNotes?: string;
}
```

This is stored in the campaign document and shown in a modal on the landing page.

### Contractor Branding

Contractors can customize their landing pages with:
- Company logo
- Trust badges (insurance, certifications, etc.)
- Crew member profiles (photos, names, titles, bios)

Stored in `contractor_branding` collection, keyed by contractor ID.

### Environment Variables

**Required for development:**
- `NEXT_PUBLIC_FIREBASE_*` - Firebase client config (9 variables)
- `FIREBASE_SERVICE_ACCOUNT` - Firebase Admin SDK credentials (JSON string)
- `SENDGRID_API_KEY` - Email notifications
- `SENDGRID_FROM_EMAIL` - Sender email address
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` - Client-side maps
- `GOOGLE_MAPS_API_KEY` - Server-side geocoding
- `NEXT_PUBLIC_BASE_URL` - Application base URL

See `.env.example` for complete list and instructions.

## AI Agent Development Workflow

This project uses an AI-assisted development workflow with defined roles:

- **Claude (Developer):** Implements features, writes code, maintains session logs in `Agents/Claude/Logs/`
- **GPT5 (Project Manager):** Reviews technical logs, writes user summaries in `User/User Summaries/`
- **Product Owner (Human):** Makes product decisions based on summaries

All development work happens in a secure VM with limited production access. See README.md for full workflow details.

## Common Gotchas

1. **Don't mix client and admin Firebase SDKs** - Use correct import based on context (client component vs API route)
2. **Always serialize Timestamps** - Next.js will error on unserialized Timestamp objects
3. **Check campaign ownership** - All API routes must verify contractor owns the resource being accessed
4. **Geocoding is server-side only** - Never expose `GOOGLE_MAPS_API_KEY` to client
5. **Firestore "in" queries limited to 10 items** - Batch queries when filtering by multiple campaign IDs
6. **Firebase Storage requires download tokens** - Generate UUID token when uploading files
7. **Lead count calculations exclude promoted jobs** - Subtract `promotedToJob: true` leads from totals

## Testing & Debugging

- Use Firebase Emulator Suite for local development (not currently configured)
- Check browser console for client-side Firebase errors
- Check server logs for Admin SDK errors
- Use Firebase Console to inspect Firestore data and Storage files
- Monitor Firebase Auth users in Firebase Console

## Key Files to Know

- `lib/firestore.ts` - Client-side database operations
- `lib/firestore-admin.ts` - Server-side database operations (1500+ lines)
- `lib/firebase.ts` - Firebase client initialization
- `lib/firebase-admin.ts` - Firebase Admin SDK initialization
- `lib/auth-context.tsx` - Authentication context provider
- `lib/mailer.ts` - SendGrid email sending
- `lib/geocoding.ts` - Google Maps geocoding wrapper
- `components/LeadsTab.tsx` - Main dashboard leads interface
- `app/c/[slug]/page.tsx` - Public landing page entry point
