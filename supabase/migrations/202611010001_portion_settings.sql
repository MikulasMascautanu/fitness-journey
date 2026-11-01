-- A shared directory for future recipe scaling. Private health profiles stay private.
create table public.portion_settings (
  account_id uuid primary key references public.profiles(id) on delete cascade,
  display_name text not null check (char_length(btrim(display_name)) between 1 and 80),
  meat_raw_g numeric not null check (meat_raw_g between 0 and 5000 and meat_raw_g = round(meat_raw_g, 1)),
  carbs_raw_g numeric not null check (carbs_raw_g between 0 and 5000 and carbs_raw_g = round(carbs_raw_g, 1))
);

alter table public.portion_settings enable row level security;

create policy "Read portion directory" on public.portion_settings for select to authenticated
  using (true);
create policy "Insert own portions" on public.portion_settings for insert to authenticated
  with check ((select auth.uid()) = account_id);
create policy "Update own portions" on public.portion_settings for update to authenticated
  using ((select auth.uid()) = account_id) with check ((select auth.uid()) = account_id);

revoke all on public.portion_settings from public, anon, authenticated;
grant select, insert, update on public.portion_settings to authenticated;
