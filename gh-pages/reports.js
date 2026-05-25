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
    const runs = (data.runs || []).filter(
      run => run.conclusion === 'success' || run.status !== 'completed'
    );

    summaryEl.innerHTML = `
      <article class="card">
        <strong>Generated</strong>
        <div>${formatDate(data.generatedAt)}</div>
      </article>
      <article class="card">
        <strong>Runs listed</strong>
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
          return `
            <tr>
              <td>${domain}</td>
              <td>${run.pagesScanned ?? '-'}</td>
              <td>${run.totalViolations ?? '-'}</td>
              <td>${formatDate(run.createdAt)}</td>
              <td><div class="asset-list">${renderReportLinks(run)}</div></td>
            </tr>
          `;
        }).join('')
      : '<tr><td colspan="5">No published reports found.</td></tr>';
  } catch (error) {
    summaryEl.innerHTML = `<article class="card">${error.message}</article>`;
    rowsEl.innerHTML = `<tr><td colspan="5">${error.message}</td></tr>`;
  }
}

loadReports();
