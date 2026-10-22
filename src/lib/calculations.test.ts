import { describe, expect, it } from 'vitest';
import { ageOn, energy, goalLabel, isValidDate, nutrition, recentDates, validateProfile } from './calculations';
import type { Profile } from './types';

const profile: Profile = { id: 'test', sex: 'm', birthdate: '1996-06-15', height_cm: 180, activity: 1.55, protein_g_per_kg: 2, fat_pct: 25, goal_kg_per_week: 0 };
const today = '2026-10-13';

describe('calendar dates', () => {
  it('changes age on the birthday', () => {
    expect(ageOn('1996-06-15', '2026-06-14')).toBe(29);
    expect(ageOn('1996-06-15', '2026-06-15')).toBe(30);
    expect(ageOn('1996-06-15', '2026-06-16')).toBe(30);
  });
  it('rejects impossible or future birthdates', () => {
    expect(isValidDate('2025-02-29')).toBe(false);
    expect(isValidDate('2024-02-29')).toBe(true);
    expect(() => ageOn('2026-10-14', today)).toThrow();
  });
  it('builds consecutive local dates across month and year boundaries', () => {
    expect(recentDates(3, '2026-01-02')).toEqual(['2025-12-31', '2026-01-01', '2026-01-02']);
    expect(recentDates(3, '2024-03-01')).toEqual(['2024-02-28', '2024-02-29', '2024-03-01']);
  });
});

describe('nutrition targets', () => {
  it('calculates male and female Mifflin–St Jeor BMR', () => {
    expect(energy(profile, 80, today).bmr).toBe(1780);
    expect(energy({ ...profile, sex: 'f' }, 80, today).bmr).toBe(1614);
  });
  it.each([[1.2, 2136], [1.375, 2447.5], [1.55, 2759], [1.725, 3070.5]] as const)('uses activity factor %s', (activity, expected) => {
    expect(energy({ ...profile, activity }, 80, today).tdee).toBeCloseTo(expected);
  });
  it.each([[-0.5, 2209], [-0.25, 2484], [0, 2759], [0.25, 3034], [0.5, 3309]] as const)('uses the %s kg/week goal', (goal_kg_per_week, expected) => {
    expect(nutrition({ ...profile, goal_kg_per_week }, 80, today).kcal).toBe(expected);
  });
  it('allocates all calories without rounding intermediate values', () => {
    const target = nutrition(profile, 80, today);
    expect(target.protein).toBe(160);
    expect(target.fat).toBeCloseTo(76.63888889);
    expect(target.carbs).toBeCloseTo(357.3125);
    expect(target.protein * 4 + target.carbs * 4 + target.fat * 9).toBeCloseTo(target.kcal, 10);
  });
  it.each([[1.8, 15], [2.5, 23], [0.1, 30], [5, 15]])('calculates custom protein %s and fat %s targets', (protein, fat) => {
    const target = nutrition({ ...profile, protein_g_per_kg: protein, fat_pct: fat }, 80, today);
    expect(target.protein).toBeCloseTo(protein * 80);
    expect(target.fat).toBeCloseTo(2759 * fat / 100 / 9);
    expect(target.protein * 4 + target.carbs * 4 + target.fat * 9).toBeCloseTo(target.kcal, 10);
  });
  it('rejects macro targets outside their ranges and non-finite values', () => {
    for (const protein_g_per_kg of [0, 5.1, NaN, Infinity]) {
      expect(() => validateProfile({ ...profile, protein_g_per_kg }, today)).toThrow(/Protein/);
    }
    for (const fat_pct of [14, 31, NaN, Infinity]) {
      expect(() => validateProfile({ ...profile, fat_pct }, today)).toThrow(/Fat/);
    }
  });
  it('recomputes percentages from maintenance', () => {
    expect(goalLabel(-0.5, 3000)).toBe('−0.5 kg/wk (-18%)');
    expect(goalLabel(0.5, 2000)).toBe('+0.5 kg/wk (+28%)');
    expect(goalLabel(0, 2000)).toBe('Maintain (0%)');
  });
  it('rejects invalid profiles, weights, and impossible macro allocations', () => {
    expect(() => nutrition(profile, NaN, today)).toThrow();
    expect(() => validateProfile({ ...profile, height_cm: 0 }, today)).toThrow();
    expect(() => nutrition({ ...profile, sex: 'f', birthdate: '1940-01-01', height_cm: 100, activity: 1.2, goal_kg_per_week: -0.5, protein_g_per_kg: 2.4, fat_pct: 30 }, 40, today)).toThrow(/carbohydrates/);
  });
});
