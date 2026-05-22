# ADR 0001: Use Electron for Desktop Application

**Status:** Accepted (Historical Decision)  
**Date:** May 2026 (Documented)  
**Authors:** Accessibility Tools Team  
**Affected:** Desktop application architecture, deployment, development experience

## Summary

Use Electron as the desktop application framework for Accessibility Tools, pairing it with Next.js and React for the UI layer.

## Context

### Problem Statement

Accessibility Testing Tools needed to provide:

1. **Local Execution**: Run automated accessibility tests (axe-core) against local or internal web applications without uploading code to external services
2. **Desktop Integration**: Access to file system, process control, and system resources required for comprehensive testing
3. **Cross-Platform Support**: Support Windows, macOS, and Linux users
4. **Web Familiarity**: Leverage web technologies to reduce development complexity and enable rapid iteration
5. **Custom Testing Workflows**: Ability to orchestrate complex test sequences with manual review and remediation tracking

### Constraints

- Limited initial team size (small engineering team)
- Need to reach desktop users while maintaining rapid feature development
- Must support accessibility testing without requiring external dependencies or cloud services
- Database persistence needed locally for offline operation
- Need for native OS integration (file dialogs, system notifications, etc.)

### Alternative Approaches Considered

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| **Electron** | Web tech reuse; cross-platform; rich ecosystem; file/process access; user base expects auto-updates | Larger app bundle; memory overhead; Chromium maintenance burden | ✅ **Selected** |
| **Native (C++/Qt)** | Lean, fast, native feel | Steeper learning curve; separate UI/logic codebases; slower iteration; recruiting difficulty | ❌ Rejected |
| **Tauri** | Lightweight; Rust safety; smaller bundles | Rust ecosystem less familiar; fewer third-party integrations at project inception; smaller community | ⏸️ Future reconsideration |
| **Web-Only (SaaS)** | Familiar web stack; easier hosting | Users unwilling to upload code; data privacy concerns; compliance barriers | ❌ Rejected |
| **Browser Extension** | Lightweight; instant deployment | Limited file system access; sandbox restrictions; CORS barriers | ❌ Rejected |

## Decision

**We will use Electron to build Accessibility Tools as a desktop application.**

Technology Stack:
- **Runtime**: Electron (Node.js backend in main process)
- **UI Framework**: Next.js + React (renderer process)
- **Database**: Sequelize + SQLite (local persistence)
- **Build Tool**: esbuild (compilation)
- **Packaging**: electron-builder (cross-platform distribution)
- **UI Components**: Material-UI (accessibility-first component library)

## Rationale

### Constitution Alignment

#### 1. **Focused** ✅
- Desktop application scope is well-defined and distinct from web-only alternatives
- Electron enables focused workflows: test orchestration, manual review, remediation tracking—features not available in basic cloud scanners
- Clear architectural boundaries between main process (backend logic) and renderer (UI)

#### 2. **Secure** ✅
- Tests run locally; user code never leaves the machine
- No external network requirements for core functionality (optional cloud integrations can be added later)
- OS-level sandboxing via Chromium + V8 isolation
- File system access controlled through explicit user interactions (file dialogs)
- Main process/renderer process isolation provides defense-in-depth

#### 3. **Accessible** ✅
- Material-UI provides WCAG 2.1 AA compliant component library
- Chromium engine has mature accessibility support
- Full keyboard navigation possible in Electron
- Screen reader compatibility through standard web APIs
- Same UI codebase (React/Next.js) ensures consistency across testing scenarios

#### 4. **Self-Correcting** ✅
- Node.js runtime provides comprehensive error handling and logging
- SQLite transactions enable data integrity and rollback capabilities
- Database migrations managed through Sequelize (self-correcting schema evolution)
- Electron's main/renderer process separation prevents crashes from cascading
- Development tools (DevTools) enable real-time debugging

#### 5. **Sustainable** ✅
- Web technologies (React, Next.js) are widely familiar to developers
- Large ecosystem of npm packages reduces reinvention
- Active Electron community with established patterns and best practices
- Code organization: clear separation of concerns (main process, renderer, database, UI components)
- Easier to onboard contributors vs. compiled languages or platform-specific technologies

#### 6. **Energy Conservative** ⚠️ Trade-off
- Electron bundles Chromium, leading to ~170MB+ base size and ~200MB+ memory footprint
- JavaScript execution is slower than compiled languages
- **Mitigation strategies**: Batch processing in test runner; efficient database queries; lazy-loading UI components; monitoring and performance benchmarks
- **Acceptable because**: Energy overhead is modest for a desktop tool used intermittently; accuracy of results outweighs minor resource overhead

