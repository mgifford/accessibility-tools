# Electron IPC Channels - Quick Reference

**115+ IPC Channels organized by module**

## Module Index

| Module | Channels | File | Purpose |
|--------|----------|------|---------|
| System | 7 | `main/index.js` | App lifecycle, logging, errors |
| Navigation | 2 | `main/index.js` | Window/webview navigation events |
| Theme | 3 | `actions/theme.js` | Application theme management |
| Project | 5 | `actions/project.js` | Project CRUD |
| Environment | 9 | `actions/environment.js` | Environment config & sitemap |
| EnvironmentTest | 16 | `actions/environmentTest.js` | Test execution & results |
| EnvironmentPage | 8 | `actions/environmentPage.js` | Per-page testing |
| TestCase | 6 | `actions/testCase.js` | Test definitions |
| TestPage | 3 | `actions/testPage.js` | axe-core integration |
| SystemStandard | 5 | `actions/systemStandard.js` | WCAG/ATAG/VPAT standards |
| Technology | 5 | `actions/technology.js` | Browser/tech definitions |
| Remediation | 6 | `actions/remediation.js` | Remediation catalog (319 records) |
| SystemCategory | 7 | `actions/systemCategory.js` | Issue categories |
| SystemEnvironment | 6 | `actions/systemEnvironment.js` | Environment types |
| AccessibilitySettings | 3 | `actions/accessibilitySettings.js` | User preferences |
| PageScripts | 2 | `actions/pageScripts.js` | Focus/highlight scripts |
| Audit | 11 | `actions/audit.js` | Formal audits (WCAG-EM, etc.) |
| Profile | 5 | `actions/profile.js` | Test profiles/templates |
| SystemCountry | 2 | `actions/systemCountry.js` | Country/locale definitions |
| Landmark | 2 | `actions/landmark.js` | Landmark classifications (11 types) |
| **TOTAL** | **115** | **18 files** | |

---

## Channel Lookup Tables

### System & App Lifecycle

```
system:exit              -> Quit app
system:acceptEula        -> Accept EULA, rebuild window
system:getAssetsPath     -> Get /assets or app:// path
system:error             -> Show error dialog
log:info, error, rejection -> Send logs to electron-log
navigate                 -> Listen to window nav
webview:navigate         -> Broadcast webview nav
```

### Data CRUD Patterns

**Standard Operations** (most entities follow this):
```
<entity>:find           -> Query/filter records
<entity>:read           -> Get single by ID
<entity>:create         -> Create new
<entity>:update         -> Update existing
<entity>:delete         -> Delete by ID
```

**Special Updates**:
```
<entity>:updateIsSelected  -> Toggle selection
<entity>:updatePriority    -> Set priority
```

### Complex Operations

```
environment:generate-sitemap      -> Crawl URLs, build sitemap
environment:dns-lookup            -> Resolve domain
environment:get-sitemap           -> Fetch existing sitemap
environment:create-page           -> Add test page

environmentTest:startTest         -> Initialize test session
environmentTest:closeTest         -> Finalize test
environmentTest:openClosedTest    -> Reopen closed test
environmentTest:getSitemap        -> Get test structure
environmentTest:getStats          -> Test summary
environmentTest:generateReport    -> Export PDF
environmentTest:generateOccurrenceData -> Generate results
environmentTest:hasOccurrenceData -> Check if generated
environmentTest:addPage           -> Add page to active test
environmentTest:rescanSitemap     -> Recrawl pages

environmentPage:scanPage          -> Run a11y scan on page
environmentPage:findTestCases     -> Get applicable tests
environmentPage:findTestCaseNodes -> Find DOM elements
environmentPage:readTestCase      -> Get test details
environmentPage:updateEnvironmentTestTarget -> Record result
environmentPage:generateReport    -> Export CSV

test:getScript                     -> Get axe-core inject script
test:runScript                     -> Run axe-core
test:handleResult                  -> Process axe results

systemStandard:findVersions        -> Get WCAG versions
systemStandard:findPrinciples      -> Get principles
systemStandard:findGuidelines      -> Get guidelines
systemStandard:findCriteria        -> Get success criteria

pageScripts:getFocusScript         -> Focus highlight script
pageScripts:getRemoveFocusScript   -> Remove highlight script

audit:findAuditReportItems         -> Get all audit items
audit:updateAuditReportItem        -> Update item status
audit:findAuditTypes               -> Get audit types
audit:findAuditChapters            -> Get type chapters
audit:getStats                     -> Audit summary
audit:generateReport               -> Export PDF/HTML/JSON
```

