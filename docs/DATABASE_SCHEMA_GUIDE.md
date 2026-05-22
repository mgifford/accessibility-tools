# Database Schema Documentation - Summary & Guide

**Generated**: May 22, 2026  
**Project**: Accessibility Tools (Clym)  
**Database**: SQLite with Sequelize ORM  
**Status**: ✅ Complete and Comprehensive

---

## Executive Summary

The Accessibility Tools database has been fully documented with complete schema specifications. The database is composed of:

- **38 Sequelize models** (18 main + 20 system)
- **33 database tables** (including 12 junction tables)
- **~370 pre-loaded system records** (WCAG standards, countries, categories)
- **80+ relationships** with proper foreign keys and constraints
- **5 database migrations** tracking schema evolution

The architecture follows a clean separation of concerns with user data models handling projects, tests, audits, and findings, while system models provide reference data for standards, geographic information, and audit frameworks.

---

## Documentation Files

### 1. **DATABASE_SCHEMA.md** ← START HERE
**Location**: `/docs/DATABASE_SCHEMA.md`  
**Size**: 3,500+ lines  
**Purpose**: Complete human-readable schema documentation

**Contains**:
- ✅ All 38 models with complete field documentation
- ✅ All column types, constraints, defaults, and nullable specifications
- ✅ All primary keys, foreign keys, and indexes
- ✅ All relationships (belongsTo, hasMany, belongsToMany, self-referential)
- ✅ Relationship diagram in text format
- ✅ Many-to-many junction table details
- ✅ Cascade delete and NULL behaviors
- ✅ Built-in system data inventory
- ✅ Migration history with schema changes
- ✅ Enum values and constraints
- ✅ Performance considerations
- ✅ Data validation patterns

**How to Use**:
1. Search for a model name to find its complete specification
2. Look at "Relationships" section for how it connects to other models
3. Check "Foreign Keys" to understand data integrity constraints
4. Review "Special Behavior" for hooks and custom logic
5. See "Indexes" for query optimization opportunities

