# Khazana Scoop Status Checklist

This checklist reflects the current state of the dashboard repo and the connected storefront repo.

## Done

- Dashboard product management is connected to Supabase.
- Products can be created and edited from `Stock`.
- Product records support:
  - stock quantity
  - total purchased quantity
  - unit cost
  - selling price
  - frontend name (`view_name`)
  - description
  - primary image
  - colour variants
  - category assignment
  - collection assignment
- Product images upload to the Supabase `product-images` bucket.
- Product image failures now show useful debug information in the dashboard.
- Collections are connected from dashboard to storefront.
- Collections support:
  - name
  - slug
  - active state
  - sort order
  - homepage description
- Storefront homepage reads product and collection data from Supabase.
- Storefront products use dashboard-backed:
  - image
  - selling price
  - frontend name
  - description
  - colours
  - collections
- Storefront collection sections are driven by dashboard collections.
- Storefront product detail pages show live product data from Supabase.
- Storefront product pages can act as the direct reserve/order page for purchasable products.
- Storefront product reserve UI now uses a product-gallery layout with quantity controls, customer details, trust badges, and offer card styling.
- Website catalog ordering writes back to the shared Supabase database.
- Website catalog ordering creates:
  - `orders`
  - `order_items`
  - `stock_movements`
- Website catalog ordering reduces `products.stock_quantity`.
- Website catalog orders are marked with `order_source = 'website'`.
- Dashboard-created orders are marked with `order_source = 'dashboard'`.
- Dashboard order views show website/admin order counts and source badges.
- Storefront product pages now show stock state and block purchase flow when stock is `0`.
- Dashboard mystery scoop order flow is connected to inventory and reduces stock correctly.
- Dashboard order editing and order deletion restore or re-apply stock correctly.

## Partial

- Categories work for assignment and filtering, but category metadata is still basic.
- Category records currently support:
  - name
  - slug
  - active state
  - sort order
- Category records do not yet support their own image or description.
- Homepage category visuals are product-derived, not category-managed.
- Homepage collection UI works, but can still be improved visually and editorially.
- Storefront ordering is partially unified:
  - the new catalog order flow uses Supabase
  - dashboard can now distinguish website orders from admin-entered orders
  - older Prisma-based cart / checkout / admin flows still exist in the web repo
- Product system is functionally connected, but the storefront and legacy website systems are not fully merged into one architecture yet.

## Not Done

- Category image support in the dashboard.
- Category description support in the dashboard.
- Category-managed homepage imagery independent of product images.
- Full unification of the website order system around the shared Supabase catalog flow.
- Customer-facing order confirmation and tracking for dashboard-backed catalog orders.
- Removal or migration of legacy Prisma-based storefront ordering paths.
- Final polish pass for collections merchandising UX.
- Full business-rule review for how mystery scoop products and standard storefront products should coexist in one customer-facing ordering model.

## Recommended Next Steps

1. Add category image and description fields to the dashboard schema and UI.
2. Decide whether the website should keep the older Prisma flows or move fully to the shared Supabase catalog flow.
3. Review homepage merchandising rules for:
   - category sections
   - collection ordering
   - featured products
4. Add a clearer stock badge pattern across product listing cards.
