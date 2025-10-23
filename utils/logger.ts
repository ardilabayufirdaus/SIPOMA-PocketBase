/**
 * Logger utility to standardize and control logging behavior across the app
 * Allows easy toggling of logs in different environments
 */

// Enable/disable logging based on environment
const isLogEnabled = import.meta.env.DEV || import.meta.env.VITE_ENABLE_LOGS === 'true';

// Log levels
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// Logger configuration
const config = {
  debug: false, // Disabled debug logs
  info: isLogEnabled,
  warn: true, // Always enable warnings
  error: true, // Always enable errors
};

// Base logger function
const log = (level: LogLevel, ...args: unknown[]) => {
  if (!config[level]) return;

  // Use WITA timezone (Asia/Makassar) with 24-hour format
  const timestamp = new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Makassar',
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date());
  const prefix = `[${timestamp}][${level.toUpperCase()}]`;

  switch (level) {
    case 'debug':
      console.debug(prefix, ...args);
      break;
    case 'info':
      console.info(prefix, ...args);
      break;
    case 'warn':
      console.warn(prefix, ...args);
      break;
    case 'error':
      console.error(prefix, ...args);
      break;
  }
};

// Export individual logging functions
export const logger = {
  debug: (...args: unknown[]) => log('debug', ...args),
  info: (...args: unknown[]) => log('info', ...args),
  warn: (...args: unknown[]) => log('warn', ...args),
  error: (...args: unknown[]) => log('error', ...args),
};

// Allow enabling/disabling logs at runtime
export const enableLogs = () => {
  config.debug = true;
  config.info = true;
};

export const disableLogs = () => {
  config.debug = false;
  config.info = false;
};

