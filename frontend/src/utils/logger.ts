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
  // Add more patterns to filter as needed
];

// Application environment
const isDev = process.env.NODE_ENV === 'development';

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
    }
  };
  
  // Similar overrides for other methods if desired
}
