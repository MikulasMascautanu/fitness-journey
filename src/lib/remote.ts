import type { Remote } from './repository';
import { supabase } from './supabase';
import type { BodyEntry, FoodDay, Profile } from './types';

async function assertSession(accountId: string) {
  const { data, error } = await supabase!.auth.getSession();
  if (error) throw error;
  if (data.session?.user.id !== accountId) throw new Error('Sign in to this account again to sync your changes.');
}

export const remote: Remote = {
  async pull(accountId) {
    await assertSession(accountId);
    const [profile, body, food] = await Promise.all([
      supabase!.from('profiles').select('*').eq('id', accountId).maybeSingle(),
      allRows<BodyEntry>('body_entries', accountId),
      allRows<FoodDay>('food_days', accountId),
    ]);
    if (profile.error) throw profile.error;
    return { profile: profile.data as Profile | null, body, food };
  },
  async push(write) {
    await assertSession(write.table === 'profiles' ? write.record.id : write.record.account_id);
    const { error } = await supabase!.from(write.table).upsert<Record<string, unknown>>(write.record, { onConflict: write.table === 'profiles' ? 'id' : 'account_id,date' });
    if (error) throw error;
  },
};

// Supabase caps a response at 1,000 rows by default. Keep the full history available.
async function allRows<T>(table: 'body_entries' | 'food_days', accountId: string): Promise<T[]> {
  const rows: T[] = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await supabase!.from(table).select('*').eq('account_id', accountId).order('date', { ascending: false }).range(offset, offset + 999);
    if (error) throw error;
    rows.push(...data as T[]);
    if (data.length < 1000) return rows;
  }
}
