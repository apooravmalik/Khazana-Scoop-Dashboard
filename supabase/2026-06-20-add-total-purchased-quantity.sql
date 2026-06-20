alter table public.products
add column if not exists total_purchased_quantity integer not null default 0;

with purchase_totals as (
  select
    product_id,
    sum(quantity_delta)::integer as purchased_total
  from public.stock_movements
  where quantity_delta > 0
    and (
      reason = 'Initial stock'
      or reason like '[Purchase]%'
    )
  group by product_id
)
update public.products as products
set total_purchased_quantity = greatest(
  products.stock_quantity,
  coalesce(purchase_totals.purchased_total, 0)
)
from purchase_totals
where purchase_totals.product_id = products.id;

update public.products
set total_purchased_quantity = stock_quantity
where total_purchased_quantity = 0
  and stock_quantity > 0;
