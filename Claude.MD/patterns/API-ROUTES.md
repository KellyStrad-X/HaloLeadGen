# API Route Patterns

All API routes follow consistent patterns for authentication, error handling, and response formatting.

---

## Route Structure

```
app/api/
├── campaigns/               # Public campaign operations
│   ├── route.ts            # POST /api/campaigns (create)
│   └── [id]/
│       ├── photos/route.ts # POST photos
│       ├── generate-qr/    # POST QR generation
│       └── settings/       # GET/PATCH settings
├── leads/                  # Public lead submission
│   ├── route.ts            # POST /api/leads
│   └── [leadId]/route.ts   # GET/PATCH specific lead
└── dashboard/              # Authenticated dashboard ops
    ├── summary/route.ts    # GET summary stats
    ├── campaigns/          # GET campaigns list
    │   └── [id]/route.ts   # GET single campaign
    ├── leads/              # GET/PATCH leads
    │   └── [leadId]/       # Lead operations
    └── jobs/               # Job management
        └── [leadId]/       # Job operations
```

---

## Authentication Pattern

### Dashboard Routes (Authenticated)

All `/api/dashboard/*` routes require Firebase Auth token:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    // 1. Extract token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];

    // 2. Verify token with Firebase Admin
    const decodedToken = await adminAuth.verifyIdToken(token);
    const contractorId = decodedToken.uid;

    // 3. Use contractorId for queries
    const data = await fetchDataForContractor(contractorId);

    return NextResponse.json({ data });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Public Routes

Routes like `/api/campaigns` and `/api/leads` still require auth but are called from public pages. The token is obtained client-side and passed via the same Authorization header pattern.

---

## Error Handling Pattern

### Standard Error Response

```typescript
return NextResponse.json(
  { error: 'Error message here' },
  { status: 400 | 401 | 403 | 404 | 500 }
);
```

### Status Codes

- `400`: Bad request (invalid input)
- `401`: Unauthorized (missing/invalid token)
- `403`: Forbidden (token valid but no access)
- `404`: Not found
- `500`: Internal server error

### Try-Catch Wrapper

```typescript
export async function POST(request: NextRequest) {
  try {
    // Auth verification
    // Business logic
    // Return success
  } catch (error) {
    console.error('Route error:', error);

    // Return appropriate error
    if (error.code === 'auth/id-token-expired') {
      return NextResponse.json(
        { error: 'Token expired' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

## Request Patterns

### GET Requests

```typescript
// Query parameters
const { searchParams } = new URL(request.url);
const campaignId = searchParams.get('campaignId');
const status = searchParams.get('status');

// Use parameters in query
const leads = await getLeadsAdmin(contractorId, { campaignId, status });
```

### POST Requests

```typescript
// Parse JSON body
const body = await request.json();
const { campaignName, showcaseAddress } = body;

// Validate input
if (!campaignName || !showcaseAddress) {
  return NextResponse.json(
    { error: 'Missing required fields' },
    { status: 400 }
  );
}

// Process request
const campaign = await createCampaignAdmin({
  contractorId,
  campaignName,
  showcaseAddress,
});
```

### PATCH Requests

```typescript
const body = await request.json();
const updates = body; // { status: 'completed', notes: '...' }

// Update document
await updateLeadAdmin(leadId, updates);
```

### DELETE Requests

```typescript
// Soft delete (recommended)
await updateLeadAdmin(leadId, {
  deleted: true,
  deletedAt: new Date().toISOString(),
});

// Or hard delete
await deleteLeadAdmin(leadId);
```

---

## Response Patterns

### Success Response

```typescript
return NextResponse.json({
  // Data payload
  campaign: serializedCampaign,
  // Or array
  campaigns: serializedCampaigns,
  // Or ID
  campaignId: newId,
});
```

### Pagination (Future)

```typescript
return NextResponse.json({
  data: items,
  pagination: {
    page: 1,
    limit: 20,
    total: 150,
    hasMore: true,
  },
});
```

---

## Ownership Verification

Always verify contractor owns the resource:

```typescript
// Fetch resource
const campaign = await getCampaignAdmin(campaignId);

// Verify ownership
if (campaign.contractorId !== contractorId) {
  return NextResponse.json(
    { error: 'Forbidden' },
    { status: 403 }
  );
}

// Proceed with operation
```

---

## Data Serialization

**Critical**: Serialize Firestore Timestamps before returning:

```typescript
import { serializeCampaign } from '@/lib/firestore-admin';

// ❌ Don't do this
return NextResponse.json({ campaign }); // If campaign has Timestamp fields

// ✅ Do this
const serialized = serializeCampaign(campaign);
return NextResponse.json({ campaign: serialized });
```

---

## File Upload Pattern

```typescript
export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const files = formData.getAll('photos') as File[];

  const uploadedUrls = [];

  for (const file of files) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await uploadToStorage(buffer, file.name);
    uploadedUrls.push(url);
  }

  return NextResponse.json({ photoUrls: uploadedUrls });
}
```

---

## Related Guides

- [AUTHENTICATION.md](./AUTHENTICATION.md) - Auth patterns
- [FIREBASE.md](./FIREBASE.md) - Database operations
- [CAMPAIGNS.md](../areas/CAMPAIGNS.md) - Campaign API endpoints
- [LEADS.md](../areas/LEADS.md) - Lead API endpoints
