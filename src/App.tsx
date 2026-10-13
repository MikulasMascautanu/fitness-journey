import { useEffect, useState } from 'react';
import { NavLink, Route, Routes } from 'react-router-dom';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import { DataProvider, errorMessage, useData } from './lib/data';
import { ProfileForm } from './components/ProfileForm';
import { Notice } from './components/Fields';
import { Icon } from './components/Icon';
import { formatDate, localDate } from './lib/calculations';
import { Body } from './components/Body';
import { Nutrition } from './components/Nutrition';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(Boolean(supabase));
  const [demo, setDemo] = useState(() => localStorage.getItem('fit-log-demo') === 'true');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!supabase) return;
    let active = true;
    const { data } = supabase.auth.onAuthStateChange((_event, value) => { if (active) { setSession(value); setLoading(false); if (value) { setDemo(false); localStorage.removeItem('fit-log-demo'); } } });
    supabase.auth.getSession().then(({ data, error }) => { if (active) { if (error) setError(error.message); setSession(data.session); setLoading(false); } }).catch(error => { if (active) { setError(errorMessage(error)); setLoading(false); } });
    return () => { active = false; data.subscription.unsubscribe(); };
  }, []);

  async function signIn() {
    setBusy(true); setError('');
    try {
      const { error } = await supabase!.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } });
      if (error) throw error;
    } catch (error) { setError(errorMessage(error)); }
    finally { setBusy(false); }
  }
  async function signOut() {
    if (demo) { localStorage.removeItem('fit-log-demo'); setDemo(false); return; }
    const { error } = await supabase!.auth.signOut({ scope: 'local' });
    if (error) throw error;
    setSession(null);
  }
  if (loading) return <div className="center-screen" role="status">Loading Fit Log…</div>;
  if (session || demo) return <DataProvider key={demo ? 'demo' : session!.user.id} accountId={demo ? 'demo' : session!.user.id} demo={demo}>
    <Shell email={demo ? 'Your personal preview' : session!.user.email ?? 'Your account'} signOut={signOut} />
  </DataProvider>;

  return <div className="welcome">
    <div className="welcome-story">
      <a className="brand" href="/">Fit Log<span className="brand-dot" /></a>
      <div><p className="eyebrow">A LITTLE EVERY DAY</p><h1>Your progress.<br />In perspective.</h1><p>A simple space for your body measurements,<br className="desktop-only" /> daily nutrition, and the bigger picture.</p>
        <div className="welcome-visual" aria-hidden="true"><div className="visual-label">CONSISTENCY OVER PERFECTION</div><svg viewBox="0 0 400 130"><path d="M0 30C30 28 35 65 70 52S110 40 140 65 190 53 220 82 270 68 300 94 350 82 400 108" fill="none" stroke="currentColor" strokeWidth="3" /><circle cx="400" cy="108" r="5" fill="currentColor" /></svg><div className="visual-label visual-bottom"><span>SMALL STEPS</span><span>LASTING CHANGE</span></div></div>
      </div><span className="welcome-footnote">Built around you. One day at a time.</span>
    </div>
    <main className="welcome-action"><div className="sign-in-card"><span className="small-icon"><Icon name="body" size={26} /></span><h2>A place for your progress</h2><p className="muted">Keep a record. Find your rhythm.<br />See how far you’ve come.</p>
      {supabase ? <button className="button primary wide" disabled={busy} onClick={() => void signIn()}><span className="google-g">G</span>{busy ? 'Connecting…' : 'Continue with Google'}</button> : <Notice>Google sign-in isn’t configured yet. Follow the Supabase setup in the project README, or explore the demo below.</Notice>}
      {error && <Notice error>{error}</Notice>}
      <button className="button secondary wide" onClick={() => { localStorage.setItem('fit-log-demo', 'true'); setDemo(true); }}>Explore the demo <span aria-hidden="true">↗</span></button>
      <p className="sign-in-note">The demo includes sample entries and saves changes on this device.</p>
      <div className="welcome-features"><span><Icon name="check" size={15} /> Body trends</span><span><Icon name="check" size={15} /> Daily nutrition</span></div>
    </div></main>
  </div>;
}

function Shell({ email, signOut }: { email: string; signOut(): Promise<void> }) {
  const { loading, profile, demo, pending, online, syncing, syncError, storageError, sync } = useData();
  const [logoutError, setLogoutError] = useState('');
  const [signingOut, setSigningOut] = useState(false);
  async function logout() {
    setSigningOut(true); setLogoutError('');
    try { await signOut(); } catch (error) { setLogoutError(errorMessage(error)); }
    finally { setSigningOut(false); }
  }
  return <div className="app-shell">
    <a className="skip-link" href="#main">Skip to content</a>
    <aside className="sidebar">
      <NavLink className="brand" to="/">Fit Log<span className="brand-dot" /></NavLink>
      <span className="nav-caption">YOUR DAILY PRACTICE</span>
      <nav aria-label="Main navigation"><NavLink to="/" end><Icon name="body" />Body</NavLink><NavLink to="/nutrition"><Icon name="nutrition" />Nutrition</NavLink></nav>
      <div className="sidebar-bottom">
        <div className="sidebar-message"><span className="tiny-line" /><p>Progress is a practice.<br />Keep showing up.</p></div>
        <NavLink className="account-link" to="/account"><span className="avatar"><Icon name="user" size={18} /></span><span><strong>{demo ? 'Demo account' : 'Your account'}</strong><span className="account-email">{email}</span></span></NavLink>
        {pending.length > 0 && <p className="pending-note">{pending.length} unsynced {pending.length === 1 ? 'change' : 'changes'}. They stay on this device until you return to this account and sync.</p>}
        <button className="text-button sign-out" onClick={() => void logout()} disabled={signingOut}><Icon name="logout" size={16} />{demo ? 'Leave demo' : 'Sign out'}</button>
        {logoutError && <Notice error>{logoutError}</Notice>}
      </div>
    </aside>
    <main className="main-content" id="main">
      <div className="topline"><span>{formatDate(localDate(), true)}</span><span className="sync-status" role="status"><i className={online ? '' : 'offline'} />{demo ? 'Demo · saved on this device' : !online ? 'Offline · saving on this device' : syncing ? 'Syncing…' : pending.length ? `${pending.length} pending` : 'Up to date'}</span></div>
      {syncError && <div className="notice error" role="alert">Couldn’t sync: {syncError} <button className="text-button" onClick={() => void sync()}>Retry</button></div>}
      {storageError ? <Notice error>Couldn’t open local storage: {storageError}. Allow storage in your browser and reload to try again.</Notice>
        : loading ? <div className="card" role="status">Loading your records…</div>
        : !profile && (syncError || !online) && !demo ? <div className="card"><h1>Connect to load your profile</h1><p className="muted">An internet connection is needed before your first entry on this device. Your existing account data will appear after a successful sync.</p><button className="button primary" onClick={() => void sync()}>Try again</button></div>
        : !profile ? <ProfileForm /> : <Routes>
          <Route path="/" element={<Body />} />
          <Route path="/nutrition" element={<Nutrition />} />
          <Route path="/account" element={<ProfileForm />} />
          <Route path="*" element={<div className="card"><h1>Page not found</h1><NavLink to="/">Back to Body</NavLink></div>} />
        </Routes>}
      <footer className="page-footer">FIT LOG <span>A little every day goes a long way.</span></footer>
    </main>
  </div>;
}
