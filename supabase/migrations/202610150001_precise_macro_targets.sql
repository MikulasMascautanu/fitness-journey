-- Expand existing profiles to accept custom macro targets without changing data.
begin;
alter table public.profiles
  drop constraint profiles_protein_g_per_kg_check,
  drop constraint profiles_fat_pct_check,
  add constraint profiles_protein_g_per_kg_check check (protein_g_per_kg between 0.1 and 5),
  add constraint profiles_fat_pct_check check (fat_pct between 15 and 30);
commit;
