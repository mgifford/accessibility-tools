const { useSystemStore } = require('@/stores/useSystemStore');

const resetState = {
  standards: [],
  criteria: [],
  categories: [],
  technologies: [],
  environments: [],
  countries: [],
  auditTypes: [],
  landmarks: [],
  imageBasePath: ''
};

beforeEach(() => {
  useSystemStore.setState(resetState);
});

describe('useSystemStore', () => {
  describe('initial state', () => {
    it('all arrays start empty', () => {
      const state = useSystemStore.getState();
      expect(state.standards).toEqual([]);
      expect(state.criteria).toEqual([]);
      expect(state.categories).toEqual([]);
      expect(state.technologies).toEqual([]);
      expect(state.environments).toEqual([]);
      expect(state.countries).toEqual([]);
      expect(state.auditTypes).toEqual([]);
      expect(state.landmarks).toEqual([]);
    });

    it('imageBasePath starts empty', () => {
      expect(useSystemStore.getState().imageBasePath).toBe('');
    });
  });

  describe('setStandards', () => {
    it('sets the standards list', () => {
      const standards = [{ id: '1', name: 'WCAG 2.1' }];
      useSystemStore.getState().setStandards(standards);
      expect(useSystemStore.getState().standards).toEqual(standards);
    });
  });

  describe('setCriteria', () => {
    it('sets the criteria list', () => {
      const criteria = [{ id: 'c1', name: 'Criterion 1' }];
      useSystemStore.getState().setCriteria(criteria);
      expect(useSystemStore.getState().criteria).toEqual(criteria);
    });
  });

  describe('setCategories', () => {
    it('sets the categories list', () => {
      const categories = [{ id: 'cat1', name: 'Category A' }];
      useSystemStore.getState().setCategories(categories);
      expect(useSystemStore.getState().categories).toEqual(categories);
    });
  });

  describe('technologies', () => {
    it('adds a technology', () => {
      const tech = { id: 't1', name: 'React' };
      useSystemStore.getState().addTechnology(tech);
      expect(useSystemStore.getState().technologies).toContainEqual(tech);
    });

    it('removes a technology by id', () => {
      useSystemStore.setState({ technologies: [{ id: 't1', name: 'React' }, { id: 't2', name: 'Vue' }] });
      useSystemStore.getState().removeTechnology('t1');
      expect(useSystemStore.getState().technologies).toHaveLength(1);
      expect(useSystemStore.getState().technologies[0].id).toBe('t2');
    });

    it('sets technologies list', () => {
      const techs = [{ id: 't1', name: 'React' }];
      useSystemStore.getState().setTechnologies(techs);
      expect(useSystemStore.getState().technologies).toEqual(techs);
    });
  });

  describe('environments', () => {
    it('adds an environment', () => {
      const env = { id: 'e1', name: 'Production' };
      useSystemStore.getState().addEnvironment(env);
      expect(useSystemStore.getState().environments).toContainEqual(env);
    });

    it('removes an environment by id', () => {
      useSystemStore.setState({
        environments: [{ id: 'e1', name: 'Prod' }, { id: 'e2', name: 'Dev' }]
      });
      useSystemStore.getState().removeEnvironment('e1');
      expect(useSystemStore.getState().environments).toHaveLength(1);
      expect(useSystemStore.getState().environments[0].id).toBe('e2');
    });

    it('updates an environment', () => {
      const original = { id: 'e1', name: 'Old' };
      const updated = { id: 'e1', name: 'New' };
      useSystemStore.setState({ environments: [original] });
      useSystemStore.getState().updateEnvironment('e1', updated);
      expect(useSystemStore.getState().environments[0].name).toBe('New');
    });

    it('sets the environments list', () => {
      const envs = [{ id: 'e1', name: 'Prod' }];
      useSystemStore.getState().setEnvironments(envs);
      expect(useSystemStore.getState().environments).toEqual(envs);
    });
  });

  describe('setImageBasePath', () => {
    it('sets the image base path', () => {
      useSystemStore.getState().setImageBasePath('/assets/images');
      expect(useSystemStore.getState().imageBasePath).toBe('/assets/images');
    });
  });

  describe('setLandmarks', () => {
    it('sets the landmarks list', () => {
      const landmarks = [{ id: 'l1', name: 'Main' }];
      useSystemStore.getState().setLandmarks(landmarks);
      expect(useSystemStore.getState().landmarks).toEqual(landmarks);
    });
  });

  describe('setAuditTypes', () => {
    it('sets the audit types list', () => {
      const types = [{ id: 'a1', name: 'WCAG' }];
      useSystemStore.getState().setAuditTypes(types);
      expect(useSystemStore.getState().auditTypes).toEqual(types);
    });
  });
});
