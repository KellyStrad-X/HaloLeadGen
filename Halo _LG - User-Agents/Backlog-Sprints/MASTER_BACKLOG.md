# HALO MVP - Master Backlog

**Project:** Halo Lead Generation Platform
**MVP Goal:** Prove that homeowners submit contact info when they see authentic local roof damage
**Success Metric:** At least one lead submission from a QR-driven campaign

**Last Updated:** 2025-10-13

---

## Backlog Organization

- **Epic:** Large feature area
- **Story:** User-facing functionality
- **Task:** Technical work item
- **Priority:** P0 (Critical/MVP Blocker) → P3 (Nice-to-have)
- **Status:** Not Started / In Progress / Complete / Blocked

---

## EPIC 1: Project Foundation

### E1-S1: Development Environment Setup [P0]
**Status:** ✅ Complete (Sprint 1)
**Description:** Initialize project with proper structure, dependencies, and tooling
**Acceptance Criteria:**
- [x] Project repository created with clear folder structure
- [x] Development environment documented
- [x] Version control initialized
- [x] Package management configured
- [x] Environment variables template created

**Tasks:**
- Create project directory structure
- Initialize git repository
- Set up .gitignore for secrets
- Document setup instructions
- Configure development tools (linter, formatter)

**Estimated Effort:** 2-3 hours

---

### E1-S2: Database Design & Setup [P0]
**Status:** ✅ Complete (Sprint 1)
**Description:** Design and implement database schema for campaigns, leads, and contractors
**Acceptance Criteria:**
- [x] Database schema documented
- [x] Core tables created (contractors, campaigns, leads, photos)
- [x] Relationships properly defined
- [x] Test data seeded for development
- [x] Migration system in place

**Database Tables:**
- **contractors:** id, name, company, email, phone, created_at
- **campaigns:** id, contractor_id, neighborhood_name, page_url, qr_code_url, created_at, status
- **leads:** id, campaign_id, name, address, email, phone, submitted_at, status
- **photos:** id, campaign_id, image_url, upload_order, uploaded_at

**Tasks:**
- Design schema with relationships
- Create database (SQLite for MVP / PostgreSQL for production)
- Write migration scripts
- Create seed data
- Document data model

**Estimated Effort:** 4-6 hours

---

### E1-S3: Technology Stack Selection [P0]
**Status:** ✅ Complete (Sprint 1)
**Description:** Choose and document core technologies for frontend, backend, and hosting
**Acceptance Criteria:**
- [x] Frontend framework selected
- [x] Backend framework selected
- [x] Database chosen
- [x] Hosting platform decided
- [x] Stack documented with rationale

**Considerations:**
- **Frontend:** React, Next.js, or simple HTML/CSS/JS
- **Backend:** Node.js (Express), Python (Flask), or serverless
- **Database:** SQLite (dev), PostgreSQL (prod), or Firebase
- **Hosting:** Vercel, Netlify, Heroku, AWS, or DigitalOcean
- **File Storage:** Local (MVP) or cloud (S3, Cloudinary)

**Tasks:**
- Evaluate options based on MVP speed and future scalability
- Document chosen stack in project README
- Set up basic "Hello World" for each layer
- Verify stack integration

**Estimated Effort:** 2-3 hours

---

## EPIC 2: Landing Page (Homeowner-Facing)

### E2-S1: Landing Page Design & Layout [P0]
**Status:** ✅ Complete (Sprint 2)
**Description:** Create responsive landing page template that displays neighborhood damage photos
**Acceptance Criteria:**
- [x] Mobile-first responsive design
- [x] Clean, trustworthy visual design
- [x] Headline: "Real Roof Damage From Your Neighborhood"
- [x] Photo gallery displays multiple images (unlimited count)
- [x] CTA section prominent and clear
- [x] Fast load times (<3 seconds)

**Design Elements:**
- Hero section with headline
- Photo gallery (grid or carousel)
- Trust indicators (contractor info, local context)
- Clear call-to-action button
- Footer with basic info

**Tasks:**
- Create wireframe/mockup
- Build HTML structure
- Write CSS for responsive layout
- Implement photo gallery component (supports many photos)
- Optimize images for web
- Test on mobile devices

**Estimated Effort:** 6-8 hours

---

### E2-S2: Lead Capture Form [P0]
**Status:** ✅ Complete (Sprint 2)
**Description:** Build form for homeowners to submit inspection requests
**Acceptance Criteria:**
- [x] Form fields: name, address, phone, email
- [x] Client-side validation
- [x] Mobile-friendly input fields
- [x] Clear submit button ("Request Free Inspection")
- [x] Success message after submission
- [x] Error handling with user-friendly messages

