# Development Standards

**Status:** Approved  
**Last Updated:** May 22, 2026  
**Related:** [CONSTITUTION.md](../CONSTITUTION.md) — Principles: **Sustainable**, **Self-Correcting**, **Reliable**  
**Related:** [TESTING_STRATEGY.md](TESTING_STRATEGY.md), [API_SPECIFICATION.md](API_SPECIFICATION.md)

---

## Table of Contents

1. [Overview](#overview)
2. [Code Style & Formatting](#code-style--formatting)
3. [Naming Conventions](#naming-conventions)
4. [Directory & File Structure](#directory--file-structure)
5. [Module Patterns](#module-patterns)
6. [Component Patterns](#component-patterns)
7. [State Management (Zustand)](#state-management-zustand)
8. [Backend: Lib Layer Pattern](#backend-lib-layer-pattern)
9. [Backend: IPC Action Pattern](#backend-ipc-action-pattern)
10. [Import Conventions](#import-conventions)
11. [Error Handling](#error-handling)
12. [Database Patterns](#database-patterns)
13. [Constants & Configuration](#constants--configuration)
14. [Accessibility Standards](#accessibility-standards)
15. [Performance Guidelines](#performance-guidelines)
16. [Documentation Standards](#documentation-standards)

---

## Overview

These standards define how code is written, organized, and reviewed in this project. Following them keeps the codebase consistent, approachable, and maintainable as the team grows.

### Constitution Alignment

**Sustainable** (Principle 5):
> Clear separation of concerns. Well-documented decision rationale. Code organization that enables contribution.

**Self-Correcting** (Principle 4):
> Comprehensive error handling with clear messages. Validation of inputs and data integrity checks. Logging and diagnostics for troubleshooting.

**Reliable** (Principle 7):
> Deterministic test execution. Data integrity validation before and after operations. Error recovery and retry logic.

---

## Code Style & Formatting

### Enforced by ESLint + Prettier

Run before every commit:

```bash
npm run lint
```

### Rules in Effect

| Rule | Value | Reason |
|------|-------|--------|
| **Indentation** | 2 spaces | Compact, readable |
| **Quotes** | Single (`'`) | Consistent across JS and JSX |
| **JSX Quotes** | Single | Match JS quotes |
| **Semicolons** | Required | Clarity at line endings |
| **Trailing commas** | None | Cleaner diffs |
| **Brace style** | 1TBS (same line) | Common JS standard |
| **Max statements/line** | 3 | Readability |

### ESLint Config

`@stylistic/eslint-plugin` + `next/core-web-vitals` rules.

Notable disabled rules (do not re-enable without an ADR):
- `react-hooks/exhaustive-deps` — disabled, managed manually
- `react-hooks/rules-of-hooks` — disabled, use hooks responsibly
- `import/no-anonymous-default-export` — disabled, default exports are standard here

---

## Naming Conventions

### Files and Folders

| Artifact | Convention | Example |
|----------|-----------|---------|
| Zustand store | `use<Name>Store.js` | `useProjectStore.js` |
| React component | `<Name>.component.jsx` | `Dialog.component.jsx` |
| Component styles | `<Name>.module.scss` | `Dialog.module.scss` |
| Component barrel | `index.js` | `Dialog/index.js` |
| Electron lib | `<name>.js` (camelCase) | `project.js` |
| IPC action file | `<name>.js` (camelCase) | `project.js` |
| Page (Next.js) | `<name>.jsx` (lowercase) | `settings.jsx` |
| Dynamic route | `[<param>].jsx` | `[project].jsx` |
| Test file (unit) | `<name>.test.js` | `project.test.js` |
| Test file (component) | `<name>.component.test.jsx` | `Dialog.component.test.jsx` |
| Constants file | `<area>.js` (camelCase) | `accessibility.js` |

### Variables and Functions

| Type | Convention | Example |
|------|-----------|---------|
| Variables | `camelCase` | `projectName`, `testResults` |
| Constants | `SCREAMING_SNAKE_CASE` | `DEFAULT_THEME`, `MAX_RETRY_COUNT` |
| Functions | `camelCase` verbs | `createProject`, `findAllTests` |
| React components | `PascalCase` | `ProjectCard`, `AuditReport` |
| Classes | `PascalCase` + `Lib` suffix | `ProjectLib`, `AuditLib` |
| Zustand stores | `use<Name>Store` | `useProjectStore` |
| Boolean variables | `is`/`has`/`can` prefix | `isLoading`, `hasError`, `canDelete` |
| Event handlers | `handle<Event>` | `handleSubmit`, `handleDelete` |

### IPC Channel Names

Format: `<domain>:<verb>` using lowercase and camelCase

```javascript
'project:find'         // List resources
'project:read'         // Get single resource by ID
'project:create'       // Create new resource
'project:update'       // Update existing resource
'project:delete'       // Delete resource
'environmentTest:generateReport'   // Domain-specific action (camelCase verb)
'system:exit'          // System-level events
```

---

## Directory & File Structure

```
src/
  assets/
    icons/             ← SVG icons, exported from index.js
  constants/           ← Named exports only, grouped by domain
  electron/
    actions/           ← IPC handlers (one file per domain entity)
    db/
      models/          ← Sequelize models
        system/        ← System/reference data models (prefixed system_)
      migrations/      ← Sequelize migrations (versioned)
      systemData.json  ← Built-in reference data
    lib/               ← Business logic classes (PascalCase + Lib suffix)
    main/              ← Electron main process entry
    preload/           ← IPC bridge (contextBridge whitelist)
  handlers/            ← Specialized event handlers
  hooks/               ← Shared React hooks
  modules/
    core/              ← Design system, shared UI primitives
    dashboard/         ← Feature page modules
    eula/              ← EULA UI module
    report/            ← Report generation UI
  pages/               ← Next.js routes (thin wrappers only)
    audits/
    projects/
  shared/
    webscan/           ← Shared webscan utilities
  stores/              ← Zustand state stores
  styles/              ← Global CSS
```

### Module Folder Structure

Each feature module in `src/modules/` follows:

```
ModuleName/
  ModuleName.component.jsx   ← Main component with logic + markup
  ModuleName.module.scss     ← Scoped CSS modules
  index.js                   ← Re-exports default for clean imports
  SubFeature/                ← Nested sub-features follow same pattern
    SubFeature.component.jsx
    SubFeature.module.scss
    index.js
```

---

## Module Patterns

### Page Files (Thin Wrappers)

Pages in `src/pages/` are intentionally minimal — no logic, no state:

```jsx
// src/pages/settings.jsx
import Layout from '@/modules/core/Layout';
import SettingsPage from '../modules/dashboard/SettingsPage';

export default function Settings() {
  return <Layout page={SettingsPage} removeContentPadding={true} />;
}
```

**Rule:** All real UI logic belongs in `src/modules/`, never in `src/pages/`.

### Barrel Index Files

Component barrels export the default component cleanly:

```javascript
// src/modules/dashboard/SettingsPage/index.js
import SettingsPage from './SettingsPage.component';
export default SettingsPage;
```

Store barrels re-export all named hooks:

```javascript
// src/stores/index.js
export * from './useProjectStore';
export * from './useAuditStore';
// ...
```

Action barrels are side-effect only (imports register IPC handlers):

```javascript
// src/electron/actions/index.js
import './project';
import './environment';
import './audit';
// ... no exports
```

---

## Component Patterns

### Standard Component Structure

```jsx
// src/modules/dashboard/ProjectCard/ProjectCard.component.jsx
import { useState } from 'react';
import styles from './ProjectCard.module.scss';

// ✓ Named imports from constants, not inline strings
import { PROJECT_STATUS } from '@/constants/project';

export default function ProjectCard({ project, onDelete }) {
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    setIsDeleting(true);
    try {
      await window.api.project.delete(project.id);
      onDelete(project.id);
    } catch (error) {
      console.error('Failed to delete project:', error);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <article className={styles.card} aria-label={`Project: ${project.name}`}>
      <h2>{project.name}</h2>
      <button
        onClick={handleDelete}
        disabled={isDeleting}
        aria-busy={isDeleting}
      >
        {isDeleting ? 'Deleting...' : 'Delete'}
      </button>
    </article>
  );
}
```

### Component Guidelines

1. **One component per file** — no multiple components in one file
2. **Default export only** — never named exports for components
3. **Props destructured** in function signature
4. **Event handlers** prefixed `handle<Event>`
5. **Async handlers** include loading state with `is<Action>` boolean
6. **Errors logged** to console, not swallowed silently
7. **ARIA attributes** required for interactive elements

### Loading and Error States

Every component that fetches data must have three states:

```jsx
function ProjectList() {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    window.api.project.find()
      .then(setProjects)
      .catch(setError)
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return <LoadingSpinner aria-label="Loading projects" />;
  if (error) return <ErrorAlert message={error.message} />;
  if (!projects.length) return <EmptyState message="No projects yet" />;

  return (/* list */);
}
```

---

## State Management (Zustand)

### Store Structure

```javascript
// src/stores/useProjectStore.js
import { create } from 'zustand';

// ✓ Always extract initialState as a named const
const initialState = {
  projects: [],
  selectedProject: null,
  isLoading: false,
  error: null,
};

export const useProjectStore = create((set) => ({
  ...initialState,

  // Setters use set<FieldName> convention
  setProjects: (projects) => set({ projects }),
  setSelectedProject: (project) => set({ selectedProject: project }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  // ✓ Always include reset() using initialState
  reset: () => set(initialState),
}));
```

### Store Rules

1. **Extract `initialState`** — enables clean `reset()` implementation
2. **Setter naming** — `set<FieldName>` for simple fields
3. **Always include `reset()`** — required for cleanup on navigation/unmount
4. **Complex updates** use functional form: `set(s => ({ ...s, nested: { ...s.nested, field: val } }))`
5. **No business logic** in stores — stores hold state, components/hooks do logic
6. **Async IPC calls** may live in stores but must handle errors
7. **Nonce pattern** for re-fetch triggers:

```javascript
// Use incrementing nonce to trigger useEffect re-fetch
const initialState = { items: [], listNonce: 0 };

export const useItemStore = create((set) => ({
  ...initialState,
  // Trigger component re-fetch by incrementing nonce
  triggerRefresh: () => set((s) => ({ listNonce: s.listNonce + 1 })),
  reset: () => set(initialState),
}));

// In component:
const { listNonce } = useItemStore();
useEffect(() => {
  fetchItems();
}, [listNonce]); // Re-runs when nonce increments
```

---

## Backend: Lib Layer Pattern

### Class Structure

All backend business logic is encapsulated in `*Lib` classes with static async methods:

```javascript
// src/electron/lib/project.js
import Joi from 'joi';
import { joiLib } from './core/joi';
import { getModel } from './core/model';

class ProjectLib {

  // ✓ Standard method signature: (input = {}, opt = {})
  static async find(input = {}, opt = {}) {
    const schema = joiLib.schema(() => Joi.object({
      search: Joi.string().optional(),
      page: Joi.metaPage(),
      limit: Joi.metaLimit(),
    }));

    const data = await joiLib.validate(schema, input);

    try {
      const Project = getModel('project');
      const result = await Project.findAll(
        ProjectLib.buildQuery(data, opt)
      );
      return CoreLib.paginateResult(result);
    } catch (e) {
      console.log('Error finding projects:', e);
    }
  }

  static async create(input = {}, opt = {}) {
    const schema = joiLib.schema(() => Joi.object({
      name: Joi.string().min(1).max(255).required(),
      description: Joi.string().max(1000).optional(),
      standard: Joi.string().valid('wcag2a', 'wcag2aa', 'wcag2aaa').required(),
    }));

    const data = await joiLib.validate(schema, input);

    try {
      const Project = getModel('project');
      const project = await Project.create(data);
      // ✓ Always .toJSON() before returning across IPC
      return project.toJSON();
    } catch (e) {
      console.log('Error creating project:', e);
    }
  }
}

export default ProjectLib;
```

### Lib Layer Rules

1. **All methods are `static async`** — no instance state
2. **Signature is always `(input = {}, opt = {})`** — default empty objects
3. **Validate with Joi before DB access** — no raw input ever reaches the DB
4. **Use `joiLib.schema()` + `joiLib.validate()`** — not raw `Joi.object().validate()`
5. **Use `getModel('name')`** — model registry, not direct Sequelize imports
6. **Return `.toJSON()`** — serialize Sequelize instances before returning across IPC
7. **`try/catch` wraps DB operations** — log errors, return `undefined` on failure
8. **Errors logged with `console.log`** — not thrown (IPC callers handle undefined returns)
9. **Use `CoreLib.paginateQuery` / `CoreLib.paginateResult`** — standard pagination for all list methods

### Custom Joi Extensions

The project extends Joi with custom types. Always use these:

```javascript
Joi.id()           // UUID validation
Joi.url()          // URL string validation
Joi.enum(values)   // String enum validation
Joi.metaSearch()   // Search string with sanitization
Joi.metaPage()     // Pagination page number (integer >= 1)
Joi.metaLimit()    // Pagination limit (integer 1–100)
```

---

## Backend: IPC Action Pattern

### Action File Structure

```javascript
// src/electron/actions/project.js
import { ipcMain } from 'electron';
import ProjectLib from '../lib/project';

// ✓ Thin delegation — actions never contain logic
ipcMain.handle('project:find',   (_, data, opt) => ProjectLib.find(data, opt));
ipcMain.handle('project:read',   (_, data, opt) => ProjectLib.read(data, opt));
ipcMain.handle('project:create', (_, data, opt) => ProjectLib.create(data, opt));
ipcMain.handle('project:update', (_, data, opt) => ProjectLib.update(data, opt));
ipcMain.handle('project:delete', (_, data, opt) => ProjectLib.delete(data, opt));
```

### Action Rules

1. **One file per domain entity** — same name as lib file
2. **No logic in actions** — delegate immediately to `*Lib` method
3. **`ipcMain.handle`** for request-response (async, returns value)
4. **`ipcMain.on`** only for fire-and-forget events (no return value needed)
5. **Three arguments**: `(event, data, opt)` — event unused, data is input, opt is options
6. **No named exports** — action files are side-effect only; imported in `actions/index.js`

### Preload Bridge Pattern

Expose IPC calls via whitelist in `src/electron/preload/index.js`:

```javascript
// ✓ Explicit whitelist — no dynamic exposure
contextBridge.exposeInMainWorld('api', {
  project: {
    find:   (data, opt) => ipcRenderer.invoke('project:find',   data, opt),
    read:   (data, opt) => ipcRenderer.invoke('project:read',   data, opt),
    create: (data, opt) => ipcRenderer.invoke('project:create', data, opt),
    update: (data, opt) => ipcRenderer.invoke('project:update', data, opt),
    delete: (data, opt) => ipcRenderer.invoke('project:delete', data, opt),
  }
});
```

---

## Import Conventions

### Path Alias

`@/` resolves to `src/` (configured in `jsconfig.json`):

```javascript
// ✓ Use @/ for cross-module imports
import Layout from '@/modules/core/Layout';
import { useProjectStore } from '@/stores';
import { PROJECT_STATUS } from '@/constants/project';

// ✓ Use relative paths within the same module folder
import styles from './ProjectCard.module.scss';
import DeleteDialog from '../DeleteDialog';
```

### Module Style

Use ES module syntax throughout:

```javascript
// ✓ ES modules (standard)
import { ipcMain } from 'electron';
import ProjectLib from '../lib/project';
export default ProjectLib;

// ✗ CommonJS (avoid in new code)
const { ipcMain } = require('electron');
module.exports = ProjectLib;
```

**Exception**: `require()` may be present in older files or Electron-specific contexts. Do not break existing code when refactoring.

### Import Order

Group imports in this order (enforced by ESLint):

```javascript
// 1. Node built-ins
import path from 'path';
import fs from 'fs';

// 2. External packages
import { ipcMain } from 'electron';
import Joi from 'joi';

// 3. Internal absolute (using @/ alias)
import { useProjectStore } from '@/stores';
import { PROJECT_STATUS } from '@/constants/project';

// 4. Internal relative
import styles from './Component.module.scss';
import ChildComponent from './ChildComponent';
```

---

## Error Handling

### Frontend (React Components)

```javascript
// ✓ Three-state pattern: loading, error, success
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState(null);

async function handleSubmit(data) {
  setIsLoading(true);
  setError(null); // Clear previous errors
  try {
    await window.api.project.create(data);
  } catch (err) {
    setError(err.message || 'An unexpected error occurred');
    console.error('Failed to create project:', err);
  } finally {
    setIsLoading(false);
  }
}
```

### Backend (Lib Methods)

```javascript
// ✓ Validate first, then try/catch around DB ops
static async create(input = {}, opt = {}) {
  const data = await joiLib.validate(schema, input); // Throws on invalid input

  try {
    const Model = getModel('project');
    return (await Model.create(data)).toJSON();
  } catch (e) {
    console.log('Error in ProjectLib.create:', e);
    // Returns undefined — IPC caller handles null/undefined results
  }
}
```

### Error Message Guidelines

| Context | Template | Example |
|---------|----------|---------|
| Validation failed | `"<Field> is required"` | `"Project name is required"` |
| Not found | `"<Entity> not found"` | `"Project not found"` |
| Conflict | `"<Entity> already exists"` | `"Environment name already exists"` |
| Operation failed | `"Failed to <action> <entity>"` | `"Failed to create project"` |

### Error Logging

```javascript
// ✓ Include context in log messages
console.log('Error in ProjectLib.create:', e);         // backend
console.error('Failed to delete project:', error);     // frontend

// ✗ Too vague
console.log('Error:', e);
console.error(error);
```

---

## Database Patterns

### Accessing Models

Always use the model registry — never import Sequelize models directly:

```javascript
// ✓ Use getModel()
const Project = getModel('project');
const Environment = getModel('environment');

// ✗ Avoid direct imports (breaks model initialization order)
import Project from '../db/models/project';
```

### Transactions

Use transactions for operations that modify multiple records:

```javascript
const sequelize = getSequelize();
const t = await sequelize.transaction();

try {
  const project = await Project.create(projectData, { transaction: t });
  await Environment.create({ ...envData, projectId: project.id }, { transaction: t });
  await t.commit();
  return project.toJSON();
} catch (e) {
  await t.rollback();
  console.log('Transaction failed:', e);
}
```

### Migrations

Follow the versioning convention from [CONTRIBUTING.md](../CONTRIBUTING.md):

```
1.0.0-initial.js
1.0.1-add-landmarks.js
1.0.2-add-domain.js
```

- **Never modify existing migrations** — always add a new one
- **Always update package.json version** when adding a migration
- **Test migration locally** before committing: `npm run dev` applies migrations on startup

### Pagination

Use `CoreLib.paginateQuery` and `CoreLib.paginateResult` for all list operations:

```javascript
static async find(input = {}, opt = {}) {
  const data = await joiLib.validate(findSchema, input);

  try {
    const Project = getModel('project');
    const query = CoreLib.paginateQuery(data, {
      where: buildWhereClause(data),
      order: [['createdAt', 'DESC']],
    });
    const result = await Project.findAndCountAll(query);
    return CoreLib.paginateResult(result, data);
  } catch (e) {
    console.log('Error in ProjectLib.find:', e);
  }
}
```

---

## Constants & Configuration

### File Organization

Constants are grouped by domain in `src/constants/`:

```javascript
// src/constants/project.js
export const PROJECT_STATUS = {
  ACTIVE: 'active',
  ARCHIVED: 'archived',
};

export const PROJECT_STANDARD = {
  WCAG_2A:   'wcag2a',
  WCAG_2AA:  'wcag2aa',
  WCAG_2AAA: 'wcag2aaa',
};

export const PROJECT_MAX_NAME_LENGTH = 255;
```

### Rules

1. **Named exports only** from constants files (no default export)
2. **Object constants** in `SCREAMING_SNAKE_CASE` with string/number values
3. **No magic strings/numbers** inline — always reference a constant
4. **Descriptive keys** — `PROJECT_STATUS.ACTIVE` not `STATUS.A`
5. **Group related constants** in the same file

---

## Accessibility Standards

The tool must be accessible. All UI code must:

### Required for Every Interactive Element

```jsx
// ✓ Buttons need accessible labels
<button aria-label="Delete project: My Website" onClick={handleDelete}>
  <DeleteIcon />
</button>

// ✓ Form fields need labels (associated or aria-label)
<label htmlFor="project-name">Project Name</label>
<input id="project-name" type="text" value={name} onChange={setName} />

// ✓ Loading states announced to screen readers
<button disabled={isLoading} aria-busy={isLoading}>
  {isLoading ? 'Saving...' : 'Save'}
</button>

// ✓ Error messages linked to inputs
<input id="name" aria-describedby="name-error" aria-invalid={!!error} />
{error && <span id="name-error" role="alert">{error}</span>}

// ✓ Dynamic content announced to screen readers
<div aria-live="polite" aria-atomic="true">
  {statusMessage}
</div>
```

### Keyboard Navigation

- All interactive elements reachable by Tab
- Tab order follows visual reading order
- Focus visible on all interactive elements (never `outline: none` without replacement)
- Modal dialogs trap focus while open, restore on close
- Escape closes all dialogs and popups

### Semantic HTML

```jsx
// ✓ Use semantic elements
<nav>, <main>, <header>, <footer>, <article>, <section>

// ✗ Avoid generic divs for structured content
<div class="nav">  // ✗
<nav>              // ✓
```

### Color and Contrast

- Minimum 4.5:1 contrast ratio for body text (WCAG AA)
- Minimum 3:1 for large text and UI components
- Never convey meaning through color alone

**Enforcement**: axe violations at `critical` or `serious` impact block all PRs (CI enforced — see [TESTING_STRATEGY.md](TESTING_STRATEGY.md)).

---

## Performance Guidelines

### React Rendering

```javascript
// ✓ Memoize expensive computations
const sortedProjects = useMemo(
  () => [...projects].sort((a, b) => a.name.localeCompare(b.name)),
  [projects]
);

// ✓ Memoize callbacks passed to child components
const handleDelete = useCallback((id) => {
  window.api.project.delete(id);
}, []);

// ✓ Avoid anonymous functions in render
// ✗ <Button onClick={() => handleDelete(id)}>   // Creates new function every render
// ✓ <Button onClick={handleDelete}>              // Stable reference
```

### IPC Calls

```javascript
// ✓ Batch related IPC calls where possible
const [projects, standards] = await Promise.all([
  window.api.project.find(),
  window.api.systemStandard.find(),
]);

// ✗ Sequential calls when they could be parallel
const projects = await window.api.project.find();
const standards = await window.api.systemStandard.find();
```

### SQLite Queries

```javascript
// ✓ Select only needed fields
Project.findAll({
  attributes: ['id', 'name', 'standard'],  // Not SELECT *
  where: { status: 'active' },
  limit: 50,
});

// ✓ Use indexes for filtered/sorted fields
// See docs/DATABASE_SCHEMA.md for indexed columns
```

---

## Documentation Standards

### Code Comments

Comments explain *why*, not *what*:

```javascript
// ✓ Why: Explains non-obvious rationale
// Nonce pattern: incrementing triggers useEffect without storing redundant data
const [listNonce, setListNonce] = useState(0);

// ✗ What: Redundant with the code itself
// Set isLoading to true
setIsLoading(true);
```

### JSDoc for Public APIs

Add JSDoc to lib methods and exported functions:

```javascript
/**
 * Creates a new project.
 * @param {object} input - Project creation data
 * @param {string} input.name - Project display name (1-255 chars)
 * @param {string} input.standard - WCAG standard ('wcag2a' | 'wcag2aa' | 'wcag2aaa')
 * @param {string} [input.description] - Optional description (max 1000 chars)
 * @returns {Promise<object|undefined>} Created project as plain object, or undefined on error
 */
static async create(input = {}, opt = {}) {
```

### PR Descriptions

Every PR must include:

1. **What**: One-paragraph summary of changes
2. **Why**: Motivation (links to issue, ADR, or Constitution principle)
3. **Tests**: Which test files were added or modified
4. **Accessibility**: Impact on accessibility (N/A if no UI changes)
5. **Breaking changes**: Any IPC contract, schema, or API changes

---

## Checklist: Before Opening a PR

```
Code Quality
  [ ] npm run lint passes with no errors
  [ ] No console.log left for debugging (only intentional logging)
  [ ] No commented-out code blocks
  [ ] Magic strings/numbers replaced with named constants

Testing
  [ ] Unit tests for all new functions
  [ ] Component tests for UI changes
  [ ] Tests for error cases, not just happy path
  [ ] npm test passes locally

Accessibility
  [ ] All interactive elements have accessible labels
  [ ] Keyboard navigation works for new UI
  [ ] No color-only meaning
  [ ] axe tests pass locally (npm run test:a11y)

Security
  [ ] All inputs validated (Joi or explicit checks)
  [ ] No hardcoded credentials or secrets
  [ ] File paths sanitized if handling file I/O
  [ ] execFile used (not exec) for any shell commands

Documentation
  [ ] README updated if setup/usage changed
  [ ] API spec updated if IPC channels changed
  [ ] DB schema updated if models changed
  [ ] ADR created if architectural decision made
```

---

## Related Specifications

| Document | Relevance |
|----------|-----------|
| [CONSTITUTION.md](../CONSTITUTION.md) | Sustainable, Self-Correcting, Reliable principles |
| [TESTING_STRATEGY.md](TESTING_STRATEGY.md) | Test requirements per layer |
| [SECURITY_SPECIFICATION.md](SECURITY_SPECIFICATION.md) | Security implementation requirements |
| [API_SPECIFICATION.md](API_SPECIFICATION.md) | IPC channel conventions |
| [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) | Data model and migration guidance |
| [docs/adr/](adr/) | Architecture decision rationale |

---

**Version:** 1.0  
**Status:** Active  
**Last Review:** May 22, 2026  
**Next Review:** November 22, 2026
