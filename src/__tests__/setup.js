// Global test setup

// Mock window.api for Electron IPC calls used in some stores
global.window = global.window || {};
global.window.api = {
  theme: {
    set: jest.fn()
  },
  environmentTest: {
    getStats: jest.fn().mockResolvedValue({ items: [], total: 0, updated: 0 })
  },
  environmentPage: {
    scanPage: jest.fn()
  },
  audit: {
    getStats: jest.fn().mockResolvedValue({ items: [], total: 0, updated: 0 })
  }
};
