'use strict';

const pciService = require('../services/pciService');

function extractUserIdx(req) {
  return req.user?.userIdx || req.user?.user_idx || req.auth?.userIdx || req.userIdx || null;
}

async function buildExportWorkbook(data) {
  let ExcelJS;
  try {
    ExcelJS = require('exceljs');
  } catch (err) {
    const e = new Error('엑셀 추출을 위해 exceljs 패키지가 필요합니다. back 폴더에서 npm install exceljs 를 실행하세요.');
    e.statusCode = 500;
    throw e;
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'OpenAI';
  workbook.created = new Date();

  const matrixSheet = workbook.addWorksheet('PCI Matrix');
  const summarySheet = workbook.addWorksheet('Summary');

  const engineers = data.engineers || [];
  const items = data.items || [];
  const cells = new Map((data.cells || []).map((row) => [`${row.pci_item_id}:${row.engineer_id}`, row]));
  const avgMap = new Map((data.engineer_averages || []).map((row) => [row.engineer_id, row.avg_pci]));

  summarySheet.columns = [
    { header: '항목', key: 'label', width: 24 },
    { header: '값', key: 'value', width: 36 },
  ];
  const filters = data.filters || {};
  summarySheet.addRows([
    { label: '설비군', value: filters.equipment_group || '' },
    { label: '도메인', value: filters.pci_domain || '' },
    { label: '그룹', value: filters.engineer_group || '' },
    { label: '사이트', value: filters.site || '' },
    { label: '검색어', value: filters.keyword || '' },
    { label: '기간 시작', value: filters.date_from || '' },
    { label: '기간 종료', value: filters.date_to || '' },
    { label: '원본 작업 타입', value: filters.source_work_type || '' },
    { label: '엔지니어 수', value: Number(data.summary?.engineer_count || 0) },
    { label: '항목 수', value: Number(data.summary?.item_count || 0) },
    { label: '전체 평균 PCI', value: Number(data.summary?.avg_pci || 0) },
  ]);

  const headerRow1 = ['카테고리', '작업 항목', '영문명', '기준 횟수'];
  const headerRow2 = ['', '', '', ''];
  engineers.forEach((eng) => {
    headerRow1.push(eng.engineer_name);
    headerRow2.push(`평균 ${Number(avgMap.get(eng.engineer_id) || 0).toFixed(1)}%`);
  });

  matrixSheet.addRow(headerRow1);
  matrixSheet.addRow(headerRow2);

  items.forEach((item) => {
    const row = [
      item.category || '-',
      item.item_name_kr || item.item_name || item.item_code,
      item.item_name || item.item_code,
      Number(item.required_count || 0),
    ];
    engineers.forEach((eng) => {
      const cell = cells.get(`${item.pci_item_id}:${eng.engineer_id}`);
      row.push(Number(cell?.pci_score || 0));
    });
    matrixSheet.addRow(row);
  });

  return workbook;
}

exports.getFilterOptions = async (req, res, next) => {
  try {
    const data = await pciService.getFilterOptions();
    res.json({ isSuccess: true, data });
  } catch (err) {
    next(err);
  }
};

exports.getMatrix = async (req, res, next) => {
  try {
    const data = await pciService.getMatrix(req.query);
    res.json({ isSuccess: true, data });
  } catch (err) {
    next(err);
  }
};

exports.exportMatrix = async (req, res, next) => {
  try {
    const data = await pciService.getMatrix(req.query);
    const workbook = await buildExportWorkbook(data);
    const filename = `pci_matrix_${(req.query.equipment_group || 'ALL')}_${new Date().toISOString().slice(0,10)}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    next(err);
  }
};

exports.getCellDetail = async (req, res, next) => {
  try {
    const data = await pciService.getCellDetail(req.query);
    res.json({ isSuccess: true, data });
  } catch (err) {
    next(err);
  }
};

exports.getEngineerDetail = async (req, res, next) => {
  try {
    const data = await pciService.getEngineerDetail({ ...req.query, engineer_id: req.params.engineerId });
    res.json({ isSuccess: true, data });
  } catch (err) {
    next(err);
  }
};

exports.getAdminItems = async (req, res, next) => {
  try {
    const data = await pciService.getAdminItems({ userIdx: extractUserIdx(req), params: req.query });
    res.json({ isSuccess: true, data });
  } catch (err) {
    next(err);
  }
};

exports.updatePciItem = async (req, res, next) => {
  try {
    const data = await pciService.updatePciItem({
      userIdx: extractUserIdx(req),
      pciItemId: req.params.pciItemId,
      body: req.body || {},
    });
    res.json({ isSuccess: true, data });
  } catch (err) {
    next(err);
  }
};

exports.rebuildRange = async (req, res, next) => {
  try {
    const data = await pciService.rebuildRange({ userIdx: extractUserIdx(req), body: req.body || {} });
    res.json({ isSuccess: true, data });
  } catch (err) {
    next(err);
  }
};

exports.getManualCredits = async (req, res, next) => {
  try {
    const data = await pciService.getManualCredits({ userIdx: extractUserIdx(req), params: req.query });
    res.json({ isSuccess: true, data });
  } catch (err) {
    next(err);
  }
};

exports.createManualCredit = async (req, res, next) => {
  try {
    const data = await pciService.saveManualCredit({ userIdx: extractUserIdx(req), body: req.body || {} });
    res.json({ isSuccess: true, data });
  } catch (err) {
    next(err);
  }
};

exports.updateManualCredit = async (req, res, next) => {
  try {
    const data = await pciService.saveManualCredit({ userIdx: extractUserIdx(req), manualCreditId: req.params.id, body: req.body || {} });
    res.json({ isSuccess: true, data });
  } catch (err) {
    next(err);
  }
};

exports.deleteManualCredit = async (req, res, next) => {
  try {
    const data = await pciService.deleteManualCredit({ userIdx: extractUserIdx(req), manualCreditId: req.params.id });
    res.json({ isSuccess: true, data });
  } catch (err) {
    next(err);
  }
};


exports.syncCapabilityScore = async (req, res, next) => {
  try {
    const data = await pciService.syncCapabilityScore({ userIdx: extractUserIdx(req), body: req.body || {} });
    res.json({ isSuccess: true, data });
  } catch (err) {
    next(err);
  }
};

exports.syncMonthlyCapability = async (req, res, next) => {
  try {
    const data = await pciService.syncMonthlyCapability({ userIdx: extractUserIdx(req), body: req.body || {} });
    res.json({ isSuccess: true, data });
  } catch (err) {
    next(err);
  }
};
