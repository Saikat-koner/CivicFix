import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { AppSafeBoundary } from './components/AppSafeBoundary';
import { registerServiceWorker } from './serviceWorkerRegistration';
import 'leaflet/dist/leaflet.css';
import './index.css';

// Register PWA service worker for offline caching & mobile install
registerServiceWorker();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppSafeBoundary>
      <App />
    </AppSafeBoundary>
  </StrictMode>,
);


