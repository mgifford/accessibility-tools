import db, { newId, nowIso } from './db/index';
import { applyPaginate, applySearch } from './core';

function _generateRemId(prefix, existing) {
  const filtered = existing.filter(r => r.id.startsWith(prefix));
  if (filtered.length === 0) return `${prefix}0001`;
  const nums = filtered.map(r => parseInt(r.id.slice(prefix.length))).filter(n => !isNaN(n));
  const max = nums.length > 0 ? Math.max(...nums) : 0;
  return `${prefix}${String(max + 1).padStart(4, '0')}`;
}

class RemediationService {
  static async find(input = {}, opt = {}) {
    if (input.id) return this.read({ id: input.id });
    let records = await db.remediations.toArray();
    if (input.search) records = applySearch(records, 'name', input.search);
    if (input.is_selected !== undefined) records = records.filter(r => r.is_selected === input.is_selected);
    if (input.system_category_id) records = records.filter(r => r.system_category_id === input.system_category_id);
    if (opt.detailed || opt.withRelations) {
      records = await Promise.all(records.map(_enrichRemediation));
    }
    return applyPaginate(records, input);
  }

  static async read(input = {}) {
    const rem = await db.remediations.get(input.id);
    if (!rem) return null;
    return _enrichRemediation(rem);
  }

  static async create(input = {}, opt = {}) {
    const existing = await db.remediations.toArray();
    const prefix = opt.is_system ? 'SYS_REM_' : 'USR_REM_';
    const id = input.id || _generateRemId(prefix, existing);
    const selectors = Array.isArray(input.selectors)
      ? input.selectors
      : (input.selectors ? input.selectors.split('\n').map(s => s.trim()).filter(Boolean) : []);
    const record = {
      id,
      name: input.name,
      description: input.description || '',
      selectors,
      system_category_id: input.system_category_id || null,
      is_selected: true,
      is_system: opt.is_system || false,
      created_at: nowIso(),
      updated_at: nowIso()
    };
    await db.remediations.add(record);

    for (const example of (input.examples || [])) {
      await db.remediationExamples.add({
        id: example.id || newId(),
        remediation_id: id,
        name: example.name,
        description: example.description || '',
        code: example.code || ''
      });
    }
    for (const criteriaId of (input.system_criteria || [])) {
      await db.remediationCriteria.put({ remediation_id: id, system_standard_criteria_id: criteriaId });
    }
    for (const tcId of (input.test_cases || [])) {
      await db.remediationTestCases.put({ remediation_id: id, test_case_id: tcId });
      await db.testCaseRemediations.put({ test_case_id: tcId, remediation_id: id });
    }

    return this.read({ id });
  }

  static async update(input = {}) {
    const rem = await db.remediations.get(input.id);
    if (!rem) throw new Error('Remediation not found');
    const updates = { updated_at: nowIso() };
    if (input.name !== undefined) updates.name = input.name;
    if (input.description !== undefined) updates.description = input.description;
    if (input.selectors !== undefined) {
      updates.selectors = Array.isArray(input.selectors)
        ? input.selectors
        : input.selectors.split('\n').map(s => s.trim()).filter(Boolean);
    }
    if (input.system_category_id !== undefined) updates.system_category_id = input.system_category_id;
    await db.remediations.update(input.id, updates);

    if (input.examples !== undefined) {
      await db.remediationExamples.where('remediation_id').equals(input.id).delete();
      for (const example of input.examples) {
        await db.remediationExamples.add({
          id: example.id || newId(),
          remediation_id: input.id,
          name: example.name,
          description: example.description || '',
          code: example.code || ''
        });
      }
    }
    if (input.system_criteria !== undefined) {
      await db.remediationCriteria.where('remediation_id').equals(input.id).delete();
      for (const criteriaId of input.system_criteria) {
        await db.remediationCriteria.put({ remediation_id: input.id, system_standard_criteria_id: criteriaId });
      }
    }

    return this.read({ id: input.id });
  }

  static async updateIsSelected(input = {}) {
    const { ids, is_selected } = input;
    for (const id of ids) {
      await db.remediations.update(id, { is_selected, updated_at: nowIso() });
    }
  }

  static async delete(input = {}) {
    const id = input.id;
    await db.remediationExamples.where('remediation_id').equals(id).delete();
    await db.remediationCriteria.where('remediation_id').equals(id).delete();
    await db.remediationTestCases.where('remediation_id').equals(id).delete();
    await db.testCaseRemediations.where('remediation_id').equals(id).delete();
    await db.remediations.delete(id);
    return { success: true };
  }
}

async function _enrichRemediation(rem) {
  if (!rem) return null;
  const [examples, criteriaLinks, tcLinks] = await Promise.all([
    db.remediationExamples.where('remediation_id').equals(rem.id).toArray(),
    db.remediationCriteria.where('remediation_id').equals(rem.id).toArray(),
    db.remediationTestCases.where('remediation_id').equals(rem.id).toArray()
  ]);
  return {
    ...rem,
    examples,
    system_criteria: criteriaLinks.map(l => l.system_standard_criteria_id),
    test_cases: tcLinks.map(l => l.test_case_id)
  };
}

export default RemediationService;
