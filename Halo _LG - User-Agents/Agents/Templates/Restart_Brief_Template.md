# Restart Brief Template

**Prepared:** <YYYY-MM-DD HH:MM UTC>
**Prepared By:** <Agent Name>
**Sprint:** <Sprint Number/Name>
**Session Duration:** <Hours worked this session>

---

## 1. Current Objective

### Primary Goal
[One-sentence description of what you're working on right now]

**Example:** Implementing swipe gesture handler for PlaceCard component with left/right detection and visual feedback.

### Acceptance Criteria
- [ ] Criterion 1 with specific metric
- [ ] Criterion 2 with specific metric
- [ ] Criterion 3 with specific metric

**Backlog Reference:** [Link to master backlog item ID, e.g., S-002]

---

## 2. Latest Status

### Completed This Session
1. **[Item 1]** - [Brief description, time spent]
   - Files modified: `path/to/file.tsx`
   - PR: [#123 if opened]
   - Tested: [Yes/No, on what platform]

2. **[Item 2]** - [Brief description, time spent]
   - Files modified: `path/to/file.tsx`
   - Notes: [Any important details]

**Total Progress:** [X% of current task complete]

### Outstanding Subtasks
- [ ] **[Subtask 1]** - Owner: [Agent], Est: [hours]
  - Dependencies: [What needs to be done first]
  - Blocker: [If any]

- [ ] **[Subtask 2]** - Owner: [Agent], Est: [hours]
  - Notes: [Any context needed]

### Known Issues
- **[Issue 1]:** [Description]
  - Severity: [Critical/High/Medium/Low]
  - Attempted fixes: [What you tried]
  - Next steps: [Ideas for resolution]

---

## 3. Key Decisions & References

### Decisions Made This Session
1. **[Decision Topic]** - [Date]
   - **Context:** [Why decision was needed]
   - **Options considered:** [A, B, C]
   - **Chosen:** [Option X]
   - **Rationale:** [One-sentence reason]
   - **Logged:** `Ops/Logs/Decisions/<date>_<topic>.md`

### Important References
- **Code Branches:**
  - Current: `feature/claude/<branch-name>`
  - Base: `main` (last synced: [date])
  - PR: [#123 if open, status]

- **Documentation:**
  - Relevant specs: [Link to Ops/doc.md]
  - API Guide: [Link if API integration]

- **Assets:**
  - Design files: [Branding/file.png]
  - Mock data: [src/constants/mockData.ts]

### Coordination Notes
- **Codex Review:** [Requested/Pending/Approved]
- **Last Sync:** [Date of last Codex check-in]
- **Next Sync:** [Expected date/time]

---

## 4. Next Action Plan

### Immediate Next Steps (Priority Order)
1. **[Task 1]** - Est: [hours]
   - Action: [Specific action to take]
   - Files: [Which files to modify]
   - Test: [How to verify]

2. **[Task 2]** - Est: [hours]
   - Action: [Specific action]
   - Dependencies: [What must be done first]

3. **[Task 3]** - Est: [hours]
   - Action: [Specific action]

### Testing Plan
- [ ] Unit tests for [component/function]
- [ ] Manual test on iOS via Expo Go
- [ ] Manual test on Android via Expo Go
- [ ] Edge case: [Specific scenario to test]

### Code Review Prep
- [ ] Run linter: `npm run lint`
- [ ] Run tests: `npm test`
- [ ] Check coverage: `npm run test:coverage`
- [ ] Update documentation if needed
- [ ] Prepare PR description

### Risks & Blockers
- **[Risk 1]:** [Description]
  - Likelihood: [High/Medium/Low]
  - Impact: [High/Medium/Low]
  - Mitigation: [Plan to address]

- **[Blocker 1]:** [Description]
  - Blocked on: [What/who]
  - Workaround: [If any]
  - Escalation needed: [Yes/No]

---

## 5. Stakeholder Notes

### Pending Questions
1. **[Question 1]** - [Context]
   - For: [Codex/Stakeholder]
   - Urgency: [Blocking/Nice to have]
   - Logged: [Where question is tracked]

2. **[Question 2]** - [Context]

### Commitments & Deadlines
- **Sprint End:** [Date]
- **Current Task Target:** [Date]
- **Next Demo:** [Date, if applicable]
- **External Dependencies:** [Any waiting on third parties]

### Communication Log
- **Last Update Sent:** [Date] to [Ops/Logs/Claude/<date>_update.md]
- **Last Feedback Received:** [Date] from [Codex in Ops/Logs/PM/<date>_review.md]

---

## 6. Environment & Setup

### Current Development Setup
- **Branch:** `feature/claude/<name>`
- **Node Version:** [18.x]
- **Expo SDK:** [51+]
- **Key Dependencies Changed:** [List if any new packages added]

### Testing Setup
- **Expo Go Version:** [Latest]
- **Test Devices:**
  - iOS: [iPhone model, iOS version]
  - Android: [Device model, Android version]

### Environment Variables
- **API Keys Configured:** [Yes/No]
- **.env Changes:** [List if any new variables added]

---

## 7. Code Quality Checklist

Before next agent picks up:
- [ ] All code committed to branch
- [ ] Commit messages follow convention
- [ ] No merge conflicts with main
- [ ] Linter passes (no errors)
- [ ] Tests pass locally
- [ ] Documentation inline (JSDoc for new functions)
- [ ] Sensitive data not committed (.env in .gitignore)

---

## 8. Handoff Context

### For Incoming Agent
**If you're picking up this work:**
1. Read this brief top to bottom
2. Review sprint overview: `Ops/Sprints/<sprint>/Sprint_Overview.md`
3. Check backlog item: `Ops/Master_Backlog.md` [Item ID]
4. Pull latest code: `git pull origin feature/claude/<branch>`
5. Review recent commits: `git log --oneline -10`
6. Check for PR feedback (if applicable)
7. Start with "Next Action Plan" section above

**Key Files to Review:**
- [File 1]: [Why it's important]
- [File 2]: [Why it's important]

**Context:**
[1-2 sentence summary of where things stand and what's most important to know]

---

## 9. Session Retrospective (Optional)

**What Went Well:**
- [Item 1]
- [Item 2]

**What Was Challenging:**
- [Challenge 1]
- [How you addressed it or plan to]

**Learnings:**
- [Technical learning or process insight]

---

## Template Notes

- **Save as:** `Ops/Restart_Briefs/<YYYY-MM-DD>_sprint<##>_<agent>.md`
- **Example:** `Ops/Restart_Briefs/2025-10-15_sprint01_claude.md`
- **Update Frequency:** End of each work session or at logical pause points
- **Audience:** Incoming agent (yourself or colleague), Codex for review

---

**End of Restart Brief**
