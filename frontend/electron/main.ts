import { app, BrowserWindow, shell, ipcMain, dialog } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'
import { spawn } from 'node:child_process'

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

// Define app variables
let win: BrowserWindow | null
let backendProcess = null
const isDev = process.env.NODE_ENV === 'development' || !!VITE_DEV_SERVER_URL
const logStream = fs.createWriteStream(
  path.join(app.getPath('userData'), 'app.log'), 
  { flags: 'a' }
)

// Set up logging utility
const log = {
  info: (message: string) => {
    const logMessage = `[INFO][${new Date().toISOString()}] ${message}\n`
    console.log(logMessage.trim())
    logStream.write(logMessage)
  },
  error: (message: string, error?: any) => {
    let logMessage = `[ERROR][${new Date().toISOString()}] ${message}\n`
    if (error) {
      if (error instanceof Error) {
        logMessage += `${error.stack || error.message}\n`
      } else {
        logMessage += `${String(error)}\n`
      }
    }
    console.error(logMessage.trim())
    logStream.write(logMessage)
  },
  warn: (message: string) => {
    const logMessage = `[WARN][${new Date().toISOString()}] ${message}\n`
    console.warn(logMessage.trim())
    logStream.write(logMessage)
  },
  debug: (message: string) => {
    if (isDev) {
      const logMessage = `[DEBUG][${new Date().toISOString()}] ${message}\n`
      console.debug(logMessage.trim())
      logStream.write(logMessage)
    }
  }
}

// Create and filter message patterns we want to ignore
const ignoredMessagePatterns = [
  'Autofill.enable',
  'Request Autofill',
  '[Deprecation]'
]

// Setup a function to filter console messages
const shouldLogMessage = (message: string): boolean => {
  return !ignoredMessagePatterns.some(pattern => message.includes(pattern))
}

function createWindow() {
  // Calculate the preload path
  const preloadPath = path.join(__dirname, 'preload.mjs')
  log.info(`Starting app with preload path: ${preloadPath}`)
  
  // Check if preload script exists
  if (!fs.existsSync(preloadPath)) {
    log.error(`ERROR: Preload script not found at ${preloadPath}`)
  } else {
    log.info(`Preload script found at: ${preloadPath}`)
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
  log.debug(`VITE_DEV_SERVER_URL: ${VITE_DEV_SERVER_URL || 'Not defined'}`)
  log.debug(`process.env.DIST: ${process.env.DIST || 'Not defined'}`)
  log.debug(`preload path: ${preloadPath}`)

  // Open external links in browser
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Filter console messages based on patterns
  win.webContents.on('console-message', (event, level, message) => {
    if (!shouldLogMessage(message)) {
      event.preventDefault()
      return
    }
    
    // Log to our file based on level
    switch (level) {
      case 0: // log
        log.debug(`[Renderer] ${message}`)
        break
      case 1: // warn
        log.warn(`[Renderer] ${message}`)
        break
      case 2: // error
        log.error(`[Renderer] ${message}`)
        break
      case 3: // debug
        log.debug(`[Renderer] ${message}`)
        break
      default:
        log.info(`[Renderer] ${message}`)
    }
  })

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
    log.error(`Preload script error in ${preloadPath}:`, error)
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
    // Open DevTools in development mode with reduced console noise
    win.webContents.openDevTools()
  } else {
    // Load the local file
    if (process.env.DIST) {
      win.loadFile(path.join(process.env.DIST, 'index.html'))
    } else {
      log.error('Error: DIST path is undefined')
      app.quit()
    }
  }

  // Debug errors
  win.webContents.on('did-fail-load', (_, errorCode, errorDescription) => {
    log.error(`Failed to load: ${errorCode} - ${errorDescription}`)
  })

  // Handle uncaught exceptions in the renderer
  win.webContents.on('render-process-gone', (event, details) => {
    log.error(`Renderer process gone: ${details.reason}`, details)
    
    if (details.reason !== 'clean-exit') {
      dialog.showErrorBox(
        'Application Error',
        `The renderer process has crashed: ${details.reason}\n\nThe application will now restart.`
      )
      
      app.relaunch()
      app.exit(0)
    }
  })

  return win
}

