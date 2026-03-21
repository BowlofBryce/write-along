import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '@/app/App';
import '@/styles/index.css';

window.addEventListener('error', (event) => {
  window.desktopAPI.logRenderer({
    level: 'error',
    message: 'Unhandled renderer error',
    details: {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      stack: event.error?.stack,
    },
  });
});

window.addEventListener('unhandledrejection', (event) => {
  window.desktopAPI.logRenderer({
    level: 'error',
    message: 'Unhandled renderer promise rejection',
    details: {
      reason: String(event.reason),
    },
  });
});

window.desktopAPI
  .getLogFilePath()
  .then((logFilePath) => {
    window.desktopAPI.logRenderer({
      level: 'log',
      message: 'Renderer booted',
      details: { logFilePath },
    });
  })
  .catch(() => {
    // noop
  });

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
