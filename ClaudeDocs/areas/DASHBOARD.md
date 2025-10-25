# Dashboard Architecture

**Path**: `app/(authenticated)/dashboard/`

The dashboard is the central hub for contractors to manage campaigns, leads, and jobs.

---

## Architecture Overview

### Tabbed Interface

The dashboard uses a tabbed layout with persistent sidebar:

**Tabs**:
- **Overview** - Summary stats, recent activity, Halo Map
- **Analytics** - Metrics and reporting (placeholder for future work)
- **Campaigns** - Campaign list and management
- **Leads** - Lead pipeline and job management

**Tab State**: Managed via `DashboardContext` in `layout.tsx`

### File Structure

```
app/(authenticated)/dashboard/
├── layout.tsx              # Tab navigation, context provider
├── page.tsx                # Overview tab content
├── campaigns/
│   └── page.tsx            # Campaigns tab content
└── jobs/                   # (Jobs moved to LeadsTab component)
```

---

## Global State Management

### Dashboard Sidebar Context

**File**: `lib/dashboard-sidebar-context.tsx`

Manages global dashboard state:
- Sidebar collapsed/expanded state
- Modal visibility (campaign details, campaign settings, create campaign, lead details, restore lead, job)
- Modal data (which campaign/lead is selected)

**Key State**:
```typescript
{
  collapsed: boolean,
  campaignDetailsModal: { campaignId: string | null, isOpen: boolean },
  campaignSettingsModal: { campaignId: string | null, isOpen: boolean },
  createCampaignModal: { isOpen: boolean },
  leadDetailsModal: { leadId: string | null, isOpen: boolean },
  restoreLeadModal: { leadId: string | null, isOpen: boolean },
  jobModal: { leadId: string | null, mode: 'promote' | 'edit', isOpen: boolean }
}
```

**Key Functions**:
- `toggleSidebar()` - Toggle sidebar
- `openCampaignDetails(campaignId)` - Open campaign modal
- `openCreateCampaign()` - Open create campaign modal
- `openLeadDetails(leadId)` - Open lead modal
- `openJobModal(leadId, mode)` - Open job promotion/edit modal
- Close functions for each modal

**Usage**:
```typescript
const { openCampaignDetails, createCampaignModal } = useDashboardSidebar();

<button onClick={() => openCampaignDetails(campaign.id)}>
  View Details
</button>

{createCampaignModal.isOpen && <CreateCampaignModal ... />}
```

---

## Key Components

### GlobalSidebar

**File**: `components/GlobalSidebar.tsx`

The persistent sidebar that contains:
- All modal components (rendered based on context state)
- Data loading logic (campaigns, leads for sidebar display)
- Refresh functions passed to modals

**Modals Rendered**:
- `CampaignDetailsModal`
- `CampaignSettingsModal`
- `CreateCampaignModal`
- `LeadDetailsModal`
- `RestoreModal`
- `JobModal`

**Pattern**: Modals receive `onSuccess` callbacks to refresh data:
```typescript
<CreateCampaignModal
  isOpen={createCampaignModal.isOpen}
  onClose={closeCreateCampaign}
  onSuccess={() => {
    loadData();      // Refresh sidebar data
    refreshSidebar(); // Trigger re-render
  }}
/>
```

### Dashboard Tabs

**Overview Tab** (`dashboard/page.tsx`):
- Summary statistics (total campaigns, active campaigns, leads, jobs)
- Recent leads list
- Recent campaigns list
- Halo Map showing all campaigns

**Campaigns Tab** (`dashboard/campaigns/page.tsx`):
- Full campaign list with filters/sorting
- Campaign status badges
- Click to open campaign details modal

**Leads Tab** (`components/LeadsTab.tsx`):
- Combined leads + jobs pipeline board
- Campaign filter
- Drag-and-drop job status updates
- Promote leads to jobs
- Lead details modals

---

## Data Flow

### Loading Dashboard Data

1. **Initial Load**: Each tab loads its own data on mount
2. **Sidebar**: GlobalSidebar loads campaigns/leads for sidebar display
3. **Modals**: Modals load specific item data when opened

### Refresh Pattern

When data changes (create campaign, update lead, etc.):
1. Modal's `onSuccess` callback fires
2. Calls `loadData()` / `refreshSidebar()` in GlobalSidebar
3. Triggers re-fetch of dashboard data
4. UI updates automatically

---

## Common Tasks

### Adding a New Modal

1. Create modal component in `components/`
2. Add state to `DashboardSidebarContext`:
   ```typescript
   const [myModal, setMyModal] = useState({ isOpen: false, data: null });
   const openMyModal = (data) => setMyModal({ isOpen: true, data });
   const closeMyModal = () => setMyModal({ isOpen: false, data: null });
   ```
3. Add to context provider value
4. Render in `GlobalSidebar.tsx`:
   ```typescript
   {myModal.isOpen && <MyModal ... />}
   ```
5. Use in components:
   ```typescript
   const { openMyModal } = useDashboardSidebar();
   ```

### Adding Dashboard Stats

Update summary API endpoint: `app/api/dashboard/summary/route.ts`

Add stat calculation, return in response, display in `dashboard/page.tsx`

### Adding a New Tab

1. Add tab to navigation in `dashboard/layout.tsx`
2. Create page at `dashboard/[tab-name]/page.tsx`
3. Add tab state to `DashboardTab` type
4. Handle active state in layout

---

## Patterns to Follow

### Modal Management

✅ **Do**: Use sidebar context for all modal state
✅ **Do**: Pass `onSuccess` callbacks for data refresh
✅ **Do**: Reset modal state on close

❌ **Don't**: Navigate to new pages from modals
❌ **Don't**: Manage modal state locally in components

### Data Loading

✅ **Do**: Load data on component mount with useEffect
✅ **Do**: Show loading states
✅ **Do**: Handle errors gracefully

❌ **Don't**: Load data globally if only one tab needs it
❌ **Don't**: Forget to refresh after mutations

### Authentication

✅ **Do**: Use `useAuth()` hook to get current user
✅ **Do**: Get ID token for API calls: `user.getIdToken()`
✅ **Do**: Handle loading/unauthenticated states

---

## Related Guides

- [MODALS.md](./MODALS.md) - Modal system patterns
- [CAMPAIGNS.md](./CAMPAIGNS.md) - Campaign management
- [LEADS.md](./LEADS.md) - Lead/job pipeline
- [COMPONENTS.md](../patterns/COMPONENTS.md) - Component patterns
