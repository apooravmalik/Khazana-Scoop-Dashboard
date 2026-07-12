alter table public.products
add column if not exists selling_price numeric(12, 2) not null default 0;

alter table public.products
add column if not exists view_name text;

update public.products
set selling_price = base_price
where selling_price = 0
  and coalesce(base_price, 0) > 0;
