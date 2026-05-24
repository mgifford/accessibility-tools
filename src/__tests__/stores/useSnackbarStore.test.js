const { useSnackbarStore } = require('@/stores/useSnackbarStore');

const getInitialState = () => ({
  open: false,
  message: '',
  severity: 'error',
  variant: 'filled',
  autoHideDuration: 6000,
  anchorOrigin: { vertical: 'bottom', horizontal: 'center' }
});

beforeEach(() => {
  useSnackbarStore.setState(getInitialState());
});

describe('useSnackbarStore', () => {
  describe('initial state', () => {
    it('starts with closed snackbar', () => {
      expect(useSnackbarStore.getState().open).toBe(false);
    });

    it('starts with empty message', () => {
      expect(useSnackbarStore.getState().message).toBe('');
    });

    it('starts with error severity', () => {
      expect(useSnackbarStore.getState().severity).toBe('error');
    });

    it('starts with filled variant', () => {
      expect(useSnackbarStore.getState().variant).toBe('filled');
    });

    it('starts with 6000ms auto-hide duration', () => {
      expect(useSnackbarStore.getState().autoHideDuration).toBe(6000);
    });
  });

  describe('openSnackbar', () => {
    it('opens the snackbar with provided message', () => {
      useSnackbarStore.getState().openSnackbar({ message: 'Hello' });
      expect(useSnackbarStore.getState().open).toBe(true);
      expect(useSnackbarStore.getState().message).toBe('Hello');
    });

    it('uses default severity of "error"', () => {
      useSnackbarStore.getState().openSnackbar({ message: 'Test' });
      expect(useSnackbarStore.getState().severity).toBe('error');
    });

    it('accepts custom severity', () => {
      useSnackbarStore.getState().openSnackbar({ message: 'Success!', severity: 'success' });
      expect(useSnackbarStore.getState().severity).toBe('success');
    });

    it('accepts custom variant', () => {
      useSnackbarStore.getState().openSnackbar({ message: 'Info', variant: 'outlined' });
      expect(useSnackbarStore.getState().variant).toBe('outlined');
    });

    it('accepts custom autoHideDuration', () => {
      useSnackbarStore.getState().openSnackbar({ message: 'Msg', autoHideDuration: 3000 });
      expect(useSnackbarStore.getState().autoHideDuration).toBe(3000);
    });

    it('accepts custom anchorOrigin', () => {
      const anchor = { vertical: 'top', horizontal: 'right' };
      useSnackbarStore.getState().openSnackbar({ message: 'Msg', anchorOrigin: anchor });
      expect(useSnackbarStore.getState().anchorOrigin).toEqual(anchor);
    });

    it('uses empty message as default', () => {
      useSnackbarStore.getState().openSnackbar({});
      expect(useSnackbarStore.getState().message).toBe('');
    });
  });

  describe('onClose', () => {
    it('resets all state to initial values', () => {
      useSnackbarStore.getState().openSnackbar({ message: 'Test', severity: 'warning' });
      useSnackbarStore.getState().onClose();

      const state = useSnackbarStore.getState();
      expect(state.open).toBe(false);
      expect(state.message).toBe('');
      expect(state.severity).toBe('error');
      expect(state.variant).toBe('filled');
      expect(state.autoHideDuration).toBe(6000);
    });
  });
});
