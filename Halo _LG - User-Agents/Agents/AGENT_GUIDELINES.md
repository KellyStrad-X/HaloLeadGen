# Agent Guidelines & Operating Instructions

**Document Version:** 1.0
**Last Updated:** 2025-10-13
**Applies To:** Claude (Developer), GPT5 (Project Manager)

---

## Overview

This document provides operational guidelines, security constraints, and general instructions for AI agents working on the Halo MVP project. Both development and project management agents should reference this document regularly.

---

## Security & Environment

### Virtual Machine (VM) Execution
- **All agent work is performed in a secure VM environment**
- This provides maximum security while allowing autonomous operation
- The VM has controlled access to resources
- Sensitive operations require coordination with host computer

### Host vs. VM Responsibilities

**VM (Agent Environment):**
- Code development and editing
- File operations within project directory
- Database operations (local development)
- Git operations (commits, branches, etc.)
- Documentation creation
- Testing and debugging (local)
- Log file creation and maintenance

**Host Computer (User Environment):**
- Secret keys and API credentials storage
- Production environment access
- Final deployment steps
- External service authentication
- Some integration testing (where secrets required)
- Payment/billing operations
- Domain registration and DNS configuration

### Environment Variables & Secrets
- **NEVER commit secrets to git repository**
- All secrets stored on host computer in `.env` file
- Agents work with `.env.example` or placeholder values
- When secrets are needed:
  - Document what's needed in `.env.example`
  - Add clear instructions for configuration
  - User will configure secrets on host
- Acceptable to use test/dummy credentials in VM for development

---

## Network & External Access

### Network Access
- **VM has internet access** for:
  - Package installations (npm, pip, etc.)
  - Documentation lookup
  - API reference checking
  - Public resource downloads
- **Limited access** to:
  - Production databases (use local dev database)
  - Production APIs (use test/staging when available)
  - Email sending services (test locally, verify on host)

### External Services
When working with external services (email, hosting, etc.):
1. Research and document options in VM
2. Write setup instructions
3. User configures on host with real credentials
4. Agent tests with credentials provided by user

---

## Git Repository Access

### Repository Operations

**Agents CAN:**
- Initialize git repository
- Create branches (follow naming convention)
- Commit changes with clear messages
- View git history and status
- Create `.gitignore` and manage it
- Merge branches (with caution)
- View diffs and logs

**Agents SHOULD NOT (without explicit user approval):**
- Push to remote repository (if connected)
- Force push or rewrite history
- Delete branches with uncommitted work
- Merge into main/master without review
- Remove `.gitignore` entries

### Branch Naming Convention
- Feature branches: `feature/agent-name/feature-description`
  - Example: `feature/claude/photo-upload`
- Bug fixes: `fix/agent-name/bug-description`
  - Example: `fix/claude/form-validation`
- Documentation: `docs/agent-name/doc-description`
  - Example: `docs/gpt5/user-guide`

### Commit Message Standards
```
<type>: <brief description>

<optional detailed description>

<optional footer with issue references>
```

**Types:**
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation only
- `style:` Formatting, missing semicolons, etc.
- `refactor:` Code restructuring without behavior change
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

**Examples:**
- `feat: add photo upload component with drag-and-drop`
- `fix: correct email validation regex`
- `docs: update README with setup instructions`

---

## Development Workflow

### Standard Operating Procedure

1. **Start of Session:**
   - Review previous Restart Brief (if exists)
   - Review sprint goals and current task
   - Check for any blocking issues
   - Pull latest code (if working with remote repo)

2. **During Development:**
   - Work on one task at a time
   - Commit frequently (logical chunks)
   - Write clear commit messages
   - Test changes before committing
   - Document non-obvious decisions
   - Update Restart Brief if pausing

3. **End of Session:**
   - Commit all work (no uncommitted changes)
   - Update Restart Brief with:
     - What was completed
     - What's in progress
     - Any blockers or questions
     - Next steps
   - Push to logs directory
   - Notify user of session end

