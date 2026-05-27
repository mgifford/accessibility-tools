import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { chromium } from 'playwright';
import axe from 'axe-core';
import { canonicalizeUrl, getHostname, isHttpUrl, isPrivateOrInternalHostname, isSameHostname } from '../../../src/shared/webscan/crawl-core.mjs';
import {
  parseArgs,
  parseIntWithFallback,
  parseRobotsRules,
  summarizeViolations,
  escapeHtml,
  toSafeHref,
  formatTimestamp
} from './scan-utils.mjs';

const DEFAULTS = {
  depth: 2,
  maxPages: 25,
  timeoutMs: 20000,
  respectRobots: true,
  reportType: 'summary',
  maxPagesHardCap: 500
};

const BOT_USER_AGENT = 'accessibility-tools-bot/1.0 (+https://github.com/mgifford/accessibility-tools)';

function assertPublicTargetUrl(url) {
  if (!isHttpUrl(url)) {
    throw new Error('Only http/https URLs are allowed.');
  }

  const hostname = getHostname(url);
  if (isPrivateOrInternalHostname(hostname)) {
    throw new Error('Private/internal IP ranges are not allowed.');
  }
}

function buildTargetUrlCandidates(input) {
  const normalizedInput = String(input || '').trim();
  if (!normalizedInput) {
    throw new Error('Invalid URL input.');
  }

  const hasScheme = /^[a-z][a-z\d+.-]*:\/\//i.test(normalizedInput);
  const parsed = new URL(hasScheme ? normalizedInput : `https://${normalizedInput}`);
  const hostnameVariants = [parsed.hostname];

  if (/[a-z]/i.test(parsed.hostname)) {
    if (parsed.hostname.startsWith('www.')) {
      hostnameVariants.push(parsed.hostname.slice(4));
    } else {
      hostnameVariants.push(`www.${parsed.hostname}`);
    }
  }

  const candidates = [];
  const protocols = hasScheme ? [parsed.protocol] : ['https:', 'http:'];
  const pathSuffix = `${parsed.pathname}${parsed.search}${parsed.hash}`;
  const hostVariants = hostnameVariants.map(hostname => (parsed.port ? `${hostname}:${parsed.port}` : hostname));

  for (const protocol of protocols) {
    for (const host of hostVariants) {
      const candidate = new URL(pathSuffix || '/', `${protocol}//${host}`);
      if (!candidate.pathname) {
        candidate.pathname = '/';
      }
      candidates.push(candidate.toString());
    }
  }

  return [...new Set(candidates)];
}

async function resolveTargetUrl(input, timeoutMs) {
  let lastError = null;

  for (const candidate of buildTargetUrlCandidates(input)) {
    try {
      assertPublicTargetUrl(candidate);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const res = await fetch(candidate, {
          signal: controller.signal,
          headers: {
            'user-agent': BOT_USER_AGENT
          }
        });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        try {
          await res.body?.cancel?.();
        } catch {
          // ignore cleanup errors
        }

        const resolved = canonicalizeUrl(res.url) || canonicalizeUrl(candidate);
        assertPublicTargetUrl(resolved);
        return resolved;
      } finally {
        clearTimeout(timeout);
      }
    } catch (error) {
      lastError = error;
    }
  }

  if (lastError) {
    throw new Error(`Could not reach a public URL for "${String(input || '').trim()}": ${lastError.message || 'request failed'}`);
  }

  throw new Error('Invalid URL input.');
}

