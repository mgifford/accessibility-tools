import db, { newId, nowIso } from './db/index';
import { applyPaginate, applySearch } from './core';
import { getAuditChapterSectionItems, getAuditChapterSectionItemTypes } from './systemData';

const WCAG_LEVELS_MAP = {
  A: ['A'],
  AA: ['A', 'AA'],
  AAA: ['A', 'AA', 'AAA']
};

class AuditService {
  static async create(input = {}) {
    const id = newId();
    const audit = {
      id,
      status: input.status || 'OPEN',
      wcag_version: input.wcag_version,
      conformance_target: input.conformance_target,
      identifier: input.identifier,
      project_id: input.project_id,
      environment_id: input.environment_id,
      environment_test_id: input.environment_test_id,
      profile_id: input.profile_id,
      system_audit_type_id: input.audit_type_id,
      system_audit_type_version_id: input.audit_type_version_id || null,
      start_date: input.start_date || nowIso(),
      product_name: input.product_name || null,
      product_version: input.product_version || null,
      product_description: input.product_description || null,
      product_url: input.product_url || null,
      vendor_name: input.vendor_name || null,
      vendor_address: input.vendor_address || null,
      vendor_url: input.vendor_url || null,
      vendor_contact_name: input.vendor_contact_name || null,
      vendor_contact_email: input.vendor_contact_email || null,
      vendor_contact_phone: input.vendor_contact_phone || null,
      notes: input.notes || null,
      methods: input.methods || null,
      disclaimer: input.disclaimer || null,
      repository_url: input.repository_url || null,
      feedback: input.feedback || null,
      license: input.license || null,
      summary: input.summary || null,
      created_at: nowIso(),
      updated_at: nowIso()
    };
    await db.audits.add(audit);

    // store chapter section links
    const chapters = input.audit_chapters || [];
    for (const chapterId of chapters) {
      await db.auditChapterSectionAudits.put({ audit_id: id, system_audit_chapter_section_id: chapterId });
    }

    // create audit items from section items
    const allItems = getAuditChapterSectionItems(chapters);
    const allTypes = getAuditChapterSectionItemTypes();
    const itemsToCreate = [];
    const auditTypeId = input.audit_type_id;

    for (const chapterId of chapters) {
      let chapterItems = allItems.filter(i => i.section === chapterId);
      if (auditTypeId === 'ATAG') {
        chapterItems = chapterItems.filter(i => !i.level || WCAG_LEVELS_MAP[input.conformance_target]?.includes(i.level));
      }
      // filter by wcag version when criteria are present
      chapterItems = chapterItems.filter((item) => {
        if (!item.criteria) return true;
        const criteriaVersions = item.criteriaVersions || [];
        if (criteriaVersions.length === 0) return true;
        return criteriaVersions.includes(input.wcag_version);
      });

      for (const item of chapterItems) {
        if (auditTypeId === 'VPAT') {
          const types = (item.types || []).length > 0 ? item.types : allTypes.map(t => t.key);
          for (const typeId of types) {
            itemsToCreate.push({
              audit_id: id,
              system_audit_chapter_section_item_id: item.key,
              system_audit_chapter_section_item_type_id: typeId,
              level: null,
              remarks: null
            });
          }
        } else {
          itemsToCreate.push({
            audit_id: id,
            system_audit_chapter_section_item_id: item.key,
            system_audit_chapter_section_item_type_id: 'FULL',
            level: null,
            remarks: null
          });
        }
      }
    }

    if (itemsToCreate.length) {
      await db.auditItems.bulkPut(itemsToCreate);
    }

    return audit;
  }

  static async find(input = {}, opt = {}) {
    if (input.id) return this.read({ id: input.id });
    let records = await db.audits.toArray();
    records.sort((a, b) => (b.start_date || '').localeCompare(a.start_date || ''));
    if (input.search) records = applySearch(records, 'identifier', input.search);
    if (opt.detailed) {
      records = await Promise.all(records.map(a => _enrichAudit(a)));
    }
    return applyPaginate(records, input);
  }

  static async read(input = {}) {
    const audit = await db.audits.get(input.id);
    if (!audit) return null;
    return _enrichAudit(audit);
  }

