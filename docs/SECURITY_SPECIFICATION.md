# Security Specification

**Status:** Approved  
**Last Updated:** May 22, 2026  
**Related ADRs:** ADR 0001 (Electron), ADR 0007 (Security Model - planned)  
**References:** [CONSTITUTION.md](../CONSTITUTION.md) — Principle: **Secure**

---

## Table of Contents

1. [Overview](#overview)
2. [Security Architecture](#security-architecture)
3. [Process Isolation Model](#process-isolation-model)
4. [Input Validation & Sanitization](#input-validation--sanitization)
5. [File I/O Security](#file-io-security)
6. [Process Execution Security](#process-execution-security)
7. [Data Handling & Privacy](#data-handling--privacy)
8. [Dependency Management](#dependency-management)
9. [Configuration & Credentials](#configuration--credentials)
10. [Incident Response & Disclosure](#incident-response--disclosure)
11. [Security Testing Requirements](#security-testing-requirements)
12. [Compliance & Audit](#compliance--audit)

---

## Overview

### Security Vision

Accessibility Tools is a desktop application that handles user projects, test configurations, and accessibility findings. Some data may be sensitive. Security is built into every layer:

- **Local-First**: User data never leaves the user's machine by default
- **Principle of Least Privilege**: Main process has OS access; renderer is sandboxed
- **Defense in Depth**: Multiple validation layers prevent exploitation
- **Transparency**: Security decisions documented and reviewable
- **Auditability**: Logging enables detection and investigation of anomalies

### Constitution Alignment

The **Secure** principle requires:

> The application handles user projects and test results—some potentially sensitive data. Security is built into every layer: Data isolation and privacy by default; No external data transmission without explicit user consent; Secure handling of file I/O and process execution; Regular security audits and vulnerability assessments; Dependencies kept up-to-date.

This specification operationalizes that principle.

### Threat Model

**Assumed Threats:**

1. **Local Attacker** — User's machine is compromised
   - *Mitigation*: This is inherent to desktop software; we assume OS-level protections are in place
   - *Our Role*: Don't create additional attack vectors

2. **Malicious Web Page** — Attacker controls a page being tested
   - *Mitigation*: axe-core runs in a sandboxed context (offscreen window)
   - *Our Role*: Don't execute user code; validate all URLs before loading

3. **Dependency Vulnerability** — npm package has a security hole
   - *Mitigation*: Automated scanning, pinned versions, incident response
   - *Our Role*: Regular updates, security audits

4. **User Misconfiguration** — User accidentally enables insecure settings
   - *Mitigation*: Secure defaults; clear warnings for risky operations
   - *Our Role*: Require explicit opt-in for sensitive operations

5. **Privilege Escalation** — Renderer process escapes sandbox
   - *Mitigation*: Context isolation, preload script whitelist
   - *Our Role*: Never disable Electron security features

**Out of Scope:**

- Network interception (user is responsible for HTTPS/VPN)
- OS-level vulnerabilities (assume patched OS)
- Physical access attacks (assume physically secure environment)
- Social engineering (assume user has security awareness)

---

## Security Architecture

### Layered Security Model

```
┌─────────────────────────────────────────────────────────────┐
│ Application Layer Security                                  │
│ - Input validation, authentication, encryption              │
├─────────────────────────────────────────────────────────────┤
│ Process Isolation                                           │
│ - Main process (trusted) ↔ Renderer process (untrusted)     │
│ - Context isolation enabled, preload script whitelist       │
├─────────────────────────────────────────────────────────────┤
│ Electron Framework Security                                │
│ - Chromium sandboxing, V8 isolation                         │
│ - Disabled dangerous features (nodeIntegration, etc.)       │
├─────────────────────────────────────────────────────────────┤
│ Operating System Security                                   │
│ - File permissions, process isolation, memory protection    │
└─────────────────────────────────────────────────────────────┘
```

### Security Principles (OWASP)

1. **Least Privilege** — Renderer process has minimal capabilities; main process is trusted
2. **Defense in Depth** — Multiple validation layers; no single point of failure
3. **Fail Securely** — Errors default to safe state; exceptions logged
4. **Separation of Concerns** — UI, logic, and data layers are distinct
5. **Secure Defaults** — Features are secure by default; opt-in for risky operations
6. **Input Validation** — All inputs validated before use (type, range, format)
7. **Output Encoding** — Data encoded appropriately for context (HTML, SQL, filesystem)

---

## Process Isolation Model

### Main Process (Trusted)

**Capabilities:**
- Direct file system access
- Process execution
- Database access
- System resource management
- IPC handler implementation

**Security Responsibilities:**
- Validate all inputs from renderer
- Sanitize file paths (prevent directory traversal)
- Restrict file operations to allowed directories
- Implement permission checks
- Log all security-relevant operations
- Never trust renderer data implicitly

**Implementation Location:** `/src/electron/main/`, `/src/electron/actions/`, `/src/electron/lib/`

### Renderer Process (Sandboxed)

**Capabilities:**
- DOM manipulation
- Event handling
- HTTP requests (same-origin only, unless explicitly configured)
- Access to whitelisted IPC channels

**Restrictions (Enforced by Electron):**
- ✗ No file system access (except via IPC)
- ✗ No process execution
- ✗ No database access (except via IPC)
- ✗ No require() for Node modules
- ✗ No access to main process memory
- ✗ Limited to Chromium APIs

**Implementation Location:** `/src/pages/`, `/src/modules/`, `/src/components/`, `/src/stores/`

### Preload Script (IPC Bridge)

**Purpose:** Expose a controlled set of IPC channels to renderer

**File:** `/src/electron/preload/index.js`

**Requirements:**

1. **Explicit Whitelist** — Only expose intended channels
   ```javascript
   // ✓ CORRECT: Explicit whitelist
   const api = {
     project: {
       find: () => ipcRenderer.invoke('project:find'),
       create: (data) => ipcRenderer.invoke('project:create', data),
     }
   };
   contextBridge.exposeInMainWorld('api', api);
   ```

2. **No Dynamic Exposure** — Don't expose entire IPC namespace
   ```javascript
   // ✗ WRONG: Exposes all channels
   contextBridge.exposeInMainWorld('ipcRenderer', ipcRenderer);
   ```

3. **Input Wrapping** — Validate/transform data if needed
   ```javascript
   // ✓ CORRECT: Wrap and validate
   create: (data) => {
     if (!data.name || typeof data.name !== 'string') {
       throw new Error('Invalid project name');
     }
     return ipcRenderer.invoke('project:create', data);
   }
   ```

**Security Checklist:**
- [ ] All exposed channels are intentional
- [ ] No generic "invoke" or "send" methods exposed
- [ ] No access to __dirname, require(), or process
- [ ] Preload script runs with `nodeIntegration: false`
- [ ] Context isolation is enabled
- [ ] Preload script is loaded from local filesystem only

---

## Input Validation & Sanitization

### Validation Strategy

**Principle:** Validate at entry points; assume all external input is potentially malicious.

### Where to Validate

1. **IPC Handler Entry Points** (Main Process)
   ```javascript
   // src/electron/actions/project.js
   async function create(data) {
     // ✓ Validate immediately
     if (!data || typeof data !== 'object') {
       throw new ValidationError('Invalid input: expected object');
     }
     if (!data.name || typeof data.name !== 'string') {
       throw new ValidationError('Project name required and must be string');
     }
     if (data.name.length < 1 || data.name.length > 255) {
       throw new ValidationError('Project name must be 1-255 characters');
     }
     // Continue with trusted data...
   }
   ```

2. **UI Input (Renderer Process)**
   ```javascript
   // src/pages/projects/create.jsx
   function CreateProjectForm() {
     const [name, setName] = useState('');
     
     function handleSubmit() {
       // ✓ Validate before sending to IPC
       if (!name.trim()) {
         setError('Project name is required');
         return;
       }
       if (name.length > 255) {
         setError('Project name too long');
         return;
       }
       // Send validated data
       window.api.project.create({ name: name.trim() });
     }
   }
   ```

### Validation Types

| Type | Examples | Rules |
|------|----------|-------|
| **Type** | string, number, boolean, object | Use typeof checks; throw on mismatch |
| **Range** | 1-255 chars, 0-100 integer | Check min/max; reject outliers |
| **Format** | email, URL, UUID, semantic version | Use regex patterns or libraries |
| **Encoding** | UTF-8, ASCII, base64 | Validate character set |
| **Structure** | JSON schema, expected properties | Check all required fields |

### Sanitization Rules

| Context | Input Type | Action | Example |
|---------|-----------|--------|---------|
| **File Path** | User input | Sanitize for directory traversal | Reject `../`, collapse `//`, resolve to canonical path |
| **Database Query** | User-provided filter | Use parameterized queries (ORM) | Never string-concatenate SQL |
| **HTML Output** | User-provided text | Escape for HTML context | `<` → `&lt;`, `&` → `&amp;` |
| **Command Line** | User-provided arguments | Quote arguments; use array form | Use `execFile` not `exec` |
| **URL** | User-provided URL | Validate scheme; reject unsafe schemes | Reject `javascript:`, `data:` for navigation |

### Validation Libraries

- **Joi** (already in project) — Object schema validation
- **validator.js** — String format validation
- **ajv** — JSON schema validation
- **path** module — Safe path operations

### Examples

```javascript
// Database field validation
import Joi from 'joi';

const projectSchema = Joi.object({
  name: Joi.string().min(1).max(255).required(),
  description: Joi.string().max(1000).optional(),
  standard: Joi.string().valid('wcag2a', 'wcag2aa', 'wcag2aaa').required(),
});

async function createProject(data) {
  const { error, value } = projectSchema.validate(data);
  if (error) throw new ValidationError(error.details[0].message);
  // Use validated 'value'
}

// File path validation
function validateFilePath(userPath) {
  const basePath = app.getPath('userData');
  const resolvedPath = path.resolve(basePath, userPath);
  
  // Ensure resolved path is within allowed directory
  if (!resolvedPath.startsWith(basePath)) {
    throw new SecurityError('Path traversal attempt detected');
  }
  
  return resolvedPath;
}

// URL validation
function validateTestUrl(url) {
  try {
    const parsed = new URL(url);
    
    // Only allow http and https
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new SecurityError(`Unsafe protocol: ${parsed.protocol}`);
    }
    
    // Reject localhost unless explicitly configured
    if (parsed.hostname === 'localhost' && !config.allowLocalhost) {
      throw new SecurityError('Local URLs not permitted');
    }
    
    return url;
  } catch (e) {
    throw new ValidationError(`Invalid URL: ${e.message}`);
  }
}
```

---

## File I/O Security

### Safe File Operations

#### 1. Path Validation

```javascript
// RULE: Always validate paths from user input
const path = require('path');
const app = require('electron').app;

function validateDownloadPath(userProvidedPath) {
  const downloadsDir = app.getPath('downloads');
  const fullPath = path.resolve(downloadsDir, path.basename(userProvidedPath));
  
  // Ensure path is within downloads directory
  if (!fullPath.startsWith(downloadsDir)) {
    throw new Error('Path traversal attempt');
  }
  
  return fullPath;
}
```

#### 2. File Permissions

```javascript
// RULE: Respect file permissions; never bypass them
const fs = require('fs');

async function readProjectFile(projectId) {
  const filePath = `/path/to/projects/${projectId}/config.json`;
  
  try {
    // Check file exists and is readable
    await fs.promises.access(filePath, fs.constants.R_OK);
    return await fs.promises.readFile(filePath, 'utf8');
  } catch (error) {
    if (error.code === 'EACCES') {
      throw new Error('Permission denied');
    }
    throw error;
  }
}
```

#### 3. Sensitive Data

```javascript
// RULE: Never write credentials or secrets to disk without encryption
// Use system keyring for sensitive data

// ✗ WRONG: Plain-text credentials
fs.writeFileSync('config.json', JSON.stringify({
  apiKey: 'secret-key-12345'
}));

// ✓ CORRECT: Use secure storage
const keytar = require('keytar');
await keytar.setPassword('accessibility-tools', 'api-key', secretKey);
```

#### 4. Temp Files

```javascript
// RULE: Clean up temporary files; use secure temp directories
const tmp = require('tmp');

async function processLargeFile(inputPath) {
  const tmpObj = tmp.fileSync({ prefix: 'acc-tools-' });
  
  try {
    // Process file
    // ...
  } finally {
    // Always clean up
    fs.unlinkSync(tmpObj.name);
  }
}
```

### Allowed File Operations

```
/path/to/userData/              ✓ Allowed (user data directory)
  projects/
  audits/
  exports/
  config.json
/path/to/downloads/             ✓ Allowed (downloads)
/tmp/                           ✓ Allowed (temporary files only)
/path/to/system/files/          ✗ Denied
../../../etc/passwd             ✗ Denied (directory traversal)
```

---

## Process Execution Security

### Executing External Commands

#### Rule: Never Use `exec()`

```javascript
// ✗ WRONG: Command injection vulnerability
const { exec } = require('child_process');
exec(`node script.js ${userInput}`, callback); // VULNERABLE

// ✓ CORRECT: Use execFile with arguments array
const { execFile } = require('child_process');
execFile('node', ['script.js', userInput], callback);
```

#### Safe Process Execution Pattern

```javascript
const { execFile } = require('child_process');
const path = require('path');

async function runTestScript(scriptName, args) {
  // Validate script name
  const allowedScripts = ['test-runner', 'report-generator'];
  if (!allowedScripts.includes(scriptName)) {
    throw new Error('Unknown script');
  }
  
  // Validate arguments
  if (!Array.isArray(args)) {
    throw new Error('Arguments must be array');
  }
  
  const scriptPath = path.join(__dirname, `scripts/${scriptName}.js`);
  
  return new Promise((resolve, reject) => {
    execFile('node', [scriptPath, ...args], (error, stdout, stderr) => {
      if (error) {
        // Log error for security monitoring
        console.error(`Script execution failed: ${scriptName}`, error);
        return reject(error);
      }
      resolve(stdout);
    });
  });
}
```

### Custom Test Scripts

If allowing user-provided scripts, use sandboxing:

```javascript
// ✗ DANGEROUS: eval() or Function() constructor
const fn = new Function(userCode);
fn(); // VULNERABLE

// ✓ SAFE: Use Worker or child process
const { Worker } = require('worker_threads');
const worker = new Worker(userCode, { eval: true });
```

---

## Data Handling & Privacy

### Principle: Data Isolation by Default

1. **No Cloud Transmission** (unless explicitly configured)
   - User data stored locally in SQLite database
   - No telemetry by default
   - No usage analytics without consent

2. **No External APIs** (unless intentional)
   - Tests run locally (axe-core runs in offscreen window)
   - No reporting to external services
   - Optional integrations must be opt-in

3. **Encrypted in Transit** (for optional cloud features)
   - Use HTTPS only
   - Certificate pinning for critical APIs
   - Reject any insecure connections

### Data Retention

```javascript
// RULE: Provide clear data retention and deletion

async function deleteProject(projectId) {
  // Get all related data
  const project = await Project.findByPk(projectId);
  const environments = await project.getEnvironments();
  const tests = await EnvironmentTest.findAll({ where: { environmentId: environments.map(e => e.id) } });
  
  // Delete related records (cascade)
  await project.destroy(); // Sequelize handles cascade delete
  
  // Log deletion for audit trail
  logger.info('Project deleted', { projectId, timestamp: new Date() });
}
```

### Audit Logging

```javascript
// Log all security-relevant operations

const logger = require('electron-log');

// Sensitive operations
logger.info('User action', {
  action: 'project.create',
  projectId: project.id,
  timestamp: new Date().toISOString(),
  userId: getCurrentUserId() // if auth is added
});

// Errors
logger.error('Security validation failed', {
  type: 'PATH_TRAVERSAL',
  input: attemptedPath,
  sanitized: sanitizedPath,
  timestamp: new Date().toISOString()
});
```

### Logs Location

- **Electron Logs**: `~/Library/Logs/accessibility-tools/` (macOS) or equivalent
- **Never log**: Credentials, API keys, sensitive user data
- **Always log**: Validation failures, permission denials, data access

---

## Dependency Management

### Automated Scanning

**CI/CD Pipeline:**

```bash
# Scan for vulnerabilities
npm audit

# Fix automatically if possible
npm audit fix

# Generate report
npm audit --json > audit-report.json
```

**Policy:**
- ✅ Deploy with zero critical vulnerabilities
- ✅ Critical/High: Fix immediately (within 48 hours)
- ✅ Medium: Fix in next release cycle
- ✅ Low: Review and prioritize

### Dependency Pinning

```json
{
  "dependencies": {
    "sequelize": "6.35.2",      // Pinned version
    "electron": "38.2.0"         // Pinned version
  }
}
```

**Rationale:**
- Prevent unexpected behavior from minor version bumps
- Controlled, tested dependency updates
- Reproducible builds

### Safe Updates

```bash
# Review changes before updating
npm outdated
npm ls sequelize

# Update with caution
npm update sequelize --save

# Test thoroughly
npm test
npm run lint

# Commit updates separately
git commit -m "chore: Update dependencies"
```

### Supply Chain Security

- ✓ Only use packages from npm registry
- ✓ Verify package ownership (check npm profile)
- ✓ Avoid packages with single maintainer
- ✓ Check vulnerability database (snyk.io)
- ✗ Avoid packages with suspicious activity

---

## Configuration & Credentials

### Configuration Management

```javascript
// config/default.js
module.exports = {
  app: {
    name: 'Accessibility Tools',
    version: '1.0.0'
  },
  security: {
    allowLocalhost: false,        // Secure default
    maxFileSize: 100 * 1024 * 1024, // 100MB
    sessionTimeout: 3600000,       // 1 hour
    passwordMinLength: 8,
  },
  database: {
    dialect: 'sqlite',
    logging: process.env.NODE_ENV === 'development' // Logs only in dev
  }
};
```

### Credential Storage

```javascript
// WRONG: Plain text in config
const config = {
  apiKey: 'secret-key-12345'  // ✗ Dangerous
};

// CORRECT: Use system keyring
const keytar = require('keytar');

async function getApiKey() {
  return await keytar.getPassword('accessibility-tools', 'api-key');
}

async function setApiKey(key) {
  return await keytar.setPassword('accessibility-tools', 'api-key', key);
}
```

### Environment Variables

```bash
# .env.example (commit this, not actual secrets)
DATABASE_ENCRYPTION_KEY=<generate-and-store-securely>
LOG_LEVEL=info
ENABLE_CLOUD_SYNC=false

# .env (DO NOT COMMIT)
DATABASE_ENCRYPTION_KEY=actual-secret-key-here
```

---

## Incident Response & Disclosure

### Security Issue Discovery

**If you discover a vulnerability:**

1. **Do Not** create a public GitHub issue
2. **Email** security@example.com (to be configured) with:
   - Description of vulnerability
   - Steps to reproduce
   - Potential impact
   - Your contact information

3. **Wait** for acknowledgment (48 hours)
4. **Coordinate** with maintainers on fix timeline

### Fix Process

1. Create private security advisory
2. Develop and test fix
3. Release security patch (bump patch version)
4. Publish disclosure in GitHub releases

### Disclosure Timeline

- **Report**: Day 0
- **Acknowledgment**: Day 1
- **Fix released**: Day 7-14 (depending on severity)
- **Public disclosure**: 30 days after release

---

## Security Testing Requirements

### Automated Testing

```javascript
// test/security/input-validation.test.js
describe('Input Validation', () => {
  it('should reject project names with directory traversal', async () => {
    const malicious = '../../../etc/passwd';
    expect(() => validateProjectName(malicious)).toThrow();
  });

  it('should reject non-string project names', async () => {
    expect(() => validateProjectName(123)).toThrow();
    expect(() => validateProjectName(null)).toThrow();
  });

  it('should accept valid project names', async () => {
    expect(() => validateProjectName('My Project')).not.toThrow();
  });
});

// test/security/path-traversal.test.js
describe('Path Traversal Protection', () => {
  it('should prevent escaping userData directory', async () => {
    const userInput = '../../../etc/passwd';
    const validated = validateDownloadPath(userInput);
    expect(validated).toContain(app.getPath('downloads'));
  });
});

// test/security/command-injection.test.js
describe('Command Injection Protection', () => {
  it('should not execute shell commands', async () => {
    const malicious = 'test; rm -rf /';
    const spy = jest.spyOn(childProcess, 'execFile');
    
    await runTestScript('test-runner', [malicious]);
    
    // Verify execFile was used (not exec)
    expect(spy).toHaveBeenCalledWith('node', expect.any(Array));
  });
});
```

### Manual Security Testing

- [ ] Test with invalid inputs (null, undefined, wrong types)
- [ ] Test with edge cases (empty strings, very long strings, special characters)
- [ ] Test with path traversal attempts
- [ ] Test with command injection attempts
- [ ] Test with XSS payloads
- [ ] Verify context isolation is enabled
- [ ] Verify preload script whitelist is complete
- [ ] Verify nodeIntegration is disabled
- [ ] Verify enableRemoteModule is disabled
- [ ] Test file I/O boundaries

### Security Audit Checklist

Before each release:

- [ ] No new vulnerabilities in `npm audit`
- [ ] All security tests pass
- [ ] No hardcoded credentials in codebase
- [ ] No unnecessary Electron security features disabled
- [ ] Logs don't contain sensitive data
- [ ] Dependency versions reviewed and approved
- [ ] Code review completed by senior maintainer
- [ ] Security documentation up-to-date

---

## Compliance & Audit

### Security Standards

- **OWASP Top 10** — Follow prevention guidance
- **Electron Security Hardening** — Use recommended practices
- **Node.js Security** — Follow best practices
- **WCAG 2.1** — Accessibility not compromised by security measures

### Audit Trail

All security-relevant operations logged:

```
[2026-05-22 14:30:15] INFO: project.create - Project created: proj-123
[2026-05-22 14:31:02] ERROR: validation_failed - Invalid URL: 'javascript:alert(1)'
[2026-05-22 14:32:47] WARN: path_traversal_attempt - Blocked: '../../../etc/passwd'
```

### Regular Reviews

**Monthly:**
- Review security logs for anomalies
- Check for new vulnerability disclosures

**Quarterly:**
- Security audit of new code
- Dependency update review
- Test coverage analysis

**Annually:**
- Comprehensive security assessment
- Third-party security audit (if resources allow)
- Update threat model

---

## Related Specifications

| Document | Purpose |
|----------|---------|
| [CONSTITUTION.md](../CONSTITUTION.md) | Principle: Secure |
| [API_SPECIFICATION.md](API_SPECIFICATION.md) | Input validation in IPC handlers |
| [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) | Data integrity and constraints |
| [docs/adr/0001-electron.md](adr/0001-use-electron-for-desktop-application.md) | Framework security model |

---

## Contributing

All code changes must:

1. ✅ Pass security tests
2. ✅ Include validation/sanitization where applicable
3. ✅ Have no hardcoded credentials
4. ✅ Follow principle of least privilege
5. ✅ Be reviewed by security-conscious maintainer
6. ✅ Document security assumptions in PR

---

**Version:** 1.0  
**Status:** Active  
**Last Review:** May 22, 2026  
**Next Review:** August 22, 2026
