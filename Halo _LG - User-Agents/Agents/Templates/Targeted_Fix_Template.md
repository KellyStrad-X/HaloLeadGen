# Targeted Fix Template

**Created:** <YYYY-MM-DD HH:MM UTC>
**Created By:** <Agent Name>
**Sprint Context:** <Current Sprint Number/Name>
**Type:** [Bug Fix / Feature Addition / Refactor / Architecture Change / Blocker Resolution]

---

## Problem Statement

### Issue Summary
[One-sentence description of the problem or desired change]

**Example:** QR code generation fails when contractor uploads images larger than 5MB, blocking campaign creation.

### Current Behavior
[Describe what's happening now that's problematic]

**Symptoms:**
- [Specific error message or behavior]
- [When it occurs]
- [Frequency or conditions]

### Desired Behavior
[Describe what should happen instead]

**Success looks like:**
- [Specific outcome 1]
- [Specific outcome 2]
- [Measurable metric if applicable]

---

## Context & Impact

### Why This Matters
**Business Impact:**
- [How this affects users or the product value]
- [Cost of NOT fixing (lost leads, poor UX, etc.)]
- [Urgency level: Critical / High / Medium / Low]

**Technical Impact:**
- [What areas of the codebase are affected]
- [How this impacts other features or planned work]
- [Technical debt implications if not addressed]

### Discovery Details
**How was this found:**
- [Testing / User report / Code review / Other]
- [When: Date and context]

**Related Issues:**
- [Link to similar problems or related work]
- [Dependencies or connected tasks]

---

## Analysis

### Root Cause
[What's actually causing the problem - be specific]

**Technical explanation:**
[Describe the underlying cause in technical terms]

**Why it happened:**
- [Design oversight / Bug introduced in [commit/feature] / External dependency / etc.]

### Affected Components
- **Files/Modules:**
  - `path/to/file1.tsx` - [What role this plays]
  - `path/to/file2.ts` - [What role this plays]

- **Dependencies:**
  - [Package or service name] - [How it's involved]

- **Data:**
  - [Database tables / API endpoints / State management affected]

### Reproduction Steps
1. [Step 1]
2. [Step 2]
3. [Step 3]
4. **Expected:** [What should happen]
5. **Actual:** [What actually happens]

---

## Proposed Solution

### Approach
[Describe the fix or change you're proposing]

**High-level strategy:**
[Explain the solution approach in plain language]

**Technical implementation:**
1. [Step 1 - what needs to be changed]
2. [Step 2 - what needs to be added/modified]
3. [Step 3 - what needs to be tested]

### Alternative Approaches Considered
1. **[Alternative 1]**
   - Pros: [Benefits]
   - Cons: [Drawbacks]
   - Why not chosen: [Reason]

2. **[Alternative 2]**
   - Pros: [Benefits]
   - Cons: [Drawbacks]
   - Why not chosen: [Reason]

### Rationale for Chosen Solution
[Explain why this approach is best given constraints, timeline, and impact]

---

## Scope & Effort

### Work Required
**Development:**
- [Task 1] - Est: [X hours]
- [Task 2] - Est: [X hours]
- [Task 3] - Est: [X hours]

**Testing:**
- [Test scenario 1]
- [Test scenario 2]
- [Edge cases to verify]

**Documentation:**
- [What needs to be updated in docs/guides]

**Total Estimate:** [X hours / Y days]

### Risk Assessment
**Implementation Risks:**
- **[Risk 1]:** [Description]
  - Likelihood: [High/Medium/Low]
  - Impact: [High/Medium/Low]
  - Mitigation: [How to reduce risk]

**Regression Risks:**
- [What might break as a result of this change]
- [How we'll catch regressions (tests, manual checks)]

---

## Sprint Integration Decision

### In-Sprint or Out-of-Sprint?

**If doing NOW (in current sprint):**
- [ ] This is a blocker for current sprint goals
- [ ] This is quick (<2 hours) and low-risk
- [ ] This prevents future critical issues
- [ ] User explicitly requested priority

**Impact on current sprint if done now:**
- Will delay: [Other sprint tasks]
- Will require: [Shifting priorities / Additional time / Help]
- Trade-off: [What we give up to do this now]

**If deferring to future sprint:**
- [ ] Can work around for now
- [ ] Not blocking critical path
- [ ] Requires more research/planning
- [ ] Lower priority than current goals

**Workaround (if deferring):**
[Temporary solution to keep working while this is in backlog]

---

## Decision

**Recommendation:** [Do Now / Defer to Sprint X / Need More Info / Won't Do]

**Rationale:**
[Brief explanation of the recommendation based on impact, effort, and priorities]

**Decided By:** [Agent making recommendation]
**Approved By:** [GPT5 / User - fill in after decision]
**Decision Date:** [YYYY-MM-DD]

**Action:**
- [ ] Add to current sprint (if approved)
- [ ] Add to backlog for future sprint [Sprint #]
- [ ] Create tracking issue in `Backlog-Sprints/Issues/`
- [ ] Log decision in `misc/decisions/`

---

## Implementation Plan (If Approved)

### Acceptance Criteria
- [ ] [Specific criterion 1]
- [ ] [Specific criterion 2]
- [ ] [Specific criterion 3]
- [ ] Tests pass
- [ ] No regressions in [related feature]

### Testing Plan
**Unit Tests:**
- [What to test at function/component level]

**Integration Tests:**
- [What to test at system level]

**Manual Testing:**
- [What to verify manually]
- [Devices/browsers to test on]

### Rollback Plan
**If something goes wrong:**
1. [How to revert changes]
2. [How to restore previous state]
3. [Data migration rollback if needed]

---

## Coordination

### Stakeholder Communication
- [ ] User informed (if affects current expectations)
- [ ] GPT5 notified (for sprint tracking)
- [ ] Documented in appropriate logs

### Dependencies
**Requires:**
- [Other work that must be done first]
- [Access, resources, or information needed]

**Blocks:**
- [Other work waiting on this]

---

## Success Metrics

**How we'll know it worked:**
- [Metric 1: e.g., Error rate drops to 0%]
- [Metric 2: e.g., Feature works in X scenarios]
- [Metric 3: e.g., No user complaints for Y days]

**Follow-up needed:**
- [ ] Monitor for [X days] after deployment
- [ ] Check analytics for [specific metric]
- [ ] Get user feedback on [specific aspect]

---

## Template Notes

- **Save as:** `Backlog-Sprints/Targeted_Fixes/<YYYY-MM-DD>_<short-description>.md`
- **Example:** `Backlog-Sprints/Targeted_Fixes/2025-10-15_image-upload-size-limit.md`
- **When to use:** When stuck on an issue for >1 hour, or when considering work outside current sprint scope
- **Audience:** Agent creating it, GPT5 for decision-making, User for major changes

---

**End of Targeted Fix Brief**
