import Dexie from 'dexie';
import systemData from '@/electron/db/systemData.json';

export const db = new Dexie('AccessibilityTools');

db.version(1).stores({
  // user-editable tables
  projects: 'id, name, connected, created_at',
  projectTechnologies: '[project_id+technology_id], project_id',
  environments: 'id, project_id, created_at',
  environmentPages: 'id, environment_id, parent_id',
  environmentTests: 'id, environment_id, status',
  environmentTestPages: 'id, environment_test_id, environment_page_id',
  testCaseEnvironmentTestPages: 'id, test_case_id, environment_page_id, environment_test_id, status',
  testCaseEnvironmentTestPageTargets: 'id, test_case_page_id, status',
  testPageTargetOccurrences: 'id, page_target_id, related_page_target_id',
  audits: 'id, project_id, environment_id, environment_test_id, profile_id, status, start_date',
  auditChapterSectionAudits: '[audit_id+system_audit_chapter_section_id], audit_id',
  auditItems: '[audit_id+system_audit_chapter_section_item_id+system_audit_chapter_section_item_type_id], audit_id',
  testCases: 'id, name, type, is_selected, system_category_id',
  testCaseRemediations: '[test_case_id+remediation_id], test_case_id, remediation_id',
  testCaseCriteria: '[test_case_id+system_standard_criteria_id], test_case_id',
  testCaseAxeRules: '[test_case_id+rule_id], test_case_id',
  remediations: 'id, name, system_category_id, is_selected',
  remediationExamples: '++pk, id, remediation_id',
  remediationCriteria: '[remediation_id+system_standard_criteria_id], remediation_id',
  remediationTestCases: '[remediation_id+test_case_id], remediation_id, test_case_id',
  technologies: 'id, name, is_system',
  profiles: 'id, first_name, last_name',
  profileOrganizations: 'id, profile_id',
  settings: 'id',
  accessibilitySettings: 'id',
  // seedable system tables (from systemData.json; user can add/modify)
  systemCategories: 'id, name, is_system, is_selected, priority',
  systemEnvironments: 'id, name, is_system, is_selected',
  // db metadata
  dbMeta: 'key'
});

let _seedPromise = null;

export async function seedIfNeeded() {
  if (_seedPromise) return _seedPromise;
  _seedPromise = _doSeed();
  return _seedPromise;
}

async function _doSeed() {
  const meta = await db.dbMeta.get('seeded');
  if (meta?.value) return;

  await db.transaction(
    'rw',
    [
      db.systemCategories,
      db.systemEnvironments,
      db.technologies,
      db.testCases,
      db.testCaseAxeRules,
      db.testCaseCriteria,
      db.remediations,
      db.remediationExamples,
      db.remediationCriteria,
      db.remediationTestCases,
      db.settings,
      db.accessibilitySettings,
      db.dbMeta
    ],
    async () => {
      // seed system categories
      const categories = systemData.categories.map((c, i) => ({
        id: c.key,
        name: c.name,
        is_system: true,
        is_selected: true,
        priority: systemData.categories.length - 1 - i
      }));
      await db.systemCategories.bulkPut(categories);

      // seed system environments
      const environments = systemData.environments.map(e => ({
        id: e.key,
        name: e.name,
        is_system: true,
        is_selected: true
      }));
      await db.systemEnvironments.bulkPut(environments);

      // seed technologies
      const technologies = systemData.technologies.map(t => ({
        id: t.key,
        name: t.name,
        is_system: true
      }));
      await db.technologies.bulkPut(technologies);

      // seed system test cases
      for (const tc of systemData.testCases) {
        await db.testCases.put({
          id: tc.id,
          name: tc.name,
          type: tc.type,
          steps: tc.steps || '',
          result: tc.result || '',
          instruction: tc.instruction || '',
          description: tc.description || '',
          selectors: tc.selectors || ['body'],
          system_category_id: tc.category || null,
          is_selected: true,
          is_system: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        for (const ruleId of (tc.axeRules || [])) {
          await db.testCaseAxeRules.put({ test_case_id: tc.id, rule_id: ruleId });
        }
        for (const criteriaId of (tc.criteria || [])) {
          await db.testCaseCriteria.put({ test_case_id: tc.id, system_standard_criteria_id: criteriaId });
        }
      }

      // seed system remediations
      for (const rem of systemData.remediations) {
        await db.remediations.put({
          id: rem.id,
          name: rem.name,
          description: rem.description || '',
          selectors: Array.isArray(rem.selectors) ? rem.selectors : (rem.selectors ? [rem.selectors] : []),
          system_category_id: rem.category || null,
          is_selected: true,
          is_system: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        for (const example of (rem.examples || [])) {
          await db.remediationExamples.add({
            id: example.id,
            remediation_id: rem.id,
            name: example.name,
            description: example.description || '',
            code: example.code || ''
          });
        }
        for (const criteriaId of (rem.criteria || [])) {
          await db.remediationCriteria.put({ remediation_id: rem.id, system_standard_criteria_id: criteriaId });
        }
      }

      // wire up test cases ↔ remediations from system data
      for (const rem of systemData.remediations) {
        for (const tc of systemData.testCases) {
          const sameCategory = rem.category && tc.category && rem.category === tc.category;
          const sharedCriteria = (rem.criteria || []).some(c => (tc.criteria || []).includes(c));
          if (sameCategory && sharedCriteria) {
            await db.remediationTestCases.put({ remediation_id: rem.id, test_case_id: tc.id });
            await db.testCaseRemediations.put({ test_case_id: tc.id, remediation_id: rem.id });
          }
        }
      }

      // seed settings & accessibility settings
      await db.settings.put({ id: 1, is_eula_accepted: false, can_open_browser: false });
      await db.accessibilitySettings.put({ id: 1, profile: null, adjustments: [] });

      await db.dbMeta.put({ key: 'seeded', value: true });
    }
  );
}

export function newId() {
  return crypto.randomUUID();
}

export function nowIso() {
  return new Date().toISOString();
}

export default db;
