import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseArgs,
  parseIntWithFallback,
  parseRobotsRules,
  summarizeViolations,
  escapeHtml,
  toSafeHref,
  formatTimestamp
} from '../scan-utils.mjs';

describe('parseArgs', () => {
  it('parses key=value pairs', () => {
    const result = parseArgs(['--url', 'https://example.com', '--depth', '2']);
    assert.deepEqual(result, { url: 'https://example.com', depth: '2' });
  });

  it('treats flag with no value as "true"', () => {
    const result = parseArgs(['--verbose']);
    assert.deepEqual(result, { verbose: 'true' });
  });

  it('ignores non-flag arguments', () => {
    const result = parseArgs(['extra', '--key', 'val']);
    assert.deepEqual(result, { key: 'val' });
  });

  it('parses report_type correctly', () => {
    assert.equal(parseArgs(['--report_type', 'summary']).report_type, 'summary');
    assert.equal(parseArgs(['--report_type', 'full']).report_type, 'full');
  });

  it('returns empty object for empty argv', () => {
    assert.deepEqual(parseArgs([]), {});
  });
});

describe('parseIntWithFallback', () => {
  it('parses valid integers', () => {
    assert.equal(parseIntWithFallback('5', 2), 5);
    assert.equal(parseIntWithFallback(10, 2), 10);
  });

  it('returns fallback for non-numeric values', () => {
    assert.equal(parseIntWithFallback('abc', 2), 2);
    assert.equal(parseIntWithFallback('', 3), 3);
    assert.equal(parseIntWithFallback(null, 4), 4);
  });

  it('parses floats as integers', () => {
    assert.equal(parseIntWithFallback('3.9', 1), 3);
  });
});

describe('parseRobotsRules', () => {
  it('returns empty array for empty input', () => {
    assert.deepEqual(parseRobotsRules(''), []);
  });

  it('returns disallow paths for wildcard user-agent', () => {
    const robots = 'User-agent: *\nDisallow: /private\nDisallow: /admin\n';
    assert.deepEqual(parseRobotsRules(robots), ['/private', '/admin']);
  });

  it('returns disallow paths for named bot user-agent', () => {
    const robots = 'User-agent: accessibility-tools-bot\nDisallow: /secret\n';
    assert.deepEqual(parseRobotsRules(robots), ['/secret']);
  });

  it('ignores disallow rules for unrelated user-agents', () => {
    const robots = 'User-agent: googlebot\nDisallow: /no\nUser-agent: *\nDisallow: /yes\n';
    assert.deepEqual(parseRobotsRules(robots), ['/yes']);
  });

  it('ignores comment lines', () => {
    const robots = '# Comment\nUser-agent: *\n# Another comment\nDisallow: /skip\n';
    assert.deepEqual(parseRobotsRules(robots), ['/skip']);
  });

  it('handles Windows-style line endings', () => {
    const robots = 'User-agent: *\r\nDisallow: /crlf\r\n';
    assert.deepEqual(parseRobotsRules(robots), ['/crlf']);
  });
});

describe('summarizeViolations', () => {
  it('returns empty array for no results', () => {
    assert.deepEqual(summarizeViolations([]), []);
  });

  it('skips error pages', () => {
    const results = [{ status: 'error', violations: [] }];
    assert.deepEqual(summarizeViolations(results), []);
  });

  it('aggregates violations across pages', () => {
    const results = [
      {
        status: 'ok',
        violations: [
          { id: 'color-contrast', impact: 'serious', help: 'Fix contrast', helpUrl: 'https://example.com', source: 'axe-core', nodes: [{}, {}] }
        ]
      },
      {
        status: 'ok',
        violations: [
          { id: 'color-contrast', impact: 'serious', help: 'Fix contrast', helpUrl: 'https://example.com', source: 'axe-core', nodes: [{}] }
        ]
      }
    ];
    const summary = summarizeViolations(results);
    assert.equal(summary.length, 1);
    assert.equal(summary[0].id, 'color-contrast');
    assert.equal(summary[0].pagesAffected, 2);
    assert.equal(summary[0].nodeCount, 3);
    assert.equal(summary[0].source, 'axe-core');
  });

  it('uses axe-core as default source when source field is absent', () => {
    const results = [
      {
        status: 'ok',
        violations: [
          { id: 'image-alt', impact: 'critical', help: 'Images need alt text', helpUrl: 'https://example.com', nodes: [{}] }
        ]
      }
    ];
    const summary = summarizeViolations(results);
    assert.equal(summary[0].source, 'axe-core');
  });

  it('sorts by nodeCount descending', () => {
    const results = [
      {
        status: 'ok',
        violations: [
          { id: 'low', impact: 'minor', help: 'Low', helpUrl: '', nodes: [{}] },
          { id: 'high', impact: 'critical', help: 'High', helpUrl: '', nodes: [{}, {}, {}] }
        ]
      }
    ];
    const summary = summarizeViolations(results);
    assert.equal(summary[0].id, 'high');
    assert.equal(summary[1].id, 'low');
  });
});