// Start the FastAPI backend process
function startBackendProcess() {
  try {
    const backendPath = path.join(process.env.APP_ROOT, '..', 'backend')
    log.info(`Starting backend process from: ${backendPath}`)
    
    // Check if we're in production or development
    const pythonCmd = process.platform === 'win32' ? 'python' : 'python3'
    
    backendProcess = spawn(pythonCmd, ['-m', 'uvicorn', 'main:app', '--host', '127.0.0.1', '--port', '8000'], {
      cwd: backendPath,
      stdio: 'pipe',
      windowsHide: true
    })
    
    if (backendProcess.pid) {
      log.info(`Backend process started with PID: ${backendProcess.pid}`)
    } else {
      log.error('Failed to start backend process')
    }
    
    backendProcess.stdout.on('data', (data) => {
      log.info(`[Backend] ${data.toString().trim()}`)
    })
    
    backendProcess.stderr.on('data', (data) => {
      // Python logs startup info to stderr
      const output = data.toString().trim()
      if (output.includes('Uvicorn running on')) {
        log.info(`[Backend] ${output}`)
      } else {
        log.error(`[Backend] ${output}`)
      }
    })
    
    backendProcess.on('error', (err) => {
      log.error(`Backend process error: ${err.message}`, err)
    })
    
    backendProcess.on('close', (code) => {
      log.info(`Backend process exited with code ${code}`)
      backendProcess = null
      
      if (code !== 0 && !app.isQuitting) {
        log.warn('Backend crashed, restarting...')
        setTimeout(startBackendProcess, 1000) // Restart after a delay
      }
    })
    
    // Make sure the backend process is killed when the app exits
    app.on('quit', () => {
      if (backendProcess) {
        log.info('Terminating backend process')
        if (process.platform === 'win32') {
          // Windows requires a different approach to kill processes
          spawn('taskkill', ['/pid', backendProcess.pid, '/f', '/t'])
        } else {
          backendProcess.kill('SIGTERM')
        }
      }
    })
    
  } catch (err) {
    log.error('Failed to start backend process:', err)
    dialog.showErrorBox(
      'Backend Error',
      `Failed to start the backend service: ${err.message}`
    )
  }
}

// Handle file operations
ipcMain.handle('open-file', async (_event, filePath) => {
  log.debug(`Opening file: ${filePath}`)
  return shell.openPath(filePath)
})

// Get app version
ipcMain.handle('get-app-version', () => {
  return app.getVersion()
})

// Handle log messages from the renderer
ipcMain.on('log-message', (_event, data) => {
  const { level, message, timestamp } = data
  switch (level) {
    case 'error':
      log.error(`[Renderer] ${message}`)
      break
    case 'warn':
      log.warn(`[Renderer] ${message}`)
      break
    case 'info':
      log.info(`[Renderer] ${message}`)
      break
    case 'debug':
      log.debug(`[Renderer] ${message}`)
      break
    default:
      log.info(`[Renderer] ${message}`)
  }
})

// Handle renderer requests to show a file in folder
ipcMain.handle('show-item-in-folder', (_event, filePath) => {
  log.debug(`Showing item in folder: ${filePath}`)
  return shell.showItemInFolder(filePath)
})

// Set app properties
app.name = 'Local Image Finder'

// App lifecycle hooks
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    // Set a flag to indicate intentional quit
    app.isQuitting = true
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  // On macOS re-create a window when dock icon is clicked if no windows exist
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

// Handle uncaught exceptions in the main process
process.on('uncaughtException', (error) => {
  log.error('Uncaught exception in main process:', error)
  
  // Only show dialog if there's a window and if it's a serious error
  if (win && shouldLogMessage(error.message)) {
    dialog.showErrorBox(
      'Application Error',
      `An unexpected error occurred: ${error.message}`
    )
  }
})

// This method will be called when Electron has finished initialization
app.whenReady()
  .then(() => {
    log.info('App is ready, setting up...')
    
    // Start the backend process first
    startBackendProcess()
    
    // Create the main window
    createWindow()
    
    log.info('Application started successfully')
    
    // Additional startup actions can go here
  })
  .catch(error => {
    log.error('Failed to initialize app:', error)
    
    dialog.showErrorBox(
      'Startup Error',
      `Failed to start application: ${error.message}`
    )
  })
