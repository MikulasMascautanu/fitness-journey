import { describe, expect, it } from 'vitest';
import { Repository, type Remote, type Storage } from './repository';
import { emptySnapshot, type FoodDay, type PendingWrite, type PortionSettings, type Profile, type Snapshot } from './types';

const profile: Profile = { id: 'alice', sex: 'f', birthdate: '1990-01-01', height_cm: 170, activity: 1.55, protein_g_per_kg: 2, fat_pct: 25, goal_kg_per_week: 0 };
const food = (kcal: number, account_id = 'alice'): FoodDay => ({ id: 'food-id', account_id, date: '2026-10-13', kcal, protein_g: 100, carbs_g: 200, fat_g: 50 });
const portions = (meat_raw_g: number, account_id = 'alice'): PortionSettings => ({ account_id, display_name: account_id, meat_raw_g, carbs_raw_g: 75 });
function memory(): Storage {
  const records = new Map<string, Snapshot>();
  return { async load(id) { return structuredClone(records.get(id)); }, async save(id, snapshot) { records.set(id, structuredClone(snapshot)); } };
}
function server(): Remote & { writes: PendingWrite[] } {
  const state = emptySnapshot();
  const writes: PendingWrite[] = [];
  return {
    writes,
    async pull() { return structuredClone(state); },
    async push(write) {
      writes.push(write);
      if (write.table === 'profiles') state.profile = write.record;
      if (write.table === 'food_days') state.food = [write.record];
      if (write.table === 'portion_settings') state.portions = [...state.portions.filter(entry => entry.account_id !== write.record.account_id), write.record];
    },
  };
}
function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>(r => { resolve = r; });
  return { promise, resolve };
}

describe('account storage and offline synchronization', () => {
  it('overwrites the same date and survives reloads while offline', async () => {
    const storage = memory(); const remote = server();
    const first = new Repository('alice', storage, remote);
    await first.load(); await first.saveFood(food(2000)); await first.saveFood(food(2100));
    const reloaded = new Repository('alice', storage, remote); await reloaded.load();
    expect(reloaded.snapshot.food).toHaveLength(1);
    expect(reloaded.snapshot.food[0].kcal).toBe(2100);
    expect(reloaded.snapshot.pending).toHaveLength(1);
    await reloaded.sync();
    expect(remote.writes).toHaveLength(1);
    expect(reloaded.snapshot.pending).toHaveLength(0);
  });
  it('isolates accounts and rejects foreign writes', async () => {
    const storage = memory(); const alice = new Repository('alice', storage, null); const bob = new Repository('bob', storage, null);
    await alice.load(); await alice.saveFood(food(2000)); await bob.load();
    expect(bob.snapshot.food).toHaveLength(0);
    await expect(bob.saveFood(food(2100))).rejects.toThrow(/different account/);
  });
  it('keeps the queue after network failure and retries successfully', async () => {
    const remote = server(); const original = remote.push;
    remote.push = async () => { throw new Error('Network unavailable'); };
    const repo = new Repository('alice', memory(), remote); await repo.load(); await repo.saveFood(food(2000));
    await expect(repo.sync()).rejects.toThrow(/Network/);
    expect(repo.snapshot.pending).toHaveLength(1);
    remote.push = original; await repo.sync(); expect(repo.snapshot.pending).toHaveLength(0);
  });
  it('sends a newer edit made during an in-flight save', async () => {
    const remote = server(); const original = remote.push; const started = deferred(); const release = deferred();
    remote.push = async write => { if (!remote.writes.length) { started.resolve(); await release.promise; } await original(write); };
    const repo = new Repository('alice', memory(), remote); await repo.load(); await repo.saveFood(food(2000));
    const sync = repo.sync(); await started.promise; await repo.saveFood(food(2300)); release.resolve(); await sync;
    expect(remote.writes.map(w => w.table === 'food_days' && w.record.kcal)).toEqual([2000, 2300]);
    expect(repo.snapshot.food[0].kcal).toBe(2300);
    expect(repo.snapshot.pending).toHaveLength(0);
  });
  it('preserves local edits made while downloading remote data', async () => {
    const remote = server(); const started = deferred(); const release = deferred();
    remote.pull = async () => { started.resolve(); await release.promise; return emptySnapshot(); };
    const repo = new Repository('alice', memory(), remote); await repo.load();
    const sync = repo.sync(); await started.promise; await repo.saveFood(food(2300)); release.resolve(); await sync;
    expect(repo.snapshot.food[0].kcal).toBe(2300);
    expect(repo.snapshot.pending).toHaveLength(1);
  });
  it('sends a profile before dependent entries', async () => {
    const remote = server(); const repo = new Repository('alice', memory(), remote); await repo.load();
    await repo.saveFood(food(2000)); await repo.saveProfile(profile); await repo.sync();
    expect(remote.writes.map(w => w.table)).toEqual(['profiles', 'food_days']);
  });
  it('does not report saved data when persistent storage fails', async () => {
    const repo = new Repository('alice', { async load() { return undefined; }, async save() { throw new Error('Quota exceeded'); } }, null);
    await repo.load(); await expect(repo.saveFood(food(2000))).rejects.toThrow(/Quota/);
    expect(repo.snapshot.food).toHaveLength(0);
  });
  it('stops uploading queued records after sign-out', async () => {
    const remote = server(); const repo = new Repository('alice', memory(), remote); await repo.load(); await repo.saveFood(food(2000)); repo.stop(); await repo.sync();
    expect(remote.writes).toHaveLength(0); expect(repo.snapshot.pending).toHaveLength(1);
  });
});

