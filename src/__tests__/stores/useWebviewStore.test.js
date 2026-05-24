const { useWebviewStore } = require('@/stores/useWebviewStore');

const initialState = {
  isDomReady: false,
  openDevTools: expect.any(Function),
  currentUrl: ''
};

beforeEach(() => {
  useWebviewStore.setState({
    isDomReady: false,
    openDevTools: () => {},
    currentUrl: ''
  });
});

describe('useWebviewStore', () => {
  describe('initial state', () => {
    it('isDomReady is false initially', () => {
      expect(useWebviewStore.getState().isDomReady).toBe(false);
    });

    it('currentUrl is empty initially', () => {
      expect(useWebviewStore.getState().currentUrl).toBe('');
    });

    it('openDevTools is a function initially', () => {
      expect(typeof useWebviewStore.getState().openDevTools).toBe('function');
    });
  });

  describe('setIsDomReady', () => {
    it('sets isDomReady to true', () => {
      useWebviewStore.getState().setIsDomReady(true);
      expect(useWebviewStore.getState().isDomReady).toBe(true);
    });

    it('sets isDomReady to false', () => {
      useWebviewStore.setState({ isDomReady: true });
      useWebviewStore.getState().setIsDomReady(false);
      expect(useWebviewStore.getState().isDomReady).toBe(false);
    });
  });

  describe('setCurrentUrl', () => {
    it('sets the current URL', () => {
      useWebviewStore.getState().setCurrentUrl('https://example.com');
      expect(useWebviewStore.getState().currentUrl).toBe('https://example.com');
    });

    it('clears the URL when set to empty string', () => {
      useWebviewStore.setState({ currentUrl: 'https://example.com' });
      useWebviewStore.getState().setCurrentUrl('');
      expect(useWebviewStore.getState().currentUrl).toBe('');
    });
  });

  describe('setOpenDevTools', () => {
    it('replaces the openDevTools function', () => {
      const mockFn = jest.fn();
      useWebviewStore.getState().setOpenDevTools(mockFn);
      expect(useWebviewStore.getState().openDevTools).toBe(mockFn);
    });
  });

  describe('reset', () => {
    it('resets state to initial values', () => {
      useWebviewStore.setState({ isDomReady: true, currentUrl: 'https://example.com' });
      useWebviewStore.getState().reset();

      expect(useWebviewStore.getState().isDomReady).toBe(false);
      expect(useWebviewStore.getState().currentUrl).toBe('');
    });
  });
});
