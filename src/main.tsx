import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { setWorkerUrl } from 'maplibre-gl';
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import App from './App.tsx';
import { AppSafeBoundary } from './components/AppSafeBoundary';
import { registerServiceWorker } from './serviceWorkerRegistration';
import 'maplibre-gl/dist/maplibre-gl.css';
import './index.css';

// Initialize MapLibre GL Web Worker URL for vector tiles & GeoJSON processing
if (typeof window !== 'undefined') {
  try {
    setWorkerUrl(maplibreWorkerUrl || '/maplibre-gl-worker.mjs');
  } catch (err) {
    console.warn('[MapLibre GL] Worker initialization notice:', err);
  }
}

// Register PWA service worker for offline caching & mobile install
registerServiceWorker();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppSafeBoundary>
      <App />
    </AppSafeBoundary>
  </StrictMode>,
);


