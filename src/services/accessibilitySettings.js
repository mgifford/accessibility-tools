import db, { nowIso } from './db/index';

class AccessibilitySettingsService {
  static async read() {
    let settings = await db.accessibilitySettings.get(1);
    if (!settings) {
      settings = { id: 1, profile: null, adjustments: [] };
      await db.accessibilitySettings.put(settings);
    }
    return settings;
  }

  static async update(input = {}) {
    const { actionType, payload } = input;
    let settings = await this.read();
    if (actionType === 'PROFILE') {
      settings.profile = settings.profile === payload.profile ? null : payload.profile;
    }
    if (actionType === 'ADJUSTMENT') {
      let adjustments = Array.isArray(settings.adjustments) ? [...settings.adjustments] : [];
      const foundProp = adjustments.find(a => a.prop === payload.prop);
      if (foundProp) {
        if (payload.params) {
          foundProp.params = payload.params;
        } else {
          adjustments = adjustments.filter(a => a.prop !== payload.prop);
        }
      } else {
        adjustments.push(payload);
      }
      settings.adjustments = adjustments;
    }
    await db.accessibilitySettings.put(settings);
    return settings;
  }

  static async reset(input = {}) {
    const { actionType, items = [] } = input;
    let settings = await this.read();
    if (actionType === 'PROFILE') {
      settings.profile = null;
    }
    if (actionType === 'ADJUSTMENT') {
      if (items.length > 0) {
        settings.adjustments = (settings.adjustments || []).filter(a => !items.includes(a.prop));
      } else {
        settings.adjustments = [];
      }
    }
    await db.accessibilitySettings.put(settings);
    return settings;
  }
}

export default AccessibilitySettingsService;
