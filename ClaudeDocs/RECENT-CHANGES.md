# Recent Changes

**Last Updated**: 2025-10-24

This document tracks major implementations and breaking changes. Read this before starting work to understand the current state of the codebase.

---

## 2025-10-24: Modal-Based Campaign Creation

**Status**: ✅ Completed, tested, and deployed

### What Changed

Campaign creation has been completely converted from a standalone page to a modal-based flow:

**Before**:
- `/create-campaign` page existed
- User navigated to separate page
- After completion, redirected to `/campaign/[id]/success` page
- Lost dashboard context

**After**:
- No `/create-campaign` page (deleted)
- "New Campaign" button opens modal
- All steps happen in modal (info → photos → QR generation)
- Success view appears in modal
- Modal closes, dashboard refreshes
- User never leaves dashboard

### Key Files Modified

**New Components**:
- `components/CampaignSuccess.tsx` - Reusable success view (shows QR, URL, next steps)

**Updated Components**:
- `components/CreateCampaignModal.tsx` - Manages form/success state
- `components/CampaignForm.tsx` - Accepts `onSuccess` callback with campaignId
- `components/PhotoUpload.tsx` - Calls `onSuccess` instead of navigating
- `components/GlobalSidebar.tsx` - Renders CreateCampaignModal
- `lib/dashboard-sidebar-context.tsx` - Added `createCampaignModal` state

**Fixed Links** (all converted to modal triggers):
- `app/(authenticated)/dashboard/campaigns/page.tsx`
- `components/CampaignsTab.tsx`
- `components/SuccessPageClient.tsx` (changed to "Go to Dashboard")

### Breaking Changes

❌ **Removed**: `/create-campaign` route
❌ **Removed**: Navigation after campaign creation
✅ **Added**: `onSuccess(campaignId)` callback pattern
✅ **Added**: Modal-based success view

### API Changes

- `CampaignSuccess` now uses authenticated endpoint: `/api/dashboard/campaigns/[id]` (not `/api/campaigns/[id]`)
- All success data fetched with Firebase Auth token

### Developer Notes

- `PhotoUpload` no longer imports `useRouter` (removed navigation)
- `CampaignForm` requires `onSuccess` prop (no longer optional)
- `onUploadComplete` prop removed from `PhotoUpload` (was dead code)
- Success flow is now: `PhotoUpload` → `onSuccess(campaignId)` → Modal switches to `CampaignSuccess`

---

## 2025-10-20: Lead-to-Job Promotion Pipeline

**Status**: ✅ Completed

### What Changed

Leads can now be promoted to "Jobs" with additional tracking:
- New `job` object embedded in lead documents
- Separate job statuses: `scheduled`, `in_progress`, `completed`
- Campaign filtering in job pipeline
- Drag-and-drop job board interface

### Key Files

- `components/LeadsTab.tsx` - Rewritten with combined leads/jobs board
- `components/JobModal.tsx` - Promotion and edit modal
- `app/api/dashboard/jobs/` - New API endpoints
- `lib/firestore-admin.ts` - Job helper functions (`promoteLeadToJobAdmin`, etc.)

### Data Structure

Promoted leads have:
```typescript
{
  promotedToJob: true,
  job: {
    status: 'scheduled' | 'in_progress' | 'completed',
    scheduledInspectionDate: string,
    inspector: string,
    internalNotes: string,
    promotedAt: string,
    completedAt?: string
  }
}
```

---

## 2025-10-19: Dashboard Color Palette Update

**Status**: ✅ Completed

Color scheme updated for better contrast and GitHub-inspired dark theme:
- Background: `#0d1117`, `#1e2227`, `#2d333b`
- Borders: `#373e47`, `#444c56`
- Status colors: Cyan (active), Green (completed), Orange (pending)

---

## 2025-10-17: Tabbed Dashboard

**Status**: ✅ Completed

Dashboard converted to tabbed interface:
- Overview, Analytics, Campaigns, Leads tabs
- Persistent sidebar with modals
- Tab-specific content rendering

---

## 2025-10-15: Firebase Admin Migration

**Status**: ✅ Completed

Migrated from client SDK to Admin SDK for server-side operations:
- `lib/firebase-admin.ts` - Admin initialization
- Storage uploads now use Admin SDK
- Signed download URLs for security
- Environment variable: `FIREBASE_SERVICE_ACCOUNT`

---

## Breaking Changes Summary

### Current Breaking Changes to Be Aware Of

1. **Campaign Creation**: Must use modal, not page navigation
2. **PhotoUpload**: Requires `onSuccess` callback
3. **Success Views**: Use authenticated API endpoints
4. **Job Data**: Check `promotedToJob` when querying leads

### Deprecated Patterns

❌ **Don't do this**:
```typescript
router.push('/create-campaign');  // Route doesn't exist
```

✅ **Do this**:
```typescript
const { openCreateCampaign } = useDashboardSidebar();
openCreateCampaign();
```

❌ **Don't do this**:
```typescript
fetch(`/api/campaigns/${id}`);  // Wrong endpoint
```

✅ **Do this**:
```typescript
const token = await user.getIdToken();
fetch(`/api/dashboard/campaigns/${id}`, {
  headers: { Authorization: `Bearer ${token}` }
});
```

---

## Upcoming Work

*To be determined based on product priorities*

Potential areas:
- Enhanced analytics/reporting
- Multi-campaign bulk operations
- Email template customization
- Advanced job pipeline features

---

## Maintenance Notes

This file should be updated after significant implementations. User will prompt for updates when needed.
