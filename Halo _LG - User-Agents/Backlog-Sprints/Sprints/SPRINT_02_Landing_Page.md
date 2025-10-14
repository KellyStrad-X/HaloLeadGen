# Sprint 2: Landing Page & Lead Capture

**Sprint Duration:** 2-3 days
**Sprint Goal:** Build homeowner-facing landing page with photo gallery and working lead capture form
**Estimated Effort:** 17-22 hours

---

## Sprint Objective

Create the public-facing landing page that homeowners see when they scan a QR code. This page must display neighborhood damage photos beautifully, build trust, and capture lead information through a simple form. By the end of this sprint, a visitor should be able to view photos and submit their contact information, which gets stored in the database.

---

## Sprint Backlog

### 1. Landing Page Design & Layout [E2-S1]
**Priority:** P0
**Estimated:** 6-8 hours

**Tasks:**
- [ ] Design mobile-first layout (most users will scan QR on phone)
- [ ] Create page structure:
  - Header with logo/branding (simple)
  - Hero section with headline
  - Photo gallery section (supports many photos)
  - Trust/credibility section
  - Lead capture form
  - Footer with basic info
- [ ] Write compelling copy:
  - Headline: "Real Roof Damage From Your Neighborhood"
  - Subheadline: Build urgency and local relevance
  - CTA: "Request Free Inspection" or "Check My Roof"
- [ ] Build responsive CSS
  - Mobile: Single column, stack elements
  - Tablet/Desktop: Can use grid or multi-column
  - Ensure tap targets are large enough (44px minimum)
- [ ] Implement photo gallery:
  - Grid layout or carousel/slider
  - Support for many photos (10+)
  - Lazy loading for performance
  - Lightbox/modal for enlarged view (optional)
  - Smooth scrolling/swiping
- [ ] Add trust indicators:
  - Contractor company name
  - "Local contractor in [neighborhood]"
  - Optional: "Free inspection, no obligation"
- [ ] Optimize for speed:
  - Minify CSS
  - Compress images
  - Lazy load images below fold

**Design Guidelines:**
- Clean and professional (not flashy)
- Build trust (conservative design)
- Mobile-first (80%+ of traffic will be mobile)
- Fast loading (3 seconds max on 4G)
- Clear visual hierarchy (photos → CTA → form)

**Acceptance Criteria:**
- ✓ Page is fully responsive (looks good on all screen sizes)
- ✓ Photo gallery displays 1-20+ photos without breaking
- ✓ Page loads in <3 seconds on mobile
- ✓ Design builds trust and credibility
- ✓ Call-to-action is prominent and clear
- ✓ Tested on iPhone and Android

---

### 2. Lead Capture Form [E2-S2]
**Priority:** P0
**Estimated:** 4-5 hours

**Tasks:**
- [ ] Design form UI with clear labels
- [ ] Implement form fields:
  - **Full Name** (text input, required)
  - **Home Address** (text input or textarea, required)
  - **Phone Number** (tel input, required)
  - **Email Address** (email input, required)
  - **Additional Notes** (textarea, optional)
- [ ] Add client-side validation:
  - Required fields must be filled
  - Email format validation
  - Phone format validation (US: 10 digits)
  - Real-time validation feedback (show errors as user types)
- [ ] Style form for mobile:
  - Large input fields (easy to tap)
  - Clear labels above fields
  - Use appropriate input types (email, tel, text)
  - Auto-capitalize names, streets
  - Proper keyboard on mobile (email keyboard, phone keyboard)
- [ ] Add submit button:
  - Clear label: "Request Free Inspection"
  - Loading state (spinner) during submission
  - Disabled state after submission
- [ ] Create success state:
  - Thank you message
  - "We'll contact you within 24 hours"
  - Hide form after successful submission
