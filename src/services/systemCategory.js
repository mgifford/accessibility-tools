import db, { nowIso } from './db/index';
import { applyPaginate, applySearch } from './core';

class SystemCategoryService {
  static async find(input = {}, opt = {}) {
    if (input.id) return this.read({ id: input.id });
    let records = await db.systemCategories.orderBy('priority').reverse().toArray();
    if (input.search) records = applySearch(records, 'name', input.search);
    if (input.is_system !== undefined) records = records.filter(r => r.is_system === input.is_system);
    if (input.is_selected !== undefined) records = records.filter(r => r.is_selected === input.is_selected);
    const paginated = applyPaginate(records, input);
    if (opt.detailed) {
      const total = records.length;
      if (paginated.meta) paginated.meta.total_count = total;
      if (opt.count && paginated.meta) paginated.meta.count = total;
    }
    return paginated;
  }

  static async read(input = {}) {
    return db.systemCategories.get(input.id) || null;
  }

  static async create(input = {}) {
    const id = input.id || input.name.trim().toUpperCase().replace(/\s+/g, '_');
    const record = {
      id,
      name: input.name,
      is_system: input.is_system || false,
      is_selected: true,
      priority: 0,
      created_at: nowIso(),
      updated_at: nowIso()
    };
    await db.systemCategories.add(record);
    return record;
  }

  static async update(input = {}) {
    const cat = await db.systemCategories.get(input.id);
    if (!cat) throw new Error('Category not found');
    const updates = { updated_at: nowIso() };
    if (input.name !== undefined) updates.name = input.name;
    if (input.is_selected !== undefined) updates.is_selected = input.is_selected;
    await db.systemCategories.update(input.id, updates);
    return this.find({ id: input.id });
  }

  static async updateIsSelected(input = {}) {
    const { ids, is_selected } = input;
    for (const id of ids) {
      await db.systemCategories.update(id, { is_selected, updated_at: nowIso() });
    }
  }

  static async updatePriority(input = {}) {
    const { ids } = input;
    for (let i = 0; i < ids.length; i++) {
      await db.systemCategories.update(ids[i], { priority: ids.length - 1 - i });
    }
  }

  static async delete(input = {}) {
    const cat = await db.systemCategories.get(input.id);
    if (!cat) throw new Error('Category not found');
    if (cat.is_system) throw new Error('Cannot delete system category');
    await db.systemCategories.delete(input.id);
    return { success: true };
  }
}

export default SystemCategoryService;
