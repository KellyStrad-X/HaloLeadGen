# Campaign Management

Campaigns are the core entity in Halo Lead Gen. Each campaign represents a neighborhood-specific QR code marketing effort with damage photos.

---

## Campaign Lifecycle

1. **Creation** - Contractor fills form, uploads photos, QR generated
2. **Active** - QR distributed, landing page live, leads coming in
3. **Inactive** - Campaign paused or completed

**Status Field**: `campaignStatus: 'Active' | 'Inactive'`

---

## Campaign Creation Flow (Modal-Based)

### Overview

Campaign creation is entirely modal-based (no page navigation):

1. User clicks "New Campaign" → Modal opens
2. **Step 1**: Campaign Info Form
3. **Step 2**: Photo Upload
4. **Step 3**: QR Generation (auto)
5. **Success View**: Shows QR code, landing page URL, next steps
6. User clicks "Done" → Modal closes, dashboard refreshes

### Key Components

**CreateCampaignModal** (`components/CreateCampaignModal.tsx`):
- Manages form/success state
- Shows `CampaignForm` or `CampaignSuccess` based on completion
- Receives `onSuccess` callback from GlobalSidebar
- Calls `onSuccess` when campaign completes
- Resets state when closed

**CampaignForm** (`components/CampaignForm.tsx`):
- Multi-step form (3 steps)
- Step 1: Campaign info, address, storm data (optional)
- Step 2: Photo upload
- Step 3: Processing (QR generation happens in Step 2)
- Requires `onSuccess(campaignId)` callback
- Passes callback to PhotoUpload

**PhotoUpload** (`components/PhotoUpload.tsx`):
- Drag-and-drop photo interface
- Uploads photos to Firebase Storage
- Triggers QR generation after upload
- Calls `onSuccess(campaignId)` when complete
- No navigation (modal context)

**CampaignSuccess** (`components/CampaignSuccess.tsx`):
- Displays campaign completion
- Fetches campaign data with auth (`/api/dashboard/campaigns/[id]`)
- Shows QR code with download button
- Shows landing page URL with copy/preview
- Lists next steps
- "Done" button closes modal

### Data Flow

```
User clicks "New Campaign"
  ↓
Modal opens (shows CampaignForm)
  ↓
Step 1: Submit campaign info
  ↓
POST /api/campaigns (creates campaign in Firestore)
  ↓
Returns campaignId, moves to Step 2
  ↓
Step 2: Upload photos
  ↓
POST /api/campaigns/[id]/photos (uploads to Storage)
  ↓
POST /api/campaigns/[id]/generate-qr (creates QR PNG)
  ↓
onSuccess(campaignId) fires
  ↓
Modal switches to CampaignSuccess view
  ↓
Fetches campaign details (with QR URL)
  ↓
Displays success view in modal
  ↓
User clicks "Done"
  ↓
Modal closes, dashboard refreshes
```

---

## Campaign Data Structure

```typescript
interface Campaign {
  id: string;
  contractorId: string;
  campaignName: string;
  showcaseAddress: string;
  qrDisplayName: string;
  pageSlug: string;  // Used in URL: /c/[slug]
  jobStatus: 'Completed' | 'Pending';
  campaignStatus: 'Active' | 'Inactive';

  // Optional
  homeownerName?: string;
  neighborhoodName?: string;

  // Storm info (optional)
  stormInfo?: {
    enabled: boolean;
    stormDate: string;
    windSpeed: string;
    hailSize: string;
    affectedAreas: string;
    additionalNotes?: string;
  };

  // URLs
  qrCodeUrl?: string;
  landingPageUrl?: string;

  // Metadata
  leadCount?: number;
  geocodedLocation?: { lat: number; lng: number };
  createdAt: string;  // ISO timestamp
  updatedAt: string;
}
```

---

## API Endpoints

### Public Endpoints

**POST /api/campaigns**
- Create new campaign
- Requires Firebase Auth token
- Request body: campaign info
- Returns: `{ campaignId }`

