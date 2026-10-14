import { useEffect, useState } from 'react';

interface InstallEvent extends Event { prompt(): Promise<void>; userChoice: Promise<{ outcome: string }> }

/** 安装与离线状态独立于配方；缓存完成后才宣告可离线使用。 */
export function usePwa() {
  const [online, setOnline] = useState(navigator.onLine);
  const [offlineReady, setOfflineReady] = useState(false);
  const [installEvent, setInstallEvent] = useState<InstallEvent | null>(null);
  const [updateReady, setUpdateReady] = useState(false);
  const [installed, setInstalled] = useState(matchMedia('(display-mode: standalone)').matches);
  const [connectionNotice, setConnectionNotice] = useState('');
  useEffect(() => {
    const connection = () => { setOnline(navigator.onLine); setConnectionNotice(navigator.onLine ? '网络已恢复，灵感继续陪你。' : ''); };
    const offer = (event: Event) => { event.preventDefault(); setInstallEvent(event as InstallEvent); };
    const installedHandler = () => { setInstalled(true); setInstallEvent(null); };
    addEventListener('online', connection); addEventListener('offline', connection);
    addEventListener('beforeinstallprompt', offer); addEventListener('appinstalled', installedHandler);
    if ('serviceWorker' in navigator && import.meta.env.PROD) {
      navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, { scope: import.meta.env.BASE_URL }).then(registration => {
        if (registration.active) setOfflineReady(true);
        if (registration.waiting) setUpdateReady(true);
        registration.addEventListener('updatefound', () => {
          const worker = registration.installing;
          worker?.addEventListener('statechange', () => {
            if (worker.state === 'installed') { setOfflineReady(true); if (navigator.serviceWorker.controller) setUpdateReady(true); }
          });
        });
      }).catch(() => setOfflineReady(false));
    }
    return () => {
      removeEventListener('online', connection); removeEventListener('offline', connection);
      removeEventListener('beforeinstallprompt', offer); removeEventListener('appinstalled', installedHandler);
    };
  }, []);
  async function install() {
    if (!installEvent) return;
    await installEvent.prompt();
    await installEvent.userChoice;
    setInstallEvent(null);
  }
  return { online, offlineReady, install, canInstall: !!installEvent, installed, updateReady, connectionNotice };
}
