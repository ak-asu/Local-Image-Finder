import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './store';
import App from './App';
import './index.css';

// Initialize theme
import { initializeTheme } from './store/slices/uiSlice';
store.dispatch(initializeTheme());

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>,
);

// Use contextBridge for Electron integration
window.ipcRenderer.on('main-process-message', (_event, message) => {
  console.log('IPC Message:', message);
});
