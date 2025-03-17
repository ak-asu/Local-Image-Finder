interface ElectronAPI {
  ipcRenderer: {
    send: (channel: string, ...args: any[]) => void;
    invoke: (channel: string, ...args: any[]) => Promise<any>;
    on: (channel: string, callback: (...args: any[]) => void) => (() => void);
    once: (channel: string, callback: (...args: any[]) => void) => void;
  };
  openFile: (filePath: string) => Promise<string>;
  showItemInFolder: (filePath: string) => void;
  platform: string;
}

interface Window {
  electron: ElectronAPI;
}
