# Targeted Fix: Firebase Database Migration

**Created:** 2025-10-13
**Created By:** Claude (Developer)
**Sprint Context:** Between Sprint 2 and Sprint 3
**Type:** Architecture Change

---

## Problem Statement

### Issue Summary
Consider migrating from SQLite/PostgreSQL to Firebase (Firestore + Storage) for database and file storage before Sprint 3.

**Context:** User already uses Firebase for another project and is familiar with it.

### Current Behavior
- SQLite database for local development
- Planned PostgreSQL for production
- Local filesystem for photo storage
- SQL queries for data access
- Requires separate database setup

### Desired Behavior
- Firebase Firestore for all database operations
- Firebase Storage for photo uploads
- Firebase SDK for data access
- Single Firebase project for entire app
- No separate database or storage setup needed

---

## Context & Impact

### Why This Matters

**Business Impact:**
- User already familiar with Firebase (reduces learning curve)
- Single platform for database + storage + hosting
- Easier deployment and scaling
- Real-time capabilities if needed later
- Cost: Low (Firebase free tier covers MVP needs)
- Urgency: Medium (easier now than after Sprint 3)

**Technical Impact:**
- Replaces database abstraction layer (`lib/db.ts`)
- Changes all database queries (SQL → Firestore)
- Simplifies photo upload (Firebase Storage vs local filesystem)
- Affects Sprint 3 (photo upload implementation)
- May affect Sprint 4 (deployment strategy)
- Benefits: Easier file management, auto-scaling, real-time potential

### Discovery Details

**How was this identified:**
- User asked: "I already use Firebase for another project. How annoying would it be to swap to Firebase?"
- Discussed during Sprint 2 completion

**Related Issues:**
- Photo storage strategy (Sprint 3)
- Production deployment (Sprint 4)
- Database hosting decisions

---

## Analysis

### Root Cause
Not a "problem" per se, but a strategic architecture decision opportunity.

**Why consider now:**
- Early in project (only 2 sprints complete)
- Sprint 3 focuses on photo upload (Firebase Storage is ideal)
- Database abstraction layer already in place (easier swap)
- User has Firebase experience

**Why it matters:**
- Swapping later becomes exponentially harder
- Sprint 3 photo upload will be built for current storage approach
- Production deployment decisions need to be made soon

### Affected Components

**Files that need changes:**
- `lib/db.ts` - Complete rewrite (SQL → Firestore SDK)
- `database/schema.sql` - Remove (Firestore is schemaless)
- `database/init.ts` - Rewrite for Firestore initialization
- `database/seeds/seed.ts` - Rewrite for Firestore
- `app/api/leads/route.ts` - Update queries to Firestore
- `app/c/[slug]/page.tsx` - Update queries to Firestore
- `package.json` - Add Firebase SDK dependencies

**New files needed:**
- `lib/firebase.ts` - Firebase configuration and initialization
- `lib/firestore.ts` - Firestore helper functions
- `.env.local` - Firebase credentials (API key, project ID, etc.)

**Removed files:**
- `database/halo.db` - SQLite database file
- `database/schema.sql` - SQL schema definition
- `database/test-queries.ts` - SQL testing script

### Data Migration
**Current data:**
- 2 contractors
- 3 campaigns
- 5 leads
- 8 photo references

**Migration needed:** Minimal (test data can be re-seeded in Firestore)

---

## Proposed Solution

### Approach

**High-level strategy:**
1. Add Firebase SDK to project
2. Create Firebase project and configure
3. Rewrite database abstraction layer for Firestore
4. Update all queries to use Firestore SDK
5. Configure Firebase Storage for photo uploads
6. Test all functionality
7. Update documentation

**Technical implementation:**

### Step 1: Firebase Setup (1 hour)
1. Create Firebase project (or use existing)
2. Enable Firestore Database
3. Enable Firebase Storage
4. Get Firebase config credentials
5. Add credentials to `.env.local`
6. Install Firebase SDK: `npm install firebase firebase-admin`

