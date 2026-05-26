/**
 * Browser-side service that serves read-only WCAG / audit system data
 * directly from systemData.json — no database required.
 */
import rawData from '@/electron/db/systemData.json';
import { applyPaginate, applySearch } from './core';

// ── helpers ────────────────────────────────────────────────────────────────

function paginate(records, data = {}) {
  return applyPaginate(records, data);
}

// ── SystemStandard ──────────────────────────────────────────────────────────

export class SystemStandardService {
  static async find(input = {}, opt = {}) {
    let records = rawData.standards.map(s => ({
      id: s.key,
      name: s.name,
      ...(opt.detailed
        ? {
            versions: rawData.versions
              .filter(v => v.standard === s.key)
              .map(v => ({ id: v.key, name: v.name })),
            principles: rawData.principles
              .filter(p => p.standard === s.key)
              .map(p => ({
                id: p.key,
                name: p.name,
                description: p.description,
                guidelines: rawData.guidelines
                  .filter(g => g.standard === s.key && g.principle === p.key)
                  .map(g => ({
                    id: g.key,
                    name: g.name,
                    description: g.description,
                    criteria: rawData.criteria
                      .filter(c => c.standard === s.key && c.guideline === g.key)
                      .map(c => ({ id: c.key, name: c.name, description: c.description, level: c.level }))
                  }))
              }))
          }
        : {})
    }));
    if (input.id) {
      const found = records.find(r => r.id === input.id);
      return found || null;
    }
    if (input.search) records = applySearch(records, 'name', input.search);
    return paginate(records, input);
  }

  static async findVersions(input = {}, opt = {}) {
    let records = rawData.versions.map(v => ({ id: v.key, name: v.name, system_standard_id: v.standard }));
    if (input.id) records = records.filter(r => r.id === input.id);
    if (input.system_standard_id) records = records.filter(r => r.system_standard_id === input.system_standard_id);
    if (input.search) records = applySearch(records, 'name', input.search);
    return paginate(records, input);
  }

  static async findPrinciples(input = {}, opt = {}) {
    let records = rawData.principles.map(p => ({
      id: p.key,
      name: p.name,
      description: p.description,
      system_standard_id: p.standard
    }));
    if (input.id) records = records.filter(r => r.id === input.id);
    if (input.system_standard_id) records = records.filter(r => r.system_standard_id === input.system_standard_id);
    if (input.system_standard_version_id) {
      const version = rawData.versions.find(v => v.key === input.system_standard_version_id);
      if (version) {
        records = records.filter((p) => {
          const principle = rawData.principles.find(pr => pr.key === p.id);
          return principle?.versions?.includes(version.key);
        });
      }
    }
    if (input.search) records = applySearch(records, 'name', input.search);
    return paginate(records, input);
  }

  static async findGuidelines(input = {}, opt = {}) {
    let records = rawData.guidelines.map(g => ({
      id: g.key,
      name: g.name,
      description: g.description,
      system_standard_id: g.standard,
      system_standard_principle_id: g.principle
    }));
    if (input.id) records = records.filter(r => r.id === input.id);
    if (input.system_standard_id) records = records.filter(r => r.system_standard_id === input.system_standard_id);
    if (input.system_standard_principle_id) records = records.filter(r => r.system_standard_principle_id === input.system_standard_principle_id);
    if (input.system_standard_version_id) {
      const versionKey = input.system_standard_version_id;
      records = records.filter((g) => {
        const raw = rawData.guidelines.find(rg => rg.key === g.id);
        return raw?.versions?.includes(versionKey);
      });
    }
    if (input.search) records = applySearch(records, 'name', input.search);
    return paginate(records, input);
  }

  static async findCriteria(input = {}, opt = {}) {
    let records = rawData.criteria.map(c => ({
      id: c.key,
      name: c.name,
      description: c.description,
      level: c.level,
      system_standard_id: c.standard,
      system_standard_principle_id: c.principle,
      system_standard_guideline_id: c.guideline,
      help_url: c.helpUrl
    }));
    if (input.id) records = records.filter(r => r.id === input.id);
    if (input.system_standard_id) records = records.filter(r => r.system_standard_id === input.system_standard_id);
    if (input.system_standard_principle_id) records = records.filter(r => r.system_standard_principle_id === input.system_standard_principle_id);
    if (input.system_standard_guideline_id) records = records.filter(r => r.system_standard_guideline_id === input.system_standard_guideline_id);
    if (input.system_standard_version_id) {
      const versionKey = input.system_standard_version_id;
      records = records.filter((c) => {
        const raw = rawData.criteria.find(rc => rc.key === c.id);
        return raw?.versions?.includes(versionKey);
      });
    }
    if (input.search) records = applySearch(records, 'name', input.search);
    return paginate(records, input);
  }
}

// ── Audit types / chapters ──────────────────────────────────────────────────

export class AuditTypeService {
  static async findAuditTypes(input = {}, opt = {}) {
    let records = rawData.auditTypes.map(t => ({
      id: t.key,
      name: t.name,
      ...(opt.detailed
        ? {
            versions: (rawData.auditTypeVersions || [])
              .filter(v => v.audit_type === t.key)
              .map(v => ({ id: v.key, name: v.name }))
          }
        : {})
    }));
    if (input.search) records = applySearch(records, 'name', input.search);
    return paginate(records, input);
  }

  static async findAuditChapters(input = {}, opt = {}) {
    let records = (rawData.auditChapters || []).map(ch => ({
      id: ch.key,
      name: ch.name,
      audit_type_id: ch.audit_type,
      sections: (rawData.auditChapterSections || [])
        .filter(s => s.chapter === ch.key)
        .map(s => ({
          id: s.key,
          name: s.name,
          chapter_id: ch.key
        }))
    }));
    if (input.audit_type_id) records = records.filter(r => r.audit_type_id === input.audit_type_id);
    if (input.search) records = applySearch(records, 'name', input.search);
    return paginate(records, input);
  }
}

// ── Landmark ────────────────────────────────────────────────────────────────

export class LandmarkService {
  static async find(input = {}, opt = {}) {
    let records = rawData.landmarks.map(l => ({
      id: l.key,
      name: l.name,
      selectors: l.selectors
    }));
    if (input.id) {
      const found = records.find(r => r.id === input.id);
      return found || null;
    }
    if (input.search) records = applySearch(records, 'name', input.search);
    return paginate(records, input);
  }

  static async read(input = {}, opt = {}) {
    return rawData.landmarks.find(l => l.key === input.id) || null;
  }
}

// ── SystemCountry ───────────────────────────────────────────────────────────

export class SystemCountryService {
  static async find(input = {}, opt = {}) {
    let records = (rawData.countries || []).map(c => ({
      id: c.key,
      name: c.name,
      short_name: c.short_name,
      phone_prefix: c.phone_prefix
    }));
    if (input.id) {
      const found = records.find(r => r.id === input.id);
      return found || null;
    }
    if (input.search) records = applySearch(records, 'name', input.search);
    return paginate(records, input);
  }

  static async read(input = {}, opt = {}) {
    return (rawData.countries || []).find(c => c.key === input.id) || null;
  }
}

// ── AuditChapterSectionItems (for audit creation) ───────────────────────────

export function getAuditChapterSectionItems(chapterSectionIds) {
  const all = rawData.auditChapterSectionItems || [];
  return all.filter(i => chapterSectionIds.includes(i.section));
}

export function getAuditChapterSectionItemTypes() {
  return rawData.auditChapterSectionItemTypes || [];
}

export function getSystemData() {
  return rawData;
}
