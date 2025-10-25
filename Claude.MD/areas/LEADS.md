# Lead & Job Management

Leads are captured from homeowners who scan QR codes and submit contact information. Leads can be promoted to "Jobs" for tracking through the inspection/completion lifecycle.

---

## Lead Lifecycle

### Lead Statuses

1. **new** - Just submitted, not yet contacted
2. **contacted** - Contractor reached out
3. **qualified** - Homeowner interested, potential job
4. **closed** - Job won/completed elsewhere
5. **lost** - Not interested or bad fit

### Job Statuses (After Promotion)

1. **scheduled** - Inspection date set
2. **in_progress** - Inspection completed, proposal sent
3. **completed** - Job finished

**Key Field**: `promotedToJob: boolean` - Distinguishes leads from jobs

---

## Lead Data Structure

```typescript
interface Lead {
  id: string;
  campaignId: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  notes?: string;

  // Status tracking
  status: 'new' | 'contacted' | 'qualified' | 'closed' | 'lost';
  statusHistory: Array<{
    status: string;
    timestamp: string;
    notes?: string;
  }>;

  // Job promotion
  promotedToJob: boolean;
  job?: {
    status: 'scheduled' | 'in_progress' | 'completed';
    scheduledInspectionDate: string;
    inspector: string;
    internalNotes: string;
    promotedAt: string;
    completedAt?: string;
  };

  // Metadata
  geocodedLocation?: { lat: number; lng: number };
  createdAt: string;
  updatedAt: string;
}
```

---

## Lead Pipeline UI

**File**: `components/LeadsTab.tsx`

### Board Layout

Combined leads + jobs pipeline board with campaign filtering:

```
┌─ Campaign Filter ────────────────────────────┐
│ [All Campaigns ▼]  Leads: 5 / Jobs: 3       │
└──────────────────────────────────────────────┘

┌─ Leads Column ─┐ ┌─ Scheduled ─┐ ┌─ In Progress ─┐ ┌─ Completed ─┐
│ • New lead     │ │ • Job 1     │ │ • Job 2       │ │ • Job 3     │
│ • Lead 2       │ │ • Job 4     │ │               │ │              │
│ [Drag here]    │ └─────────────┘ └───────────────┘ └──────────────┘
└────────────────┘
      ↓ Drag to promote
```

### Features

- **Campaign filter**: Shows leads/jobs for specific campaign or all
- **Lead count badges**: "Leads X / Jobs Y"
- **Drag-and-drop**:
  - Drag lead to job column → Opens promotion modal
  - Drag job between columns → Updates status
- **Mobile support**: Tap cards for action menu (no drag)
- **Card actions**: View details, promote, update status

---

## Lead-to-Job Promotion

### Process

1. User drags lead to "Scheduled" column (or clicks "Promote" on mobile)
2. `JobModal` opens in "promote" mode
3. User enters:
   - Inspector name
   - Scheduled inspection date
   - Internal notes
4. Submit → API creates job object within lead document
5. Lead marked as `promotedToJob: true`
6. Lead filtered from leads column
7. Job appears in "Scheduled" column

### Job Modal

**File**: `components/JobModal.tsx`

**Modes**:
- **promote**: Promote lead to job (pre-fills lead info)
- **edit**: Update existing job details

**Fields**:
- Inspector (text input)
- Scheduled Date (date picker)
- Internal Notes (textarea)
- Pre-filled: Homeowner name, address, phone, email

### Job Updates

Drag job card between columns → Status updates automatically:
- **Scheduled** → **In Progress**: Job starts
- **In Progress** → **Completed**: Job finished (sets `completedAt`)

Or click job card → Edit details via modal

---

## API Endpoints

### Lead Management

**GET /api/dashboard/leads**
- List all leads for contractor
- Requires auth
- Query params: `?campaignId=...` (optional filter)
- Returns: `{ leads: Lead[] }`
- Excludes promoted jobs by default

**GET /api/dashboard/leads/[leadId]**
- Get single lead details
- Requires auth
- Returns: `{ lead: Lead }`

**PATCH /api/dashboard/leads/[leadId]**
- Update lead status/notes
- Requires auth
- Body: `{ status, notes }`

**DELETE /api/dashboard/leads/[leadId]**
- Soft delete (marks as deleted)
- Requires auth

**POST /api/dashboard/leads/[leadId]/restore**
- Restore soft-deleted lead
- Requires auth

