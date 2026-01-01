
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './components/App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register Service Worker for Offline PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Check if we are in a secure context or localhost before registering
    const isLocalhost = Boolean(
      window.location.hostname === 'localhost' ||
      window.location.hostname === '[::1]' ||
      window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/)
    );

    if (isLocalhost || window.location.protocol === 'https:') {
        navigator.serviceWorker.register('./service-worker.js')
        .then(registration => {
            console.log('SW registered');
        })
        .catch(registrationError => {
            // Suppress error logs in preview environments where origins might mismatch iframe content
            console.debug('SW registration skipped or failed:', registrationError.message);
        });
    }
  });
}
