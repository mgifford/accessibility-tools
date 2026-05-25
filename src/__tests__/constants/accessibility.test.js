const {
  ADJUSTMENTS,
  PROFILES,
  ACTION_TYPES,
  adjustmentsConfigByProfile,
  COLOR_SLIDER_ITEMS,
  COLOR_CARD_ITEMS,
  CONTENT_SLIDER_ITEMS,
  CONTENT_CARD_ITEMS,
  NAVIGATION_CARD_ITEMS,
  CONTENT_SCALING_ZOOM_FACTOR_INCREASE,
  LS_KEYS
} = require('@/constants/accessibility');

// Mock asset imports since they reference SVG files
jest.mock('@/assets/icons', () => ({
  blackAndWhite: 'blackAndWhite',
  brightness: 'brightness',
  contrastMode: 'contrastMode',
  darkMode: 'darkMode',
  dyslexiaFriendly: 'dyslexiaFriendly',
  hidePhotos: 'hidePhotos',
  highlightLinks: 'highlightLinks',
  highlightTitles: 'highlightTitles',
  highSaturation: 'highSaturation',
  lightHighContrast: 'lightHighContrast',
  lowSaturation: 'lowSaturation',
  mute: 'mute',
  readableFont: 'readableFont',
  readingGuide: 'readingGuide',
  readingMark: 'readingMark',
  readingMode: 'readingMode',
  stopVideos: 'stopVideos',
  textMagnifier: 'textMagnifier'
}));

describe('ADJUSTMENTS constants', () => {
  it('contains all expected adjustment keys', () => {
    const expectedKeys = [
      'CURSOR', 'READING_MASK', 'READING_GUIDE', 'READING_MODE',
      'CONTENT_SCALING', 'FONT_SIZE', 'LETTER_SPACING', 'LINE_SPACING',
      'TEXT_ALIGNMENT', 'HIGHLIGHT_LINKS', 'FONT_CHANGE', 'HIGHLIGHT_TITLES',
      'STOP_ANIMATIONS', 'HIDE_IMAGES', 'MUTE_SOUNDS', 'TEXT_MAGNIFIER',
      'SATURATION', 'CONTRAST', 'BACKGROUND_COLOR', 'HEADINGS_COLOR',
      'CONTENT_COLOR', 'BRIGHTNESS', 'KEYBOARD_NAVIGATION'
    ];
    expectedKeys.forEach((key) => {
      expect(ADJUSTMENTS).toHaveProperty(key);
    });
  });

  it('has 23 adjustment keys', () => {
    expect(Object.keys(ADJUSTMENTS)).toHaveLength(23);
  });

  it('each key maps to its own string name', () => {
    Object.entries(ADJUSTMENTS).forEach(([key, value]) => {
      expect(value).toBe(key);
    });
  });
});

describe('PROFILES constants', () => {
  it('contains all expected profile keys', () => {
    const expectedKeys = [
      'SEIZURE_SAFE', 'COLOR_BLIND', 'VISION_IMPAIRED',
      'ADHD', 'DYSLEXIA', 'COGNITIVE', 'KEYBOARD_NAVIGATION'
    ];
    expectedKeys.forEach((key) => {
      expect(PROFILES).toHaveProperty(key);
    });
  });

  it('has 7 profiles', () => {
    expect(Object.keys(PROFILES)).toHaveLength(7);
  });

  it('each profile key maps to its own string name', () => {
    Object.entries(PROFILES).forEach(([key, value]) => {
      expect(value).toBe(key);
    });
  });
});

describe('ACTION_TYPES constants', () => {
  it('has ADJUSTMENT and PROFILE types', () => {
    expect(ACTION_TYPES.ADJUSTMENT).toBe('ADJUSTMENT');
    expect(ACTION_TYPES.PROFILE).toBe('PROFILE');
  });
});

describe('LS_KEYS constants', () => {
  it('has STATE key', () => {
    expect(LS_KEYS.STATE).toBe('state');
  });
});

