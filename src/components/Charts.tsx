import { useId } from 'react';
import { formatDate, recentDates } from '../lib/calculations';
import type { FoodDay } from '../lib/types';

type Point = { date: string; value: number };
const w = 650, h = 220, left = 42, right = 15, top = 18, bottom = 34;
const number = (value: number) => value.toLocaleString('en', { maximumFractionDigits: 1 });

export function LineChart({ points, label, unit }: { points: Point[]; label: string; unit: string }) {
  const gradient = useId();
  if (!points.length) return <div className="chart-empty"><span className="empty-chart-mark">↗</span><strong>Your {label.toLowerCase()} trend starts here.</strong><span>Log an entry below to see your progress over time.</span></div>;
  const sorted = [...points].sort((a, b) => a.date.localeCompare(b.date));
  const values = sorted.map(p => p.value);
  const padding = Math.max((Math.max(...values) - Math.min(...values)) * .3, unit === 'kg' ? .6 : 1);
  const min = Math.max(0, Math.min(...values) - padding), max = Math.max(...values) + padding;
  const start = Date.parse(sorted[0].date), end = Date.parse(sorted.at(-1)!.date);
  const x = (date: string) => start === end ? (w + left - right) / 2 : left + (Date.parse(date) - start) / (end - start) * (w - left - right);
  const y = (value: number) => h - bottom - (value - min) / (max - min) * (h - top - bottom);
  const line = sorted.map((p, i) => `${i ? 'L' : 'M'}${x(p.date)},${y(p.value)}`).join(' ');
  const first = sorted[0], last = sorted.at(-1)!;
  const labelIndices = [...new Set([0, Math.floor((sorted.length - 1) / 2), sorted.length - 1])];
  return <svg className="chart" viewBox={`0 0 ${w} ${h}`} role="img" aria-label={`${label} history. ${sorted.length} entries, from ${number(first.value)} ${unit} on ${formatDate(first.date, true)} to ${number(last.value)} ${unit} on ${formatDate(last.date, true)}.`}>
    <defs><linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--accent)" stopOpacity=".12" /><stop offset="100%" stopColor="var(--accent)" stopOpacity="0" /></linearGradient></defs>
    {[0, 1, 2, 3].map(i => { const value = min + (max - min) * i / 3; return <g key={i}><line x1={left} x2={w - right} y1={y(value)} y2={y(value)} stroke="var(--border)" strokeDasharray="3 4" /><text x={left - 12} y={y(value) + 3} textAnchor="end">{number(value)}</text></g>; })}
    {sorted.length > 1 && <path d={`${line} L${x(last.date)},${h - bottom} L${x(first.date)},${h - bottom} Z`} fill={`url(#${gradient})`} />}
    <path d={line} fill="none" stroke="var(--accent)" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />
    {sorted.map((p, i) => <circle key={p.date} cx={x(p.date)} cy={y(p.value)} r={i === sorted.length - 1 ? 4 : 2.5} fill="var(--surface)" stroke="var(--accent)" strokeWidth="1.8"><title>{formatDate(p.date, true)}: {number(p.value)} {unit}</title></circle>)}
    {labelIndices.map(i => <text key={i} x={x(sorted[i].date)} y={h - 6} textAnchor={sorted.length === 1 ? 'middle' : i === 0 ? 'start' : i === sorted.length - 1 ? 'end' : 'middle'}>{formatDate(sorted[i].date)}</text>)}
  </svg>;
}

export function CalorieChart({ entries, target }: { entries: FoodDay[]; target?: number }) {
  const dates = recentDates(14);
  const days = dates.map(date => ({ date, entry: entries.find(e => e.date === date) }));
  const max = Math.ceil(Math.max(target ?? 0, ...days.map(day => day.entry?.kcal ?? 0), 1000) * 1.2 / 500) * 500;
  const y = (value: number) => h - bottom - value / max * (h - top - bottom);
  const slot = (w - left - right) / 14;
  return <svg className="chart calorie-chart" viewBox={`0 0 ${w} ${h}`} role="img" aria-label={`Daily calories over the last fourteen days.${target ? ` Current target ${Math.round(target)} kilocalories.` : ''} Values are listed in the history below.`}>
    {[0, 1, 2, 3].map(i => { const value = max * i / 3; return <g key={i}><line x1={left} x2={w - right} y1={y(value)} y2={y(value)} stroke="var(--border)" strokeDasharray="3 4" /><text x={left - 10} y={y(value) + 3} textAnchor="end">{Math.round(value).toLocaleString()}</text></g>; })}
    {days.map(({ date, entry }, i) => <g key={date}>
      {entry ? <rect x={left + i * slot + slot * .2} y={y(entry.kcal)} width={slot * .6} height={Math.max(2, h - bottom - y(entry.kcal))} rx="3" fill={target && entry.kcal > target ? 'var(--bar-muted)' : 'var(--bar)'}><title>{formatDate(date, true)}: {entry.kcal} kcal{target ? ` (${Math.round(entry.kcal - target)} vs current target)` : ''}</title></rect> : <circle cx={left + (i + .5) * slot} cy={h - bottom - 2} r="2" fill="var(--border)"><title>{formatDate(date)}: no entry</title></circle>}
      {(i % 3 === 0 || i === 13) && <text x={left + (i + .5) * slot} y={h - 6} textAnchor={i === 13 ? 'end' : i === 0 ? 'start' : 'middle'}>{formatDate(date)}</text>}
    </g>)}
    {target && <line x1={left} x2={w - right} y1={y(target)} y2={y(target)} stroke="var(--accent)" strokeWidth="1.3" strokeDasharray="5 4" />}
  </svg>;
}
