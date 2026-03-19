'use strict';

const checklistDao = require('../dao/checklistDao');

function getPayloadByPath(body, bodyPath) {
  if (!bodyPath) return body || {};
  return String(bodyPath)
    .split('.')
    .filter(Boolean)
    .reduce((acc, key) => (acc && acc[key] != null ? acc[key] : undefined), body) || {};
}

function flattenLegacyChecklist(data) {
  const row = {
    name: data?.engineer?.name || data?.engineer?.user?.nickname || null,
  };

  for (const section of data?.sections || []) {
    for (const question of section.questions || []) {
      row[question.question_code] = question.is_checked ? 100 : 0;
    }
  }

  return row;
}

function normalizeLegacyAnswers(templateSections, payload) {
  const answers = [];
  for (const section of templateSections || []) {
    for (const question of section.questions || []) {
      const raw = payload?.[question.question_code];
      const isChecked = raw === true || raw === 1 || raw === '1' || raw === 100 || raw === '100' || Number(raw) >= 100;
      answers.push({
        question_code: question.question_code,
        is_checked: isChecked,
      });
    }
  }
  return answers;
}

function handleError(res, err, fallbackMessage) {
  console.error(fallbackMessage, err);
  const code = Number(err?.statusCode) || 500;
  return res.status(code).json({ error: err?.message || fallbackMessage });
}

exports.createGetHandler = (mapping) => async (req, res) => {
  try {
    const data = await checklistDao.getMyChecklist({
      userIdx: req.user?.userIdx,
      equipmentGroupCode: mapping.equipmentGroupCode,
      checklistKind: mapping.checklistKind,
    });

    return res.json(flattenLegacyChecklist(data));
  } catch (err) {
    return handleError(res, err, `레거시 체크리스트 조회 오류: ${mapping.key}`);
  }
};

exports.createSaveHandler = (mapping) => async (req, res) => {
  try {
    const template = await checklistDao.getTemplate({
      userIdx: req.user?.userIdx,
      equipmentGroupCode: mapping.equipmentGroupCode,
      checklistKind: mapping.checklistKind,
    });

    const payload = getPayloadByPath(req.body, mapping.bodyPath);
    const answers = normalizeLegacyAnswers(template.sections, payload);

    const saved = await checklistDao.saveMyChecklist({
      userIdx: req.user?.userIdx,
      equipmentGroupCode: mapping.equipmentGroupCode,
      checklistKind: mapping.checklistKind,
      responseStatus: mapping.responseStatus || 'ACTIVE',
      answers,
    });

    return res.status(201).json({
      message: mapping.responseStatus === 'SUBMITTED'
        ? 'Checklist approval request saved successfully'
        : 'Checklist saved successfully',
      checklist: flattenLegacyChecklist(saved),
    });
  } catch (err) {
    return handleError(res, err, `레거시 체크리스트 저장 오류: ${mapping.key}`);
  }
};
