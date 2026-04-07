'use strict';

const pciDao = require('../dao/pciDao');

function normalizeDomain(v) {
  const value = String(v || 'SETUP').trim().toUpperCase();
  return value === 'MAINT' ? 'MAINT' : 'SETUP';
}

function normalizeDate(value, fallback) {
  const v = String(value || '').trim();
  if (!v) return fallback;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return fallback;
  return v;
}

function normalizeSourceWorkType(domain, value) {
  const v = String(value || '').trim().toUpperCase();
  if (domain === 'MAINT') return 'MAINT';
  if (['SETUP', 'RELOCATION', 'MERGED'].includes(v)) return v;
  return 'MERGED';
}

function shapeMatrixResult(raw) {
  const engineerMap = new Map();
  const itemMap = new Map();
  const cellMap = new Map();

  for (const row of raw.rows || []) {
    if (!engineerMap.has(row.engineer_id)) {
      engineerMap.set(row.engineer_id, {
        engineer_id: row.engineer_id,
        engineer_name: row.engineer_name,
        company: row.company,
        group: row.engineer_group,
        site: row.engineer_site,
      });
    }

    if (!itemMap.has(row.pci_item_id)) {
      itemMap.set(row.pci_item_id, {
        pci_item_id: row.pci_item_id,
        item_code: row.item_code,
        item_name: row.item_name,
        item_name_kr: row.item_name_kr,
        category: row.category,
        required_count: Number(row.required_count),
      });
    }

    cellMap.set(`${row.pci_item_id}:${row.engineer_id}`, {
      engineer_id: row.engineer_id,
      pci_item_id: row.pci_item_id,
      self_completed: !!row.self_completed,
      self_score: Number(row.self_score),
      main_count: Number(row.main_count),
      support_count: Number(row.support_count),
      converted_count: Number(row.converted_count),
      event_count: Number(row.event_count),
      history_score: Number(row.history_score),
      pci_score: Number(row.pci_score),
    });
  }

  return {
    engineers: [...engineerMap.values()],
    items: [...itemMap.values()],
    cells: [...cellMap.values()],
    meta: {
      source_work_type: raw.sourceWorkType,
    },
  };
}

async function getMatrix(params) {
  const pciDomain = normalizeDomain(params.pciDomain || params.domain);
  const dateFrom = normalizeDate(params.dateFrom || params.date_from, '2025-01-01');
  const dateTo = normalizeDate(params.dateTo || params.date_to, new Date().toISOString().slice(0, 10));
  const sourceWorkType = normalizeSourceWorkType(pciDomain, params.sourceWorkType || params.source_work_type);

  if (!params.equipmentGroupCode && !params.equipment_group) {
    const err = new Error('equipment_group 값이 필요합니다.');
    err.statusCode = 400;
    throw err;
  }

  const raw = await pciDao.getMatrix({
    equipmentGroupCode: params.equipmentGroupCode || params.equipment_group,
    pciDomain,
    engineerGroup: params.engineerGroup || params.group || '',
    site: params.site || '',
    keyword: params.keyword || '',
    dateFrom,
    dateTo,
    sourceWorkType,
  });

  return {
    ...shapeMatrixResult(raw),
    filters: {
      equipment_group: params.equipmentGroupCode || params.equipment_group,
      pci_domain: pciDomain,
      engineer_group: params.engineerGroup || params.group || '',
      site: params.site || '',
      keyword: params.keyword || '',
      date_from: dateFrom,
      date_to: dateTo,
      source_work_type: raw.sourceWorkType,
    },
  };
}

