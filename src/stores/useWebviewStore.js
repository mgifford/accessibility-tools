import { create } from 'zustand';

const initialState = {
  isDomReady: false,
  openDevTools: () => {},
  currentUrl: ''
};

export const useWebviewStore = create(set => ({
  ...initialState,
  setIsDomReady: isDomReady => set({ isDomReady }),
  setOpenDevTools: openDevTools => set({ openDevTools }),
  setCurrentUrl: currentUrl => set({ currentUrl }),
  reset: () => set(initialState)
}));
