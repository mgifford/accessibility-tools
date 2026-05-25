const { useAuditStore } = require('@/stores/useAuditStore');

const resetState = {
  audit: null,
  selectedCriterion: null,
  isPageLoading: false,
  auditStats: {}
};

beforeEach(() => {
  useAuditStore.setState(resetState);
  jest.clearAllMocks();
});

describe('useAuditStore', () => {
  describe('initial state', () => {
    it('audit is null initially', () => {
      expect(useAuditStore.getState().audit).toBeNull();
    });

    it('selectedCriterion is null initially', () => {
      expect(useAuditStore.getState().selectedCriterion).toBeNull();
    });

    it('auditStats starts as empty object', () => {
      expect(useAuditStore.getState().auditStats).toEqual({});
    });
  });

  describe('setAudit', () => {
    it('sets the audit', () => {
      const audit = { id: 'a1', name: 'WCAG 2.1 Audit' };
      useAuditStore.getState().setAudit(audit);
      expect(useAuditStore.getState().audit).toEqual(audit);
    });

    it('can set audit to null', () => {
      useAuditStore.setState({ audit: { id: 'a1' } });
      useAuditStore.getState().setAudit(null);
      expect(useAuditStore.getState().audit).toBeNull();
    });
  });

  describe('setSelectedCriterion', () => {
    it('sets the selected criterion', () => {
      const criterion = { id: 'c1', name: '1.1.1' };
      useAuditStore.getState().setSelectedCriterion(criterion);
      expect(useAuditStore.getState().selectedCriterion).toEqual(criterion);
    });

    it('can clear the selected criterion', () => {
      useAuditStore.setState({ selectedCriterion: { id: 'c1' } });
      useAuditStore.getState().setSelectedCriterion(null);
      expect(useAuditStore.getState().selectedCriterion).toBeNull();
    });
  });

  describe('setAuditStats', () => {
    it('sets the audit stats', () => {
      const stats = { total: 20, passed: 15 };
      useAuditStore.getState().setAuditStats(stats);
      expect(useAuditStore.getState().auditStats).toEqual(stats);
    });
  });

  describe('getAuditStats', () => {
    it('calls window.api.audit.getStats and updates state', async () => {
      const mockStats = {
        items: [{ id: 's1' }, { id: 's2' }],
        total: 2,
        updated: 1
      };
      window.api.audit.getStats.mockResolvedValue(mockStats);

      const audit = {
        id: 'a1',
        system_audit_type_version_id: 'WCAG_2_1',
        sections: [{ id: 's1', name: 'Section 1' }, { id: 's2', name: 'Section 2' }]
      };

      await useAuditStore.getState().getAuditStats(audit);

      const stats = useAuditStore.getState().auditStats;
      expect(stats.total).toBe(2);
      expect(stats.updated).toBe(1);
      expect(stats.title).toBe('WCAG 2 1');
      expect(stats.items).toHaveLength(2);
      expect(stats.items[0].name).toBe('Section 1');
    });

    it('uses system_audit_type_id when version id is not set', async () => {
      window.api.audit.getStats.mockResolvedValue({ items: [], total: 0, updated: 0 });
      const audit = {
        id: 'a1',
        system_audit_type_id: 'WCAG_2_0',
        sections: []
      };
      await useAuditStore.getState().getAuditStats(audit);
      expect(useAuditStore.getState().auditStats.title).toBe('WCAG 2 0');
    });

    it('uses "Unknown" for sections not found in audit', async () => {
      window.api.audit.getStats.mockResolvedValue({
        items: [{ id: 'unknown-id' }],
        total: 1,
        updated: 0
      });
      const audit = { id: 'a1', system_audit_type_version_id: 'TEST', sections: [] };
      await useAuditStore.getState().getAuditStats(audit);
      expect(useAuditStore.getState().auditStats.items[0].name).toBe('Unknown');
    });
  });

  describe('reset', () => {
    it('resets all fields to initial values', () => {
      useAuditStore.setState({
        audit: { id: 'a1' },
        selectedCriterion: { id: 'c1' },
        auditStats: { total: 5 }
      });
      useAuditStore.getState().reset();

      expect(useAuditStore.getState().audit).toBeNull();
      expect(useAuditStore.getState().selectedCriterion).toBeNull();
      expect(useAuditStore.getState().auditStats).toEqual({});
    });
  });
});
