# Testing Strategy

**Status:** Approved  
**Last Updated:** May 22, 2026  
**Related:** [CONSTITUTION.md](../CONSTITUTION.md) — Principles: **Self-Correcting**, **Reliable**, **Accessible**  
**Related:** [SECURITY_SPECIFICATION.md](SECURITY_SPECIFICATION.md), [API_SPECIFICATION.md](API_SPECIFICATION.md)

---

## Table of Contents

1. [Overview](#overview)
2. [Current State](#current-state)
3. [Technology Choices](#technology-choices)
4. [Test Pyramid](#test-pyramid)
5. [Unit Testing](#unit-testing)
6. [Component Testing](#component-testing)
7. [Integration Testing](#integration-testing)
8. [End-to-End Testing](#end-to-end-testing)
9. [Accessibility Testing](#accessibility-testing)
10. [Security Testing](#security-testing)
11. [Coverage Requirements](#coverage-requirements)
12. [CI/CD Integration](#cicd-integration)
13. [Implementation Roadmap](#implementation-roadmap)

---

## Overview

### Vision

Every line of code that affects test results, data integrity, or user workflows must be covered by automated tests. A contribution without tests is an untested assumption.

### Constitution Alignment

**Self-Correcting** (Principle 4):
> Automated tests detect regressions early. Logging and diagnostics for troubleshooting. Recovery procedures documented.

**Reliable** (Principle 7):
> Test reproducibility. Deterministic test execution. Critical paths have automated tests. Coverage targets enforced.

**Accessible** (Principle 3):
> WCAG violations block releases. Accessibility testing integrated into QA process.

### Scope

This strategy covers all testable code in the project:

| Layer | Technology | Test Type |
|-------|-----------|-----------|
| Main process backend | Node.js, Sequelize | Unit, Integration |
| Electron IPC handlers | Electron main | Integration |
| React UI components | Next.js, React, MUI | Component, Accessibility |
| Zustand stores | JavaScript | Unit |
| Utilities & helpers | Node.js | Unit |
| End-to-end flows | Electron app | E2E |
| Accessibility | axe-core, Playwright | Accessibility regression |
| Security | Validation logic | Unit, Security |

---

## Current State

### Baseline: Zero Coverage

As of May 2026, the project has **no automated tests** of any kind:

- ❌ No test files
- ❌ No test runner configured
- ❌ No coverage reports
- ❌ No test scripts in `package.json`
- ❌ No test step in CI/CD
- ❌ Existing Playwright (in `tools/webscan/`) is for scanning, not testing

This is the highest-risk gap in the codebase. **Every feature is an untested assumption.**

### Existing Quality Controls

- ✅ ESLint + Prettier (code style)
- ✅ Joi schema validation (runtime input validation)
- ✅ Sequelize model constraints (data integrity)
- ✅ GitHub PR review process
- ✅ Playwright-based webscan (functional accessibility scanning)

These are helpful but not substitutes for a test suite.

---

## Technology Choices

### Test Runner: Vitest

**Rationale:**
- Native ESM support (matches Next.js 14 + esbuild config)
- Compatible with the existing `import`/`export` module style
- Fast (runs in parallel, hot reloads)
- Familiar API (Jest-compatible)
- Works without transpilation for Node.js code
- Integration with `@vitest/coverage-v8`

**Alternatives Considered:**
- **Jest**: Requires ESM configuration or Babel transformation; more friction with Next.js 14
- **Mocha + Chai**: Flexible but no built-in coverage or React support
- **Playwright** (unit tests): Not designed for unit/integration tests

**Installation:**
```bash
npm install --save-dev vitest @vitest/coverage-v8
```

### Component Testing: Testing Library

**Rationale:**
- `@testing-library/react` is the standard for React component testing
- Tests user behavior, not implementation details
- Accessibility-first API (queries by role, label, etc.)
- Works with Vitest

```bash
npm install --save-dev @testing-library/react @testing-library/user-event @testing-library/jest-dom
```

### E2E Testing: Playwright

**Rationale:**
- Already present in `tools/webscan/package.json`
- Supports Electron applications
- Strong accessibility testing capabilities (axe-core integration)
- Cross-platform (Linux, macOS, Windows)
- Parallel execution, trace viewer, screenshot comparison

```bash
npm install --save-dev @playwright/test playwright-core
```

### Accessibility: axe-core + jest-axe / @axe-core/playwright

- **Component tests**: `jest-axe` / `vitest-axe` (run axe in component tests)
- **E2E tests**: `@axe-core/playwright` (run axe against full pages)
- **Already in project**: `axe-core` is a devDependency

```bash
npm install --save-dev vitest-axe @axe-core/playwright
```

---

## Test Pyramid

```
         ┌─────────────┐
         │     E2E     │  ~10%  Playwright full Electron flows
         │   (Slow)    │        Critical user journeys
         └──────┬──────┘
                │
     ┌──────────┴──────────┐
     │     Integration     │  ~20%  IPC handler + DB integration
     │     (Medium)        │        API contract validation
     └──────────┬──────────┘
                │
  ┌─────────────┴─────────────┐
  │     Unit / Component      │  ~70%  Pure functions, React components,
  │       (Fast)              │        Zustand stores, validation logic
  └───────────────────────────┘
```

### Priorities (Risk-Based)

Given zero coverage today, prioritize highest-risk areas first:

| Priority | Area | Risk | Why |
|----------|------|------|-----|
| P1 | Test execution logic | Critical | Incorrect results mislead accessibility decisions |
| P1 | Data integrity (DB models) | Critical | Data loss, silent corruption |
| P1 | Input validation | High | Security + correctness |
| P2 | IPC handlers | High | API contract reliability |
| P2 | Report generation | High | Incorrect reports damage credibility |
| P3 | React UI components | Medium | UX regressions, accessibility failures |
| P3 | Zustand stores | Medium | State management bugs |
| P4 | E2E critical flows | Medium | Regression detection for key workflows |

---

## Unit Testing

### Scope

All pure functions and isolated logic:

- Utility functions in `src/electron/lib/`
- Validation schemas (Joi)
- Data transformation helpers
- Sequelize model methods (where applicable)
- Zustand store logic
- Constants and configuration

### File Structure

```
src/
  electron/
    lib/
      testRunner.js
      testRunner.test.js         ← co-located tests
      axecore.js
      axecore.test.js
      landmarkRunner.js
      landmarkRunner.test.js
    actions/
      project.js
      project.test.js
      audit.js
      audit.test.js
  stores/
    useProjectStore.test.js
    useAuditFormStore.test.js
```

### Configuration

```javascript
// vitest.config.js
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',        // Default for backend code
    include: ['src/**/*.test.js'],
    exclude: ['src/pages/**', 'src/modules/**'],   // Component tests separately
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/electron/**/*.js'],
      exclude: ['src/electron/main/**', 'src/electron/preload/**'],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 60,
        statements: 70,
      }
    }
  }
});
```

### Example Tests

```javascript
// src/electron/lib/axecore.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildAxeConfig, parseAxeResults } from './axecore.js';

describe('buildAxeConfig', () => {
  it('should return valid axe config for wcag2aa standard', () => {
    const config = buildAxeConfig('wcag2aa');
    expect(config.runOnly).toBeDefined();
    expect(config.runOnly.type).toBe('tag');
    expect(config.runOnly.values).toContain('wcag2aa');
  });

  it('should include wcag2a when standard is wcag2aa', () => {
    const config = buildAxeConfig('wcag2aa');
    expect(config.runOnly.values).toContain('wcag2a');
  });

  it('should throw on unknown standard', () => {
    expect(() => buildAxeConfig('unknownStandard')).toThrow();
  });
});

describe('parseAxeResults', () => {
  it('should categorize violations, passes, and incomplete', () => {
    const mockResults = {
      violations: [{ id: 'color-contrast', impact: 'serious' }],
      passes: [{ id: 'document-title' }],
      incomplete: [{ id: 'label' }]
    };

    const parsed = parseAxeResults(mockResults);

    expect(parsed.violations).toHaveLength(1);
    expect(parsed.passes).toHaveLength(1);
    expect(parsed.incomplete).toHaveLength(1);
  });

  it('should return empty arrays when no results', () => {
    const parsed = parseAxeResults({ violations: [], passes: [], incomplete: [] });
    expect(parsed.violations).toHaveLength(0);
  });
});
```

```javascript
// src/electron/actions/project.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the database
vi.mock('../db/models', () => ({
  Project: {
    findAll: vi.fn(),
    create: vi.fn(),
    findByPk: vi.fn(),
  }
}));

import { find, create } from './project.js';
import { Project } from '../db/models';

describe('project.find', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should return all projects', async () => {
    Project.findAll.mockResolvedValue([
      { id: 'proj-1', name: 'Project One' }
    ]);

    const result = await find();
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Project One');
  });

  it('should return empty array when no projects exist', async () => {
    Project.findAll.mockResolvedValue([]);
    const result = await find();
    expect(result).toHaveLength(0);
  });
});

describe('project.create', () => {
  it('should create a project with valid data', async () => {
    const mockProject = { id: 'proj-1', name: 'My Project' };
    Project.create.mockResolvedValue(mockProject);

    const result = await create({ name: 'My Project', standard: 'wcag2aa' });
    expect(result.name).toBe('My Project');
  });

  it('should throw on missing required name', async () => {
    await expect(create({})).rejects.toThrow(/name/i);
  });

  it('should throw on invalid standard value', async () => {
    await expect(create({ name: 'Test', standard: 'invalid' })).rejects.toThrow(/standard/i);
  });
});
```

---

## Component Testing

### Scope

React components, pages, and hooks:

- Individual UI components
- Form validation behavior
- Zustand store interactions (mocked)
- IPC calls (mocked)
- Error states and loading states
- Keyboard navigation and ARIA compliance

### Configuration

```javascript
// vitest.config.components.js
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./test/setup.js'],
    include: ['src/**/*.component.test.jsx', 'src/modules/**/*.test.jsx'],
    coverage: {
      include: ['src/modules/**/*.jsx', 'src/pages/**/*.jsx'],
      thresholds: { lines: 60, functions: 60, branches: 50 }
    }
  }
});
```

```javascript
// test/setup.js
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Electron's window.api globally
global.window.api = {
  project: {
    find: vi.fn().mockResolvedValue([]),
    create: vi.fn().mockResolvedValue({}),
    update: vi.fn().mockResolvedValue({}),
    delete: vi.fn().mockResolvedValue({}),
  },
  // ... add as needed
};
```

### Example Tests

```javascript
// src/modules/dashboard/ProjectList.component.test.jsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import ProjectList from './ProjectList';

describe('ProjectList', () => {
  beforeEach(() => {
    window.api.project.find.mockResolvedValue([
      { id: 'proj-1', name: 'My Website', standard: 'wcag2aa' }
    ]);
  });

  it('should show loading state initially', () => {
    render(<ProjectList />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should list projects after loading', async () => {
    render(<ProjectList />);
    await waitFor(() => {
      expect(screen.getByText('My Website')).toBeInTheDocument();
    });
  });

  it('should show empty state when no projects', async () => {
    window.api.project.find.mockResolvedValue([]);
    render(<ProjectList />);
    await waitFor(() => {
      expect(screen.getByText(/no projects/i)).toBeInTheDocument();
    });
  });

  it('should be keyboard navigable', async () => {
    render(<ProjectList />);
    await waitFor(() => screen.getByText('My Website'));

    await userEvent.tab();
    expect(document.activeElement).toHaveAttribute('href');
  });
});
```

### Accessibility Component Tests

```javascript
// src/modules/dashboard/ProjectList.component.test.jsx
import { axe, toHaveNoViolations } from 'vitest-axe';
expect.extend(toHaveNoViolations);

it('should have no accessibility violations', async () => {
  const { container } = render(<ProjectList />);
  await waitFor(() => screen.getByText('My Website'));

  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

---

## Integration Testing

### Scope

IPC handler + database integration:

- Full request-response cycle for each IPC action
- Database operations with real SQLite (in-memory)
- Cascade behaviors (delete project cascades to environments, tests, etc.)
- Sequelize model constraints and validations
- Data integrity after complex operations

### Database Setup

```javascript
// test/helpers/db.js
import { Sequelize } from 'sequelize';
import { setupModels } from '../../src/electron/db/models';

export async function createTestDb() {
  const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: ':memory:',    // In-memory SQLite for tests
    logging: false,
  });

  await setupModels(sequelize);
  await sequelize.sync({ force: true });

  return sequelize;
}

export async function cleanupDb(sequelize) {
  await sequelize.close();
}
```

### Example Tests

```javascript
// src/electron/actions/project.integration.test.js
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTestDb, cleanupDb } from '../../test/helpers/db.js';
import * as projectActions from './project.js';

let db;

beforeEach(async () => {
  db = await createTestDb();
});

afterEach(async () => {
  await cleanupDb(db);
});

describe('Project CRUD integration', () => {
  it('should create and retrieve a project', async () => {
    const created = await projectActions.create({
      name: 'Integration Test Project',
      standard: 'wcag2aa'
    });

    const found = await projectActions.find();
    expect(found.some(p => p.id === created.id)).toBe(true);
  });

  it('should cascade delete environments when project deleted', async () => {
    const project = await projectActions.create({ name: 'Test', standard: 'wcag2aa' });
    await environmentActions.create({ projectId: project.id, name: 'Staging' });

    await projectActions.delete(project.id);

    const environments = await environmentActions.find({ projectId: project.id });
    expect(environments).toHaveLength(0);
  });

  it('should enforce unique project names', async () => {
    await projectActions.create({ name: 'Duplicate', standard: 'wcag2aa' });
    await expect(
      projectActions.create({ name: 'Duplicate', standard: 'wcag2aa' })
    ).rejects.toThrow();
  });
});
```

---

## End-to-End Testing

### Scope

Critical user journeys through the actual Electron app:

1. Create project → configure environment → run test → view results
2. Manage test cases and remediations
3. Generate and export audit report
4. Settings persistence across app restarts
5. Error recovery (corrupted DB, network failure, test timeout)

### Playwright Electron Configuration

```javascript
// playwright.config.js
import { defineConfig } from '@playwright/test';
import path from 'path';

export default defineConfig({
  testDir: 'e2e',
  timeout: 60000,
  retries: 1,
  workers: 1,             // Electron requires serial execution
  reporter: [
    ['html', { open: 'never' }],
    ['json', { outputFile: 'e2e-results.json' }]
  ],
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  }
});
```

```javascript
// e2e/helpers/electron.js
import { _electron as electron } from 'playwright';
import path from 'path';

export async function launchApp() {
  const app = await electron.launch({
    args: [path.resolve(__dirname, '../../main.js')],
    env: {
      ...process.env,
      NODE_ENV: 'test',
      DB_PATH: ':memory:',       // Use in-memory DB for E2E
    }
  });

  const window = await app.firstWindow();
  return { app, window };
}
```

### Example E2E Tests

```javascript
// e2e/create-project.spec.js
import { test, expect } from '@playwright/test';
import { launchApp } from './helpers/electron.js';

test.describe('Create Project Flow', () => {
  let app, window;

  test.beforeEach(async () => {
    ({ app, window } = await launchApp());
  });

  test.afterEach(async () => {
    await app.close();
  });

  test('should create a project and navigate to it', async () => {
    await window.getByRole('button', { name: /new project/i }).click();
    await window.getByLabel('Project Name').fill('E2E Test Project');
    await window.getByRole('combobox', { name: /standard/i }).selectOption('wcag2aa');
    await window.getByRole('button', { name: /create/i }).click();

    await expect(window.getByText('E2E Test Project')).toBeVisible();
  });

  test('should show validation error for empty project name', async () => {
    await window.getByRole('button', { name: /new project/i }).click();
    await window.getByRole('button', { name: /create/i }).click();

    await expect(window.getByText(/name is required/i)).toBeVisible();
  });
});
```

---

## Accessibility Testing

### Multi-Layer Strategy

Accessibility testing happens at every level:

| Level | Tool | What | When |
|-------|------|------|------|
| Component | `vitest-axe` | ARIA, semantics, contrast | Unit/Component CI |
| Page | `@axe-core/playwright` | Full page axe scan | E2E CI |
| Keyboard | Testing Library `userEvent` | Tab order, focus management | Component CI |
| Screen Reader | Manual + Playwright | NVDA/VoiceOver compat | Pre-release |
| Color Contrast | axe rules | Contrast ratios | Component + E2E CI |

### Automated Accessibility in E2E

```javascript
// e2e/accessibility.spec.js
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { launchApp } from './helpers/electron.js';

test.describe('Accessibility - WCAG 2.1 AA Compliance', () => {
  test('Dashboard page should have no critical violations', async () => {
    const { window } = await launchApp();

    const accessibilityScanResults = await new AxeBuilder({ page: window })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    const critical = accessibilityScanResults.violations.filter(
      v => v.impact === 'critical' || v.impact === 'serious'
    );
    
    expect(critical).toHaveLength(0);
  });

  test('Create Project form should be keyboard accessible', async () => {
    const { window } = await launchApp();
    await window.getByRole('button', { name: /new project/i }).click();

    // Tab through form fields
    const fieldsInOrder = [];
    let currentElement = await window.locator(':focus').first();

    for (let i = 0; i < 5; i++) {
      await window.keyboard.press('Tab');
      const el = await window.locator(':focus').first();
      fieldsInOrder.push(await el.getAttribute('name') || await el.textContent());
    }

    // Verify tab order is logical
    expect(fieldsInOrder[0]).toMatch(/name/i);
  });
});
```

### Accessibility Blocking Policy

The following accessibility failures **block release**:

| Impact | axe Classification | Policy |
|--------|-------------------|--------|
| Critical | critical | ❌ Blocks all merges |
| Serious | serious | ❌ Blocks all merges |
| Moderate | moderate | ⚠️ Blocks minor/major releases |
| Minor | minor | 📋 Tracked in issues |

---

## Security Testing

See [SECURITY_SPECIFICATION.md](SECURITY_SPECIFICATION.md) for full requirements.

### Security Test Suite

```javascript
// test/security/validation.test.js
import { describe, it, expect } from 'vitest';
import { validateFilePath, validateTestUrl, validateProjectName } from '../src/electron/lib/validation.js';

describe('Security: Input Validation', () => {
  describe('File Path Validation', () => {
    it('should block path traversal', () => {
      expect(() => validateFilePath('../../../etc/passwd')).toThrow(/traversal/i);
    });
    it('should accept valid paths', () => {
      expect(() => validateFilePath('projects/my-project.json')).not.toThrow();
    });
  });

  describe('URL Validation', () => {
    it('should block javascript: protocol', () => {
      expect(() => validateTestUrl('javascript:alert(1)')).toThrow(/protocol/i);
    });
    it('should allow https:', () => {
      expect(() => validateTestUrl('https://example.com')).not.toThrow();
    });
  });
});
```

---

## Coverage Requirements

### Targets by Layer

| Layer | Lines | Functions | Branches | Priority |
|-------|-------|-----------|----------|----------|
| Core test logic (`lib/testRunner.js`, `lib/axecore.js`) | 80% | 80% | 70% | P1 |
| IPC Actions (`actions/`) | 70% | 70% | 60% | P1 |
| Database models (`db/models/`) | 60% | 60% | 50% | P2 |
| React components (`modules/`, `pages/`) | 60% | 60% | 50% | P2 |
| Zustand stores (`stores/`) | 70% | 70% | 60% | P2 |
| Security validation | 90% | 90% | 80% | P1 |
| Utilities (`lib/*.js`) | 80% | 80% | 70% | P2 |
| **Overall minimum** | **70%** | **70%** | **60%** | |

### Coverage Gates

- **PR merges**: Must not decrease overall coverage
- **New code**: All new functions/branches must have tests
- **Critical paths** (test execution, DB mutations): Must maintain 80%+

---

## CI/CD Integration

### GitHub Actions Workflow

Add test step to existing CI/CD:

```yaml
# .github/workflows/test.yml
name: Tests

on:
  push:
    branches: [master]
  pull_request:
    branches: [master]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run test:unit
      - run: npm run test:coverage
      - uses: actions/upload-artifact@v4
        with:
          name: coverage-report
          path: coverage/

  component-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run test:components

  accessibility-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run test:a11y

  e2e-tests:
    runs-on: ubuntu-latest
    needs: [unit-tests, component-tests]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

### npm Scripts

Add to `package.json`:

```json
{
  "scripts": {
    "test": "npm run test:unit && npm run test:components",
    "test:unit": "vitest run --config vitest.config.js",
    "test:components": "vitest run --config vitest.config.components.js",
    "test:a11y": "vitest run --config vitest.config.a11y.js",
    "test:e2e": "playwright test",
    "test:coverage": "vitest run --coverage --config vitest.config.js",
    "test:watch": "vitest --config vitest.config.js",
    "test:security": "vitest run test/security/"
  }
}
```

---

## Implementation Roadmap

### Phase 1 — Foundation (Sprint 1-2)

**Goal**: Get to testable code and establish infrastructure.

- [ ] **Install test frameworks**
  - `vitest` + `@vitest/coverage-v8`
  - `@testing-library/react` + `@testing-library/user-event`
  - `jsdom` (for component tests)
- [ ] **Configure Vitest** for unit and component tests
- [ ] **Create test helpers**
  - In-memory SQLite setup
  - Mock factory for `window.api`
  - Common fixtures
- [ ] **Add test scripts** to `package.json`
- [ ] **Add CI workflow** (`.github/workflows/test.yml`)

**Deliverable**: Test infrastructure ready; CI running (0% coverage, building OK)

---

### Phase 2 — Core Logic Coverage (Sprint 3-5)

**Goal**: Cover highest-risk code with unit tests.

- [ ] **Test runner logic** — `lib/testRunner.js`
  - axe execution, result parsing
  - Error handling, timeouts
  - All code paths
- [ ] **axe-core integration** — `lib/axecore.js`
  - Config building per standard
  - Result normalization
- [ ] **IPC Actions (P1)** — `actions/*.js`
  - project, environment, environmentTest
  - Input validation (success + all error cases)
  - Database interaction (mocked)
- [ ] **Input Validation / Security** — validation helpers
  - Path traversal, URL injection, type coercion
  - Target: 90% coverage

**Deliverable**: 50%+ coverage on core logic; security tests passing

---

### Phase 3 — Integration Coverage (Sprint 6-8)

**Goal**: Integration tests with real database.

- [ ] **Database integration tests**
  - All 18 main models (CRUD)
  - Cascade delete behaviors
  - Constraint violations
  - Migration verification
- [ ] **IPC handler integration**
  - Full request-response cycles
  - Error propagation from DB to handler
- [ ] **System data integrity**
  - Verify `systemData.json` loads correctly
  - All WCAG criteria, standards, categories present

**Deliverable**: 70% overall coverage; CI green on all tests

---

### Phase 4 — Component & Accessibility Coverage (Sprint 9-11)

**Goal**: UI correctness and accessibility guarantees.

- [ ] **React component tests** (modules/ and pages/)
  - Loading, success, error states
  - Form validation behavior
  - Keyboard navigation
  - IPC mock integration
- [ ] **Accessibility component tests**
  - axe scan on every page component
  - ARIA compliance verification
  - Screen reader text validation
- [ ] **Zustand store tests**

**Deliverable**: Accessibility violations block CI; component coverage at 60%+

---

### Phase 5 — E2E Coverage (Sprint 12+)

**Goal**: Critical flow regression protection.

- [ ] **Playwright E2E setup** (Electron integration)
- [ ] **Critical paths**
  - Project creation → test run → results viewing
  - Report generation and export
  - Settings persistence
- [ ] **Full accessibility E2E**
  - All pages pass axe WCAG 2.1 AA
  - Complete keyboard navigation test
- [ ] **Performance baseline**
  - Startup time < 5s
  - Test run completion metrics

**Deliverable**: Full test pyramid complete; all CI gates enforced

---

## Contribution Requirements

### Every PR Must

- ✅ Include tests for all new functions and branches
- ✅ Not decrease total coverage (CI enforced)
- ✅ Pass all existing tests (`npm test`)
- ✅ Pass accessibility tests for any UI changes
- ✅ Pass security tests for any validation/IPC changes
- ✅ Include test file names in PR description

### Test Quality Standards

- Tests document *behavior*, not implementation details
- Each test has one clear assertion focus
- Use descriptive `describe` and `it` names: readable as documentation
- Avoid `any` or overly broad mocks
- Test error cases as thoroughly as success cases
- Accessibility assertions must be specific (`toHaveRole`, `toHaveAccessibleName`)

---

## Related Specifications

| Document | Relevance |
|----------|-----------|
| [CONSTITUTION.md](../CONSTITUTION.md) | Self-Correcting, Reliable, Accessible principles |
| [SECURITY_SPECIFICATION.md](SECURITY_SPECIFICATION.md) | Security test requirements |
| [API_SPECIFICATION.md](API_SPECIFICATION.md) | IPC contract validation |
| [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) | Integration test scope |

---

**Version:** 1.0  
**Status:** Active  
**Last Review:** May 22, 2026  
**Next Review:** August 22, 2026