### Step 2: Firestore Data Model (1 hour)

**Collections structure:**
```
contractors/
  {contractorId}/
    name, company, email, phone, createdAt

campaigns/
  {campaignId}/
    contractorId, neighborhoodName, pageSlug,
    qrCodeUrl, createdAt, status

leads/
  {leadId}/
    campaignId, name, address, email, phone,
    notes, submittedAt, status

photos/
  {photoId}/
    campaignId, imageUrl, uploadOrder, uploadedAt
```

### Step 3: Rewrite Database Layer (2-3 hours)

**Create `lib/firebase.ts`:**
```typescript
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
```

**Create `lib/firestore.ts`:**
```typescript
import { db } from './firebase';
import {
  collection, doc, getDoc, getDocs,
  addDoc, query, where, orderBy
} from 'firebase/firestore';

// Replace SQL queries with Firestore queries
// Example: getCampaignBySlug()
export async function getCampaignBySlug(slug: string) {
  const q = query(
    collection(db, 'campaigns'),
    where('pageSlug', '==', slug),
    where('status', '==', 'active')
  );
  const snapshot = await getDocs(q);
  // ... process results
}
```

### Step 4: Update All Queries (2-3 hours)

**API routes:**
- `app/api/leads/route.ts` - Use Firestore addDoc instead of SQL INSERT

**Pages:**
- `app/c/[slug]/page.tsx` - Use Firestore queries instead of SQL

**All queries need rewrite:**
- `SELECT` → `getDoc` / `getDocs` + `query`
- `INSERT` → `addDoc` / `setDoc`
- `JOIN` → Multiple queries or denormalize data

### Step 5: Update Photo Storage (Sprint 3) (1-2 hours)

Instead of local filesystem:
```typescript
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// Upload to Firebase Storage
const storageRef = ref(storage, `campaigns/${campaignId}/${filename}`);
await uploadBytes(storageRef, file);
const downloadURL = await getDownloadURL(storageRef);
// Store downloadURL in Firestore (not file path)
```

### Step 6: Seed Data (1 hour)

Rewrite seed script to use Firestore:
```typescript
import { collection, addDoc } from 'firebase/firestore';

// Add contractors
const contractor1 = await addDoc(collection(db, 'contractors'), {
  name: 'John Smith',
  company: 'Smith Roofing & Repair',
  // ...
});
```

### Step 7: Testing & Verification (1-2 hours)

- Test all landing page queries
- Test lead submission
- Test campaign creation (Sprint 3)
- Verify data structure in Firebase Console
- Test on multiple devices

---

## Alternative Approaches Considered

### Alternative 1: Stay with SQLite → PostgreSQL
**Pros:**
- No migration work needed
- SQL familiarity
- More control over queries
- Easier to migrate to other SQL databases
- No vendor lock-in

**Cons:**
- Need to set up PostgreSQL for production
- File storage still needs solution (local or S3)
- More complex deployment
- Need to manage database backups
- No real-time capabilities

**Why not chosen:** More work overall, especially for photo storage

### Alternative 2: Use Supabase (PostgreSQL + Storage)
**Pros:**
- PostgreSQL (SQL familiar)
- Built-in storage
- Open source alternative to Firebase
- Real-time capabilities

**Cons:**
- Another new service to learn
- Not as widely used as Firebase
- User not already familiar with it

**Why not chosen:** User already uses Firebase

### Alternative 3: Defer to Post-MVP
**Pros:**
- Focus on features first
- Validate MVP before infrastructure changes

**Cons:**
- Much harder to migrate later
- Sprint 3 photo upload built for wrong system
- Technical debt accumulates

**Why not chosen:** Window of opportunity is now

---

## Scope & Effort

### Work Required

**Development:**
- Set up Firebase project - Est: 30 minutes
- Install dependencies - Est: 15 minutes
- Create Firebase config - Est: 30 minutes
- Rewrite `lib/db.ts` to `lib/firestore.ts` - Est: 2 hours
- Update API routes - Est: 1 hour
- Update page queries - Est: 1 hour
- Create seed script - Est: 1 hour
- Update `.env.example` - Est: 15 minutes

