# Khaza-Scoop Implementation Plan

## Product Scope

Khaza-Scoop is a business dashboard for an Instagram shopping business. The app focuses on four operational areas:

1. Login and owner access
2. Financial snapshot dashboard
3. Inventory and stock movement tracking
4. Scoop-based order profitability tracking

## Phase Plan

### Phase 1: Foundation

- Scaffold a Next.js App Router project with Tailwind CSS
- Add a hosted Supabase data layer
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

- Add a Supabase setup helper page and SQL schema file
- Add setup documentation and a practical architecture overview
- Verify linting and production build readiness

Status: Complete

## Delivery Notes

- Supabase schema setup lives in `supabase/schema.sql`
- Authentication is intentionally lightweight for local owner use
- Raw SQL should be run in the Supabase SQL Editor, not from inside the app