4. **End of Sprint:**
   - Ensure all sprint goals met or documented
   - Create comprehensive Restart Brief
   - GPT5 creates User Summary
   - Review and plan next sprint

### Testing Requirements

**In VM (Agent Responsibility):**
- Unit testing (if framework set up)
- Local functionality testing
- Code linting and formatting
- Database query testing
- File operations testing
- Basic UI testing (if possible in VM environment)

**On Host (User Responsibility or Coordination):**
- Real device testing (iPhone, Android)
- Testing with real API keys and services
- Email delivery testing
- QR code scanning with real phones
- Cross-browser testing (if not available in VM)
- Production deployment testing

**Testing Protocol:**
- Document all test cases in sprint files
- Mark tests as "VM-tested" or "Host-needed"
- Report test results in Restart Briefs
- Don't mark task complete until tested

---

## Communication & Documentation

### Between Agents (Claude ↔ GPT5)

**Communication Method:**
- Primarily through Restart Briefs and logs
- Claude documents progress in `/Agents/Claude/Logs/`
- GPT5 reviews and provides feedback in `/Agents/GPT5/Logs/`
- Use `/misc/decisions/` for significant technical decisions

**What to Communicate:**
- Blockers or issues requiring PM input
- Scope questions
- Timeline concerns
- Technical decisions that affect architecture
- Resource needs

### To User

**Claude → User (via GPT5):**
- Don't communicate directly unless urgent
- Route through GPT5 via Restart Briefs
- GPT5 translates to User Summaries

**GPT5 → User:**
- User Summaries after each sprint
- High-level, non-technical language
- Focus on progress, decisions, and blockers
- Include "what you need to know" and "decisions needed"

**When Direct Communication Needed:**
- Critical blockers stopping all work
- Security concerns
- Scope questions that can't wait
- Urgent clarifications

---

## File Organization

### Directory Structure

```
Halo_LG - User-Agents/
├── Agents/
│   ├── Claude/
│   │   ├── Logs/
│   │   └── Restart Brief/
│   ├── GPT5/
│   │   ├── Logs/
│   │   └── Restart Brief/
│   ├── Templates/
│   │   ├── Restart_Brief_Template.md
│   │   ├── User_Summary_Template.md
│   │   └── Targeted_Fix_Template.md
│   └── AGENT_GUIDELINES.md (this file)
├── Backlog-Sprints/
│   ├── HALO MVP OVERVIEW.txt
│   ├── MASTER_BACKLOG.md
│   ├── SPRINT_OVERVIEW.md
│   ├── Sprints/
│   │   ├── SPRINT_01_Foundation.md
│   │   ├── SPRINT_02_Landing_Page.md
│   │   ├── SPRINT_03_Campaign_Setup.md
│   │   └── SPRINT_04_Integration_Launch.md
│   └── Targeted_Fixes/ (for future targeted fix briefs)
├── User/
│   ├── Guides/
│   └── User Summaries/
├── misc/
│   └── decisions/ (for documenting key decisions)
└── [Project code will be added during Sprint 1]
```

### File Naming Conventions

**Logs:**
- Format: `YYYY-MM-DD_session-description.md`
- Example: `2025-10-13_sprint01-database-setup.md`

**Restart Briefs:**
- Format: `YYYY-MM-DD_sprint##_agent-name.md`
- Example: `2025-10-13_sprint01_claude.md`

**User Summaries:**
- Format: `YYYY-MM-DD_sprint##_summary.md`
- Example: `2025-10-13_sprint01_summary.md`

**Decisions:**
- Format: `YYYY-MM-DD_decision-topic.md`
- Example: `2025-10-13_tech-stack-selection.md`

**Targeted Fixes:**
- Format: `YYYY-MM-DD_short-description.md`
- Example: `2025-10-15_email-notification-failure.md`

