import { isDevelopmentEnvironment } from "./constants";

/**
 * Development-only logger that suppresses all logging in production.
 */
export const logger = {
  log: (...args: unknown[]) => {
    if (isDevelopmentEnvironment) {
      console.log(...args);
    }
  },
  error: (...args: unknown[]) => {
    if (isDevelopmentEnvironment) {
      console.error(...args);
    }
  },
  warn: (...args: unknown[]) => {
    if (isDevelopmentEnvironment) {
      console.warn(...args);
    }
  },
  info: (...args: unknown[]) => {
    if (isDevelopmentEnvironment) {
      console.info(...args);
    }
  },
};
