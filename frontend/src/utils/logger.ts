/**
 * Application logging utility
 * 
 * Provides centralized logging with filtering capabilities
 */

// List of message patterns to filter out from logs
const FILTERED_PATTERNS = [
  'Request Autofill.enable failed',
  'Autofill.enable',
  '[Deprecation]',
  'Request Autofill',
  '"Autofill.enable" wasn\'t found',
  // Add more patterns to filter as needed
];

// Application environment
const isDev = process.env.NODE_ENV === 'development';
const isElectron = typeof window !== 'undefined' && window.isElectronApp === true;

/**
 * Enhanced console logger with filtering capabilities
 */
class Logger {
  /**
   * Log an informational message
   * @param message - Message or object to log
   * @param ...args - Additional arguments
   */
  info(message: any, ...args: any[]): void {
    if (this.shouldLog(message)) {
      console.info(`[INFO] ${message}`, ...args);
      
      // Forward to Electron main process if in Electron environment
      this.forwardToMain('info', message, args);
    }
  }

  /**
   * Log a debug message (only in development)
   * @param message - Message or object to log
   * @param ...args - Additional arguments
   */
  debug(message: any, ...args: any[]): void {
    if (isDev && this.shouldLog(message)) {
      console.debug(`[DEBUG] ${message}`, ...args);
      
      // Forward to Electron main process if in Electron environment
      this.forwardToMain('debug', message, args);
    }
  }

  /**
   * Log a warning message
   * @param message - Message or object to log
   * @param ...args - Additional arguments 
   */
  warn(message: any, ...args: any[]): void {
    if (this.shouldLog(message)) {
      console.warn(`[WARN] ${message}`, ...args);
      
      // Forward to Electron main process if in Electron environment
      this.forwardToMain('warn', message, args);
    }
  }

  /**
   * Log an error message
   * @param message - Message or object to log
   * @param ...args - Additional arguments
   */
  error(message: any, ...args: any[]): void {
    if (this.shouldLog(message)) {
      console.error(`[ERROR] ${message}`, ...args);
      
      // Forward to Electron main process if in Electron environment
      this.forwardToMain('error', message, args);
    }
  }

  /**
   * Check if a message should be logged or filtered
   * @param message - Message to check
   * @returns boolean indicating whether to log
   */
  private shouldLog(message: any): boolean {
    if (typeof message !== 'string') return true;
    
    return !FILTERED_PATTERNS.some(pattern => 
      message.includes(pattern)
    );
  }
  
  /**
   * Forward log messages to Electron main process if in Electron environment
   * @param level - Log level
   * @param message - Message to log
   * @param args - Additional arguments
   */
  private forwardToMain(level: string, message: any, args: any[]): void {
    if (isElectron && window.electron?.ipcRenderer) {
      try {
        // Only forward string messages or serialize objects
        const serializedMessage = typeof message === 'string' 
          ? message 
          : JSON.stringify(message);
          
        // Simplify args for IPC transmission
        const serializedArgs = args.map(arg => {
          if (arg instanceof Error) {
            return { message: arg.message, stack: arg.stack };
          }
          try {
            return typeof arg === 'object' ? JSON.stringify(arg) : arg;
          } catch (e) {
            return String(arg);
          }
        });
        
        window.electron.ipcRenderer.send('log-message', {
          level,
          message: serializedMessage,
          args: serializedArgs,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        // Don't use the logger here to avoid potential infinite loops
        if (isDev) {
          console.error('Failed to forward log to main process:', error);
        }
      }
    }
  }
}

// Export singleton instance
export const logger = new Logger();

// Override console methods in development to use our logger
if (isDev) {
  // Store original methods
  const originalConsole = {
    log: console.log,
    info: console.info,
    warn: console.warn,
    error: console.error,
    debug: console.debug
  };

  // Override console methods to use our filtering
  console.log = (message?: any, ...args: any[]) => {
    if (typeof message === 'string' && !FILTERED_PATTERNS.some(pattern => message.includes(pattern))) {
      originalConsole.log(message, ...args);
    } else if (typeof message !== 'string') {
      originalConsole.log(message, ...args);
    }
  };
  
  // Similar overrides for other methods
  console.error = (message?: any, ...args: any[]) => {
    if (typeof message === 'string' && !FILTERED_PATTERNS.some(pattern => message.includes(pattern))) {
      originalConsole.error(message, ...args);
    } else if (typeof message !== 'string') {
      originalConsole.error(message, ...args);
    }
  };
  
  console.warn = (message?: any, ...args: any[]) => {
    if (typeof message === 'string' && !FILTERED_PATTERNS.some(pattern => message.includes(pattern))) {
      originalConsole.warn(message, ...args);
    } else if (typeof message !== 'string') {
      originalConsole.warn(message, ...args);
    }
  };

  console.info = (message?: any, ...args: any[]) => {
    if (typeof message === 'string' && !FILTERED_PATTERNS.some(pattern => message.includes(pattern))) {
      originalConsole.info(message, ...args);
    } else if (typeof message !== 'string') {
      originalConsole.info(message, ...args);
    }
  };
  
  console.debug = (message?: any, ...args: any[]) => {
    if (typeof message === 'string' && !FILTERED_PATTERNS.some(pattern => message.includes(pattern))) {
      originalConsole.debug(message, ...args);
    } else if (typeof message !== 'string') {
      originalConsole.debug(message, ...args);
    }
  };
}
