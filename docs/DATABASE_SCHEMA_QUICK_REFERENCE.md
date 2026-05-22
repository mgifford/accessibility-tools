# Database Schema - Quick Reference Checklist

**Last Updated**: May 22, 2026  
**For**: Developers working with the Accessibility Tools database

---

## 📋 Model Inventory Checklist

### ✅ Main Models (18 total - User Data)

- [x] **project** - UUID PK | Top-level testing effort
- [x] **environment** - UUID PK | Website/app to test
- [x] **environmentPage** - UUID PK | Specific page in environment (self-ref parent)
- [x] **environmentTest** - UUID PK | Test run/session (cascade delete)
- [x] **environmentTestPage** - Composite PK | Junction for tests ↔ pages
- [x] **testCase** - STRING PK | Test scenario (manual/automatic)
- [x] **testCaseEnvironmentTestPage** - UUID PK | Test execution on page (unique composite)
- [x] **testCaseEnvironmentTestPageTarget** - UUID PK | Individual findings (indexed, self-ref)
- [x] **testPageTargetOccurrence** - Composite PK | Target relationships
- [x] **audit** - UUID PK | Formal audit document
- [x] **auditItem** - Composite PK | Items in audit
- [x] **remediation** - STRING PK | Fix recommendations
- [x] **remediationExample** - UUID PK | Code examples
- [x] **profile** - UUID PK | User profiles
- [x] **profileOrganization** - UUID PK | Organization details (cascade delete)
- [x] **technology** - STRING PK | Tech stack items
- [x] **settings** - INTEGER PK | App settings (singleton)
- [x] **accessibilitySettings** - INTEGER PK | UI accessibility settings
- [x] **migration** - STRING PK | Schema migration tracking

### ✅ System Models (20 total - Reference Data)

**Standard Hierarchy**:
- [x] **systemStandard** - STRING PK | Top-level (WCAG)
- [x] **systemStandardVersion** - STRING PK | Versions (2.0, 2.1, 2.2)
- [x] **systemStandardPrinciple** - STRING PK | Principles (4)
- [x] **systemStandardGuideline** - STRING PK | Guidelines (13)
- [x] **systemStandardCriteria** - STRING PK | Criteria (87)

**Geographic Data**:
- [x] **systemContinent** - STRING PK | Continents
- [x] **systemCountry** - STRING PK | Countries (247)
- [x] **systemState** - STRING PK | States/Provinces

**Categories & Components**:
- [x] **systemCategory** - STRING PK | Categories (11)
- [x] **systemLandmark** - STRING PK | Landmarks (11)
- [x] **systemAxeRules** - STRING PK | Axe rules

**Audit Framework**:
- [x] **systemAuditType** - STRING PK | Audit types
- [x] **systemAuditTypeVersion** - STRING PK | Audit versions
- [x] **systemAuditChapter** - STRING PK | Audit chapters
- [x] **systemAuditChapterSection** - STRING PK | Chapter sections
- [x] **systemAuditChapterSectionItem** - STRING PK | Section items
- [x] **systemAuditChapterSectionItemType** - STRING PK | Item types
- [x] **systemAuditChapterAuditTypeVersion** - Composite PK | Audit mapping

**Synchronization**:
- [x] **systemSync** - INTEGER PK | Last sync timestamp

---

## 🔗 Relationship Types Checklist

### One-to-Many Relationships
- [x] project → environment (hasMany)
- [x] project → audit (hasMany)
- [x] environment → environmentPage (hasMany)
- [x] environment → environmentTest (hasMany)
- [x] environmentTest → testCaseEnvironmentTestPage (hasMany)
- [x] testCase → testCaseEnvironmentTestPage (hasMany)
- [x] testCaseEnvironmentTestPage → testCaseEnvironmentTestPageTarget (hasMany)
- [x] testCaseEnvironmentTestPageTarget → testCaseEnvironmentTestPageTarget (self-ref children)
- [x] remediation → remediationExample (hasMany)
- [x] audit → auditItem (hasMany)
- [x] systemStandard → systemStandardVersion (hasMany)
- [x] systemStandard → systemStandardPrinciple (hasMany)
- [x] systemStandardPrinciple → systemStandardGuideline (hasMany)
- [x] systemCountry → systemState (hasMany)

