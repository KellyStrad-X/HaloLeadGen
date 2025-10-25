# Firebase Patterns

Firebase (Firestore + Storage + Auth) is the database and storage layer. Understanding when to use client vs admin SDK is critical.

---

## Client vs Admin SDK

### Client SDK (`lib/firestore.ts`)

**Use for**:
- Public-facing pages (landing pages)
- Client-side read operations
- Lead submissions (public forms)

**Imports**:
```typescript
import { db } from '@/lib/firebase';
import { collection, doc, getDoc, query, where } from 'firebase/firestore';
```

**Limitations**:
- Requires Firestore security rules
- No server-side secrets
- Limited to browser environment

### Admin SDK (`lib/firestore-admin.ts`)

**Use for**:
- API routes (server-side)
- All write operations from dashboard
- Authenticated queries
- Background jobs

**Imports**:
```typescript
import { adminDb } from '@/lib/firebase-admin';
```

**Benefits**:
- Bypasses security rules
- Full database access
- Server-side only
- Access to Firebase Admin features

---

## Firestore Collections

### Structure

```
contractors/
  └── [contractorId]/
      ├── email
      ├── companyName
      └── ...

campaigns/
  └── [campaignId]/
      ├── contractorId
      ├── campaignName
      ├── showcaseAddress
      └── ...

leads/
  └── [leadId]/
      ├── campaignId
      ├── name
      ├── email
      ├── promotedToJob
      ├── job/          # Embedded object
      └── ...

contractor_branding/
  └── [contractorId]/
      ├── logoUrl
      ├── trustBadges[]
      └── crewMembers[]
```

---

## Timestamp Serialization

**Critical**: Next.js cannot serialize Firestore Timestamps. Always convert to ISO strings.

### The Problem

```typescript
// ❌ This will error in Next.js
const campaign = await getCampaign(id);
return { props: { campaign } }; // Error: Timestamp not serializable
```

### The Solution

```typescript
import { Timestamp } from 'firebase/firestore';

function serializeTimestamp(timestamp: Timestamp): string {
  return timestamp.toDate().toISOString();
}

// Helper function for documents
function serializeCampaign(campaign) {
  return {
    ...campaign,
    createdAt: serializeTimestamp(campaign.createdAt),
    updatedAt: serializeTimestamp(campaign.updatedAt),
  };
}
```

### Built-in Helpers

Both `lib/firestore.ts` and `lib/firestore-admin.ts` have serialization helpers:

```typescript
import { serializeCampaign, serializeLead } from '@/lib/firestore-admin';

const campaign = await getCampaignAdmin(id);
const serialized = serializeCampaign(campaign);
return NextResponse.json({ campaign: serialized });
```

---

## Query Patterns

### Client-Side Query

```typescript
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

const q = query(
  collection(db, 'campaigns'),
  where('pageSlug', '==', slug),
  where('campaignStatus', '==', 'Active')
);

const snapshot = await getDocs(q);
const campaigns = snapshot.docs.map(doc => ({
  id: doc.id,
  ...doc.data()
}));
```

### Server-Side Query (Admin)

```typescript
import { adminDb } from '@/lib/firebase-admin';

const campaignsRef = adminDb.collection('campaigns');
const snapshot = await campaignsRef
  .where('contractorId', '==', contractorId)
  .where('campaignStatus', '==', 'Active')
  .get();

const campaigns = snapshot.docs.map(doc => ({
  id: doc.id,
  ...doc.data()
}));
```

---

## CRUD Operations

### Create

```typescript
// Client
import { collection, addDoc } from 'firebase/firestore';
const docRef = await addDoc(collection(db, 'leads'), leadData);
const leadId = docRef.id;

// Admin
const docRef = await adminDb.collection('campaigns').add(campaignData);
const campaignId = docRef.id;
```

### Read