### Event Listeners

```
onNavigate (global)                -> Listen to nav events
onTestCompleted (environmentTest)  -> Listen to test done
onTestCompleted (environmentPage)  -> Listen to page done
onNavigate (webview)               -> Listen to webview nav
```

---

## Common API Patterns

### Accessing from Renderer (React/Next.js)

```javascript
// Preload exposes: window.api, window.system

// CRUD Example
const projects = await window.api.project.find();
const project = await window.api.project.read({id: 1});
const created = await window.api.project.create({name: 'My Project'});
const updated = await window.api.project.update({id: 1, name: 'Updated'});
await window.api.project.delete({id: 1});

// Special update
await window.api.testCase.updateIsSelected({id: 1, isSelected: true});

// System operations
window.system.exit();
window.system.acceptEula();
const path = await window.system.getAssetsPath();

// Logging
window.system.log.info('Message');
window.system.log.error(error);
window.system.showError('Failed to load', {title: 'Error'});

// Theme
await window.api.theme.set('dark');
const current = await window.api.theme.current();
window.api.theme.setToSystem();

// Event listeners
const unsubscribe = window.api.global.onNavigate((url) => {
  console.log('Navigated to:', url);
});
// Later: unsubscribe();
```

### Complex Workflows

```javascript
// Run full test on environment
const envTest = await window.api.environmentTest.create({environmentId: 1});
await window.api.environmentTest.start({id: envTest.id});

// Listen for completion
window.api.environmentTest.onTestCompleted((result) => {
  console.log('Test completed:', result);
});

// Later: close and generate report
await window.api.environmentTest.closeTest({id: envTest.id});
const reportResult = await window.api.environmentTest.generateReport({
  id: envTest.id
});
// User prompted to save PDF
```

---

## Async vs Sync Operations

### Async (User should see loading indicator)
- All file operations: generateReport, generateOccurrenceData
- Network operations: generateSitemap, dns-lookup
- Complex DB operations: startTest, closeTest, scan operations
- Any marked `async` in action files

### Sync (Fast return expected)
- Simple CRUD: find, read, create, update, delete
- Settings: read/update/reset
- Data queries: findVersions, findPrinciples, findCriteria
- Metadata operations: updateIsSelected, updatePriority

---

## Return Value Patterns

### Success Results
```javascript
// Boolean/void
true / undefined

// Entity
{id: 1, name: 'Project', ...}

// Arrays
[{id: 1, ...}, {id: 2, ...}]

// Statistics
{pass: 10, fail: 5, incomplete: 2, ...}
```

### File Export Results
```javascript
{success: true, message: 'File saved successfully'}
{success: false, message: 'Error saving file'}
```

---

## Error Handling Patterns

```javascript
try {
  const result = await window.api.project.find();
} catch (error) {
  window.system.log.error(error);
  window.system.showError(`Failed to load projects: ${error.message}`);
}
```

---

## Important Implementation Notes

1. **Preload Bridge**: All API calls go through `window.api.*` or `window.system.*`
2. **No Direct Node**: Renderer cannot require/use Node modules directly
3. **Event Listeners**: Use `createIpcListener` pattern for subscriptions
4. **Report Generation**: Shows native file dialog, user selects save location
5. **Menu Rebuild**: profile:create and profile:delete rebuild app menu
6. **EULA**: Must be accepted via system:acceptEula before accessing app
7. **Context Isolation**: Fully enabled - no access to main process internals

---

## File Locations Reference

| Component | Path |
|-----------|------|
| Preload Bridge | `src/electron/preload/index.js` |
| Webview Bridge | `src/electron/preload/webview.js` |
| Action Handlers | `src/electron/actions/*.js` |
| Main Process | `src/electron/main/index.js` |
| Business Logic | `src/electron/lib/*.js` |
| Database Models | `src/electron/db/models/` |

---

Generated: May 22, 2026  
Total IPC Channels: 115+  
Architecture: Electron 38.2.0 + Next.js 14.2.31 + React 18 + Sequelize ORM
