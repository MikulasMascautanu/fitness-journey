import type { Profile, Sex } from './types';

export function localDate(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function ageOn(birthdate: string, on = localDate()): number {
  if (!isValidDate(birthdate) || !isValidDate(on) || birthdate > on) throw new Error('Enter a valid birthdate before the entry date.');
  const [year, month, day] = birthdate.split('-').map(Number);
  const [currentYear, currentMonth, currentDay] = on.split('-').map(Number);
  return currentYear - year - (currentMonth < month || (currentMonth === month && currentDay < day) ? 1 : 0);
}

export function inRange(value: number, min: number, max: number, label: string): number {
  if (!Number.isFinite(value) || value < min || value > max) throw new Error(`${label} must be between ${min} and ${max}.`);
  return value;
}

export function bodyFat(sex: Sex, age: number, sites: readonly number[]): number {
  inRange(age, 18, 120, 'Age');
  if (sex !== 'm' && sex !== 'f') throw new Error('Select a sex for the calculation.');
  if (sites.length !== 3) throw new Error('Enter all three skinfold readings.');
  const sum = sites.reduce((total, site) => total + inRange(site, 1, 100, 'Skinfold (mm)'), 0);
  const density = sex === 'm'
    ? 1.10938 - 0.0008267 * sum + 0.0000016 * sum ** 2 - 0.0002574 * age
    : 1.0994921 - 0.0009929 * sum + 0.0000023 * sum ** 2 - 0.0001392 * age;
  const result = 495 / density - 450;
  if (!Number.isFinite(result) || result <= 0 || result >= 70) throw new Error('These readings produce an out-of-range estimate. Check the skinfold values.');
  return result;
}

export const goals = [-0.5, -0.25, 0, 0.25, 0.5] as const;
export const activities = [
  { value: 1.2, label: 'Sedentary', detail: 'Little or no exercise' },
  { value: 1.375, label: 'Light', detail: '1–3 active days / week' },
  { value: 1.55, label: 'Moderate', detail: '3–5 active days / week' },
  { value: 1.725, label: 'High', detail: '6–7 active days / week' },
] as const;

export function validateProfile(profile: Profile, on = localDate()): void {
  inRange(ageOn(profile.birthdate, on), 18, 120, 'Age');
  inRange(profile.height_cm, 100, 250, 'Height (cm)');
  if (!['m', 'f'].includes(profile.sex)) throw new Error('Select a sex for the calculation.');
  if (!activities.some(a => a.value === profile.activity)) throw new Error('Select an activity level.');
  if (![1.6, 2, 2.4].includes(profile.protein_g_per_kg)) throw new Error('Select a protein target.');
  if (![20, 25, 30].includes(profile.fat_pct)) throw new Error('Select a fat target.');
  if (!goals.includes(profile.goal_kg_per_week)) throw new Error('Select a weekly goal.');
}

export function energy(profile: Profile, weight: number, on = localDate()) {
  validateProfile(profile, on);
  inRange(weight, 25, 400, 'Weight (kg)');
  const age = ageOn(profile.birthdate, on);
  const bmr = 10 * weight + 6.25 * profile.height_cm - 5 * age + (profile.sex === 'm' ? 5 : -161);
  const tdee = bmr * profile.activity;
  const kcal = tdee + profile.goal_kg_per_week * 7700 / 7;
  return { bmr, tdee, kcal };
}

export function nutrition(profile: Profile, weight: number, on = localDate()) {
  const { bmr, tdee, kcal } = energy(profile, weight, on);
  const protein = profile.protein_g_per_kg * weight;
  const fat = kcal * profile.fat_pct / 100 / 9;
  const carbs = (kcal - protein * 4 - fat * 9) / 4;
  if (kcal <= 0 || carbs < 0) throw new Error('This goal leaves no room for carbohydrates. Choose a smaller deficit or reduce protein or fat.');
  return { bmr, tdee, kcal, protein, fat, carbs };
}

export function goalLabel(goal: number, tdee?: number) {
  const name = goal === 0 ? 'Maintain' : `${goal > 0 ? '+' : '−'}${Math.abs(goal)} kg/wk`;
  if (!tdee || tdee <= 0) return name;
  const percentage = Math.round(goal * 1100 / tdee * 100);
  return `${name} (${percentage > 0 ? '+' : ''}${percentage}%)`;
}

export function recentDates(count: number, end = localDate()): string[] {
  const date = new Date(`${end}T12:00:00`);
  return Array.from({ length: count }, (_, index) => {
    const day = new Date(date);
    day.setDate(day.getDate() - (count - 1 - index));
    return localDate(day);
  });
}

export function formatDate(date: string, year = false): string {
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', ...(year ? { year: 'numeric' } : {}) }).format(new Date(`${date}T12:00:00`));
}