**Form Fields:**
- Full Name (required)
- Home Address (required)
- Phone Number (required)
- Email Address (required)
- Additional Notes (optional)

**Tasks:**
- Design form UI
- Implement form validation (email format, phone format, required fields)
- Build form submission handler
- Create success/error states
- Add loading state during submission
- Test form on various devices

**Estimated Effort:** 4-5 hours

---

### E2-S3: Form Submission & Data Storage [P0]
**Status:** ✅ Complete (Sprint 2)
**Description:** Connect form to backend and store lead data
**Acceptance Criteria:**
- [x] Form POSTs data to backend API
- [x] Lead data saved to database
- [x] Campaign ID associated with lead
- [x] Timestamp recorded
- [x] Duplicate submission handling
- [x] Data validation on server side

**Tasks:**
- Create API endpoint for lead submission (POST /api/leads)
- Validate incoming data
- Insert lead into database
- Return success/error response
- Implement basic rate limiting
- Log submissions for debugging

**Estimated Effort:** 3-4 hours

---

### E2-S4: Dynamic Page Generation [P0]
**Status:** ✅ Complete (Sprint 2)
**Description:** Generate unique landing pages per campaign with correct photos
**Acceptance Criteria:**
- [x] Each campaign has unique URL (e.g., /campaign/[id] or /c/[unique-slug])
- [x] Page loads correct photos for campaign
- [x] Page loads correct contractor info
- [x] 404 handling for invalid campaign IDs
- [x] SEO-friendly URLs

**Tasks:**
- Implement dynamic routing
- Create API to fetch campaign data by ID
- Load photos from database/storage
- Render page with campaign-specific content
- Handle edge cases (no photos, invalid ID)

**Estimated Effort:** 4-5 hours

---

## EPIC 3: Campaign Setup (Contractor-Facing)

### E3-S1: Campaign Creation Form [P0]
**Status:** Not Started
**Description:** Build interface for contractors to create new campaigns
**Acceptance Criteria:**
- [ ] Form fields: contractor name, company, email, phone, neighborhood name
- [ ] Form validation
- [ ] Simple, clear UI
- [ ] Success confirmation with next steps
- [ ] Mobile-friendly

**Form Fields:**
- Your Name (required)
- Company Name (required)
- Email (required)
- Phone (required)
- Neighborhood/Area Name (required - e.g., "Oak Ridge Subdivision, Dallas TX")

**Tasks:**
- Design campaign setup UI
- Build form component
- Add validation
- Create submission handler
- Show success state

**Estimated Effort:** 3-4 hours

---

### E3-S2: Photo Upload System [P0]
**Status:** Not Started
**Description:** Allow contractors to upload multiple damage photos (no artificial limit)
**Acceptance Criteria:**
- [ ] Multi-file upload interface
- [ ] Drag-and-drop support
- [ ] Image preview before upload
- [ ] Progress indicator during upload
- [ ] Support for many photos (10+, no hard cap)
- [ ] File type validation (JPG, PNG, WebP)
- [ ] Auto-resize/compress large images
- [ ] Photos associated with campaign

**Upload Specs:**
- Accepted formats: .jpg, .jpeg, .png, .webp
- Auto-compress images >2MB
- Display upload progress
- Show thumbnail previews
- Allow reordering photos
- Allow deleting photos before submission

**Tasks:**
- Build file upload UI (drag-and-drop zone)
- Implement multi-file selection
- Add image preview component
- Create upload handler (client side)
- Build API endpoint for photo upload (POST /api/campaigns/[id]/photos)
- Store images (local filesystem for MVP, cloud for production)
- Save image URLs to database
- Add image compression/optimization
- Handle upload errors gracefully

**Estimated Effort:** 8-10 hours

---

### E3-S3: QR Code Generation [P0]
**Status:** Not Started
**Description:** Generate unique QR codes that link to campaign landing pages
**Acceptance Criteria:**
- [ ] QR code generated for each campaign
- [ ] QR code links to correct landing page URL
- [ ] High-resolution QR code for printing
- [ ] Downloadable QR image (PNG format)
- [ ] QR code displayed on success page
- [ ] Instructions for contractor on how to use QR

**QR Code Requirements:**
- Format: PNG, high resolution (300 DPI)
- Size: Printable (at least 2" x 2")
- Error correction: Medium or High
- Contains full landing page URL

**Tasks:**
- Choose QR code library (qrcode.js, node-qrcode, etc.)
- Implement QR generation on campaign creation
- Store QR code image
- Create download endpoint
- Display QR on campaign confirmation page
- Add usage instructions for contractor

**Estimated Effort:** 3-4 hours

---

