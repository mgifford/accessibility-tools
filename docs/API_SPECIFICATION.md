# API Specification

## Overview

Accessibility Tools implements a layered API architecture that separates the UI (renderer process) from backend logic (main process) via Electron's IPC (Inter-Process Communication) system. This specification documents all public APIs and communication contracts.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Accessibility Tools                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────┐         ┌──────────────────────┐ │
│  │   RENDERER PROCESS   │         │   MAIN PROCESS       │ │
│  │  (UI Layer)          │         │  (Backend Logic)     │ │
│  │                      │         │                      │ │
│  │  • React Components  │◄────────┤  • Database Access   │ │
│  │  • Next.js Pages     │  IPC    │  • Test Runner       │ │
│  │  • Zustand Stores    │  Channels  • File I/O         │ │
│  │  • Material-UI       │         │  • System Calls      │ │
│  │                      │         │  • axe-core          │ │
│  └──────────────────────┘         └──────────────────────┘ │
│         │ api.*                         │                   │
│         └─────────────────────────────────                  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           SQLite Database (local)                    │  │
│  │  • Projects, Environments, Tests                     │  │
│  │  • System Data (standards, remedies, landmarks)      │  │
│  │  • Audit Results and History                         │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### API Layers

1. **Frontend API** (what React/Next.js calls)
   - Exposed via `window.api.*` in renderer process
   - Defined in preload script (`src/electron/preload/`)
   - Request-response or event-based communication

2. **Backend API** (what main process exposes)
   - IPC handlers in `src/electron/actions/`
   - Database operations via Sequelize models
   - File I/O and system operations
   - axe-core test execution

3. **Data API** (database schema)
   - See [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) (coming in Phase 2)
   - 20+ Sequelize models
   - Migrations managed via Sequelize

## API Documentation

### Complete Reference

**[IPC_SPECIFICATION.md](IPC_SPECIFICATION.md)** - Full specification of all 115+ IPC channels
- All request/response contracts
- Error codes and handling
- Async vs sync operations
- Performance notes and security considerations

### Quick References

**[IPC_CHANNELS_QUICK_REFERENCE.md](IPC_CHANNELS_QUICK_REFERENCE.md)** - Quick lookup guide
- Module index
- Common patterns
- Usage examples
- Async operation guidelines

**[IPC_CHANNELS.json](IPC_CHANNELS.json)** - Machine-readable API metadata
- JSON schema for tooling
- API statistics
- Pattern definitions

## API Categories

### 1. System & Lifecycle (7 channels)

Handle application startup, shutdown, and configuration.

| Channel | Type | Purpose |
|---------|------|---------|
| `app.exit` | ipcMain.on | Application termination |
| `app.eula` | ipcMain.handle | EULA acceptance workflow |
| `app.log` | ipcMain.on | Application logging |
| `app.error` | ipcMain.on | Error reporting |

