import { contextBridge, ipcRenderer, shell } from 'electron'
import process from 'node:process'

// Log preload initialization
console.log('Preload script initializing...')

// Common error messages to filter
const ignoredErrorMessages = [
  'Autofill.enable',
  'Request Autofill',
  '[Deprecation]'
]

// Custom error handler
const handleError = (error) => {
  // Filter out known harmless errors
  if (error && error.message && !ignoredErrorMessages.some(msg => error.message.includes(msg))) {
    console.error('Preload script error:', error)
  }
}

try {
  // Create the API object that will be exposed to the renderer
  const electronAPI = {
    ipcRenderer: {
      send: (channel, ...args) => {
        try {
          ipcRenderer.send(channel, ...args)
        } catch (error) {
          handleError(error)
        }
      },
      invoke: (channel, ...args) => {
        try {
          return ipcRenderer.invoke(channel, ...args)
        } catch (error) {
          handleError(error)
          return Promise.reject(error)
        }
      },
      on: (channel, func) => {
        try {
          const subscription = (_event, ...args) => {
            try {
              func(...args)
            } catch (error) {
              handleError(error)
            }
          }
          ipcRenderer.on(channel, subscription)
          return () => {
            ipcRenderer.removeListener(channel, subscription)
          }
        } catch (error) {
          handleError(error)
          return () => {}
        }
      },
      once: (channel, func) => {
        try {
          ipcRenderer.once(channel, (_event, ...args) => {
            try {
              func(...args)
            } catch (error) {
              handleError(error)
            }
          })
        } catch (error) {
          handleError(error)
        }
      }
    },
    openFile: (filePath) => {
      try {
        return shell.openPath(filePath)
      } catch (error) {
        handleError(error)
        return Promise.reject(error)
      }
    },
    showItemInFolder: (filePath) => {
      try {
        return shell.showItemInFolder(filePath)
      } catch (error) {
        handleError(error)
        return Promise.reject(error)
      }
    },
    platform: process.platform,
    getAppVersion: () => ipcRenderer.invoke('get-app-version')
  }

  // Expose as both electron and electronAPI for compatibility
  contextBridge.exposeInMainWorld('electron', electronAPI)
  contextBridge.exposeInMainWorld('electronAPI', electronAPI)
  console.log('Electron APIs exposed to renderer process')
} catch (error) {
  handleError(error)
}

// Add a listener for main process messages
window.addEventListener('DOMContentLoaded', () => {
  console.log('DOM content loaded in preload script')
  
  const replaceText = (selector, text) => {
    try {
      const element = document.getElementById(selector)
      if (element) element.innerText = text
    } catch (error) {
      handleError(error)
    }
  }

  try {
    for (const dependency of ['chrome', 'node', 'electron']) {
      replaceText(`${dependency}-version`, process.versions[dependency] || 'N/A')
    }
  } catch (error) {
    handleError(error)
  }
  
  console.log('Preload script loaded successfully')
})

// Override console methods to filter out noise
const originalConsole = {
  error: console.error,
  warn: console.warn,
  log: console.log
}

console.error = (message, ...args) => {
  if (typeof message === 'string' && 
      ignoredErrorMessages.some(pattern => message.includes(pattern))) {
    return
  }
  originalConsole.error(message, ...args)
}

console.warn = (message, ...args) => {
  if (typeof message === 'string' && 
      ignoredErrorMessages.some(pattern => message.includes(pattern))) {
    return
  }
  originalConsole.warn(message, ...args)
}

console.log = (message, ...args) => {
  if (typeof message === 'string' && 
      ignoredErrorMessages.some(pattern => message.includes(pattern))) {
    return
  }
  originalConsole.log(message, ...args)
}
