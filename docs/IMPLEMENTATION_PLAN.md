# Khaza-Scoop Implementation Plan

## Product Scope

Khaza-Scoop is a local-first business dashboard for an Instagram shopping business. The app focuses on four operational areas:

1. Login and owner access
2. Financial snapshot dashboard
3. Inventory and stock movement tracking
4. Scoop-based order profitability tracking

## Phase Plan

### Phase 1: Foundation

- Scaffold a Next.js App Router project with Tailwind CSS
- Add SQLite storage using `better-sqlite3`
- Establish a local auth flow with cookie-based sessions
- Define the core database schema for products, scoop prices, multi-item orders, and stock movements

Status: Complete

### Phase 2: Core Operations

- Build the dashboard homepage with scoop KPIs and recent activity
- Build the stock page with gift inventory, stock adjustments, and scoop price editing
- Build the orders page with customer details, scoop selection, gift checklist, and saved profit snapshots
- Build the expenses page with derived profitability and connected cost analysis

Status: Complete

### Phase 3: Admin Utilities

- Add a local SQL query tester for fast debugging and inspection
- Add setup documentation and a practical architecture overview
- Verify linting and production build readiness

Status: Complete

## Delivery Notes

- SQLite data is stored locally in `data/khaza-scoop.db`
- Authentication is intentionally lightweight for local owner use
- The query tester supports direct SQL access, so it is meant for trusted local use only
