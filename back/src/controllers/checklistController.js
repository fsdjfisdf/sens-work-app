'use strict';

const checklistDao = require('../dao/checklistDao');

function normalizeEquipmentGroup(v) {
  return String(v || '').trim().toUpperCase();
}

function normalizeKind(v) {
  return String(v || '').trim().toUpperCase();
}

function normalizeAnswers(items) {
  if (!Array.isArray(items)) return [];
  return items.map((item) => ({
    question_id: item.question_id ? Number(item.question_id) : null,
    question_code: item.question_code ? String(item.question_code).trim() : '',
    is_checked: !!item.is_checked,
    note: item.note == null ? null : String(item.note).trim(),
  }));
}

function handleError(res, err, fallbackMessage) {
  console.error(fallbackMessage, err);
  const code = Number(err?.statusCode) || 500;
  return res.status(code).json({ error: err?.message || fallbackMessage });
}

exports.getMe = async (req, res) => {
  try {
    const data = await checklistDao.getCurrentUserProfile(req.user?.userIdx);
    if (!data) return res.status(401).json({ error: '인증 사용자 정보를 찾을 수 없습니다.' });
    return res.json(data);
  } catch (err) {
    return handleError(res, err, '체크리스트 사용자 조회 오류');
  }
};

exports.getAvailable = async (req, res) => {
  try {
    const data = await checklistDao.getAvailableTemplatesForUser(req.user?.userIdx);
    return res.json(data);
  } catch (err) {
    return handleError(res, err, '체크리스트 접근 목록 조회 오류');
  }
};

exports.getTemplate = async (req, res) => {
  try {
    const equipmentGroupCode = normalizeEquipmentGroup(req.query.equipment_group || req.query.equipmentGroup);
    const checklistKind = normalizeKind(req.query.kind);
    if (!equipmentGroupCode) return res.status(400).json({ error: 'equipment_group is required' });
    if (!['SETUP', 'MAINT'].includes(checklistKind)) return res.status(400).json({ error: 'kind must be SETUP or MAINT' });

    const data = await checklistDao.getTemplate({
      userIdx: req.user?.userIdx,
      equipmentGroupCode,
      checklistKind,
    });
    return res.json(data);
  } catch (err) {
    return handleError(res, err, '체크리스트 템플릿 조회 오류');
  }
};

exports.getMyChecklist = async (req, res) => {
  try {
    const equipmentGroupCode = normalizeEquipmentGroup(req.query.equipment_group || req.query.equipmentGroup);
    const checklistKind = normalizeKind(req.query.kind);
    if (!equipmentGroupCode) return res.status(400).json({ error: 'equipment_group is required' });
    if (!['SETUP', 'MAINT'].includes(checklistKind)) return res.status(400).json({ error: 'kind must be SETUP or MAINT' });

    const data = await checklistDao.getMyChecklist({
      userIdx: req.user?.userIdx,
      equipmentGroupCode,
      checklistKind,
    });
    return res.json(data);
  } catch (err) {
    return handleError(res, err, '내 체크리스트 조회 오류');
  }
};

exports.saveMyChecklist = async (req, res) => {
  try {
    const equipmentGroupCode = normalizeEquipmentGroup(req.body?.equipment_group || req.body?.equipmentGroup);
    const checklistKind = normalizeKind(req.body?.kind);
    if (!equipmentGroupCode) return res.status(400).json({ error: 'equipment_group is required' });
    if (!['SETUP', 'MAINT'].includes(checklistKind)) return res.status(400).json({ error: 'kind must be SETUP or MAINT' });

    const answers = normalizeAnswers(req.body?.answers);
    const responseStatus = req.body?.response_status === 'SUBMITTED' ? 'SUBMITTED' : 'ACTIVE';

    const data = await checklistDao.saveMyChecklist({
      userIdx: req.user?.userIdx,
      equipmentGroupCode,
      checklistKind,
      responseStatus,
      answers,
    });
    return res.json({ message: responseStatus === 'SUBMITTED' ? '결재 요청 완료' : '체크리스트 저장 완료', ...data });
  } catch (err) {
    return handleError(res, err, '내 체크리스트 저장 오류');
  }
};

exports.syncCatalog = async (req, res) => {
  try {
    const result = await checklistDao.syncCatalog();
    return res.json({ message: '체크리스트 카탈로그 동기화 완료', ...result });
  } catch (err) {
    return handleError(res, err, '체크리스트 카탈로그 동기화 오류');
  }
};

