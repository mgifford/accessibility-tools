import db, { newId, nowIso } from './db/index';
import { applyPaginate, applySearch } from './core';

class EnvironmentService {
  static async find(input = {}, opt = {}) {
    if (input.id) return this.read({ id: input.id });
    let records = await db.environments.toArray();
    if (input.project_id) records = records.filter(r => r.project_id === input.project_id);
    if (input.search) records = applySearch(records, 'name', input.search);
    if (opt.count) {
      const total = records.length;
      const paginated = applyPaginate(records, input);
      if (paginated.meta) paginated.meta.count = total;
      return paginated;
    }
    return applyPaginate(records, input);
  }

  static async read(input = {}) {
    const env = await db.environments.get(input.id);
    if (!env) return null;
    const project = env.project_id ? await db.projects.get(env.project_id) : null;
    const tests = await db.environmentTests.where('environment_id').equals(input.id).toArray();
    return {
      ...env,
      project: project
        ? {
            id: project.id,
            name: project.name,
            image: project.image,
            connected: project.connected,
            created_at: project.created_at,
            updated_at: project.updated_at
          }
        : null,
      tests: tests.map(t => ({
        id: t.id,
        name: t.name,
        functionality_note: t.functionality_note,
        page_variety_note: t.page_variety_note,
        status: t.status,
        start_date: t.start_date,
        end_date: t.end_date
      }))
    };
  }

  static async create(input = {}) {
    const id = newId();
    const record = {
      id,
      name: input.name,
      url: input.url,
      project_id: input.project_id || null,
      created_at: nowIso(),
      updated_at: nowIso()
    };
    await db.environments.add(record);
    return this.read({ id });
  }

  static async update(input = {}) {
    const env = await db.environments.get(input.id);
    if (!env) throw new Error('Environment not found');
    const updates = { updated_at: nowIso() };
    if (input.name !== undefined) updates.name = input.name;
    if (input.url !== undefined) updates.url = input.url;
    await db.environments.update(input.id, updates);
    return this.read({ id: input.id });
  }

  static async delete(input = {}) {
    await db.environments.delete(input.id);
    return { success: true };
  }

  static async dnsLookup(input = {}) {
    // Not available in browser — return success without actual DNS lookup
    return { success: true };
  }

  static async generateSitemap(input = {}) {
    // Sitemap generation (web crawling) is not available in browser
    return [];
  }

  static async getSitemap(input = {}) {
    const pages = await db.environmentPages
      .where('environment_id')
      .equals(input.environment_id)
      .toArray();
    return _buildSitemapTree(pages);
  }

  static async createPage(input = {}) {
    const env = await db.environments.get(input.id);
    if (!env) throw new Error('Environment not found');
    const url = input.url;
    let path;
    try {
      path = new URL(url).pathname || '/';
    } catch {
      path = url;
    }
    const existing = await db.environmentPages
      .where('environment_id')
      .equals(input.id)
      .filter(p => p.path === path)
      .first();
    if (existing) throw new Error('Page already exists');
    const page = {
      id: newId(),
      environment_id: input.id,
      path,
      name: path === '/' ? 'Home' : path.split('/').filter(Boolean).pop() || path,
      parent_id: null,
      not_clickable: false,
      created_at: nowIso(),
      updated_at: nowIso()
    };
    await db.environmentPages.add(page);
    return page;
  }
}

function _buildSitemapTree(pages) {
  const sortSitemap = (sitemap) => {
    sitemap.sort((a, b) => {
      if (a.name === 'Home') return -1;
      if (b.name === 'Home') return 1;
      return a.name.localeCompare(b.name);
    });
    sitemap.forEach(item => item.children && sortSitemap(item.children));
    return sitemap;
  };
  const buildTree = (parentId = null) => {
    return pages
      .filter(p => p.parent_id === parentId)
      .map((p) => {
        const children = buildTree(p.id);
        return children.length > 0 ? { ...p, children } : { ...p };
      });
  };
  return sortSitemap(buildTree());
}

export default EnvironmentService;
