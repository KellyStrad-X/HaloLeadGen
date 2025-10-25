# Claude.MD - Agent Documentation Hub

**Purpose**: Targeted documentation for AI agents working on specific areas of the Halo Lead Gen codebase.

**Quick Access**: [QUICK-START.md](./QUICK-START.md) | [RECENT-CHANGES.md](./RECENT-CHANGES.md) | [Root CLAUDE.md](../CLAUDE.md)

---

## Working on a Specific Area?

Use this table to find relevant guides:

| **Task** | **Read These Guides** |
|----------|----------------------|
| **Dashboard UI/Features** | [DASHBOARD.md](./areas/DASHBOARD.md), [MODALS.md](./areas/MODALS.md), [COMPONENTS.md](./patterns/COMPONENTS.md) |
| **Campaign Management** | [CAMPAIGNS.md](./areas/CAMPAIGNS.md), [FIREBASE.md](./patterns/FIREBASE.md), [MODALS.md](./areas/MODALS.md) |
| **Lead/Job Pipeline** | [LEADS.md](./areas/LEADS.md), [API-ROUTES.md](./patterns/API-ROUTES.md) |
| **Maps/Geocoding** | [MAPS.md](./areas/MAPS.md) |
| **Analytics/Reporting** | [ANALYTICS.md](./areas/ANALYTICS.md), [DASHBOARD.md](./areas/DASHBOARD.md) |
| **API Development** | [API-ROUTES.md](./patterns/API-ROUTES.md), [AUTHENTICATION.md](./patterns/AUTHENTICATION.md), [FIREBASE.md](./patterns/FIREBASE.md) |
| **New Components** | [COMPONENTS.md](./patterns/COMPONENTS.md), [MODALS.md](./areas/MODALS.md) |
| **Auth/Security** | [AUTHENTICATION.md](./patterns/AUTHENTICATION.md), [API-ROUTES.md](./patterns/API-ROUTES.md) |

---

## Documentation Structure

### Quick Reference
- **[QUICK-START.md](./QUICK-START.md)** - 5-minute agent onboarding
- **[RECENT-CHANGES.md](./RECENT-CHANGES.md)** - Recent implementations and breaking changes

### Feature Areas (`areas/`)
Guides focused on major feature domains:
- **[DASHBOARD.md](./areas/DASHBOARD.md)** - Dashboard architecture, tabs, sidebar, state management
- **[CAMPAIGNS.md](./areas/CAMPAIGNS.md)** - Campaign creation, lifecycle, photos, QR codes
- **[LEADS.md](./areas/LEADS.md)** - Lead capture, job promotion, pipeline management
- **[MODALS.md](./areas/MODALS.md)** - Modal system, sidebar context, patterns
- **[MAPS.md](./areas/MAPS.md)** - Map implementations, geocoding strategy
- **[ANALYTICS.md](./areas/ANALYTICS.md)** - Metrics, reporting, dashboard stats

### Pattern Guides (`patterns/`)
Guides for common implementation patterns:
- **[API-ROUTES.md](./patterns/API-ROUTES.md)** - API structure, auth, error handling
- **[AUTHENTICATION.md](./patterns/AUTHENTICATION.md)** - Firebase Auth, protected routes
- **[FIREBASE.md](./patterns/FIREBASE.md)** - Firestore patterns, client vs admin SDK
- **[COMPONENTS.md](./patterns/COMPONENTS.md)** - Component organization, conventions

---

## How to Use This Documentation

### For New Agents
1. Read [QUICK-START.md](./QUICK-START.md) for essential context
2. Read [RECENT-CHANGES.md](./RECENT-CHANGES.md) for latest work
3. Review [Root CLAUDE.md](../CLAUDE.md) for full architecture
4. Pick the area guide(s) relevant to your task

### For Returning Agents
1. Check [RECENT-CHANGES.md](./RECENT-CHANGES.md) first
2. Refer to specific area/pattern guides as needed

### For Architecture Overview
Start with [Root CLAUDE.md](../CLAUDE.md) - comprehensive technical reference with:
- Complete tech stack
- Database architecture
- Route structure
- Common gotchas
- Key files reference

---

## Maintenance

**RECENT-CHANGES.md** is updated on-demand when significant implementations are completed.

**Guide Philosophy**: These guides focus on "what and why" rather than prescriptive "how-to" steps, since implementation decisions often evolve during development.