### Many-to-Many Relationships
- [x] project ↔ technology (through: project_technology)
- [x] environmentTest ↔ environmentPage (through: environmentTestPage, scoped)
- [x] testCase ↔ remediation (through: test_case_remediations)
- [x] testCase ↔ systemAxeRules (through: test_case_axe_rules)
- [x] testCase ↔ systemStandardCriteria (through: test_case_criteria)
- [x] remediation ↔ systemStandardCriteria (through: remediation_criteria)
- [x] systemStandardVersion ↔ systemStandardPrinciple (through: system_version_principle)
- [x] systemStandardVersion ↔ systemStandardGuideline (through: system_version_guideline)
- [x] systemStandardVersion ↔ systemStandardCriteria (through: system_version_criteria)
- [x] systemAuditChapterSectionItem ↔ systemAuditChapterSectionItemType (through: system_audit_item_types)
- [x] systemAuditChapterSection ↔ audit (through: audit_chapter_section_audit)
- [x] testCaseEnvironmentTestPageTarget ↔ testCaseEnvironmentTestPageTarget (through: testPageTargetOccurrence, self-ref)

### One-to-One Relationships
- [x] profile → profileOrganization (hasOne, cascade delete)
- [x] systemStandardCriteria → systemAuditChapterSectionItem (hasOne)

### Self-Referential Relationships
- [x] environmentPage.parent_id → environmentPage (hierarchy)
- [x] testCaseEnvironmentTestPageTarget.parent_landmark_id → testCaseEnvironmentTestPageTarget (hierarchy)
- [x] testCaseEnvironmentTestPageTarget ↔ testCaseEnvironmentTestPageTarget (many-to-many)

---

## 🔑 Key Column Checklist

### Primary Key Types
- [x] UUID v4: project, environment, environmentPage, environmentTest, testCaseEnvironmentTestPage, testCaseEnvironmentTestPageTarget, audit, remediationExample, profile, profileOrganization
- [x] STRING (Semantic): testCase, remediation, technology, all system models
- [x] INTEGER: settings, accessibilitySettings, systemSync
- [x] Composite: auditItem, environmentTestPage, testPageTargetOccurrence, systemAuditChapterAuditTypeVersion

### Foreign Key Types
- [x] UUID → UUID (most common)
- [x] STRING → STRING (system references)
- [x] Self-referential UUID → UUID (hierarchies)
- [x] Mixed types (testCaseEnvironmentTestPageTarget with system_landmark_id: STRING)

### Important Columns
- [x] Status enum fields: audit.status, environmentTest.status, testCaseEnvironmentTestPage.status, testCaseEnvironmentTestPageTarget.status
- [x] Type enum fields: testCase.type (MANUAL/AUTOMATIC), environmentTestPage.page_type (RANDOM/STRUCTURED)
- [x] Level enum fields: systemStandardCriteria.level (A/AA/AAA)
- [x] Count fields: testCaseEnvironmentTestPageTarget.related_target_count, related_remediation_count
- [x] Boolean flags: project.connected, environmentPage.not_clickable, remediation.is_selected, profile.is_system, is_manually_reviewed

---

## 📊 Built-in Data Checklist

### System Records Pre-loaded
- [x] Standards: 1 (WCAG)
- [x] Versions: 3 (2.0, 2.1, 2.2)
- [x] Principles: 4 (Perceivable, Operable, Understandable, Robust)
- [x] Guidelines: 13 (1.1-3.4)
- [x] Criteria: 87 (success criteria with levels)
- [x] Countries: 247 (with phone prefixes)
- [x] Categories: 11 (test/remediation categories)
- [x] Landmarks: 11 (HTML roles)
- [x] Environments: 4 (sample test environments)
- [x] Technologies: 6 (web stack)

