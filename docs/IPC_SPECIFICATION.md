# Electron IPC API Specification

**Accessibility Tools v1.2.0**  
**Generated**: May 22, 2026  
**Total Channels**: 115+ distinct IPC channels

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│ Renderer Process (Next.js/React UI)                         │
│  window.api.<module>.<method>(data) → ipcRenderer.invoke()  │
└────────────────┬────────────────────────────────────────────┘
                 │ IPC Bridge (contextBridge)
┌────────────────▼────────────────────────────────────────────┐
│ Main Process (Electron)                                     │
│  ipcMain.handle('<channel>', handler) → lib function calls  │
└────────────────┬────────────────────────────────────────────┘
                 │ Database/File I/O
┌────────────────▼────────────────────────────────────────────┐
│ Backend Library Layer (Node.js)                             │
│  /src/electron/lib/ - Core business logic                   │
└─────────────────────────────────────────────────────────────┘
```

### Key Implementation Details

- **Preload Bridge**: [src/electron/preload/index.js](../src/electron/preload/index.js)
- **Action Files**: [src/electron/actions/](../src/electron/actions/)
- **Main Entry**: [src/electron/main/index.js](../src/electron/main/index.js)
- **Communication Pattern**: ipcRenderer.invoke() for request-response, ipcRenderer.send() for fire-and-forget
- **Event Listeners**: createIpcListener utility (preload) for subscription-based channels

---

## IPC Channels by Module

### 1. SYSTEM CHANNELS

System-level operations and lifecycle management.

| Channel | Type | Handler File | Parameters | Returns | Description |
|---------|------|--------------|-----------|---------|-------------|
| `system:exit` | handle | [main/index.js:202](../src/electron/main/index.js#L202) | None | N/A | Gracefully exit the application |
| `system:acceptEula` | handle | [main/index.js:207](../src/electron/main/index.js#L207) | None | N/A | Mark EULA as accepted, rebuild window |
| `system:getAssetsPath` | handle | [main/index.js:216](../src/electron/main/index.js#L216) | None | `string` | Get path to assets directory |
| `system:error` | on | [main/index.js:223](../src/electron/main/index.js#L223) | `(message: string, opt?: {title?: string})` | N/A | Display error dialog (event listener) |
| `log:info` | on | [preload/index.js:180](../src/electron/preload/index.js#L180) | `message: string` | N/A | Log info message to electron-log |
| `log:error` | on | [preload/index.js:184](../src/electron/preload/index.js#L184) | `error: Error` | N/A | Log error to electron-log |
| `log:rejection` | on | [preload/index.js:189](../src/electron/preload/index.js#L189) | `reason: any` | N/A | Log unhandled promise rejection |

### 2. NAVIGATION & GLOBAL CHANNELS

Navigation events and global window interactions.

| Channel | Type | Handler File | Parameters | Returns | Description |
|---------|------|--------------|-----------|---------|-------------|
| `navigate` | listener | [preload/index.js:18](../src/electron/preload/index.js#L18) | Callback function | Unsubscribe function | Subscribe to main window navigation events |
| `webview:navigate` | send | [main/index.js:96](../src/electron/main/index.js#L96) | `url: string` | N/A | Broadcast webview navigation events |

### 3. THEME CHANNELS

Application theme and appearance management.

| Channel | Type | Handler File | Parameters | Returns | Description |
|---------|------|--------------|-----------|---------|-------------|
| `theme:set` | handle | [actions/theme.js:3](../src/electron/actions/theme.js#L3) | `v: 'light' \| 'dark'` | `'light' \| 'dark' \| 'system'` | Set application theme |
| `theme:current` | handle | [actions/theme.js:9](../src/electron/actions/theme.js#L9) | None | `'light' \| 'dark' \| 'system'` | Get current theme |
| `theme:system` | on | [actions/theme.js:13](../src/electron/actions/theme.js#L13) | None | N/A | Set theme to follow system preference |

---

## 4. PROJECT MANAGEMENT CHANNELS

Project CRUD operations and metadata management.

| Channel | Type | Handler File | Parameters | Returns | Description |
|---------|------|--------------|-----------|---------|-------------|
| `project:find` | handle | [actions/project.js:4](../src/electron/actions/project.js#L4) | `data: any, opt?: any` | Array of projects | Query multiple projects with filters |
| `project:read` | handle | [actions/project.js:7](../src/electron/actions/project.js#L7) | `data: any, opt?: any` | Project object | Read single project by ID |
| `project:create` | handle | [actions/project.js:10](../src/electron/actions/project.js#L10) | `data: {name: string, ...}, opt?: any` | Project object | Create new project |
| `project:update` | handle | [actions/project.js:13](../src/electron/actions/project.js#L13) | `data: {id: number, ...}, opt?: any` | Project object | Update existing project |
| `project:delete` | handle | [actions/project.js:16](../src/electron/actions/project.js#L16) | `data: {id: number}, opt?: any` | Result object | Delete project by ID |

---

## 5. ENVIRONMENT CHANNELS

Test environment configuration and management.

| Channel | Type | Handler File | Parameters | Returns | Description |
|---------|------|--------------|-----------|---------|-------------|
| `environment:find` | handle | [actions/environment.js:4](../src/electron/actions/environment.js#L4) | `id: number` | Array of environments | Find all environments for project |
| `environment:read` | handle | [actions/environment.js:7](../src/electron/actions/environment.js#L7) | `data: any, opt?: any` | Environment object | Read single environment |
| `environment:create` | handle | [actions/environment.js:10](../src/electron/actions/environment.js#L10) | `data: {projectId: number, name: string, url: string, ...}, opt?: any` | Environment object | Create new environment |
| `environment:update` | handle | [actions/environment.js:13](../src/electron/actions/environment.js#L13) | `data: {id: number, ...}, opt?: any` | Environment object | Update environment config |
| `environment:delete` | handle | [actions/environment.js:16](../src/electron/actions/environment.js#L16) | `data: {id: number}, opt?: any` | Result object | Delete environment |
| `environment:generate-sitemap` | handle | [actions/environment.js:19](../src/electron/actions/environment.js#L19) | `data: {environmentId: number, startUrl: string, crawlDepth: number, ...}, opt?: any` | Sitemap object | Generate sitemap from URL crawl |
| `environment:dns-lookup` | handle | [actions/environment.js:22](../src/electron/actions/environment.js#L22) | `data: {domain: string}, opt?: any` | DNS resolution result | Perform DNS lookup on domain |
| `environment:get-sitemap` | handle | [actions/environment.js:25](../src/electron/actions/environment.js#L25) | `data: {environmentId: number}, opt?: any` | Sitemap object | Retrieve existing sitemap |
| `environment:create-page` | handle | [actions/environment.js:28](../src/electron/actions/environment.js#L28) | `data: {environmentId: number, url: string, title: string, ...}, opt?: any` | Page object | Create new test page |

---

## 6. ENVIRONMENT TEST CHANNELS

Test execution and management for environments.

| Channel | Type | Handler File | Parameters | Returns | Description |
|---------|------|--------------|-----------|---------|-------------|
| `environmentTest:find` | handle | [actions/environmentTest.js:5](../src/electron/actions/environmentTest.js#L5) | `data: any, opt?: any` | Array of environment tests | Query all tests for environment |
| `environmentTest:read` | handle | [actions/environmentTest.js:8](../src/electron/actions/environmentTest.js#L8) | `data: {id: number}, opt?: any` | EnvironmentTest object | Read single test |
| `environmentTest:create` | handle | [actions/environmentTest.js:11](../src/electron/actions/environmentTest.js#L11) | `data: {environmentId: number, testName: string, ...}, opt?: any` | EnvironmentTest object | Create new environment test |
| `environmentTest:update` | handle | [actions/environmentTest.js:14](../src/electron/actions/environmentTest.js#L14) | `data: {id: number, ...}, opt?: any` | EnvironmentTest object | Update test metadata |
| `environmentTest:startTest` | handle | [actions/environmentTest.js:17](../src/electron/actions/environmentTest.js#L17) | `data: {id: number, ...}, opt?: any` | StartTest result object | Initialize and start environment test |
| `environmentTest:closeTest` | handle | [actions/environmentTest.js:20](../src/electron/actions/environmentTest.js#L20) | `data: {id: number}, opt?: any` | CloseTest result object | Finalize and close test session |
| `environmentTest:openClosedTest` | handle | [actions/environmentTest.js:23](../src/electron/actions/environmentTest.js#L23) | `data: {id: number}, opt?: any` | EnvironmentTest object | Reopen a previously closed test |
| `environmentTest:getSitemap` | handle | [actions/environmentTest.js:26](../src/electron/actions/environmentTest.js#L26) | `data: {id: number}, opt?: any` | Sitemap object | Get test's sitemap/page structure |
| `environmentTest:getStats` | handle | [actions/environmentTest.js:29](../src/electron/actions/environmentTest.js#L29) | `data: {id: number}, opt?: any` | Stats object | Get test summary statistics |
| `environmentTest:generateReport` | handle | [actions/environmentTest.js:32](../src/electron/actions/environmentTest.js#L35) | `data: {id: number, ...}, opt?: any` | `{success: boolean, message?: string}` | Generate and save test report (PDF) |
| `environmentTest:onTestCompleted` | listener | [preload/index.js:56](../src/electron/preload/index.js#L56) | Callback function | Unsubscribe function | Subscribe to test completion events |
| `environmentTest:generateOccurrenceData` | handle | [actions/environmentTest.js:48](../src/electron/actions/environmentTest.js#L48) | `data: {id: number, ...}, opt?: any` | Result object | Generate test occurrence/result data |
| `environmentTest:hasOccurrenceData` | handle | [actions/environmentTest.js:51](../src/electron/actions/environmentTest.js#L51) | `data: {id: number}, opt?: any` | `boolean` | Check if test has occurrence data |
| `environmentTest:addPage` | handle | [actions/environmentTest.js:54](../src/electron/actions/environmentTest.js#L54) | `data: {id: number, pageUrl: string, ...}, opt?: any` | Page object | Add new page to active test |
| `environmentTest:rescanSitemap` | handle | [actions/environmentTest.js:57](../src/electron/actions/environmentTest.js#L57) | `data: {id: number, ...}, opt?: any` | Sitemap object | Refresh/recrawl environment pages |

---

## 7. ENVIRONMENT PAGE CHANNELS

Per-page testing operations during an environment test.

| Channel | Type | Handler File | Parameters | Returns | Description |
|---------|------|--------------|-----------|---------|-------------|
| `environmentPage:scanPage` | handle | [actions/environmentPage.js:5](../src/electron/actions/environmentPage.js#L5) | `data: {environmentTestId: number, pageUrl: string, ...}, opt?: any` | Scan result object | Run accessibility scan on specific page |
| `environmentPage:findTestCases` | handle | [actions/environmentPage.js:8](../src/electron/actions/environmentPage.js#L8) | `data: {environmentTestId: number, pageId: number, ...}, opt?: any` | Array of test cases | Get all applicable test cases for page |
| `environmentPage:findTestCaseNodes` | handle | [actions/environmentPage.js:11](../src/electron/actions/environmentPage.js#L11) | `data: {testCaseId: number, pageUrl: string, ...}, opt?: any` | Array of DOM nodes | Find DOM nodes matching test case |
| `environmentPage:readTestCase` | handle | [actions/environmentPage.js:14](../src/electron/actions/environmentPage.js#L14) | `data: {testCaseId: number}, opt?: any` | TestCase object with details | Read complete test case definition |
| `environmentPage:findEnvironmentTest` | handle | [actions/environmentPage.js:17](../src/electron/actions/environmentPage.js#L17) | `data: {environmentTestId: number}, opt?: any` | EnvironmentTest object | Get current environment test context |
| `environmentPage:updateEnvironmentTestTarget` | handle | [actions/environmentPage.js:20](../src/electron/actions/environmentPage.js#L20) | `data: {environmentTestId: number, pageId: number, testCaseId: number, status: string, ...}, opt?: any` | Result object | Update test result for specific page/test |
| `environmentPage:generateReport` | handle | [actions/environmentPage.js:23](../src/electron/actions/environmentPage.js#L23) | `data: {environmentTestId: number, is_remediation_report?: boolean, ...}, opt?: any` | `{success: boolean, message?: string}` | Generate page results CSV report |
| `environmentPage:onTestCompleted` | listener | [preload/index.js:72](../src/electron/preload/index.js#L72) | Callback function | Unsubscribe function | Subscribe to page test completion events |

---

## 8. TEST CASE CHANNELS

Accessibility test case definitions and configuration.

| Channel | Type | Handler File | Parameters | Returns | Description |
|---------|------|--------------|-----------|---------|-------------|
| `testCase:find` | handle | [actions/testCase.js:4](../src/electron/actions/testCase.js#L4) | `data: any, opt?: any` | Array of test cases | Query test cases (system or custom) |
| `testCase:read` | handle | [actions/testCase.js:7](../src/electron/actions/testCase.js#L7) | `data: {id: number}, opt?: any` | TestCase object | Read test case definition |
| `testCase:create` | handle | [actions/testCase.js:10](../src/electron/actions/testCase.js#L10) | `data: {name: string, description: string, type: string, ...}, opt?: any` | TestCase object | Create custom test case |
| `testCase:update` | handle | [actions/testCase.js:13](../src/electron/actions/testCase.js#L13) | `data: {id: number, ...}, opt?: any` | TestCase object | Update test case definition |
| `testCase:updateIsSelected` | handle | [actions/testCase.js:16](../src/electron/actions/testCase.js#L16) | `data: {id: number, isSelected: boolean}, opt?: any` | Result object | Toggle test case selection |
| `testCase:delete` | handle | [actions/testCase.js:19](../src/electron/actions/testCase.js#L19) | `data: {id: number}, opt?: any` | Result object | Delete custom test case |

---

## 9. TEST PAGE/AXECORE CHANNELS

Low-level page scanning and axe-core integration.

| Channel | Type | Handler File | Parameters | Returns | Description |
|---------|------|--------------|-----------|---------|-------------|
| `test:getScript` | handle | [actions/testPage.js:4](../src/electron/actions/testPage.js#L4) | (forwarded to axecore lib) | Axe script string | Get axe-core injection script |
| `test:runScript` | handle | [actions/testPage.js:5](../src/electron/actions/testPage.js#L5) | (forwarded to axecore lib) | Execution result | Run axe-core scan on page |
| `test:handleResult` | handle | [actions/testPage.js:6](../src/electron/actions/testPage.js#L6) | `data: axeResult` | Processed result object | Process raw axe-core results |

---

## 10. SYSTEM STANDARD CHANNELS

Accessibility standards (WCAG, ATAG, VPAT) definition management.

| Channel | Type | Handler File | Parameters | Returns | Description |
|---------|------|--------------|-----------|---------|-------------|
| `systemStandard:find` | handle | [actions/systemStandard.js:4](../src/electron/actions/systemStandard.js#L4) | `data: any, opt?: any` | Array of standards | Query available standards |
| `systemStandard:findVersions` | handle | [actions/systemStandard.js:7](../src/electron/actions/systemStandard.js#L7) | `data: {standardId: number}, opt?: any` | Array of versions | Get standard versions (e.g., WCAG 2.1, 2.2) |
| `systemStandard:findPrinciples` | handle | [actions/systemStandard.js:10](../src/electron/actions/systemStandard.js#L10) | `data: {standardId: number, versionId: number}, opt?: any` | Array of principles | Get standard principles (Perceivable, Operable, etc.) |
| `systemStandard:findGuidelines` | handle | [actions/systemStandard.js:13](../src/electron/actions/systemStandard.js#L13) | `data: {principleId: number}, opt?: any` | Array of guidelines | Get guidelines under principle |
| `systemStandard:findCriteria` | handle | [actions/systemStandard.js:16](../src/electron/actions/systemStandard.js#L16) | `data: {guidelineId: number}, opt?: any` | Array of criteria | Get success criteria for guideline |

---

## 11. TECHNOLOGY CHANNELS

Technology/browser definition management.

| Channel | Type | Handler File | Parameters | Returns | Description |
|---------|------|--------------|-----------|---------|-------------|
| `technology:find` | handle | [actions/technology.js:4](../src/electron/actions/technology.js#L4) | `data: any, opt?: any` | Array of technologies | Query available technologies |
| `technology:read` | handle | [actions/technology.js:7](../src/electron/actions/technology.js#L7) | `data: {id: number}, opt?: any` | Technology object | Read technology definition |
| `technology:create` | handle | [actions/technology.js:10](../src/electron/actions/technology.js#L10) | `data: {name: string, version: string, ...}, opt?: any` | Technology object | Create new technology entry |
| `technology:update` | handle | [actions/technology.js:13](../src/electron/actions/technology.js#L13) | `data: {id: number, ...}, opt?: any` | Technology object | Update technology definition |
| `technology:delete` | handle | [actions/technology.js:16](../src/electron/actions/technology.js#L16) | `data: {id: number}, opt?: any` | Result object | Delete technology entry |

---

## 12. REMEDIATION CHANNELS

Remediation catalog management (319 built-in records).

| Channel | Type | Handler File | Parameters | Returns | Description |
|---------|------|--------------|-----------|---------|-------------|
| `remediation:find` | handle | [actions/remediation.js:4](../src/electron/actions/remediation.js#L4) | `data: any, opt?: any` | Array of remediations | Query remediation catalog |
| `remediation:read` | handle | [actions/remediation.js:7](../src/electron/actions/remediation.js#L7) | `data: {id: number}, opt?: any` | Remediation object | Read remediation details |
| `remediation:create` | handle | [actions/remediation.js:10](../src/electron/actions/remediation.js#L10) | `data: {title: string, description: string, ...}, opt?: any` | Remediation object | Create custom remediation |
| `remediation:update` | handle | [actions/remediation.js:13](../src/electron/actions/remediation.js#L13) | `data: {id: number, ...}, opt?: any` | Remediation object | Update remediation record |
| `remediation:updateIsSelected` | handle | [actions/remediation.js:16](../src/electron/actions/remediation.js#L16) | `data: {id: number, isSelected: boolean}, opt?: any` | Result object | Toggle remediation selection |
| `remediation:delete` | handle | [actions/remediation.js:19](../src/electron/actions/remediation.js#L19) | `data: {id: number}, opt?: any` | Result object | Delete remediation entry |

---

## 13. SYSTEM CATEGORY CHANNELS

Accessibility issue category management.

| Channel | Type | Handler File | Parameters | Returns | Description |
|---------|------|--------------|-----------|---------|-------------|
| `systemCategory:find` | handle | [actions/systemCategory.js:4](../src/electron/actions/systemCategory.js#L4) | `data: any, opt?: any` | Array of categories | Query issue categories |
| `systemCategory:read` | handle | [actions/systemCategory.js:7](../src/electron/actions/systemCategory.js#L7) | `data: {id: number}, opt?: any` | Category object | Read category definition |
| `systemCategory:create` | handle | [actions/systemCategory.js:10](../src/electron/actions/systemCategory.js#L10) | `data: {name: string, ...}, opt?: any` | Category object | Create new category |
| `systemCategory:update` | handle | [actions/systemCategory.js:13](../src/electron/actions/systemCategory.js#L13) | `data: {id: number, ...}, opt?: any` | Category object | Update category |
| `systemCategory:updateIsSelected` | handle | [actions/systemCategory.js:16](../src/electron/actions/systemCategory.js#L16) | `data: {id: number, isSelected: boolean}, opt?: any` | Result object | Toggle category selection |
| `systemCategory:updatePriority` | handle | [actions/systemCategory.js:19](../src/electron/actions/systemCategory.js#L19) | `data: {id: number, priority: number}, opt?: any` | Result object | Update category priority |
| `systemCategory:delete` | handle | [actions/systemCategory.js:22](../src/electron/actions/systemCategory.js#L22) | `data: {id: number}, opt?: any` | Result object | Delete category |

---

## 14. SYSTEM ENVIRONMENT CHANNELS

Test environment type definitions.

| Channel | Type | Handler File | Parameters | Returns | Description |
|---------|------|--------------|-----------|---------|-------------|
| `systemEnvironment:find` | handle | [actions/systemEnvironment.js:4](../src/electron/actions/systemEnvironment.js#L4) | `data: any, opt?: any` | Array of environment types | Query environment type definitions |
| `systemEnvironment:read` | handle | [actions/systemEnvironment.js:7](../src/electron/actions/systemEnvironment.js#L7) | `data: {id: number}, opt?: any` | SystemEnvironment object | Read environment type |
| `systemEnvironment:create` | handle | [actions/systemEnvironment.js:10](../src/electron/actions/systemEnvironment.js#L10) | `data: {name: string, ...}, opt?: any` | SystemEnvironment object | Create environment type |
| `systemEnvironment:update` | handle | [actions/systemEnvironment.js:13](../src/electron/actions/systemEnvironment.js#L13) | `data: {id: number, ...}, opt?: any` | SystemEnvironment object | Update environment type |
| `systemEnvironment:updateIsSelected` | handle | [actions/systemEnvironment.js:16](../src/electron/actions/systemEnvironment.js#L16) | `data: {id: number, isSelected: boolean}, opt?: any` | Result object | Toggle environment type selection |
| `systemEnvironment:delete` | handle | [actions/systemEnvironment.js:19](../src/electron/actions/systemEnvironment.js#L19) | `data: {id: number}, opt?: any` | Result object | Delete environment type |

---

## 15. ACCESSIBILITY SETTINGS CHANNELS

User accessibility preferences and settings.

| Channel | Type | Handler File | Parameters | Returns | Description |
|---------|------|--------------|-----------|---------|-------------|
| `accessibilitySettings:read` | handle | [actions/accessibilitySettings.js:4](../src/electron/actions/accessibilitySettings.js#L4) | None | Settings object | Read current accessibility settings |
| `accessibilitySettings:update` | handle | [actions/accessibilitySettings.js:7](../src/electron/actions/accessibilitySettings.js#L7) | `data: {[key: string]: any}` | Updated settings object | Update accessibility settings |
| `accessibilitySettings:reset` | handle | [actions/accessibilitySettings.js:10](../src/electron/actions/accessibilitySettings.js#L10) | `data: any` | Result object | Reset settings to defaults |

---

## 16. PAGE SCRIPTS CHANNELS

Dynamic page script injection for focus/selection testing.

| Channel | Type | Handler File | Parameters | Returns | Description |
|---------|------|--------------|-----------|---------|-------------|
| `pageScripts:getFocusScript` | handle | [actions/pageScripts.js:4](../src/electron/actions/pageScripts.js#L4) | `data: any, opt?: any` | Script string | Get focus highlight injection script |
| `pageScripts:getRemoveFocusScript` | handle | [actions/pageScripts.js:7](../src/electron/actions/pageScripts.js#L7) | `data: any, opt?: any` | Script string | Get focus highlight removal script |

---

## 17. AUDIT CHANNELS

Formal audit (WCAG-EM, ATAG, VPAT) management and reporting.

| Channel | Type | Handler File | Parameters | Returns | Description |
|---------|------|--------------|-----------|---------|-------------|
| `audit:find` | handle | [actions/audit.js:6](../src/electron/actions/audit.js#L6) | `data: any, opt?: any` | Array of audits | Query audits |
| `audit:read` | handle | [actions/audit.js:9](../src/electron/actions/audit.js#L9) | `data: {id: number}, opt?: any` | Audit object | Read audit details |
| `audit:create` | handle | [actions/audit.js:12](../src/electron/actions/audit.js#L12) | `data: {projectId: number, type: string, standard: string, ...}, opt?: any` | Audit object | Create new formal audit |
| `audit:update` | handle | [actions/audit.js:15](../src/electron/actions/audit.js#L15) | `data: {id: number, ...}, opt?: any` | Audit object | Update audit metadata |
| `audit:delete` | handle | [actions/audit.js:18](../src/electron/actions/audit.js#L18) | `data: {id: number}, opt?: any` | Result object | Delete audit |
| `audit:findAuditReportItems` | handle | [actions/audit.js:21](../src/electron/actions/audit.js#L21) | `data: {auditId: number}, opt?: any` | Array of audit items | Get all audit report items |
| `audit:updateAuditReportItem` | handle | [actions/audit.js:24](../src/electron/actions/audit.js#L24) | `data: {id: number, status: string, notes: string, ...}, opt?: any` | Result object | Update audit item evaluation |
| `audit:findAuditTypes` | handle | [actions/audit.js:27](../src/electron/actions/audit.js#L27) | `data: any, opt?: any` | Array of audit types | Get available audit types |
| `audit:findAuditChapters` | handle | [actions/audit.js:30](../src/electron/actions/audit.js#L30) | `data: {auditTypeId: number}, opt?: any` | Array of chapters | Get audit type chapters/sections |
| `audit:getStats` | handle | [actions/audit.js:33](../src/electron/actions/audit.js#L33) | `data: {auditId: number}, opt?: any` | Stats object | Get audit statistics summary |
| `audit:generateReport` | handle | [actions/audit.js:36](../src/electron/actions/audit.js#L36) | `data: {auditId: number, format: 'PDF' \| 'HTML' \| 'JSON'}, opt?: any` | `{success: boolean, message?: string}` | Generate and save audit report |

---

## 18. PROFILE CHANNELS

Testing profile/template management.

| Channel | Type | Handler File | Parameters | Returns | Description |
|---------|------|--------------|-----------|---------|-------------|
| `profile:find` | handle | [actions/profile.js:5](../src/electron/actions/profile.js#L5) | `data: any, opt?: any` | Array of profiles | Query test profiles |
| `profile:read` | handle | [actions/profile.js:8](../src/electron/actions/profile.js#L8) | `data: {id: number}, opt?: any` | Profile object | Read profile definition |
| `profile:create` | handle | [actions/profile.js:11](../src/electron/actions/profile.js#L11) | `data: {name: string, description: string, ...}, opt?: any` | Profile object | Create new test profile (rebuilds menu) |
| `profile:update` | handle | [actions/profile.js:16](../src/electron/actions/profile.js#L16) | `data: {id: number, ...}, opt?: any` | Profile object | Update profile |
| `profile:delete` | handle | [actions/profile.js:19](../src/electron/actions/profile.js#L19) | `data: {id: number}, opt?: any` | Result object | Delete profile (rebuilds menu) |

---

## 19. SYSTEM COUNTRY CHANNELS

Country/locale definitions for audit standards.

| Channel | Type | Handler File | Parameters | Returns | Description |
|---------|------|--------------|-----------|---------|-------------|
| `systemCountry:find` | handle | [actions/systemCountry.js:4](../src/electron/actions/systemCountry.js#L4) | `data: any, opt?: any` | Array of countries | Query available countries |
| `systemCountry:read` | handle | [actions/systemCountry.js:7](../src/electron/actions/systemCountry.js#L7) | `data: {id: number}, opt?: any` | Country object | Read country definition |

---

## 20. LANDMARK CHANNELS

Accessibility landmark classification (11 types).

| Channel | Type | Handler File | Parameters | Returns | Description |
|---------|------|--------------|-----------|---------|-------------|
| `landmark:find` | handle | [actions/landmark.js:4](../src/electron/actions/landmark.js#L4) | `data: any, opt?: any` | Array of landmarks | Query landmark types |
| `landmark:read` | handle | [actions/landmark.js:7](../src/electron/actions/landmark.js#L7) | `data: {id: number}, opt?: any` | Landmark object | Read landmark definition |

---

## Common Parameter Patterns

### Standard CRUD Operations

Most data entities follow this pattern:

```typescript
// Find/Query
find(data?: QueryFilter, opt?: QueryOptions): Promise<Entity[]>
// Optional: data can be empty for all records
// opt might contain pagination: { page: 1, limit: 20 }