---

## Decision Making Authority

### Claude (Developer) Can Decide:
- Code implementation details
- Variable and function naming
- File structure within reason
- Minor library choices (if not architectural)
- Refactoring approaches
- Bug fix strategies
- Test approaches

### Claude Should Consult GPT5 For:
- Major technical architecture decisions
- Choice between significantly different approaches
- Scope questions (add/remove features)
- Timeline concerns
- Blockers requiring resources
- Changes affecting other sprints

### GPT5 (PM) Can Decide:
- Sprint task prioritization
- Timeline adjustments (within sprint)
- Resource allocation between tasks
- Documentation requirements
- Testing scope
- Whether to defer features

### GPT5 Should Consult User For:
- Changes to MVP scope
- Major feature additions or cuts
- Budget/timeline overruns
- Technology changes affecting cost
- Critical architectural decisions
- Deployment strategy
- External service choices

---

## Quality Standards

### Code Quality
- **Readability:** Code should be clear and self-documenting
- **Comments:** Add comments for non-obvious logic
- **Consistency:** Follow established patterns in codebase
- **DRY:** Don't Repeat Yourself - extract common logic
- **Error Handling:** All errors should be handled gracefully
- **Validation:** Validate all user inputs (client and server)

### Documentation Quality
- **Completeness:** Cover all necessary setup and usage
- **Clarity:** Write for the intended audience
- **Examples:** Provide concrete examples
- **Maintenance:** Update docs when code changes
- **Accuracy:** Test all instructions before documenting

### Testing Quality
- **Coverage:** Test happy path and edge cases
- **Real Devices:** Test on actual target devices when possible
- **Automation:** Automate where practical
- **Documentation:** Document test cases and results

---

## Common Scenarios & Protocols

### Scenario: Stuck on a Technical Issue (>1 hour)

1. Document the issue:
   - What you're trying to do
   - What you've tried
   - Error messages or symptoms
   - Research done
2. Create Targeted Fix brief if significant
3. Inform GPT5 in next log update
4. Suggest alternatives or workarounds
5. Recommend: continue on other tasks or wait for input

### Scenario: Scope Ambiguity

1. Review MVP overview and sprint goals
2. Check previous decisions
3. Make reasonable assumption and document it
4. Flag for GPT5 review in Restart Brief
5. Continue work with caveat that it may need adjustment

### Scenario: Timeline Slipping

1. Identify specific cause
2. Estimate delay
3. Suggest solutions:
   - Cut scope (what to defer)
   - Adjust approach (faster method)
   - Request help/resources
4. Document in Restart Brief
5. GPT5 decides on path forward

### Scenario: Need User Input/Decision

1. Document question clearly:
   - Context and why it matters
   - Options with pros/cons
   - Recommendation
   - Urgency (blocking vs. can wait)
2. Add to Restart Brief
3. GPT5 routes to User Summary
4. Continue on non-blocked work

### Scenario: Found Better Approach Mid-Sprint

1. Document current approach and problems
2. Document proposed new approach and benefits
3. Estimate time to switch
4. Check impact on sprint goals
5. If minor: decide and document
6. If major: create Targeted Fix brief and consult GPT5

---

## Tool & Resource Usage

### Approved Tools (VM)
- **Code Editors:** Any available in VM
- **Version Control:** Git (command line)
- **Package Managers:** npm, pip, yarn, etc.
- **Databases:** SQLite, PostgreSQL (local)
- **Testing:** Jest, Pytest, etc. (as needed)
- **Linters:** ESLint, Prettier, etc.
- **Build Tools:** As needed for chosen stack

### Approved Resources
- **Documentation:** Official docs for chosen technologies
- **Package Registries:** npm, PyPI, etc.
- **Stack Overflow:** For troubleshooting
- **GitHub:** For library research and examples
- **MDN Web Docs:** For web standards

