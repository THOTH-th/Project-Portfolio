# THOTH · Project Portfolio Dashboard

An internal project-management dashboard for THOTH — a full-loop intake and
execution control surface for project managers, team leads, trainers,
operations, and management stakeholders. It provides at-a-glance portfolio
health, capacity planning, a risk register, action tracking, and a project
input workflow that keeps every view in sync.

Built as a functional application (not a static mockup): all navigation,
search, filters, sorting, forms, CRUD actions, modals, tabs, toasts, and
pagination work, and created/edited data persists in `localStorage`.

## Tech stack

- **Next.js 15** (App Router) + **React 19**
- **TypeScript** (strict, `noUncheckedIndexedAccess`, no `any`)
- **Tailwind CSS 3** with a token-based, theme-aware design system
- **Recharts** for data visualization
- **lucide-react** for icons
- Client-side state via a React Context store with `localStorage` persistence

No external UI kit is required — a small, reusable component library is
included under `src/components/ui`.

## Getting started

```bash
npm install
npm run dev        # http://localhost:3000
```

Other scripts:

```bash
npm run build      # production build
npm run start      # serve the production build
npm run lint       # eslint (next/core-web-vitals + next/typescript)
npm run typecheck  # tsc --noEmit
```

First load seeds a realistic demo dataset (23 projects, 10 team members,
risks, action items, allocations, and planned leave). All edits persist to
`localStorage` under the `thoth.portfolio.v1` key. Reset to the sample data
anytime from **Settings → Data**.

## Routes

| Route | Page |
| --- | --- |
| `/` | Overview dashboard (KPIs, health trend, needs-attention, status, pipeline, capacity, project details) |
| `/projects` | Project directory — search, filters, sorting, list/card views, pagination |
| `/projects/new` | Add project form (validation, sync preview) |
| `/projects/detail?id=…` | Project workspace — Overview, Capacity, Risks, Action Items, Timeline, Activity Log tabs |
| `/projects/edit?id=…` | Edit project form |
| `/capacity` | Capacity management — utilization, team & project allocation, warnings, leave |
| `/risks` | Risk register — scoring, filters, inline status, add/edit/delete |
| `/action-items` | Action tracker — statuses, overdue view, filters, complete-toggle |
| `/settings` | Profile, Team, Categories, Status, Notifications, Appearance, Data |

## Deployment (GitHub Pages)

The app is a fully static, client-only SPA, so it deploys to GitHub Pages
via `.github/workflows/deploy.yml`:

- `next.config.ts` uses `output: "export"`, and the workflow sets
  `PAGES_BASE_PATH=/Project-Portfolio` so assets resolve under the project
  Pages path.
- Project detail/edit use **query-param routes** (`/projects/detail?id=…`)
  rather than path params, so deep-links and refreshes work for projects
  created at runtime (whose ids aren't known at build time).

**One-time setup:** in the repo, go to **Settings → Pages → Build and
deployment → Source = GitHub Actions**. Every push to the deploy branch then
builds and publishes automatically. The live URL is
`https://<owner>.github.io/Project-Portfolio/`.

To build the static site locally:

```bash
PAGES_BASE_PATH=/Project-Portfolio npm run build   # outputs ./out
npx serve out                                       # preview
```

## Project structure

```
src/
├── app/                    # App Router pages
│   ├── layout.tsx          # Root layout, providers, no-flash theme script
│   ├── page.tsx            # Overview dashboard
│   ├── projects/           # list, new, [id], [id]/edit
│   ├── capacity/ risks/ action-items/ settings/
│   └── not-found.tsx
├── components/
│   ├── layout/             # Sidebar, Topbar, AppShell, PageHeader, Logo
│   ├── ui/                 # Button, Badge, Card, Table, Modal, Drawer,
│   │                       # Field/Input/Select/Switch, MultiSelect, Tabs,
│   │                       # Pagination, DropdownMenu, KpiCard, Progress,
│   │                       # Filters, States (Empty/Skeleton)
│   ├── charts/             # Recharts wrappers (area, donut, bar)
│   ├── projects/           # ProjectForm, ProjectCard
│   ├── risks/ actions/ capacity/   # form modals
├── context/                # DataContext (store), ToastContext
├── data/                   # seed.ts (mock dataset)
├── lib/                    # utils, tokens, selectors, nav, projectForm helpers
└── types/                  # domain model
```

## Design system

- **Brand:** THOTH gradient monogram (violet → indigo → cyan), blue primary.
- **Theme-aware:** semantic CSS variables drive light/dark; toggle in the top
  bar or Settings. A blocking script applies the saved theme before first paint.
- **Status colors:** On Track (green), Not Started/Planning (slate), At Risk
  (amber), Delayed (orange), Blocked/On Hold (rose), Completed (violet).
  Risk levels Low→Critical and priorities map to consistent tones centralized
  in `src/lib/tokens.ts`.
- **Accessibility:** keyboard-operable menus/dialogs, focus-visible rings,
  aria labels/roles, `prefers-reduced-motion` support.

## Assumptions & notes

- The brief referenced both "THOTH" and "HOBI"; the reference imagery and the
  bulk of the instructions specify **THOTH**, so the brand is implemented as
  THOTH. Change `organizationName` in Settings to rebrand the wordmark.
- Data is stored locally in the browser — there is no backend. This keeps the
  app fully functional and refresh-safe without external services.
- Charts synthesize an 8-week health trend from the current portfolio state for
  illustration; all other numbers are derived live from the dataset.
