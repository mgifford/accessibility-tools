# Clym Accessibility Tools

Clym’s Accessibility Testing Tools help you identify and fix parts of your website that may create difficulties for people with disabilities. Whether you’re managing content, building pages, or just checking in on your site’s performance, these tools make it easy to understand and improve accessibility.

## Features

1. Create projects and tests for your projects
2. Customize the test cases and remediations used for tests
3. Create and generate audit reports
4. Built with accessibility in mind; Customize the app to your liking

## Tech Stack

The app is built using Electron, with the following tech stack on top:

- Frontend: Next.js, React, Material UI
- Backend: Node.js, Sequelize, SQLite, [axe-core](https://github.com/dequelabs/axe-core)
- DevOps: CI/CD (GitLab)

## Setup

1. Download the project as a zip or clone it to your system
2. Open the terminal and move into the project directory, and install the required packages using:

   ```bash
   npm install
   ```

3. Run the project in dev mode using:

   ```bash
   npm run dev
   ```

   This will setup a sqlite file in the root directory only the first time, which will be used by the app for all its functions. Once that is set up, the app will be ready to use.

## Reporting Issues

We use **[GitHub Issues](https://github.com/clymio/accessibility-tools/issues)** to track and manage bugs. If you encounter a bug while using the **Accessibility Tools**, follow these steps to report it:

1. **Check Existing Issues**:
   Before creating an issue, visit the **[Issues page](https://github.com/clymio/accessibility-tools/issues)** to see if the bug has already been reported. If you find a matching issue, you can add additional details or a thumbs up reaction to indicate you are affected.
2. **Open a New Issue**:
   If the bug has not been reported, click **New Issue**.
3. **Provide Detailed Information**:
   Fill out the issue form with as much detail as possible:
   - **Summary**: A clear, concise description of the bug.
   - **Steps to Reproduce:** How we can recreate the issue step-by-step.
   - **Expected vs. Actual Behavior**: What you expected to happen and what actually happened.
   - **Screenshots or Logs**: Attach any relevant images, console output, or error messages.
   - **Environment**: Specify your operating system, app version, and any relevant configuration details.
4. **Submit and Track Progress**:
   Once submitted, your issue will be reviewed. You can track its progress on the **[Issues page](https://github.com/clymio/accessibility-tools/issues)** and will be notified of any updates or requests for more information.

## Documentation

For further information on how to use the app, please refer to our **[documentation](https://accessibility-tools.clym.io/)**.

## GitHub Pages + GitHub Actions scanning

This repository includes a GitHub Pages dashboard in `/gh-pages` and scanning workflows in `.github/workflows`.

### Pages deployment

- Workflow: `.github/workflows/deploy-pages.yml`
- Deploy trigger: push to `main` (and manual `workflow_dispatch`)
- Published artifact path: `/gh-pages`

### Web scan workflow

- Workflow: `.github/workflows/webscan-pages.yml`
- Triggers:
  - manual (`workflow_dispatch`) with inputs:
    - `target_url`
    - `crawl_depth` (0-5)
    - `max_pages` (1-100)
    - `report_type` (`summary` or `full`)
  - scheduled (`cron`)
- Scanner module: `/tools/webscan`
- Output:
  - Pages:
    - `gh-pages/data/latest.json`
    - `gh-pages/data/history.json`
    - `gh-pages/reports/<run_id>/...`
  - Artifact: `webscan-<run_id>` (30-day retention)

### URL submission paths

1. **Public queue (default)**
   - Open a scan request issue using `.github/ISSUE_TEMPLATE/scan-request.yml`.
   - Queue workflow: `.github/workflows/queue-scan-request.yml`
   - Issues labeled `scan-request` dispatch `webscan-pages.yml`.

2. **Maintainer dispatch (manual)**
   - Maintainers can still run `webscan-pages.yml` with `workflow_dispatch` from the Actions tab.

For operational details, see `/docs/github-actions-webscan-runbook.md`.

## Contributing

We welcome contributions! Please read our **[Contribution Guide](CONTRIBUTING.md)** for instructions on setting up your environment, submitting pull requests, and following our coding standards.

## Code of Conduct

This project follows a **[Code of Conduct](CODE_OF_CONDUCT.md)** to foster a welcoming and respectful community. Please read it before participating.

## License

This project is licensed under the **[MIT License](LICENSE)**.
