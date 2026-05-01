import './styles.css';
import { installIdleReset } from './idle';
import { mountShell } from './shell';

const root = document.getElementById('app');
if (!root) {
  throw new Error('#app root not found');
}

mountShell(root);
installIdleReset(root);

// Service worker registration is wired by vite-plugin-pwa at build time.
// Use registerType: 'autoUpdate' from vite.config.ts; we manually register
// only in a production build to avoid dev-server churn.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  void import('virtual:pwa-register').then(({ registerSW }) => {
    registerSW({ immediate: true });
  });
}