**POST /api/dashboard/leads/[leadId]/contact-attempt**
- Log contact attempt
- Adds to status history

**POST /api/dashboard/leads/[leadId]/tentative-date**
- Set tentative inspection date
- Used before promotion

### Job Management

**POST /api/dashboard/jobs**
- Promote lead to job
- Requires auth
- Body: `{ leadId, inspector, scheduledInspectionDate, internalNotes }`
- Returns: `{ job }`

**PATCH /api/dashboard/jobs/[leadId]**
- Update job details or status
- Requires auth
- Body: `{ status, inspector, scheduledInspectionDate, internalNotes }`

**GET /api/dashboard/jobs**
- Get jobs grouped by status
- Requires auth
- Query params: `?campaignId=...` (optional)
- Returns: `{ scheduled: [], inProgress: [], completed: [] }`

---

## Lead Capture (Public)

### Landing Page Form

**File**: `app/c/[slug]/page.tsx`

Homeowners fill form on campaign landing page:
- Name
- Email
- Phone
- Address
- Notes (optional)

### Submission Process

1. Form validates client-side
2. POST to `/api/leads`
3. Server checks for duplicates (same email + campaign within 60 min)
4. Creates lead document in Firestore
5. Sends email notification to contractor
6. Redirects to success page showing next steps

### Duplicate Prevention

**Function**: `isDuplicateLeadAdmin()` in `lib/firestore-admin.ts`

Checks for duplicate submissions:
- Same `email` + `campaignId`
- Within 60 minutes
- Prevents spam/accidental resubmissions

**Note**: Requires Firestore composite index on `[email, campaignId, createdAt]`

---

## Lead Details Modal

**File**: `components/LeadDetailsModal.tsx`

Shows complete lead information:
- Homeowner details
- Address (with map link)
- Lead notes
- Status history timeline
- Actions: Update status, add notes, delete, restore

Opened via:
```typescript
const { openLeadDetails } = useDashboardSidebar();
openLeadDetails(lead.id);
```

---

## Campaign Filtering

Leads/jobs can be filtered by campaign:

**UI**: Dropdown showing campaigns sorted by new lead count

**Behavior**:
- "All Campaigns" → Shows all leads/jobs
- Select campaign → Filters to that campaign only
- Drag/drop restricted to active campaign context
- Badge shows count for filtered campaign

**Implementation**: Client-side filtering after fetching all data

---

## Email Notifications

When lead is submitted:
1. Email sent to contractor via SendGrid
2. Email includes all lead details
3. Link to dashboard
4. Campaign context (neighborhood, landing page URL)

**Configuration**: `lib/mailer.ts`

---

## Lead Analytics

### Dashboard Summary

Overview tab shows:
- Total leads count
- New leads (status = 'new')
- Active jobs (promoted leads)
- Completion rate

### Campaign-Specific Metrics

Campaign details modal shows:
- Lead count for that campaign
- Lead map (geocoded addresses)
- Lead list with statuses

---

## Common Patterns

### Fetching Leads

```typescript
const token = await user.getIdToken();
const response = await fetch('/api/dashboard/leads', {
  headers: { Authorization: `Bearer ${token}` }
});
const { leads } = await response.json();
```

### Promoting Lead to Job

```typescript
const token = await user.getIdToken();
const response = await fetch('/api/dashboard/jobs', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({
    leadId: lead.id,
    inspector: 'John Smith',
    scheduledInspectionDate: '2025-11-01',
    internalNotes: 'Large roof, 2-story'
  })
});
```

### Updating Job Status

```typescript
const response = await fetch(`/api/dashboard/jobs/${leadId}`, {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({
    status: 'completed'
  })
});
```

---

## Lead Count Calculations

**Important**: Lead counts should **exclude promoted jobs**

```typescript
// ❌ Wrong - includes jobs
const leadCount = allLeads.length;

// ✅ Correct - excludes jobs
const leadCount = allLeads.filter(lead => !lead.promotedToJob).length;
```

Helper functions in `lib/firestore-admin.ts` handle this automatically.

---

## Related Guides

- [DASHBOARD.md](./DASHBOARD.md) - Dashboard architecture
- [CAMPAIGNS.md](./CAMPAIGNS.md) - Campaign management
- [MODALS.md](./MODALS.md) - Modal patterns
- [API-ROUTES.md](../patterns/API-ROUTES.md) - API patterns
- [MAPS.md](./MAPS.md) - Geocoding for lead addresses
