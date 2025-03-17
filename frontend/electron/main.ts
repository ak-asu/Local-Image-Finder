import { app, BrowserWindow, shell, ipcMain } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'

// Get __dirname in ES module scope
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Define environment paths
process.env.APP_ROOT = path.join(__dirname, '..')
process.env.DIST = path.join(process.env.APP_ROOT, 'dist')
process.env.VITE_PUBLIC = process.env.VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'public')
  : process.env.DIST

// Disable security warnings in console
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true'

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']

let win: BrowserWindow | null

function createWindow() {
  // Calculate the preload path
  const preloadPath = path.join(__dirname, 'preload.mjs')
  console.log('Preload path:', preloadPath)
  
  // Check if preload script exists
  if (!fs.existsSync(preloadPath)) {
    console.error(`ERROR: Preload script not found at ${preloadPath}`)
  } else {
    console.log('Preload script found at:', preloadPath)
  }
  
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false, // needed for preload script
      webSecurity: true
    },
    show: false, // Don't show the window until it's ready
    backgroundColor: '#f8f9fa', // Match background color to prevent white flash
  })

  // Debug
  console.log('VITE_DEV_SERVER_URL:', VITE_DEV_SERVER_URL)
  console.log('process.env.DIST:', process.env.DIST)
  console.log('preload path:', preloadPath)

  // Open external links in browser
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Show window when ready to prevent white flash
  win.once('ready-to-show', () => {
    win?.show()
  })

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  // Check for errors in preload script
  win.webContents.on('preload-error', (event, preloadPath, error) => {
    console.error(`Preload script error in ${preloadPath}:`, error)
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
    // Open DevTools in development mode with reduced console noise
    win.webContents.openDevTools()
    
    // Filter out the "Request Autofill.enable failed" errors in the console
    win.webContents.on('console-message', (event, level, message) => {
      if (message.includes('Autofill.enable') || message.includes('Request Autofill')) {
        event.preventDefault()
      }
    })
  } else {
    // Load the local file
    if (process.env.DIST) {
      win.loadFile(path.join(process.env.DIST, 'index.html'))
    } else {
      console.error('Error: DIST path is undefined')
      app.quit()
    }
  }

  // Debug errors
  win.webContents.on('did-fail-load', (_, errorCode, errorDescription) => {
    console.error('Failed to load:', errorCode, errorDescription)
  })
}

// Handle file operations
ipcMain.handle('open-file', async (_event, filePath) => {
  return shell.openPath(filePath)
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

// This method will be called when Electron has finished initialization
app.whenReady()
  .then(() => {
    createWindow()
    // Additional startup actions can go here
  })
  .catch(error => {
    console.error('Failed to initialize app:', error)
  })
