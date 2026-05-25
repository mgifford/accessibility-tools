const summaryEl = document.getElementById('reports-summary');
const rowsEl = document.getElementById('report-rows');

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function renderAssetLinks(run) {
  if (!run.reportAvailable) return '-';
  const links = (run.assets || [])
    .map(asset => `<a href="./${asset.path}">${asset.label}</a>`)
    .join(' · ');
  return links || '-';
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
      ? runs.map(run => `
          <tr>
            <td>${run.runNumber}</td>
            <td>${run.status}${run.conclusion ? ` / ${run.conclusion}` : ''}</td>
            <td>${formatDate(run.createdAt)}</td>
            <td><div class="asset-list">${renderAssetLinks(run)}</div></td>
            <td><a href="${run.htmlUrl}" target="_blank" rel="noopener noreferrer">View run</a></td>
          </tr>
        `).join('')
      : '<tr><td colspan="5">No published reports found.</td></tr>';
  } catch (error) {
    summaryEl.innerHTML = `<article class="card">${error.message}</article>`;
    rowsEl.innerHTML = `<tr><td colspan="5">${error.message}</td></tr>`;
  }
}

loadReports();
