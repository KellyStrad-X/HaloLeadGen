# Mobile Standards & Guidelines

**Created:** 2025-01-25
**Purpose:** Establish mobile baseline and development standards for future features

---

## Mobile Philosophy: "Field Operations Ready"

Mobile is optimized for **time-sensitive operations** that contractors need while in the field:
- ✅ Responding to new leads
- ✅ Scheduling jobs
- ✅ Updating job status
- ✅ Quick reference (viewing campaigns, leads, stats)

**NOT optimized for:**
- Complex admin tasks (creating campaigns with photo uploads)
- Bulk operations
- Heavy data entry

---

## Breakpoint Standard

**Desktop-first development with mobile fallbacks:**
- **Mobile:** < 768px (`md:` breakpoint)
- **Desktop:** ≥ 768px
- **Large Desktop:** ≥ 1024px (`lg:`)
- **Extra Large:** ≥ 1280px (`xl:`)

**Rule:** All new features must be functional on mobile, but UX can be simplified.

---

## Current Mobile Implementation

### ✅ What Works on Mobile (Fully Functional)

**Navigation:**
- Hamburger menu with slide-out drawer
- Tab switching (Dashboard, Analytics, Campaigns, Leads)
- Access to sidebar via menu

**Lead Management:**
- View leads in sidebar (full-screen overlay)
- Tap lead cards to open management modal
- Schedule jobs with date picker
- Update contact attempts
- Mark as cold
- Call/email from lead cards

**Job Management:**
- View agenda of upcoming jobs (next 14 days)
- Tap jobs to edit
- Update job status
- Reschedule inspections
- Mark completed

**Campaign Viewing:**
- Browse campaigns in table
- View campaign details modal
- Copy campaign URLs
- View QR codes

**Dashboard Overview:**
- View stats (campaign count, leads, jobs)
- Recent leads/campaigns lists
- Campaign map (basic view)

### 🚫 Desktop-Only Features

**Disabled on Mobile:**
- Calendar drag-and-drop (uses agenda view instead)
- Lead drag-and-drop (tap to open modal instead)
- Job drag between columns (use status dropdown)

**Not Recommended:**
- Creating campaigns (complex multi-step with uploads)
- Bulk campaign operations
- Advanced filtering/sorting

---

## Mobile Component Patterns

### Modals
```tsx
{/* Container */}
<div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 px-4 py-6">
  {/* Modal */}
  <div className="relative w-full max-w-3xl overflow-hidden rounded-xl border border-[#373e47] bg-[#1e2227]">
    {/* Content */}
  </div>
</div>
```

**Rules:**
- Always use `px-4 py-6` padding on container
- Max width: `max-w-3xl` (or smaller)
- Mobile: modal should be scrollable if content overflows
- Use `md:grid-cols-2` for responsive grids

### Sidebar Overlays
```tsx
{/* Backdrop */}
<div className="md:hidden fixed inset-0 bg-black/50 z-40" onClick={close} />

{/* Overlay */}
<div className="fixed md:relative inset-0 md:inset-auto z-50 md:z-auto bg-[#1e2227]">
  {/* Content */}
</div>
```

**Rules:**
- Mobile: full-screen overlay with backdrop
- Desktop: side-by-side layout
- Include close button visible on mobile

### Touch-Friendly Buttons
```tsx
<button className="px-4 py-2.5 rounded-lg">
  {/* Minimum 44px touch target */}
</button>
```

**Rules:**
- Minimum height: 44px (use `py-2.5` or `py-3`)
- Minimum width: 44px
- Adequate spacing between tappable elements (gap-2 minimum)

### Responsive Grids
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  {/* Stacks on mobile, 2 columns on desktop */}
</div>
```

**Rules:**
- Default to single column on mobile
- Use `md:` breakpoint for multi-column
- Maintain gap-4 or gap-6 for breathing room

---

## Drag-and-Drop on Mobile

**Don't use drag-and-drop on mobile.** Provide alternative interactions:

❌ **Bad:** Calendar drag-and-drop
✅ **Good:** Agenda view with tap-to-edit

❌ **Bad:** Drag leads to schedule
✅ **Good:** Tap lead → modal → schedule button

**Implementation Pattern:**
```tsx
const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

<div
  draggable={!isMobile}
  onDragStart={(e) => {
    if (isMobile) return;
    // ... drag logic
  }}
>
```

---

## Mobile Testing Checklist

Before shipping features, verify:

### Layout
- [ ] No horizontal scroll on mobile viewport (< 768px)
- [ ] All text is readable (min 14px)
- [ ] Images scale properly
- [ ] Modals fit viewport with padding

### Interaction
- [ ] All buttons are tappable (44px+ touch targets)
- [ ] Forms are usable (inputs not too small)
- [ ] No hover-only interactions
- [ ] Links/buttons have adequate spacing

### Functionality
- [ ] Critical workflows work (schedule lead, update job)
- [ ] Modals scroll when content overflows
- [ ] Date pickers work on touch devices
- [ ] Phone/email links work (`tel:` and `mailto:`)

### Navigation
- [ ] Hamburger menu opens/closes
- [ ] Sidebar overlay works
- [ ] Tab switching functions
- [ ] Back button doesn't break state

---

## Future Development Guidelines

### When Adding New Features

**Required (Mobile Must Work):**
1. Feature must be accessible from mobile navigation
2. Critical workflows must be completable
3. No horizontal scroll
4. Modals must be responsive

**Optional (Can Be Desktop-Only):**
1. Advanced features can show "Use desktop for best experience" message
2. Complex data entry can be simplified or disabled
3. Drag-and-drop interactions can have button alternatives

### Code Review Questions

Before merging mobile changes:
1. Did you test on < 768px viewport?
2. Are all touch targets 44px+ ?
3. Does it work without drag-and-drop?
4. Are there any `hover:` only interactions?
5. Does the layout stack properly?

---

## Known Mobile Limitations

**Accepted Trade-offs:**
- Calendar shows agenda view (not full month grid)
- Sidebar only shows via hamburger menu (not side-by-side)
- Some advanced filtering limited
- Campaign creation UX not optimized (desktop recommended)

**Not Broken, Just Simplified:**
These are intentional design decisions to maintain mobile functionality without over-investing in mobile-specific features for a primarily desktop workflow.

---

## Mobile Optimization Backlog

**If we want to improve mobile in the future:**
1. Add swipe gestures for lead cards
2. Create mobile-specific campaign creation flow
3. Add pull-to-refresh on data lists
4. Implement mobile-optimized filters (bottom sheet)
5. Add floating action button for common actions
6. Create mobile calendar day/week view

**But for now:** Current mobile is "good enough" for field operations.

---

## Summary

**Mobile = Functional baseline for time-sensitive operations**
**Desktop = Full-featured experience for all workflows**

This allows us to build desktop-first while ensuring contractors can respond to leads and manage jobs from their phone when needed.
