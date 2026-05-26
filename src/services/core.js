/**
 * Pagination helpers that mirror the behavior of src/electron/lib/core.js
 * but work entirely in browser-side memory (no Sequelize).
 */

export function applyPaginate(records, data = {}) {
  const { limit, page } = data;
  if (limit === 'off' || limit === false) {
    return { result: records };
  }
  if (typeof limit === 'undefined' && typeof page === 'undefined') {
    return records;
  }
  const res = { result: records, meta: {} };
  if (limit && page) {
    const offset = (page - 1) * limit;
    res.result = records.slice(offset, offset + limit + 1);
    res.meta.current_page = page;
    if (res.result.length > limit) {
      res.result.pop();
      res.meta.next_page = page + 1;
    }
  }
  if (page > 1) res.meta.prev_page = page - 1;
  return res;
}

export function applySearch(records, field, search) {
  if (!search) return records;
  const q = search.toLowerCase();
  return records.filter(r => (r[field] || '').toLowerCase().includes(q));
}
