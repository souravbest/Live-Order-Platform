# PROMPTS.md — AI Prompts Log

> As required by the assessment ground rules, every AI prompt used in this project is listed below in order.
> This file also serves as a guide for the client walkthrough — each prompt shows the intent behind the design decision it triggered.

---

## Prompt 1 — Project Initialization
**Prompt:**
> "Make a project with these below mentioned stacks: React Developer Assessment – One-Day Assignment [full spec pasted]. So that I can showcase this to my client as an interview part and also make a simple raw guide so that I can explain each process and make use of all stacks mentioned above."

**What it triggered:**
- Initialized Vite + React 18 + TypeScript project scaffold using `npx create-vite@latest`
- Installed core dependencies: `react-router-dom`, `@tanstack/react-query`, `@tanstack/react-virtual`, `zod`, `lucide-react`
- Installed dev dependencies: `vitest`, `@testing-library/react`, `msw`, `cypress`
- Created `server.js` — the mock Node/Express backend seeding 10,500 orders with SSE live stream

---

## Prompt 2 — Stack Confirmation
**Prompt:**
> "Did you use all these stacks? [full spec repeated]"

**What it triggered:**
- Confirmed the exact stack decisions and explained *why* each choice was made:
  - React Query chosen over Redux (server state vs. client state)
  - SSE via Node server rather than MSW (better WebSocket/SSE simulation under load)
  - `@tanstack/react-virtual` for the 10k+ row problem

---

## Prompt 3 — Documentation Guide
**Prompt:**
> "So now give me a documented guide so that I can explain each stack where we have used it."

**What it triggered:**
- Created `README.md` with tech stack explanations
- Created `NOTES.md` with design decisions and trade-offs

---

## Prompt 4 — Build Steps
**Prompt:**
> "Now how I can build the app, give the steps in readme or notes?"

**What it triggered:**
- Added "How to Run & Build" section to README
- Added `npm run build` and `npm run preview` step-by-step instructions

---

## Prompt 5 — First App View (Bug Report)
**Prompt:**
> "I am seeing only this page only [screenshot of Vite default 'Get Started' page]"

**What it triggered:**
- First implementation of `App.tsx` with actual OrderPulse UI
- Created `src/index.css` with dark-mode design system
- Implemented live SSE connection with React Query cache merging
- Added KPI panel, connection status indicator
- Used `@tanstack/react-virtual` for the virtualized table

---

## Prompt 6 — Error Fix
**Prompt:**
> "Showing errors in App.tsx"

**What it triggered:**
- Diagnosed and fixed escaped template literal strings (`\`\${...}\``) that were generated incorrectly
- Fixed 3 template string instances in the virtualized row rendering
- Verified TypeScript compiler reported no errors

---

## Prompt 7 — Full Architecture Rebuild (Critical)
**Prompt:**
> "Check each and every line [full spec] and do it accordingly"

**What it triggered — the complete senior-level architecture build:**

### Environment Setup
- Created `.env`, `.env.int`, `.env.val`, `.env.prod` — all API URLs, env labels, SSE backoff config via env vars only, zero hardcoded values
- Added `dev:int`, `dev:val`, `dev:prod` npm scripts for environment-specific runs

### Typed API Layer + Zod (src/lib/api.ts)
- Defined Zod schemas for `Order`, `OrderStatus`, `SSEEvent` (discriminated union)
- Created `ApiError` class for consistent error handling
- Typed `api.getOrders()` and `api.updateOrderStatus()` — both validate server responses via Zod before returning

### Permission Layer (src/lib/permissions.ts)
- Role-to-permission map: no `if (role === 'supervisor')` anywhere in UI code
- `usePermissions(role)` hook returns typed permission object
- Adding a new role requires editing one map only

### useLiveOrders Hook (src/features/orders/useLiveOrders.ts)
- SSE connects to `/api/events`; validates every event with `SSEEventSchema.safeParse()`
- Merges updates into React Query cache using O(1) Map lookup — avoids full array scan
- `aria-live` announcements triggered on Held/Cancelled events for screen readers
- Exponential backoff with jitter on disconnect; capped by `VITE_SSE_RECONNECT_MAX_MS`

