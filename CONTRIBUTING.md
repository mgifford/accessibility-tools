# Contributing to Accessibility Tools

Thank you for considering contributing! We welcome all contributions, including bug fixes, new features, documentation updates, and discussions.

## Getting Started

1. Fork the repository and clone your fork locally
2. Follow the setup instructions provided in the **[README](README.md)**

## Branching

- Create a new branch from master for any of your work
- Use the following naming convention for the branches:
  - feature/xyz (for features)
  - bugfix/xyz (for bugs)

## Development Standards

> **Full reference:** [docs/DEVELOPMENT_STANDARDS.md](docs/DEVELOPMENT_STANDARDS.md)

- **Code Style**: Use Prettier/ESLint for consistent formatting. Run the following command before each commit:

  ```bash
  npm run lint
  ```

- **Small, Focused changes**: Keep PRs focused on a single topic. Smaller PRs are easier to review
- **Documentation**: Update the README or any of the other docs if your changes setup, usage or architecture
- **Spec-Kitty-Driven Development**: We are moving to spec-kitty-driven development. For more information and best practices, see [https://docs.spec-kitty.ai/](https://docs.spec-kitty.ai/)

## Project Constitution and Governance

All contributions must align with the project's core principles. See **[CONSTITUTION.md](CONSTITUTION.md)** for:

- **Seven Core Principles**: Focused, Secure, Accessible, Self-Correcting, Sustainable, Energy Conservative, Reliable
- **Specification Requirements**: How new features are specified and validated
- **Review Checklist**: Seven-point evaluation framework for PRs
- **Decision-Making Process**: How architectural and feature decisions are made

### Architecture Decision Records (ADRs)

Significant technical and architectural decisions are documented in **[docs/adr/](docs/adr/)**.

**For Contributors:**
- Familiarize yourself with existing ADRs to understand *why* the system is structured as it is
- For major changes, propose a new ADR (see [docs/adr/README.md](docs/adr/README.md) for template)
- Reference relevant ADRs in PR descriptions and code comments
- When reviewing PRs, check alignment with Constitution principles

**Examples of decisions that warrant ADRs:**
- Introducing a new technology or major dependency
- Changing the database schema or persistence strategy
- Major architectural refactors
- Security or accessibility policy changes
- Performance or reliability requirements

### API Specifications

The Accessibility Tools API is fully documented in **[docs/API_SPECIFICATION.md](docs/API_SPECIFICATION.md)** with comprehensive IPC channel references.

**For contributors working on IPC channels:**

1. **Understand the API Architecture** — See [docs/API_SPECIFICATION.md](docs/API_SPECIFICATION.md) for overview
2. **Check Existing Channels** — See [docs/IPC_CHANNELS_QUICK_REFERENCE.md](docs/IPC_CHANNELS_QUICK_REFERENCE.md) for quick lookup
3. **When Adding a New Channel**:
   - Follow naming convention: `module.action` (e.g., `project.create`)
   - Implement handler in `/src/electron/actions/`
   - Define request/response contracts with TypeScript interfaces (or JSDoc types)
   - Update [docs/IPC_SPECIFICATION.md](docs/IPC_SPECIFICATION.md) with channel documentation
   - Add error case tests
   - Update [docs/IPC_CHANNELS.json](docs/IPC_CHANNELS.json)
   - Ensure security validation (input sanitization, permission checks)
   - Reference appropriate ADRs or create new ADR if establishing a new pattern

4. **When Modifying an Existing Channel**:
   - Consider backward compatibility (can you add optional params instead of breaking signature?)
   - Update API specification documentation
   - Create an ADR if it's a breaking change (explains migration path)
   - Update related tests and error handling

5. **Error Handling** — All handlers must follow the standard error contract:
   ```javascript
   // Success
   { success: true, data: { /* result */ } }
   
   // Error
   { success: false, error: { code: "ERROR_CODE", message: "...", details: {...} } }
   ```

### Security Requirements

All code changes must adhere to **[docs/SECURITY_SPECIFICATION.md](docs/SECURITY_SPECIFICATION.md)**.

**Key security principles:**

1. **Input Validation** — Validate all external inputs (IPC, file paths, URLs)
   - Use Joi schemas for structured data
   - Check types, ranges, formats
   - Reject invalid inputs with clear error messages

2. **Process Isolation** — Main process is trusted; renderer is sandboxed
   - Validate all data from renderer before use
   - Never disable Electron security features (nodeIntegration, contextIsolation)
   - Use preload script whitelist for IPC exposure

3. **File I/O** — Secure file operations
   - Sanitize paths to prevent directory traversal
   - Use `fs.promises` for async I/O
   - Clean up temporary files

4. **Command Execution** — Use execFile, never exec
   - Arguments passed as array, not concatenated strings
   - Validate script names against whitelist

5. **Data Privacy** — No external transmission without consent
   - Keep user data local by default
   - Log security-relevant operations
   - Never store credentials in plain text

**Before committing:**
- [ ] All inputs validated and sanitized
- [ ] No hardcoded credentials or secrets
- [ ] Security tests pass
- [ ] No unnecessary Electron security features disabled
- [ ] Logs don't contain sensitive data

## Database Changes

**Accessibility Tools** uses Sequelize + SQLite to manage the database. The folder structure for the database related files is as follows:

- src/electron/db/
  - models/ : stores all the sequelize models that are translated into sqlite tables
    - system/ : stores all the system models. The tables created are prefixed with `system_`
  - migrations/ : stores sequelize migration files

For any updates to the database structure, the following steps need to be followed:

1. Create a new migration file under src/electron/db/migrations/. This file should have an incremented version based on the existing migration files and a feature name. E.g. if the migrations folder has:

   ```plaintext
   1.0.1-featureA.js
   1.0.1-featureB.js
   ```

   The new migration file that you add should look like this:

   ```plaintext
   1.0.2-featureName.js
   ```

2. Update the relevant model files under src/electron/db/models/.
3. Update the package.json version.
4. Run the app using:

   ```bash
   npm run dev
   ```

   This will run the migration file, sync the models and update the system data locally, if there are any changes there.

## Testing Requirements

All changes must include tests. See **[docs/TESTING_STRATEGY.md](docs/TESTING_STRATEGY.md)** for the full strategy.

**Quick summary:**

- **New functions/logic**: Unit tests required (co-located: `myFile.test.js`)
- **IPC action changes**: Integration tests required
- **UI component changes**: Component tests + accessibility tests required
- **Security-related changes**: Security tests required
- **Coverage**: PRs must not decrease overall coverage (CI enforced)

**Run tests before submitting:**

```bash
npm test               # All unit + component tests
npm run test:coverage  # With coverage report
npm run test:a11y      # Accessibility tests
```

**Test file naming conventions:**

| Type | Location | Naming |
|------|----------|--------|
| Unit | Next to source | `myFile.test.js` |
| Component | Next to component | `MyComponent.component.test.jsx` |
| Integration | `test/integration/` | `project.integration.test.js` |
| E2E | `e2e/` | `create-project.spec.js` |
| Security | `test/security/` | `validation.test.js` |

## Pull Request Process

1. Push your branch
2. Ensure all tests pass locally (`npm test`)
3. Open a Pull Request (PR) to master
4. Ensure the PR description includes:
   - What changed and why
   - Test files added/modified
   - Accessibility impact (if UI changes)
   - Constitution principle alignment
5. Respond to review feedback promptly
6. Your PR will be merged once it's approved and passes all CI checks:
   - ✅ Unit tests pass
   - ✅ Component tests pass
   - ✅ Accessibility tests pass
   - ✅ Coverage not decreased
   - ✅ Linting passes (`npm run lint`)
   - ✅ Security review (if applicable)

## Community

All contributors are expected to follow our **[Code of Conduct](CODE_OF_CONDUCT.md)** to ensure a welcoming environment for everyone.
