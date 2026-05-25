const { useRemediationFormStore } = require('@/stores/useRemediationFormStore');

beforeEach(() => {
  useRemediationFormStore.getState().resetForm();
});

describe('useRemediationFormStore', () => {
  describe('initial state', () => {
    it('starts at step 1', () => {
      expect(useRemediationFormStore.getState().step).toBe(1);
    });

    it('starts with empty remediationName', () => {
      expect(useRemediationFormStore.getState().remediationName).toBe('');
    });

    it('starts with one empty example', () => {
      expect(useRemediationFormStore.getState().examples).toHaveLength(1);
      expect(useRemediationFormStore.getState().examples[0]).toEqual({ name: '', description: '', code: '' });
    });

    it('starts with no errors', () => {
      expect(useRemediationFormStore.getState().errors.remediationName).toBe(false);
    });
  });

  describe('setRemediationName', () => {
    it('sets name and clears error when name provided', () => {
      useRemediationFormStore.getState().setRemediationName('Fix alt text');
      expect(useRemediationFormStore.getState().remediationName).toBe('Fix alt text');
      expect(useRemediationFormStore.getState().errors.remediationName).toBe(false);
    });

    it('sets error when name is cleared', () => {
      useRemediationFormStore.getState().setRemediationName('');
      expect(useRemediationFormStore.getState().errors.remediationName).toBe('Remediation name is required');
    });
  });

  describe('validateField', () => {
    it('returns error for empty remediationName', () => {
      const result = useRemediationFormStore.getState().validateField('remediationName', '');
      expect(result).toBe('Remediation name is required');
    });

    it('returns empty string for valid remediationName', () => {
      const result = useRemediationFormStore.getState().validateField('remediationName', 'Fix it');
      expect(result).toBe('');
    });

    it('validates example names', () => {
      const examples = [{ name: '', description: '', code: '' }, { name: 'Valid', description: '', code: '' }];
      const result = useRemediationFormStore.getState().validateField('examples', examples);
      expect(result[0].name).toBe('Example name is required');
      expect(result[1].name).toBe('');
    });

    it('returns false for unknown field', () => {
      const result = useRemediationFormStore.getState().validateField('unknownField', 'value');
      expect(result).toBe(false);
    });
  });

  describe('validateForm - step 1', () => {
    it('fails if remediationName is empty', () => {
      useRemediationFormStore.setState({ step: 1, remediationName: '' });
      const isValid = useRemediationFormStore.getState().validateForm();
      expect(isValid).toBe(false);
    });

    it('fails if an example has no name', () => {
      useRemediationFormStore.setState({
        step: 1,
        remediationName: 'Fix alt text',
        examples: [{ name: '', description: '', code: '' }]
      });
      const isValid = useRemediationFormStore.getState().validateForm();
      expect(isValid).toBe(false);
    });

    it('passes with valid name and examples', () => {
      useRemediationFormStore.setState({
        step: 1,
        remediationName: 'Fix alt text',
        examples: [{ name: 'Example 1', description: '', code: '' }]
      });
      const isValid = useRemediationFormStore.getState().validateForm();
      expect(isValid).toBe(true);
    });
  });

  describe('handleChange', () => {
    it('updates a field value', () => {
      useRemediationFormStore.getState().handleChange('remediationName', 'New Name');
      expect(useRemediationFormStore.getState().remediationName).toBe('New Name');
    });

    it('updates an example at a given index', () => {
      useRemediationFormStore.setState({
        examples: [{ name: '', description: '', code: '' }],
        errors: { examples: [{ name: '', description: '', code: '' }] }
      });
      useRemediationFormStore.getState().handleChange('name', 'My Example', 0);
      expect(useRemediationFormStore.getState().examples[0].name).toBe('My Example');
    });

    it('sets error when example name is cleared', () => {
      useRemediationFormStore.setState({
        examples: [{ name: 'X', description: '', code: '' }],
        errors: { examples: [{ name: '', description: '', code: '' }] }
      });
      useRemediationFormStore.getState().handleChange('name', '', 0);
      expect(useRemediationFormStore.getState().errors.examples[0].name).toBeTruthy();
    });
  });

  describe('handleBlur', () => {
    it('marks field as touched', () => {
      useRemediationFormStore.getState().handleBlur('remediationName');
      expect(useRemediationFormStore.getState().touched.remediationName).toBe(true);
    });

    it('sets error for empty field on blur', () => {
      useRemediationFormStore.getState().handleBlur('remediationName');
      expect(useRemediationFormStore.getState().errors.remediationName).toBeTruthy();
    });

    it('marks example field as touched at index', () => {
      useRemediationFormStore.setState({
        examples: [{ name: '', description: '', code: '' }],
        touched: { examples: [{ name: false, description: false, code: false }] },
        errors: { examples: [{ name: '', description: '', code: '' }] }
      });
      useRemediationFormStore.getState().handleBlur('name', 0);
      expect(useRemediationFormStore.getState().touched.examples[0].name).toBe(true);
    });
  });

  describe('addExample', () => {
    it('appends a new empty example', async () => {
      await useRemediationFormStore.getState().addExample();
      expect(useRemediationFormStore.getState().examples).toHaveLength(2);
      expect(useRemediationFormStore.getState().examples[1]).toEqual({ name: '', description: '', code: '' });
    });
  });

  describe('removeExample', () => {
    it('removes an example at the given index', () => {
      useRemediationFormStore.setState({
        examples: [{ name: 'A', description: '', code: '' }, { name: 'B', description: '', code: '' }],
        touched: { examples: [{ name: false, description: false, code: false }, { name: false, description: false, code: false }] },
        errors: { examples: [{ name: '', description: '', code: '' }, { name: '', description: '', code: '' }] }
      });
      useRemediationFormStore.getState().removeExample(0);
      expect(useRemediationFormStore.getState().examples).toHaveLength(1);
      expect(useRemediationFormStore.getState().examples[0].name).toBe('B');
    });
  });

  describe('resetForm', () => {
    it('resets all fields to initial values', () => {
      useRemediationFormStore.setState({ step: 2, remediationName: 'Test', category: 'cat1' });
      useRemediationFormStore.getState().resetForm();

      const state = useRemediationFormStore.getState();
      expect(state.step).toBe(1);
      expect(state.remediationName).toBe('');
      expect(state.category).toBe('');
    });
  });

  describe('setters', () => {
    it('setStep updates the step', () => {
      useRemediationFormStore.getState().setStep(2);
      expect(useRemediationFormStore.getState().step).toBe(2);
    });

    it('setRemediationDescription updates description', () => {
      useRemediationFormStore.getState().setRemediationDescription('Some description');
      expect(useRemediationFormStore.getState().remediationDescription).toBe('Some description');
    });

    it('setCategory updates category', () => {
      useRemediationFormStore.getState().setCategory('cat1');
      expect(useRemediationFormStore.getState().category).toBe('cat1');
    });

    it('setCriteria updates criteria', () => {
      useRemediationFormStore.getState().setCriteria(['1.1.1']);
      expect(useRemediationFormStore.getState().criteria).toEqual(['1.1.1']);
    });

    it('setTests updates tests', () => {
      useRemediationFormStore.getState().setTests(['t1', 't2']);
      expect(useRemediationFormStore.getState().tests).toEqual(['t1', 't2']);
    });
  });
});
