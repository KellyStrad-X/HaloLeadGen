# Modal System Architecture

The dashboard uses a centralized modal system managed through React context. All modals are rendered in `GlobalSidebar` and controlled via `DashboardSidebarContext`.

---

## Why This Pattern?

**Benefits**:
- Single source of truth for modal state
- No prop drilling through component tree
- Easy to open modals from anywhere
- Modals stay open during route changes (future-proof)
- Data refresh callbacks centralized

**Trade-offs**:
- All modals rendered in DOM (hidden when not open)
- Context slightly more complex
- Must use context hook (can't be used outside dashboard)

---

## Architecture

### Context Provider

**File**: `lib/dashboard-sidebar-context.tsx`

Provides modal state and control functions:

```typescript
interface DashboardSidebarContextType {
  // Sidebar
  collapsed: boolean;
  toggleSidebar: () => void;

  // Campaign Modals
  campaignDetailsModal: { campaignId: string | null; isOpen: boolean };
  openCampaignDetails: (campaignId: string) => void;
  closeCampaignDetails: () => void;

  campaignSettingsModal: { campaignId: string | null; isOpen: boolean };
  openCampaignSettings: (campaignId: string) => void;
  closeCampaignSettings: () => void;

  createCampaignModal: { isOpen: boolean };
  openCreateCampaign: () => void;
  closeCreateCampaign: () => void;

  // Lead Modals
  leadDetailsModal: { leadId: string | null; isOpen: boolean };
  openLeadDetails: (leadId: string) => void;
  closeLeadDetails: () => void;

  restoreLeadModal: { leadId: string | null; isOpen: boolean };
  openRestoreLead: (leadId: string) => void;
  closeRestoreLead: () => void;

  // Job Modal
  jobModal: {
    leadId: string | null;
    mode: 'promote' | 'edit' | null;
    isOpen: boolean;
  };
  openJobModal: (leadId: string, mode: 'promote' | 'edit') => void;
  closeJobModal: () => void;
}
```

### Modal Container

**File**: `components/GlobalSidebar.tsx`

Renders all modals based on context state:

```typescript
return (
  <>
    {/* Campaign Modals */}
    {campaignDetailsModal.isOpen && (
      <CampaignDetailsModal
        campaignId={campaignDetailsModal.campaignId!}
        onClose={closeCampaignDetails}
      />
    )}

    {createCampaignModal.isOpen && (
      <CreateCampaignModal
        isOpen={createCampaignModal.isOpen}
        onClose={closeCreateCampaign}
        onSuccess={() => {
          loadData();
          refreshSidebar();
        }}
      />
    )}

    {/* Lead Modals */}
    {leadDetailsModal.isOpen && (
      <LeadDetailsModal
        leadId={leadDetailsModal.leadId!}
        onClose={closeLeadDetails}
      />
    )}

    {/* ... other modals */}
  </>
);
```

---

## Modal Patterns

### Basic Modal Component

```typescript
interface MyModalProps {
  isOpen: boolean;
  onClose: () => void;
  dataId?: string;
  onSuccess?: () => void;
}

export default function MyModal({ isOpen, onClose, dataId, onSuccess }: MyModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-[#1e2227] rounded-xl border border-[#373e47] max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#373e47]">
          <h2>Modal Title</h2>
          <button onClick={onClose}>
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          {/* Modal content */}
        </div>
      </div>
    </div>
  );
}
```

### Modal with Data Loading

```typescript
export default function DataModal({ itemId, onClose }: Props) {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const token = await user.getIdToken();
      const response = await fetch(`/api/items/${itemId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await response.json();
      setData(result.item);
      setLoading(false);
    }
    fetchData();
  }, [itemId, user]);

  if (loading) return <LoadingSpinner />;

  return (
    // ... modal UI
  );
}
```

### Modal with Success Callback

```typescript
export default function ActionModal({ onClose, onSuccess }: Props) {
  const handleSubmit = async () => {
    // ... perform action
    await updateData();

    // Notify parent to refresh
    if (onSuccess) {
      onSuccess();
    }

    // Close modal
    onClose();
  };

  return (
    // ... modal UI with submit button
  );
}
```

---

## Modal Types

### Information Modals

Show data, no mutations:
- `CampaignDetailsModal` - View campaign info, leads, map
- `LeadDetailsModal` - View lead details, status history

**Pattern**: Load data, display read-only UI, close button

### Action Modals

Perform mutations:
- `CreateCampaignModal` - Create new campaign
- `JobModal` - Promote lead or edit job
- `CampaignSettingsModal` - Update campaign settings

**Pattern**: Form UI, submit action, call `onSuccess`, close

### Confirmation Modals

Confirm destructive actions:
- `RestoreModal` - Confirm lead restoration

**Pattern**: Warning message, confirm/cancel buttons

### Multi-State Modals

Show different views based on state:
- `CreateCampaignModal` - Shows form OR success view

**Pattern**: Internal state switches between views

```typescript
const [completedCampaignId, setCompletedCampaignId] = useState(null);

