import { useState, type FormEvent } from 'react';
import { formatDate, isValidDate, localDate } from '../lib/calculations';
import { errorMessage, useData } from '../lib/data';
import type { CycleEntry } from '../lib/types';
import { Field, Notice } from './Fields';

export function CycleLog() {
  const { accountId, cycles, profile, saveCycle, deleteCycle } = useData();
  const [editing, setEditing] = useState<CycleEntry | null>(null);
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');
  const today = localDate();

  function edit(entry: CycleEntry) {
    setEditing(entry);
    setStart(entry.start_date);
    setEnd(entry.end_date ?? '');
    setError('');
    setSaved('');
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setSaved('');
    setBusy(true);
    try {
      if (!isValidDate(start) || start < profile!.birthdate || start > today)
        throw new Error('Choose a valid start date between your birthdate and today.');
      if (end && (!isValidDate(end) || end < start || end > today))
        throw new Error('The end date must be between the start date and today.');
      if (cycles.some(entry => entry.id !== editing?.id && start <= (entry.end_date ?? today) && (end || today) >= entry.start_date))
        throw new Error('This period overlaps another logged period. Edit that entry instead.');
      const entry: CycleEntry = { id: editing?.id ?? crypto.randomUUID(), account_id: accountId, start_date: start, end_date: end || null };
      await saveCycle(entry);
      setEditing(null);
      setStart('');
      setEnd('');
      setSaved('Period saved.');
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  async function remove(entry: CycleEntry) {
    if (!window.confirm(`Delete the period starting ${formatDate(entry.start_date, true)}?`)) return;
    setError('');
    setSaved('');
    setBusy(true);
    try {
      await deleteCycle(entry);
      if (editing?.id === entry.id) { setEditing(null); setStart(''); setEnd(''); }
      setSaved('Period deleted.');
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  return <section className="card cycle-card" aria-labelledby="cycle-heading">
    <div className="card-heading"><h2 id="cycle-heading">Menstrual cycle</h2><span className="subtle-label">{cycles.length} logged</span></div>
    <p className="form-note">Log the first and last day of each period. Leave the end date empty while it is ongoing. Logged days can be shown behind your weight chart.</p>
    <form className="entry-form" onSubmit={submit}>
      <div className="form-grid">
        <Field label="Period started" type="date" required min={profile!.birthdate} max={today} value={start} onChange={event => setStart(event.target.value)} />
        <Field label="Period ended (optional)" type="date" min={start || profile!.birthdate} max={today} value={end} onChange={event => setEnd(event.target.value)} />
      </div>
      {error && <Notice error>{error}</Notice>}
      {saved && <Notice>{saved}</Notice>}
      <div className="form-footer"><span className="muted">{editing ? `Editing period from ${formatDate(editing.start_date, true)}` : 'Your dates stay in your account.'}</span><div className="cycle-actions">{editing && <button className="button secondary" type="button" onClick={() => { setEditing(null); setStart(''); setEnd(''); setError(''); }}>Cancel</button>}<button className="button primary" disabled={busy}>{busy ? 'Saving…' : editing ? 'Update period' : 'Save period'}</button></div></div>
    </form>
    {cycles.length > 0 && <div className="cycle-history"><h3>Logged periods</h3><div className="table-scroll"><table><caption className="sr-only">Logged periods, most recent first</caption><thead><tr><th>Started</th><th>Ended</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{cycles.map(entry => <tr key={entry.id}><th scope="row">{formatDate(entry.start_date, true)}</th><td>{entry.end_date ? formatDate(entry.end_date, true) : 'Ongoing'}</td><td><div className="cycle-actions"><button type="button" className="text-button" onClick={() => edit(entry)}>Edit</button><button type="button" className="text-button danger" disabled={busy} onClick={() => void remove(entry)}>Delete</button></div></td></tr>)}</tbody></table></div></div>}
  </section>;
}