#### 7. **Reliable** ✅
- Chromium provides stable, well-tested rendering and DOM APIs
- Node.js offers mature, production-hardened runtime
- SQLite provides ACID guarantees for data persistence
- Main process/renderer separation isolates UI crashes from backend logic
- Comprehensive testing ecosystem available through Node.js/npm

### Technical Rationale

**Why Electron (over Tauri)?**
- At project inception, Electron had a more mature ecosystem and more third-party integrations for accessibility testing
- Team familiarity with JavaScript/Node.js reduced onboarding friction
- **Future consideration**: Tauri remains a valid alternative for future versions if resource constraints become critical

**Why Next.js/React (in renderer)?**
- Next.js enables server-side rendering for performance and complex routing
- React ecosystem is mature with accessibility-focused component libraries (Material-UI)
- Hot module reloading speeds up development iteration
- SSR in Electron context enables better code splitting and bundle optimization

**Why SQLite (not PostgreSQL/MySQL)?**
- Users don't need to install/manage database servers
- Perfect for local, single-user persistence model
- Sufficient for current feature set (~20 tables, reasonable query volumes)
- Sequelize ORM handles migrations and schema management
- **Future migration path**: Sequelize abstractions allow later migration to other databases if needed

**Why electron-builder?**
- Simplifies cross-platform packaging and code signing
- Handles auto-update mechanisms with differential updates
- Mature, well-documented tool with large community

## Consequences

### Positive

1. **Rapid Development**: Leverage existing React/Node.js expertise; grow product quickly
2. **Cross-Platform**: Single codebase deployable to Windows, macOS, Linux
3. **Desktop Integration**: File dialogs, notifications, tray icons, keyboard shortcuts—all possible
4. **User Control**: Data stays on user machines; no cloud infrastructure concerns
5. **Extensibility**: Potential for plugins, custom test scripts via Node.js APIs
6. **Community**: Large Electron user base means more Stack Overflow answers, tutorials, third-party libraries

### Negative

1. **Bundle Size**: ~170MB+ base installation (users expect this for desktop apps, but still larger than alternatives)
2. **Memory Usage**: ~200MB+ memory overhead per instance (acceptable for desktop; notable for resource-constrained systems)
3. **Update Complexity**: Differential updates help, but still requires more infrastructure than web-only approach
4. **Maintenance Burden**: Chromium security updates must be tracked; electron-builder upgrades can be disruptive
5. **Performance**: JavaScript execution slower than compiled languages (mitigated by caching and batch processing)

### Maintenance Obligations

- **Electron Updates**: Monitor security releases; upgrade regularly (dependency scanning via CI/CD)
- **Chromium Stack**: Inherits Chromium's security update pace; plan 3-4 minor version bumps per year
- **Dependency Management**: Pin compatible versions; track deprecations
- **Performance Monitoring**: Benchmark memory usage, startup time, test execution speed; alert on regressions
- **Code Signing Certificates**: Maintain macOS and Windows code signing (for notarization and auto-updates)

## Implementation Timeline

- ✅ **Initial Development**: Electron + Next.js + React architecture established
- ✅ **Database Layer**: Sequelize + SQLite schema designed and deployed
- ✅ **Core Testing**: axe-core integration in main process, result persistence
- 🔄 **Current**: Productionization, performance optimization, accessibility compliance
- 📋 **Next**: Auto-update infrastructure; enhanced native OS integration (system tray, notifications)

## Future Reconsideration

This decision should be revisited if:

1. **Resource constraints become critical**: Memory/CPU overhead becomes a blocker for target users
2. **Tauri ecosystem matures**: Rust-based alternative offers significant advantages in bundle size and performance
3. **Web stack alternatives emerge**: WASM-based desktop frameworks might offer better tradeoffs
4. **Community needs shift**: If web-based or mobile-first access becomes primary request

**Migration Path**: Sequelize abstractions and data model portability enable future transitions with moderate effort (2-3 sprints).

## References

- [Electron Official Documentation](https://www.electronjs.org/docs)
- [Tauri Framework](https://tauri.app/)
- [Sequelize ORM Documentation](https://sequelize.org/)
- [axe-core API](https://github.com/dequelabs/axe-core)
- [CONSTITUTION.md](../../CONSTITUTION.md) — Principles Framework

## Related ADRs

- ADR 0002: Use SQLite for Local Data Persistence (Planned)
- ADR 0003: Use React + Next.js for UI Layer (Planned)
- ADR 0004: Use Sequelize ORM for Database Access (Planned)

---

**Last Updated:** May 22, 2026  
**Next Review Date:** May 2027