// Read Single
read(data: {id: number}, opt?: Options): Promise<Entity>

// Create
create(data: EntityData, opt?: Options): Promise<Entity>

// Update
update(data: {id: number, ...EntityData}, opt?: Options): Promise<Entity>

// Delete
delete(data: {id: number}, opt?: Options): Promise<Result>
```

### Common Return Patterns

```typescript
// Success Result
{ success: true, data?: any, message?: string }

// File Save Result (for reports)
{ success: true, message: 'File saved successfully' }
{ success: false, message: 'Error saving file' }

// Entity Results
Promise<Entity | Entity[] | null>

// Listeners (subscriptions)
createIpcListener(channel, callback): UnsubscribeFn
```

---

## Error Handling

### Standard Error Flow

1. **Validation Errors**: Caught in lib functions, typically throw error objects
2. **Database Errors**: Wrapped by Sequelize ORM, may trigger transaction rollbacks
3. **I/O Errors**: Caught during file/report operations
4. **Display Errors**: Use `system:error` channel to show error dialog to user

### Sending Errors to UI

```typescript
// From preload/renderer
try {
  const result = await window.api.project.find();
} catch (error) {
  window.system.log.error(error);
  window.system.showError('Failed to load projects', {title: 'Error'});
}
```

---

## Event Subscription Pattern

### One-Time Listeners

```typescript
// From renderer
const unsubscribe = window.api.global.onNavigate((url) => {
  console.log('Navigation:', url);
});

