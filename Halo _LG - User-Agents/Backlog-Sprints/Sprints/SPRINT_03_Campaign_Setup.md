# Sprint 3: Campaign Setup & Admin

**Sprint Duration:** 2-3 days
**Sprint Goal:** Build contractor-facing campaign creation flow with photo upload and QR code generation
**Estimated Effort:** 17-22 hours

---

## Sprint Objective

Create the interface and backend logic that allows contractors to set up new campaigns. This includes a campaign creation form, multi-photo upload system (unlimited photos), QR code generation, and a confirmation page with all the assets they need to distribute. By the end of this sprint, a contractor should be able to create a complete campaign and receive a working QR code that links to their landing page.

---

## Sprint Backlog

### 1. Campaign Creation Form [E3-S1]
**Priority:** P0
**Estimated:** 3-4 hours

**Tasks:**
- [ ] Design campaign setup UI:
  - Clean, professional form
  - Clear instructions at top
  - Progressive disclosure (show relevant fields as needed)
- [ ] Create form page/route: `/create-campaign` or `/setup`
- [ ] Implement form fields:
  - **Your Name** (text, required)
  - **Company Name** (text, required)
  - **Email** (email, required)
  - **Phone** (tel, required)
  - **Neighborhood/Area Name** (text, required)
    - Placeholder: "e.g., Oak Ridge Subdivision, Dallas TX"
    - Help text: "Be specific - this helps homeowners know it's their area"
- [ ] Add client-side validation:
  - All fields required
  - Email format validation
  - Phone format validation
  - Neighborhood must be specific (min 10 characters)
- [ ] Style form for usability:
  - Clear labels
  - Helpful placeholder text
  - Inline validation feedback
  - Appropriate input types
- [ ] Create multi-step flow (optional but recommended):
  - Step 1: Contractor info
  - Step 2: Photo upload
  - Step 3: Review and confirm
  - Progress indicator at top
- [ ] Add form submission logic:
  - Validate all fields
  - Show loading state
  - Handle errors gracefully

**Form Copy:**
- **Headline:** "Create Your Halo Campaign"
- **Subheadline:** "Set up a neighborhood-specific page to capture roofing leads"
- **Instructions:** "Fill out your information and upload photos of local roof damage. We'll generate a custom QR code you can distribute in the area."

**Acceptance Criteria:**
- ✓ Form is clean and professional
- ✓ All fields have proper validation
- ✓ Error messages are helpful
- ✓ Form is mobile-friendly (contractors might set this up on phone)
- ✓ User knows exactly what to do next

---

### 2. Photo Upload System [E3-S2]
**Priority:** P0
**Estimated:** 8-10 hours

**Tasks:**
- [ ] Build multi-file upload UI:
  - Drag-and-drop zone (primary method)
  - Click to browse files (fallback)
  - Show selected files with previews
  - Support for many photos (10+, no artificial cap)
- [ ] Implement drag-and-drop:
  - Highlight drop zone on drag over
  - Accept files on drop
  - Handle multiple files at once
- [ ] Add file selection:
  - File input with multiple attribute
  - Filter by image types (JPG, PNG, WebP)
  - Show helpful message if wrong file type
- [ ] Create image preview component:
  - Show thumbnails of selected images
  - Display filename and size
  - Allow removing individual photos
  - Allow reordering photos (drag to reorder)
  - Number photos to show order (1, 2, 3...)
- [ ] Implement file validation (client-side):
  - File type: Only images (.jpg, .jpeg, .png, .webp)
  - File size warning: Flag files >5MB (will be compressed)
  - Minimum: At least 1 photo required
  - No maximum: Support 20+ photos
- [ ] Add progress indicators:
  - Show upload progress for each file
  - Overall upload progress bar
  - Success/error state for each file
- [ ] Build backend upload endpoint: `POST /api/campaigns/:id/photos`
  - Accept multipart/form-data
  - Validate file types
  - Compress/resize images:
    - Max width: 1920px (for display)
    - Max file size: 2MB after compression
    - Convert to WebP or optimized JPEG
  - Save to filesystem (e.g., `/uploads/campaigns/:id/`)
  - Generate unique filenames (prevent overwrites)
  - Store file paths in database
- [ ] Implement photo storage:
  - Create uploads directory structure
  - Save images with unique names (UUID or timestamp)
  - Store relative paths in database
  - Set upload_order based on client order
- [ ] Handle errors:
  - File too large (even after compression)
  - Unsupported file type
  - Upload failed (network error)
  - Disk space issues
  - Show clear error messages to user

