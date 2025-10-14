# Firebase Migration Complete ✅

**Date:** 2025-10-13
**Status:** Migration complete, bugs fixed, ready for testing on host
**Build Status:** ✅ Passing

---

## Critical Bugs Fixed (Post-Migration)

Three blocking bugs were caught in code review and fixed:

1. **Type mismatch in docToData** - Fixed to accept both QueryDocumentSnapshot and DocumentSnapshot
2. **Missing orderBy in duplicate lead query** - Added required orderBy clause for Firestore range filters
3. **Non-serializable Timestamps** - Converted Firestore Timestamps to ISO strings for Next.js server→client boundary

All bugs fixed and verified with successful build.

---

## What Changed

The Halo application has been successfully migrated from SQLite to Firebase (Firestore + Storage).

### Database
- **Before:** SQLite (`database/halo.db`)
- **After:** Firebase Firestore (cloud database)

### Key Benefits
1. ✅ **Unified platform** - Database + file storage in one place
2. ✅ **Scalability** - Auto-scales with traffic
3. ✅ **Real-time** - Can add real-time features later
4. ✅ **Simpler deployment** - No database setup needed
5. ✅ **Better for Sprint 3** - Photo upload uses Firebase Storage

---

## What You Need to Do (On Host)

### 1. Create Firebase Project

If you haven't already:

1. Go to https://console.firebase.google.com/
2. Create a new project (or select existing)
3. **Enable Firestore Database:**
   - Click "Firestore Database" → "Create database"
   - Select "Start in test mode"
   - Choose your region
4. **Enable Storage:**
   - Click "Storage" → "Get started"
   - Start in test mode

### 2. Get Firebase Config

1. In Firebase Console, click ⚙️ → "Project settings"
2. Scroll to "Your apps" section
3. Click the web icon (</>)
4. Register app name: "Halo Web"
5. Copy the `firebaseConfig` object

### 3. Create `.env.local` File

In the project root on your **host machine**, create `.env.local`:

```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef123456

# Email Configuration (Sprint 4)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password

# Application URLs
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

**Important:** Never commit `.env.local` to git! It's already in `.gitignore`.

### 4. Seed Firestore with Test Data

On your **host machine** (with `.env.local` configured):

```bash
npm run seed:firestore
```

Or manually:

```bash
npx tsx database/seeds/firestore-seed.ts
```

This will create:
- 2 test contractors
- 3 test campaigns
- 8 test photos (placeholders)
- 5 test leads

### 5. Test the Application

Start the dev server:

```bash
npm run dev
```

Visit the test campaign URLs:
- http://localhost:3000/c/oak-ridge-subdivision-dallas-tx
- http://localhost:3000/c/meadowbrook-heights-fort-worth-tx
- http://localhost:3000/c/lakeside-village-plano-tx

Test lead submission by filling out the form on any campaign page.

---

## Files Changed

### New Files
- `lib/firebase.ts` - Firebase initialization
- `lib/firestore.ts` - Firestore helper functions
- `database/seeds/firestore-seed.ts` - Firestore seed script
- `FIREBASE_MIGRATION.md` - This file

### Modified Files
- `.env.example` - Added Firebase config placeholders
- `app/c/[slug]/page.tsx` - Uses Firestore queries
- `app/api/leads/route.ts` - Uses Firestore for lead submission
- `components/PhotoGallery.tsx` - Updated Photo type import
- `components/LeadForm.tsx` - Campaign ID is now string
- `package.json` - Added Firebase dependencies

### Deprecated Files (kept for reference)
- `lib/db.ts` - SQLite functions (no longer used)
- `database/schema.sql` - SQL schema (no longer used)
- `database/halo.db` - SQLite database file (no longer used)
- `database/seeds/seed.ts` - SQLite seed script (no longer used)

---

## Data Model Changes

### Field Name Changes (camelCase for Firestore)

| SQLite (snake_case)   | Firestore (camelCase)  |
|-----------------------|------------------------|
| `contractor_id`       | `contractorId`         |
| `neighborhood_name`   | `neighborhoodName`     |
| `page_slug`           | `pageSlug`             |
| `qr_code_path`        | `qrCodeUrl`            |
| `created_at`          | `createdAt`            |
| `campaign_id`         | `campaignId`           |
| `image_path`          | `imageUrl`             |
| `upload_order`        | `uploadOrder`          |
| `uploaded_at`         | `uploadedAt`           |
| `submitted_at`        | `submittedAt`          |

### ID Changes

| SQLite         | Firestore                      |
|----------------|--------------------------------|
| Integer IDs    | String IDs (auto-generated)    |
| Foreign keys   | String references              |

### Firestore Collections Structure

```
contractors/
  {contractorId}/
    - name, company, email, phone, createdAt

