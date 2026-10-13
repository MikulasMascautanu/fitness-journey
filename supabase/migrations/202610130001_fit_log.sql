-- Run once in the Supabase SQL editor or apply with `supabase db push`.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  sex text not null check (sex in ('m', 'f')),
  birthdate date not null check (birthdate <= current_date - interval '18 years' + interval '1 day' and birthdate >= current_date - interval '121 years'),
  height_cm numeric not null check (height_cm between 100 and 250),
  activity numeric not null default 1.55 check (activity in (1.2, 1.375, 1.55, 1.725)),
  protein_g_per_kg numeric not null default 2 check (protein_g_per_kg in (1.6, 2, 2.4)),
  fat_pct numeric not null default 25 check (fat_pct in (20, 25, 30)),
  goal_kg_per_week numeric not null default 0 check (goal_kg_per_week in (-0.5, -0.25, 0, 0.25, 0.5))
);

create table public.body_entries (
  id uuid not null default gen_random_uuid(),
  account_id uuid not null references public.profiles(id) on delete cascade,
  -- A local calendar date can be one day ahead of the database's UTC date.
  date date not null check (date <= current_date + 1),
  weight_kg numeric not null check (weight_kg between 25 and 400),
  body_fat_pct numeric check (body_fat_pct > 0 and body_fat_pct < 70),
  skinfold_1_mm numeric check (skinfold_1_mm between 1 and 100),
  skinfold_2_mm numeric check (skinfold_2_mm between 1 and 100),
  skinfold_3_mm numeric check (skinfold_3_mm between 1 and 100),
  waist numeric check (waist > 0 and waist <= 300),
  chest numeric check (chest > 0 and chest <= 300),
  hips numeric check (hips > 0 and hips <= 300),
  arm numeric check (arm > 0 and arm <= 300),
  thigh numeric check (thigh > 0 and thigh <= 300),
  neck numeric check (neck > 0 and neck <= 300),
  primary key (account_id, date),
  constraint complete_skinfolds check (
    (skinfold_1_mm is null and skinfold_2_mm is null and skinfold_3_mm is null and body_fat_pct is null)
    or (skinfold_1_mm is not null and skinfold_2_mm is not null and skinfold_3_mm is not null and body_fat_pct is not null)
  )
);

create table public.food_days (
  id uuid not null default gen_random_uuid(),
  account_id uuid not null references public.profiles(id) on delete cascade,
  date date not null check (date <= current_date + 1),
  kcal numeric not null check (kcal between 0 and 20000),
  protein_g numeric not null check (protein_g between 0 and 2000),
  carbs_g numeric not null check (carbs_g between 0 and 3000),
  fat_g numeric not null check (fat_g between 0 and 2000),
  primary key (account_id, date)
);

alter table public.profiles enable row level security;
alter table public.body_entries enable row level security;
alter table public.food_days enable row level security;

create policy "Own profile" on public.profiles for all to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy "Own body entries" on public.body_entries for all to authenticated
  using ((select auth.uid()) = account_id) with check ((select auth.uid()) = account_id);
create policy "Own food days" on public.food_days for all to authenticated
  using ((select auth.uid()) = account_id) with check ((select auth.uid()) = account_id);

revoke all on public.profiles, public.body_entries, public.food_days from anon;
grant select, insert, update, delete on public.profiles, public.body_entries, public.food_days to authenticated;