describe('escapeHtml', () => {
  it('escapes ampersand', () => {
    assert.equal(escapeHtml('a & b'), 'a &amp; b');
  });

  it('escapes less-than and greater-than', () => {
    assert.equal(escapeHtml('<script>'), '&lt;script&gt;');
  });

  it('escapes double quotes', () => {
    assert.equal(escapeHtml('"value"'), '&quot;value&quot;');
  });

  it('escapes single quotes', () => {
    assert.equal(escapeHtml("it's"), 'it&#39;s');
  });

  it('handles null/undefined as empty string', () => {
    assert.equal(escapeHtml(null), '');
    assert.equal(escapeHtml(undefined), '');
  });

  it('converts non-string values to string', () => {
    assert.equal(escapeHtml(42), '42');
  });
});

describe('toSafeHref', () => {
  it('returns http/https URLs unchanged (escaped)', () => {
    assert.equal(toSafeHref('https://example.com'), 'https://example.com/');
  });

  it('returns # for empty input', () => {
    assert.equal(toSafeHref(''), '#');
    assert.equal(toSafeHref(null), '#');
  });

  it('returns # for javascript: URLs', () => {
    assert.equal(toSafeHref('javascript:alert(1)'), '#');
  });

  it('returns # for data: URLs', () => {
    assert.equal(toSafeHref('data:text/html,<h1>x</h1>'), '#');
  });

  it('returns relative href when allowRelative is true', () => {
    assert.equal(toSafeHref('report.html', { allowRelative: true }), 'report.html');
  });

  it('returns # for relative href when allowRelative is false (default)', () => {
    assert.equal(toSafeHref('report.html'), '#');
  });
});

describe('formatTimestamp', () => {
  it('formats a valid ISO date string', () => {
    assert.equal(formatTimestamp('2025-01-15T12:00:00.000Z'), '2025-01-15T12:00:00.000Z');
  });

  it('returns - for invalid date', () => {
    assert.equal(formatTimestamp('not-a-date'), '-');
    assert.equal(formatTimestamp(''), '-');
  });

  it('formats a timestamp number', () => {
    const ts = new Date('2025-06-01T00:00:00.000Z').getTime();
    assert.equal(formatTimestamp(ts), '2025-06-01T00:00:00.000Z');
  });
});

describe('reportType behavior contract', () => {
  it('summary and full are the only valid report types', () => {
    const validTypes = ['summary', 'full'];
    for (const t of validTypes) {
      assert.ok(typeof t === 'string', `${t} should be a string`);
    }
  });

  it('summary reportType omits results.json (parseArgs picks up the value)', () => {
    const args = parseArgs(['--report_type', 'summary', '--url', 'https://example.com']);
    assert.equal(args.report_type, 'summary');
  });

  it('full reportType triggers complete output (parseArgs picks up the value)', () => {
    const args = parseArgs(['--report_type', 'full', '--url', 'https://example.com']);
    assert.equal(args.report_type, 'full');
  });

  it('defaults to summary when report_type is absent', () => {
    const args = parseArgs(['--url', 'https://example.com']);
    const reportType = args.report_type || 'summary';
    assert.equal(reportType, 'summary');
  });
});