campaigns/
  {campaignId}/
    - contractorId, neighborhoodName, pageSlug,
      qrCodeUrl, createdAt, status

leads/
  {leadId}/
    - campaignId, name, address, email, phone,
      notes, submittedAt, status

photos/
  {photoId}/
    - campaignId, imageUrl, uploadOrder, uploadedAt
```

---

## Verification Checklist

After setting up Firebase and seeding data:

- [ ] Firebase project created
- [ ] Firestore Database enabled
- [ ] Firebase Storage enabled
- [ ] `.env.local` created with Firebase config
- [ ] Seed script ran successfully
- [ ] Test data visible in Firebase Console
- [ ] Campaign pages load correctly
- [ ] Photo galleries display (placeholders)
- [ ] Lead form submits successfully
- [ ] Lead appears in Firestore Console
- [ ] No errors in browser console
- [ ] No errors in dev server console

---

## Important: Composite Index Required

**First lead submission will prompt you to create a Firestore composite index.**

When someone first submits a lead, you'll see a console error with a link like:
```
The query requires an index. You can create it here: https://console.firebase.google.com/...
```

**What to do:**
1. Click the link in the error message
2. Firebase Console will open with the index pre-configured
3. Click "Create Index"
4. Wait 1-2 minutes for the index to build
5. Try submitting the lead again

**Index Details:**
- Collection: `leads`
- Fields: `campaignId` (Ascending), `email` (Ascending), `submittedAt` (Descending)
- Purpose: Enable duplicate lead detection (prevents spam)

This is a one-time setup and is normal for Firestore composite queries.

---

## Troubleshooting

### "Firebase project not found"
- Check that `NEXT_PUBLIC_FIREBASE_PROJECT_ID` matches your Firebase project
- Ensure Firestore Database is enabled in Firebase Console

### "Permission denied" errors
- Ensure Firestore is in "Test mode" (allows all reads/writes)
- We'll add security rules in Sprint 4

### "Module not found" errors
- Run `npm install` to ensure all dependencies are installed
- Check that `firebase` and `firebase-admin` are in `package.json`

### Seed script fails
- Ensure `.env.local` exists on host machine (NOT in VM)
- Check that Firebase config values are correct
- Verify Firestore is enabled in Firebase Console

---

## Next Steps (Sprint 3)

With Firebase migration complete, Sprint 3 will be easier:

1. **Photo upload** will use Firebase Storage (no local filesystem)
2. **QR codes** will be stored as Firebase Storage URLs
3. **Campaign creation** will write directly to Firestore
4. **Deployment** will be simpler (no database setup needed)

---

## Rollback Plan (If Needed)

If you need to rollback to SQLite temporarily:

1. Revert the changes to these files:
   - `app/c/[slug]/page.tsx`
   - `app/api/leads/route.ts`
   - `components/PhotoGallery.tsx`
   - `components/LeadForm.tsx`

2. Change imports back to `@/lib/db` instead of `@/lib/firestore`

3. The old SQLite files are still in the repo for reference

However, **we recommend moving forward with Firebase** since Sprint 3 will be built for it.

---

## Questions?

If you encounter any issues:

1. Check Firebase Console for error messages
2. Check browser console for client-side errors
3. Check dev server console for server-side errors
4. Verify `.env.local` has all correct values
5. Ensure Firestore is in test mode (security rules)

---

**Migration completed by:** Claude (Developer)
**Date:** 2025-10-13
**Ready for:** Sprint 3 - Campaign Setup
