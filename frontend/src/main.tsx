import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './store';
import App from './App';
import './index.css';
import { initializeTheme } from './store/slices/uiSlice';
import { logger } from './utils/logger';

// Error handling for debugging
const handleError = (error: Error) => {
  logger.error('Application Error:', error);
  // If you want to show an error UI, you could render an error component here
  const rootElement = document.getElementById('root');
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="padding: 20px; text-align: center;">
        <h1>Something went wrong</h1>
        <p>${error.message}</p>
        <pre style="background: #f0f0f0; padding: 10px; text-align: left; overflow: auto;">${error.stack}</pre>
      </div>
    `;
  }
};

// Check if we're in an Electron environment and set up a flag
const isElectron = window.navigator.userAgent.toLowerCase().includes(' electron/');
window.isElectronApp = isElectron;

logger.info(`Running in ${isElectron ? 'Electron' : 'Browser'} environment`);

// Only try to use electron APIs if we're in Electron
if (isElectron) {
  logger.info('Setting up Electron environment...');
  // Polyfill window.electron if not available (this helps with development in browser)
  if (!window.electron) {
    logger.warn('window.electron not found, creating mock implementation');
    window.electron = {
      ipcRenderer: {
        send: (...args) => logger.debug('Mock ipcRenderer.send:', ...args),
        invoke: async (...args) => {
          logger.debug('Mock ipcRenderer.invoke:', ...args);
          return null;
        },
        on: (channel, callback) => {
          logger.debug(`Mock ipcRenderer.on for channel: ${channel}`);
          return () => {}; // Mock cleanup function
        },
        once: (channel, callback) => {
          logger.debug(`Mock ipcRenderer.once for channel: ${channel}`);
        }
      },
      openFile: async (path) => {
        logger.debug('Mock openFile:', path);
        return '';
      },
      showItemInFolder: (path) => logger.debug('Mock showItemInFolder:', path),
      platform: 'browser'
    };
  }
}

// Initialize theme
store.dispatch(initializeTheme());

try {
  // Check if root element exists
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error('Root element not found. Check if your index.html contains an element with id "root"');
  }

  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <Provider store={store}>
        <App />
      </Provider>
    </React.StrictMode>,
  );

  logger.info('React app rendered successfully');
} catch (error) {
  handleError(error as Error);
}

// Add global error handler
window.addEventListener('error', (event) => {
  // Filter out the Autofill.enable errors
  if (!event.error || 
      (event.error.message && 
       !event.error.message.includes('Autofill.enable') && 
       !event.error.message.includes('Request Autofill'))) {
    logger.error('Global error caught:', event.error);
  }
});

window.addEventListener('unhandledrejection', (event) => {
  // Filter out certain promise rejection errors
  const errorMsg = event.reason?.message || String(event.reason);
  if (!errorMsg.includes('Autofill.enable') && !errorMsg.includes('Request Autofill')) {
    logger.error('Unhandled promise rejection:', event.reason);
  }
});
