import { describe, expect, it } from 'vitest';
import { Repository, type Remote, type Storage } from './repository';
import { emptySnapshot, type FoodDay, type PendingWrite, type Profile, type Snapshot } from './types';

const profile: Profile = { id: 'alice', sex: 'f', birthdate: '1990-01-01', height_cm: 170, activity: 1.55, protein_g_per_kg: 2, fat_pct: 25, goal_kg_per_week: 0 };
const food = (kcal: number, account_id = 'alice'): FoodDay => ({ id: 'food-id', account_id, date: '2026-10-13', kcal, protein_g: 100, carbs_g: 200, fat_g: 50 });
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
