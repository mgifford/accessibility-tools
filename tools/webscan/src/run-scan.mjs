import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { chromium } from 'playwright';
import axe from 'axe-core';
import { canonicalizeUrl, getHostname, isHttpUrl, isPrivateOrInternalHostname, isSameHostname } from '../../../src/shared/webscan/crawl-core.mjs';

const DEFAULTS = {
  depth: 2,
  maxPages: 25,
  timeoutMs: 20000,
  respectRobots: true,
  reportType: 'summary',
  maxPagesHardCap: 100
};

function parseArgs(argv) {
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

function sanitizeTargetUrl(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error('Invalid URL input.');
  }

  if (!isHttpUrl(parsed.toString())) {
    throw new Error('Only http/https URLs are allowed.');
  }

  const hostname = getHostname(parsed.toString());
  if (isPrivateOrInternalHostname(hostname)) {
    throw new Error('Private/internal IP ranges are not allowed.');
  }

  return canonicalizeUrl(parsed.toString());
}

function toInt(value, fallback) {
  const n = Number.parseInt(String(value), 10);
  return Number.isFinite(n) ? n : fallback;
}

function parseRobotsRules(robotsText = '') {
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

async function fetchText(url, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'user-agent': 'accessibility-tools-bot/1.0 (+https://github.com/mgifford/accessibility-tools)'
      }
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    return await res.text();
  } finally {
    clearTimeout(timeout);
  }
}

