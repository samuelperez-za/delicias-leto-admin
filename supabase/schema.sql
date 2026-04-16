-- ============================================================
-- Delicias Leto Admin — Schema SQL para Supabase
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- ============================================================

-- Habilitar extensión UUID
create extension if not exists "uuid-ossp";

-- ============================================================
-- TABLA: business_settings
-- ============================================================
create table if not exists public.business_settings (
  id          uuid primary key default uuid_generate_v4(),
  business_name  text not null default 'Delicias Leto',
  primary_color  text not null default '#16a34a',
  partners_count integer not null default 2 check (partners_count > 0),
  worker_1_name  text not null default 'Trabajador 1',
  worker_2_name  text not null default 'Trabajador 2',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- ============================================================
-- TABLA: daily_sales
-- ============================================================
create table if not exists public.daily_sales (
  id                    uuid primary key default uuid_generate_v4(),
  date                  date not null unique,
  sales_salchipapas     numeric(10,2) not null default 0 check (sales_salchipapas >= 0),
  sales_hamburguesas    numeric(10,2) not null default 0 check (sales_hamburguesas >= 0),
  sales_picadas         numeric(10,2) not null default 0 check (sales_picadas >= 0),
  sales_gaseosas        numeric(10,2) not null default 0 check (sales_gaseosas >= 0),
  total_sales           numeric(10,2) not null generated always as (
                          sales_salchipapas + sales_hamburguesas + sales_picadas + sales_gaseosas
                        ) stored,
  extra_expenses_day    numeric(10,2) not null default 0 check (extra_expenses_day >= 0),
  notes                 text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists idx_daily_sales_date on public.daily_sales(date desc);

-- ============================================================
-- TABLA: supplies
-- ============================================================
create table if not exists public.supplies (
  id          uuid primary key default uuid_generate_v4(),
  date        date not null,
  amount      numeric(10,2) not null check (amount > 0),
  description text not null,
  supplier    text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_supplies_date on public.supplies(date desc);

-- ============================================================
-- TABLA: extra_expenses
-- ============================================================
create table if not exists public.extra_expenses (
  id          uuid primary key default uuid_generate_v4(),
  date        date not null,
  category    text not null check (category in ('gas','transporte','empaques','servicios','limpieza','otros')),
  amount      numeric(10,2) not null check (amount > 0),
  description text not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_extra_expenses_date on public.extra_expenses(date desc);

-- ============================================================
-- TABLA: weekly_payroll
-- ============================================================
create table if not exists public.weekly_payroll (
  id                uuid primary key default uuid_generate_v4(),
  week_start        date not null,
  week_end          date not null,
  worker_1_name     text not null,
  worker_1_payment  numeric(10,2) not null check (worker_1_payment >= 0),
  worker_2_name     text not null,
  worker_2_payment  numeric(10,2) not null check (worker_2_payment >= 0),
  total_payroll     numeric(10,2) not null generated always as (
                      worker_1_payment + worker_2_payment
                    ) stored,
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint chk_week_order check (week_end >= week_start)
);

create index if not exists idx_weekly_payroll_week_start on public.weekly_payroll(week_start desc);

-- ============================================================
-- FUNCIÓN: updated_at automático
-- ============================================================
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Triggers para updated_at
create trigger trg_settings_updated_at
  before update on public.business_settings
  for each row execute function public.set_updated_at();

create trigger trg_daily_sales_updated_at
  before update on public.daily_sales
  for each row execute function public.set_updated_at();

create trigger trg_supplies_updated_at
  before update on public.supplies
  for each row execute function public.set_updated_at();

create trigger trg_extra_expenses_updated_at
  before update on public.extra_expenses
  for each row execute function public.set_updated_at();

create trigger trg_payroll_updated_at
  before update on public.weekly_payroll
  for each row execute function public.set_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
alter table public.business_settings enable row level security;
alter table public.daily_sales enable row level security;
alter table public.supplies enable row level security;
alter table public.extra_expenses enable row level security;
alter table public.weekly_payroll enable row level security;

-- Políticas: solo usuarios autenticados tienen acceso completo
create policy "authenticated full access" on public.business_settings
  for all using (auth.role() = 'authenticated');

create policy "authenticated full access" on public.daily_sales
  for all using (auth.role() = 'authenticated');

create policy "authenticated full access" on public.supplies
  for all using (auth.role() = 'authenticated');

create policy "authenticated full access" on public.extra_expenses
  for all using (auth.role() = 'authenticated');

create policy "authenticated full access" on public.weekly_payroll
  for all using (auth.role() = 'authenticated');

-- ============================================================
-- VISTA SQL: weekly_summary
-- Agrega ventas, surtidos, gastos y nómina por semana ISO
-- ============================================================
create or replace view public.weekly_summary as
with weeks as (
  select distinct
    date_trunc('week', date)::date as week_start,
    (date_trunc('week', date) + interval '6 days')::date as week_end
  from (
    select date from public.daily_sales
    union select date from public.supplies
    union select date from public.extra_expenses
  ) d
)
select
  w.week_start,
  w.week_end,
  coalesce(sum(ds.total_sales), 0)        as total_sales,
  coalesce(sum_sup.total_supplies, 0)      as total_supplies,
  coalesce(sum_exp.total_extra, 0)         as total_extra_expenses,
  coalesce(wp.total_payroll, 0)            as total_payroll,
  coalesce(sum(ds.total_sales), 0)
    - coalesce(sum_sup.total_supplies, 0)
    - coalesce(sum_exp.total_extra, 0)
    - coalesce(wp.total_payroll, 0)        as weekly_utility
from weeks w
left join public.daily_sales ds
  on ds.date between w.week_start and w.week_end
left join (
  select date_trunc('week', date)::date as ws, sum(amount) as total_supplies
  from public.supplies
  group by 1
) sum_sup on sum_sup.ws = w.week_start
left join (
  select date_trunc('week', date)::date as ws, sum(amount) as total_extra
  from public.extra_expenses
  group by 1
) sum_exp on sum_exp.ws = w.week_start
left join (
  select date_trunc('week', week_start)::date as ws, sum(total_payroll) as total_payroll
  from public.weekly_payroll
  group by 1
) wp on wp.ws = w.week_start
group by w.week_start, w.week_end, sum_sup.total_supplies, sum_exp.total_extra, wp.total_payroll
order by w.week_start desc;

-- ============================================================
-- FUNCIÓN: get_monthly_summary(year, month)
-- ============================================================
create or replace function public.get_monthly_summary(p_year int, p_month int)
returns table (
  total_sales          numeric,
  total_supplies       numeric,
  total_extra_expenses numeric,
  total_payroll        numeric,
  monthly_utility      numeric
) as $$
declare
  v_start date := make_date(p_year, p_month, 1);
  v_end   date := (v_start + interval '1 month - 1 day')::date;
begin
  return query
  select
    coalesce((select sum(total_sales) from public.daily_sales where date between v_start and v_end), 0),
    coalesce((select sum(amount) from public.supplies where date between v_start and v_end), 0),
    coalesce((select sum(amount) from public.extra_expenses where date between v_start and v_end), 0),
    coalesce((select sum(total_payroll) from public.weekly_payroll where week_start between v_start and v_end), 0),
    0::numeric -- placeholder, calculado en app
  ;
  -- Actualizar monthly_utility en el resultado
  return query
  select ts, tsu, te, tp, (ts - tsu - te - tp) as mu
  from (
    select
      coalesce((select sum(total_sales) from public.daily_sales where date between v_start and v_end), 0) as ts,
      coalesce((select sum(amount) from public.supplies where date between v_start and v_end), 0) as tsu,
      coalesce((select sum(amount) from public.extra_expenses where date between v_start and v_end), 0) as te,
      coalesce((select sum(total_payroll) from public.weekly_payroll where week_start between v_start and v_end), 0) as tp
  ) sub;
end;
$$ language plpgsql;
