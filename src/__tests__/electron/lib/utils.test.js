const {
  isDomainValid,
  formatDomain,
  compareHostnames,
  compareUrls,
  generateId,
  getArrayTruncatedLabel,
  formatDate,
  fixTcTargets,
  convertToId,
  chunkArray,
  strToCase,
  getUrlPartitionString
} = require('@/electron/lib/utils');

describe('isDomainValid', () => {
  it('validates a basic domain', () => {
    expect(isDomainValid('example.com')).toBe(true);
  });

  it('validates a domain with http protocol', () => {
    expect(isDomainValid('http://example.com')).toBe(true);
  });

  it('validates a domain with https protocol', () => {
    expect(isDomainValid('https://example.com')).toBe(true);
  });

  it('validates a domain with subdomain', () => {
    expect(isDomainValid('https://sub.example.com')).toBe(true);
  });

  it('validates a domain with path', () => {
    expect(isDomainValid('https://example.com/path/to/page')).toBe(true);
  });

  it('validates localhost', () => {
    expect(isDomainValid('localhost')).toBe(true);
  });

  it('validates localhost with port', () => {
    expect(isDomainValid('localhost:3000')).toBe(true);
  });

  it('validates localhost with http', () => {
    expect(isDomainValid('http://localhost:3000')).toBe(true);
  });

  it('validates an IP address', () => {
    expect(isDomainValid('192.168.1.1')).toBe(true);
  });

  it('validates a domain with port', () => {
    expect(isDomainValid('https://example.com:8080')).toBe(true);
  });

  it('rejects empty string', () => {
    expect(isDomainValid('')).toBe(false);
  });

  it('rejects plain text without a dot', () => {
    expect(isDomainValid('notadomain')).toBe(false);
  });

  it('returns false for undefined (default param)', () => {
    expect(isDomainValid()).toBe(false);
  });

  it('validates domain with query string', () => {
    expect(isDomainValid('https://example.com/page?q=1')).toBe(true);
  });
});

describe('formatDomain', () => {
  it('returns domain unchanged when it already has https', () => {
    expect(formatDomain('https://example.com')).toBe('https://example.com');
  });

  it('returns domain unchanged when it already has http', () => {
    expect(formatDomain('http://example.com')).toBe('http://example.com');
  });

  it('adds https to domain without protocol', () => {
    expect(formatDomain('example.com')).toBe('https://example.com');
  });

  it('adds http to localhost domain', () => {
    expect(formatDomain('localhost:3000')).toBe('http://localhost:3000');
  });

  it('strips protocol when strip=true', () => {
    expect(formatDomain('https://example.com', true)).toBe('example.com');
  });

  it('strips protocol and www when strip=true', () => {
    expect(formatDomain('https://www.example.com', true)).toBe('example.com');
  });

  it('strips http protocol when strip=true', () => {
    expect(formatDomain('http://example.com', true)).toBe('example.com');
  });

  it('returns empty string for empty input', () => {
    expect(formatDomain('')).toBe('https://');
  });

  it('returns empty string with default param', () => {
    expect(formatDomain()).toBe('https://');
  });
});

describe('compareHostnames', () => {
  it('returns true for same hostname', () => {
    expect(compareHostnames('https://example.com', 'https://example.com')).toBe(true);
  });

  it('returns true for same hostname with different paths', () => {
    expect(compareHostnames('https://example.com/page1', 'https://example.com/page2')).toBe(true);
  });

  it('returns false for different hostnames', () => {
    expect(compareHostnames('https://example.com', 'https://other.com')).toBe(false);
  });

  it('returns true ignoring www prefix', () => {
    expect(compareHostnames('https://www.example.com', 'https://example.com')).toBe(true);
  });

  it('returns false for invalid URLs', () => {
    expect(compareHostnames('not a url', 'also not a url')).toBe(false);
  });
});

