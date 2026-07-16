alter table public.orders
  add column if not exists order_source text not null default 'dashboard';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'orders_order_source_check'
  ) then
    alter table public.orders
      add constraint orders_order_source_check
      check (order_source in ('dashboard', 'website'));
  end if;
end $$;

create index if not exists idx_orders_order_source
  on public.orders(order_source);