  static async update(input = {}) {
    const audit = await db.audits.get(input.id);
    if (!audit) throw new Error('Audit not found');
    const updates = { updated_at: nowIso() };
    const fields = [
      'status', 'wcag_version', 'conformance_target', 'identifier', 'start_date',
      'product_name', 'product_version', 'product_description', 'product_url',
      'vendor_name', 'vendor_address', 'vendor_url', 'vendor_contact_name',
      'vendor_contact_email', 'vendor_contact_phone', 'notes', 'methods',
      'disclaimer', 'repository_url', 'feedback', 'license', 'summary'
    ];
    fields.forEach((f) => { if (input[f] !== undefined) updates[f] = input[f]; });
    await db.audits.update(input.id, updates);
    return this.read({ id: input.id });
  }

  static async delete(input = {}) {
    await db.auditItems.where('audit_id').equals(input.id).delete();
    await db.auditChapterSectionAudits.where('audit_id').equals(input.id).delete();
    await db.audits.delete(input.id);
    return { success: true };
  }

  static async findAuditReportItems(input = {}) {
    const items = await db.auditItems.where('audit_id').equals(input.id).toArray();
    return items;
  }

  static async updateAuditReportItem(input = {}) {
    const { audit_id, system_audit_chapter_section_item_id, system_audit_chapter_section_item_type_id, level, remarks } = input;
    const updates = {};
    if (level !== undefined) updates.level = level;
    if (remarks !== undefined) updates.remarks = remarks;
    await db.auditItems.update(
      [audit_id, system_audit_chapter_section_item_id, system_audit_chapter_section_item_type_id],
      updates
    );
    return { success: true };
  }

  static async findAuditTypes(input = {}, opt = {}) {
    const { AuditTypeService } = await import('./systemData');
    return AuditTypeService.findAuditTypes(input, opt);
  }

  static async findAuditChapters(input = {}, opt = {}) {
    const { AuditTypeService } = await import('./systemData');
    return AuditTypeService.findAuditChapters(input, opt);
  }

  static async getStats(input = {}) {
    const items = await db.auditItems.where('audit_id').equals(input.id).toArray();
    const total = items.length;
    const updated = items.filter(i => i.level !== null && i.level !== undefined).length;
    const bySection = {};
    for (const item of items) {
      if (!bySection[item.system_audit_chapter_section_item_id]) {
        bySection[item.system_audit_chapter_section_item_id] = { id: item.system_audit_chapter_section_item_id, count: 0, done: 0 };
      }
      bySection[item.system_audit_chapter_section_item_id].count++;
      if (item.level) bySection[item.system_audit_chapter_section_item_id].done++;
    }
    return { total, updated, items: Object.values(bySection) };
  }

  static async generateReport(data = {}) {
    // Return the audit data and let the React report components render it
    const audit = await this.read({ id: data.id });
    if (!audit) return { success: false };
    const items = await db.auditItems.where('audit_id').equals(data.id).toArray();
    return { audit, items, format: data.format || 'HTML', name: audit.identifier || 'audit-report' };
  }
}

async function _enrichAudit(audit) {
  if (!audit) return null;
  const [project, environment, test, profile, sections] = await Promise.all([
    audit.project_id ? db.projects.get(audit.project_id) : null,
    audit.environment_id ? db.environments.get(audit.environment_id) : null,
    audit.environment_test_id ? db.environmentTests.get(audit.environment_test_id) : null,
    audit.profile_id ? db.profiles.get(audit.profile_id) : null,
    db.auditChapterSectionAudits.where('audit_id').equals(audit.id).toArray()
  ]);
  return {
    ...audit,
    project: project ? { id: project.id, name: project.name, image: project.image, connected: project.connected } : null,
    environment: environment ? { id: environment.id, name: environment.name, url: environment.url } : null,
    test: test ? { id: test.id, name: test.name, status: test.status } : null,
    profile: profile ? { id: profile.id, first_name: profile.first_name, last_name: profile.last_name } : null,
    sections: sections.map(s => ({ id: s.system_audit_chapter_section_id }))
  };
}

export default AuditService;