### Where Loaded
- [x] Source: `/src/electron/db/systemData.json`
- [x] Size: 20,799 lines, 971 key entries
- [x] Total Records: ~370

---

## 🔄 Cascade & Constraint Behaviors Checklist

### DELETE CASCADE Paths
- [x] environmentTest → testCaseEnvironmentTestPage (via beforeDestroy hook)
- [x] testCaseEnvironmentTestPage → testCaseEnvironmentTestPageTarget (via beforeDestroy hook)
- [x] testCase → testCaseEnvironmentTestPage (via beforeDestroy hook)
- [x] profile → profileOrganization (configured onDelete: CASCADE)

### SET NULL Behaviors
- [x] testCaseEnvironmentTestPageTarget.remediation_id → NULL
- [x] testCaseEnvironmentTestPageTarget.system_landmark_id → NULL (onDelete: SET NULL)
- [x] testCaseEnvironmentTestPageTarget.parent_landmark_id → NULL (onDelete: SET NULL)

### Unique Constraints
- [x] testCaseEnvironmentTestPage: Composite (test_case_id, environment_page_id, environment_test_id)
- [x] audit: identifier field (application-level)
- [x] migration: name field (primary key, unique)

### Validation Hooks
- [x] testCaseEnvironmentTestPage.beforeCreate: Validates page belongs to test environment
- [x] testCaseEnvironmentTestPage.beforeCreate: Sets status based on test type
- [x] All beforeDestroy hooks: Use transactions for atomicity

---

## 📈 Indexing Strategy Checklist

### Automatic Indexes (Primary Keys)
- [x] All primary keys auto-indexed

### Secondary Indexes
- [x] testCaseEnvironmentTestPageTarget.status (filter by result)
- [x] testCaseEnvironmentTestPageTarget.test_case_page_id (FK lookup)
- [x] testCaseEnvironmentTestPageTarget.remediation_id (FK lookup)
- [x] testCaseEnvironmentTestPageTarget.related_target_count (sort)
- [x] testCaseEnvironmentTestPageTarget.related_remediation_count (sort)
- [x] testCaseEnvironmentTestPageTarget.system_landmark_id (1.0.1 migration)
- [x] testCaseEnvironmentTestPageTarget.parent_landmark_id (1.0.1 migration)
- [x] testPageTargetOccurrence.page_target_id (relationship lookup)
- [x] testPageTargetOccurrence.related_page_target_id (reverse lookup)

---

## 🔧 Migration Checklist

### Completed Migrations
- [x] 1.0.0-sample.js: Empty (initial)
- [x] 1.0.1-testLandmarks.js: Added landmark support
- [x] 1.0.1-testOccurrenceCounts.js: Added count fields
- [x] 1.0.2-environmentPage.js: Added domain column
- [x] 1.0.3-postLogin.js: Added manual review flag

### Migration Locations
- [x] Source: `/src/electron/db/migrations/`
- [x] Naming: `VERSION-feature.js` (e.g., `1.0.1-testLandmarks.js`)
- [x] Tracking: `migration` table stores applied migrations
- [x] Pattern: Both `up()` and `down()` functions required
- [x] Transactions: All migrations wrapped in `sequelize.transaction()`

---

## 📋 Relationship Mapping Checklist

