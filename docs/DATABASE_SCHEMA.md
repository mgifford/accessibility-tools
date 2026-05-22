# Accessibility Tools - Complete Database Schema Documentation

**Last Updated**: May 22, 2026  
**Database Type**: SQLite with Sequelize ORM  
**Total Models**: 37 (18 main + 19 system models)  
**Total Tables**: ~33 database tables  
**Built-in System Records**: ~370 records pre-loaded

---

## Table of Contents
1. [Overview](#overview)
2. [Main Models (User Data)](#main-models-user-data)
3. [System Models (Reference Data)](#system-models-reference-data)
4. [Relationships Diagram](#relationships-diagram)
5. [Many-to-Many Relationships](#many-to-many-relationships)
6. [Cascading Behaviors](#cascading-behaviors)
7. [Built-in System Data](#built-in-system-data)
8. [Migrations & Schema Evolution](#migrations--schema-evolution)
9. [Indexes](#indexes)
10. [Constraints & Special Behaviors](#constraints--special-behaviors)

---

## Overview

### Architecture
The database follows a clear separation between:
- **Main Models**: User-created projects, environments, tests, audits, and findings
- **System Models**: Reference data loaded at startup (WCAG standards, countries, categories, etc.)

### Key Design Patterns
- **UUID Primary Keys**: Most user-created data uses UUID v4 for global uniqueness
- **String Primary Keys**: System data uses semantic string IDs (e.g., "1.1", "WCAG")
- **Cascading Deletes**: Environment tests cascade delete test cases and targets
- **Transaction Support**: Complex operations use Sequelize transactions
- **Hooks**: beforeCreate, beforeDestroy hooks for data validation and cleanup
- **Soft Dependencies**: Some foreign keys allow NULL for optional relationships

---

## Main Models (User Data)

### 1. **project** Table
**Purpose**: Top-level container for accessibility testing efforts  
**Primary Key**: `id` (UUID v4)

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | UUID | NO | UUIDV4 | Primary key |
| name | STRING | NO | - | Required project name |
| image | STRING | YES | - | Project image/logo path |
| connected | BOOLEAN | YES | false | Connection status flag |
| essential_functionality | TEXT | YES | - | Description of core functionality |
| webpage_types | TEXT | YES | - | Types of webpages in project |
| createdAt | DATETIME | NO | NOW | Auto-added by Sequelize |
| updatedAt | DATETIME | NO | NOW | Auto-added by Sequelize |

**Relationships**:
- `hasMany(environment)` - One project has multiple environments
- `belongsToMany(technology)` - Many-to-many through `project_technology` junction table

**Indexes**: Primary key on `id`

---

### 2. **environment** Table
**Purpose**: Represents specific websites/applications being tested within a project  
**Primary Key**: `id` (UUID v4)  
**Foreign Keys**: `project_id` (→ project)

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | UUID | NO | UUIDV4 | Primary key |
| name | STRING | NO | - | Environment name (e.g., "Production", "Staging") |
| url | STRING | NO | - | Base URL of environment |
| project_id | UUID | NO | - | Foreign key to project |
| createdAt | DATETIME | NO | NOW | Auto-added by Sequelize |
| updatedAt | DATETIME | NO | NOW | Auto-added by Sequelize |

**Relationships**:
- `belongsTo(project)` - Each environment belongs to one project
- `hasMany(environmentTest)` - One environment has multiple test runs
- `hasMany(environmentPage)` - One environment has multiple pages (implicit through audit)

**Constraints**: 
- Must have valid `project_id`
- URL must be valid format (validated in application layer)

---

### 3. **environmentPage** Table
**Purpose**: Specific pages/URLs within an environment that can be tested  
**Primary Key**: `id` (UUID v4)  
**Foreign Keys**: `environment_id`, `parent_id` (self-referential)

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | UUID | NO | UUIDV4 | Primary key |
| name | STRING | NO | - | Page name/title |
| path | STRING | NO | - | Path relative to environment URL |
| not_clickable | BOOLEAN | YES | false | Flag for non-clickable pages |
| domain | STRING | YES | NULL | Domain (added in migration 1.0.2) |
| environment_id | UUID | NO | - | Foreign key to environment |
| parent_id | UUID | YES | NULL | Self-reference for page hierarchy |
| createdAt | DATETIME | NO | NOW | Auto-added by Sequelize |
| updatedAt | DATETIME | NO | NOW | Auto-added by Sequelize |

**Relationships**:
- `belongsTo(environment)` - Each page belongs to one environment
- `belongsTo(environmentPage as parent)` - Self-referential for page hierarchy
- `hasMany(testCaseEnvironmentTestPage)` - Many test executions on this page
- `belongsToMany(environmentTest)` - Through `environmentTestPage` junction table

**Constraints**: 
- `environment_id` required
- `path` must be unique within environment (enforced in application)
- `parent_id` allows NULL for root pages

---

### 4. **environmentTest** Table
**Purpose**: Represents a single test run/session targeting specific pages within an environment  
**Primary Key**: `id` (UUID v4)  
**Foreign Keys**: `environment_id` (→ environment)

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | UUID | NO | UUIDV4 | Primary key |
| name | STRING | NO | - | Test session name |
| functionality_note | TEXT | YES | - | Notes on functionality tested |
| page_variety_note | TEXT | YES | - | Notes on page variety |
| status | ENUM | YES | 'OPENED' | Test status (OPENED, IN_PROGRESS, TEST_COMPLETED, TEST_FAILED, COMPLETED, FAILED, CLOSED) |
| start_date | DATETIME | YES | NULL | When test session started |
| end_date | DATETIME | YES | NULL | When test session ended |
| environment_id | UUID | NO | - | Foreign key to environment |
| createdAt | DATETIME | NO | NOW | Auto-added by Sequelize |
| updatedAt | DATETIME | NO | NOW | Auto-added by Sequelize |

**Relationships**:
- `belongsTo(environment)` - Each test belongs to one environment
- `hasMany(testCaseEnvironmentTestPage)` - Many test case executions in this test
- `belongsToMany(environmentPage as random_pages)` - Through `environmentTestPage` with scope `page_type: 'RANDOM'`
- `belongsToMany(environmentPage as structured_pages)` - Through `environmentTestPage` with scope `page_type: 'STRUCTURED'`

**Special Behavior**: 
- `beforeDestroy` hook calls `destroyAssociations()` which cascades deletion to `environmentTestPage` and `testCaseEnvironmentTestPage` with transaction support

**Constraints**: 
- `environment_id` required
- `status` restricted to enumerated values
- Dates optional but should follow business logic (start before end)

---

### 5. **environmentTestPage** Table
**Purpose**: Junction table mapping environment test runs to pages with page type classification  
**Primary Keys**: Composite (`environment_test_id`, `environment_page_id`) - implicit  
**Foreign Keys**: `environment_test_id`, `environment_page_id`

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| environment_test_id | UUID | NO | - | Foreign key to environmentTest |
| environment_page_id | UUID | NO | - | Foreign key to environmentPage |
| page_type | ENUM | YES | 'RANDOM' | Type of page (RANDOM or STRUCTURED) |
| start_date | DATETIME | YES | NULL | Start date for this page test |
| end_date | DATETIME | YES | NULL | End date for this page test |
| createdAt | DATETIME | NO | NOW | Auto-added by Sequelize |
| updatedAt | DATETIME | NO | NOW | Auto-added by Sequelize |

**Constraints**: 
- No primary key; used as join table
- `page_type` limited to RANDOM or STRUCTURED for grouping

---

### 6. **testCase** Table
**Purpose**: Defines individual accessibility test scenarios (both manual and automated)  
**Primary Key**: `id` (STRING)  
**Foreign Keys**: `system_standard_id`, `system_category_id` (→ system models)

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | STRING | NO | - | Primary key (semantic ID) |
| name | STRING | NO | - | Test case name/title |
| type | ENUM | YES | 'MANUAL' | Test type (MANUAL or AUTOMATIC) |
| steps | TEXT | YES | - | Steps to reproduce (for manual tests) |
| result | TEXT | YES | - | Expected result description |
| instruction | TEXT | YES | - | Special instructions |
| selectors | JSON | YES | ['body'] | CSS selectors for automated tests |
| is_selected | BOOLEAN | YES | true | Whether this test is active |
| system_standard_id | STRING | NO | - | Foreign key to accessibility standard |
| system_category_id | STRING | NO | - | Foreign key to category |
| createdAt | DATETIME | NO | NOW | Auto-added by Sequelize |
| updatedAt | DATETIME | NO | NOW | Auto-added by Sequelize |

**Relationships**:
- `belongsTo(systemStandard)` - Each test case belongs to one standard
- `belongsTo(systemCategory)` - Each test case belongs to one category
- `hasMany(testCaseEnvironmentTestPage)` - Many executions of this test
- `belongsToMany(remediation)` - Through `test_case_remediations` junction table
- `belongsToMany(systemAxeRules)` - Through `test_case_axe_rules` junction table
- `belongsToMany(systemStandardCriteria)` - Through `test_case_criteria` junction table

**Special Behavior**: 
- `beforeDestroy` hook cascades deletion to all `testCaseEnvironmentTestPage` records and their associated `testCaseEnvironmentTestPageTarget` and `testPageTargetOccurrence` records

**Constraints**: 
- `id` must be unique (semantic primary key)
- `type` restricted to MANUAL or AUTOMATIC
- `system_standard_id` required
- `system_category_id` required

---

### 7. **testCaseEnvironmentTestPage** Table
**Purpose**: Represents a single execution of a test case on a specific page during an environment test  
**Primary Key**: `id` (UUID v4)  
**Foreign Keys**: `test_case_id`, `environment_page_id`, `environment_test_id`  
**Unique Constraint**: Composite unique index on (`test_case_id`, `environment_page_id`, `environment_test_id`)

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | UUID | NO | UUIDV4 | Primary key |
| test_case_id | STRING | NO | - | Foreign key to test case |
| environment_page_id | UUID | NO | - | Foreign key to page |
| environment_test_id | UUID | NO | - | Foreign key to test |
| status | ENUM | YES | - | Test result (PASS, FAIL, ERROR, NOT_APPLICABLE, INCOMPLETE, IN_PROGRESS, MANUAL) |
| createdAt | DATETIME | NO | NOW | Auto-added by Sequelize |
| updatedAt | DATETIME | NO | NOW | Auto-added by Sequelize |

**Relationships**:
- `belongsTo(testCase)` - Each execution belongs to one test case
- `belongsTo(environmentPage)` - Each execution is on one page
- `belongsTo(environmentTest)` - Each execution is part of one test run
- `hasMany(testCaseEnvironmentTestPageTarget)` - Many detailed findings for this execution

**Special Behavior**: 
- `beforeCreate` hook validates that the environment page belongs to the specified environment test
- `beforeCreate` hook sets status based on test case type (MANUAL for manual tests, IN_PROGRESS for automatic)
- `beforeDestroy` hook cascades deletion to `testCaseEnvironmentTestPageTarget` and related `testPageTargetOccurrence` records

**Constraints**: 
- Unique composite index: (`test_case_id`, `environment_page_id`, `environment_test_id`)
- `status` restricted to enumerated values
- All three foreign keys required
- Page must belong to the test's environment (validated in beforeCreate hook)

---

### 8. **testCaseEnvironmentTestPageTarget** Table
**Purpose**: Individual accessibility issues/findings discovered during test execution (targets)  
**Primary Key**: `id` (UUID v4)  
**Foreign Keys**: `test_case_page_id`, `remediation_id`, `system_landmark_id`, `parent_landmark_id` (self-ref)

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | UUID | NO | UUIDV4 | Primary key |
| test_case_page_id | UUID | NO | - | Foreign key to test case page execution |
| status | ENUM | YES | - | Result status (PASS, FAIL, ERROR, NOT_APPLICABLE, INCOMPLETE, IN_PROGRESS, MANUAL) |
| rule | TEXT | YES | - | Rule ID or description |
| selector | TEXT | YES | - | CSS selector of affected element |
| html | TEXT | YES | - | HTML of affected element |
| summary | TEXT | YES | - | Summary of issue |
| notes | TEXT | YES | - | Additional notes |
| selector_used | STRING | YES | NULL | Specific selector that matched |
| remediation_id | STRING | YES | NULL | Foreign key to remediation suggestion |
| related_target_count | INTEGER | YES | 0 | Count of related targets (added in migration 1.0.1) |
| related_remediation_count | INTEGER | YES | 0 | Count of related remediations (added in migration 1.0.1) |
| is_manually_reviewed | BOOLEAN | YES | false | Flag for manual review (added in migration 1.0.3) |
| system_landmark_id | STRING | YES | NULL | Foreign key to landmark (added in migration 1.0.1) |
| parent_landmark_id | UUID | YES | NULL | Self-reference for landmark hierarchy (added in migration 1.0.1) |
| createdAt | DATETIME | NO | NOW | Auto-added by Sequelize |
| updatedAt | DATETIME | NO | NOW | Auto-added by Sequelize |

**Relationships**:
- `belongsTo(testCaseEnvironmentTestPage as test)` - Each target belongs to one test execution
- `belongsTo(remediation)` - Target can link to a remediation (optional)
- `belongsTo(systemLandmark)` - Target can link to a landmark (optional)
- `belongsTo(testCaseEnvironmentTestPageTarget as parent_landmark)` - Self-reference for hierarchy
- `hasMany(testCaseEnvironmentTestPageTarget as landmark_children)` - Self-reference for hierarchy
- `belongsToMany(testCaseEnvironmentTestPageTarget as related_targets)` - Through `testPageTargetOccurrence` for relationships

**Indexes**:
- `status` - Frequent filtering by result status
- `test_case_page_id` - Foreign key lookup
- `remediation_id` - Foreign key lookup
- `related_target_count` - Sorting/filtering
- `related_remediation_count` - Sorting/filtering
- `system_landmark_id` - Added in migration 1.0.1
- `parent_landmark_id` - Added in migration 1.0.1

**Constraints**: 
- `test_case_page_id` required
- `status` restricted to enumerated values
- `remediation_id` optional (NULL allowed)
- `system_landmark_id` optional (NULL allowed)
- `parent_landmark_id` optional with cascading NULL on parent deletion

---

### 9. **testPageTargetOccurrence** Table
**Purpose**: Junction table representing relationships between related page targets  
**Primary Keys**: Composite (`page_target_id`, `related_page_target_id`)  
**Foreign Keys**: `page_target_id`, `related_page_target_id` (both → testCaseEnvironmentTestPageTarget)

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| page_target_id | UUID | NO | - | First target in relationship |
| related_page_target_id | UUID | NO | - | Related/connected target |
| createdAt | DATETIME | NO | NOW | Auto-added by Sequelize |
| updatedAt | DATETIME | NO | NOW | Auto-added by Sequelize |

**Timestamp Config**: 
- No timestamps if configured as `timestamps: false` in model (check implementation)

**Indexes**:
- `page_target_id` - Lookup relationships from one target
- `related_page_target_id` - Reverse lookup

**Constraints**: 
- Composite primary key prevents duplicate relationships
- Both foreign keys required

---

### 10. **audit** Table
**Purpose**: Formal accessibility audit document/report  
**Primary Key**: `id` (UUID v4)  
**Foreign Keys**: `project_id`, `environment_id`, `environment_test_id`, `profile_id`, `system_audit_type_id`, `system_audit_type_version_id`

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | UUID | NO | UUIDV4 | Primary key |
| status | ENUM | NO | 'OPEN' | Audit status (OPEN, IN_PROGRESS, CLOSED) |
| wcag_version | STRING | NO | - | WCAG version (e.g., "2.2", "2.1", "2.0") |
| conformance_target | ENUM | NO | - | Target conformance level (A, AA, AAA) |
| identifier | STRING | NO | - | Unique audit identifier |
| start_date | DATETIME | YES | NOW | Audit start date |
| product_name | STRING | YES | NULL | Name of product being audited |
| product_version | STRING | YES | NULL | Version of product |
| product_description | STRING | YES | NULL | Description of product |
| product_url | STRING | YES | NULL | URL of product |
| vendor_name | STRING | YES | NULL | Vendor/organization name |
| vendor_address | TEXT | YES | NULL | Vendor address |
| vendor_url | STRING | YES | NULL | Vendor website |
| vendor_contact_name | STRING | YES | NULL | Contact person name |
| vendor_contact_email | STRING | YES | NULL | Contact email |
| vendor_contact_phone | STRING | YES | NULL | Contact phone |
| notes | TEXT | YES | NULL | General notes |
| methods | TEXT | YES | NULL | Testing methods used |
| disclaimer | TEXT | YES | NULL | Legal disclaimer |
| repository_url | STRING | YES | NULL | URL to source repository |
| feedback | TEXT | YES | NULL | Feedback field |
| license | STRING | YES | NULL | License information |
| summary | TEXT | YES | NULL | Audit summary |
| project_id | UUID | YES | NULL | Foreign key to project |
| environment_id | UUID | YES | NULL | Foreign key to environment |
| environment_test_id | UUID | YES | NULL | Foreign key to environment test |
| profile_id | UUID | YES | NULL | Foreign key to auditor profile |
| system_audit_type_id | STRING | YES | NULL | Foreign key to audit type |
| system_audit_type_version_id | STRING | YES | NULL | Foreign key to audit type version |
| createdAt | DATETIME | NO | NOW | Auto-added by Sequelize |
| updatedAt | DATETIME | NO | NOW | Auto-added by Sequelize |

**Relationships**:
- `belongsTo(project)` - Audit references a project
- `belongsTo(environment)` - Audit references an environment
- `belongsTo(environmentTest)` - Audit references a test run
- `belongsTo(profile)` - Audit references an auditor profile
- `belongsTo(systemAuditType)` - Audit uses an audit type
- `belongsTo(systemAuditTypeVersion)` - Audit uses a specific audit type version
- `belongsToMany(systemAuditChapterSection)` - Through `audit_chapter_section_audit` - Which sections are included
- `hasMany(auditItem)` - Many items in this audit

**Constraints**: 
- `status` restricted to OPEN, IN_PROGRESS, CLOSED
- `conformance_target` restricted to A, AA, AAA
- `wcag_version` required
- Most foreign keys optional (NULL allowed)
- `identifier` must be unique

---

### 11. **auditItem** Table
**Purpose**: Individual items/findings within an audit  
**Primary Keys**: Composite (`audit_id`, `system_audit_chapter_section_item_id`, `system_audit_chapter_section_item_type_id`)  
**Foreign Keys**: `audit_id`, `system_audit_chapter_section_item_id`, `system_audit_chapter_section_item_type_id`

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| audit_id | UUID | NO | - | Foreign key to audit |
| system_audit_chapter_section_item_id | STRING | NO | - | Foreign key to audit section item |
| system_audit_chapter_section_item_type_id | STRING | NO | - | Foreign key to item type |
| level | ENUM | YES | - | Item level/severity (from AUDIT_ITEM_LEVEL_VALUES) |
| remarks | TEXT | YES | - | Remarks about this item |
| createdAt | DATETIME | NO | NOW | Auto-added by Sequelize |
| updatedAt | DATETIME | NO | NOW | Auto-added by Sequelize |

**Relationships**:
- `belongsTo(audit)` - Each item belongs to one audit
- `belongsTo(systemAuditChapterSectionItem)` - Links to audit structure
- `belongsTo(systemAuditChapterSectionItemType)` - Links to item type

**Constraints**: 
- Composite primary key: (`audit_id`, `system_audit_chapter_section_item_id`, `system_audit_chapter_section_item_type_id`)
- All three fields required
- `level` restricted to predefined values

---

### 12. **remediation** Table
**Purpose**: Accessibility issue fixes/remediation recommendations  
**Primary Key**: `id` (STRING)  
**Foreign Keys**: `system_category_id` (→ system model)

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | STRING | NO | - | Primary key (semantic ID) |
| name | STRING | NO | - | Remediation name |
| description | TEXT | YES | NULL | Detailed description |
| selectors | JSON | YES | ['body'] | CSS selectors for the fix |
| is_selected | BOOLEAN | YES | true | Whether active/selected |
| system_category_id | STRING | NO | - | Foreign key to category |
| createdAt | DATETIME | NO | NOW | Auto-added by Sequelize |
| updatedAt | DATETIME | NO | NOW | Auto-added by Sequelize |

**Relationships**:
- `belongsTo(systemCategory)` - Each remediation belongs to one category
- `hasMany(remediationExample)` - Many code examples for this remediation
- `belongsToMany(testCase)` - Through `test_case_remediations` - Which test cases this fixes
- `belongsToMany(systemStandardCriteria)` - Through `remediation_criteria` - Which WCAG criteria this addresses

**Constraints**: 
- `id` must be unique
- `name` required
- `system_category_id` required

---

### 13. **remediationExample** Table
**Purpose**: Code examples/demonstrations for remediations  
**Primary Key**: `id` (UUID v4)  
**Foreign Keys**: `remediation_id` (→ remediation)

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | UUID | NO | UUIDV4 | Primary key |
| name | STRING | NO | - | Name of example |
| description | TEXT | YES | NULL | Description of what example shows |
| code | TEXT | NO | - | Actual code example |
| remediation_id | STRING | NO | - | Foreign key to remediation |
| createdAt | DATETIME | NO | NOW | Auto-added by Sequelize |
| updatedAt | DATETIME | NO | NOW | Auto-added by Sequelize |

**Relationships**:
- `belongsTo(remediation)` - Each example belongs to one remediation

**Constraints**: 
- `remediation_id` required
- `name` required
- `code` required

---

### 14. **profile** Table
**Purpose**: User profiles (auditor/tester profiles)  
**Primary Key**: `id` (UUID v4)

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | UUID | NO | UUIDV4 | Primary key |
| first_name | STRING | NO | - | User first name |
| last_name | STRING | NO | - | User last name |
| title | STRING | NO | - | Professional title |
| image | STRING | YES | NULL | Profile image path |
| createdAt | DATETIME | NO | NOW | Auto-added by Sequelize |
| updatedAt | DATETIME | NO | NOW | Auto-added by Sequelize |

**Relationships**:
- `hasOne(profileOrganization)` - One organization per profile with CASCADE delete

**Constraints**: 
- `first_name` required
- `last_name` required
- `title` required

---

### 15. **profileOrganization** Table
**Purpose**: Organization details associated with user profiles  
**Primary Key**: `id` (UUID v4)  
**Foreign Keys**: `profile_id`, `country_id`, `state_id` (→ system models)

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | UUID | NO | UUIDV4 | Primary key |
| logo | STRING | YES | NULL | Organization logo path |
| name | STRING | YES | NULL | Organization name |
| email | STRING | YES | NULL | Organization email |
| phone | STRING | YES | NULL | Organization phone |
| address | TEXT | YES | NULL | Primary address |
| address_2 | TEXT | YES | NULL | Secondary address |
| city | STRING | YES | NULL | City |
| zip_code | STRING | YES | NULL | ZIP/postal code |
| url | STRING | YES | NULL | Organization website |
| profile_id | UUID | NO | - | Foreign key to profile |
| country_id | STRING | YES | NULL | Foreign key to country |
| state_id | STRING | YES | NULL | Foreign key to state |
| createdAt | DATETIME | NO | NOW | Auto-added by Sequelize |
| updatedAt | DATETIME | NO | NOW | Auto-added by Sequelize |

**Relationships**:
- `belongsTo(profile)` - Each org belongs to one profile
- `belongsTo(systemCountry)` - Organization is in one country
- `belongsTo(systemState)` - Organization is in one state

**Constraints**: 
- `profile_id` required
- `country_id` optional
- `state_id` optional

---

### 16. **technology** Table
**Purpose**: Technology stack used in projects  
**Primary Key**: `id` (STRING)

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | STRING | NO | - | Primary key (semantic) |
| name | STRING | NO | - | Technology name |
| is_system | BOOLEAN | YES | false | System-provided technology flag |
| createdAt | DATETIME | NO | NOW | Auto-added by Sequelize |
| updatedAt | DATETIME | NO | NOW | Auto-added by Sequelize |

**Relationships**:
- `belongsToMany(project)` - Through `project_technology` - Technologies used in projects

**Constraints**: 
- `id` must be unique
- `name` required

---

### 17. **settings** Table
**Purpose**: Application-level configuration settings  
**Primary Key**: `id` (INTEGER, hardcoded to 1 typically)

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | INTEGER | NO | - | Primary key (typically hardcoded to 1) |
| data_directory_path | STRING | YES | NULL | Path to user data directory |
| can_open_browser | BOOLEAN | YES | false | Permission to open browser |
| is_eula_accepted | BOOLEAN | YES | false | EULA acceptance flag |
| createdAt | DATETIME | NO | NOW | Auto-added by Sequelize |
| updatedAt | DATETIME | NO | NOW | Auto-added by Sequelize |

**Relationships**: None

**Constraints**: 
- Single row table (id = 1)

---

### 18. **accessibilitySettings** Table
**Purpose**: UI accessibility preferences for the application  
**Primary Key**: `id` (INTEGER, auto-increment)

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | INTEGER | NO | - | Primary key (auto-increment) |
| profile | ENUM | YES | NULL | Accessibility profile name (values from constants) |
| adjustments | JSON | YES | [] | JSON array of accessibility adjustments |
| createdAt | DATETIME | NO | NOW | Auto-added by Sequelize |
| updatedAt | DATETIME | NO | NOW | Auto-added by Sequelize |

**Relationships**: None

**Constraints**: 
- `profile` values come from `PROFILES` constant

---

### 19. **migration** Table
**Purpose**: Tracks which database migrations have been applied  
**Primary Key**: `name` (STRING, unique)

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| name | STRING | NO | - | Primary key, migration file name |
| applied_at | DATETIME | YES | NULL | When migration was applied |
| createdAt | DATETIME | NO | NOW | Auto-added by Sequelize |
| updatedAt | DATETIME | NO | NOW | Auto-added by Sequelize |

**Relationships**: None

**Constraints**: 
- `name` must be unique
- `name` required

---

## System Models (Reference Data)

System models contain pre-loaded reference data for accessibility standards, geographic information, and audit frameworks. These are typically loaded from `systemData.json` at database initialization.

### Standard & Criteria Models

#### 20. **systemStandard** Table
**Purpose**: Top-level accessibility standards (e.g., WCAG)  
**Primary Key**: `id` (STRING)

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | STRING | NO | - | Primary key (e.g., "WCAG") |
| name | STRING | NO | - | Standard name |
| createdAt | DATETIME | NO | NOW | Auto-added by Sequelize |
| updatedAt | DATETIME | NO | NOW | Auto-added by Sequelize |

**Relationships**:
- `hasMany(systemStandardVersion)` - Versions of this standard
- `hasMany(systemStandardPrinciple)` - Principles in this standard
- `hasMany(systemStandardGuideline)` - Guidelines in this standard
- `hasMany(systemStandardCriteria)` - Criteria in this standard

---

#### 21. **systemStandardVersion** Table
**Purpose**: Versions of accessibility standards (e.g., WCAG 2.2, 2.1, 2.0)  
**Primary Key**: `id` (STRING)  
**Foreign Keys**: `system_standard_id`

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | STRING | NO | - | Primary key (e.g., "2.2") |
| name | STRING | NO | - | Version name |
| system_standard_id | STRING | NO | - | Foreign key to standard |
| createdAt | DATETIME | NO | NOW | Auto-added by Sequelize |
| updatedAt | DATETIME | NO | NOW | Auto-added by Sequelize |

**Relationships**:
- `belongsTo(systemStandard)` - Belongs to one standard
- `belongsToMany(systemStandardPrinciple)` - Through `system_version_principle`
- `belongsToMany(systemStandardGuideline)` - Through `system_version_guideline`
- `belongsToMany(systemStandardCriteria)` - Through `system_version_criteria`

---

#### 22. **systemStandardPrinciple** Table
**Purpose**: WCAG principles (Perceivable, Operable, Understandable, Robust)  
**Primary Key**: `id` (STRING)  
**Foreign Keys**: `system_standard_id`

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | STRING | NO | - | Primary key (e.g., "1") |
| name | STRING | NO | - | Principle name |
| description | TEXT | YES | NULL | Principle description |
| system_standard_id | STRING | NO | - | Foreign key to standard |
| createdAt | DATETIME | NO | NOW | Auto-added by Sequelize |
| updatedAt | DATETIME | NO | NOW | Auto-added by Sequelize |

**Relationships**:
- `belongsTo(systemStandard)` - Belongs to one standard
- `belongsToMany(systemStandardVersion)` - Through `system_version_principle` - Which versions include this
- `hasMany(systemStandardGuideline)` - Guidelines under this principle
- `hasMany(systemStandardCriteria)` - Criteria under this principle

---

#### 23. **systemStandardGuideline** Table
**Purpose**: WCAG guidelines (e.g., 1.1, 1.2, 1.3 under Principle 1)  
**Primary Key**: `id` (STRING)  
**Foreign Keys**: `system_standard_id`, `system_standard_principle_id`

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | STRING | NO | - | Primary key (e.g., "1.1") |
| name | STRING | NO | - | Guideline name |
| description | TEXT | YES | NULL | Guideline description |
| system_standard_id | STRING | NO | - | Foreign key to standard |
| system_standard_principle_id | STRING | YES | NULL | Foreign key to principle |
| createdAt | DATETIME | NO | NOW | Auto-added by Sequelize |
| updatedAt | DATETIME | NO | NOW | Auto-added by Sequelize |

**Relationships**:
- `belongsTo(systemStandard)` - Belongs to one standard
- `belongsTo(systemStandardPrinciple)` - Belongs to one principle
- `belongsToMany(systemStandardVersion)` - Through `system_version_guideline`
- `hasMany(systemStandardCriteria)` - Criteria under this guideline

---

#### 24. **systemStandardCriteria** Table
**Purpose**: WCAG success criteria with conformance levels (A, AA, AAA)  
**Primary Key**: `id` (STRING)  
**Foreign Keys**: `system_standard_id`, `system_standard_principle_id`, `system_standard_guideline_id`

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | STRING | NO | - | Primary key (e.g., "1.1.1") |
| name | STRING | NO | - | Criteria name |
| description | TEXT | YES | NULL | Criteria description |
| level | ENUM | YES | 'A' | Conformance level (A, AA, AAA) |
| help_url | TEXT | YES | NULL | URL to help documentation |
| system_standard_id | STRING | NO | - | Foreign key to standard |
| system_standard_principle_id | STRING | YES | NULL | Foreign key to principle |
| system_standard_guideline_id | STRING | YES | NULL | Foreign key to guideline |
| createdAt | DATETIME | NO | NOW | Auto-added by Sequelize |
| updatedAt | DATETIME | NO | NOW | Auto-added by Sequelize |

**Relationships**:
- `hasOne(systemAuditChapterSectionItem)` - Links to audit framework
- `belongsTo(systemStandard)` - Belongs to one standard
- `belongsTo(systemStandardPrinciple)` - Belongs to one principle
- `belongsTo(systemStandardGuideline)` - Belongs to one guideline
- `belongsToMany(systemStandardVersion)` - Through `system_version_criteria` - Which versions include this
- `belongsToMany(testCase)` - Through `test_case_criteria` - Which test cases cover this
- `belongsToMany(remediation)` - Through `remediation_criteria` - Which remediations address this

**Constraints**: 
- `level` restricted to A, AA, AAA
- `help_url` should be valid URL if provided

---

### Geographic Models

#### 25. **systemContinent** Table
**Purpose**: Continents for geographic organization data  
**Primary Key**: `id` (STRING)

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | STRING | NO | - | Primary key (continent code) |
| name | STRING | NO | - | Continent name |
| createdAt | DATETIME | NO | NOW | Auto-added by Sequelize |
| updatedAt | DATETIME | NO | NOW | Auto-added by Sequelize |

**Relationships**:
- `hasMany(systemCountry)` - Countries in this continent

---

#### 26. **systemCountry** Table
**Purpose**: Countries for organization location data  
**Primary Key**: `id` (STRING)  
**Foreign Keys**: `continent_id` (→ systemContinent)

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | STRING | NO | - | Primary key (country code) |
| name | STRING | NO | - | Country name |
| phone_prefix | STRING | YES | NULL | International phone prefix |
| short_name | STRING | YES | NULL | Country abbreviation |
| continent_id | STRING | YES | NULL | Foreign key to continent |
| createdAt | DATETIME | NO | NOW | Auto-added by Sequelize |
| updatedAt | DATETIME | NO | NOW | Auto-added by Sequelize |

**Relationships**:
- `belongsTo(systemContinent)` - Each country is on one continent
- `hasMany(systemState)` - States/provinces in this country

**Built-in Count**: 247 countries

---

#### 27. **systemState** Table
**Purpose**: States/provinces for organization location data  
**Primary Key**: `id` (STRING)  
**Foreign Keys**: `country_id` (→ systemCountry)

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | STRING | NO | - | Primary key (state code) |
| name | STRING | NO | - | State/province name |
| country_id | STRING | NO | - | Foreign key to country |
| createdAt | DATETIME | NO | NOW | Auto-added by Sequelize |
| updatedAt | DATETIME | NO | NOW | Auto-added by Sequelize |

**Relationships**:
- `belongsTo(systemCountry)` - Each state belongs to one country

---

### Category & Component Models

#### 28. **systemCategory** Table
**Purpose**: Categories for organizing test cases and remediations  
**Primary Key**: `id` (STRING)

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | STRING | NO | - | Primary key (semantic ID) |
| name | STRING | NO | - | Category name |
| is_system | BOOLEAN | YES | false | System-provided flag |
| is_selected | BOOLEAN | YES | true | Whether category is active |
| priority | INTEGER | YES | 0 | Display priority |
| createdAt | DATETIME | NO | NOW | Auto-added by Sequelize |
| updatedAt | DATETIME | NO | NOW | Auto-added by Sequelize |

**Relationships**:
- `hasMany(remediation)` - Remediations in this category

**Built-in Count**: 11 categories

---

#### 29. **systemLandmark** Table
**Purpose**: HTML landmark roles for page structure classification  
**Primary Key**: `id` (STRING)

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | STRING | NO | - | Primary key (e.g., "main", "nav") |
| name | STRING | NO | - | Landmark name |
| selectors | JSON | NO | - | CSS selectors to identify this landmark |
| createdAt | DATETIME | NO | NOW | Auto-added by Sequelize |
| updatedAt | DATETIME | NO | NOW | Auto-added by Sequelize |

**Relationships**: None (referenced from test targets)

**Built-in Count**: 11 landmark types

**Note**: `selectors` is a JSON array of CSS selectors used to identify this landmark type

---

#### 30. **systemAxeRules** Table
**Purpose**: Axe accessibility checker rule definitions  
**Primary Key**: `id` (STRING)

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | STRING | NO | - | Primary key (axe rule ID) |
| description | TEXT | NO | - | Rule description |
| help | TEXT | YES | NULL | Help/guidance text |
| helpUrl | TEXT | YES | NULL | URL to help documentation |
| createdAt | DATETIME | NO | NOW | Auto-added by Sequelize |
| updatedAt | DATETIME | NO | NOW | Auto-added by Sequelize |

**Relationships**:
- `belongsToMany(testCase)` - Through `test_case_axe_rules` - Which test cases use this rule

---

### Audit Framework Models

#### 31. **systemAuditType** Table
**Purpose**: Types of accessibility audit methodologies (WCAG-EM, ATAG, VPAT, etc.)  
**Primary Key**: `id` (STRING)

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | STRING | NO | - | Primary key (e.g., "WCAG-EM") |
| name | STRING | NO | - | Audit type name |
| createdAt | DATETIME | NO | NOW | Auto-added by Sequelize |
| updatedAt | DATETIME | NO | NOW | Auto-added by Sequelize |

**Relationships**:
- `hasOne(audit)` - Audit using this type
- `hasMany(systemAuditTypeVersion)` - Versions of this audit type
- `hasMany(systemAuditChapterAuditTypeVersion)` - Chapters associated with this type

---

#### 32. **systemAuditTypeVersion** Table
**Purpose**: Versions of audit types  
**Primary Key**: `id` (STRING)  
**Foreign Keys**: `system_audit_type_id`

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | STRING | NO | - | Primary key (e.g., "WCAG-EM 1.0") |
| name | STRING | NO | - | Version name |
| system_audit_type_id | STRING | NO | - | Foreign key to audit type |
| createdAt | DATETIME | NO | NOW | Auto-added by Sequelize |
| updatedAt | DATETIME | NO | NOW | Auto-added by Sequelize |

**Relationships**:
- `hasOne(audit)` - Audit using this version
- `belongsTo(systemAuditType)` - Belongs to one audit type

---

#### 33. **systemAuditChapter** Table
**Purpose**: Top-level chapters in an audit document (e.g., "Scope", "Testing")  
**Primary Key**: `id` (STRING)

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | STRING | NO | - | Primary key |
| name | STRING | NO | - | Chapter name |
| createdAt | DATETIME | NO | NOW | Auto-added by Sequelize |
| updatedAt | DATETIME | NO | NOW | Auto-added by Sequelize |

**Relationships**:
- `hasMany(systemAuditChapterSection)` - Sections within this chapter
- `hasMany(systemAuditChapterAuditTypeVersion)` - Audit type versions that use this chapter

---

#### 34. **systemAuditChapterSection** Table
**Purpose**: Sections within audit chapters  
**Primary Key**: `id` (STRING)  
**Foreign Keys**: `system_audit_chapter_id`

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | STRING | NO | - | Primary key |
| name | STRING | NO | - | Section name |
| table_name | STRING | YES | NULL | Display table name |
| url | STRING | YES | NULL | Reference URL |
| system_audit_chapter_id | STRING | NO | - | Foreign key to chapter |
| createdAt | DATETIME | NO | NOW | Auto-added by Sequelize |
| updatedAt | DATETIME | NO | NOW | Auto-added by Sequelize |

**Relationships**:
- `hasMany(systemAuditChapterSectionItem)` - Items in this section
- `belongsTo(systemAuditChapter)` - Belongs to one chapter
- `belongsToMany(audit)` - Through `system_audit_chapter_item_audit` - Audits using this section

---

#### 35. **systemAuditChapterSectionItem** Table
**Purpose**: Individual items/questions within an audit section  
**Primary Key**: `id` (STRING)  
**Foreign Keys**: `system_audit_chapter_section_id`, `system_standard_criteria_id`

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | STRING | NO | - | Primary key |
| name | STRING | NO | - | Item name/question |
| level | STRING | YES | NULL | Item level/category |
| system_audit_chapter_section_id | STRING | NO | - | Foreign key to section |
| system_standard_criteria_id | STRING | YES | NULL | Foreign key to WCAG criteria |
| createdAt | DATETIME | NO | NOW | Auto-added by Sequelize |
| updatedAt | DATETIME | NO | NOW | Auto-added by Sequelize |

**Relationships**:
- `belongsTo(systemAuditChapterSection)` - Belongs to one section
- `belongsTo(systemStandardCriteria)` - Links to WCAG criteria (optional)
- `hasMany(auditItem)` - Audit items for this section item
- `belongsToMany(systemAuditChapterSectionItemType)` - Through `system_audit_item_types` - Types for this item

---

#### 36. **systemAuditChapterSectionItemType** Table
**Purpose**: Types for audit section items  
**Primary Key**: `id` (STRING)

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | STRING | NO | - | Primary key |
| createdAt | DATETIME | NO | NOW | Auto-added by Sequelize |
| updatedAt | DATETIME | NO | NOW | Auto-added by Sequelize |

**Relationships**:
- `belongsToMany(systemAuditChapterSectionItem)` - Through `system_audit_item_types` - Items using this type
- `hasMany(auditItem)` - Audit items with this type

---

#### 37. **systemAuditChapterAuditTypeVersion** Table
**Purpose**: Junction table linking audit chapters to audit type versions  
**Primary Keys**: Composite (`system_audit_chapter_id`, `system_audit_type_id`, `system_audit_type_version_id`)  
**Foreign Keys**: `system_audit_chapter_id`, `system_audit_type_id`

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| system_audit_chapter_id | STRING | NO | - | Foreign key to chapter |
| system_audit_type_id | STRING | NO | - | Foreign key to audit type |
| system_audit_type_version_id | STRING | NO | '' | Foreign key to audit type version |
| createdAt | DATETIME | NO | NOW | Auto-added by Sequelize |
| updatedAt | DATETIME | NO | NOW | Auto-added by Sequelize |

**Relationships**:
- `belongsTo(systemAuditChapter)` - References a chapter
- `belongsTo(systemAuditType)` - References an audit type

**Note**: `system_audit_type_version_id` defaults to empty string to allow loose references

---

### Sync Model

#### 38. **systemSync** Table
**Purpose**: Tracks when system data (reference data) was last synchronized  
**Primary Key**: `id` (INTEGER, auto-increment)

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | INTEGER | NO | - | Primary key (auto-increment) |
| version | STRING | YES | NULL | Version of system data sync |
| createdAt | DATETIME | NO | NOW | Auto-added by Sequelize |
| last_sync_at | DATETIME | NO | NOW | Last sync timestamp (instead of updatedAt) |

**Relationships**: None

**Timestamp Config**: Custom `updatedAt` column named `last_sync_at`

---

## Relationships Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                       PROJECT (top level)                       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ├─ hasMany(environment)
                             │
                             └─ belongsToMany(technology)
                                through: project_technology
                             
┌────────────────────────────────────────────────────────────────┐
│                   ENVIRONMENT                                  │
│        (websites/applications being tested)                    │
└────────────────┬──────────────────────┬──────────────────────┘
                 │                      │
                 ├─ hasMany(environmentPage)
                 │                      │
                 │                      └─ belongsTo(environment)
                 │                         (self-ref parent)
                 │
                 └─ hasMany(environmentTest)

┌────────────────────────────────────────────────────────────────┐
│                   ENVIRONMENT TEST                             │
│            (test runs targeting pages)                         │
└────────────────┬──────────────────────┬──────────────────────┘
                 │                      │
                 ├─ hasMany(testCaseEnvironmentTestPage)
                 │                      │
                 │                      └─ belongs to (testCase, 
                 │                         environmentPage)
                 │
                 └─ belongsToMany(environmentPage)
                    through: environmentTestPage
                    (RANDOM and STRUCTURED scopes)

┌────────────────────────────────────────────────────────────────┐
│        TEST CASE ENVIRONMENT TEST PAGE                         │
│   (execution of test case on specific page)                    │
└────────────────┬──────────────────────┬──────────────────────┘
                 │                      │
                 ├─ belongsTo(testCase)
                 │                      │
                 ├─ belongsTo(environmentPage)
                 │                      │
                 ├─ belongsTo(environmentTest)
                 │                      │
                 └─ hasMany(testCaseEnvironmentTestPageTarget)
                    │
                    └─ Individual findings/issues

┌────────────────────────────────────────────────────────────────┐
│        TEST CASE ENVIRONMENT TEST PAGE TARGET                  │
│     (individual accessibility issues found)                    │
└────────────────┬──────────────────────┬──────────────────────┘
                 │                      │
                 ├─ belongsTo(remediation)
                 │                      │
                 ├─ belongsTo(systemLandmark)
                 │                      │
                 ├─ belongsTo(systemLandmark as parent_landmark)
                 │  (self-ref for hierarchy)
                 │
                 └─ belongsToMany(testCaseEnvironmentTestPageTarget)
                    through: testPageTargetOccurrence
                    (relationships between targets)

┌────────────────────────────────────────────────────────────────┐
│                      AUDIT                                     │
│           (formal accessibility audit document)                │
└────────────────┬──────────────────────┬──────────────────────┘
                 │                      │
                 ├─ belongsTo(project)
                 │                      │
                 ├─ belongsTo(environment)
                 │                      │
                 ├─ belongsTo(environmentTest)
                 │                      │
                 ├─ belongsTo(profile)
                 │                      │
                 ├─ belongsTo(systemAuditType)
                 │                      │
                 ├─ belongsTo(systemAuditTypeVersion)
                 │                      │
                 ├─ hasMany(auditItem)
                 │                      │
                 └─ belongsToMany(systemAuditChapterSection)
                    through: audit_chapter_section_audit

┌────────────────────────────────────────────────────────────────┐
│              STANDARD / CRITERIA HIERARCHY                      │
│                  (WCAG framework)                              │
└────────────────┬──────────────────────┬──────────────────────┘

   systemStandard (WCAG)
        │
        ├─ hasMany(systemStandardVersion)  [2.0, 2.1, 2.2]
        │
        ├─ hasMany(systemStandardPrinciple)  [4 principles]
        │   └─ hasMany(systemStandardGuideline)  [13 guidelines]
        │       └─ hasMany(systemStandardCriteria)  [87 criteria]
        │
        └─ All linked via belongsToMany through junction tables

┌────────────────────────────────────────────────────────────────┐
│               REMEDIATION HIERARCHY                             │
└────────────────┬──────────────────────┬──────────────────────┘

   systemCategory (issue category)
        │
        └─ hasMany(remediation)
             │
             ├─ hasMany(remediationExample)  [code examples]
             │
             ├─ belongsToMany(testCase)
             │  [which test cases identify this issue]
             │
             └─ belongsToMany(systemStandardCriteria)
                [which WCAG criteria this remediation addresses]

┌────────────────────────────────────────────────────────────────┐
│                  GEOGRAPHIC HIERARCHY                           │
└────────────────┬──────────────────────┬──────────────────────┘

   systemContinent
        │
        └─ hasMany(systemCountry)  [247 countries]
             │
             └─ hasMany(systemState)
                [states/provinces in each country]
```

---

## Many-to-Many Relationships

### Junction Tables

1. **project_technology**
   - Links: `project` ↔ `technology`
   - Purpose: Track which technologies are used in each project

2. **environmentTestPage**
   - Links: `environmentTest` ↔ `environmentPage`
   - Purpose: Track which pages are tested in each test run
   - Extra Columns: `page_type` (RANDOM/STRUCTURED), `start_date`, `end_date`

3. **test_case_remediations**
   - Links: `testCase` ↔ `remediation`
   - Purpose: Map which remediations are suggested for test failures

4. **test_case_axe_rules**
   - Links: `testCase` ↔ `systemAxeRules`
   - Purpose: Map which axe-core rules are used by test cases

5. **test_case_criteria**
   - Links: `testCase` ↔ `systemStandardCriteria`
   - Purpose: Map which WCAG criteria test cases cover

6. **remediation_criteria**
   - Links: `remediation` ↔ `systemStandardCriteria`
   - Purpose: Map which WCAG criteria remediation addresses

7. **system_version_principle**
   - Links: `systemStandardVersion` ↔ `systemStandardPrinciple`
   - Purpose: Track which principles are in each WCAG version

8. **system_version_guideline**
   - Links: `systemStandardVersion` ↔ `systemStandardGuideline`
   - Purpose: Track which guidelines are in each WCAG version

9. **system_version_criteria**
   - Links: `systemStandardVersion` ↔ `systemStandardCriteria`
   - Purpose: Track which criteria are in each WCAG version

10. **system_audit_item_types**
    - Links: `systemAuditChapterSectionItem` ↔ `systemAuditChapterSectionItemType`
    - Purpose: Map types for audit section items

11. **audit_chapter_section_audit**
    - Links: `systemAuditChapterSection` ↔ `audit`
    - Purpose: Track which audit sections are included in each audit

12. **testPageTargetOccurrence**
    - Links: `testCaseEnvironmentTestPageTarget` ↔ `testCaseEnvironmentTestPageTarget`
    - Purpose: Track relationships between related page targets

---

## Cascading Behaviors

### Delete Cascades

1. **environmentTest → testCaseEnvironmentTestPage → testCaseEnvironmentTestPageTarget**
   - When environment test is deleted:
     - All testCaseEnvironmentTestPage records are deleted
     - All testCaseEnvironmentTestPageTarget records are deleted
     - All testPageTargetOccurrence records are deleted
   - Behavior: Implemented in `beforeDestroy` hook with transaction

2. **testCase → testCaseEnvironmentTestPage**
   - When test case is deleted:
     - All testCaseEnvironmentTestPage records are deleted
     - Cascade deletes testCaseEnvironmentTestPageTarget and testPageTargetOccurrence
   - Behavior: Implemented in `beforeDestroy` hook with transaction

3. **testCaseEnvironmentTestPage → testCaseEnvironmentTestPageTarget**
   - When test case environment test page is deleted:
     - All testCaseEnvironmentTestPageTarget records are deleted
     - All testPageTargetOccurrence records are deleted
   - Behavior: Implemented in `beforeDestroy` hook with transaction

4. **profile → profileOrganization**
   - Foreign key configured with `onDelete: 'CASCADE'`
   - When profile is deleted, profile organization is deleted

5. **testCaseEnvironmentTestPageTarget (parent_landmark) → testCaseEnvironmentTestPageTarget (landmark_children)**
   - Foreign key configured with `onDelete: 'SET NULL'`, `onUpdate: 'CASCADE'`
   - When parent target is deleted, child targets have parent_landmark_id set to NULL
   - When parent ID is updated, children are updated

### Set NULL Behaviors

1. **testCaseEnvironmentTestPageTarget.remediation_id**
   - No explicit cascade; remediation deletion leaves targets with NULL remediation_id

2. **testCaseEnvironmentTestPageTarget.system_landmark_id**
   - Configured with `onDelete: 'SET NULL'`
   - When landmark is deleted, targets have landmark_id set to NULL

3. **testCaseEnvironmentTestPageTarget.parent_landmark_id**
   - Configured with `onDelete: 'SET NULL'`
   - When parent target is deleted, children have parent_landmark_id set to NULL

---

## Built-in System Data

### Loaded from `/src/electron/db/systemData.json`

| Entity | Count | Notes |
|--------|-------|-------|
| **Standards** | 1 | WCAG |
| **Versions** | 3 | WCAG 2.0, 2.1, 2.2 |
| **Principles** | 4 | Perceivable, Operable, Understandable, Robust |
| **Guidelines** | 13 | E.g., 1.1, 1.2, 1.3 under Principle 1 |
| **Criteria** | 87 | Success criteria with levels A/AA/AAA |
| **Countries** | 247 | Full country list with phone prefixes |
| **Continents** | 0 | Not pre-loaded (generated if needed) |
| **Categories** | 11 | Test/remediation categories |
| **Landmarks** | 11 | HTML landmark roles (nav, main, etc.) |
| **Environments** | 4 | Sample environments for testing |
| **Technologies** | 6 | Common web technologies |
| **Total** | ~370 | Records total |

### System Data Load Process

1. System data is loaded from `systemData.json` during database initialization
2. Data is seeded into system tables at application start
3. Reference data changes typically require data file updates rather than migrations
4. Sync tracking in `systemSync` table records when system data was last loaded

---

## Migrations & Schema Evolution

### Migration Files

**Location**: `/src/electron/db/migrations/`

#### 1.0.0-sample.js
- **Purpose**: Initial setup (empty placeholder)
- **Changes**: None (up and down both empty)
- **Applied**: Initial database creation

#### 1.0.1-testLandmarks.js
- **Purpose**: Add landmark support to page targets
- **Up Migration**:
  - Adds `system_landmark_id` column (STRING, FK to systemLandmark)
  - Adds `parent_landmark_id` column (UUID, self-reference)
  - Creates indexes on both columns
- **Down Migration**: Removes both columns

#### 1.0.1-testOccurrenceCounts.js
- **Purpose**: Add related target/remediation counting
- **Up Migration**:
  - Adds `related_target_count` (INTEGER, default 0)
  - Adds `related_remediation_count` (INTEGER, default 0)
  - Creates indexes on both columns
- **Down Migration**: Removes both columns

#### 1.0.2-environmentPage.js
- **Purpose**: Add domain tracking to pages
- **Up Migration**:
  - Adds `domain` column (STRING, nullable)
- **Down Migration**: Removes column

#### 1.0.3-postLogin.js
- **Purpose**: Add manual review flag to targets
- **Up Migration**:
  - Adds `is_manually_reviewed` (BOOLEAN, default false)
- **Down Migration**: Removes column

### Migration Strategy

- **Versioning**: Semantic version + feature name (e.g., `1.0.1-testLandmarks.js`)
- **Transactions**: All migrations use `sequelize.transaction()` for atomicity
- **Rollback**: Each migration includes down function for reverting changes
- **Schema Tracking**: `migration` table tracks which migrations have been applied
- **Pattern**: Migrations modify main user data tables, not system data

---

## Indexes

### Primary Indexes
- All primary keys automatically indexed
- UUID v4 fields indexed on creation

### Secondary Indexes

#### testCaseEnvironmentTestPageTarget
```javascript
{
  fields: ['status'] // Quick filtering by result status
}
{
  fields: ['test_case_page_id'] // Foreign key lookup
}
{
  fields: ['remediation_id'] // Foreign key lookup
}
{
  fields: ['related_target_count'] // Sorting by count
}
{
  fields: ['related_remediation_count'] // Sorting by count
}
{
  fields: ['system_landmark_id'] // Added in migration 1.0.1
}
{
  fields: ['parent_landmark_id'] // Added in migration 1.0.1
}
```

#### testCaseEnvironmentTestPage
```javascript
{
  unique: true,
  fields: ['test_case_id', 'environment_page_id', 'environment_test_id']
  // Ensures only one execution per test-page-session combination
}
```

#### testPageTargetOccurrence
```javascript
{
  fields: ['page_target_id']
}
{
  fields: ['related_page_target_id']
}
```

---

## Constraints & Special Behaviors

### Unique Constraints

| Table | Constraint | Type |
|-------|-----------|------|
| migration | name | Primary key, unique |
| testCaseEnvironmentTestPage | (test_case_id, environment_page_id, environment_test_id) | Composite unique index |
| audit | identifier | Application-level unique |
| systemStandardCriteria.test_cases | Implicit through M2M | N/A |

### Not Null Constraints

- All primary keys NOT NULL
- Most `name` fields NOT NULL
- Foreign keys typically NOT NULL (except for optional relationships)
- `system_standard_id` and `system_category_id` in testCase NOT NULL
- `remediation_id`, `system_landmark_id` typically allow NULL

### Default Values

- UUID primary keys default to UUIDv4
- Timestamps default to NOW()
- Boolean flags typically default to false
- ENUM fields have specified defaults (e.g., 'OPENED', 'MANUAL', 'A')
- JSON fields default to empty objects/arrays (e.g., `selectors: ['body']`)

### Enum Values

| Field | Values |
|-------|--------|
| audit.status | OPEN, IN_PROGRESS, CLOSED |
| audit.conformance_target | A, AA, AAA |
| environmentTest.status | OPENED, IN_PROGRESS, TEST_COMPLETED, TEST_FAILED, COMPLETED, FAILED, CLOSED |
| environmentTestPage.page_type | RANDOM, STRUCTURED |
| testCase.type | MANUAL, AUTOMATIC |
| testCaseEnvironmentTestPage.status | PASS, FAIL, ERROR, NOT_APPLICABLE, INCOMPLETE, IN_PROGRESS, MANUAL |
| testCaseEnvironmentTestPageTarget.status | PASS, FAIL, ERROR, NOT_APPLICABLE, INCOMPLETE, IN_PROGRESS, MANUAL |
| systemStandardCriteria.level | A, AA, AAA |
| accessibilitySettings.profile | Defined in constants.PROFILES |

### Special Query Patterns

#### Composite Primary Keys / Unique Constraints
```javascript
// testCaseEnvironmentTestPage
unique composite on (test_case_id, environment_page_id, environment_test_id)
// Prevents duplicate test-page combinations in same session

// auditItem
composite primary key on (audit_id, system_audit_chapter_section_item_id, system_audit_chapter_section_item_type_id)

// testPageTargetOccurrence
composite primary key on (page_target_id, related_page_target_id)
```

#### Scoped Belongs-To-Many
```javascript
// environmentTest.random_pages
belongsToMany through environmentTestPage with scope: { page_type: 'RANDOM' }

// environmentTest.structured_pages
belongsToMany through environmentTestPage with scope: { page_type: 'STRUCTURED' }
```

#### Self-Referential Relationships
```javascript
// environmentPage.parent pages (page hierarchy)
belongsTo(environmentPage as 'parent')

// testCaseEnvironmentTestPageTarget.landmark hierarchy
belongsTo(testCaseEnvironmentTestPageTarget as 'parent_landmark')
hasMany(testCaseEnvironmentTestPageTarget as 'landmark_children')

// testCaseEnvironmentTestPageTarget.related targets
belongsToMany through testPageTargetOccurrence
```

### Data Validation

#### Application-Layer Validation
- URL format validation for `environment.url` and `audit.product_url`
- Path uniqueness within environment for `environmentPage.path`
- Audit identifier uniqueness
- Page belonging to environment (enforced in beforeCreate hook)

#### Hook-Based Validation
- `testCaseEnvironmentTestPage.beforeCreate`: Validates page belongs to environment test
- `testCaseEnvironmentTestPage.beforeCreate`: Sets status based on test case type
- `testCaseEnvironmentTestPage.beforeDestroy`: Cascades deletion of targets
- `testCase.beforeDestroy`: Cascades deletion of all executions and findings

#### Foreign Key Constraints
- Enforced by Sequelize with `references: { model, key }`
- Delete actions specified (CASCADE, SET NULL)
- Update actions specified (CASCADE)

---

## Performance Considerations

### Indexes for Common Queries
- `testCaseEnvironmentTestPageTarget.status` - Filtering by test result
- `testCaseEnvironmentTestPageTarget.related_target_count` - Sorting findings
- `testCaseEnvironmentTestPage` composite key - Preventing duplicates
- Foreign keys auto-indexed for joins

### Potential Query Bottlenecks
- Large audits with many criteria items
- Projects with many environment tests over time
- Queries joining across standard hierarchy levels
- Filtering targets with related counts

### Cascade Delete Performance
- Complex cascade paths (test → target → occurrence)
- Large test runs with many targets
- Uses transactions to prevent partial deletetes

---

## Summary Statistics

| Metric | Value |
|--------|-------|
| Total Models | 37 |
| Main Models | 18 |
| System Models | 19 |
| Total Tables | ~33 |
| Many-to-Many Junctions | 12 |
| Migrations | 5 (with 6 distinct changes) |
| Built-in Records | ~370 |
| Foreign Keys | 40+ |
| Indexes | 20+ |
| Cascade Delete Paths | 3 major |
| Composite Primary Keys | 3 |
| Unique Constraints | 2+ |

---

## Related Documentation
- [IPC_SPECIFICATION.md](IPC_SPECIFICATION.md) - API contract for database operations
- [IPC_CHANNELS_QUICK_REFERENCE.md](IPC_CHANNELS_QUICK_REFERENCE.md) - Database operation reference
- [FEATURES.md](../FEATURES.md) - Data model overview
- [CONTRIBUTING.md](../CONTRIBUTING.md) - Migration guidelines

---

*Documentation generated: May 22, 2026*
*Database Type: SQLite + Sequelize ORM*
*Framework: Node.js / Electron*
