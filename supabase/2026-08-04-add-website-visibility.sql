alter table public.products
add column if not exists website_visible boolean not null default true;