describe('portion settings', () => {
  it('loads existing browser records without portion settings', async () => {
    const legacy = { profile, body: [], food: [food(2000)], cycles: [], pending: [] };
    const repo = new Repository('alice', { async load() { return legacy as unknown as Snapshot; }, async save() {} }, null);
    await repo.load();
    expect(repo.snapshot.portions).toEqual([]);
    await repo.savePortions(portions(150));
    expect(repo.snapshot.food).toEqual([food(2000)]);
    expect(repo.snapshot.portions).toEqual([portions(150)]);
  });

  it('keeps one setting per person, preserves the shared list, and syncs offline edits after reload', async () => {
    const storage = memory(); const remote = server();
    await remote.push({ table: 'portion_settings', record: portions(180, 'bob'), key: 'portions:bob', revision: 'bob-revision' });
    remote.writes.length = 0;
    const repo = new Repository('alice', storage, remote); await repo.load(); await repo.sync();
    await repo.savePortions(portions(150)); await repo.savePortions(portions(165.5));
    const reloaded = new Repository('alice', storage, remote); await reloaded.load();
    expect(reloaded.snapshot.portions).toEqual([portions(180, 'bob'), portions(165.5)]);
    expect(reloaded.snapshot.pending).toHaveLength(1);
    await reloaded.sync();
    expect(remote.writes).toHaveLength(1);
    expect(reloaded.snapshot.pending).toHaveLength(0);
    expect(reloaded.snapshot.portions).toEqual([portions(180, 'bob'), portions(165.5)]);
    await expect(reloaded.savePortions(portions(250, 'bob'))).rejects.toThrow(/different account/);
    expect(reloaded.snapshot.portions.find(entry => entry.account_id === 'bob')).toEqual(portions(180, 'bob'));
  });

  it('preserves a newer portion edit while an older revision is uploading', async () => {
    const remote = server(); const original = remote.push; const started = deferred(); const release = deferred();
    remote.push = async write => { if (!remote.writes.length) { started.resolve(); await release.promise; } await original(write); };
    const repo = new Repository('alice', memory(), remote); await repo.load(); await repo.savePortions(portions(150));
    const syncing = repo.sync(); await started.promise; await repo.savePortions(portions(175)); release.resolve(); await syncing;
    expect(remote.writes.map(write => write.table === 'portion_settings' && write.record.meat_raw_g)).toEqual([150, 175]);
    expect(repo.snapshot.portions).toEqual([portions(175)]);
    expect(repo.snapshot.pending).toHaveLength(0);
  });

  it('keeps a portion edit made during directory download and isolates cached directories by account', async () => {
    const remote = server(); const started = deferred(); const release = deferred(); const storage = memory();
    remote.pull = async () => { started.resolve(); await release.promise; return { ...emptySnapshot(), portions: [portions(100), portions(180, 'bob')] }; };
    const repo = new Repository('alice', storage, remote); await repo.load();
    const syncing = repo.sync(); await started.promise; await repo.savePortions(portions(160)); release.resolve(); await syncing;
    expect(repo.snapshot.portions).toEqual([portions(180, 'bob'), portions(160)]);
    expect(repo.snapshot.pending).toHaveLength(1);
    const bob = new Repository('bob', storage, null); await bob.load();
    expect(bob.snapshot.portions).toEqual([]);
  });
});
