/// <reference types="vite-plugin-electron/electron-env" />

declare namespace NodeJS {
  interface ProcessEnv {
    /**
     * The built directory structure
     */
    APP_ROOT: string
    DIST: string
    /** /dist/ or /public/ */
    VITE_PUBLIC: string
  }
}

// Used in Renderer process, exposed in preload scripts
interface Window {
  electron: {
    ipcRenderer: {
      send: (channel: string, ...args: any[]) => void;
      invoke: (channel: string, ...args: any[]) => Promise<any>;
      on: (channel: string, callback: (...args: any[]) => void) => (() => void);
      once: (channel: string, callback: (...args: any[]) => void) => void;
      removeListener?: (channel: string, listener: (...args: any[]) => void) => void;
    };
    openFile: (filePath: string) => Promise<string>;
    showItemInFolder: (filePath: string) => void;
    platform: string;
    getAppVersion?: () => Promise<string>;
  }
  
  // Alias for compatibility with different naming conventions
  electronAPI: typeof Window.prototype.electron;
  
  // Flag to determine if running in Electron
  isElectronApp: boolean;
}