describe('adjustmentsConfigByProfile', () => {
  it('has config for every profile', () => {
    Object.values(PROFILES).forEach((profile) => {
      expect(adjustmentsConfigByProfile).toHaveProperty(profile);
    });
  });

  it('each profile config has setConfig and resetConfig arrays', () => {
    Object.values(PROFILES).forEach((profile) => {
      const config = adjustmentsConfigByProfile[profile];
      expect(Array.isArray(config.setConfig)).toBe(true);
      expect(Array.isArray(config.resetConfig)).toBe(true);
    });
  });

  it('SEIZURE_SAFE profile sets STOP_ANIMATIONS to true', () => {
    const config = adjustmentsConfigByProfile[PROFILES.SEIZURE_SAFE];
    const stopAnim = config.setConfig.find(c => c.prop === ADJUSTMENTS.STOP_ANIMATIONS);
    expect(stopAnim).toBeDefined();
    expect(stopAnim.params).toBe(true);
  });

  it('SEIZURE_SAFE profile resets STOP_ANIMATIONS to false', () => {
    const config = adjustmentsConfigByProfile[PROFILES.SEIZURE_SAFE];
    const stopAnim = config.resetConfig.find(c => c.prop === ADJUSTMENTS.STOP_ANIMATIONS);
    expect(stopAnim).toBeDefined();
    expect(stopAnim.params).toBe(false);
  });

  it('DYSLEXIA profile sets FONT_CHANGE to dyslexic', () => {
    const config = adjustmentsConfigByProfile[PROFILES.DYSLEXIA];
    const fontChange = config.setConfig.find(c => c.prop === ADJUSTMENTS.FONT_CHANGE);
    expect(fontChange).toBeDefined();
    expect(fontChange.params).toBe('dyslexic');
  });

  it('VISION_IMPAIRED profile sets FONT_CHANGE to readable', () => {
    const config = adjustmentsConfigByProfile[PROFILES.VISION_IMPAIRED];
    const fontChange = config.setConfig.find(c => c.prop === ADJUSTMENTS.FONT_CHANGE);
    expect(fontChange).toBeDefined();
    expect(fontChange.params).toBe('readable');
  });

  it('KEYBOARD_NAVIGATION profile sets KEYBOARD_NAVIGATION to true', () => {
    const config = adjustmentsConfigByProfile[PROFILES.KEYBOARD_NAVIGATION];
    const kbdNav = config.setConfig.find(c => c.prop === ADJUSTMENTS.KEYBOARD_NAVIGATION);
    expect(kbdNav).toBeDefined();
    expect(kbdNav.params).toBe(true);
  });

  it('ADHD profile includes READING_MASK in setConfig', () => {
    const config = adjustmentsConfigByProfile[PROFILES.ADHD];
    const readingMask = config.setConfig.find(c => c.prop === ADJUSTMENTS.READING_MASK);
    expect(readingMask).toBeDefined();
    expect(readingMask.params).toBe(true);
  });

  it('COGNITIVE profile includes HIGHLIGHT_TITLES in setConfig', () => {
    const config = adjustmentsConfigByProfile[PROFILES.COGNITIVE];
    const hl = config.setConfig.find(c => c.prop === ADJUSTMENTS.HIGHLIGHT_TITLES);
    expect(hl).toBeDefined();
    expect(hl.params).toBe(true);
  });

  it('each setConfig entry has prop and params', () => {
    Object.values(PROFILES).forEach((profile) => {
      const config = adjustmentsConfigByProfile[profile];
      config.setConfig.forEach((entry) => {
        expect(entry).toHaveProperty('prop');
        expect(entry).toHaveProperty('params');
      });
    });
  });

  it('COLOR_BLIND profile sets SATURATION to high', () => {
    const config = adjustmentsConfigByProfile[PROFILES.COLOR_BLIND];
    const sat = config.setConfig.find(c => c.prop === ADJUSTMENTS.SATURATION);
    expect(sat).toBeDefined();
    expect(sat.params).toBe('high');
  });
});

describe('COLOR_SLIDER_ITEMS', () => {
  it('has 4 items', () => {
    expect(COLOR_SLIDER_ITEMS).toHaveLength(4);
  });

  it('includes brightness with value 1', () => {
    const brightness = COLOR_SLIDER_ITEMS.find(i => i.id === 'brightness');
    expect(brightness).toBeDefined();
    expect(brightness.value).toBe(1);
  });

  it('items have required shape', () => {
    COLOR_SLIDER_ITEMS.forEach((item) => {
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('adjustment');
      expect(item).toHaveProperty('title');
    });
  });
});

describe('COLOR_CARD_ITEMS', () => {
  it('has 6 items', () => {
    expect(COLOR_CARD_ITEMS).toHaveLength(6);
  });

  it('items have required shape', () => {
    COLOR_CARD_ITEMS.forEach((item) => {
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('adjustment');
      expect(item).toHaveProperty('description');
    });
  });
});

describe('CONTENT_SLIDER_ITEMS', () => {
  it('has 4 items', () => {
    expect(CONTENT_SLIDER_ITEMS).toHaveLength(4);
  });

  it('all items have value 1', () => {
    CONTENT_SLIDER_ITEMS.forEach((item) => {
      expect(item.value).toBe(1);
    });
  });
});

describe('CONTENT_CARD_ITEMS', () => {
  it('has 9 items', () => {
    expect(CONTENT_CARD_ITEMS).toHaveLength(9);
  });
});

describe('NAVIGATION_CARD_ITEMS', () => {
  it('has 2 items', () => {
    expect(NAVIGATION_CARD_ITEMS).toHaveLength(2);
  });

  it('includes readingMask and readingGuide', () => {
    const ids = NAVIGATION_CARD_ITEMS.map(i => i.id);
    expect(ids).toContain('readingMask');
    expect(ids).toContain('readingGuide');
  });
});

describe('CONTENT_SCALING_ZOOM_FACTOR_INCREASE', () => {
  it('equals 0.1', () => {
    expect(CONTENT_SCALING_ZOOM_FACTOR_INCREASE).toBe(0.1);
  });
});
