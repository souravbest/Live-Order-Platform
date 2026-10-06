# OrderPulse 🚀
> A live operations dashboard for a retailer's fulfilment team — built as a Senior React Developer assessment project.

---

## What Is OrderPulse?

OrderPulse is a **real-time fulfilment dashboard** that displays 10,000+ live orders, lets agents act on them instantly, and streams status changes every second. It was designed to demonstrate senior-level React architecture: clean feature separation, strict TypeScript, accessible UI, and measurably fast performance even under constant data updates.

---

## Tech Stack & Why Each Was Chosen

| Technology | Role in This Project | Why This Choice |
|---|---|---|
| **React 18 + Vite** | UI framework + build tool | Concurrent rendering, fastest HMR in the ecosystem |
| **TypeScript (strict)** | Type safety across entire codebase | Catches API shape mismatches at compile time, not runtime |
| **React Router v6** | Client-side routing + URL state | Stores all grid filter/sort state in URL — making every view shareable via link |
| **React Query** | Server state, caching, optimistic updates | Chosen over Redux because 95% of state here is *server* state. Handles cache merging and rollbacks natively |
| **@tanstack/react-virtual** | Virtualized row rendering | Only renders ~20 visible rows out of 10,500 — reduces DOM nodes by 99% |
| **Zod** | Runtime API validation | Validates every API response and SSE event at the boundary before it enters the app |
| **lucide-react** | Icons | Lightweight, tree-shakeable icon set |
| **Node.js + Express** | Mock backend | Seeds 10,500 orders and broadcasts live SSE (Server-Sent Events) stream |
| **Vitest + RTL** | Unit & integration tests | Runs in milliseconds, native ESM, identical config to Vite |
| **Cypress** | End-to-end tests | Tests the real user flow: search → open drawer → change role → verify URL state |
| **Vanilla CSS** | Styling | Zero framework bloat; CSS custom properties enable dark mode and easy theming |

---

## Project Structure

```
src/
├── pages/
│   └── DashboardPage.tsx      ← Composes all features into the main view
│
├── features/orders/           ← Business domain: orders
│   ├── useLiveOrders.ts       ← SSE hook: merges live stream into React Query cache
│   ├── useOrderMutation.ts    ← Optimistic update hook with automatic rollback on error
│   ├── useGridState.ts        ← URL-driven filter/sort/selection state
│   ├── OrdersGrid.tsx         ← Virtualized 10k+ row grid with keyboard nav
│   ├── OrderDetail.tsx        ← Drawer content: timeline, items, role-gated actions
│   └── KpiPanel.tsx           ← Live KPIs and mini bar charts
│
├── components/ui/             ← Pure reusable UI library (zero business logic)
│   ├── Button.tsx             ← Variants: primary, danger, warning, ghost
│   ├── Banner.tsx             ← Alert/notification bar with dismiss
│   └── Drawer.tsx             ← Focus-trapped, keyboard-accessible side panel
│
├── lib/
│   ├── api.ts                 ← Typed API layer with Zod schemas for all responses
│   └── permissions.ts         ← Role → permission map (no if statements in UI)
│
└── __tests__/
    ├── gridFilters.test.ts    ← 6 unit tests for filter/sort logic
    └── permissions.test.ts    ← 10 unit tests for role-permission mapping
```

---

## How to Run

### Prerequisites
- Node.js 18+
- npm 9+

### Step 1 — Install all dependencies
```bash
npm install
```

### Step 2 — Start the Mock Backend (must be running before the frontend)
```bash
node server.js
```
This starts an Express server on **port 3001** that:
- Seeds 10,500 randomised orders in memory
- Exposes `GET /api/orders` (bulk fetch)
- Exposes `POST /api/orders/:id/status` (update with 10% simulated failure rate)
- Exposes `GET /api/events` (SSE stream — broadcasts 1–5 random updates every second)

### Step 3 — Start the React App
```bash
npm run dev         # uses .env (Int environment)
npm run dev:int     # explicit Int
npm run dev:val     # Validation environment
npm run dev:prod    # Production environment
```
Opens at **http://localhost:5173**

### Step 4 — Build for Production
```bash
npm run build
npm run preview     # test the built output locally
```

---

## How to Run Tests

```bash
# Run all unit tests (Vitest)
npm run test

# Watch mode for TDD
npm run test:watch

# Open Cypress for E2E tests (requires npm run dev to be running)
npm run cypress:open
```

**Test results (baseline):**
```
✓ permissions.test.ts   10 tests passed
✓ gridFilters.test.ts    6 tests passed
────────────────────────────────────────
Total: 16 tests — all passing
```