describe('compareUrls', () => {
  it('returns true for same URLs', () => {
    expect(compareUrls('https://example.com/path', 'https://example.com/path')).toBe(true);
  });

  it('returns false for same hostname but different paths', () => {
    expect(compareUrls('https://example.com/page1', 'https://example.com/page2')).toBe(false);
  });

  it('returns false for different domains', () => {
    expect(compareUrls('https://example.com/path', 'https://other.com/path')).toBe(false);
  });

  it('returns true for URLs differing only in query string', () => {
    expect(compareUrls('https://example.com/path?q=1', 'https://example.com/path?q=2')).toBe(true);
  });

  it('returns false for invalid URLs', () => {
    expect(compareUrls('not-a-url', 'also-not')).toBe(false);
  });
});

describe('generateId', () => {
  it('generates an id with default prefix and zeros', () => {
    expect(generateId(1)).toBe('00001');
  });

  it('generates an id with a custom prefix', () => {
    expect(generateId(42, 'TEST-')).toBe('TEST-0042');
  });

  it('generates an id with a custom zero count', () => {
    expect(generateId(5, 'ID', 2)).toBe('ID05');
  });

  it('handles large numbers without padding', () => {
    expect(generateId(99999, '0', 4)).toBe('099999');
  });

  it('generates id for 0', () => {
    expect(generateId(0)).toBe('00000');
  });
});

describe('getArrayTruncatedLabel', () => {
  it('returns empty string for empty array', () => {
    expect(getArrayTruncatedLabel([])).toBe('');
  });

  it('returns empty string for non-array input', () => {
    expect(getArrayTruncatedLabel(null)).toBe('');
    expect(getArrayTruncatedLabel(undefined)).toBe('');
  });

  it('returns all items when count is not exceeded', () => {
    expect(getArrayTruncatedLabel(['a', 'b'])).toBe('a, b');
  });

  it('returns single item', () => {
    expect(getArrayTruncatedLabel(['only'])).toBe('only');
  });

  it('truncates items beyond the count', () => {
    expect(getArrayTruncatedLabel(['a', 'b', 'c'], 2)).toBe('a, b,  +1');
  });

  it('uses custom separator', () => {
    expect(getArrayTruncatedLabel(['x', 'y'], 2, ' | ')).toBe('x | y');
  });

  it('truncates with custom count and separator', () => {
    expect(getArrayTruncatedLabel(['a', 'b', 'c', 'd'], 1)).toBe('a,  +3');
  });
});

describe('formatDate', () => {
  it('returns empty string for falsy date', () => {
    expect(formatDate(null)).toBe('');
    expect(formatDate(undefined)).toBe('');
    expect(formatDate('')).toBe('');
  });

  it('formats a date correctly', () => {
    const date = new Date(2024, 0, 15); // Jan 15, 2024
    expect(formatDate(date)).toBe('Jan 15, 2024');
  });

  it('uses a custom format', () => {
    const date = new Date(2024, 5, 1); // Jun 1, 2024
    expect(formatDate(date, 'yyyy-MM-dd')).toBe('2024-06-01');
  });
});

describe('fixTcTargets', () => {
  it('converts targets array to system_targets and removes targets', () => {
    const tc = {
      targets: [
        { target: { id: '1', name: 'Target A' }, format: { id: 'f1', name: 'Format 1' } },
        { target: { id: '1', name: 'Target A' }, format: { id: 'f2', name: 'Format 2' } }
      ]
    };

    const result = fixTcTargets(tc);

    expect(result.system_targets).toHaveLength(1);
    expect(result.system_targets[0].id).toBe('1');
    expect(result.system_targets[0].name).toBe('Target A');
    expect(result.system_targets[0].formats).toHaveLength(2);
    expect(result.targets).toBeUndefined();
  });

  it('handles multiple unique targets', () => {
    const tc = {
      targets: [
        { target: { id: '1', name: 'Target A' }, format: null },
        { target: { id: '2', name: 'Target B' }, format: { id: 'f1', name: 'Format 1' } }
      ]
    };

    const result = fixTcTargets(tc);

    expect(result.system_targets).toHaveLength(2);
    expect(result.system_targets[0].formats).toHaveLength(0);
    expect(result.system_targets[1].formats).toHaveLength(1);
  });

  it('handles empty targets array', () => {
    const tc = { targets: [] };
    const result = fixTcTargets(tc);

    expect(result.system_targets).toHaveLength(0);
    expect(result.targets).toBeUndefined();
  });

  it('deduplicates formats within the same target', () => {
    const tc = {
      targets: [
        { target: { id: '1', name: 'T' }, format: { id: 'f1', name: 'F1' } },
        { target: { id: '1', name: 'T' }, format: { id: 'f1', name: 'F1' } }
      ]
    };
    const result = fixTcTargets(tc);
    expect(result.system_targets[0].formats).toHaveLength(1);
  });
});

