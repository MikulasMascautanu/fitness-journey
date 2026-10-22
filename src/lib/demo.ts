import { localDate, recentDates } from './calculations';
import { skinfoldEstimate, skinfoldMethod } from './skinfolds';
import type { Snapshot } from './types';

export function demoSnapshot(): Snapshot {
  const dates = recentDates(43);
  const id = 'demo';
  return {
    profile: { id, sex: 'm', birthdate: `${new Date().getFullYear() - 30}-01-01`, height_cm: 180, activity: 1.55, protein_g_per_kg: 2, fat_pct: 25, goal_kg_per_week: -0.25 },
    body: dates.filter((_, i) => i % 3 === 0).map((date, i) => {
      const sites = [8, 12, 14, Math.round((24 - i * .4) * 10) / 10];
      return { id: `demo-body-${i}`, account_id: id, date, weight_kg: Math.round((88.6 - i * .14 + Math.sin(i) * .25) * 10) / 10,
        body_fat_pct: skinfoldEstimate('m', 30, sites).percentage, body_fat_method: skinfoldMethod,
        skinfold_1_mm: sites[0], skinfold_2_mm: sites[1], skinfold_3_mm: sites[2], skinfold_4_mm: sites[3],
        waist: Math.round((94 - i * .2) * 10) / 10, chest: null, hips: null, arm: null, thigh: null, neck: null };
    }).reverse(),
    food: recentDates(14).filter(date => date !== localDate()).map((date, i) => ({ id: `demo-food-${i}`, account_id: id, date, kcal: [2430, 2580, 2700, 2450, 2380, 2820, 2520, 2490, 2390, 2650, 2410, 2540, 2470][i], protein_g: 170 + i % 4 * 3, carbs_g: 275 + i % 5 * 10, fat_g: 68 + i % 3 * 4 })).reverse(),
    cycles: [],
    pending: [],
  };
}
