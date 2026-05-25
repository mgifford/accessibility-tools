import db, { newId, nowIso } from './db/index';
import { applyPaginate, applySearch } from './core';

class ProfileService {
  static async find(input = {}, opt = {}) {
    if (input.id) return this.read({ id: input.id });
    let records = await db.profiles.toArray();
    if (input.search) {
      const q = input.search.toLowerCase();
      records = records.filter(r =>
        (r.first_name || '').toLowerCase().includes(q)
        || (r.last_name || '').toLowerCase().includes(q)
        || (r.title || '').toLowerCase().includes(q)
      );
    }
    if (opt.detailed) {
      records = await Promise.all(records.map(_enrichProfile));
    }
    return applyPaginate(records, input);
  }

  static async read(input = {}) {
    const profile = await db.profiles.get(input.id);
    if (!profile) return null;
    return _enrichProfile(profile);
  }

  static async create(input = {}) {
    const id = newId();
    const record = {
      id,
      first_name: input.first_name,
      last_name: input.last_name,
      title: input.title,
      image: input.image || null,
      created_at: nowIso(),
      updated_at: nowIso()
    };
    await db.profiles.add(record);
    if (input.organization && Object.keys(input.organization).length > 0) {
      await db.profileOrganizations.add({
        id: newId(),
        profile_id: id,
        ...input.organization,
        state_id: input.organization.state || null,
        country_id: input.organization.country || null
      });
    }
    return this.read({ id });
  }

  static async update(input = {}) {
    const profile = await db.profiles.get(input.id);
    if (!profile) throw new Error('Profile not found');
    const updates = { updated_at: nowIso() };
    if (input.first_name !== undefined) updates.first_name = input.first_name;
    if (input.last_name !== undefined) updates.last_name = input.last_name;
    if (input.title !== undefined) updates.title = input.title;
    if (input.image !== undefined) updates.image = input.image;
    await db.profiles.update(input.id, updates);

    if (input.organization !== undefined) {
      const existingOrg = await db.profileOrganizations.where('profile_id').equals(input.id).first();
      if (input.organization && Object.keys(input.organization).length > 0) {
        const orgData = {
          ...input.organization,
          profile_id: input.id,
          state_id: input.organization.state || null,
          country_id: input.organization.country || null
        };
        delete orgData.state;
        delete orgData.country;
        if (existingOrg) {
          await db.profileOrganizations.update(existingOrg.id, orgData);
        } else {
          await db.profileOrganizations.add({ id: newId(), ...orgData });
        }
      } else if (existingOrg) {
        await db.profileOrganizations.delete(existingOrg.id);
      }
    }
    return this.read({ id: input.id });
  }

  static async delete(input = {}) {
    await db.profileOrganizations.where('profile_id').equals(input.id).delete();
    await db.profiles.delete(input.id);
    return { success: true };
  }
}

async function _enrichProfile(profile) {
  if (!profile) return null;
  const org = await db.profileOrganizations.where('profile_id').equals(profile.id).first();
  return { ...profile, organization: org || null };
}

export default ProfileService;