// When done:
unsubscribe();
```

### Available Listeners

- `window.api.global.onNavigate(cb)` - Main window navigation
- `window.api.environmentTest.onTestCompleted(cb)` - Test completion event
- `window.api.environmentPage.onTestCompleted(cb)` - Page test completion
- `window.api.webview.onNavigate(cb)` - Webview navigation events

---

## File Download/Export Operations

### Report Generation Flow

1. **Client initiates**: `await window.api.audit.generateReport({auditId, format: 'PDF'})`
2. **Server generates**: Creates PDF buffer and calls `dialog.showSaveDialog()`
3. **User saves**: Dialog prompts user for save location
4. **Server writes**: Writes buffer to selected filepath
5. **Returns**: `{success: true/false, message?: string}`

### Supported Formats

- **Audit Reports**: PDF, HTML, JSON
- **Test Reports**: PDF (page test), CSV (page results)
- **Remediation Reports**: CSV

---

## Performance Considerations

### Async Operations

These channels are marked `async` and may take time:

- `environment:generate-sitemap` - URL crawling
- `environmentTest:startTest` - Test initialization
- `environmentTest:generateReport` - PDF generation
- `audit:generateReport` - Report compilation
- `profile:create/delete` - Menu rebuild

**Recommendation**: Show loading indicators when calling these.

### Query Optimization

For `find()` operations with large result sets:

```typescript
// Use pagination
await window.api.project.find({}, {page: 1, limit: 50})

// Use filters to reduce results
await window.api.testCase.find({type: 'automated'}, {})
```

---

## Security Notes

### Context Isolation

- Preload bridge uses `contextBridge.exposeInMainWorld()` with strict filtering
- Direct Node.js APIs not exposed to renderer
- All IPC calls validated at main process

### Restricted Operations

- File dialogs only for report export (user-initiated)
- External link opening requires permission check (Settings.can_open_browser)
- EULA acceptance persisted to database

---

## Version Compatibility

- **Electron**: 38.2.0
- **Node.js**: Included in Electron runtime
- **Preload Protocol**: Standard Electron context bridge v12+

---

## References

- [Electron IPC Documentation](https://www.electronjs.org/docs/api/ipc-main)
- [Context Bridge Documentation](https://www.electronjs.org/docs/api/context-bridge)
- Project source: [/src/electron/](../src/electron/)
- Action files: [/src/electron/actions/](../src/electron/actions/)
- Library layer: [/src/electron/lib/](../src/electron/lib/)
