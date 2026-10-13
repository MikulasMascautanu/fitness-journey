import { useState, type FormEvent } from 'react';
import { ageOn, localDate, validateProfile } from '../lib/calculations';
import { errorMessage, useData } from '../lib/data';
import type { Profile } from '../lib/types';
import { Field, Notice, SelectField } from './Fields';

export function ProfileForm() {
  const { profile, accountId, saveProfile, demo } = useData();
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setSaved(false); setBusy(true);
    const form = new FormData(event.currentTarget);
    try {
      const next: Profile = { id: accountId, activity: 1.55, protein_g_per_kg: 2, fat_pct: 25, goal_kg_per_week: 0, ...profile,
        sex: form.get('sex') as Profile['sex'], birthdate: String(form.get('birthdate')), height_cm: Number(form.get('height')) };
      validateProfile(next);
      await saveProfile(next); setSaved(true);
    } catch (error) { setError(errorMessage(error)); }
    finally { setBusy(false); }
  }
  return <>
    <p className="eyebrow">YOUR STARTING POINT</p><h1>{profile ? 'Your profile' : 'Let’s make this yours.'}</h1>
    <p className="page-intro">A few details to calculate your body composition and daily targets.</p>
    <section className="card">
      <div className="card-heading"><h2>Personal details</h2>{profile && <span className="badge">{ageOn(profile.birthdate)} years</span>}</div>
      <form onSubmit={submit} onChange={() => setSaved(false)}>
        <div className="form-grid">
          <SelectField label="Sex used in formulas" name="sex" required defaultValue={profile?.sex ?? ''}><option value="" disabled>Select</option><option value="m">Male</option><option value="f">Female</option></SelectField>
          <Field label="Birthdate" name="birthdate" type="date" required max={localDate()} defaultValue={profile?.birthdate} />
          <Field label="Height" unit="cm" name="height" type="number" inputMode="decimal" min="100" max="250" step="0.1" required placeholder="180" defaultValue={profile?.height_cm} />
        </div>
        <p className="form-note">These estimates use adult formulas (18+). Your birthdate keeps your age up to date automatically.</p>
        {demo && <Notice>This is a demo profile. Changes stay in this browser.</Notice>}
        {error && <Notice error>{error}</Notice>}{saved && <Notice>Profile saved.</Notice>}
        <div className="form-footer"><span className="muted">You can update these anytime.</span><button className="button primary" disabled={busy}>{busy ? 'Saving…' : profile ? 'Save profile' : 'Start tracking'}</button></div>
      </form>
    </section>
  </>;
}
