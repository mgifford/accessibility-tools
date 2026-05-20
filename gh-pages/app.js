const owner = 'mgifford';
const repo = 'accessibility-tools';

const targetUrlEl = document.getElementById('target-url');
const crawlDepthEl = document.getElementById('crawl-depth');
const maxPagesEl = document.getElementById('max-pages');
const reportTypeEl = document.getElementById('report-type');
const statusEl = document.getElementById('submit-status');

const latestSummaryEl = document.getElementById('latest-summary');
const latestReportLinkEl = document.getElementById('latest-report-link');
const historyRowsEl = document.getElementById('history-rows');

function getInputs() {
  return {
    target_url: targetUrlEl.value.trim(),
    crawl_depth: String(crawlDepthEl.value || '2'),
    max_pages: String(maxPagesEl.value || '25'),
    report_type: reportTypeEl.value || 'summary'
  };
}

function isValidUrl(url) {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.style.color = isError ? '#c62828' : '';
}

function openIssueQueue() {
  const inputs = getInputs();

  if (!isValidUrl(inputs.target_url)) {
    setStatus('Please enter a valid http/https URL.', true);
    return;
  }

  const title = encodeURIComponent(`Scan request: ${inputs.target_url}`);
  const targetUrl = encodeURIComponent(inputs.target_url);
  const crawlDepth = encodeURIComponent(inputs.crawl_depth);
  const maxPages = encodeURIComponent(inputs.max_pages);
  const reportType = encodeURIComponent(inputs.report_type);
  const url = `https://github.com/${owner}/${repo}/issues/new?template=scan-request.yml&title=${title}&target_url=${targetUrl}&crawl_depth=${crawlDepth}&max_pages=${maxPages}&report_type=${reportType}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

async function loadLatestSummary() {
  try {
    const response = await fetch('./data/latest.json', { cache: 'no-store' });
    if (!response.ok) throw new Error(`Failed to load summary: ${response.status}`);
    const data = await response.json();

    latestSummaryEl.innerHTML = `
      <div><strong>Target:</strong> ${data.targetUrl || '-'}</div>
      <div><strong>Generated:</strong> ${formatDate(data.generatedAt)}</div>
      <div><strong>Pages scanned:</strong> ${data.totals?.pagesScanned ?? 0}</div>
      <div><strong>Violations:</strong> ${data.totals?.totalViolations ?? 0}</div>
      <div><strong>Incomplete:</strong> ${data.totals?.totalIncomplete ?? 0}</div>
    `;
    latestReportLinkEl.href = './data/latest.json';
  } catch (error) {
    latestSummaryEl.textContent = error.message;
    latestReportLinkEl.href = '#';
  }
}

async function loadHistory() {
  try {
    const response = await fetch('./data/history.json', { cache: 'no-store' });
    if (!response.ok) throw new Error(`Failed to load history: ${response.status}`);
    const data = await response.json();
    const rows = (data.runs || []).slice(0, 20);

    historyRowsEl.innerHTML = rows
      .map(
        run => `
        <tr>
          <td>${run.runNumber}</td>
          <td>${run.status}${run.conclusion ? ` / ${run.conclusion}` : ''}</td>
          <td>${run.event || '-'}</td>
          <td>${formatDate(run.createdAt)}</td>
          <td><a href="${run.htmlUrl}" target="_blank" rel="noopener noreferrer">View run</a></td>
        </tr>
      `
      )
      .join('');

    if (rows.length === 0) {
      historyRowsEl.innerHTML = '<tr><td colspan="5">No runs found.</td></tr>';
    }
  } catch (error) {
    historyRowsEl.innerHTML = `<tr><td colspan="5">${error.message}</td></tr>`;
  }
}

document.getElementById('queue-btn').addEventListener('click', openIssueQueue);

loadLatestSummary();
loadHistory();
