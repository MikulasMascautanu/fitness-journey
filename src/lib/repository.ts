import { openDB } from 'idb';
import { emptySnapshot, type BodyEntry, type FoodDay, type PendingWrite, type Profile, type Records, type Snapshot } from './types';

export interface Storage {
  load(accountId: string): Promise<Snapshot | undefined>;
  save(accountId: string, snapshot: Snapshot): Promise<void>;
  update?(accountId: string, transform: (current: Snapshot) => Snapshot): Promise<Snapshot>;
}
export interface Remote {
  pull(accountId: string): Promise<Records>;
  push(write: PendingWrite): Promise<void>;
}

export const browserStorage: Storage = {
  async load(id) { return (await database()).get('accounts', id); },
  async save(id, snapshot) { await (await database()).put('accounts', snapshot, id); },
  async update(id, transform) {
    const transaction = (await database()).transaction('accounts', 'readwrite');
    const next = transform(await transaction.store.get(id) ?? emptySnapshot());
    await transaction.store.put(next, id);
    await transaction.done;
    return next;
  },
};
function database() {
  // Keep the original storage identifier so existing records and pending writes remain accessible.
  return openDB('fit-log-v1', 1, { upgrade(db) { db.createObjectStore('accounts'); } });
}

function apply(records: Records, write: PendingWrite): Records {
  if (write.table === 'profiles') return { ...records, profile: write.record };
  if (write.table === 'body_entries') return { ...records, body: [...records.body.filter(x => x.date !== write.record.date), write.record].sort((a, b) => b.date.localeCompare(a.date)) };
  return { ...records, food: [...records.food.filter(x => x.date !== write.record.date), write.record].sort((a, b) => b.date.localeCompare(a.date)) };
}

// Serial local mutations prevent an in-flight sync acknowledgement from losing a newer edit.
export class Repository {
  snapshot = emptySnapshot();
  private chain: Promise<void> = Promise.resolve();
  private syncPromise: Promise<void> | null = null;
  private stopped = false;
  constructor(readonly accountId: string, private storage: Storage, private remote: Remote | null, private changed: (snapshot: Snapshot) => void = () => {}) {}

  async load() {
    this.snapshot = await this.storage.load(this.accountId) ?? emptySnapshot();
    if (!this.stopped) this.changed(this.snapshot);
  }
  stop() { this.stopped = true; }

  private mutate(update: (current: Snapshot) => Snapshot): Promise<void> {
    const operation = this.chain.then(async () => {
      // One IndexedDB transaction also protects against stale snapshots in other tabs.
      const next = this.storage.update
        ? await this.storage.update(this.accountId, update)
        : update(this.snapshot);
      if (!this.storage.update) await this.storage.save(this.accountId, next);
      this.snapshot = next;
      if (!this.stopped) this.changed(next);
    });
    this.chain = operation.catch(() => {});
    return operation;
  }

  saveProfile(record: Profile) { return this.write({ table: 'profiles', record, key: 'profile', revision: crypto.randomUUID() }); }
  saveBody(record: BodyEntry) { return this.write({ table: 'body_entries', record, key: `body:${record.date}`, revision: crypto.randomUUID() }); }
  saveFood(record: FoodDay) { return this.write({ table: 'food_days', record, key: `food:${record.date}`, revision: crypto.randomUUID() }); }

  private write(write: PendingWrite): Promise<void> {
    const owner = write.table === 'profiles' ? write.record.id : write.record.account_id;
    if (owner !== this.accountId) return Promise.reject(new Error('This record belongs to a different account.'));
    return this.mutate(current => ({
      ...apply(current, write),
      pending: this.remote ? [...current.pending.filter(x => x.key !== write.key), write] : [],
    }));
  }

  sync(): Promise<void> {
    if (!this.remote || this.stopped) return Promise.resolve();
    if (this.syncPromise) return this.syncPromise;
    this.syncPromise = this.performSync().finally(() => { this.syncPromise = null; });
    return this.syncPromise;
  }

  private async performSync() {
    await this.chain;
    await this.mutate(current => current);
    while (!this.stopped && this.snapshot.pending.length) {
      // Profiles must exist before their child records, including after offline onboarding.
      const write = this.snapshot.pending.find(x => x.table === 'profiles') ?? this.snapshot.pending[0];
      await this.remote!.push(write);
      await this.mutate(current => ({ ...current, pending: current.pending.filter(x => x.revision !== write.revision) }));
    }
    if (this.stopped) return;
    const remote = await this.remote!.pull(this.accountId);
    if (this.stopped) return;
    await this.mutate(current => ({
      ...current.pending.reduce<Records>((records, write) => apply(records, write), remote),
      pending: current.pending,
    }));
  }
}
