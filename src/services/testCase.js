import db, { newId, nowIso } from './db/index';
import { applyPaginate, applySearch } from './core';

class TestCaseService {
  static async find(input = {}, opt = {}) {
    if (input.id) return this.read({ id: input.id });
    let records = await db.testCases.toArray();
    if (input.type) records = records.filter(r => r.type === input.type);
    if (input.is_selected !== undefined) records = records.filter(r => r.is_selected === input.is_selected);
    if (input.system_category_id) records = records.filter(r => r.system_category_id === input.system_category_id);
    if (input.search) records = applySearch(records, 'name', input.search);
    if (opt.detailed || opt.withRelations) {
      records = await Promise.all(records.map(r => _enrichTestCase(r)));
    }
    return applyPaginate(records, input);
  }

  static async read(input = {}) {
    const tc = await db.testCases.get(input.id);
    if (!tc) return null;
    return _enrichTestCase(tc);
  }

  static async create(input = {}) {
    const id = input.id || newId();
    const record = {
      id,
      name: input.name,
      type: input.type || 'MANUAL',
      steps: input.steps || '',
      result: input.result || '',
      instruction: input.instruction || '',
      description: input.description || '',
      selectors: input.selectors || ['body'],
      system_category_id: input.system_category_id || null,
      is_selected: input.is_selected !== undefined ? input.is_selected : true,
      is_system: false,
      created_at: nowIso(),
      updated_at: nowIso()
    };
    await db.testCases.add(record);

    for (const remId of (input.remediations || [])) {
      await db.testCaseRemediations.put({ test_case_id: id, remediation_id: remId });
      await db.remediationTestCases.put({ remediation_id: remId, test_case_id: id });
    }
    for (const criteriaId of (input.criteria || [])) {
      await db.testCaseCriteria.put({ test_case_id: id, system_standard_criteria_id: criteriaId });
    }
    for (const ruleId of (input.axeRules || [])) {
      await db.testCaseAxeRules.put({ test_case_id: id, rule_id: ruleId });
    }

    return this.read({ id });
  }

  static async update(input = {}) {
    const tc = await db.testCases.get(input.id);
    if (!tc) throw new Error('TestCase not found');
    const updates = { updated_at: nowIso() };
    const fields = ['name', 'type', 'steps', 'result', 'instruction', 'description', 'selectors', 'system_category_id', 'is_selected'];
    fields.forEach((f) => { if (input[f] !== undefined) updates[f] = input[f]; });
    await db.testCases.update(input.id, updates);

    if (input.remediations !== undefined) {
      await db.testCaseRemediations.where('test_case_id').equals(input.id).delete();
      for (const remId of input.remediations) {
        await db.testCaseRemediations.put({ test_case_id: input.id, remediation_id: remId });
      }
    }
    if (input.criteria !== undefined) {
      await db.testCaseCriteria.where('test_case_id').equals(input.id).delete();
      for (const criteriaId of input.criteria) {
        await db.testCaseCriteria.put({ test_case_id: input.id, system_standard_criteria_id: criteriaId });
      }
    }

    return this.read({ id: input.id });
  }

  static async updateIsSelected(input = {}) {
    const { ids, is_selected } = input;
    for (const id of ids) {
      await db.testCases.update(id, { is_selected, updated_at: nowIso() });
    }
  }

  static async delete(input = {}) {
    const id = input.id;
    const tcPages = await db.testCaseEnvironmentTestPages.where('test_case_id').equals(id).toArray();
    for (const tcPage of tcPages) {
      await db.testCaseEnvironmentTestPageTargets.where('test_case_page_id').equals(tcPage.id).delete();
    }
    await db.testCaseEnvironmentTestPages.where('test_case_id').equals(id).delete();
    await db.testCaseRemediations.where('test_case_id').equals(id).delete();
    await db.testCaseCriteria.where('test_case_id').equals(id).delete();
    await db.testCaseAxeRules.where('test_case_id').equals(id).delete();
    await db.testCases.delete(id);
    return { success: true };
  }
}

async function _enrichTestCase(tc) {
  if (!tc) return null;
  const [remLinks, criteriaLinks, ruleLinks] = await Promise.all([
    db.testCaseRemediations.where('test_case_id').equals(tc.id).toArray(),
    db.testCaseCriteria.where('test_case_id').equals(tc.id).toArray(),
    db.testCaseAxeRules.where('test_case_id').equals(tc.id).toArray()
  ]);
  const remediations = await Promise.all(remLinks.map(l => db.remediations.get(l.remediation_id)));
  return {
    ...tc,
    remediations: remediations.filter(Boolean),
    criteria: criteriaLinks.map(l => ({ id: l.system_standard_criteria_id })),
    rules: ruleLinks.map(l => ({ id: l.rule_id }))
  };
}

export default TestCaseService;