### E3-S4: Campaign Confirmation & Assets [P0]
**Status:** Not Started
**Description:** Show contractor their campaign page, QR code, and next steps
**Acceptance Criteria:**
- [ ] Confirmation page shows campaign details
- [ ] Landing page URL displayed and clickable
- [ ] QR code prominently displayed
- [ ] Download button for QR code
- [ ] Instructions for distributing QR (door hangers, signs, etc.)
- [ ] Preview link to landing page

**Confirmation Page Elements:**
- "Your campaign is live!"
- Landing page URL (copyable)
- QR code image (large, printable)
- Download QR button
- Preview landing page button
- Distribution suggestions
- What happens when leads come in

**Tasks:**
- Design confirmation page
- Display campaign data
- Render QR code
- Add copy-to-clipboard for URL
- Add download QR functionality
- Write distribution guide copy

**Estimated Effort:** 3-4 hours

---

## EPIC 4: Lead Management & Notifications

### E4-S1: Lead Notification System [P0]
**Status:** Not Started
**Description:** Notify contractor immediately when a lead is submitted
**Acceptance Criteria:**
- [ ] Email sent to contractor on new lead
- [ ] Email includes lead details (name, phone, email, address)
- [ ] Email includes campaign context (neighborhood, photos)
- [ ] Email sent within 1 minute of submission
- [ ] Fallback if email fails (logged for manual follow-up)

**Email Content:**
- Subject: "New Lead from [Neighborhood Name] Campaign"
- Lead details: name, phone, email, address, notes
- Timestamp of submission
- Link to view all leads (if dashboard exists)
- Call to action: "Contact this homeowner within 24 hours"

**Tasks:**
- Choose email service (SendGrid, Mailgun, AWS SES, or SMTP)
- Set up email service credentials
- Create email template
- Build email sending function
- Trigger email on lead submission
- Add error handling and logging
- Test email delivery

**Estimated Effort:** 4-5 hours

---

### E4-S2: Simple Lead Dashboard (Optional - P1)
**Status:** Not Started
**Description:** Basic page where contractors can view their leads
**Acceptance Criteria:**
- [ ] Protected page (basic auth or magic link)
- [ ] Lists all leads for contractor's campaigns
- [ ] Shows lead details and submission time
- [ ] Sortable by date
- [ ] Indicates which campaign generated each lead

**Dashboard Features:**
- Table view of leads
- Columns: Date, Name, Phone, Email, Address, Campaign, Status
- Filtering by campaign
- Export to CSV (bonus)

**Tasks:**
- Design simple dashboard UI
- Create API endpoint (GET /api/contractors/[id]/leads)
- Implement authentication (basic or magic link)
- Build leads table component
- Add sorting and filtering
- Style for readability

**Estimated Effort:** 5-6 hours (can be deferred to Sprint 4 or post-MVP)

---

### E4-S3: Basic Analytics [P1]
**Status:** Not Started
**Description:** Track page views and conversion rates per campaign
**Acceptance Criteria:**
- [ ] Track landing page views
- [ ] Track form submissions
- [ ] Calculate conversion rate (submissions / views)
- [ ] Display metrics per campaign

**Metrics to Track:**
- Total page views
- Unique visitors (if possible)
- Form submissions
- Conversion rate
- Time of day for submissions

**Tasks:**
- Add analytics tracking to landing page
- Store page view events in database or analytics service
- Create API endpoint for analytics data
- Display metrics on dashboard or confirmation page
- Basic visualization (numbers or simple chart)

**Estimated Effort:** 3-4 hours (can be minimal for MVP)

---

## EPIC 5: Testing & Polish

### E5-S1: End-to-End Testing [P0]
**Status:** Not Started
**Description:** Test complete user flow from campaign creation to lead submission
**Acceptance Criteria:**
- [ ] Full contractor flow tested (create campaign → upload photos → get QR)
- [ ] Full homeowner flow tested (scan QR → view page → submit form)
- [ ] Email notification received and correct
- [ ] All data properly stored in database
- [ ] Mobile responsiveness verified
- [ ] Cross-browser testing (Chrome, Safari, Firefox)

**Test Scenarios:**
1. Contractor creates campaign with 1 photo
2. Contractor creates campaign with 10+ photos
3. Homeowner scans QR and submits lead
4. Homeowner tries to submit incomplete form (validation)
5. Test on iPhone and Android
6. Test with slow internet connection
7. Test with large image uploads

**Tasks:**
- Create test campaign data
- Run through full user flows
- Test edge cases
- Document bugs
- Fix critical issues
- Verify on multiple devices

**Estimated Effort:** 4-6 hours

---

### E5-S2: Error Handling & Edge Cases [P0]
**Status:** Not Started
**Description:** Handle errors gracefully and prevent crashes
**Acceptance Criteria:**
- [ ] Invalid campaign ID shows friendly 404
- [ ] Form submission errors show clear messages
- [ ] Image upload failures are handled
- [ ] Email failures are logged
- [ ] Database errors don't crash app
- [ ] User always knows what to do next