function extractLinksFromHtml(html, pageUrl, baseUrl) {
  const hrefRegex = /href\s*=\s*(["'])(.*?)\1/gi;
  const links = new Set();
  for (const match of html.matchAll(hrefRegex)) {
    const href = match[2]?.trim();
    if (!href) continue;
    if (/^(mailto|tel|javascript|data|vbscript):/i.test(href)) continue;
    try {
      const absolute = new URL(href, pageUrl).toString();
      if (!isHttpUrl(absolute)) continue;
      const normalized = canonicalizeUrl(absolute);
      if (!normalized) continue;
      if (isSameHostname(baseUrl, normalized)) {
        links.add(normalized);
      }
    } catch {
      // ignore parse errors
    }
  }
  return [...links];
}

async function readSitemapUrls(baseUrl, timeoutMs) {
  const host = new URL(baseUrl).origin;
  const candidates = [`${host}/sitemap.xml`];
  try {
    const robots = await fetchText(`${host}/robots.txt`, timeoutMs);
    for (const line of robots.split(/\r?\n/)) {
      const m = line.match(/^\s*sitemap\s*:\s*(.+)$/i);
      if (m?.[1]) {
        candidates.unshift(m[1].trim());
      }
    }
  } catch {
    // ignore missing robots
  }

  for (const sitemapUrl of [...new Set(candidates)]) {
    try {
      const xml = await fetchText(sitemapUrl, timeoutMs);
      const urls = [...xml.matchAll(/<loc>(.*?)<\/loc>/gi)]
        .map(m => canonicalizeUrl(m[1]))
        .filter(Boolean)
        .filter(url => isSameHostname(baseUrl, url));
      if (urls.length) {
        return { urls: [...new Set(urls)], source: sitemapUrl };
      }
    } catch {
      // continue to next source
    }
  }

  return { urls: [], source: null };
}

function blockedByRobots(targetUrl, robotsDisallow) {
  const pathname = new URL(targetUrl).pathname || '/';
  return robotsDisallow.some((rule) => {
    if (!rule) return false;
    if (rule === '/') return true;
    return pathname.startsWith(rule);
  });
}

async function crawlUrls({ targetUrl, depth, maxPages, timeoutMs, respectRobots }) {
  const failures = [];
  const seen = new Set();
  const queue = [{ url: targetUrl, level: 0 }];
  const crawled = [];

  const origin = new URL(targetUrl).origin;
  let robotsDisallow = [];
  if (respectRobots) {
    try {
      const robotsTxt = await fetchText(`${origin}/robots.txt`, timeoutMs);
      robotsDisallow = parseRobotsRules(robotsTxt);
    } catch {
      // robots unavailable is allowed
    }
  }

  const sitemapResult = await readSitemapUrls(targetUrl, timeoutMs);
  if (sitemapResult.urls.length > 0) {
    const urls = sitemapResult.urls.slice(0, maxPages);
    if (!urls.includes(targetUrl)) urls.unshift(targetUrl);
    return {
      urls: urls.slice(0, maxPages),
      failures,
      crawlSource: 'sitemap',
      sitemapUrl: sitemapResult.source,
      robotsDisallowCount: robotsDisallow.length
    };
  }

  while (queue.length > 0 && crawled.length < maxPages) {
    const { url, level } = queue.shift();
    if (seen.has(url)) continue;
    seen.add(url);

    if (respectRobots && blockedByRobots(url, robotsDisallow)) {
      failures.push({ url, category: 'blocked_robots', message: 'URL path blocked by robots.txt' });
      continue;
    }

    if (level > depth) continue;

    let html = '';
    try {
      html = await fetchText(url, timeoutMs);
    } catch (error) {
      failures.push({
        url,
        category: error?.name === 'AbortError' ? 'timeout' : 'fetch_error',
        message: error?.message || 'Failed to fetch page'
      });
      continue;
    }

    crawled.push(url);
    if (level === depth) continue;

    const links = extractLinksFromHtml(html, url, targetUrl);
    for (const next of links) {
      if (!seen.has(next)) {
        queue.push({ url: next, level: level + 1 });
      }
    }
  }

  if (!crawled.includes(targetUrl)) {
    crawled.unshift(targetUrl);
  }

  return {
    urls: crawled.slice(0, maxPages),
    failures,
    crawlSource: 'crawler',
    sitemapUrl: null,
    robotsDisallowCount: robotsDisallow.length
  };
}

async function scanUrl(browser, url, timeoutMs) {
  const page = await browser.newPage();
  const startedAt = new Date().toISOString();
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: timeoutMs });
    await page.addScriptTag({ content: axe.source });
    const result = await page.evaluate(async () => {
      const data = await globalThis.axe.run(document, {
        resultTypes: ['violations', 'incomplete', 'passes']
      });
      return {
        violations: data.violations,
        incomplete: data.incomplete,
        passesCount: data.passes.length,
        inapplicableCount: data.inapplicable?.length || 0
      };
    });

    const violationCount = result.violations.reduce((sum, v) => sum + (v.nodes?.length || 0), 0);
    const incompleteCount = result.incomplete.reduce((sum, v) => sum + (v.nodes?.length || 0), 0);

    return {
      url,
      status: 'ok',
      startedAt,
      finishedAt: new Date().toISOString(),
      violationCount,
      incompleteCount,
      passesCount: result.passesCount,
      inapplicableCount: result.inapplicableCount,
      violations: result.violations.map(v => ({
        id: v.id,
        impact: v.impact || 'unknown',
        description: v.description,
        help: v.help,
        helpUrl: v.helpUrl,
        tags: v.tags,
        nodes: (v.nodes || []).map(node => ({
          target: node.target,
          html: node.html,
          summary: node.failureSummary
        }))
      })),
      incomplete: result.incomplete.map(v => ({
        id: v.id,
        impact: v.impact || 'unknown',
        description: v.description,
        help: v.help,
        helpUrl: v.helpUrl,
        tags: v.tags,
        nodes: (v.nodes || []).map(node => ({
          target: node.target,
          html: node.html,
          summary: node.failureSummary
        }))
      }))
    };
  } catch (error) {
    return {
      url,
      status: 'error',
      startedAt,
      finishedAt: new Date().toISOString(),
      category: error?.name === 'TimeoutError' ? 'timeout' : 'scan_error',
      message: error?.message || 'Unknown scan error',
      violationCount: 0,
      incompleteCount: 0,
      passesCount: 0,
      inapplicableCount: 0,
      violations: [],
      incomplete: []
    };
  } finally {
    await page.close();
  }
}