describe('convertToId', () => {
  it('converts a lowercase string to uppercase with underscores', () => {
    expect(convertToId('hello world')).toBe('HELLO_WORLD');
  });

  it('trims leading and trailing whitespace', () => {
    expect(convertToId('  hello  ')).toBe('HELLO');
  });

  it('replaces multiple spaces with a single underscore', () => {
    expect(convertToId('hello   world')).toBe('HELLO_WORLD');
  });

  it('converts already uppercase string', () => {
    expect(convertToId('ALREADY_UPPER')).toBe('ALREADY_UPPER');
  });

  it('converts single word', () => {
    expect(convertToId('test')).toBe('TEST');
  });
});

describe('chunkArray', () => {
  it('chunks an array into equal-sized pieces', () => {
    expect(chunkArray([1, 2, 3, 4], 2)).toEqual([[1, 2], [3, 4]]);
  });

  it('handles remainder in the last chunk', () => {
    expect(chunkArray([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it('returns empty array for empty input', () => {
    expect(chunkArray([])).toEqual([]);
  });

  it('returns empty array for non-array input', () => {
    expect(chunkArray(null)).toEqual([]);
    expect(chunkArray(undefined)).toEqual([]);
  });

  it('returns empty array for size <= 0', () => {
    expect(chunkArray([1, 2, 3], 0)).toEqual([]);
    expect(chunkArray([1, 2, 3], -1)).toEqual([]);
  });

  it('defaults chunk size to 10', () => {
    const arr = Array.from({ length: 15 }, (_, i) => i);
    const result = chunkArray(arr);
    expect(result).toHaveLength(2);
    expect(result[0]).toHaveLength(10);
    expect(result[1]).toHaveLength(5);
  });

  it('chunk size larger than array returns single chunk', () => {
    expect(chunkArray([1, 2, 3], 10)).toEqual([[1, 2, 3]]);
  });
});

describe('strToCase', () => {
  it('converts to camelCase', () => {
    expect(strToCase('hello world', 'camel')).toBe('helloWorld');
  });

  it('converts underscore to camelCase', () => {
    expect(strToCase('hello_world', 'camel')).toBe('helloWorld');
  });

  it('converts to kebab-case', () => {
    expect(strToCase('Hello World', 'kebab')).toBe('hello-world');
  });

  it('removes parentheses in kebab-case', () => {
    expect(strToCase('Hello (World)', 'kebab')).toBe('hello-world');
  });

  it('converts to capitalized', () => {
    expect(strToCase('HELLO WORLD', 'capitalized')).toBe('Hello world');
  });

  it('returns original string for unknown format', () => {
    expect(strToCase('hello world', 'unknown')).toBe('hello world');
  });

  it('returns empty string for falsy input', () => {
    expect(strToCase('')).toBe('');
    expect(strToCase(null)).toBe('');
    expect(strToCase(undefined)).toBe('');
  });

  it('converts dash-separated to camelCase', () => {
    expect(strToCase('my-test-string', 'camel')).toBe('myTestString');
  });
});

describe('getUrlPartitionString', () => {
  it('returns a persist partition for a valid domain', () => {
    expect(getUrlPartitionString('https://example.com')).toBe('persist:example.com');
  });

  it('returns a persist partition for domain without protocol', () => {
    expect(getUrlPartitionString('example.com')).toBe('persist:example.com');
  });

  it('returns original string for invalid URL', () => {
    expect(getUrlPartitionString('not a url')).toBe('not a url');
  });

  it('extracts hostname only (no port) for partition', () => {
    expect(getUrlPartitionString('https://example.com:8080')).toBe('persist:example.com');
  });
});
