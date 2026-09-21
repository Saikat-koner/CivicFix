// Service Worker Registration for CivicFix PWA

export function registerServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    if (import.meta.env.DEV) {
      // In development, unregister any stale service workers to prevent intercepting Vite modules
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister();
        }
      });
      return;
    }

    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          // Check for updates
          registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            if (!installingWorker) return;
            installingWorker.onstatechange = () => {
              if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('[PWA] New version available.');
                window.dispatchEvent(new CustomEvent('civicfix-sw-update-available'));
              }
            };
          };
        })
        .catch((error) => {
          console.log('[PWA] Service worker registration bypassed:', error?.message || error);
        });
    });
  }
}
