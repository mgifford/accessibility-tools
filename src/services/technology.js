import db, { newId, nowIso } from './db/index';
import { applyPaginate, applySearch } from './core';

class TechnologyService {
  static async find(input = {}, opt = {}) {
    if (input.id) return this.read({ id: input.id });
    let records = await db.technologies.toArray();
    if (input.search) records = applySearch(records, 'name', input.search);
    return applyPaginate(records, input);
  }

  static async read(input = {}) {
    return db.technologies.get(input.id) || null;
  }

  static async create(input = {}) {
    const id = input.id || input.name.trim().toUpperCase().replace(/\s+/g, '_');
    const record = { id, name: input.name, is_system: false, created_at: nowIso(), updated_at: nowIso() };
    await db.technologies.add(record);
    return record;
  }

  static async update(input = {}) {
    const tech = await db.technologies.get(input.id);
    if (!tech) throw new Error('Technology not found');
    const updates = { updated_at: nowIso() };
    if (input.name !== undefined) updates.name = input.name;
    await db.technologies.update(input.id, updates);
    return db.technologies.get(input.id);
  }

  static async delete(input = {}) {
    await db.projectTechnologies.where('technology_id').equals(input.id).delete();
    await db.technologies.delete(input.id);
    return { success: true };
  }
}

export default TechnologyService;
