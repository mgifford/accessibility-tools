const { useTestCasesStore } = require('@/stores/useTestCaseStore');

const resetState = {
  testCases: [],
  selectedTestCases: [],
  sort: {},
  filter: {},
  pagination: {},
  meta: {},
  checkedFilters: {},
  openFilterItems: {}
};

beforeEach(() => {
  useTestCasesStore.setState(resetState);
});

describe('useTestCasesStore', () => {
  describe('initial state', () => {
    it('starts with empty testCases', () => {
      expect(useTestCasesStore.getState().testCases).toEqual([]);
    });

    it('starts with empty selectedTestCases', () => {
      expect(useTestCasesStore.getState().selectedTestCases).toEqual([]);
    });
  });

  describe('setTestCases', () => {
    it('sets the test cases list', () => {
      const cases = [{ id: '1', name: 'Test A' }];
      useTestCasesStore.getState().setTestCases(cases);
      expect(useTestCasesStore.getState().testCases).toEqual(cases);
    });
  });

  describe('addTestCase', () => {
    it('appends a test case to the list', () => {
      const tc = { id: '1', name: 'Test A' };
      useTestCasesStore.getState().addTestCase(tc);
      expect(useTestCasesStore.getState().testCases).toContainEqual(tc);
    });

    it('preserves existing test cases when adding', () => {
      const tc1 = { id: '1', name: 'A' };
      const tc2 = { id: '2', name: 'B' };
      useTestCasesStore.setState({ testCases: [tc1] });
      useTestCasesStore.getState().addTestCase(tc2);
      expect(useTestCasesStore.getState().testCases).toHaveLength(2);
    });
  });

  describe('deleteTestCase', () => {
    it('removes a test case by id', () => {
      useTestCasesStore.setState({
        testCases: [{ id: '1', name: 'A' }, { id: '2', name: 'B' }]
      });
      useTestCasesStore.getState().deleteTestCase('1');
      expect(useTestCasesStore.getState().testCases).toHaveLength(1);
      expect(useTestCasesStore.getState().testCases[0].id).toBe('2');
    });

    it('does nothing if id not found', () => {
      useTestCasesStore.setState({ testCases: [{ id: '1', name: 'A' }] });
      useTestCasesStore.getState().deleteTestCase('999');
      expect(useTestCasesStore.getState().testCases).toHaveLength(1);
    });
  });

  describe('updateTestCase', () => {
    it('updates a test case by id', () => {
      useTestCasesStore.setState({ testCases: [{ id: '1', name: 'Old' }] });
      useTestCasesStore.getState().updateTestCase('1', { id: '1', name: 'New' });
      expect(useTestCasesStore.getState().testCases[0].name).toBe('New');
    });

    it('does not update other test cases', () => {
      useTestCasesStore.setState({
        testCases: [{ id: '1', name: 'A' }, { id: '2', name: 'B' }]
      });
      useTestCasesStore.getState().updateTestCase('1', { id: '1', name: 'Updated' });
      expect(useTestCasesStore.getState().testCases[1].name).toBe('B');
    });
  });

  describe('selected test cases', () => {
    it('sets selected test cases', () => {
      const selected = [{ id: '1' }];
      useTestCasesStore.getState().setSelectedTestCases(selected);
      expect(useTestCasesStore.getState().selectedTestCases).toEqual(selected);
    });

    it('adds a selected test case', () => {
      const tc = { id: '1', name: 'A' };
      useTestCasesStore.getState().addSelectedTestCase(tc);
      expect(useTestCasesStore.getState().selectedTestCases).toContainEqual(tc);
    });

    it('removes a selected test case by id', () => {
      useTestCasesStore.setState({
        selectedTestCases: [{ id: '1' }, { id: '2' }]
      });
      useTestCasesStore.getState().removeSelectedTestCase('1');
      expect(useTestCasesStore.getState().selectedTestCases).toHaveLength(1);
      expect(useTestCasesStore.getState().selectedTestCases[0].id).toBe('2');
    });
  });

  describe('sort, filter, pagination, meta', () => {
    it('sets sort', () => {
      const sort = { field: 'name', direction: 'asc' };
      useTestCasesStore.getState().setSort(sort);
      expect(useTestCasesStore.getState().sort).toEqual(sort);
    });

    it('sets filter', () => {
      const filter = { status: 'open' };
      useTestCasesStore.getState().setFilter(filter);
      expect(useTestCasesStore.getState().filter).toEqual(filter);
    });

    it('merges new pagination with existing', () => {
      useTestCasesStore.setState({ pagination: { page: 1 } });
      useTestCasesStore.getState().setPagination({ limit: 10 });
      expect(useTestCasesStore.getState().pagination).toEqual({ page: 1, limit: 10 });
    });

    it('sets meta', () => {
      const meta = { total: 100 };
      useTestCasesStore.getState().setMeta(meta);
      expect(useTestCasesStore.getState().meta).toEqual(meta);
    });

    it('sets checkedFilters', () => {
      const filters = { category: true };
      useTestCasesStore.getState().setCheckedFilters(filters);
      expect(useTestCasesStore.getState().checkedFilters).toEqual(filters);
    });

    it('sets openFilterItems', () => {
      const items = { category: true };
      useTestCasesStore.getState().setOpenFilterItems(items);
      expect(useTestCasesStore.getState().openFilterItems).toEqual(items);
    });
  });
});
