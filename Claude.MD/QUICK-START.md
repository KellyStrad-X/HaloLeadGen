# Quick Start Guide

**Goal**: Get an AI agent up to speed in ~5 minutes.

---

## Essential Context

**What is Halo Lead Gen?**
Roofing contractors create QR code campaigns with damage photos. Homeowners scan QR codes, view local damage, and submit leads. Contractors manage leads through a dashboard.

**Tech Stack**:
- Next.js 15 (App Router)
- Firebase (Firestore + Auth + Storage)
- TypeScript + Tailwind CSS
- Google Maps API

---

## Critical Files to Know

### Core Infrastructure
- `lib/firestore.ts` - Client-side Firestore (public pages)
- `lib/firestore-admin.ts` - Server-side Firestore (API routes, 1500+ lines)
- `lib/auth-context.tsx` - Firebase Auth React context
- `lib/firebase-admin.ts` - Admin SDK initialization

### Dashboard
- `app/(authenticated)/dashboard/page.tsx` - Main dashboard
- `lib/dashboard-sidebar-context.tsx` - Global state for modals/sidebar
- `components/GlobalSidebar.tsx` - Sidebar with all modals

### Campaign Flow
- `components/CreateCampaignModal.tsx` - Campaign creation (modal-based)
- `components/CampaignForm.tsx` - Multi-step form
- `components/PhotoUpload.tsx` - Photo upload + QR generation
- `components/CampaignSuccess.tsx` - Success view in modal

### Lead Management
- `components/LeadsTab.tsx` - Main leads interface with job pipeline
- `components/JobModal.tsx` - Promote leads to jobs

---

## Essential Commands

```bash
npm run dev              # Start dev server (localhost:3000)
npm run build            # Build for production
npm run seed:firestore   # Seed Firebase with test data
```

---

## Key Patterns

### 1. Client vs Admin Firebase SDK
- **Client** (`lib/firestore.ts`): Public pages, read operations
- **Admin** (`lib/firestore-admin.ts`): API routes, write operations, authenticated queries

**Never mix them!** Use client for components, admin for API routes.

### 2. Timestamp Serialization
Firestore Timestamps must be converted to ISO strings before sending to client:

```typescript
// ✅ Good
campaign.createdAt = timestamp.toDate().toISOString();

// ❌ Bad - Next.js will error
return { campaign }; // if campaign.createdAt is a Timestamp
```

Helper functions exist in both firestore files: `serializeCampaign()`, etc.

### 3. Modal System
All modals are managed through `DashboardSidebarContext`:

```typescript
const { openCampaignDetails, openCreateCampaign } = useDashboardSidebar();

<button onClick={() => openCampaignDetails(campaignId)}>
  View Details
</button>
```

Modals live in `GlobalSidebar.tsx` and render based on context state.

### 4. API Authentication
All dashboard API routes require Firebase ID token:

```typescript
const token = await user.getIdToken();
const response = await fetch('/api/dashboard/campaigns', {
  headers: { Authorization: `Bearer ${token}` }
});
```

Server-side verification:
```typescript
const token = req.headers.authorization?.split('Bearer ')[1];
const decodedToken = await adminAuth.verifyIdToken(token);
const contractorId = decodedToken.uid;
```

---

## Current Architecture

### Route Structure
```
app/
├── (authenticated)/          # Protected dashboard routes
│   ├── dashboard/            # Main dashboard UI
│   └── login/signup/         # Auth pages
├── c/[slug]/                 # Public campaign landing pages
├── campaign/[id]/success/    # Legacy success page (mostly unused)
└── api/                      # API routes
    ├── dashboard/            # Authenticated endpoints
    └── campaigns/, leads/    # Public endpoints
```

### Modal-Based Workflow (NEW!)
Campaign creation and details are now fully modal-based:
- No page navigation during campaign creation
- Success view appears in modal
- Dashboard data refreshes automatically
- User stays in context

---

## Common Gotchas

1. **Don't navigate in modals** - Use callbacks and modal state
2. **Always serialize Timestamps** - Next.js errors otherwise
3. **Check auth in API routes** - Verify token and contractor ownership
4. **Geocoding is server-side only** - Never expose API key to client
5. **Lead counts exclude promoted jobs** - Use `promotedToJob: false` filter

---

## Next Steps

1. Read [RECENT-CHANGES.md](./RECENT-CHANGES.md) for latest work
2. Pick an area guide from [README.md](./README.md) based on your task
3. Refer to [Root CLAUDE.md](../CLAUDE.md) for deep architecture details

---

## Getting Help

- **Architecture questions**: See [Root CLAUDE.md](../CLAUDE.md)
- **Area-specific work**: See `Claude.MD/areas/` guides
- **Pattern questions**: See `Claude.MD/patterns/` guides
- **Recent changes**: See [RECENT-CHANGES.md](./RECENT-CHANGES.md)
