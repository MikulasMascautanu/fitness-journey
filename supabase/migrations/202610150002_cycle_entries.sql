-- Recorded menstrual period ranges for the Body chart.
create table public.cycle_entries (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.profiles(id) on delete cascade,
  start_date date not null check (start_date <= current_date + 1),
  end_date date check (end_date >= start_date and end_date <= current_date + 1),
  unique (account_id, start_date)
);

create index cycle_entries_account_start_idx on public.cycle_entries (account_id, start_date desc);
alter table public.cycle_entries enable row level security;
create policy "Own cycle entries" on public.cycle_entries for all to authenticated
  using ((select auth.uid()) = account_id) with check ((select auth.uid()) = account_id);
revoke all on public.cycle_entries from anon;
grant select, insert, update, delete on public.cycle_entries to authenticated;