- [ ] Create error state:
  - User-friendly error messages
  - Highlight fields with errors
  - Maintain form data (don't clear on error)

**Form Validation Rules:**
- Name: 2-100 characters
- Address: 10-200 characters
- Email: Valid email format (includes @)
- Phone: 10 digits (US format)
- Notes: 0-500 characters

**Acceptance Criteria:**
- ✓ All fields render correctly on mobile
- ✓ Validation works (can't submit invalid data)
- ✓ Error messages are clear and helpful
- ✓ Success message appears after submission
- ✓ Form is accessible (labels, ARIA attributes)
- ✓ Form works with autofill

---

### 3. Form Submission & Data Storage [E2-S3]
**Priority:** P0
**Estimated:** 3-4 hours

**Tasks:**
- [ ] Create API endpoint: `POST /api/leads`
  - Accept JSON payload with lead data
  - Validate all fields on server side
  - Return 200 on success, 400 on validation error, 500 on server error
- [ ] Implement server-side validation:
  - Check all required fields present
  - Validate email format
  - Validate phone format
  - Sanitize input (prevent SQL injection, XSS)
  - Check campaign exists
- [ ] Insert lead into database:
  - Get campaign_id from request
  - Insert lead with all fields
  - Set submitted_at timestamp
  - Set status to "new"
- [ ] Handle edge cases:
  - Duplicate submission check (same email + campaign within 1 hour)
  - Invalid campaign ID
  - Database errors
  - Rate limiting (max 5 submissions per IP per hour)
- [ ] Return appropriate responses:
  - Success: `{ "success": true, "message": "Thank you! We'll contact you soon." }`
  - Error: `{ "success": false, "error": "Invalid email format" }`
- [ ] Log submissions:
  - Log successful submissions
  - Log errors for debugging
  - Don't log sensitive data in plain text

**API Endpoint Design:**

```javascript
POST /api/leads
Content-Type: application/json

Request Body:
{
  "campaign_id": 123,
  "name": "John Doe",
  "address": "123 Oak Street, Dallas TX 75001",
  "email": "john@example.com",
  "phone": "214-555-1234",
  "notes": "I think I have damage on the north side"
}

Response (Success):
{
  "success": true,
  "message": "Thank you! We'll contact you within 24 hours."
}

Response (Error):
{
  "success": false,
  "error": "Email address is invalid"
}
```

**Acceptance Criteria:**
- ✓ API endpoint accepts POST requests
- ✓ Server-side validation works correctly
- ✓ Lead data is saved to database
- ✓ Duplicate submissions are prevented
- ✓ Errors return helpful messages
- ✓ Rate limiting prevents spam
- ✓ Tested with various inputs (valid, invalid, malicious)

---

### 4. Dynamic Page Generation [E2-S4]
**Priority:** P0
**Estimated:** 4-5 hours

**Tasks:**
- [ ] Implement dynamic routing:
  - URL pattern: `/c/[slug]` or `/campaign/[id]`
  - Example: `/c/oak-ridge-dallas` or `/campaign/123`
- [ ] Create API endpoint: `GET /api/campaigns/:id_or_slug`
  - Fetch campaign by ID or slug
  - Include contractor info
  - Include all photos (ordered by upload_order)
  - Return 404 if not found
- [ ] Build page component:
  - Fetch campaign data on page load
  - Render page with dynamic data:
    - Campaign-specific headline (with neighborhood name)
    - Contractor company name
    - Photos from database
    - Pre-fill campaign_id in form
- [ ] Handle loading states:
  - Show spinner while loading campaign data
  - Show error if campaign not found
- [ ] Handle edge cases:
  - Campaign has no photos (show message or hide gallery)
  - Campaign is paused/inactive (show "Campaign ended" message)
  - Invalid campaign ID (show 404 page)
- [ ] SEO optimization:
  - Dynamic meta tags (title, description)
  - Open Graph tags for social sharing
  - Friendly URL slugs

**Page Data Flow:**
1. User visits `/c/oak-ridge-dallas`
2. App fetches campaign with slug "oak-ridge-dallas"
3. Database returns campaign + contractor + photos
4. Page renders with dynamic content
5. Form includes hidden campaign_id field
6. User submits form → lead linked to correct campaign

**Acceptance Criteria:**
- ✓ Each campaign has unique URL
- ✓ Page loads correct data for each campaign
- ✓ Photos display correctly (all photos, in order)
- ✓ 404 page shown for invalid campaigns
- ✓ Campaign with no photos handled gracefully
- ✓ Form submission links lead to correct campaign
- ✓ URLs are SEO-friendly (slugs, not just IDs)

---

## Sprint Deliverables

By end of Sprint 2:
- [ ] Landing page fully designed and responsive
- [ ] Photo gallery works with many photos
- [ ] Lead capture form functional
- [ ] Form validation (client and server side)
- [ ] API endpoint for lead submission
- [ ] Leads saved to database
- [ ] Dynamic page generation per campaign
- [ ] 404 handling for invalid campaigns
- [ ] Tested on mobile and desktop

---

## Definition of Done

- [ ] All code committed with clear messages
- [ ] Landing page works end-to-end (view → submit → stored)
- [ ] Tested on real mobile devices (iPhone, Android)
- [ ] Form submission creates database record
- [ ] No console errors or warnings
- [ ] Lighthouse score: 90+ performance on mobile
- [ ] Sprint 2 Restart Brief created

---

## Testing Checklist

**Landing Page:**
- [ ] Loads on desktop browser
- [ ] Loads on iPhone Safari
- [ ] Loads on Android Chrome
- [ ] Photo gallery displays 1 photo correctly
- [ ] Photo gallery displays 15+ photos correctly
- [ ] Page loads in <3 seconds on 4G
- [ ] No layout shift during load

**Form:**
- [ ] Can type in all fields
- [ ] Required field validation works
- [ ] Email validation works
- [ ] Phone validation works
- [ ] Error messages are clear
- [ ] Submit button shows loading state
- [ ] Success message appears after submission
- [ ] Can't double-submit

**Data:**
- [ ] Form submission creates record in database
- [ ] All fields saved correctly
- [ ] Campaign ID associated properly
- [ ] Timestamp recorded

**Edge Cases:**
- [ ] Invalid campaign URL shows 404
- [ ] Campaign with no photos handled
- [ ] Duplicate submission prevented
- [ ] Network error handled gracefully

---

## Risks & Dependencies

**Risks:**
- Photo gallery performance with many large images
- Form submission might be slow on poor connections

**Mitigation:**
- Compress and resize images
- Lazy load images
- Add loading states for feedback
- Test on slow connections

**Dependencies:**
- Database and schema from Sprint 1
- Test campaign data seeded

---

## Notes for Next Sprint

- Sprint 3 will build the contractor-facing campaign setup
- Photo upload component will need to be robust (handle many files)
- Consider adding image compression on upload
- QR code generation will link to these landing page URLs

---

**Sprint Owner:** Claude
**Prepared:** 2025-10-13