**Edge Cases to Handle:**
- Campaign with no photos
- Duplicate lead submissions
- Invalid email addresses
- File uploads too large
- Network failures during submission
- Campaign URL with typo/wrong ID

**Tasks:**
- Add error boundaries (frontend)
- Implement try-catch on all API calls
- Create user-friendly error messages
- Log errors for debugging
- Test failure scenarios
- Add validation everywhere

**Estimated Effort:** 3-4 hours

---

### E5-S3: Performance Optimization [P1]
**Status:** Not Started
**Description:** Ensure fast load times and smooth user experience
**Acceptance Criteria:**
- [ ] Landing page loads in <3 seconds on mobile
- [ ] Images are optimized and lazy-loaded
- [ ] Form submission is fast (<2 seconds)
- [ ] No layout shift during page load
- [ ] Smooth photo gallery interaction

**Optimizations:**
- Image compression and WebP format
- Lazy loading for images
- Minify CSS/JS
- CDN for static assets (if applicable)
- Database query optimization

**Tasks:**
- Run performance audit (Lighthouse)
- Optimize images
- Implement lazy loading
- Minify assets
- Test on slow connections
- Document performance metrics

**Estimated Effort:** 3-4 hours

---

### E5-S4: Documentation & Handoff [P1]
**Status:** Not Started
**Description:** Document setup, usage, and deployment
**Acceptance Criteria:**
- [ ] README with setup instructions
- [ ] User guide for contractors
- [ ] Deployment instructions
- [ ] Environment variables documented
- [ ] Known issues/limitations noted
- [ ] Future enhancement ideas captured

**Documentation:**
- Installation guide
- Configuration guide
- API documentation (if needed)
- User flows with screenshots
- Troubleshooting guide
- Tech stack explanation

**Tasks:**
- Write comprehensive README
- Create contractor user guide
- Document deployment process
- List environment variables
- Note future features
- Add inline code comments

**Estimated Effort:** 2-3 hours

---

## EPIC 6: Deployment & Launch Prep

### E6-S1: Production Environment Setup [P0]
**Status:** Not Started
**Description:** Configure production hosting and services
**Acceptance Criteria:**
- [ ] Production server/hosting configured
- [ ] Domain name purchased and configured (if applicable)
- [ ] SSL certificate installed (HTTPS)
- [ ] Environment variables set
- [ ] Database created and migrated
- [ ] Email service configured
- [ ] File storage configured

**Tasks:**
- Choose hosting provider
- Set up production environment
- Configure DNS (if custom domain)
- Enable HTTPS
- Set environment variables
- Run database migrations
- Test email sending
- Set up monitoring (optional)

**Estimated Effort:** 4-5 hours

---

### E6-S2: MVP Launch [P0]
**Status:** Not Started
**Description:** Deploy MVP and create first real campaign
**Acceptance Criteria:**
- [ ] Application deployed to production
- [ ] First test campaign created with real contractor
- [ ] QR codes printed and distributed
- [ ] All systems operational
- [ ] Monitoring in place
- [ ] Backup plan ready

**Launch Checklist:**
- [ ] Code deployed
- [ ] Database backed up
- [ ] SSL working
- [ ] Email notifications working
- [ ] Test campaign live
- [ ] QR codes ready for field use
- [ ] Error monitoring active

**Tasks:**
- Deploy application
- Create first real campaign
- Print QR codes
- Distribute in target neighborhood
- Monitor for first lead
- Document results

**Estimated Effort:** 3-4 hours + field time

---

## Backlog Summary

**Total Epics:** 6
**Total Stories/Tasks:** 21
**Completed:** 7 items (Sprint 1: 3, Sprint 2: 4)
**In Progress:** 0 items
**Not Started:** 14 items

**P0 (Critical):** 18 items (7 complete, 11 remaining)
**P1 (Important):** 3 items (0 complete, 3 remaining)

**Estimated Total Effort:** 75-95 hours
**Completed Effort:** ~30 hours (Sprint 1 + Sprint 2)
**Remaining Effort:** ~45-65 hours

---

## Notes

- Photo upload is now unlimited (no 3-5 cap) - support many photos per campaign
- Keep MVP lean - defer nice-to-have features to post-launch
- Focus on one complete user flow that works end-to-end
- Success = 1 lead from 1 real campaign
- Technical choices should prioritize speed to market over perfection
- Document decisions as you go

---

**Last Updated:** 2025-10-13 by Claude
**Sprint 1 Complete:** 2025-10-13
**Sprint 2 Complete:** 2025-10-13
