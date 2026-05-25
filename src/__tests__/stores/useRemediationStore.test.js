const { useRemediationsStore } = require('@/stores/useRemediationStore');

const resetState = {
  remediations: [],
  selectedRemediations: [],
  sort: {},
  filter: {},
  pagination: {},
  meta: {},
  checkedFilters: {},
  openFilterItems: {}
};

beforeEach(() => {
  useRemediationsStore.setState(resetState);
});

describe('useRemediationsStore', () => {
  describe('initial state', () => {
    it('starts with empty remediations', () => {
      expect(useRemediationsStore.getState().remediations).toEqual([]);
    });

    it('starts with empty selectedRemediations', () => {
      expect(useRemediationsStore.getState().selectedRemediations).toEqual([]);
    });
  });

  describe('setRemediations', () => {
    it('sets the remediations list', () => {
      const items = [{ id: '1', name: 'Fix alt text' }];
      useRemediationsStore.getState().setRemediations(items);
      expect(useRemediationsStore.getState().remediations).toEqual(items);
    });
  });

  describe('addRemediation', () => {
    it('appends a remediation', () => {
      const r = { id: '1', name: 'Fix contrast' };
      useRemediationsStore.getState().addRemediation(r);
      expect(useRemediationsStore.getState().remediations).toContainEqual(r);
    });
  });

  describe('deleteRemediation', () => {
    it('removes a remediation by id', () => {
      useRemediationsStore.setState({
        remediations: [{ id: '1', name: 'A' }, { id: '2', name: 'B' }]
      });
      useRemediationsStore.getState().deleteRemediation('1');
      expect(useRemediationsStore.getState().remediations).toHaveLength(1);
      expect(useRemediationsStore.getState().remediations[0].id).toBe('2');
    });
  });

  describe('updateRemediation', () => {
    it('updates a remediation by id', () => {
      useRemediationsStore.setState({ remediations: [{ id: '1', name: 'Old' }] });
      useRemediationsStore.getState().updateRemediation('1', { id: '1', name: 'New' });
      expect(useRemediationsStore.getState().remediations[0].name).toBe('New');
    });
  });

  describe('selected remediations', () => {
    it('sets selected remediations', () => {
      const selected = [{ id: '1' }];
      useRemediationsStore.getState().setSelectedRemediations(selected);
      expect(useRemediationsStore.getState().selectedRemediations).toEqual(selected);
    });

    it('adds a selected remediation', () => {
      const r = { id: '1', name: 'Fix focus' };
      useRemediationsStore.getState().addSelectedRemediation(r);
      expect(useRemediationsStore.getState().selectedRemediations).toContainEqual(r);
    });

    it('removes a selected remediation by id', () => {
      useRemediationsStore.setState({
        selectedRemediations: [{ id: '1' }, { id: '2' }]
      });
      useRemediationsStore.getState().removeSelectedRemediation('1');
      expect(useRemediationsStore.getState().selectedRemediations).toHaveLength(1);
      expect(useRemediationsStore.getState().selectedRemediations[0].id).toBe('2');
    });
  });

  describe('pagination', () => {
    it('merges new pagination fields with existing ones', () => {
      useRemediationsStore.setState({ pagination: { page: 1 } });
      useRemediationsStore.getState().setPagination({ limit: 10 });
      expect(useRemediationsStore.getState().pagination).toEqual({ page: 1, limit: 10 });
    });

    it('overwrites existing pagination field', () => {
      useRemediationsStore.setState({ pagination: { page: 1 } });
      useRemediationsStore.getState().setPagination({ page: 2 });
      expect(useRemediationsStore.getState().pagination.page).toBe(2);
    });
  });

  describe('sort, filter, meta', () => {
    it('sets sort', () => {
      useRemediationsStore.getState().setSort({ field: 'name', direction: 'asc' });
      expect(useRemediationsStore.getState().sort).toEqual({ field: 'name', direction: 'asc' });
    });

    it('sets filter', () => {
      useRemediationsStore.getState().setFilter({ category: 'color' });
      expect(useRemediationsStore.getState().filter).toEqual({ category: 'color' });
    });

    it('sets meta', () => {
      useRemediationsStore.getState().setMeta({ total: 50 });
      expect(useRemediationsStore.getState().meta).toEqual({ total: 50 });
    });
  });
});