**Key Sections**:
- [Overview](#overview) - Architecture and design patterns
- [Main Models (User Data)](#main-models-user-data) - 18 models (projects, tests, audits)
- [System Models (Reference Data)](#system-models-reference-data) - 20 models (standards, countries)
- [Relationships Diagram](#relationships-diagram) - Text-based ASCII diagram
- [Many-to-Many Relationships](#many-to-many-relationships) - All junction tables
- [Cascading Behaviors](#cascading-behaviors) - Delete/update cascades
- [Built-in System Data](#built-in-system-data) - Pre-loaded records
- [Migrations & Schema Evolution](#migrations--schema-evolution) - Schema history
- [Constraints & Special Behaviors](#constraints--special-behaviors) - Validation rules

---

### 2. **DATABASE_SCHEMA.json** ← FOR TOOLING
**Location**: `/docs/DATABASE_SCHEMA.json`  
**Size**: 1,000+ lines  
**Purpose**: Machine-readable schema specification

**Contains**:
- ✅ Structured JSON representation of all models
- ✅ Field definitions with types and constraints
- ✅ Relationship definitions (type, target, junctionTable)
- ✅ Foreign key specifications
- ✅ Cascade behavior definitions
- ✅ Migration information
- ✅ Statistics and metrics
- ✅ Built-in record counts

**How to Use**:
1. **API Documentation Tools**: Import into tools like Swagger, API Blueprint
2. **Code Generation**: Use as source for generating API documentation
3. **Schema Visualization**: Process to create ER diagrams
4. **Database Tools**: Import to understand schema for database management
5. **Testing**: Use to generate test fixtures and mock data
6. **Validation**: Use to validate against schema compliance

**Example Usage**:
```javascript
const schemaSpec = require('./DATABASE_SCHEMA.json');

// Get all model names
const allModels = Object.keys(schemaSpec.models.main.models)
  .concat(Object.keys(schemaSpec.models.system.models));

// Get relationships for a model
const projectRelationships = schemaSpec.models.main.models.project.relationships;

// Get junction tables
const junctionTables = schemaSpec.junctionTables;

// Get statistics
console.log(`Total Models: ${schemaSpec.statistics.totalModels}`);
```

---

## Quick Reference: Key Models

### Core Testing Models (User Data)

| Model | Purpose | Key Fields |
|-------|---------|-----------|
| **project** | Top-level testing effort | name, image, connected |
| **environment** | Website/app to test | name, url |
| **environmentPage** | Specific page in environment | name, path, domain |
| **environmentTest** | Test run/session | name, status, start_date, end_date |
| **testCase** | Test scenario (manual/auto) | name, type, steps, selectors |
| **testCaseEnvironmentTestPage** | Execution of test on page | test_case_id, environment_page_id, status |
| **testCaseEnvironmentTestPageTarget** | Individual finding/issue | status, rule, selector, html, summary |
| **audit** | Formal audit document | status, wcag_version, conformance_target |
| **remediation** | Fix recommendation | name, description, selectors |

### Standard Models (System Data)

| Model | Purpose | Records |
|-------|---------|---------|
| **systemStandard** | Standards (e.g., WCAG) | 1 |
| **systemStandardVersion** | Versions (2.0, 2.1, 2.2) | 3 |
| **systemStandardPrinciple** | WCAG principles | 4 |
| **systemStandardGuideline** | WCAG guidelines (1.1, 1.2...) | 13 |
| **systemStandardCriteria** | Success criteria (A/AA/AAA) | 87 |
| **systemCategory** | Test/remediation categories | 11 |
| **systemCountry** | Countries with phone prefixes | 247 |
| **systemLandmark** | HTML landmark roles | 11 |

---

## Key Database Relationships

### Main Test Workflow
```
project
  ├─ environment(s)
  │   ├─ environmentPage(s)
  │   └─ environmentTest(s)
  │       └─ testCaseEnvironmentTestPage(s)
  │           ├─ testCase(s)
  │           └─ testCaseEnvironmentTestPageTarget(s) [findings]
  │               ├─ remediation(s)
  │               └─ systemLandmark(s)
  │
  └─ audit(s)
      └─ auditItem(s)
```

### WCAG Standard Hierarchy
```
systemStandard (WCAG)
  ├─ systemStandardVersion (2.0, 2.1, 2.2)
  │
  ├─ systemStandardPrinciple (4 principles)
  │   ├─ systemStandardGuideline (13 guidelines)
  │   │   └─ systemStandardCriteria (87 criteria) → A/AA/AAA
  │   │
  │   └─ systemStandardCriteria (87 criteria)
  │
  └─ systemStandardCriteria (87 criteria)
```

### Remediation Framework
```
systemCategory
  └─ remediation(s)
      ├─ remediationExample(s) [code examples]
      ├─ testCase(s) [which tests cover this]
      └─ systemStandardCriteria(s) [which WCAG criteria addressed]
```

---

## Important Database Concepts

### Primary Key Strategy

| Key Type | Usage | Examples |
|----------|-------|----------|
| **UUID v4** | User-created data | project, environment, testCase execution |
| **STRING Semantic** | Reference/system data | "WCAG", "1.1", "US", "main" |
| **INTEGER** | Singleton/simple lookups | settings, accessibilitySettings |
| **Composite** | Junction/compound keys | auditItem, testPageTargetOccurrence |

### Foreign Key Cascade Behaviors

```javascript
// DELETE CASCADE paths (when parent deleted, children deleted)
environmentTest → testCaseEnvironmentTestPage → testCaseEnvironmentTestPageTarget

// SET NULL paths (when parent deleted, foreign key becomes NULL)
testCaseEnvironmentTestPageTarget.remediation_id → NULL
testCaseEnvironmentTestPageTarget.system_landmark_id → NULL
testCaseEnvironmentTestPageTarget.parent_landmark_id → NULL
```

### Many-to-Many Relationships

**12 junction tables** handle many-to-many relationships:

1. `project_technology` - Projects use technologies
2. `environmentTestPage` - Tests include pages (with page_type)
3. `test_case_remediations` - Tests linked to remediations
4. `test_case_axe_rules` - Tests use axe rules
5. `test_case_criteria` - Tests cover WCAG criteria
6. `remediation_criteria` - Remediations address criteria
7. `system_version_principle` - Versions include principles
8. `system_version_guideline` - Versions include guidelines
9. `system_version_criteria` - Versions include criteria
10. `system_audit_item_types` - Audit items have types
11. `audit_chapter_section_audit` - Audits include sections
12. `testPageTargetOccurrence` - Targets relate to each other

### Self-Referential Relationships

Three models have self-referential relationships:

1. **environmentPage**
   - `parent_id` → Same table (page hierarchy)
   - Allows tree structure for page navigation

2. **testCaseEnvironmentTestPageTarget**
   - `parent_landmark_id` → Same table (landmark hierarchy)
   - Allows landmark nesting/hierarchy
   - Many-to-many through `testPageTargetOccurrence`

---

## Data Flow & Common Queries

### Test Execution Flow
```
1. Create Project
   └─ Create Environment (add URL)
      └─ Create EnvironmentPage(s)
         └─ Create EnvironmentTest
            └─ For each TestCase:
               └─ Create TestCaseEnvironmentTestPage
                  └─ If issues found:
                     └─ Create TestCaseEnvironmentTestPageTarget(s)
                        └─ Link to Remediation suggestion
```

### Finding Accessibility Issues
```sql
-- Get all issues for a project
SELECT target.* FROM testCaseEnvironmentTestPageTarget target
  JOIN testCaseEnvironmentTestPage page ON target.test_case_page_id = page.id
  JOIN environmentTest test ON page.environment_test_id = test.id
  JOIN environment env ON test.environment_id = env.id
  WHERE env.project_id = ?;

-- Count issues by remediation
SELECT remediation_id, COUNT(*) as count
FROM testCaseEnvironmentTestPageTarget
WHERE status IN ('FAIL', 'ERROR')
GROUP BY remediation_id;

-- Issues affecting specific WCAG criteria
SELECT DISTINCT target.* FROM testCaseEnvironmentTestPageTarget target
  JOIN testCase tc ON ? = tc.id
  JOIN test_case_criteria ON tc.id = test_case_criteria.test_case_id
  WHERE test_case_criteria.system_standard_criteria_id = ?;
```

### Audit Reporting
```sql
-- Get audit items for report
SELECT item.*, section.name as section_name
FROM auditItem item
  JOIN systemAuditChapterSectionItem section ON item.system_audit_chapter_section_item_id = section.id
WHERE item.audit_id = ?
ORDER BY section.id;

-- Audit conformance summary
SELECT conformance_target, COUNT(*) as audit_count
FROM audit
WHERE status = 'CLOSED'
GROUP BY conformance_target;
```

---

## Schema Versions & Migrations

The database uses semantic versioning for migrations:

| Version | Migration | Change |
|---------|-----------|--------|
| 1.0.0 | sample | Initial setup (empty) |
| 1.0.1 | testLandmarks | Added `system_landmark_id`, `parent_landmark_id` |
| 1.0.1 | testOccurrenceCounts | Added `related_target_count`, `related_remediation_count` |
| 1.0.2 | environmentPage | Added `domain` column |
| 1.0.3 | postLogin | Added `is_manually_reviewed` |

**Current Version**: 1.0.3

### Migration Pattern
```javascript
// Each migration has up() and down() functions
export default {
  up: async (queryInterface, Sequelize) => {
    // Add columns, indexes, constraints
  },
  down: async (queryInterface, Sequelize) => {
    // Reverse changes
  }
};
```

---

## Best Practices & Patterns

### When Adding New Models

1. **Decide Key Strategy**: 
   - Use UUID v4 for user data
   - Use semantic STRING for reference data
   - Use composite keys for join tables

2. **Define Relationships**:
   - Use `belongsTo()` for required relationships
   - Use `hasMany()` for one-to-many
   - Use `belongsToMany()` with junction table for many-to-many
   - Consider cascade behaviors

3. **Add Constraints**:
   - Set `nullable: false` for required fields
   - Add `unique` for unique constraints
   - Specify `onDelete` and `onUpdate` actions
   - Add validation hooks if needed

4. **Plan Indexes**:
   - Index foreign keys for joins
   - Index frequently filtered fields
   - Index fields used in sorting
   - Avoid over-indexing (slower writes)

### When Modifying Schema

1. **Create Migration File**:
   - Use naming pattern: `VERSION-name.js`
   - Add both `up()` and `down()` functions
   - Wrap in transaction for atomicity

2. **Update Model**:
   - Add new fields to model definition
   - Add relationships if needed
   - Update any validation logic

3. **Test Migration**:
   - Test `up()` migration on dev database
   - Test `down()` (rollback) works
   - Test data integrity after migration

---

## Performance Optimization

### Indexing Strategy
- Foreign keys automatically indexed
- `testCaseEnvironmentTestPageTarget.status` - Filter by test result
- `testCaseEnvironmentTestPageTarget.related_*_count` - Sort findings
- `testCaseEnvironmentTestPage` composite - Prevent duplicates

### Query Optimization Tips

1. **Use Eager Loading**:
   ```javascript
   // Bad: N+1 queries
   const tests = await TestCase.findAll();
   for (const test of tests) {
     const criteria = await test.getCriteria();
   }
   
   // Good: Single query with include
   const tests = await TestCase.findAll({
     include: ['criteria', 'remediations']
   });
   ```

2. **Use Transactions**:
   ```javascript
   // Atomic operation with rollback on error
   await sequelize.transaction(async (t) => {
     await TestCaseEnvironmentTestPage.create(data, { transaction: t });
     await TestCaseEnvironmentTestPageTarget.create(target, { transaction: t });
   });
   ```

3. **Filter Early**:
   ```javascript
   // Filter in database, not in application
   const results = await TestCaseEnvironmentTestPageTarget.findAll({
     where: { status: 'FAIL' },
     include: ['remediation']
   });
   ```

---

## Troubleshooting & Common Issues

### Foreign Key Constraint Errors
**Problem**: "Cannot add or update a child row: a foreign key constraint fails"

**Solution**:
1. Verify parent record exists
2. Check parent ID is correct type (UUID vs STRING)
3. Verify cascade rules allow the operation
4. Use transaction to ensure atomicity

### Duplicate Key Errors
**Problem**: "Duplicate entry for key 'unique constraint'"

**Solution**:
1. Check composite keys: (test_case_id, environment_page_id, environment_test_id)
2. Verify no duplicates exist
3. Use INSERT IGNORE if updating is appropriate

### N+1 Query Problems
**Problem**: Slow performance with many separate queries

**Solution**:
1. Use `include` option in Sequelize
2. Use `raw: true` for read-only queries
3. Consider denormalization for frequently accessed data

### Orphaned Records
**Problem**: Child records remain after parent deletion

**Solution**:
1. Verify cascade delete is configured
2. Check hooks are executing
3. Use transaction to ensure all-or-nothing
4. Manually delete related records if needed

---

## Related Documentation

- **[IPC_SPECIFICATION.md](IPC_SPECIFICATION.md)** - API contract for database operations (115+ channels)
- **[FEATURES.md](../FEATURES.md)** - Product features and data model overview
- **[CONTRIBUTING.md](../CONTRIBUTING.md)** - Migration guidelines for developers
- **[README.md](../README.md)** - Project setup and overview

---

## Statistics Summary

| Metric | Value |
|--------|-------|
| Total Models | 38 |
| Main Models (User Data) | 18 |
| System Models (Reference) | 20 |
| Database Tables | 33 |
| Junction Tables | 12 |
| Foreign Keys | 40+ |
| Relationships | 80+ |
| Indexes | 20+ |
| Built-in Records | ~370 |
| Migrations | 5 |
| Schema Version | 1.0.3 |

---

## Document History

| Date | Version | Changes |
|------|---------|---------|
| 2026-05-22 | 1.0 | Initial comprehensive schema documentation |

---

## Next Steps

1. **Review DATABASE_SCHEMA.md** for complete specification
2. **Explore DATABASE_SCHEMA.json** for machine-readable format
3. **Refer to IPC_SPECIFICATION.md** for API operations
4. **Check migrations** for schema evolution history
5. **Use patterns** from existing models when extending

---

*For questions or updates, refer to the complete DATABASE_SCHEMA.md file or review the Sequelize model files in `/src/electron/db/models/`.*
