const {
  AUDIT_ITEM_CHAPTER_TYPES,
  AUDIT_ITEM_TYPE_VALUES,
  AUDIT_ITEM_LEVEL_VALUES,
  LEVEL_OPTIONS_WCAG_ATAG,
  LEVEL_OPTIONS_VPAT,
  LEVELS,
  CONFORMANCE_TYPE_LABELS
} = require('@/constants/audit');

describe('AUDIT_ITEM_CHAPTER_TYPES', () => {
  it('contains all chapter types', () => {
    expect(AUDIT_ITEM_CHAPTER_TYPES.WEB).toBe('WEB');
    expect(AUDIT_ITEM_CHAPTER_TYPES.DOCS).toBe('DOCS');
    expect(AUDIT_ITEM_CHAPTER_TYPES.SOFTWARE).toBe('SOFTWARE');
    expect(AUDIT_ITEM_CHAPTER_TYPES.AUTHORING_TOOL).toBe('AUTHORING_TOOL');
    expect(AUDIT_ITEM_CHAPTER_TYPES.FULL).toBe('FULL');
  });

  it('has exactly 5 chapter types', () => {
    expect(Object.keys(AUDIT_ITEM_CHAPTER_TYPES)).toHaveLength(5);
  });
});

describe('AUDIT_ITEM_TYPE_VALUES', () => {
  it('contains all values from AUDIT_ITEM_CHAPTER_TYPES', () => {
    Object.values(AUDIT_ITEM_CHAPTER_TYPES).forEach((val) => {
      expect(AUDIT_ITEM_TYPE_VALUES).toContain(val);
    });
  });

  it('has the same length as AUDIT_ITEM_CHAPTER_TYPES', () => {
    expect(AUDIT_ITEM_TYPE_VALUES).toHaveLength(Object.keys(AUDIT_ITEM_CHAPTER_TYPES).length);
  });
});

describe('AUDIT_ITEM_LEVEL_VALUES', () => {
  it('includes all expected level values', () => {
    const expected = [
      'SUPPORT', 'PARTIAL_SUPPORT', 'NOT_SUPPORTED',
      'NOT_APPLICABLE', 'NOT_EVALUATED',
      'PASSED', 'FAILED', 'CANNOT_TELL'
    ];
    expected.forEach((val) => {
      expect(AUDIT_ITEM_LEVEL_VALUES).toContain(val);
    });
  });

  it('has 8 level values', () => {
    expect(AUDIT_ITEM_LEVEL_VALUES).toHaveLength(8);
  });
});

describe('LEVEL_OPTIONS_WCAG_ATAG', () => {
  it('has 5 options', () => {
    expect(LEVEL_OPTIONS_WCAG_ATAG).toHaveLength(5);
  });

  it('each option has value and label', () => {
    LEVEL_OPTIONS_WCAG_ATAG.forEach((opt) => {
      expect(opt).toHaveProperty('value');
      expect(opt).toHaveProperty('label');
    });
  });

  it('includes PASSED and FAILED', () => {
    const values = LEVEL_OPTIONS_WCAG_ATAG.map(o => o.value);
    expect(values).toContain('PASSED');
    expect(values).toContain('FAILED');
  });

  it('does not include VPAT-only values', () => {
    const values = LEVEL_OPTIONS_WCAG_ATAG.map(o => o.value);
    expect(values).not.toContain('SUPPORT');
    expect(values).not.toContain('PARTIAL_SUPPORT');
  });
});

describe('LEVEL_OPTIONS_VPAT', () => {
  it('has 5 options', () => {
    expect(LEVEL_OPTIONS_VPAT).toHaveLength(5);
  });

  it('each option has value and label', () => {
    LEVEL_OPTIONS_VPAT.forEach((opt) => {
      expect(opt).toHaveProperty('value');
      expect(opt).toHaveProperty('label');
    });
  });

  it('includes SUPPORT, PARTIAL_SUPPORT, NOT_SUPPORTED', () => {
    const values = LEVEL_OPTIONS_VPAT.map(o => o.value);
    expect(values).toContain('SUPPORT');
    expect(values).toContain('PARTIAL_SUPPORT');
    expect(values).toContain('NOT_SUPPORTED');
  });

  it('does not include PASSED, FAILED, or CANNOT_TELL', () => {
    const values = LEVEL_OPTIONS_VPAT.map(o => o.value);
    expect(values).not.toContain('PASSED');
    expect(values).not.toContain('FAILED');
    expect(values).not.toContain('CANNOT_TELL');
  });
});

describe('LEVELS', () => {
  it('maps all level keys to human-readable labels', () => {
    expect(LEVELS.PASSED).toBe('Passed');
    expect(LEVELS.FAILED).toBe('Failed');
    expect(LEVELS.SUPPORT).toBe('Supports');
    expect(LEVELS.PARTIAL_SUPPORT).toBe('Partially supports');
    expect(LEVELS.NOT_SUPPORTED).toBe('Does not support');
    expect(LEVELS.NOT_APPLICABLE).toBe('Not applicable');
    expect(LEVELS.NOT_EVALUATED).toBe('Not evaluated');
    expect(LEVELS.CANNOT_TELL).toBe('Cannot tell');
  });

  it('has 8 entries', () => {
    expect(Object.keys(LEVELS)).toHaveLength(8);
  });
});

describe('CONFORMANCE_TYPE_LABELS', () => {
  it('maps all chapter types to human-readable labels', () => {
    expect(CONFORMANCE_TYPE_LABELS.AUTHORING_TOOL).toBe('Authoring Tool');
    expect(CONFORMANCE_TYPE_LABELS.DOCS).toBe('Electronic Docs');
    expect(CONFORMANCE_TYPE_LABELS.SOFTWARE).toBe('Software');
    expect(CONFORMANCE_TYPE_LABELS.WEB).toBe('Web');
  });

  it('has 4 entries', () => {
    expect(Object.keys(CONFORMANCE_TYPE_LABELS)).toHaveLength(4);
  });
});
