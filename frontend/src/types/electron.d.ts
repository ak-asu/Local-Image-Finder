/**
 * This file is referenced in preload-env.d.ts, providing IntelliSense for the Electron APIs
 * exposed through the contextBridge to the renderer process.
 */

interface ElectronAPI {
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
  getAppVersion: () => Promise<string>;
}

interface Window {
  electron: ElectronAPI;
  electronAPI: ElectronAPI;
  isElectronApp: boolean;
}
