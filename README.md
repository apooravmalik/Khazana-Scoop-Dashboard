# Khaza-Scoop Dashboard

Khaza-Scoop is a local-first business dashboard for a mystery scoop Instagram shopping business. It centralizes gift inventory, scoop-based orders, connected costs, and KPI visibility in one Next.js app backed by SQLite.

## Stack

- Next.js App Router
- Tailwind CSS
- SQLite via `better-sqlite3`
- Server Actions for writes

## Features

- Local owner login
- Dashboard with scoop revenue, gift-cost, profit, low stock, and order pipeline KPIs
- Stock page for gift inventory management, stock refills, and editable scoop pricing
- Orders page with customer details, scoop selection, gift checklist, automatic stock deduction, and saved profit snapshots
- Expenses page for connected cost analytics across gift cost, delivery cost, and packaging cost
- Local SQL query tester for database inspection

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create local environment variables:

```bash
cp .env.example .env.local
```

3. Start the app:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000)

## Default Login

- Email: `admin@khazascoop.local`
- Password: `khaza123`

Override these values in `.env.local` for your own local setup.

## Database

- SQLite file: `data/khaza-scoop.db`
- The schema is initialized automatically on first app load

## Useful Commands

```bash
npm run dev
npm run lint
npm run typecheck
npm run build
```

## Documentation

- Implementation plan: [docs/IMPLEMENTATION_PLAN.md](/Users/yankitrajor/Desktop/Apoorav/Personal/Khazana-Scoop/docs/IMPLEMENTATION_PLAN.md)
- Architecture overview: [docs/ARCHITECTURE.md](/Users/yankitrajor/Desktop/Apoorav/Personal/Khazana-Scoop/docs/ARCHITECTURE.md)
- Page business logic: [docs/PAGE_BUSINESS_LOGIC.md](/Users/yankitrajor/Desktop/Apoorav/Personal/Khazana-Scoop/docs/PAGE_BUSINESS_LOGIC.md)
