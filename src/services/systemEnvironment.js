import db, { nowIso } from './db/index';
import { applyPaginate, applySearch } from './core';

class SystemEnvironmentService {
  static async find(input = {}, opt = {}) {
    if (input.id) return this.read({ id: input.id });
    let records = await db.systemEnvironments.toArray();
    if (input.search) records = applySearch(records, 'name', input.search);
    if (input.is_system !== undefined) records = records.filter(r => r.is_system === input.is_system);
    if (input.is_selected !== undefined) records = records.filter(r => r.is_selected === input.is_selected);
    const paginated = applyPaginate(records, input);
    if (opt.detailed && paginated.meta) {
      paginated.meta.total_count = records.length;
    }
    return paginated;
  }

  static async read(input = {}) {
    return db.systemEnvironments.get(input.id) || null;
  }

  static async create(input = {}) {
    const id = input.id || input.name.trim().toUpperCase().replace(/\s+/g, '_');
    const record = {
      id,
      name: input.name,
      is_system: input.is_system || false,
      is_selected: true,
      created_at: nowIso(),
      updated_at: nowIso()
    };
    await db.systemEnvironments.add(record);
    return record;
  }

  static async update(input = {}) {
    const env = await db.systemEnvironments.get(input.id);
    if (!env) throw new Error('System environment not found');
    const updates = { updated_at: nowIso() };
    if (input.name !== undefined) updates.name = input.name;
    if (input.is_selected !== undefined) updates.is_selected = input.is_selected;
    await db.systemEnvironments.update(input.id, updates);
    return this.find({ id: input.id });
  }

  static async updateIsSelected(input = {}) {
    const { ids, is_selected } = input;
    for (const id of ids) {
      await db.systemEnvironments.update(id, { is_selected, updated_at: nowIso() });
    }
  }

  static async delete(input = {}) {
    const env = await db.systemEnvironments.get(input.id);
    if (!env) throw new Error('System environment not found');
    if (env.is_system) throw new Error('Cannot delete system environment');
    await db.systemEnvironments.delete(input.id);
    return { success: true };
  }
}

export default SystemEnvironmentService;
