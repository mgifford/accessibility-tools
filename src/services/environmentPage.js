import db, { newId, nowIso } from './db/index';
import { applyPaginate } from './core';

class EnvironmentPageService {
  static async scanPage() {
    // Live page scanning is not available in browser. Import results via the Actions importer.
    return { success: false, message: 'Live scanning not available in browser. Use "Import scan results" to load data.' };
  }

  static async findTestCases(input = {}, opt = {}) {
    const { environment_page_id, environment_test_id } = input;
    let rows = await db.testCaseEnvironmentTestPages.toArray();
    if (environment_page_id) rows = rows.filter(r => r.environment_page_id === environment_page_id);
    if (environment_test_id) rows = rows.filter(r => r.environment_test_id === environment_test_id);
    const testCases = await Promise.all(
      rows.map(async (row) => {
        const tc = await db.testCases.get(row.test_case_id);
        return tc ? { ...row, test_case: tc } : null;
      })
    );
    return applyPaginate(testCases.filter(Boolean), input);
  }

  static async findTestCaseNodes(input = {}, opt = {}) {
    const { environment_page_id, environment_test_id, status } = input;
    let rows = await db.testCaseEnvironmentTestPages.toArray();
    if (environment_page_id) rows = rows.filter(r => r.environment_page_id === environment_page_id);
    if (environment_test_id) rows = rows.filter(r => r.environment_test_id === environment_test_id);
    const nodes = [];
    for (const row of rows) {
      let targets = await db.testCaseEnvironmentTestPageTargets.where('test_case_page_id').equals(row.id).toArray();
      if (status) {
        targets = Array.isArray(status) ? targets.filter(t => status.includes(t.status)) : targets.filter(t => t.status === status);
      }
      for (const target of targets) {
        nodes.push({ ...target, test: { test_case_id: row.test_case_id, environment_page_id: row.environment_page_id } });
      }
    }
    return applyPaginate(nodes, input);
  }

  static async readTestCase(input = {}) {
    const row = await db.testCaseEnvironmentTestPages.get(input.id);
    if (!row) return null;
    const tc = await db.testCases.get(row.test_case_id);
    const targets = await db.testCaseEnvironmentTestPageTargets.where('test_case_page_id').equals(row.id).toArray();
    return { ...row, test_case: tc, targets };
  }

  static async findEnvironmentTest(input = {}) {
    const { environment_page_id, environment_test_id } = input;
    const page = await db.environmentTestPages
      .where('environment_test_id').equals(environment_test_id)
      .filter(r => r.environment_page_id === environment_page_id)
      .first();
    return page || null;
  }

  static async updateEnvironmentTestTarget(input = {}) {
    const { id, remediation_id, is_manually_reviewed } = input;
    const updates = { updated_at: nowIso() };
    if (remediation_id !== undefined) updates.remediation_id = remediation_id;
    if (is_manually_reviewed !== undefined) updates.is_manually_reviewed = is_manually_reviewed;
    await db.testCaseEnvironmentTestPageTargets.update(id, updates);
    return db.testCaseEnvironmentTestPageTargets.get(id);
  }

  static async generateReport(data = {}) {
    // In browser, generate a CSV blob and trigger download
    const { environment_page_id, environment_test_id } = data;
    const nodesResult = await this.findTestCases({ environment_page_id, environment_test_id }, { paginate: false });
    const rows = Array.isArray(nodesResult) ? nodesResult : (nodesResult.result || []);
    const csvLines = ['Test Case ID,Test Case Name,Status'];
    for (const row of rows) {
      csvLines.push(`"${row.test_case_id}","${(row.test_case?.name || '').replace(/"/g, '""')}","${row.status || ''}"`);
    }
    const csv = csvLines.join('\n');
    return { csv, name: `test-cases-${nowIso()}.csv` };
  }

  static async updateSitemap(input = {}) {
    const { environment_id, sitemap = [] } = input;
    await db.environmentPages.where('environment_id').equals(environment_id).delete();
    const toAdd = sitemap.map(page => ({
      id: page.id || newId(),
      environment_id,
      path: page.path || page.url || '/',
      name: page.name || (page.path === '/' ? 'Home' : (page.path || '').split('/').filter(Boolean).pop() || page.path),
      parent_id: page.parent_id || null,
      not_clickable: page.not_clickable || false,
      created_at: nowIso(),
      updated_at: nowIso()
    }));
    if (toAdd.length) await db.environmentPages.bulkAdd(toAdd);
  }
}

export default EnvironmentPageService;
