/**
 * Browser API initializer.
 *
 * When the app is running in a browser (not Electron), this module installs
 * the browser shims on `window.api` and `window.system`, and seeds the
 * IndexedDB database on first visit.
 *
 * Call `initBrowserApi()` once, early in the Next.js app lifecycle
 * (e.g. in _app.jsx) before any `window.api.*` calls are made.
 */

import browserApi from './browser-api';
import browserSystem from './browser-system';
import { seedIfNeeded } from './db/index';

let _initialized = false;

export async function initBrowserApi() {
  if (_initialized) return;
  if (typeof window === 'undefined') return; // SSR guard
  _initialized = true;

  window.api = browserApi;
  window.system = browserSystem;

  // Seed IndexedDB with system data on first visit
  await seedIfNeeded();
}

/**
 * Returns true when running inside an Electron renderer process.
 * The Electron preload script exposes window.api via contextBridge.
 */
export function isElectron() {
  if (typeof window === 'undefined') return false;
  // Electron preload sets window.api before the page loads
  return !!(window.process?.type === 'renderer' || window.__IS_ELECTRON__);
}

/**
 * Returns true if EULA has been accepted (browser-only check).
 */
export function isBrowserEulaAccepted() {
  if (typeof localStorage === 'undefined') return true;
  return localStorage.getItem('eula_accepted') === 'true';
}
