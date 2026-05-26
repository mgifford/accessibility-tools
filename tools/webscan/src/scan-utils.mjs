/**
 * Pure utility functions for the webscan tool.
 * Extracted here so they can be imported and unit-tested independently.
 */

export function parseArgs(argv) {
  const args = {};
  let i = 0;
  while (i < argv.length) {
    const raw = argv[i];
    if (!raw.startsWith('--')) {
      i += 1;
      continue;
    }
    const key = raw.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) {
      args[key] = 'true';
      i += 1;
      continue;
    }
    args[key] = next;
    i += 2;
  }
  return args;
}

export function parseIntWithFallback(value, fallback) {
  const n = Number.parseInt(String(value), 10);
  return Number.isFinite(n) ? n : fallback;
}

export function parseRobotsRules(robotsText = '') {
  const disallow = [];
  const lines = robotsText.split(/\r?\n/);
  let active = false;
  for (const line of lines) {
    const normalized = line.trim();
    if (!normalized || normalized.startsWith('#')) continue;
    const [rawKey, ...rest] = normalized.split(':');
    const key = rawKey.trim().toLowerCase();
    const value = rest.join(':').trim();
    if (key === 'user-agent') {
      active = value === '*' || value === 'accessibility-tools-bot';
      continue;
    }
    if (active && key === 'disallow' && value) {
      disallow.push(value);
    }
  }
  return disallow;
}

export function summarizeViolations(results) {
  const map = new Map();
  for (const page of results) {
    if (page.status !== 'ok') continue;
    for (const violation of page.violations) {
      const existing = map.get(violation.id) || {
        id: violation.id,
        impact: violation.impact,
        help: violation.help,
        helpUrl: violation.helpUrl,
        pagesAffected: 0,
        nodeCount: 0
      };
      existing.pagesAffected += 1;
      existing.nodeCount += violation.nodes.length;
      map.set(violation.id, existing);
    }
  }

  return [...map.values()].sort((a, b) => b.nodeCount - a.nodeCount);
}

export function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function toSafeHref(value, { allowRelative = false } = {}) {
  const href = String(value ?? '').trim();
  if (!href) return '#';
  if (allowRelative && !href.includes(':')) {
    return escapeHtml(href);
  }
  try {
    const parsed = new URL(href);
    if (['http:', 'https:'].includes(parsed.protocol)) {
      return escapeHtml(parsed.toString());
    }
  } catch {
    return '#';
  }
  return '#';
}

export function formatTimestamp(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toISOString();
}
