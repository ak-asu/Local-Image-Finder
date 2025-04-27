import { ipcRenderer, contextBridge, shell } from 'electron'

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('electronAPI', {
  // IPC communication
  on: (...args: Parameters<typeof ipcRenderer.on>) => {
    const [channel, listener] = args
    return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args))
  },
  off: (...args: Parameters<typeof ipcRenderer.off>) => {
    const [channel, ...omit] = args
    return ipcRenderer.off(channel, ...omit)
  },
  send: (...args: Parameters<typeof ipcRenderer.send>) => {
    const [channel, ...omit] = args
    return ipcRenderer.send(channel, ...omit)
  },
  invoke: (...args: Parameters<typeof ipcRenderer.invoke>) => {
    const [channel, ...omit] = args
    return ipcRenderer.invoke(channel, ...omit)
  },

  // Backend communication
  onBackendReady: (callback: (data: { port: number }) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, data: { port: number }) => callback(data)
    ipcRenderer.on('backend-ready', listener)
    return () => {
      ipcRenderer.removeListener('backend-ready', listener)
    }
  },

  // File operations
  openFile: (filePath: string) => ipcRenderer.invoke('open-file', filePath),
  showItemInFolder: (filePath: string) => ipcRenderer.invoke('show-item-in-folder', filePath),
  
  // App information
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  
  // System information
  getPlatform: () => process.platform,
  
  // Logging
  log: (level: string, message: string) => {
    ipcRenderer.send('log-message', { 
      level, 
      message, 
      timestamp: new Date().toISOString() 
    })
  },
  
  // Additional APIs as needed
})