async function fetchText(url, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'user-agent': BOT_USER_AGENT
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

async function fetchHtmlPage(url, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'user-agent': BOT_USER_AGENT
      }
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    return {
      text: await res.text(),
      finalUrl: canonicalizeUrl(res.url) || canonicalizeUrl(url) || url
    };
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

async function fetchSitemapPageUrls(xml, baseUrl, timeoutMs) {
  // Sitemap index: contains <sitemap><loc>…</loc></sitemap> entries pointing to
  // child sitemaps.  Fetch each child and collect the real page <loc> URLs.
  if (/<sitemapindex[\s>]/i.test(xml)) {
    const childUrls = [...xml.matchAll(/<loc>(.*?)<\/loc>/gi)]
      .map(m => m[1]?.trim())
      .filter(Boolean);
    const pageUrls = new Set();
    for (const childUrl of childUrls) {
      try {
        // eslint-disable-next-line no-await-in-loop
        const childXml = await fetchText(childUrl, timeoutMs);
        for (const match of childXml.matchAll(/<loc>(.*?)<\/loc>/gi)) {
          const normalized = canonicalizeUrl(match[1]);
          if (normalized && isSameHostname(baseUrl, normalized)) {
            pageUrls.add(normalized);
          }
        }
      } catch {
        // skip unreachable child sitemaps
      }
    }
    return [...pageUrls];
  }

  // Regular urlset sitemap: <loc> entries are page URLs.
  return [...xml.matchAll(/<loc>(.*?)<\/loc>/gi)]
    .map(m => canonicalizeUrl(m[1]))
    .filter(Boolean)
    .filter(url => isSameHostname(baseUrl, url));
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
      const urls = await fetchSitemapPageUrls(xml, baseUrl, timeoutMs);
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
    let pageUrl = url;
    try {
      const response = await fetchHtmlPage(url, timeoutMs);
      html = response.text;
      pageUrl = response.finalUrl;
    } catch (error) {
      failures.push({
        url,
        category: error?.name === 'AbortError' ? 'timeout' : 'fetch_error',
        message: error?.message || 'Failed to fetch page'
      });
      continue;
    }

    if (!isSameHostname(targetUrl, pageUrl)) {
      failures.push({
        url,
        category: 'redirect_out_of_scope',
        message: `Redirected to a different hostname: ${pageUrl}`
      });
      continue;
    }

    seen.add(pageUrl);
    if (!crawled.includes(pageUrl)) {
      crawled.push(pageUrl);
    }
    if (level === depth) continue;

    const links = extractLinksFromHtml(html, pageUrl, targetUrl);
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
        source: 'axe-core',
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
        source: 'axe-core',
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

function buildHtmlReport(summary, results, reportType = 'summary') {
  const assetLinks = [
    { label: 'HTML report', href: 'report.html' },
    { label: 'Summary JSON', href: 'summary.json' },
    ...(reportType === 'full' ? [{ label: 'Results JSON', href: 'results.json' }] : []),
    { label: 'URLs JSON', href: 'urls.json' }
  ];

  // Collect the distinct scan tools used across all findings
  const toolsUsed = new Set();
  for (const r of results) {
    for (const v of [...(r.violations || []), ...(r.incomplete || [])]) {
      toolsUsed.add(v.source || 'axe-core');
    }
  }
  const toolsLabel = toolsUsed.size > 0 ? [...toolsUsed].join(', ') : 'axe-core';

  const topRows = summary.topViolations.length > 0
    ? summary.topViolations
      .slice(0, 20)
      .map(v => `<tr><td>${escapeHtml(v.id)}</td><td>${escapeHtml(v.impact)}</td><td>${escapeHtml(v.source || 'axe-core')}</td><td>${escapeHtml(v.pagesAffected)}</td><td>${escapeHtml(v.nodeCount)}</td><td><a href="${toSafeHref(v.helpUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(v.help)}</a></td></tr>`)
      .join('')
    : '<tr><td colspan="6">No accessibility violations were detected.</td></tr>';

  const pageRows = results
    .map(r => `<tr><td><a href="${toSafeHref(r.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(r.url)}</a></td><td>${escapeHtml(r.status)}</td><td>${escapeHtml(r.violationCount)}</td><td>${escapeHtml(r.incompleteCount)}</td><td>${escapeHtml(r.category || '')}</td></tr>`)
    .join('');

  const failureRows = summary.failures.length > 0
    ? summary.failures
      .map(failure => `<tr><td><a href="${toSafeHref(failure.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(failure.url)}</a></td><td>${escapeHtml(failure.category)}</td><td>${escapeHtml(failure.message)}</td></tr>`)
      .join('')
    : '<tr><td colspan="3">No crawl or scan failures were recorded.</td></tr>';

  const urlsList = (summary.urls || []).length > 0
    ? `<ol>${summary.urls.map(url => `<li><a href="${toSafeHref(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(url)}</a></li>`).join('')}</ol>`
    : '<p>No URLs were collected for this run.</p>';

  const pageDetails = results
    .map((result) => {
      const violationsMarkup = result.violations.length > 0
        ? result.violations.map((violation) => `
            <details>
              <summary><strong>${escapeHtml(violation.id)}</strong> (${escapeHtml(violation.impact)}) — ${escapeHtml(violation.help)} <span class="source-badge">${escapeHtml(violation.source || 'axe-core')}</span></summary>
              <p>${escapeHtml(violation.description)}</p>
              <p><strong>Source:</strong> ${escapeHtml(violation.source || 'axe-core')}</p>
              <p><a href="${toSafeHref(violation.helpUrl)}" target="_blank" rel="noopener noreferrer">Guidance</a></p>
              <ul>
                ${violation.nodes.map(node => `<li><div><strong>Target:</strong> <code>${escapeHtml((node.target || []).join(', '))}</code></div><div><strong>HTML:</strong> <code>${escapeHtml(node.html)}</code></div><div><strong>Summary:</strong> ${escapeHtml(node.summary)}</div></li>`).join('')}
              </ul>
            </details>
          `).join('')
        : '<p>No rule violations recorded.</p>';

      const incompleteMarkup = result.incomplete.length > 0
        ? result.incomplete.map((entry) => `
            <details>
              <summary><strong>${escapeHtml(entry.id)}</strong> (${escapeHtml(entry.impact)}) — ${escapeHtml(entry.help)} <span class="source-badge">${escapeHtml(entry.source || 'axe-core')}</span></summary>
              <p>${escapeHtml(entry.description)}</p>
              <p><strong>Source:</strong> ${escapeHtml(entry.source || 'axe-core')}</p>
              <p><a href="${toSafeHref(entry.helpUrl)}" target="_blank" rel="noopener noreferrer">Guidance</a></p>
              <ul>
                ${entry.nodes.map(node => `<li><div><strong>Target:</strong> <code>${escapeHtml((node.target || []).join(', '))}</code></div><div><strong>HTML:</strong> <code>${escapeHtml(node.html)}</code></div><div><strong>Summary:</strong> ${escapeHtml(node.summary)}</div></li>`).join('')}
              </ul>
            </details>
          `).join('')
        : '<p>No incomplete findings recorded.</p>';

      return `
        <section class="card stack">
          <h3><a href="${toSafeHref(result.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(result.url)}</a></h3>
          <div class="inline-list">
            <span><strong>Status:</strong> ${escapeHtml(result.status)}</span>
            <span><strong>Violations:</strong> ${escapeHtml(result.violationCount)}</span>
            <span><strong>Incomplete:</strong> ${escapeHtml(result.incompleteCount)}</span>
            <span><strong>Started:</strong> ${escapeHtml(formatTimestamp(result.startedAt))}</span>
            <span><strong>Finished:</strong> ${escapeHtml(formatTimestamp(result.finishedAt))}</span>
          </div>
          ${result.message ? `<p><strong>${escapeHtml(result.category || 'error')}:</strong> ${escapeHtml(result.message)}</p>` : ''}
          <div class="detail-grid">
            <section>
              <h4>Violations</h4>
              ${violationsMarkup}
            </section>
            <section>
              <h4>Incomplete</h4>
              ${incompleteMarkup}
            </section>
          </div>
        </section>
      `;
    })
    .join('');

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Accessibility scan report</title>
    <style>
      :root { color-scheme: light dark; }
      body { font-family: Inter, Arial, sans-serif; margin: 24px; line-height: 1.5; }
      table { border-collapse: collapse; width: 100%; margin-bottom: 24px; }
      th, td { border: 1px solid #ddd; padding: 8px; text-align: left; vertical-align: top; }
      th { background: rgba(127, 127, 127, 0.12); }
      .meta, .detail-grid { display: grid; grid-template-columns: repeat(auto-fit,minmax(220px,1fr)); gap: 12px; margin-bottom: 16px; }
      .card { border: 1px solid #ddd; border-radius: 8px; padding: 12px; }
      .stack > * + * { margin-top: 12px; }
      .inline-list { display: flex; flex-wrap: wrap; gap: 12px; }
      .asset-list { display: flex; flex-wrap: wrap; gap: 12px; padding-left: 0; list-style: none; }
      code { white-space: pre-wrap; word-break: break-word; }
      details + details { margin-top: 8px; }
      a { color: inherit; }
      .source-badge { display: inline-block; font-size: 0.75em; font-weight: 600; padding: 1px 6px; border-radius: 4px; background: rgba(127,127,127,0.15); margin-left: 6px; vertical-align: middle; }
    </style>
  </head>
  <body>
    <h1>Accessibility Scan Report</h1>
    <div class="meta">
      <div class="card"><strong>Target URL</strong><div><a href="${toSafeHref(summary.targetUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(summary.targetUrl)}</a></div></div>
      <div class="card"><strong>Generated</strong><div>${escapeHtml(formatTimestamp(summary.generatedAt))}</div></div>
      <div class="card"><strong>Scan tool(s)</strong><div>${escapeHtml(toolsLabel)}</div></div>
      <div class="card"><strong>Pages scanned</strong><div>${escapeHtml(summary.totals?.pagesScanned ?? 0)}</div></div>
      <div class="card"><strong>Pages failed</strong><div>${escapeHtml(summary.totals?.pagesFailed ?? 0)}</div></div>
      <div class="card"><strong>Total violations</strong><div>${escapeHtml(summary.totals?.totalViolations ?? 0)}</div></div>
      <div class="card"><strong>Total incomplete</strong><div>${escapeHtml(summary.totals?.totalIncomplete ?? 0)}</div></div>
      <div class="card"><strong>Unique rules</strong><div>${escapeHtml(summary.totals?.uniqueViolationRules ?? 0)}</div></div>
      <div class="card"><strong>Crawl source</strong><div>${escapeHtml(summary.crawl?.source || '-')}</div></div>
    </div>

    <h2>Published assets</h2>
    <ul class="asset-list">
      ${assetLinks.map(asset => `<li><a href="${toSafeHref(asset.href, { allowRelative: true })}">${escapeHtml(asset.label)}</a></li>`).join('')}
    </ul>

    <h2>Top violations</h2>
    <table>
      <thead><tr><th>Rule ID</th><th>Impact</th><th>Source</th><th>Pages Affected</th><th>Node Count</th><th>Guidance</th></tr></thead>
      <tbody>${topRows}</tbody>
    </table>

    <h2>Failures</h2>
    <table>
      <thead><tr><th>URL</th><th>Category</th><th>Message</th></tr></thead>
      <tbody>${failureRows}</tbody>
    </table>

    <h2>Discovered URLs</h2>
    ${urlsList}

    <h2>Per-page summary</h2>
    <table>
      <thead><tr><th>URL</th><th>Status</th><th>Violations</th><th>Incomplete</th><th>Error Category</th></tr></thead>
      <tbody>${pageRows}</tbody>
    </table>

    ${reportType === 'full' ? `<h2>Detailed findings by page</h2>
    <div class="stack">${pageDetails}</div>` : '<!-- Detailed per-page findings omitted for summary report. Use report_type=full to include them. -->'}
  </body>
</html>`;
}

async function main() {
  const argv = parseArgs(process.argv.slice(2));
  const outDir = path.resolve(argv.out || './scan-output');

  const timeoutMs = Math.max(3000, Math.min(parseIntWithFallback(argv.timeout_ms, DEFAULTS.timeoutMs), 60000));
  const targetUrl = await resolveTargetUrl(argv.url || argv.target_url || '', timeoutMs);
  const depth = Math.max(0, Math.min(parseIntWithFallback(argv.depth, DEFAULTS.depth), 5));
  const maxPages = Math.max(1, Math.min(parseIntWithFallback(argv.max_pages, DEFAULTS.maxPages), DEFAULTS.maxPagesHardCap));
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
    scanTools: ['axe-core'],
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
    urls: crawlResult.urls,
    topViolations
  };

  const html = buildHtmlReport(summary, results, reportType);

  const writes = [
    fs.writeFile(path.join(outDir, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`, 'utf8'),
    fs.writeFile(path.join(outDir, 'report.html'), html, 'utf8'),
    fs.writeFile(path.join(outDir, 'urls.json'), `${JSON.stringify(crawlResult.urls, null, 2)}\n`, 'utf8')
  ];

  // results.json contains per-page violation details and can be very large.
  // Only write it for full reports to keep summary reports lightweight.
  if (reportType === 'full') {
    writes.push(fs.writeFile(path.join(outDir, 'results.json'), `${JSON.stringify(results, null, 2)}\n`, 'utf8'));
  }

  await Promise.all(writes);
}

main().catch((error) => {
  console.error(error?.message || error);
  process.exit(1);
});