**Upload Flow:**
1. Contractor drags/selects photos
2. Client shows previews and validates
3. Contractor can reorder or remove photos
4. Contractor clicks "Upload Photos"
5. Each photo uploaded to server
6. Server compresses/resizes
7. Server saves to filesystem
8. Server stores paths in database
9. Client shows success

**Acceptance Criteria:**
- ✓ Can upload 1 photo successfully
- ✓ Can upload 15+ photos successfully
- ✓ Drag-and-drop works on desktop
- ✓ File selection works on mobile
- ✓ Image previews display correctly
- ✓ Can reorder photos before upload
- ✓ Can remove photos before upload
- ✓ Upload progress shown clearly
- ✓ Large images compressed automatically
- ✓ Photos stored with correct campaign
- ✓ Photos saved to database in correct order
- ✓ Error messages are helpful

---

### 3. QR Code Generation [E3-S3]
**Priority:** P0
**Estimated:** 3-4 hours

**Tasks:**
- [ ] Choose QR code library:
  - **Node.js:** `qrcode` package (popular, well-maintained)
  - **Browser:** `qrcode.js` or `qrcode-generator`
- [ ] Install and configure library
- [ ] Create QR generation function:
  - Input: Campaign landing page URL (e.g., `https://halo.app/c/oak-ridge-dallas`)
  - Output: QR code image (PNG format)
  - Settings:
    - Error correction: High (survives minor damage)
    - Size: 1024x1024px (high resolution for printing)
    - Margin: 4 modules (white space around QR)
- [ ] Generate QR on campaign creation:
  - Trigger after campaign + photos uploaded
  - Generate QR code with landing page URL
  - Save QR image to filesystem (e.g., `/uploads/qr-codes/:id.png`)
  - Store QR path in database (`qr_code_path` field)
- [ ] Create QR download endpoint: `GET /api/campaigns/:id/qr-code`
  - Stream QR image file
  - Set proper headers (Content-Type: image/png)
  - Suggest filename: `halo-qr-{neighborhood}.png`
- [ ] Test QR codes:
  - Scan with phone camera app
  - Verify it opens correct landing page
  - Test on iPhone and Android
  - Print and scan to verify print quality

**QR Code Requirements:**
- High resolution (300 DPI equivalent for printing)
- Printable at 2" x 2" minimum
- Works with all common QR scanners
- Includes full URL (not shortened link)
- No logo overlay (keep it simple for MVP)

**Acceptance Criteria:**
- ✓ QR code generated for each campaign
- ✓ QR code links to correct landing page
- ✓ QR code is high resolution (1024x1024px min)
- ✓ QR code scans reliably on phone cameras
- ✓ QR code prints clearly
- ✓ Contractor can download QR code image
- ✓ QR code saved to database

---

### 4. Campaign Confirmation & Assets [E3-S4]
**Priority:** P0
**Estimated:** 3-4 hours

**Tasks:**
- [ ] Design confirmation page layout:
  - Celebratory headline: "Your Campaign is Live!"
  - Campaign summary section
  - QR code display (large, prominent)
  - Asset download section
  - Next steps / instructions
- [ ] Build confirmation page component: `/campaign/:id/success`
- [ ] Display campaign details:
  - Neighborhood name
  - Number of photos uploaded
  - Landing page URL (copyable)
  - Date created
- [ ] Show QR code prominently:
  - Large display (at least 300x300px on screen)
  - High contrast background
  - Label: "Your Custom QR Code"
- [ ] Add download functionality:
  - "Download QR Code" button
  - Downloads high-res PNG (1024x1024px)
  - Filename: `halo-qr-{slug}.png`
- [ ] Add URL copy functionality:
  - Display landing page URL
  - "Copy Link" button
  - Show "Copied!" feedback
  - Test on mobile (copy to clipboard)
- [ ] Preview landing page:
  - "Preview Your Page" button
  - Opens landing page in new tab
  - Or embed iframe preview (optional)
- [ ] Write distribution instructions:
  - How to use the QR code
  - Distribution ideas (door hangers, yard signs, flyers, postcards)
  - Best practices (place where homeowners will see it)
  - What happens when someone scans
  - How you'll be notified of leads
- [ ] Add "Create Another Campaign" button
  - Links back to campaign creation form

**Confirmation Page Sections:**

1. **Hero Section:**
   - "Your Campaign is Live!"
   - Checkmark icon or success animation

2. **Campaign Summary:**
   - Neighborhood: [name]
   - Photos: [count]
   - Created: [date]
   - Status: Active