**Testing:**
- Test landing pages - Est: 30 minutes
- Test lead submission - Est: 30 minutes
- Verify data in Firebase Console - Est: 15 minutes
- Test all edge cases - Est: 1 hour

**Documentation:**
- Update tech stack docs - Est: 30 minutes
- Document Firebase setup - Est: 30 minutes
- Update Agent Guidelines - Est: 15 minutes

**Total Estimate:** 8-10 hours

### Risk Assessment

**Implementation Risks:**
- **Learning curve (Low):** User already familiar with Firebase
  - Likelihood: Low
  - Impact: Low
  - Mitigation: User can guide on Firebase best practices

- **Query complexity (Medium):** Some SQL queries might need restructuring
  - Likelihood: Medium
  - Impact: Low
  - Mitigation: Current queries are simple, easy to translate

- **Real-time listener confusion (Low):** Firestore uses listeners, not direct queries
  - Likelihood: Low
  - Impact: Low
  - Mitigation: Can use one-time reads initially

**Regression Risks:**
- All existing functionality needs retesting
- Landing pages must still load correctly
- Lead submission must still work
- Photo references must be valid

**Mitigation:**
- Thorough testing after migration
- Keep old code in separate branch temporarily
- Test with real data before deploying

---

## Sprint Integration Decision

### In-Sprint or Out-of-Sprint?

**Recommendation: Do NOW (before Sprint 3)**

**Justification:**
- [x] Sprint 3 focuses on photo upload (Firebase Storage is perfect)
- [x] Early enough (only 2 sprints complete)
- [x] User already familiar with Firebase
- [x] Makes deployment easier (Sprint 4)
- [x] Photo upload in Sprint 3 will be built for Firebase Storage

**Impact on current sprint (N/A - between sprints):**
- Will delay: Sprint 3 start by 1 day (8-10 hours work)
- Will require: Firebase project setup, credential configuration
- Trade-off: Short-term delay for long-term benefit

**Benefits of doing now:**
- Sprint 3 photo upload built correctly from start
- Simpler deployment story
- Real-time capabilities available if needed
- One platform for everything

**If deferring:**
- Sprint 3 photo upload built for local filesystem
- Would need to rebuild photo upload later
- Migration becomes 2-3x harder after Sprint 3

**Workaround (if deferring):**
- Continue with SQLite/local storage
- Plan migration after MVP validation
- Accept technical debt and future migration effort

---

## Decision

**Recommendation:** ✅ **Do Now (Before Sprint 3)**

**Rationale:**
1. User already uses Firebase (familiar)
2. Makes Sprint 3 (photo upload) easier
3. Simplifies Sprint 4 (deployment)
4. Window of opportunity (early in project)
5. Firebase Storage better than local filesystem
6. Total effort reasonable (8-10 hours)

**Decided By:** Claude (recommendation)
**Approved By:** [User - pending approval]
**Decision Date:** 2025-10-13

**Action Plan if Approved:**
1. Create new branch: `feature/firebase-migration`
2. Set up Firebase project
3. Implement Firestore abstraction layer
4. Migrate queries
5. Update seed data
6. Test thoroughly
7. Merge to main
8. Document changes
9. Proceed with Sprint 3

**Action if Deferred:**
1. Continue with SQLite
2. Build Sprint 3 for local filesystem
3. Add to backlog for post-MVP migration
4. Accept increased future migration cost

---

## Implementation Plan (If Approved)

### Acceptance Criteria
- [ ] Firebase project created and configured
- [ ] All database queries use Firestore
- [ ] Landing pages load correctly
- [ ] Lead submission works
- [ ] Seed data loads to Firestore
- [ ] No SQL code remains
- [ ] Firebase credentials in `.env.local`
- [ ] Documentation updated
- [ ] All tests pass

### Testing Plan