function summarizeViolations(results) {
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

function buildHtmlReport(summary, results) {
  const topRows = summary.topViolations
    .slice(0, 20)
    .map(v => `<tr><td>${v.id}</td><td>${v.impact}</td><td>${v.pagesAffected}</td><td>${v.nodeCount}</td><td><a href="${v.helpUrl}">${v.help}</a></td></tr>`)
    .join('');

  const pageRows = results
    .map(r => `<tr><td><a href="${r.url}">${r.url}</a></td><td>${r.status}</td><td>${r.violationCount}</td><td>${r.incompleteCount}</td><td>${r.category || ''}</td></tr>`)
    .join('');

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Accessibility scan report</title>
    <style>
      body { font-family: Inter, Arial, sans-serif; margin: 24px; line-height: 1.5; }
      table { border-collapse: collapse; width: 100%; margin-bottom: 24px; }
      th, td { border: 1px solid #ddd; padding: 8px; text-align: left; vertical-align: top; }
      th { background: #f7f7f7; }
      .meta { display: grid; grid-template-columns: repeat(auto-fit,minmax(220px,1fr)); gap: 12px; margin-bottom: 16px; }
      .card { border: 1px solid #ddd; border-radius: 8px; padding: 12px; }
    </style>
  </head>
  <body>
    <h1>Accessibility Scan Report</h1>
    <div class="meta">
      <div class="card"><strong>Target URL</strong><div>${summary.targetUrl}</div></div>
      <div class="card"><strong>Pages scanned</strong><div>${summary.pagesScanned}</div></div>
      <div class="card"><strong>Total violations</strong><div>${summary.totalViolations}</div></div>
      <div class="card"><strong>Total incomplete</strong><div>${summary.totalIncomplete}</div></div>
    </div>

    <h2>Top violations</h2>
    <table>
      <thead><tr><th>Rule ID</th><th>Impact</th><th>Pages Affected</th><th>Node Count</th><th>Guidance</th></tr></thead>
      <tbody>${topRows}</tbody>
    </table>

    <h2>Per-page summary</h2>
    <table>
      <thead><tr><th>URL</th><th>Status</th><th>Violations</th><th>Incomplete</th><th>Error Category</th></tr></thead>
      <tbody>${pageRows}</tbody>
    </table>
  </body>
</html>`;
}

async function main() {
  const argv = parseArgs(process.argv.slice(2));
  const outDir = path.resolve(argv.out || './scan-output');

  const targetUrl = sanitizeTargetUrl(argv.url || argv.target_url || '');
  const depth = Math.max(0, Math.min(toInt(argv.depth, DEFAULTS.depth), 5));
  const maxPages = Math.max(1, Math.min(toInt(argv.max_pages, DEFAULTS.maxPages), DEFAULTS.maxPagesHardCap));
  const timeoutMs = Math.max(3000, Math.min(toInt(argv.timeout_ms, DEFAULTS.timeoutMs), 60000));
  const reportType = argv.report_type || DEFAULTS.reportType;
  const respectRobots = String(argv.respect_robots ?? DEFAULTS.respectRobots) !== 'false';

  await fs.mkdir(outDir, { recursive: true });

  const crawlResult = await crawlUrls({
    targetUrl,
    depth,
    maxPages,
    timeoutMs,
    respectRobots
  });

  const browser = await chromium.launch({ headless: true });
  const results = [];
  for (const url of crawlResult.urls) {
    // Sequential intentionally to reduce request burst/rate impact.
    // This may increase total scan duration but avoids overwhelming target servers.
    // eslint-disable-next-line no-await-in-loop
    const pageResult = await scanUrl(browser, url, timeoutMs);
    results.push(pageResult);
  }
  await browser.close();

  const topViolations = summarizeViolations(results);
  const totalViolations = results.reduce((sum, r) => sum + (r.violationCount || 0), 0);
  const totalIncomplete = results.reduce((sum, r) => sum + (r.incompleteCount || 0), 0);
  const pagesScanned = results.filter(r => r.status === 'ok').length;
  const pagesFailed = results.filter(r => r.status === 'error').length;

  const summary = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    targetUrl,
    reportType,
    limits: {
      depth,
      maxPages,
      timeoutMs,
      respectRobots,
      maxPagesHardCap: DEFAULTS.maxPagesHardCap
    },
    crawl: {
      source: crawlResult.crawlSource,
      sitemapUrl: crawlResult.sitemapUrl,
      discoveredCount: crawlResult.urls.length,
      robotsDisallowCount: crawlResult.robotsDisallowCount
    },
    totals: {
      pagesDiscovered: crawlResult.urls.length,
      pagesScanned,
      pagesFailed,
      totalViolations,
      totalIncomplete,
      uniqueViolationRules: topViolations.length
    },
    failures: [...crawlResult.failures, ...results.filter(r => r.status === 'error').map(r => ({ url: r.url, category: r.category, message: r.message }))],
    topViolations
  };

  const html = buildHtmlReport(
    {
      targetUrl,
      pagesScanned,
      totalViolations,
      totalIncomplete,
      topViolations
    },
    results
  );

  await Promise.all([
    fs.writeFile(path.join(outDir, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`, 'utf8'),
    fs.writeFile(path.join(outDir, 'results.json'), `${JSON.stringify(results, null, 2)}\n`, 'utf8'),
    fs.writeFile(path.join(outDir, 'report.html'), html, 'utf8'),
    fs.writeFile(path.join(outDir, 'urls.json'), `${JSON.stringify(crawlResult.urls, null, 2)}\n`, 'utf8')
  ]);
}

main().catch((error) => {
  console.error(error?.message || error);
  process.exit(1);
});
