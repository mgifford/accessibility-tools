/**
 * Browser-side window.system shim.
 *
 * Mirrors the `system` object exposed by the Electron preload's contextBridge
 * but uses browser-native equivalents.
 */

const system = {
  platform: (typeof navigator !== 'undefined' && navigator.userAgent.includes('Mac')) ? 'darwin' : 'linux',

  exit: async () => {
    // No-op in browser — cannot close a tab programmatically
    console.warn('system.exit: not supported in browser');
  },

  acceptEula: async () => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('eula_accepted', 'true');
    }
    // Reload to trigger re-check
    if (typeof window !== 'undefined') window.location.reload();
  },

  getAssetsPath: async () => {
    // In static export, assets are relative to the root
    return '';
  },

  getWebviewPreloadPath: () => '',

  log: {
    info: message => console.info('[app]', message),
    error: message => console.error('[app]', message),
    rejection: message => console.error('[app:rejection]', message)
  },

  showError: (message, opt = {}) => {
    // Browser fallback: use alert
    if (typeof window !== 'undefined') {
      window.alert(`${opt.title ? opt.title + ': ' : ''}${message}`);
    }
  }
};

export default system;