```typescript
// Client
import { doc, getDoc } from 'firebase/firestore';
const docRef = doc(db, 'campaigns', campaignId);
const snapshot = await getDoc(docRef);
const campaign = { id: snapshot.id, ...snapshot.data() };

// Admin
const docRef = adminDb.collection('campaigns').doc(campaignId);
const snapshot = await docRef.get();
const campaign = { id: snapshot.id, ...snapshot.data() };
```

### Update

```typescript
// Client
import { doc, updateDoc } from 'firebase/firestore';
await updateDoc(doc(db, 'leads', leadId), {
  status: 'contacted',
  updatedAt: new Date().toISOString()
});

// Admin
await adminDb.collection('leads').doc(leadId).update({
  status: 'contacted',
  updatedAt: new Date().toISOString()
});
```

### Delete

```typescript
// Client
import { doc, deleteDoc } from 'firebase/firestore';
await deleteDoc(doc(db, 'leads', leadId));

// Admin
await adminDb.collection('leads').doc(leadId).delete();
```

---

## Firebase Storage

### Upload Pattern (Admin)

```typescript
import { adminStorage } from '@/lib/firebase-admin';
import { v4 as uuidv4 } from 'uuid';

async function uploadPhoto(buffer: Buffer, filename: string, campaignId: string) {
  const storagePath = `campaigns/${campaignId}/photos/${filename}`;
  const file = adminStorage.bucket().file(storagePath);

  // Generate download token
  const token = uuidv4();

  await file.save(buffer, {
    metadata: {
      contentType: 'image/jpeg',
      metadata: {
        firebaseStorageDownloadTokens: token
      }
    }
  });

  // Return public URL
  const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(storagePath)}?alt=media&token=${token}`;

  return publicUrl;
}
```

### Download URL

Storage files should include download tokens for public access:

```typescript
const downloadUrl = file.metadata.mediaLink + '?token=' + token;
```

---

## Helper Functions

### lib/firestore-admin.ts

Key helper functions (1500+ lines):

**Campaigns**:
- `createCampaignAdmin(data)` - Create campaign
- `getCampaignAdmin(id)` - Get single campaign
- `getCampaignsAdmin(contractorId)` - List campaigns
- `updateCampaignAdmin(id, updates)` - Update campaign

**Leads**:
- `createLeadAdmin(data)` - Create lead
- `getLeadAdmin(id)` - Get single lead
- `getLeadsAdmin(contractorId, options)` - List leads
- `updateLeadAdmin(id, updates)` - Update lead
- `isDuplicateLeadAdmin(email, campaignId)` - Check duplicates

**Jobs**:
- `promoteLeadToJobAdmin(leadId, jobData)` - Promote to job
- `updateJobAdmin(leadId, updates)` - Update job
- `getJobsByStatusAdmin(contractorId)` - Get jobs grouped

**Serialization**:
- `serializeCampaign(campaign)` - Serialize timestamps
- `serializeLead(lead)` - Serialize timestamps

---

## Composite Indexes

Some queries require composite indexes in Firestore:

**Duplicate Lead Check**:
- Collection: `leads`
- Fields: `email` ASC, `campaignId` ASC, `createdAt` DESC

Firebase Console will prompt to create indexes on first use.

---

## Best Practices

✅ **Do**:
- Use Admin SDK for all server-side operations
- Always serialize Timestamps before sending to client
- Check resource ownership before operations
- Use helper functions from firestore-admin.ts
- Cache frequently-accessed data

❌ **Don't**:
- Mix client and admin SDKs in same file
- Forget to serialize Timestamps
- Trust client-side security rules alone
- Query without indexes
- Expose admin credentials to client

---

## Related Guides

- [API-ROUTES.md](./API-ROUTES.md) - Using Firebase in APIs
- [CAMPAIGNS.md](../areas/CAMPAIGNS.md) - Campaign data structure
- [LEADS.md](../areas/LEADS.md) - Lead data structure
