const { useTestCaseFormStore } = require('@/stores/useTestCaseFormStore');

const initialState = {
  step: 1,
  testName: '',
  reproductionSteps: '',
  expectedResult: '',
  additionalInstructions: '',
  selectors: '',
  category: '',
  standard: '',
  criteria: [],
  testType: 'manual',
  errors: { testName: false, standard: false, criteria: false, testType: false },
  touched: { testName: false, standard: false, criteria: false, testType: false },
  isSubmitting: false
};

beforeEach(() => {
  useTestCaseFormStore.getState().resetForm();
});

describe('useTestCaseFormStore', () => {
  describe('initial state', () => {
    it('starts at step 1', () => {
      expect(useTestCaseFormStore.getState().step).toBe(1);
    });

    it('starts with empty testName', () => {
      expect(useTestCaseFormStore.getState().testName).toBe('');
    });

    it('starts with manual testType', () => {
      expect(useTestCaseFormStore.getState().testType).toBe('manual');
    });

    it('starts with no errors', () => {
      const { errors } = useTestCaseFormStore.getState();
      expect(errors.testName).toBe(false);
      expect(errors.standard).toBe(false);
    });
  });

  describe('setters', () => {
    it('setStep updates step', () => {
      useTestCaseFormStore.getState().setStep(2);
      expect(useTestCaseFormStore.getState().step).toBe(2);
    });

    it('setTestName updates testName', () => {
      useTestCaseFormStore.getState().setTestName('My Test');
      expect(useTestCaseFormStore.getState().testName).toBe('My Test');
    });

    it('setReproductionSteps updates reproductionSteps', () => {
      useTestCaseFormStore.getState().setReproductionSteps('Step 1');
      expect(useTestCaseFormStore.getState().reproductionSteps).toBe('Step 1');
    });

    it('setExpectedResult updates expectedResult', () => {
      useTestCaseFormStore.getState().setExpectedResult('Expected');
      expect(useTestCaseFormStore.getState().expectedResult).toBe('Expected');
    });

    it('setSelectors updates selectors', () => {
      useTestCaseFormStore.getState().setSelectors('.btn');
      expect(useTestCaseFormStore.getState().selectors).toBe('.btn');
    });

    it('setCategory updates category', () => {
      useTestCaseFormStore.getState().setCategory('cat1');
      expect(useTestCaseFormStore.getState().category).toBe('cat1');
    });

    it('setCriteria updates criteria', () => {
      useTestCaseFormStore.getState().setCriteria(['1.1.1']);
      expect(useTestCaseFormStore.getState().criteria).toEqual(['1.1.1']);
    });
  });

  describe('setStandard', () => {
    it('sets standard and clears error when value provided', () => {
      useTestCaseFormStore.setState({ errors: { standard: 'Standard is required' } });
      useTestCaseFormStore.getState().setStandard('WCAG 2.1');
      expect(useTestCaseFormStore.getState().standard).toBe('WCAG 2.1');
      expect(useTestCaseFormStore.getState().errors.standard).toBe(false);
    });

    it('sets error when standard is cleared', () => {
      useTestCaseFormStore.getState().setStandard('');
      expect(useTestCaseFormStore.getState().errors.standard).toBe('Standard is required');
    });
  });

  describe('setTestType', () => {
    it('sets testType and clears error when value provided', () => {
      useTestCaseFormStore.getState().setTestType('automated');
      expect(useTestCaseFormStore.getState().testType).toBe('automated');
      expect(useTestCaseFormStore.getState().errors.testType).toBe(false);
    });

    it('sets error when testType is cleared', () => {
      useTestCaseFormStore.getState().setTestType('');
      expect(useTestCaseFormStore.getState().errors.testType).toBe('Test type is required');
    });
  });

  describe('validateField', () => {
    it('returns error for empty testName', () => {
      const result = useTestCaseFormStore.getState().validateField('testName', '');
      expect(result).toBe('Test name is required');
    });

    it('returns empty string for valid testName', () => {
      const result = useTestCaseFormStore.getState().validateField('testName', 'Some name');
      expect(result).toBe('');
    });

    it('returns error for empty testTarget', () => {
      const result = useTestCaseFormStore.getState().validateField('testTarget', '');
      expect(result).toBe('Test target is required');
    });

    it('returns error for missing standard', () => {
      const result = useTestCaseFormStore.getState().validateField('standard', '');
      expect(result).toBe('Standard is required');
    });

    it('returns error for missing testType', () => {
      const result = useTestCaseFormStore.getState().validateField('testType', '');
      expect(result).toBe('Test type is required');
    });

    it('returns false for unknown field', () => {
      const result = useTestCaseFormStore.getState().validateField('unknownField', 'value');
      expect(result).toBe(false);
    });
  });

  describe('handleChange', () => {
    it('updates field and clears error for valid value', () => {
      useTestCaseFormStore.setState({ errors: { testName: 'Test name is required' } });
      useTestCaseFormStore.getState().handleChange('My Test', 'testName');
      expect(useTestCaseFormStore.getState().testName).toBe('My Test');
      expect(useTestCaseFormStore.getState().errors.testName).toBe(false);
    });

    it('sets error for empty value', () => {
      useTestCaseFormStore.getState().handleChange('', 'testName');
      expect(useTestCaseFormStore.getState().errors.testName).toBeTruthy();
    });
  });

  describe('handleBlur', () => {
    it('marks field as touched', () => {
      useTestCaseFormStore.getState().handleBlur('testName', 'My Test');
      expect(useTestCaseFormStore.getState().touched.testName).toBe(true);
    });

    it('sets error for empty value on blur', () => {
      useTestCaseFormStore.getState().handleBlur('testName', '');
      expect(useTestCaseFormStore.getState().errors.testName).toBeTruthy();
    });
  });

  describe('validateForm - step 1', () => {
    it('fails if testName is empty on step 1', () => {
      useTestCaseFormStore.setState({ step: 1, testName: '' });
      const isValid = useTestCaseFormStore.getState().validateForm();
      expect(isValid).toBe(false);
    });

    it('passes if testName is provided on step 1', () => {
      useTestCaseFormStore.setState({ step: 1, testName: 'My Test' });
      const isValid = useTestCaseFormStore.getState().validateForm();
      expect(isValid).toBe(true);
    });

    it('marks testName as touched on failed validation', () => {
      useTestCaseFormStore.setState({ step: 1, testName: '' });
      useTestCaseFormStore.getState().validateForm();
      expect(useTestCaseFormStore.getState().touched.testName).toBe(true);
    });
  });

  describe('validateForm - step 2', () => {
    it('fails if standard is missing on step 2', () => {
      useTestCaseFormStore.setState({ step: 2, standard: '', testType: 'manual' });
      const isValid = useTestCaseFormStore.getState().validateForm();
      expect(isValid).toBe(false);
    });

    it('fails if testType is missing on step 2', () => {
      useTestCaseFormStore.setState({ step: 2, standard: 'WCAG 2.1', testType: '' });
      const isValid = useTestCaseFormStore.getState().validateForm();
      expect(isValid).toBe(false);
    });

    it('passes with standard and testType provided on step 2', () => {
      useTestCaseFormStore.setState({ step: 2, standard: 'WCAG 2.1', testType: 'manual' });
      const isValid = useTestCaseFormStore.getState().validateForm();
      expect(isValid).toBe(true);
    });
  });

  describe('resetForm', () => {
    it('resets all fields to initial values', () => {
      useTestCaseFormStore.setState({ step: 2, testName: 'Test', standard: 'WCAG', testType: 'automated' });
      useTestCaseFormStore.getState().resetForm();

      const state = useTestCaseFormStore.getState();
      expect(state.step).toBe(1);
      expect(state.testName).toBe('');
      expect(state.standard).toBe('');
      expect(state.testType).toBe('manual');
    });
  });
});