**Unit Tests:**
- Firestore helper functions
- Data model validation
- Query response handling

**Integration Tests:**
- Campaign page loads with Firestore data
- Lead submission saves to Firestore
- Photo references resolve correctly

**Manual Testing:**
- Visit all test campaign URLs
- Submit lead form
- Check Firebase Console for data
- Verify error handling
- Test on mobile viewport

### Rollback Plan

**If something goes wrong:**
1. Keep current SQLite code in separate branch
2. Can revert migration commit
3. Restore database from backup
4. Switch back to SQLite
5. Minimal data loss (only test data)

---

## Coordination

### Stakeholder Communication
- [ ] User informed of recommendation
- [ ] GPT5 notified for sprint tracking
- [ ] Decision documented in this brief

### Dependencies

**Requires:**
- Firebase account (user already has)
- Firebase project creation
- Environment variables on host machine
- Credentials configuration

**Blocks:**
- Sprint 3 start (delays by 1 day)

**Unblocks:**
- Simpler photo upload in Sprint 3
- Easier deployment in Sprint 4
- Scalable storage solution

---

## Success Metrics

**How we'll know it worked:**
- All landing pages load from Firestore
- Lead submission saves to Firestore
- Firebase Console shows correct data structure
- Performance equal or better than SQLite
- No regressions in functionality
- Documentation updated

**Follow-up needed:**
- [ ] Monitor Firestore usage (free tier limits)
- [ ] Set up Firebase security rules
- [ ] Configure Firebase indexes (if needed)
- [ ] Review Firebase costs after MVP

---

## Technical Notes

### Firestore Best Practices

**Data Structure:**
- Denormalize when needed (JOINs are expensive)
- Use subcollections for one-to-many relationships
- Keep documents under 1MB
- Use references for related data

**Queries:**
- Index composite queries
- Limit results (`.limit(10)`)
- Use cursors for pagination
- Cache reads when possible

**Security:**
- Set up Firestore security rules
- Never expose service account keys client-side
- Use Firebase Admin SDK on server

**Storage:**
- Organize by campaign ID
- Use consistent naming
- Set storage rules
- Consider CDN for images

### Migration Checklist

**Before:**
- [ ] Backup current SQLite database
- [ ] Create Firebase project
- [ ] Get credentials
- [ ] Create new branch

**During:**
- [ ] Install Firebase SDK
- [ ] Configure Firebase
- [ ] Migrate queries
- [ ] Update seed data
- [ ] Test thoroughly

**After:**
- [ ] Remove SQLite files
- [ ] Update documentation
- [ ] Commit changes
- [ ] Merge to main

---

## Estimated Timeline

**If approved to do now:**

Day 1 (Morning):
- Set up Firebase project (1 hour)
- Install dependencies and configure (1 hour)
- Rewrite database layer (2 hours)

Day 1 (Afternoon):
- Update queries in pages/API routes (2 hours)
- Create seed data script (1 hour)

Day 2 (Morning):
- Testing and bug fixes (2 hours)
- Documentation updates (1 hour)

**Total: 10 hours over 1-2 days**

Then proceed with Sprint 3 as planned.

---

## Questions for User

1. **Do you have an existing Firebase project to use, or create new?**
2. **Any Firebase preferences (regions, pricing tier)?**
3. **Want to use Firebase Authentication later (contractors login)?**
4. **Okay with 1-day delay to Sprint 3 for migration?**

---

## Summary

**What:** Migrate from SQLite to Firebase (Firestore + Storage)

**Why:** User familiar, simpler architecture, easier Sprint 3 & 4

**When:** Now (before Sprint 3)

**Effort:** 8-10 hours (1-2 days)

**Risk:** Low (early in project, user experienced)

**Benefit:** Simpler photo upload, easier deployment, scalable

**Recommendation:** ✅ **Approve and execute before Sprint 3**

---

**End of Targeted Fix Brief**
**Prepared by:** Claude (Developer)
**Date:** 2025-10-13
**Status:** Awaiting User Approval
