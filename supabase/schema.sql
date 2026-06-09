-- ============================================================
-- susucloud 優惠機票訂閱系統 — Supabase 資料庫結構
-- 在 Supabase 後台 > SQL Editor 貼上整段執行即可
-- ============================================================

-- 使用者個人資料 + 訂閱狀態（與 auth.users 一對一）
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  stripe_customer_id text,
  -- free | pro
  plan text not null default 'free',
  -- active | trialing | past_due | canceled | none
  subscription_status text not null default 'none',
  current_period_end timestamptz,
  created_at timestamptz not null default now()
);

-- 機票追蹤條件（一位使用者可有多筆）
create table if not exists public.alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  origin text not null,            -- 出發地 IATA，例如 TPE
  destination text not null,       -- 目的地 IATA，例如 NRT
  depart_month text,               -- 目標出發月份 YYYY-MM（可選）
  one_way boolean not null default false,
  target_price integer not null,   -- 低於這個價格就通知（整數）
  currency text not null default 'twd',
  active boolean not null default true,
  last_price integer,              -- 上次查到的最低價
  last_notified_price integer,     -- 上次「通知」時的價格（避免重複轟炸）
  last_checked_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists alerts_user_id_idx on public.alerts(user_id);
create index if not exists alerts_active_idx on public.alerts(active);

-- 通知紀錄
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  alert_id uuid references public.alerts(id) on delete cascade,
  channel text not null default 'email',  -- email | line | sms
  price integer,
  message text,
  sent_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 註冊時自動建立 profile
-- ------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ------------------------------------------------------------
-- Row Level Security：使用者只能存取自己的資料
-- ------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.alerts enable row level security;
alter table public.notifications enable row level security;

drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "own alerts" on public.alerts;
create policy "own alerts" on public.alerts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own notifications" on public.notifications;
create policy "own notifications" on public.notifications
  for select using (auth.uid() = user_id);