async function getCellDetail(params) {
  const dateFrom = normalizeDate(params.dateFrom || params.date_from, '2025-01-01');
  const dateTo = normalizeDate(params.dateTo || params.date_to, new Date().toISOString().slice(0, 10));
  const engineerId = Number(params.engineerId || params.engineer_id);
  const pciItemId = Number(params.pciItemId || params.pci_item_id);

  if (!engineerId || !pciItemId) {
    const err = new Error('engineer_id 와 pci_item_id 가 필요합니다.');
    err.statusCode = 400;
    throw err;
  }

  const raw = await pciDao.getCellDetail({
    engineerId,
    pciItemId,
    dateFrom,
    dateTo,
    sourceWorkType: String(params.sourceWorkType || params.source_work_type || '').toUpperCase(),
  });

  const summary = raw.summary || {};
  const requiredCount = Number(summary.required_count || 0);
  const convertedCount = Number(summary.converted_count || 0);
  const historyRatio = requiredCount > 0 ? Math.min(convertedCount / requiredCount, 1) : 0;
  const historyScore = Number((historyRatio * Number(summary.history_max_score || 80)).toFixed(2));
  const selfScore = Number(summary.self_score || 0);
  const pciScore = Number(Math.min(selfScore + historyScore, 100).toFixed(2));

  return {
    engineer: raw.engineer,
    item: raw.item,
    summary: {
      ...summary,
      main_count: Number(summary.main_count || 0),
      support_count: Number(summary.support_count || 0),
      converted_count: convertedCount,
      event_count: Number(summary.event_count || 0),
      self_score: selfScore,
      self_completed: !!summary.self_completed,
      history_ratio: Number(historyRatio.toFixed(4)),
      history_score: historyScore,
      pci_score: pciScore,
    },
    self_questions: raw.self_questions || [],
    events: raw.events || [],
    filters: {
      date_from: dateFrom,
      date_to: dateTo,
      source_work_type: raw.source_work_type,
    },
  };
}

async function getEngineerDetail(params) {
  const pciDomain = normalizeDomain(params.pciDomain || params.domain);
  const dateFrom = normalizeDate(params.dateFrom || params.date_from, '2025-01-01');
  const dateTo = normalizeDate(params.dateTo || params.date_to, new Date().toISOString().slice(0, 10));
  const engineerId = Number(params.engineerId || params.engineer_id);

  if (!engineerId) {
    const err = new Error('engineer_id 가 필요합니다.');
    err.statusCode = 400;
    throw err;
  }

  const raw = await pciDao.getEngineerDetail({
    engineerId,
    equipmentGroupCode: params.equipmentGroupCode || params.equipment_group,
    pciDomain,
    dateFrom,
    dateTo,
    sourceWorkType: normalizeSourceWorkType(pciDomain, params.sourceWorkType || params.source_work_type),
  });

  return {
    engineer: raw.engineer,
    rows: raw.rows || [],
    filters: {
      equipment_group: params.equipmentGroupCode || params.equipment_group,
      pci_domain: pciDomain,
      date_from: dateFrom,
      date_to: dateTo,
      source_work_type: raw.sourceWorkType,
    },
  };
}

async function getFilterOptions() {
  return await pciDao.getFilterOptions();
}

async function getAdminItems(params) {
  return await pciDao.getAdminItems({
    equipmentGroupCode: params.equipmentGroupCode || params.equipment_group || '',
    pciDomain: String(params.pciDomain || params.domain || '').toUpperCase(),
    keyword: params.keyword || '',
  });
}

async function updatePciItem({ userIdx, pciItemId, body }) {
  const requiredCount = Number(body.required_count);
  const selfWeight = Number(body.self_weight ?? 20);
  const mainWeight = Number(body.main_weight ?? 1);
  const supportWeight = Number(body.support_weight ?? 0.1);
  const historyMaxScore = Number(body.history_max_score ?? 80);
  const sortOrder = Number(body.sort_order ?? 999);

  if (!Number.isFinite(requiredCount) || requiredCount <= 0) {
    const err = new Error('required_count 는 0보다 커야 합니다.');
    err.statusCode = 400;
    throw err;
  }

  return await pciDao.updatePciItem({
    userIdx,
    pciItemId: Number(pciItemId),
    requiredCount,
    selfWeight,
    mainWeight,
    supportWeight,
    historyMaxScore,
    sortOrder,
    isActive: body.is_active !== false && body.is_active !== 0,
    descriptionText: body.description_text || null,
  });
}

async function rebuildRange({ userIdx, body }) {
  const dateFrom = normalizeDate(body.date_from, '2025-01-01');
  const dateTo = normalizeDate(body.date_to, new Date().toISOString().slice(0, 10));
  return await pciDao.rebuildRange({ userIdx, dateFrom, dateTo });
}

module.exports = {
  getFilterOptions,
  getMatrix,
  getCellDetail,
  getEngineerDetail,
  getAdminItems,
  updatePciItem,
  rebuildRange,
};
