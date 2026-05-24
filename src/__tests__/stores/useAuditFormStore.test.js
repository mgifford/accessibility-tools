const { useAuditFormStore } = require('@/stores/useAuditFormStore');

beforeEach(() => {
  useAuditFormStore.getState().resetForm();
});

describe('useAuditFormStore', () => {
  describe('initial state', () => {
    it('starts at step 1', () => {
      expect(useAuditFormStore.getState().step).toBe(1);
    });

    it('reportIdentifier starts empty', () => {
      expect(useAuditFormStore.getState().reportIdentifier).toBe('');
    });

    it('reportDate starts at 0', () => {
      expect(useAuditFormStore.getState().reportDate).toBe(0);
    });

    it('product starts with empty fields', () => {
      const { product } = useAuditFormStore.getState();
      expect(product.name).toBe('');
      expect(product.website).toBe('');
    });
  });

  describe('setters', () => {
    it('setStep updates step', () => {
      useAuditFormStore.getState().setStep(2);
      expect(useAuditFormStore.getState().step).toBe(2);
    });

    it('setReportType updates reportType', () => {
      useAuditFormStore.getState().setReportType('VPAT');
      expect(useAuditFormStore.getState().reportType).toBe('VPAT');
    });

    it('setReportIdentifier updates reportIdentifier', () => {
      useAuditFormStore.getState().setReportIdentifier('RPT-001');
      expect(useAuditFormStore.getState().reportIdentifier).toBe('RPT-001');
    });

    it('setReportDate updates reportDate', () => {
      const date = Date.now();
      useAuditFormStore.getState().setReportDate(date);
      expect(useAuditFormStore.getState().reportDate).toBe(date);
    });

    it('setWcagVersion updates wcagVersion', () => {
      useAuditFormStore.getState().setWcagVersion('2.1');
      expect(useAuditFormStore.getState().wcagVersion).toBe('2.1');
    });

    it('setConformanceTarget updates conformanceTarget', () => {
      useAuditFormStore.getState().setConformanceTarget('AA');
      expect(useAuditFormStore.getState().conformanceTarget).toBe('AA');
    });

    it('setEvaluator updates evaluator', () => {
      useAuditFormStore.getState().setEvaluator('evaluator-id');
      expect(useAuditFormStore.getState().evaluator).toBe('evaluator-id');
    });

    it('setExecutiveSummary updates executiveSummary', () => {
      useAuditFormStore.getState().setExecutiveSummary('Summary text');
      expect(useAuditFormStore.getState().executiveSummary).toBe('Summary text');
    });

    it('setProduct merges product fields', () => {
      useAuditFormStore.getState().setProduct({ name: 'My App', version: '1.0' });
      const { product } = useAuditFormStore.getState();
      expect(product.name).toBe('My App');
      expect(product.version).toBe('1.0');
      expect(product.website).toBe('');
    });

    it('setVendor merges vendor fields', () => {
      useAuditFormStore.getState().setVendor({ name: 'ACME Corp', address: '123 Main St' });
      const { vendor } = useAuditFormStore.getState();
      expect(vendor.name).toBe('ACME Corp');
      expect(vendor.address).toBe('123 Main St');
    });

    it('setEvaluation merges evaluation fields', () => {
      useAuditFormStore.getState().setEvaluation({ notes: 'Some notes' });
      expect(useAuditFormStore.getState().evaluation.notes).toBe('Some notes');
    });

    it('setTest clears test error when test provided', () => {
      useAuditFormStore.setState({ errors: { test: 'Test required' } });
      useAuditFormStore.getState().setTest('test-id');
      expect(useAuditFormStore.getState().errors.test).toBe(false);
    });
  });

  describe('validateForm - step 1', () => {
    it('fails when reportIdentifier is empty', () => {
      useAuditFormStore.setState({ step: 1, reportIdentifier: '', reportDate: Date.now() });
      const isValid = useAuditFormStore.getState().validateForm();
      expect(isValid).toBe(false);
      expect(useAuditFormStore.getState().errors.reportIdentifier).toBeTruthy();
    });

    it('fails when reportDate is falsy', () => {
      useAuditFormStore.setState({ step: 1, reportIdentifier: 'RPT-001', reportDate: 0 });
      const isValid = useAuditFormStore.getState().validateForm();
      expect(isValid).toBe(false);
    });

    it('passes with valid reportIdentifier and reportDate', () => {
      useAuditFormStore.setState({
        step: 1,
        reportIdentifier: 'RPT-001',
        reportDate: Date.now()
      });
      const isValid = useAuditFormStore.getState().validateForm();
      expect(isValid).toBe(true);
    });
  });

  describe('validateForm - step 3', () => {
    it('fails when test is not set', () => {
      useAuditFormStore.setState({ step: 3, test: '' });
      const isValid = useAuditFormStore.getState().validateForm();
      expect(isValid).toBe(false);
    });

    it('passes when test is set', () => {
      useAuditFormStore.setState({ step: 3, test: 'test-id' });
      const isValid = useAuditFormStore.getState().validateForm();
      expect(isValid).toBe(true);
    });
  });

  describe('validateForm - other steps', () => {
    it('passes when product/vendor websites are empty', () => {
      useAuditFormStore.setState({
        step: 2,
        product: { name: '', version: '', description: '', website: '' },
        vendor: { name: '', address: '', website: '', contactName: '', contactEmail: '', contactPhone: '' },
        evaluation: { notes: '', methods: '', legalDisclaimer: '', repository: '', feedback: '', license: '' },
        evaluator: 'eval-id'
      });
      const isValid = useAuditFormStore.getState().validateForm();
      expect(isValid).toBe(true);
    });

    it('fails when product website is invalid', () => {
      useAuditFormStore.setState({
        step: 2,
        product: { name: '', version: '', description: '', website: 'not-a-url!!' },
        vendor: { name: '', address: '', website: '', contactName: '', contactEmail: '', contactPhone: '' },
        evaluation: { notes: '', methods: '', legalDisclaimer: '', repository: '', feedback: '', license: '' }
      });
      const isValid = useAuditFormStore.getState().validateForm();
      expect(isValid).toBe(false);
    });
  });

  describe('handleBlur', () => {
    it('marks reportIdentifier as touched', () => {
      useAuditFormStore.getState().handleBlur('reportIdentifier');
      expect(useAuditFormStore.getState().touched.reportIdentifier).toBe(true);
    });

    it('sets error for empty reportIdentifier on blur', () => {
      useAuditFormStore.setState({ step: 1, reportIdentifier: '' });
      useAuditFormStore.getState().handleBlur('reportIdentifier');
      expect(useAuditFormStore.getState().errors.reportIdentifier).toBeTruthy();
    });

    it('clears error for valid reportIdentifier on blur', () => {
      useAuditFormStore.setState({
        step: 1,
        reportIdentifier: 'RPT-001',
        errors: { reportIdentifier: 'required' }
      });
      useAuditFormStore.getState().handleBlur('reportIdentifier');
      expect(useAuditFormStore.getState().errors.reportIdentifier).toBeFalsy();
    });

    it('validates product.website on blur', () => {
      useAuditFormStore.setState({
        step: 2,
        product: { name: '', version: '', description: '', website: 'bad url!!' },
        errors: { product: { website: false } }
      });
      useAuditFormStore.getState().handleBlur('product.website');
      expect(useAuditFormStore.getState().errors.product.website).toBeTruthy();
    });

    it('clears product.website error for valid URL on blur', () => {
      useAuditFormStore.setState({
        step: 2,
        product: { name: '', version: '', description: '', website: 'https://example.com' },
        errors: { product: { website: 'Invalid website URL' } }
      });
      useAuditFormStore.getState().handleBlur('product.website');
      expect(useAuditFormStore.getState().errors.product.website).toBe(false);
    });

    it('marks product subfield as touched', () => {
      useAuditFormStore.getState().handleBlur('product.name');
      expect(useAuditFormStore.getState().touched.product.name).toBe(true);
    });

    it('marks vendor subfield as touched', () => {
      useAuditFormStore.getState().handleBlur('vendor.name');
      expect(useAuditFormStore.getState().touched.vendor.name).toBe(true);
    });
  });

  describe('setChapters', () => {
    it('sets chapters', () => {
      const chapters = [{ id: 'c1' }, { id: 'c2' }];
      useAuditFormStore.getState().setChapters(chapters);
      expect(useAuditFormStore.getState().chapters).toEqual(chapters);
    });
  });

  describe('setHasInitializedChapters', () => {
    it('updates hasInitializedChapters', () => {
      useAuditFormStore.getState().setHasInitializedChapters(true);
      expect(useAuditFormStore.getState().hasInitializedChapters).toBe(true);
    });
  });

  describe('resetForm', () => {
    it('resets all fields to initial values', () => {
      useAuditFormStore.setState({
        step: 3,
        reportIdentifier: 'RPT-001',
        reportDate: Date.now(),
        evaluator: 'eval-id'
      });
      useAuditFormStore.getState().resetForm();

      const state = useAuditFormStore.getState();
      expect(state.step).toBe(1);
      expect(state.reportIdentifier).toBe('');
      expect(state.reportDate).toBe(0);
      expect(state.evaluator).toBe('');
    });
  });
});
