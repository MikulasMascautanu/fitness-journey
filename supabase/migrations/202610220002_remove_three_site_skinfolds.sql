-- Remove obsolete caliper data; retain weight and circumference history.
begin;

alter table public.body_entries drop constraint complete_skinfolds;

update public.body_entries
set skinfold_1_mm = null,
    skinfold_2_mm = null,
    skinfold_3_mm = null,
    skinfold_4_mm = null,
    body_fat_pct = null,
    body_fat_method = null
where body_fat_method is distinct from 'durnin-womersley-4-site';

alter table public.body_entries add constraint complete_skinfolds check (
  (body_fat_method is null and body_fat_pct is null
    and skinfold_1_mm is null and skinfold_2_mm is null
    and skinfold_3_mm is null and skinfold_4_mm is null)
  or (body_fat_method is not null and body_fat_method = 'durnin-womersley-4-site'
    and skinfold_1_mm is not null and skinfold_2_mm is not null
    and skinfold_3_mm is not null and skinfold_4_mm is not null and body_fat_pct is not null)
);

commit;
