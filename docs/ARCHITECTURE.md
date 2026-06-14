# Khaza-Scoop Architecture

## Stack

- Next.js App Router
- Tailwind CSS
- Supabase
- Server Actions for writes and workflow updates

## Data Model

### Products

Stores gift inventory with current stock and unit cost.

### Stock Movements

Captures every manual stock addition or deduction so inventory changes remain auditable, including cost snapshots at the time of movement.

### Scoop Types

Stores editable scoop selling prices such as Small, Medium, Large, and Custom.

### Orders

Tracks customer details, scoop selection, delivery state, payment state, delivery cost, packaging cost, and saved profitability.

### Order Items

Stores the checklist of gifts chosen for each scoop order and deducts inventory from stock.

## Financial Logic

- Total Revenue: sum of scoop selling prices
- Total Product Cost: sum of gift cost snapshots across orders
- Total Expenses: product cost plus delivery and packaging cost
- Net Profit/Loss: revenue minus connected order costs

## Supabase Notes

- The app uses the Supabase data API instead of a local file database
- Table setup lives in [supabase/schema.sql](/Users/yankitrajor/Desktop/Apoorav/Personal/Khazana-Scoop/supabase/schema.sql)
- The current test setup uses permissive row policies so the publishable key can be used during early testing

## Route Map

- `/login`: owner login
- `/`: KPI dashboard
- `/stock`: gift inventory, stock movement, and scoop pricing manager
- `/orders`: scoop order pipeline, gift selection, and cost tracking
- `/expenses`: connected cost analytics and profitability view
- `/query-tester`: Supabase setup helper

## App Flow

1. Owner logs in with local credentials
2. Dashboard surfaces KPI health and recent activity
3. Stock page manages gift inventory, stock refills, and scoop prices
4. Orders page creates scoop orders with a gift checklist and automatically deducts stock
5. Expenses page analyzes connected product, delivery, and packaging costs
6. Query helper reminds the owner to use the Supabase SQL Editor for schema setup and custom SQL
