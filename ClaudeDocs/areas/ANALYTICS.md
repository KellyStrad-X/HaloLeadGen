# Analytics & Reporting

Analytics features in Halo Lead Gen provide contractors with insights into campaign performance, lead generation, and job conversion rates.

**Current Status**: Basic metrics implemented, advanced analytics placeholder for future development.

---

## Dashboard Summary Stats

**Location**: Dashboard Overview Tab (`app/(authenticated)/dashboard/page.tsx`)

### Current Metrics

**Displayed Stats**:
- Total Campaigns
- Active Campaigns
- Total Leads (excluding promoted jobs)
- Active Jobs

**Data Source**: `/api/dashboard/summary`

**Calculation**: Aggregates data from Firestore collections

---

## Campaign Metrics

**Location**: Campaign Details Modal, Campaigns Tab

### Per-Campaign Stats

- **Lead Count**: Number of leads submitted for this campaign
- **Job Count**: Number of leads promoted to jobs
- **Conversion Rate**: Jobs / Leads ratio
- **Campaign Status**: Active vs Inactive
- **Created Date**: When campaign launched

### Campaign Performance Indicators

**High Performance Signs**:
- Multiple leads per week
- High lead-to-job conversion
- Active status maintained

**Low Performance Signs**:
- No leads after 2+ weeks
- Low conversion rate
- Inactive status

---

## Lead Pipeline Metrics

**Location**: Leads Tab (`components/LeadsTab.tsx`)

### Current Display

- **Leads Count**: Unpromoted leads
- **Jobs Count**: Promoted leads
- **Status Breakdown**: By lead status (new, contacted, qualified, etc.)
- **Job Status Breakdown**: By job status (scheduled, in progress, completed)

### Campaign Filtering

Metrics update when filtering by campaign:
- Shows lead/job counts for selected campaign
- Provides focused view of single campaign performance

---

## Future Analytics Features

### Planned Metrics

**Campaign Analytics**:
- QR code scan rate (requires tracking implementation)
- Landing page views (requires analytics integration)
- Lead submission rate (views → submissions)
- Average time to first lead
- Geographic lead distribution (heat map)

**Lead Analytics**:
- Response time tracking
- Lead quality scoring
- Status transition times
- Lost lead reasons analysis
- Follow-up effectiveness

**Job Analytics**:
- Inspection-to-close rate
- Average job value (requires integration)
- Completion time metrics
- Inspector performance comparison

**Financial Metrics** (future):
- Revenue per campaign
- Cost per lead
- ROI calculations
- Profit margins

---

## Analytics Tab

**Location**: Dashboard Analytics Tab

**Current State**: Placeholder tab

**Planned Implementation**:
- Interactive charts (Chart.js or similar)
- Date range filtering
- Export capabilities
- Comparative views (campaign vs campaign)

---

## Data Collection Patterns

### Tracking Events

**Future Pattern**:
```typescript
// Track campaign view
await logEvent('campaign_view', {
  campaignId: campaign.id,
  source: 'qr_scan' | 'direct_link',
  timestamp: new Date().toISOString()
});

// Track lead submission
await logEvent('lead_submit', {
  campaignId: campaign.id,
  timestamp: new Date().toISOString()
});
```

**Storage**: Events collection in Firestore or external analytics service

### Aggregating Metrics

**Current Pattern**:
```typescript
// Calculate metrics on-demand
const totalLeads = await getLeadsCountAdmin(contractorId);
const activeJobs = await getActiveJobsCountAdmin(contractorId);
```

**Future Pattern**: Pre-aggregated counts in contractor document or analytics collection

---

## API Endpoints

### Current

**GET /api/dashboard/summary**
- Returns summary statistics
- Requires auth
- Response:
  ```typescript
  {
    totalCampaigns: number,
    activeCampaigns: number,
    totalLeads: number,
    activeJobs: number
  }
  ```

### Planned

**GET /api/dashboard/analytics**
- Time-series data for charts
- Date range filtering
- Metric selection

**GET /api/dashboard/campaigns/[id]/analytics**
- Campaign-specific detailed metrics
- Lead sources breakdown
- Conversion funnel

---

## Reporting

### Export Capabilities (Planned)

**Campaign Reports**:
- PDF summary of campaign performance
- Lead list with contact details
- Maps showing lead locations

**CSV Exports**:
- Lead data for CRM import
- Campaign performance data
- Job pipeline status

---

## Integration Opportunities

### Google Analytics

Track public-facing pages:
- Landing page views
- Form submissions
- QR scan sources (UTM parameters)

### CRM Integration

Export data to popular CRMs:
- Salesforce
- HubSpot
- Zoho

### Email Marketing

Sync leads to email platforms:
- Mailchimp
- SendGrid marketing
- ActiveCampaign

---

## Performance Considerations

### Caching Metrics

For frequently accessed metrics:
1. Pre-calculate and store in Firestore
2. Update via background functions or scheduled jobs
3. Invalidate cache on data changes

### Real-Time vs Batch

**Real-Time** (current):
- Dashboard summary
- Lead counts
- Campaign status

**Batch** (future):
- Historical trend analysis
- Complex aggregations
- Report generation

---

## Chart Implementations (Future)

### Recommended Libraries

- **Chart.js**: Simple, lightweight
- **Recharts**: React-native, good for Next.js
- **Victory**: Highly customizable
- **D3.js**: Most powerful, steeper learning curve

### Chart Types

**Line Charts**:
- Leads over time
- Campaign performance trends

**Bar Charts**:
- Lead status distribution
- Campaign comparison

**Pie Charts**:
- Lead sources
- Job status breakdown

**Heat Maps**:
- Geographic lead density
- Best-performing neighborhoods

---

## Analytics Dashboard Layout (Planned)

```
┌────────────────────────────────────────────────┐
│ Date Range: [Last 30 Days ▼]     [Export ▼]   │
├────────────────────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│ │  Leads   │ │   Jobs   │ │ Conversion│      │
│ │   152    │ │    43    │ │   28.3%   │      │
│ └──────────┘ └──────────┘ └──────────┘       │
├────────────────────────────────────────────────┤
│ [Lead Trend Line Chart]                        │
├────────────────────────────────────────────────┤
│ [Campaign Performance Bar Chart]               │
├────────────────────────────────────────────────┤
│ [Geographic Distribution Heat Map]             │
└────────────────────────────────────────────────┘
```

---

## Implementation Priorities

### Phase 1 (Current) ✅
- Basic dashboard summary
- Lead/job counts
- Campaign list with lead counts

### Phase 2 (Next)
- Analytics tab with charts
- Time-based filtering
- Campaign comparison

### Phase 3 (Future)
- Advanced metrics
- Export capabilities
- CRM integrations

---

## Related Guides

- [DASHBOARD.md](./DASHBOARD.md) - Dashboard overview
- [CAMPAIGNS.md](./CAMPAIGNS.md) - Campaign metrics
- [LEADS.md](./LEADS.md) - Lead pipeline metrics
- [API-ROUTES.md](../patterns/API-ROUTES.md) - Analytics endpoints