### useOrderMutation Hook (src/features/orders/useOrderMutation.ts)
- React Query `useMutation` with `onMutate` (optimistic cache update), `onError` (automatic rollback), `onSettled` (invalidation)
- Error message passed up to UI — shown in Banner component

### useGridState Hook (src/features/orders/useGridState.ts)
- All grid state (search, statusFilter, sortField, sortDir, selectedId) lives in URL query params
- Provides `setSearch`, `setStatusFilter`, `setSort`, `setSelectedId` — each updating URL non-destructively
- `applyGridFilters()` is a pure function — no React dependency, independently unit tested

### OrdersGrid Component (src/features/orders/OrdersGrid.tsx)
- `useVirtualizer` for rows — renders only visible items
- `aria-sort` on all column headers; columns sortable via click or keyboard (Enter key)
- `role="row"`, `aria-selected` on rows; Enter to open drawer
- Stale data visually marked with ⚠ indicator

### OrderDetail Component (src/features/orders/OrderDetail.tsx)
- Status Machine: `ALLOWED_TRANSITIONS` map defines valid status moves
- Actions filtered through both the state machine AND the permission layer
- Error and isPending state passed from parent to avoid coupling

### KpiPanel Component (src/features/orders/KpiPanel.tsx)
- Animated CSS-transition bar chart for all 7 statuses
- SLA Breach Rate conditionally shown based on `showSlaBreachRate` prop (controlled by permissions)

### UI Component Library (src/components/ui/)
- `Button.tsx` — variant (primary/danger/warning/ghost) + size (sm/md), zero business logic
- `Banner.tsx` — type-based colour, optional dismiss button, `role="alert"`
- `Drawer.tsx` — focus trap (Tab cycling), Escape-to-close, `role="dialog"`, `aria-modal`, `aria-labelledby`

### DashboardPage (src/pages/DashboardPage.tsx)
- Composes all features; handles mutation errors and success messages
- aria-live region (visually hidden) announces critical changes to screen readers
- Role switcher in header drives all permission-gated UI

### App.tsx
- `React.lazy()` + `Suspense` for route-level code splitting
- `ErrorBoundary` (react-error-boundary) with "Try again" reset button
- `QueryClient` configured with `retry: 2`, `staleTime: Infinity`

### Tests
- `gridFilters.test.ts` — 6 unit tests covering search, status filter, sort, empty results
- `permissions.test.ts` — 10 unit tests covering agent and supervisor permission sets
- `cypress/e2e/dashboard.cy.ts` — E2E tests: main flow, role switching, URL persistence

---

## Prompt 8 — Final Cleanup
**Prompt:**
> "Now remove the errors from all files and unwanted code or lines, also update README.md and PROMPTS.md with a guide so that it has all information of the project so that I can explain it to the client."

**What it triggered:**
- Ran `tsc --noEmit` → 0 TypeScript errors
- Ran `npm run lint` → fixed 2 lint warnings:
  - Removed unused `useMemo` import from `useGridState.ts`
  - Rewrote ternary side-effect expression to `if/else` block
- Rewrote `README.md` as a comprehensive client-facing guide
- Rewrote `PROMPTS.md` as a full prompt log with explanation of every decision

---

## Key Design Changes Made to AI-Generated Code

As required by the assessment, the following are the notable technical decisions and corrections made during this session:

1. **Fixed escaped template literals** in `App.tsx` — the initial generation incorrectly escaped backtick strings
2. **Separated concerns more strictly**: Initial version had everything in `App.tsx`. Refactored into feature folders after client review
3. **Replaced array `.find()` in SSE handler with `Map` lookup** — O(n) to O(1) for cache merging with 10k+ items
4. **Removed `useMemo` wrapping of `applyGridFilters`** from inside a React component — moved to a pure function to make it unit-testable without React
5. **Changed ternary side-effect to if/else** — semantically clearer and lint-correct
6. **Added `SSEEventSchema.safeParse()`** instead of trusting raw SSE data — silent drop of malformed events rather than crashing the stream handler
