/**
 * Development utilities for logging
 * Only logs in development environment to prevent console spam in production
 */

const isDev = process.env.NODE_ENV === 'development'

export const devLog = {
  log: (...args: unknown[]) => {
    if (isDev) {
      console.log(...args)
    }
  },
  
  error: (...args: unknown[]) => {
    if (isDev) {
      console.error(...args)
    }
  },
  
  warn: (...args: unknown[]) => {
    if (isDev) {
      console.warn(...args)
    }
  },
  
  debug: (...args: unknown[]) => {
    if (isDev) {
      console.log('[DEBUG]', ...args)
    }
  },
  
  info: (...args: unknown[]) => {
    if (isDev) {
      console.info('[INFO]', ...args)
    }
  }
}