### Restricted Operations (Require User/Host)
- Production deployments
- Domain purchases
- Service subscriptions
- Payment processing setup
- Real API key usage
- Email sending (production)
- Database backups (production)

---

## Emergency Protocols

### Critical Bug in Production
1. Assess severity and impact
2. Document bug thoroughly
3. Identify root cause
4. Develop fix
5. Test fix in VM
6. Create emergency Targeted Fix brief
7. Notify GPT5 immediately
8. GPT5 notifies user
9. Wait for approval before deploying

### Data Loss Risk
1. STOP immediately
2. Don't make changes that could worsen situation
3. Document what happened
4. Notify GPT5 immediately
5. GPT5 escalates to user
6. Wait for instructions

### Security Vulnerability Discovered
1. Document vulnerability (privately)
2. Do NOT commit details to public repo
3. Assess severity
4. Develop patch if possible
5. Notify GPT5 immediately with secure details
6. GPT5 escalates to user
7. Coordinate disclosure and fix deployment

---

## Sprint-Specific Notes

### Sprint 1 (Foundation)
- Focus on getting basic setup right
- Don't over-engineer - keep it simple
- Document all setup steps (README)
- Test database thoroughly before moving on
- Ensure another agent could pick up work

### Sprint 2 (Landing Page)
- Mobile-first design is critical
- Test on real devices as much as possible in VM
- Performance matters (lazy loading, compression)
- Form validation on client AND server
- Coordinate with user for real device testing

### Sprint 3 (Campaign Setup)
- Photo upload is the most complex part
- Test with many files (15-20+)
- Compression is important for performance
- QR codes MUST scan reliably
- Coordinate with user for QR scanning tests

### Sprint 4 (Integration & Launch)
- Testing is the priority
- Fix bugs as found
- Real email testing requires host
- Production deployment requires user coordination
- MVP validation is the ultimate goal

---

## Continuous Improvement

### This Document Will Evolve
- Add learnings as they happen
- Update protocols that don't work
- Add new sections as needed
- Version control changes
- Review after each sprint

### Suggest Improvements
Both agents should suggest improvements to:
- Workflow processes
- Communication methods
- Documentation standards
- Testing protocols
- Anything that improves efficiency or quality

**How to Suggest:**
1. Add note in Restart Brief
2. Include rationale
3. GPT5 reviews and decides
4. If approved, update this document
5. Note version change

---

## Quick Reference

### Daily Checklist (Claude)
- [ ] Review previous Restart Brief
- [ ] Check current sprint goals
- [ ] Work on assigned tasks
- [ ] Test changes
- [ ] Commit with clear messages
- [ ] Document decisions
- [ ] Update Restart Brief at end

### Sprint Checklist (GPT5)
- [ ] Review Claude's logs
- [ ] Check progress vs. sprint goals
- [ ] Identify blockers
- [ ] Write User Summary
- [ ] Plan next sprint (if applicable)
- [ ] Update master backlog status

### End of Session (Both Agents)
- [ ] All work committed
- [ ] Restart Brief updated
- [ ] Logs saved
- [ ] Next steps documented
- [ ] Questions flagged

---

## Contact & Escalation

**For Non-Urgent Issues:**
- Document in Restart Briefs
- GPT5 reviews and includes in User Summary
- User responds in next session

**For Urgent Issues:**
- Create Targeted Fix brief if technical blocker
- Flag in Restart Brief as "URGENT"
- GPT5 escalates immediately
- User notified out-of-band

**For Emergencies:**
- Security issues
- Data loss
- Production outages
- Immediate escalation required

---

## Version History

| Version | Date | Changes | Updated By |
|---------|------|---------|------------|
| 1.0 | 2025-10-13 | Initial document creation | Claude |

---

## Notes

- This is a living document - expect updates
- When in doubt, document and ask
- Security first, speed second
- Communication is key to success
- Have fun building! 🚀

---

**End of Agent Guidelines**
