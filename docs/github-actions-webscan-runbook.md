# GitHub Actions Web Scan Runbook

## Operating model

- **Mode:** queue-first
  - Public users submit scans through issue requests from the Pages dashboard.
  - Maintainers can still run manual `workflow_dispatch` scans from the Actions tab.
- **Execution model:**
  - On-demand scans (`workflow_dispatch`)
  - Scheduled scans (`cron` in `webscan-pages.yml`)

## Inputs and limits

Workflow inputs:
- `target_url`: required URL
- `crawl_depth`: bounded to `0-5`
- `max_pages`: bounded to `1-100`
- `report_type`: `summary` or `full`

Scanner controls:
- Same-domain crawling only
- Robots support enabled by default (`respect_robots=true`)
- Hard cap: 100 pages/run
- Per-request timeout: 60s max

## Security and abuse controls

- URL protocol restricted to HTTP/HTTPS.
- Private/internal hosts are blocked:
  - localhost/local/internal suffixes
  - private IPv4 ranges (10.x, 172.16-31.x, 192.168.x, loopback)
- Workflow concurrency group: `pages` (serializes Pages deployments).
- Queue path is label-gated (`scan-request`).

## Reports and publishing

Pages outputs:
- `gh-pages/data/latest.json` (latest summary)
- `gh-pages/data/history.json` (recent workflow history)
- `gh-pages/reports/<run_id>/` (run-level report bundle)

Artifacts:
- Uploaded as `webscan-<run_id>`
- Retention: 30 days

## Observability

- Workflow step summary includes run inputs.
- Recent runs are surfaced on GitHub Pages from `history.json`.
- Failure details are persisted in `summary.json` under `failures` with categories like:
  - `blocked_robots`
  - `timeout`
  - `fetch_error`
  - `scan_error`

## Queue operations

1. A user opens an issue from `scan-request.yml`.
2. `queue-scan-request.yml` validates fields from the issue body.
3. The workflow dispatches `webscan-pages.yml` with parsed inputs.
4. The issue receives `scan-queued` label and a tracking comment.

## Maintenance tasks

- Review scheduled-run success weekly from Actions history.
- Tune crawl depth/page caps based on runtime and signal quality.
- Review and prune old report folders if changing retention strategy.
