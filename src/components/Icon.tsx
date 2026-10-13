export function Icon({ name, size = 20 }: { name: 'body' | 'nutrition' | 'arrow' | 'plus' | 'check' | 'user' | 'logout'; size?: number }) {
  const paths = {
    body: <><path d="M4 5h16v15H4zM8 5V3h8v2M8 12h8M12 8v8" /></>,
    nutrition: <><path d="M7 3v7m-3-7v5a3 3 0 0 0 6 0V3M7 11v10m10 0V3c-4 3-4 10 0 10" /></>,
    arrow: <><path d="m5 8 6 6 8-8M5 8v6m0-6h6" /></>,
    plus: <path d="M12 5v14M5 12h14" />,
    check: <path d="m5 12 4 4L19 6" />,
    user: <><circle cx="12" cy="8" r="3.5" /><path d="M5 21v-3a7 7 0 0 1 14 0v3" /></>,
    logout: <><path d="M9 4H4v16h5m5-12 4 4-4 4m-5-4h9" /></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}
