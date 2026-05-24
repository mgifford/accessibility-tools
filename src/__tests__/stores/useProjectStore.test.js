const { useProjectStore } = require('@/stores/useProjectStore');

const initialState = {
  project: null,
  selectedPage: { id: 'HOME', name: 'Home', path: '/' },
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

beforeEach(() => {
  useProjectStore.getState().reset();
});

describe('useProjectStore', () => {
  describe('initial state', () => {
    it('project is null initially', () => {
      expect(useProjectStore.getState().project).toBeNull();
    });

    it('selectedPage defaults to HOME', () => {
      expect(useProjectStore.getState().selectedPage).toEqual({ id: 'HOME', name: 'Home', path: '/' });
    });

    it('tests starts empty', () => {
      expect(useProjectStore.getState().tests).toEqual([]);
    });

    it('rescan nonces start at 0', () => {
      expect(useProjectStore.getState().pageRescanNonce).toBe(0);
      expect(useProjectStore.getState().testRescanNonce).toBe(0);
    });
  });

  describe('setProject', () => {
    it('sets the project', () => {
      const project = { id: '1', name: 'My Project' };
      useProjectStore.getState().setProject(project);
      expect(useProjectStore.getState().project).toEqual(project);
    });

    it('resets rescan nonces when setting project', () => {
      useProjectStore.setState({ pageRescanNonce: 5, testRescanNonce: 3 });
      useProjectStore.getState().setProject({ id: '2' });
      expect(useProjectStore.getState().pageRescanNonce).toBe(0);
      expect(useProjectStore.getState().testRescanNonce).toBe(0);
    });
  });

  describe('setSelectedPage', () => {
    it('sets the selected page', () => {
      const page = { id: 'about', name: 'About', path: '/about' };
      useProjectStore.getState().setSelectedPage(page);
      expect(useProjectStore.getState().selectedPage).toEqual(page);
    });

    it('resets pageRescanNonce when page changes', () => {
      useProjectStore.setState({ pageRescanNonce: 3 });
      useProjectStore.getState().setSelectedPage({ id: 'contact', name: 'Contact', path: '/contact' });
      expect(useProjectStore.getState().pageRescanNonce).toBe(0);
    });
  });

  describe('setTests', () => {
    it('sets the tests list', () => {
      const tests = [{ id: 't1', name: 'Test 1' }];
      useProjectStore.getState().setTests(tests);
      expect(useProjectStore.getState().tests).toEqual(tests);
    });
  });

  describe('setSelectedTest', () => {
    it('sets the selected test', () => {
      const test = { id: 't1', name: 'Test 1' };
      useProjectStore.getState().setSelectedTest(test);
      expect(useProjectStore.getState().selectedTest).toEqual(test);
    });

    it('resets both nonces when selecting a test', () => {
      useProjectStore.setState({ pageRescanNonce: 5, testRescanNonce: 2 });
      useProjectStore.getState().setSelectedTest({ id: 't2' });
      expect(useProjectStore.getState().pageRescanNonce).toBe(0);
      expect(useProjectStore.getState().testRescanNonce).toBe(0);
    });
  });

  describe('setTestStats', () => {
    it('sets the test stats', () => {
      const stats = { total: 10, passed: 8 };
      useProjectStore.getState().setTestStats(stats);
      expect(useProjectStore.getState().testStats).toEqual(stats);
    });
  });

  describe('setSitemap', () => {
    it('sets the sitemap', () => {
      const sitemap = [{ url: 'https://example.com' }];
      useProjectStore.getState().setSitemap(sitemap);
      expect(useProjectStore.getState().sitemap).toEqual(sitemap);
    });
  });

  describe('loading flags', () => {
    it('setIsPageLoading updates flag', () => {
      useProjectStore.getState().setIsPageLoading(true);
      expect(useProjectStore.getState().isPageLoading).toBe(true);
    });

    it('setIsPageRescanLoading updates flag', () => {
      useProjectStore.getState().setIsPageRescanLoading(true);
      expect(useProjectStore.getState().isPageRescanLoading).toBe(true);
    });

    it('setIsTestRescanLoading updates flag', () => {
      useProjectStore.getState().setIsTestRescanLoading(true);
      expect(useProjectStore.getState().isTestRescanLoading).toBe(true);
    });

    it('setIsSitemapRegenerating updates flag', () => {
      useProjectStore.getState().setIsSitemapRegenerating(true);
      expect(useProjectStore.getState().isSitemapRegenerating).toBe(true);
    });
  });

  describe('scanPage', () => {
    it('increments pageRescanNonce', () => {
      useProjectStore.getState().scanPage({ ids: ['p1'] }, {});
      expect(useProjectStore.getState().pageRescanNonce).toBe(1);
    });

    it('increments both nonces when no ids given (full test scan)', () => {
      useProjectStore.getState().scanPage({}, {});
      expect(useProjectStore.getState().pageRescanNonce).toBe(1);
      expect(useProjectStore.getState().testRescanNonce).toBe(1);
    });

    it('increments both nonces when ids is empty array', () => {
      useProjectStore.getState().scanPage({ ids: [] }, {});
      expect(useProjectStore.getState().pageRescanNonce).toBe(1);
      expect(useProjectStore.getState().testRescanNonce).toBe(1);
    });

    it('does not increment testRescanNonce when specific page ids are provided', () => {
      useProjectStore.getState().scanPage({ ids: ['p1'] }, {});
      expect(useProjectStore.getState().testRescanNonce).toBe(0);
    });
  });

  describe('reset', () => {
    it('resets all state to initial values', () => {
      useProjectStore.setState({
        project: { id: '1' },
        tests: [{ id: 't1' }],
        pageRescanNonce: 5
      });
      useProjectStore.getState().reset();

      const state = useProjectStore.getState();
      expect(state.project).toBeNull();
      expect(state.tests).toEqual([]);
      expect(state.pageRescanNonce).toBe(0);
    });
  });
});
