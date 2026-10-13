import type { InputHTMLAttributes, ReactNode } from 'react';

export function Field({ label, unit, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string; unit?: string }) {
  return <label className="field"><span>{label}</span><div className="input-wrap"><input {...props} />{unit && <span className="input-unit">{unit}</span>}</div></label>;
}
export function SelectField({ label, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string; children: ReactNode }) {
  return <label className="field"><span>{label}</span><select {...props}>{children}</select></label>;
}
export function Notice({ children, error = false }: { children: ReactNode; error?: boolean }) {
  return <p className={error ? 'notice error' : 'notice'} role={error ? 'alert' : 'status'}>{children}</p>;
}
