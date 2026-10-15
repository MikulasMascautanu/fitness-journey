import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { browserStorage, Repository } from './repository';
import { remote } from './remote';
import { emptySnapshot, type BodyEntry, type CycleEntry, type FoodDay, type Profile, type Snapshot } from './types';
import { demoSnapshot } from './demo';

type Data = Snapshot & {
  accountId: string; demo: boolean; loading: boolean; storageError: string; syncError: string; syncing: boolean; online: boolean;
  saveProfile(profile: Profile): Promise<void>;
  saveBody(entry: BodyEntry): Promise<void>;
  saveFood(entry: FoodDay): Promise<void>;
  saveCycle(entry: CycleEntry): Promise<void>;
  deleteCycle(entry: CycleEntry): Promise<void>;
  sync(): Promise<void>;
};
const Context = createContext<Data | null>(null);
export function errorMessage(error: unknown): string { return error instanceof Error ? error.message : typeof error === 'object' && error && 'message' in error ? String(error.message) : 'Something went wrong. Please try again.'; }

export function DataProvider({ accountId, demo, children }: { accountId: string; demo: boolean; children: ReactNode }) {
  const [snapshot, setSnapshot] = useState(emptySnapshot);
  const [loading, setLoading] = useState(true);
  const [storageError, setStorageError] = useState('');
  const [syncError, setSyncError] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);
  const repository = useRef<Repository | null>(null);
  const live = useRef(true);
  const sync = useCallback(async () => {
    const repo = repository.current;
    if (!repo || demo || !navigator.onLine) return;
    setSyncing(true);
    try { await repo.sync(); if (live.current) setSyncError(''); }
    catch (error) { if (live.current) setSyncError(errorMessage(error)); }
    finally { if (live.current) setSyncing(false); }
  }, [demo]);

  useEffect(() => {
    let active = true;
    live.current = true;
    const repo = new Repository(accountId, browserStorage, demo ? null : remote, state => { if (active) setSnapshot(state); });
    async function initialize() {
      try {
        if (demo && !await browserStorage.load(accountId)) await browserStorage.save(accountId, demoSnapshot());
        await repo.load();
        if (!active) return;
        repository.current = repo;
        // Fetch an existing profile before offering first-time onboarding.
        if (!demo && navigator.onLine) await sync();
      } catch (error) { if (active) setStorageError(errorMessage(error)); }
      finally { if (active) setLoading(false); }
    }
    void initialize();
    const connection = () => { setOnline(navigator.onLine); if (navigator.onLine) void sync(); };
    const focus = () => { void sync(); };
    window.addEventListener('online', connection);
    window.addEventListener('offline', connection);
    window.addEventListener('focus', focus);
    const interval = window.setInterval(() => { if (repo.snapshot.pending.length) void sync(); }, 30000);
    return () => {
      active = false; live.current = false; repo.stop(); repository.current = null;
      window.removeEventListener('online', connection); window.removeEventListener('offline', connection); window.removeEventListener('focus', focus); window.clearInterval(interval);
    };
  }, [accountId, demo, sync]);

  async function save(operation: (repo: Repository) => Promise<void>) {
    if (!repository.current) throw new Error('Your records are still loading.');
    await operation(repository.current);
    void sync();
  }
  return <Context.Provider value={{ ...snapshot, accountId, demo, loading, storageError, syncError, syncing, online, sync,
    saveProfile: profile => save(repo => repo.saveProfile(profile)),
    saveBody: entry => save(repo => repo.saveBody(entry)),
    saveFood: entry => save(repo => repo.saveFood(entry)),
    saveCycle: entry => save(repo => repo.saveCycle(entry)),
    deleteCycle: entry => save(repo => repo.deleteCycle(entry)),
  }}>{children}</Context.Provider>;
}

export function useData() { const value = useContext(Context); if (!value) throw new Error('DataProvider is missing.'); return value; }