**See:** [IPC_SPECIFICATION.md § System & Lifecycle](IPC_SPECIFICATION.md#system--lifecycle)

### 2. Project Management (12 channels)

Create, read, update, delete projects. Projects are top-level containers for accessibility testing work.

```javascript
// Create a new project
const project = await window.api.project.create({
  name: "My Website",
  description: "Accessibility audit for mysite.com",
  standard: "wcag2aa"
});

// List all projects
const projects = await window.api.project.find();

// Update project
await window.api.project.update(project.id, { name: "Updated Name" });

// Delete project
await window.api.project.delete(project.id);
```

**See:** [IPC_SPECIFICATION.md § Project Management](IPC_SPECIFICATION.md#project-management)

### 3. Environment Management (11 channels)

Environments represent distinct deployments or configurations to test (staging, production, local, etc.).

```javascript
// Create environment within a project
const env = await window.api.environment.create({
  projectId: project.id,
  name: "Staging",
  baseUrl: "https://staging.mysite.com"
});

// List environments for a project
const envs = await window.api.environment.find({ projectId: project.id });
```

**See:** [IPC_SPECIFICATION.md § Environment Management](IPC_SPECIFICATION.md#environment-management)

### 4. Test Execution (37 channels)

Execute automated and manual tests. Includes page crawling, test case selection, and result capture.

```javascript
// Create a test run
const test = await window.api.environmentTest.create({
  environmentId: env.id,
  name: "Initial Audit",
  standard: "wcag2aa"
});

// Start the test (async operation - shows loading indicator)
await window.api.environmentTest.start({ id: test.id });

// Listen for test completion
window.api.environmentTest.onTestCompleted((result) => {
  console.log('Test results:', result);
});

// Generate audit report
const report = await window.api.environmentTest.generateReport({
  id: test.id,
  format: "html" // or "json", "pdf"
});
```

**See:** [IPC_SPECIFICATION.md § Test Execution](IPC_SPECIFICATION.md#test-execution)

### 5. Manual Review & Remediation (14 channels)

Track manual test cases, issues, and remediation progress.

```javascript
// Mark a test result as reviewed
await window.api.environmentTestResult.update(resultId, {
  status: "reviewed",
  notes: "Fixed in commit abc123"
});

// Find remediations for an issue type
const remediations = await window.api.remediation.find({
  issueType: "color-contrast"
});
```

**See:** [IPC_SPECIFICATION.md § Manual Review & Remediation](IPC_SPECIFICATION.md#manual-review--remediation)

### 6. Standards & Test Data (26 channels)

Access built-in standards (WCAG, ATAG, VPAT) and test case definitions.

```javascript
// List all standards
const standards = await window.api.systemStandard.find();

// Get test cases for a standard
const testCases = await window.api.testCase.find({ standard: "wcag2aa" });

// Get remediation categories
const categories = await window.api.remediationCategory.find();
```

**See:** [IPC_SPECIFICATION.md § Standards & Test Data](IPC_SPECIFICATION.md#standards--test-data)

### 7. User Settings & Preferences (5 channels)

Manage application-level settings and user preferences.

```javascript
// Set theme
await window.api.theme.set("dark");

// Get current theme
const theme = await window.api.theme.current();

// Save user preferences
await window.api.settings.set("accessibility-highlight", true);
```

**See:** [IPC_SPECIFICATION.md § User Settings](IPC_SPECIFICATION.md#user-settings--preferences)

### 8. Specialized Operations (15 channels)

File export, DNS lookups, custom scripts, and other utilities.

```javascript
// Export test results to file
await window.api.export.results({
  testId: test.id,
  format: "json",
  outputPath: "/Users/user/Desktop/results.json"
});

// Generate sitemap from URLs
const urls = await window.api.pageScripts.generateSitemap({
  baseUrl: "https://mysite.com"
});
```

**See:** [IPC_SPECIFICATION.md § Specialized Operations](IPC_SPECIFICATION.md#specialized-operations)

## Error Handling

All IPC handlers follow a consistent error handling contract:

### Success Response
```javascript
{
  success: true,
  data: { /* operation-specific data */ }
}
```

### Error Response
```javascript
{
  success: false,
  error: {
    code: "ERROR_CODE",
    message: "Human-readable description",
    details: { /* context-specific info */ }
  }
}
```

### Common Error Codes

| Code | HTTP | Meaning | Handling |
|------|------|---------|----------|
| `VALIDATION_ERROR` | 400 | Invalid input parameters | Show validation errors to user |
| `NOT_FOUND` | 404 | Resource does not exist | Show "not found" message |
| `UNAUTHORIZED` | 401 | Permission denied | Redirect to login (if applicable) |
| `CONFLICT` | 409 | Resource already exists or state conflict | Show conflict resolution UI |
| `INTERNAL_ERROR` | 500 | Unexpected backend error | Log error, show generic message |
| `TIMEOUT` | 408 | Operation exceeded time limit | Retry with exponential backoff |
| `RESOURCE_EXHAUSTED` | 429 | Too many requests or system resource limit | Implement throttling/queuing |

**See:** [IPC_SPECIFICATION.md § Error Handling](IPC_SPECIFICATION.md#error-handling) for details.

## Async Operations

Some operations are asynchronous (long-running tests, file exports, etc.). These channels emit progress events:

```javascript
// Listen for progress on a long operation
const unsubscribe = window.api.environmentTest.onProgress((event) => {
  console.log(`Progress: ${event.completed}/${event.total}`);
});

// Later, unsubscribe when done
unsubscribe();
```

**Guidelines:**
- Always show loading indicators for async operations
- Implement timeout handling (see [IPC_SPECIFICATION.md](IPC_SPECIFICATION.md))
- Listen for both success and error events
- Allow cancellation where feasible

## Security Considerations

### Main Process Privileges

The main process has full OS access. All handlers must:

1. **Validate all inputs** from the renderer
2. **Sanitize file paths** (prevent directory traversal)
3. **Limit file I/O** (only permitted directories)
4. **Check permissions** (user owns the project/environment)
5. **Log sensitive operations** (file access, test execution)

### Renderer Process Isolation

The renderer process (React/UI) cannot:

- Access the file system directly (only through IPC)
- Execute arbitrary code
- Access native modules
- Make arbitrary system calls

This isolation is enforced by Electron's context isolation and the preload script whitelist.

**See:** [ADR 0007: Security Model](adr/0007-security-model-main-and-renderer-isolation.md) (planned)

## Reliability & Testing

### Promise-Based API

All async operations return Promises:

```javascript
// Preferred: async/await
try {
  const result = await window.api.project.create({...});
} catch (error) {
  console.error('Failed to create project:', error);
}

// Also supported: .then()/.catch()
window.api.project.find()
  .then(projects => console.log(projects))
  .catch(error => console.error(error));
```

### Retry Logic

**Client-side (Renderer):**
- Implement exponential backoff for transient failures
- Max 3 retries for network-like failures
- Don't retry on validation errors (4xx)

**Server-side (Main Process):**
- Database transactions with rollback on failure
- Graceful degradation for missing optional data
- Clear error codes for client to decide retry strategy

### Testing Requirements

All IPC handlers must have:

- ✅ Unit tests (isolated handler logic)
- ✅ Integration tests (with database)
- ✅ Error case tests (validation, timeouts, crashes)
- ✅ Contract tests (request/response schemas)

**See:** [docs/TESTING_STRATEGY.md](TESTING_STRATEGY.md) (planned)

## Version Management

### API Versioning Strategy

We use **semantic versioning** for the IPC API:

- **Major**: Breaking changes (renamed channels, removed channels, incompatible request/response)
- **Minor**: New channels or new optional parameters
- **Patch**: Bug fixes, documentation updates

### Backward Compatibility

When introducing breaking changes:

1. Implement both old and new channel names
2. Emit deprecation warnings in console
3. Wait 2 minor versions before removing old channels
4. Document migration path in CHANGELOG

### Channel Version (if needed)

```javascript
// Check API version at startup
const apiVersion = await window.api.app.version();
// { ipcApiVersion: "2.1.0", appVersion: "1.5.3" }
```

## Frontend Integration Pattern

### Standard Hook Pattern (React)

```javascript
// Custom hook for fetching projects
function useProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    window.api.project.find()
      .then(setProjects)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  return { projects, loading, error };
}

// Usage in component
function ProjectList() {
  const { projects, loading, error } = useProjects();
  if (loading) return <Spinner />;
  if (error) return <ErrorAlert error={error} />;
  return projects.map(p => <ProjectCard key={p.id} project={p} />);
}
```

### Store Pattern (Zustand)

See `src/stores/useProjectStore.js` for example implementation.

## Related Specifications

| Document | Purpose |
|----------|---------|
| [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) | Data models and relationships |
| [SECURITY_SPECIFICATION.md](SECURITY_SPECIFICATION.md) | Security requirements and isolation |
| [TESTING_STRATEGY.md](TESTING_STRATEGY.md) | API testing requirements |
| [docs/adr/0004-use-sequelize-orm.md](adr/0004-use-sequelize-orm.md) | Database access layer (planned) |

## References

- [Electron IPC Documentation](https://www.electronjs.org/docs/api/ipc-main)
- [Electron Security Best Practices](https://www.electronjs.org/docs/tutorial/security)
- [CONSTITUTION.md](../CONSTITUTION.md) — Principles alignment
- [IPC_SPECIFICATION.md](IPC_SPECIFICATION.md) — Full API reference
- [IPC_CHANNELS_QUICK_REFERENCE.md](IPC_CHANNELS_QUICK_REFERENCE.md) — Quick lookup

## Contributing

When adding new IPC channels:

1. ✅ Follow naming conventions: `module.action` (e.g., `project.create`)
2. ✅ Document in [IPC_SPECIFICATION.md](IPC_SPECIFICATION.md)
3. ✅ Update [IPC_CHANNELS.json](IPC_CHANNELS.json)
4. ✅ Add error case tests
5. ✅ Validate against CONSTITUTION principles
6. ✅ Consider creating an ADR if it's a new pattern

---

**API Version:** 1.0  
**Last Updated:** May 22, 2026  
**Specification Status:** Accepted (from code exploration)

**Note:** This specification was generated from code analysis on May 22, 2026. As the project evolves, keep this document synchronized with actual implementation changes via ADR and PR reviews.
