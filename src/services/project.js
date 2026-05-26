import db, { newId, nowIso } from './db/index';
import { applyPaginate, applySearch } from './core';

class ProjectService {
  static async create(input = {}) {
    const id = newId();
    const record = {
      id,
      name: input.name,
      image: input.image || null,
      connected: input.connected || false,
      essential_functionality: input.essential_functionality || '',
      webpage_types: input.webpage_types || '',
      created_at: nowIso(),
      updated_at: nowIso()
    };
    await db.projects.add(record);
    if (input.technologies?.length) {
      await db.projectTechnologies.bulkAdd(
        input.technologies.map(tech_id => ({ project_id: id, technology_id: tech_id }))
      );
    }
    return this.read({ id });
  }

  static async find(input = {}, opt = {}) {
    if (input.id) return this.read({ id: input.id });
    let records = await db.projects.toArray();
    if (input.connected !== undefined && input.connected !== null) {
      records = records.filter(r => r.connected === input.connected);
    }
    if (input.search) records = applySearch(records, 'name', input.search);
    return applyPaginate(records, input);
  }

  static async read(input = {}) {
    const project = await db.projects.get(input.id);
    if (!project) return null;
    const envs = await db.environments.where('project_id').equals(input.id).toArray();
    const techLinks = await db.projectTechnologies.where('project_id').equals(input.id).toArray();
    const techs = await Promise.all(
      techLinks.map(link => db.technologies.get(link.technology_id))
    );
    return {
      ...project,
      environments: envs,
      technologies: techs.filter(Boolean).map(t => ({ id: t.id, name: t.name }))
    };
  }

  static async update(input = {}) {
    const project = await db.projects.get(input.id);
    if (!project) throw new Error('Project not found');
    const updates = { updated_at: nowIso() };
    if (input.name !== undefined) updates.name = input.name;
    if (input.image !== undefined) updates.image = input.image;
    if (input.connected !== undefined) updates.connected = input.connected;
    if (input.essential_functionality !== undefined) updates.essential_functionality = input.essential_functionality;
    if (input.webpage_types !== undefined) updates.webpage_types = input.webpage_types;
    await db.projects.update(input.id, updates);
    if (input.technologies !== undefined) {
      await db.projectTechnologies.where('project_id').equals(input.id).delete();
      if (input.technologies.length) {
        await db.projectTechnologies.bulkAdd(
          input.technologies.map(tech_id => ({ project_id: input.id, technology_id: tech_id }))
        );
      }
    }
    return this.read({ id: input.id });
  }

  static async delete(input = {}) {
    const project = await db.projects.get(input.id);
    if (!project) throw new Error('Project not found');
    // cascade: delete environments and their tests
    const envs = await db.environments.where('project_id').equals(input.id).toArray();
    for (const env of envs) {
      const tests = await db.environmentTests.where('environment_id').equals(env.id).toArray();
      for (const test of tests) {
        await _deleteEnvironmentTest(test.id);
      }
      await db.environmentPages.where('environment_id').equals(env.id).delete();
      await db.environments.delete(env.id);
    }
    await db.projectTechnologies.where('project_id').equals(input.id).delete();
    await db.projects.delete(input.id);
    return { success: true, message: 'Project deleted successfully' };
  }
}

async function _deleteEnvironmentTest(testId) {
  const pages = await db.environmentTestPages.where('environment_test_id').equals(testId).toArray();
  for (const page of pages) {
    const tcPages = await db.testCaseEnvironmentTestPages
      .where('[environment_page_id+environment_test_id]')
      .equals([page.environment_page_id, testId])
      .toArray();
    for (const tcPage of tcPages) {
      await db.testCaseEnvironmentTestPageTargets.where('test_case_page_id').equals(tcPage.id).delete();
    }
    await db.testCaseEnvironmentTestPages
      .where('[environment_page_id+environment_test_id]')
      .equals([page.environment_page_id, testId])
      .delete();
  }
  await db.environmentTestPages.where('environment_test_id').equals(testId).delete();
  await db.environmentTests.delete(testId);
}

export { _deleteEnvironmentTest };
export default ProjectService;
