-- Existing three-site readings retain their original values and meaning.
-- Only explicitly tagged entries use the four Durnin–Womersley sites:
-- 1 biceps, 2 triceps, 3 subscapular, 4 suprailiac.
begin;

alter table public.body_entries
  add column skinfold_4_mm numeric check (skinfold_4_mm between 1 and 100),
  add column body_fat_method text check (body_fat_method = 'durnin-womersley-4-site');

alter table public.body_entries drop constraint complete_skinfolds;
alter table public.body_entries add constraint complete_skinfolds check (
  (body_fat_method is null and skinfold_4_mm is null and (
    (skinfold_1_mm is null and skinfold_2_mm is null and skinfold_3_mm is null and body_fat_pct is null)
    or (skinfold_1_mm is not null and skinfold_2_mm is not null and skinfold_3_mm is not null and body_fat_pct is not null)
  ))
  or (body_fat_method is not null and body_fat_method = 'durnin-womersley-4-site'
    and skinfold_1_mm is not null and skinfold_2_mm is not null
    and skinfold_3_mm is not null and skinfold_4_mm is not null and body_fat_pct is not null)
);

commit;
