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
      supabase!.from('body_entries').select('*').eq('account_id', accountId).order('date', { ascending: false }),
      supabase!.from('food_days').select('*').eq('account_id', accountId).order('date', { ascending: false }),
    ]);
    for (const result of [profile, body, food]) if (result.error) throw result.error;
    return { profile: profile.data as Profile | null, body: (body.data ?? []) as BodyEntry[], food: (food.data ?? []) as FoodDay[] };
  },
  async push(write) {
    await assertSession(write.table === 'profiles' ? write.record.id : write.record.account_id);
    const { error } = await supabase!.from(write.table).upsert<Record<string, unknown>>(write.record, { onConflict: write.table === 'profiles' ? 'id' : 'account_id,date' });
    if (error) throw error;
  },
};
