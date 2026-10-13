import { useId, type InputHTMLAttributes, type ReactNode } from 'react';

export function Field({ label, unit, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string; unit?: string }) {
  const generatedId = useId();
  const id = props.id ?? generatedId;
  return <div className="field"><label htmlFor={id}>{label}</label><div className="input-wrap"><input {...props} id={id} aria-describedby={unit ? `${id}-unit` : props['aria-describedby']} />{unit && <span id={`${id}-unit`} className="input-unit">{unit}</span>}</div></div>;
}
export function SelectField({ label, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string; children: ReactNode }) {
  return <label className="field"><span>{label}</span><select {...props}>{children}</select></label>;
}
export function Notice({ children, error = false }: { children: ReactNode; error?: boolean }) {
  return <p className={error ? 'notice error' : 'notice'} role={error ? 'alert' : 'status'}>{children}</p>;
}