3. **QR Code Section:**
   - Large QR code display
   - Download button
   - Instructions: "Print this QR code and distribute in [neighborhood]"

4. **Landing Page URL:**
   - Full URL displayed
   - Copy button
   - Preview button

5. **Next Steps:**
   - Print QR codes (or order from print shop)
   - Distribute on door hangers, yard signs, flyers
   - Leads will be emailed to: [email]
   - Respond to leads within 24 hours for best results

6. **Action Buttons:**
   - Download QR Code (primary)
   - Preview Landing Page
   - Create Another Campaign
   - View Dashboard (if built)

**Acceptance Criteria:**
- ✓ Confirmation page shows all campaign details
- ✓ QR code displayed large and clear
- ✓ Download button works and provides high-res PNG
- ✓ Copy URL button works on desktop and mobile
- ✓ Preview button opens landing page
- ✓ Instructions are clear and actionable
- ✓ Contractor knows exactly what to do next
- ✓ Professional design builds confidence

---

## Sprint Deliverables

By end of Sprint 3:
- [ ] Campaign creation form functional
- [ ] Multi-photo upload working (supports many photos)
- [ ] Photos compressed and stored
- [ ] QR codes generated for each campaign
- [ ] Confirmation page with all assets
- [ ] Download QR functionality
- [ ] Copy URL functionality
- [ ] Clear instructions for contractors
- [ ] End-to-end campaign creation flow tested

---

## Definition of Done

- [ ] All code committed with clear messages
- [ ] Campaign creation works end-to-end (form → photos → QR → confirmation)
- [ ] Can upload 1 photo and 20+ photos successfully
- [ ] QR codes scan correctly on real phones
- [ ] QR codes link to correct landing pages
- [ ] Confirmation page provides all needed assets
- [ ] Tested on desktop and mobile
- [ ] No console errors or warnings
- [ ] Sprint 3 Restart Brief created

---

## Testing Checklist

**Campaign Form:**
- [ ] All fields validate correctly
- [ ] Can't submit incomplete form
- [ ] Error messages are clear
- [ ] Successful submission moves to next step

**Photo Upload:**
- [ ] Can drag and drop photos
- [ ] Can click to select photos
- [ ] Previews show correctly
- [ ] Can reorder photos
- [ ] Can remove photos
- [ ] Upload progress displays
- [ ] Success state shows after upload
- [ ] 1 photo uploads successfully
- [ ] 10 photos upload successfully
- [ ] 20+ photos upload successfully
- [ ] Large images (10MB) are compressed
- [ ] Unsupported file types rejected
- [ ] Photos saved to correct location
- [ ] Photos appear in database

**QR Code:**
- [ ] QR code generated after campaign creation
- [ ] QR scans on iPhone camera
- [ ] QR scans on Android camera
- [ ] QR opens correct landing page
- [ ] QR is high resolution (sharp when printed)
- [ ] Download QR button works
- [ ] Downloaded file is PNG format
- [ ] Downloaded file is 1024x1024px or larger

**Confirmation Page:**
- [ ] Page shows correct campaign details
- [ ] QR code displays large and clear
- [ ] Landing page URL is correct
- [ ] Copy URL button works
- [ ] Copy URL gives feedback ("Copied!")
- [ ] Preview button opens correct page
- [ ] Download QR button works
- [ ] Instructions are clear

**End-to-End:**
- [ ] Create campaign with contractor info
- [ ] Upload 5 photos
- [ ] QR code generated
- [ ] Land on confirmation page
- [ ] Download QR code
- [ ] Scan QR with phone
- [ ] Landing page loads with correct photos
- [ ] Submit lead form
- [ ] Lead saved to database with correct campaign_id

---

## Risks & Dependencies

**Risks:**
- Photo upload might be slow with many large files
- QR code generation might fail
- File storage could run out of space

**Mitigation:**
- Implement client-side image compression
- Add robust error handling for QR generation
- Monitor disk usage (or use cloud storage)
- Show upload progress for transparency

**Dependencies:**
- Database schema from Sprint 1
- Landing page from Sprint 2 (QR codes link here)
- File storage location configured

---

## Notes for Next Sprint

- Sprint 4 will focus on end-to-end testing, email notifications, and deployment
- Consider adding email notification on campaign creation (confirmation to contractor)
- Lead notification system is next priority
- May need to add basic campaign dashboard for viewing leads

---

**Sprint Owner:** Claude
**Prepared:** 2025-10-13
