import { create } from 'zustand';

const initialState = {
  project: null,
  selectedPage: {
    id: 'HOME',
    name: 'Home',
    path: '/'
  },
  tests: [],
  selectedTest: null,
  testStats: null,
  sitemap: [],
  pageRescanNonce: 0,
  testRescanNonce: 0,
  isPageLoading: false,
  isPageRescanLoading: false,
  isTestRescanLoading: false,
  isSitemapRegenerating: false
};

export const useProjectStore = create(set => ({
  ...initialState,
  setProject: project => set({ project, pageRescanNonce: 0, testRescanNonce: 0 }),
  setSelectedPage: page => set({ selectedPage: page, pageRescanNonce: 0 }),
  setIsPageLoading: isLoading => set({ isPageLoading: isLoading }),
  setTests: tests => set({ tests }),
  setSelectedTest: test => set({ selectedTest: test, pageRescanNonce: 0, testRescanNonce: 0 }),
  setTestStats: testStats => set({ testStats }),
  getTestStats: async (testId) => {
    const newTestStats = await window.api.environmentTest.getStats({ id: testId });
    set({ testStats: newTestStats });
  },
  scanPage: (data, opt) => {
    window.api.environmentPage.scanPage(data, opt);
    set((s) => {
      const newState = { pageRescanNonce: s.pageRescanNonce + 1 };
      // the whole test is being scanned
      if (!data.ids || data.ids.length === 0) {
        newState.testRescanNonce = s.testRescanNonce + 1;
      }
      return newState;
    });
  },
  setSitemap: sitemap => set({ sitemap }),
  setIsPageRescanLoading: isLoading => set({ isPageRescanLoading: isLoading }),
  setIsTestRescanLoading: isLoading => set({ isTestRescanLoading: isLoading }),
  setIsSitemapRegenerating: isLoading => set({ isSitemapRegenerating: isLoading }),
  reset: () => set(initialState)
}));