exports.getEngineerAccess = async (req, res) => {
  try {
    const engineerId = Number(req.query.engineer_id || req.params.engineerId);
    if (!engineerId) return res.status(400).json({ error: 'engineer_id is required' });

    const data = await checklistDao.getEngineerAccess(engineerId);
    return res.json(data);
  } catch (err) {
    return handleError(res, err, '체크리스트 접근 권한 조회 오류');
  }
};

exports.upsertEngineerAccess = async (req, res) => {
  try {
    const engineerId = Number(req.body?.engineer_id);
    const equipmentGroupCode = normalizeEquipmentGroup(req.body?.equipment_group || req.body?.equipmentGroup);
    const accessType = String(req.body?.access_type || '').trim().toUpperCase();

    if (!engineerId) return res.status(400).json({ error: 'engineer_id is required' });
    if (!equipmentGroupCode) return res.status(400).json({ error: 'equipment_group is required' });
    if (!['ALLOW', 'DENY'].includes(accessType)) return res.status(400).json({ error: 'access_type must be ALLOW or DENY' });

    const data = await checklistDao.upsertEngineerAccessOverride({
      engineerId,
      equipmentGroupCode,
      accessType,
      reason: req.body?.reason == null ? null : String(req.body.reason).trim(),
      createdBy: req.user?.userIdx || null,
    });

    return res.json({ message: '체크리스트 접근 예외 저장 완료', ...data });
  } catch (err) {
    return handleError(res, err, '체크리스트 접근 예외 저장 오류');
  }
};

exports.deleteEngineerAccess = async (req, res) => {
  try {
    const engineerId = Number(req.params.engineerId);
    const equipmentGroupCode = normalizeEquipmentGroup(req.params.equipmentGroup);
    if (!engineerId) return res.status(400).json({ error: 'engineerId is required' });
    if (!equipmentGroupCode) return res.status(400).json({ error: 'equipmentGroup is required' });

    const data = await checklistDao.deleteEngineerAccessOverride({
      engineerId,
      equipmentGroupCode,
    });

    return res.json({ message: '체크리스트 접근 예외 삭제 완료', ...data });
  } catch (err) {
    return handleError(res, err, '체크리스트 접근 예외 삭제 오류');
  }
};

exports.getApprovalQueue = async (req, res) => {
  try {
    const data = await checklistDao.getApprovalQueue({
      userIdx: req.user?.userIdx,
      status: String(req.query.status || 'SUBMITTED').trim().toUpperCase(),
      equipmentGroupCode: normalizeEquipmentGroup(req.query.equipment_group || req.query.equipmentGroup),
      checklistKind: normalizeKind(req.query.kind),
      keyword: String(req.query.keyword || '').trim(),
    });
    return res.json(data);
  } catch (err) {
    return handleError(res, err, '체크리스트 결재 대기 목록 조회 오류');
  }
};

exports.getApprovalRequestDetail = async (req, res) => {
  try {
    const responseId = Number(req.params.responseId);
    if (!responseId) return res.status(400).json({ error: 'responseId is required' });

    const data = await checklistDao.getApprovalRequestDetail({
      userIdx: req.user?.userIdx,
      responseId,
    });
    return res.json(data);
  } catch (err) {
    return handleError(res, err, '체크리스트 결재 상세 조회 오류');
  }
};

exports.decideApprovalRequest = async (req, res) => {
  try {
    const responseId = Number(req.params.responseId);
    const decision = String(req.body?.decision || '').trim().toUpperCase();
    const comment = req.body?.comment == null ? null : String(req.body.comment).trim();

    if (!responseId) return res.status(400).json({ error: 'responseId is required' });
    if (!['APPROVED', 'REJECTED'].includes(decision)) {
      return res.status(400).json({ error: 'decision must be APPROVED or REJECTED' });
    }

    const data = await checklistDao.decideApprovalRequest({
      userIdx: req.user?.userIdx,
      responseId,
      decision,
      comment,
    });

    return res.json({
      message: decision === 'APPROVED' ? '체크리스트 승인 완료' : '체크리스트 반려 완료',
      ...data,
    });
  } catch (err) {
    return handleError(res, err, '체크리스트 결재 처리 오류');
  }
};