**POST /api/campaigns/[id]/photos**
- Upload photos to Firebase Storage
- Requires auth
- Request: multipart/form-data with files
- Returns: `{ photoUrls: string[] }`

**POST /api/campaigns/[id]/generate-qr**
- Generate QR code PNG
- Requires auth
- Stores in Firebase Storage
- Returns: `{ qrCodeUrl, landingPageUrl }`

**GET /api/campaigns/[id]/settings**
- Get campaign settings
- Requires auth
- Returns: `{ settings }`

**PATCH /api/campaigns/[id]/settings**
- Update campaign settings
- Requires auth
- Updates status, job status, etc.

### Dashboard Endpoints

**GET /api/dashboard/campaigns**
- List all campaigns for contractor
- Requires auth
- Returns: `{ campaigns: Campaign[] }`
- Includes lead counts

**GET /api/dashboard/campaigns/[id]**
- Get single campaign details
- Requires auth
- Returns: `{ campaign: Campaign }`

---

## Campaign Management

### Viewing Campaign Details

Click campaign card/row → `openCampaignDetails(campaignId)` → Modal opens

**CampaignDetailsModal** shows:
- Campaign info
- Lead map
- Lead list
- Settings button → opens settings modal

### Editing Campaign Settings

From details modal → Click "Settings" → `CampaignSettingsModal` opens

**Editable Fields**:
- Campaign status (Active/Inactive)
- Job status (Completed/Pending)
- Other metadata

**Pattern**: Nested modals (details modal stays open, settings modal overlays)

### Campaign Filtering

Campaigns can be filtered by:
- Status (All/Active/Inactive)
- Sort by (Date/Name/Lead Count)

Filtering happens client-side after fetching all campaigns.

---

## Photo Management

### Photo Upload Process

1. User selects/drops photos
2. Preview shown in UI
3. Click "Upload Photos"
4. Each photo uploaded to Firebase Storage individually
5. Progress bar shows upload status
6. Photos stored at: `campaigns/[campaignId]/photos/[filename]`
7. Public URLs with download tokens returned

### Photo Limits

- **Max file size**: 50MB per photo
- **Supported formats**: JPEG, PNG, WEBP
- **Recommended**: 3-6 photos showing visible damage

### Photo Display

- Landing page: Grid layout, lightbox on click
- Dashboard: Thumbnails in campaign details

---

## QR Code Generation

### Process

1. After photos uploaded, QR generation triggered automatically
2. Server-side generation using `qrcode` library
3. QR data: Landing page URL (`/c/[slug]`)
4. PNG file (1024x1024px) stored in Firebase Storage
5. Public URL returned

### QR Code Usage

- Contractor downloads QR PNG
- Prints on door hangers, yard signs, flyers
- Homeowners scan → Opens landing page

---

## Landing Pages

**URL**: `/c/[slug]`

**Public-facing page** showing:
- Damage photos in grid
- Contractor branding (logo, trust badges)
- Storm information (if enabled)
- Lead capture form
- Map modal (service radius)

**No authentication required** - designed for homeowners

---

## Common Patterns

### Creating Campaign from Dashboard

```typescript
const { openCreateCampaign } = useDashboardSidebar();

<button onClick={openCreateCampaign}>
  New Campaign
</button>
```

### Opening Campaign Details

```typescript
const { openCampaignDetails } = useDashboardSidebar();

<div onClick={() => openCampaignDetails(campaign.id)}>
  {campaign.campaignName}
</div>
```

### Updating Campaign Status

```typescript
const response = await fetch(`/api/campaigns/${id}/settings`, {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({
    campaignStatus: 'Inactive'
  })
});
```

---

## Related Guides

- [DASHBOARD.md](./DASHBOARD.md) - Dashboard architecture
- [MODALS.md](./MODALS.md) - Modal patterns
- [FIREBASE.md](../patterns/FIREBASE.md) - Firestore patterns
- [API-ROUTES.md](../patterns/API-ROUTES.md) - API patterns
