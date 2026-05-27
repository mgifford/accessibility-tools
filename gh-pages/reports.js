const summaryEl = document.getElementById('reports-summary');
const rowsEl = document.getElementById('report-rows');

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

function renderReportLinks(run) {
  if (!run.reportAvailable) return '-';
  const htmlAsset = (run.assets || []).find(a => a.file === 'report.html');
  const zipAsset = (run.assets || []).find(a => a.file === 'report.zip');
  const links = [];
  if (htmlAsset) links.push(`<a href="./${htmlAsset.path}">HTML report</a>`);
  if (zipAsset && run.zipAvailable) links.push(`<a href="./${zipAsset.path}" download>Download ZIP</a>`);
  return links.join(' · ') || '-';
}

async function loadReports() {
  try {
    const response = await fetch('./data/report-index.json', { cache: 'no-store' });
    if (!response.ok) throw new Error(`Failed to load reports: ${response.status}`);
    const data = await response.json();

    const cutoff = Date.now() - 31 * 24 * 60 * 60 * 1000;

    const allRuns = (data.runs || []).filter(
      run => run.conclusion === 'success' || run.status !== 'completed'
    );

    const runs = allRuns.filter(run => {
      const ts = run.createdAt ? new Date(run.createdAt).getTime() : 0;
      return !run.createdAt || ts >= cutoff;
    });

    const archiveCount = allRuns.filter(run => {
      const ts = run.createdAt ? new Date(run.createdAt).getTime() : 0;
      return run.createdAt && ts < cutoff;
    }).length;

    summaryEl.innerHTML = `
      <article class="card card--accent-blue">
        <strong>Generated</strong>
        <div>${formatDate(data.generatedAt)}</div>
      </article>
      <article class="card card--accent-teal">
        <strong>Runs listed (31 days)</strong>
        <div>${runs.length}</div>
      </article>
      <article class="card">
        <strong>Latest report</strong>
        <div><a href="./${data.latestReportUrl || 'reports/latest/report.html'}">Open latest HTML report</a></div>
      </article>
    `;

    rowsEl.innerHTML = runs.length > 0
      ? runs.map(run => {
          const domain = run.targetUrl
            ? `<a href="${run.targetUrl}" target="_blank" rel="noopener noreferrer">${getDomain(run.targetUrl)}</a>`
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
              <td><div class="asset-list">${renderReportLinks(run)}</div></td>
            </tr>
          `;
        }).join('')
      : '<tr><td colspan="5">No published reports in the last 31 days.</td></tr>';

    if (archiveCount > 0) {
      const banner = document.createElement('div');
      banner.className = 'archive-banner';
      banner.innerHTML = `
        <span><strong>${archiveCount}</strong> older report${archiveCount === 1 ? '' : 's'} (more than 31 days ago) are not listed here.</span>
        <a href="./archive.html" class="btn btn-secondary">View archive</a>
      `;
      rowsEl.closest('section').insertBefore(banner, rowsEl.closest('.table-wrapper'));
    }
  } catch (error) {
    summaryEl.innerHTML = `<article class="card">${error.message}</article>`;
    rowsEl.innerHTML = `<tr><td colspan="5">${error.message}</td></tr>`;
  }
}

loadReports();
