const { useProjectFormStore } = require('@/stores/useProjectFormStore');

beforeEach(() => {
  useProjectFormStore.getState().resetForm();
});

describe('useProjectFormStore', () => {
  describe('initial state', () => {
    it('starts at step 1', () => {
      expect(useProjectFormStore.getState().step).toBe(1);
    });

    it('projectName starts empty', () => {
      expect(useProjectFormStore.getState().projectName).toBe('');
    });

    it('starts with one Production envDomain', () => {
      const { envDomains } = useProjectFormStore.getState();
      expect(envDomains).toHaveLength(1);
      expect(envDomains[0].environment).toBe('Production');
      expect(envDomains[0].domain).toBe('');
    });

    it('connected starts false', () => {
      expect(useProjectFormStore.getState().connected).toBe(false);
    });
  });

  describe('setStep', () => {
    it('clamps step to minimum of 1 (disconnected = 2 steps)', () => {
      useProjectFormStore.setState({ connected: false });
      useProjectFormStore.getState().setStep(0);
      expect(useProjectFormStore.getState().step).toBe(1);
    });

    it('clamps step to maximum of 2 when disconnected', () => {
      useProjectFormStore.setState({ connected: false });
      useProjectFormStore.getState().setStep(99);
      expect(useProjectFormStore.getState().step).toBe(2);
    });

    it('allows step 3 when connected', () => {
      useProjectFormStore.setState({ connected: true });
      useProjectFormStore.getState().setStep(3);
      expect(useProjectFormStore.getState().step).toBe(3);
    });
  });

  describe('setters', () => {
    it('setProjectName updates projectName', () => {
      useProjectFormStore.getState().setProjectName('My Project');
      expect(useProjectFormStore.getState().projectName).toBe('My Project');
    });

    it('setConnected updates connected', () => {
      useProjectFormStore.getState().setConnected(true);
      expect(useProjectFormStore.getState().connected).toBe(true);
    });

    it('setEmail updates email', () => {
      useProjectFormStore.getState().setEmail('user@example.com');
      expect(useProjectFormStore.getState().email).toBe('user@example.com');
    });

    it('setDomain updates domain', () => {
      useProjectFormStore.getState().setDomain('example.com');
      expect(useProjectFormStore.getState().domain).toBe('example.com');
    });

    it('setCode updates code', () => {
      useProjectFormStore.getState().setCode('ABC123');
      expect(useProjectFormStore.getState().code).toBe('ABC123');
    });

    it('setEssentialFunctionality updates essentialFunctionality', () => {
      useProjectFormStore.getState().setEssentialFunctionality('Buy products');
      expect(useProjectFormStore.getState().essentialFunctionality).toBe('Buy products');
    });

    it('setWebPageTypes updates webPageTypes', () => {
      useProjectFormStore.getState().setWebPageTypes('Landing, Blog');
      expect(useProjectFormStore.getState().webPageTypes).toBe('Landing, Blog');
    });
  });

  describe('validateField', () => {
    it('returns true for invalid domain', () => {
      expect(useProjectFormStore.getState().validateField('domain', 'not a domain')).toBe(true);
    });

    it('returns false for valid domain', () => {
      expect(useProjectFormStore.getState().validateField('domain', 'https://example.com')).toBe(false);
    });

    it('returns true for empty project name', () => {
      expect(useProjectFormStore.getState().validateField('projectName', '')).toBe(true);
    });

    it('returns false for non-empty project name', () => {
      expect(useProjectFormStore.getState().validateField('projectName', 'My Project')).toBe(false);
    });
  });

  describe('handleChange', () => {
    it('updates a top-level field', () => {
      useProjectFormStore.getState().handleChange('projectName', 'New Project');
      expect(useProjectFormStore.getState().projectName).toBe('New Project');
    });

    it('updates an envDomain at a given index', () => {
      useProjectFormStore.setState({
        envDomains: [{ environment: 'Production', domain: '' }],
        errors: { envDomains: [{ environment: '', domain: '' }] }
      });
      useProjectFormStore.getState().handleChange('domain', 'https://example.com', 0);
      expect(useProjectFormStore.getState().envDomains[0].domain).toBe('https://example.com');
    });

    it('sets domain error for invalid domain at index', () => {
      useProjectFormStore.setState({
        envDomains: [{ environment: 'Production', domain: '' }],
        errors: { envDomains: [{ environment: '', domain: '' }] }
      });
      useProjectFormStore.getState().handleChange('domain', 'not-valid!@#', 0);
      expect(useProjectFormStore.getState().errors.envDomains[0].domain).toBeTruthy();
    });
  });

  describe('handleBlur', () => {
    it('marks a top-level field as touched', () => {
      useProjectFormStore.getState().handleBlur('projectName', 'My Project');
      expect(useProjectFormStore.getState().touched.projectName).toBe(true);
    });

    it('marks an envDomain field as touched at index', () => {
      useProjectFormStore.setState({
        touched: { envDomains: [{ environment: false, domain: false }] },
        errors: { envDomains: [{ environment: '', domain: '' }] }
      });
      useProjectFormStore.getState().handleBlur('domain', 'https://example.com', 0);
      expect(useProjectFormStore.getState().touched.envDomains[0].domain).toBe(true);
    });

    it('sets error for invalid domain on blur', () => {
      useProjectFormStore.setState({
        envDomains: [{ environment: 'Production', domain: 'not-valid!@#' }],
        touched: { envDomains: [{ environment: false, domain: false }] },
        errors: { envDomains: [{ environment: '', domain: '' }] }
      });
      useProjectFormStore.getState().handleBlur('domain', 'not-valid!@#', 0);
      expect(useProjectFormStore.getState().errors.envDomains[0].domain).toBeTruthy();
    });
  });

  describe('removeEnvDomain', () => {
    it('removes an env domain at the given index', () => {
      useProjectFormStore.setState({
        envDomains: [{ environment: 'Prod', domain: 'a.com' }, { environment: 'Dev', domain: 'b.com' }],
        touched: { envDomains: [{ environment: false, domain: false }, { environment: false, domain: false }] },
        errors: { envDomains: [{ environment: '', domain: '' }, { environment: '', domain: '' }] }
      });
      useProjectFormStore.getState().removeEnvDomain(0);
      expect(useProjectFormStore.getState().envDomains).toHaveLength(1);
      expect(useProjectFormStore.getState().envDomains[0].environment).toBe('Dev');
    });
  });

  describe('validateForm', () => {
    it('fails when projectName is empty', () => {
      useProjectFormStore.setState({
        projectName: '',
        envDomains: [{ environment: 'Production', domain: 'https://example.com' }],
        errors: { envDomains: [{ environment: '', domain: '' }] },
        touched: { envDomains: [{ environment: false, domain: false }] }
      });
      const isValid = useProjectFormStore.getState().validateForm();
      expect(isValid).toBe(false);
    });

    it('fails when domain is invalid', () => {
      useProjectFormStore.setState({
        projectName: 'My Project',
        envDomains: [{ environment: 'Production', domain: 'not-a-domain!!' }],
        errors: { envDomains: [{ environment: '', domain: '' }] },
        touched: { envDomains: [{ environment: false, domain: false }] }
      });
      const isValid = useProjectFormStore.getState().validateForm();
      expect(isValid).toBe(false);
    });

    it('passes with valid projectName and domain', () => {
      useProjectFormStore.setState({
        projectName: 'My Project',
        envDomains: [{ environment: 'Production', domain: 'https://example.com' }],
        errors: { envDomains: [{ environment: '', domain: '' }] },
        touched: { envDomains: [{ environment: false, domain: false }] }
      });
      const isValid = useProjectFormStore.getState().validateForm();
      expect(isValid).toBe(true);
    });
  });

  describe('resetForm', () => {
    it('resets all fields to initial values', () => {
      useProjectFormStore.setState({
        step: 2,
        projectName: 'Old Project',
        connected: true,
        email: 'test@test.com'
      });
      useProjectFormStore.getState().resetForm();

      const state = useProjectFormStore.getState();
      expect(state.step).toBe(1);
      expect(state.projectName).toBe('');
      expect(state.connected).toBe(false);
      expect(state.email).toBe('');
    });
  });
});
