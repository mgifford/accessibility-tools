const archiveRowsEl = document.getElementById('archive-rows');
const archiveCountEl = document.getElementById('archive-count');

function getDomain(url) {
  if (!url) return '-';
  try { return new URL(url).hostname; } catch { return url; }
}

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

/**
 * Merge history and report-index data by run id so we can surface zip links
 * for runs that have them, while still listing runs that appear only in history.
 */
function mergeRuns(historyRuns, indexRuns) {
  const byId = new Map();

  for (const run of historyRuns) {
    byId.set(run.id, { ...run });
  }

  for (const run of indexRuns) {
    if (byId.has(run.id)) {
      // Merge zip/asset info from report-index into history record
      Object.assign(byId.get(run.id), {
        zipAvailable: run.zipAvailable,
        assets: run.assets,
        reportAvailable: run.reportAvailable,
      });
    } else {
      byId.set(run.id, { ...run });
    }
  }

  return Array.from(byId.values());
}

async function loadArchive() {
  try {
    const cutoff = Date.now() - 31 * 24 * 60 * 60 * 1000;

    const [historyResp, indexResp] = await Promise.all([
      fetch('./data/history.json', { cache: 'no-store' }),
      fetch('./data/report-index.json', { cache: 'no-store' }),
    ]);

    const historyData = historyResp.ok ? await historyResp.json() : { runs: [] };
    const indexData   = indexResp.ok  ? await indexResp.json()   : { runs: [] };

    const historyRuns = (historyData.runs || []).filter(
      run => run.conclusion === 'success' || run.status !== 'completed'
    );
    const indexRuns = (indexData.runs || []).filter(
      run => run.conclusion === 'success' || run.status !== 'completed'
    );

    const merged = mergeRuns(historyRuns, indexRuns);

    const archiveRuns = merged.filter(run => {
      const ts = run.createdAt ? new Date(run.createdAt).getTime() : Infinity;
      return run.createdAt && ts < cutoff;
    });

    // Sort newest first
    archiveRuns.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    archiveCountEl.textContent = archiveRuns.length > 0
      ? `${archiveRuns.length} run${archiveRuns.length === 1 ? '' : 's'}`
      : '';

    if (archiveRuns.length === 0) {
      archiveRowsEl.innerHTML = '<tr><td colspan="5">No archived runs found. Runs older than 31 days will appear here.</td></tr>';
      return;
    }

    archiveRowsEl.innerHTML = archiveRuns.map(run => {
      const domain = run.targetUrl
        ? `<a href="${run.targetUrl}" target="_blank" rel="noopener noreferrer">${getDomain(run.targetUrl)}</a>`
        : '-';

      // Archive: zip download only — no direct HTML report links for old runs
      const zipAsset  = (run.assets || []).find(a => a.file === 'report.zip');
      const zipPath   = zipAsset?.path || (run.id ? `reports/${run.id}/report.zip` : null);
      const zipLink   = (run.zipAvailable && zipPath)
        ? `<a href="./${zipPath}" download>Download ZIP (HTML &amp; JSON)</a>`
        : '-';

      const violations = run.totalViolations ?? '-';
      const violationsCell = typeof violations === 'number' && violations === 0
        ? `<span class="badge badge--zero">${violations}</span>`
        : typeof violations === 'number' && violations > 0
          ? `<span class="badge badge--warn">${violations}</span>`
          : violations;

      return `
        <tr>
          <td>${domain}</td>
          <td>${run.pagesScanned ?? '-'}</td>
          <td>${violationsCell}</td>
          <td>${formatDate(run.createdAt)}</td>
          <td><div class="asset-list">${zipLink}</div></td>
        </tr>
      `;
    }).join('');
  } catch (error) {
    archiveRowsEl.innerHTML = `<tr><td colspan="5">${error.message}</td></tr>`;
  }
}

loadArchive();
