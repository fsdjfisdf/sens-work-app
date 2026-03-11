/**
 * analyticsController.js — v3
 */
'use strict';
const dao = require('../dao/analyticsDao');

function getFilters(q) {
  return {
    company: q.company || '',
    group: q.group || '',
    site: q.site || '',
    name: q.name || ''
  };
}

exports.getFilters = async (req, res) => {
  try { res.json(await dao.getFilterOptions()); }
  catch (e) { console.error(e); res.status(500).json({ error: '필터 옵션 조회 오류' }); }
};
exports.getHeadCount = async (req, res) => {
  try { res.json(await dao.getHeadCount(getFilters(req.query))); }
  catch (e) { console.error(e); res.status(500).json({ error: 'HeadCount 조회 오류' }); }
};
exports.getHRDistribution = async (req, res) => {
  try { res.json(await dao.getHRDistribution(getFilters(req.query))); }
  catch (e) { console.error(e); res.status(500).json({ error: 'HR Distribution 조회 오류' }); }
};
exports.getLevelDistribution = async (req, res) => {
  try { res.json(await dao.getLevelDistribution(getFilters(req.query))); }
  catch (e) { console.error(e); res.status(500).json({ error: 'Level Distribution 조회 오류' }); }
};
exports.getLevelAchievement = async (req, res) => {
  try { res.json(await dao.getLevelAchievement(getFilters(req.query))); }
  catch (e) { console.error(e); res.status(500).json({ error: 'Level Achievement 조회 오류' }); }
};
exports.getLevelTrend = async (req, res) => {
  try { res.json(await dao.getLevelTrend(getFilters(req.query))); }
  catch (e) { console.error(e); res.status(500).json({ error: 'Level Trend 조회 오류' }); }
};
exports.getCapability = async (req, res) => {
  try { res.json(await dao.getCapability(getFilters(req.query))); }
  catch (e) { console.error(e); res.status(500).json({ error: 'Capability 조회 오류' }); }
};
exports.getEqCapability = async (req, res) => {
  try { res.json(await dao.getEqCapability(getFilters(req.query))); }
  catch (e) { console.error(e); res.status(500).json({ error: 'EQ Capability 조회 오류' }); }
};
exports.getWorklogStats = async (req, res) => {
  try { res.json(await dao.getWorklogStats(getFilters(req.query))); }
  catch (e) { console.error(e); res.status(500).json({ error: 'Worklog stats 조회 오류' }); }
};
exports.getEngineerInfo = async (req, res) => {
  try { res.json(await dao.getEngineerInfo(getFilters(req.query))); }
  catch (e) { console.error(e); res.status(500).json({ error: 'Engineer info 조회 오류' }); }
};
exports.getMPICoverage = async (req, res) => {
  try { res.json(await dao.getMPICoverage(getFilters(req.query))); }
  catch (e) { console.error(e); res.status(500).json({ error: 'MPI coverage 조회 오류' }); }
};
exports.getExportData = async (req, res) => {
  try { res.json(await dao.getExportData(getFilters(req.query))); }
  catch (e) { console.error(e); res.status(500).json({ error: 'Export data 조회 오류' }); }
};

exports.getMyDashboard = async (req, res) => {
  try {
    const idt = req.verifiedToken || req.decodedToken || req.decoded || req.user || req.auth || {};
    res.json(await dao.getMyDashboard(idt));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message || '내 대시보드 조회 오류' });
  }
};

exports.addEngineer = async (req, res) => {
  try {
    if (!req.body?.name) return res.status(400).json({ error: 'name은 필수입니다.' });
    res.status(201).json(await dao.addEngineer(req.body));
  } catch (e) { console.error(e); res.status(500).json({ error: e.message || 'engineer 추가 오류' }); }
};
exports.updateEngineer = async (req, res) => {
  try {
    res.json(await dao.updateEngineer(req.params.id, req.body || {}));
  } catch (e) { console.error(e); res.status(500).json({ error: e.message || 'engineer 수정 오류' }); }
};
exports.resignEngineer = async (req, res) => {
  try {
    const { engineer_id, resign_date, reason } = req.body || {};
    if (!engineer_id || !resign_date) return res.status(400).json({ error: 'engineer_id, resign_date는 필수입니다.' });
    res.json(await dao.resignEngineer({ engineer_id, resign_date, reason }));
  } catch (e) { console.error(e); res.status(500).json({ error: e.message || '퇴사 처리 오류' }); }
};
exports.reinstateEngineer = async (req, res) => {
  try {
    const { engineer_id } = req.body || {};
    if (!engineer_id) return res.status(400).json({ error: 'engineer_id는 필수입니다.' });
    res.json(await dao.reinstateEngineer({ engineer_id }));
  } catch (e) { console.error(e); res.status(500).json({ error: e.message || '복직 처리 오류' }); }
};
