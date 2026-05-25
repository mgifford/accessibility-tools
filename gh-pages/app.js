const owner = 'mgifford';
const repo = 'accessibility-tools';

const targetUrlEl = document.getElementById('target-url');
const crawlDepthEl = document.getElementById('crawl-depth');
const maxPagesEl = document.getElementById('max-pages');
const reportTypeEl = document.getElementById('report-type');
const statusEl = document.getElementById('submit-status');
const queueBtnEl = document.getElementById('queue-btn');

const latestSummaryEl = document.getElementById('latest-summary');
const latestReportLinkEl = document.getElementById('latest-report-link');
const historyRowsEl = document.getElementById('history-rows');
const issuesApiUrl = `https://api.github.com/repos/${owner}/${repo}/issues`;
const initialIssuePollIntervalMs = 4000;
const maxIssuePollIntervalMs = 15000;
const issuePollTimeoutMs = 120000;
let issuePollTimer;

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

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function setStatus(content, variant = 'info') {
  statusEl.textContent = '';
  statusEl.dataset.variant = variant;

  if (typeof content === 'string') {
    statusEl.textContent = content;
    return;
  }

  statusEl.append(content);
}

function createStatusFragment(message, link) {
  const fragment = document.createDocumentFragment();
  fragment.append(message);

  if (link) {
    fragment.append(' ');
    const anchor = document.createElement('a');
    anchor.href = link.href;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    anchor.textContent = link.label;
    fragment.append(anchor);
  }

  return fragment;
}

function clearIssuePoll() {
  if (issuePollTimer) {
    window.clearTimeout(issuePollTimer);
    issuePollTimer = undefined;
  }

  queueBtnEl.disabled = false;
}

function getIssueField(body, label) {
  const re = new RegExp(`###\\s+${escapeRegExp(label)}\\s*\\n+([\\s\\S]*?)(?=\\n###\\s+|$)`, 'i');
  const match = body.match(re);
  return match?.[1]?.trim() || '';
}

function matchesScanIssue(issue, inputs, startedAt) {
  if (issue.pull_request || issue.title !== `Scan request: ${inputs.target_url}`) {
    return false;
  }

  const createdAt = Date.parse(issue.created_at || '');

  if (!Number.isFinite(createdAt) || createdAt < startedAt) {
    return false;
  }

  const body = issue.body || '';

  return (
    getIssueField(body, 'Target URL') === inputs.target_url &&
    getIssueField(body, 'Crawl depth') === inputs.crawl_depth &&
    getIssueField(body, 'Max pages') === inputs.max_pages &&
    getIssueField(body, 'Report type') === inputs.report_type
  );
}

async function findCreatedIssue(inputs, startedAt) {
  const response = await fetch(`${issuesApiUrl}?state=all&labels=scan-request&per_page=20&sort=created&direction=desc`, {
    headers: {
      Accept: 'application/vnd.github+json'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to check issue status: ${response.status}`);
  }

  const issues = await response.json();
  return issues.find(issue => matchesScanIssue(issue, inputs, startedAt));
}

function watchForCreatedIssue(inputs, startedAt) {
  clearIssuePoll();
  queueBtnEl.disabled = true;

  const pollStartedAt = Date.now();
  let attempt = 0;

  const schedulePoll = (delay) => {
    issuePollTimer = window.setTimeout(onPoll, delay);
  };

  const onPoll = async () => {
    try {
      const issue = await findCreatedIssue(inputs, startedAt);

      if (issue) {
        clearIssuePoll();
        setStatus(
          createStatusFragment('Scan request created successfully.', {
            href: issue.html_url,
            label: `Open issue #${issue.number}`
          }),
          'success'
        );
        return;
      }

      if (Date.now() - pollStartedAt >= issuePollTimeoutMs) {
        clearIssuePoll();
        setStatus(
          'GitHub issue form opened in a new tab. Once you submit it, refresh this page or check the Issues tab if the success link does not appear automatically.',
          'info'
        );
        return;
      }

      attempt += 1;
      schedulePoll(Math.min(initialIssuePollIntervalMs * 2 ** Math.min(attempt, 2), maxIssuePollIntervalMs));
    } catch (error) {
      clearIssuePoll();
      setStatus(error.message, 'error');
    }
  };

  setStatus('GitHub issue form opened in a new tab. Waiting for the new issue to appear…', 'info');
  schedulePoll(0);
}

function openIssueQueue() {
  const inputs = getInputs();

  if (!isValidUrl(inputs.target_url)) {
    setStatus('Please enter a valid http/https URL.', 'error');
    return;
  }

  const title = encodeURIComponent(`Scan request: ${inputs.target_url}`);
  const targetUrl = encodeURIComponent(inputs.target_url);
  const crawlDepth = encodeURIComponent(inputs.crawl_depth);
  const maxPages = encodeURIComponent(inputs.max_pages);
  const reportType = encodeURIComponent(inputs.report_type);
  const url = `https://github.com/${owner}/${repo}/issues/new?template=scan-request.yml&title=${title}&target_url=${targetUrl}&crawl_depth=${crawlDepth}&max_pages=${maxPages}&report_type=${reportType}`;
  const issueWindow = window.open('about:blank', '_blank');

  if (!issueWindow) {
    setStatus('Allow pop-ups for this page so the GitHub issue form can open.', 'error');
    return;
  }

  issueWindow.opener = null;
  issueWindow.location.replace(url);

  watchForCreatedIssue(inputs, Date.now());
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
    const rows = (data.runs || [])
      .filter(run => run.conclusion === 'success' || run.status !== 'completed')
      .slice(0, 20);

    historyRowsEl.innerHTML = rows
      .map(
        run => `
        <tr>
          <td>${run.runNumber}</td>
          <td>${run.status}${run.conclusion ? ` / ${run.conclusion}` : ''}</td>
          <td>${run.event || '-'}</td>
          <td>${formatDate(run.createdAt)}</td>
          <td>
            <a href="${run.htmlUrl}" target="_blank" rel="noopener noreferrer">View run</a>
            ${run.reportAvailable ? ` · <a href="./${run.reportUrl || `reports/${run.id}/report.html`}">HTML report</a>` : ''}
            · <a href="./reports.html">Assets</a>
          </td>
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

queueBtnEl.addEventListener('click', openIssueQueue);

loadLatestSummary();
loadHistory();