---

## Environment Variables

Three `.env` files are provided — no hardcoded values anywhere:

| File | Environment | API URL |
|---|---|---|
| `.env` / `.env.int` | Integration (local dev) | `http://localhost:3001` |
| `.env.val` | Validation / Staging | `https://val-api.orderpulse.internal` |
| `.env.prod` | Production | `https://api.orderpulse.com` |

Variables:
```bash
VITE_API_BASE_URL=...          # Backend base URL
VITE_ENV=int                   # Environment label (shown in header)
VITE_SSE_RECONNECT_MAX_MS=...  # Max SSE reconnect backoff delay
```

---

## Core Features Walkthrough

### 1. Live Orders Grid
- 10,500 rows rendered virtually — only ~20 DOM nodes at a time
- Click any column header to sort; click again to toggle asc/desc
- Search bar filters by Order ID or Customer name
- Status dropdown filters by status
- All filters + sort + selected order are stored in the **URL** — copy the URL and paste it to anyone and they see the exact same view

### 2. Order Detail Drawer
- Click any row to open the side drawer
- Shows order summary, status timeline, and context-aware action buttons
- Actions are gated by a **State Machine** — only valid transitions are shown (e.g., you can't ship a Cancelled order)
- Actions are further gated by **Role Permissions** — Agents can only mark packed; Supervisors can hold and cancel
- **Optimistic Update**: the row updates instantly in the grid. If the server rejects the change (simulated 10% failure), the row rolls back and an error banner appears

### 3. Live Connection & Resilience
- A pulsing green dot in the header shows the SSE is live
- On disconnection: a red **"Live connection lost"** banner appears and reconnect begins
- Reconnect uses **exponential backoff with jitter** — starts at 1s, doubles each attempt, capped by `VITE_SSE_RECONNECT_MAX_MS`
- A screen-reader-only `aria-live` region announces critical status changes (Held/Cancelled) to assistive technology

### 4. KPI Panel
- **Total Orders**: live count of all orders in cache
- **Processing**: count of in-progress orders (updates every second)
- **SLA Breach Rate**: percentage of Held orders — **Supervisor only**
- **Status Breakdown**: animated mini bar chart for all 7 statuses

### 5. Roles
Switch between **Agent** and **Supervisor** in the header dropdown:
- **Agent**: can mark orders Packed; cannot hold or cancel; no SLA breach rate
- **Supervisor**: full actions; sees SLA Breach Rate and Supervisor widget
- The permission layer is a single map in `src/lib/permissions.ts` — adding a new role means one new object entry, nothing else changes

---

## Design Patterns Used

| Pattern | Where | Why |
|---|---|---|
| **Custom Hooks** | `useLiveOrders`, `useOrderMutation`, `useGridState` | Separate data logic from render logic; each hook is independently testable |
| **Compound Components** | `Drawer` (Header + Body + Close) | Maximum flexibility — consumers control content, drawer controls focus/accessibility |
| **State Machine** | `ALLOWED_TRANSITIONS` in `OrderDetail.tsx` | Prevents invalid UI states; correct transitions enforced client-side before hitting the server |
| **Observer / Adapter** | SSE + React Query in `useLiveOrders` | SSE is the Observable; React Query cache is the adapted store — clean separation |
| **Permission Map (Strategy)** | `permissions.ts` | New roles added without touching any UI component |

---

## Accessibility

- Full **keyboard navigation** on the grid (Tab, Enter to open row, Escape to close drawer)
- **Focus trapped** inside Drawer when open; focus returns to the triggering row on close
- `role="dialog"`, `aria-modal`, `aria-labelledby` on the Drawer
- `aria-sort` attributes on all column headers
- `aria-live="polite"` region announces Held/Cancelled orders to screen readers
- Semantic `role="alert"` on all error/warning banners
- WCAG 2.1 AA colour contrast maintained throughout dark theme

---

## Architecture Overview

```
App.tsx
 ├── QueryClientProvider     (React Query)
 ├── BrowserRouter           (React Router)
 ├── ErrorBoundary           (catches render errors)
 └── Suspense
      └── DashboardPage      (lazy-loaded route)
           ├── KpiPanel
           ├── ConnectionBanners
           ├── OrdersGrid     ──uses──▶ useGridState (URL state)
           │                  ──uses──▶ useLiveOrders (SSE + React Query)
           └── Drawer
                └── OrderDetail ──uses──▶ useOrderMutation (optimistic)
                                ──uses──▶ usePermissions (role gates)
```