### belongsTo (Many → One)
- [x] environment → project
- [x] environmentPage → environment
- [x] environmentTest → environment
- [x] testCase → systemStandard
- [x] testCase → systemCategory
- [x] testCaseEnvironmentTestPage → testCase
- [x] testCaseEnvironmentTestPage → environmentPage
- [x] testCaseEnvironmentTestPage → environmentTest
- [x] testCaseEnvironmentTestPageTarget → testCaseEnvironmentTestPage
- [x] testCaseEnvironmentTestPageTarget → remediation
- [x] testCaseEnvironmentTestPageTarget → systemLandmark
- [x] testCaseEnvironmentTestPageTarget → testCaseEnvironmentTestPageTarget (parent)
- [x] audit → project
- [x] audit → environment
- [x] audit → environmentTest
- [x] audit → profile
- [x] audit → systemAuditType
- [x] audit → systemAuditTypeVersion
- [x] auditItem → audit
- [x] auditItem → systemAuditChapterSectionItem
- [x] auditItem → systemAuditChapterSectionItemType
- [x] remediation → systemCategory
- [x] remediationExample → remediation
- [x] profileOrganization → profile
- [x] profileOrganization → systemCountry
- [x] profileOrganization → systemState
- [x] systemStandardVersion → systemStandard
- [x] systemStandardPrinciple → systemStandard
- [x] systemStandardGuideline → systemStandard
- [x] systemStandardGuideline → systemStandardPrinciple
- [x] systemStandardCriteria → systemStandard
- [x] systemStandardCriteria → systemStandardPrinciple
- [x] systemStandardCriteria → systemStandardGuideline
- [x] systemCountry → systemContinent
- [x] systemState → systemCountry
- [x] systemAuditTypeVersion → systemAuditType
- [x] systemAuditChapterSection → systemAuditChapter
- [x] systemAuditChapterSectionItem → systemAuditChapterSection
- [x] systemAuditChapterSectionItem → systemStandardCriteria
- [x] systemAuditChapterAuditTypeVersion → systemAuditChapter
- [x] systemAuditChapterAuditTypeVersion → systemAuditType

### hasMany (One → Many)
- [x] project → environment
- [x] project → audit
- [x] environment → environmentPage
- [x] environment → environmentTest
- [x] environmentPage → testCaseEnvironmentTestPage
- [x] environmentTest → testCaseEnvironmentTestPage
- [x] testCase → testCaseEnvironmentTestPage
- [x] testCaseEnvironmentTestPage → testCaseEnvironmentTestPageTarget
- [x] testCaseEnvironmentTestPageTarget → testCaseEnvironmentTestPageTarget (children)
- [x] audit → auditItem
- [x] remediation → remediationExample
- [x] systemStandard → systemStandardVersion
- [x] systemStandard → systemStandardPrinciple
- [x] systemStandard → systemStandardGuideline
- [x] systemStandardPrinciple → systemStandardGuideline
- [x] systemStandardPrinciple → systemStandardCriteria
- [x] systemStandardGuideline → systemStandardCriteria
- [x] systemContinent → systemCountry
- [x] systemCountry → systemState
- [x] systemCategory → remediation
- [x] systemAuditType → systemAuditTypeVersion
- [x] systemAuditType → systemAuditChapterAuditTypeVersion
- [x] systemAuditChapter → systemAuditChapterSection
- [x] systemAuditChapter → systemAuditChapterAuditTypeVersion
- [x] systemAuditChapterSection → systemAuditChapterSectionItem
- [x] systemAuditChapterSectionItem → auditItem
- [x] systemAuditChapterSectionItemType → auditItem

### belongsToMany (Many ↔ Many)
- [x] project ↔ technology
- [x] environmentTest ↔ environmentPage (scoped RANDOM/STRUCTURED)
- [x] testCase ↔ remediation
- [x] testCase ↔ systemAxeRules
- [x] testCase ↔ systemStandardCriteria
- [x] remediation ↔ systemStandardCriteria
- [x] systemStandardVersion ↔ systemStandardPrinciple
- [x] systemStandardVersion ↔ systemStandardGuideline
- [x] systemStandardVersion ↔ systemStandardCriteria
- [x] systemAuditChapterSectionItem ↔ systemAuditChapterSectionItemType
- [x] systemAuditChapterSection ↔ audit
- [x] testCaseEnvironmentTestPageTarget ↔ testCaseEnvironmentTestPageTarget (self-ref)

### hasOne (One → One)
- [x] profile → profileOrganization
- [x] systemStandardCriteria → systemAuditChapterSectionItem