return (
  <Modal>
    {completedCampaignId ? (
      <SuccessView campaignId={completedCampaignId} />
    ) : (
      <FormView onSuccess={setCompletedCampaignId} />
    )}
  </Modal>
);
```

---

## Best Practices

### Opening Modals

✅ **Do**: Use context functions
```typescript
const { openCampaignDetails } = useDashboardSidebar();
openCampaignDetails(campaign.id);
```

❌ **Don't**: Manage modal state locally
```typescript
// Don't do this
const [isOpen, setIsOpen] = useState(false);
```

### Closing Modals

✅ **Do**: Call `onClose` prop
```typescript
<button onClick={onClose}>Close</button>
```

✅ **Do**: Close after successful action
```typescript
await saveChanges();
onSuccess?.();
onClose();
```

❌ **Don't**: Navigate away from modals
```typescript
// Don't do this
router.push('/somewhere');
```

### Data Refresh

✅ **Do**: Use `onSuccess` callbacks
```typescript
<Modal
  onSuccess={() => {
    loadData();
    refreshUI();
  }}
/>
```

❌ **Don't**: Assume data refreshes automatically
```typescript
// Data won't update without callback
<Modal onClose={onClose} />
```

### Modal State

✅ **Do**: Reset state when closing
```typescript
const handleClose = () => {
  setInternalState(null);
  onClose();
};
```

✅ **Do**: Handle modal being closed externally
```typescript
useEffect(() => {
  if (!isOpen) {
    // Reset state
    setInternalState(null);
  }
}, [isOpen]);
```

---

## Nested Modals

**Example**: Campaign Details → Settings

Settings modal renders on top of details modal:

```typescript
// In GlobalSidebar
{campaignDetailsModal.isOpen && (
  <CampaignDetailsModal ... />
)}

{campaignSettingsModal.isOpen && (
  <CampaignSettingsModal ... />
)}
```

**Z-Index**: Settings modal has higher z-index, appears on top

**Behavior**: Settings closes → Details still visible underneath

---

## Adding a New Modal

1. **Create modal component** in `components/`
   ```typescript
   export default function MyModal({ isOpen, onClose }: Props) {
     if (!isOpen) return null;
     // ... modal UI
   }
   ```

2. **Add state to context** (`lib/dashboard-sidebar-context.tsx`):
   ```typescript
   const [myModal, setMyModal] = useState({ isOpen: false, data: null });

   const openMyModal = (data) => {
     setMyModal({ isOpen: true, data });
   };

   const closeMyModal = () => {
     setMyModal({ isOpen: false, data: null });
   };
   ```

3. **Add to context value**:
   ```typescript
   return (
     <DashboardSidebarContext.Provider
       value={{
         // ... existing
         myModal,
         openMyModal,
         closeMyModal,
       }}
     >
   ```

4. **Render in GlobalSidebar**:
   ```typescript
   const { myModal, closeMyModal } = useDashboardSidebar();

   return (
     <>
       {/* ... other modals */}
       {myModal.isOpen && (
         <MyModal
           isOpen={myModal.isOpen}
           data={myModal.data}
           onClose={closeMyModal}
         />
       )}
     </>
   );
   ```

5. **Use in components**:
   ```typescript
   const { openMyModal } = useDashboardSidebar();

   <button onClick={() => openMyModal(someData)}>
     Open Modal
   </button>
   ```

---

## Common Patterns

### Modal with Form

```typescript
const [formData, setFormData] = useState(initialData);
const [isSubmitting, setIsSubmitting] = useState(false);

const handleSubmit = async (e) => {
  e.preventDefault();
  setIsSubmitting(true);

  try {
    await submitData(formData);
    onSuccess?.();
    onClose();
  } catch (error) {
    // Show error
  } finally {
    setIsSubmitting(false);
  }
};
```

### Modal with Tabs

```typescript
const [activeTab, setActiveTab] = useState('info');

return (
  <Modal>
    <Tabs>
      <Tab onClick={() => setActiveTab('info')}>Info</Tab>
      <Tab onClick={() => setActiveTab('settings')}>Settings</Tab>
    </Tabs>

    {activeTab === 'info' && <InfoView />}
    {activeTab === 'settings' && <SettingsView />}
  </Modal>
);
```

---

## Related Guides

- [DASHBOARD.md](./DASHBOARD.md) - Dashboard context
- [CAMPAIGNS.md](./CAMPAIGNS.md) - Campaign modals
- [LEADS.md](./LEADS.md) - Lead/job modals
- [COMPONENTS.md](../patterns/COMPONENTS.md) - Component patterns
