export type Sex = 'm' | 'f';
export type Profile = {
  id: string;
  sex: Sex;
  birthdate: string;
  height_cm: number;
  activity: 1.2 | 1.375 | 1.55 | 1.725;
  protein_g_per_kg: number;
  fat_pct: number;
  goal_kg_per_week: -0.5 | -0.25 | 0 | 0.25 | 0.5;
};
export const measurements = ['waist', 'chest', 'hips', 'arm', 'thigh', 'neck'] as const;
export type Measurement = typeof measurements[number];
export type BodyEntry = {
  id: string;
  account_id: string;
  date: string;
  weight_kg: number;
  body_fat_pct: number | null;
  skinfold_1_mm: number | null;
  skinfold_2_mm: number | null;
  skinfold_3_mm: number | null;
} & Record<Measurement, number | null>;
export type FoodDay = {
  id: string;
  account_id: string;
  date: string;
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
};
export type PendingWrite = (
  | { table: 'profiles'; record: Profile }
  | { table: 'body_entries'; record: BodyEntry }
  | { table: 'food_days'; record: FoodDay }
) & { key: string; revision: string };
export type Records = { profile: Profile | null; body: BodyEntry[]; food: FoodDay[] };
export type Snapshot = Records & { pending: PendingWrite[] };
export const emptySnapshot = (): Snapshot => ({ profile: null, body: [], food: [], pending: [] });