---

## 📂 File Structure Checklist

### Model Files Location
- [x] `/src/electron/db/models/` - Main models (18 files)
- [x] `/src/electron/db/models/system/` - System models (20 files)

### Database-Related Files
- [x] `/src/electron/db/models/` - Sequelize ORM models
- [x] `/src/electron/db/migrations/` - Schema migrations (5 files)
- [x] `/src/electron/db/systemData.json` - Pre-loaded reference data
- [x] `/build/db/models/` - Compiled models (for production)
- [x] `/build/db/migrations/` - Compiled migrations
- [x] `/build/db/systemData.json` - Compiled system data

### Documentation Files
- [x] `/docs/DATABASE_SCHEMA.md` - Complete schema documentation (3,500+ lines)
- [x] `/docs/DATABASE_SCHEMA.json` - Machine-readable schema (1,000+ lines)
- [x] `/docs/DATABASE_SCHEMA_GUIDE.md` - Developer guide
- [x] `/docs/DATABASE_SCHEMA_QUICK_REFERENCE.md` - This file

---

## 🧪 Testing Checklist

### Test Data Needed
- [x] Create project with test environment
- [x] Add pages to environment
- [x] Create test run (environmentTest)
- [x] Execute test cases on pages
- [x] Create findings/targets
- [x] Link to remediations
- [x] Create formal audit
- [x] Add audit items

### Common Test Queries
- [x] Find all findings for a test run
- [x] Count findings by status
- [x] Get remediations for a finding
- [x] Get WCAG criteria for a test case
- [x] Generate audit report data
- [x] Find related/duplicate targets

---

## 📚 Documentation Checklist

### Available Documentation
- [x] DATABASE_SCHEMA.md - Complete specification (START HERE)
- [x] DATABASE_SCHEMA.json - Machine-readable format
- [x] DATABASE_SCHEMA_GUIDE.md - Developer guide with patterns
- [x] DATABASE_SCHEMA_QUICK_REFERENCE.md - This checklist
- [x] IPC_SPECIFICATION.md - API operations for database
- [x] FEATURES.md - Product features and data model
- [x] CONTRIBUTING.md - Migration guidelines

### Documentation Coverage
- [x] All 38 models documented
- [x] All columns documented with types
- [x] All primary keys documented
- [x] All foreign keys documented
- [x] All relationships documented
- [x] All cascade behaviors documented
- [x] All constraints documented
- [x] All indexes documented
- [x] All migrations documented
- [x] All built-in data documented

---

## ✨ Quick Links

| Need | Location |
|------|----------|
| Complete Schema | [DATABASE_SCHEMA.md](/docs/DATABASE_SCHEMA.md) |
| Machine Readable | [DATABASE_SCHEMA.json](/docs/DATABASE_SCHEMA.json) |
| Developer Guide | [DATABASE_SCHEMA_GUIDE.md](/docs/DATABASE_SCHEMA_GUIDE.md) |
| Model Sources | `/src/electron/db/models/` |
| Migrations | `/src/electron/db/migrations/` |
| System Data | `/src/electron/db/systemData.json` |
| API Operations | [IPC_SPECIFICATION.md](/docs/IPC_SPECIFICATION.md) |
| Features | [FEATURES.md](/FEATURES.md) |

---

## ⚠️ Important Notes

- **Cascade Delete Transactions**: All cascade deletes use transactions to ensure atomicity
- **Migration Format**: Always include both `up()` and `down()` functions
- **Foreign Key Types**: Ensure type matches (UUID vs STRING)
- **Unique Constraints**: Check composite keys before creating duplicates
- **Hooks**: beforeCreate and beforeDestroy hooks add important logic
- **Indexes**: Check existing indexes before adding duplicates
- **Relationships**: Verify both sides of M2M relationships are configured

---

**Generated**: May 22, 2026  
**Status**: ✅ Complete  
**Version**: 1.0
