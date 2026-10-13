import { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

interface InstallPrompt extends Event { prompt(): Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> }

export function PwaStatus() {
  const { needRefresh: [needRefresh, setNeedRefresh], offlineReady: [offlineReady, setOfflineReady], updateServiceWorker } = useRegisterSW();
  const [install, setInstall] = useState<InstallPrompt | null>(null);
  useEffect(() => {
    const prompt = (event: Event) => { event.preventDefault(); setInstall(event as InstallPrompt); };
    const installed = () => setInstall(null);
    window.addEventListener('beforeinstallprompt', prompt); window.addEventListener('appinstalled', installed);
    return () => { window.removeEventListener('beforeinstallprompt', prompt); window.removeEventListener('appinstalled', installed); };
  }, []);
  if (!needRefresh && !offlineReady && !install) return null;
  return <aside className="pwa-notice" aria-label="App availability">
    <p>{needRefresh ? 'An update is ready. Save your entries before reloading.' : install ? 'Keep Fit Log close. Install it on this device.' : 'Fit Log is ready to open offline.'}</p>
    <div>{needRefresh ? <button className="text-button" onClick={() => void updateServiceWorker(true)}>Reload app</button> : install ? <button className="text-button" onClick={async () => { await install.prompt(); await install.userChoice; setInstall(null); }}>Install</button> : null}<button className="text-button muted" onClick={() => { setNeedRefresh(false); setOfflineReady(false); setInstall(null); }}>Dismiss</button></div>
  </aside>;
}
