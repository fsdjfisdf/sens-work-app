/**
 * analyticsController.js — 분석 대시보드 API
 */
'use strict';
const dao = require('../dao/analyticsDao');

function getFilters(q) {
  return { company: q.company || '', group: q.group || '', site: q.site || '', name: q.name || '' };
}

exports.getFilters = async (req, res) => {
  try { res.json(await dao.getFilterOptions()); }
  catch (e) { console.error(e); res.status(500).json({ error: '필터 옵션 조회 오류' }); }
};

exports.getHeadCount = async (req, res) => {
  try { res.json(await dao.getHeadCount(getFilters(req.query))); }
  catch (e) { console.error(e); res.status(500).json({ error: 'Head Count 조회 오류' }); }
};

exports.getHRDistribution = async (req, res) => {
  try { res.json(await dao.getHRDistribution(getFilters(req.query))); }
  catch (e) { console.error(e); res.status(500).json({ error: 'HR 분포 조회 오류' }); }
};

exports.getLevelDistribution = async (req, res) => {
  try { res.json(await dao.getLevelDistribution(getFilters(req.query))); }
  catch (e) { console.error(e); res.status(500).json({ error: '레벨 분포 조회 오류' }); }
};

exports.getLevelAchievement = async (req, res) => {
  try { res.json(await dao.getLevelAchievement(getFilters(req.query))); }
  catch (e) { console.error(e); res.status(500).json({ error: '레벨 취득 기간 조회 오류' }); }
};

exports.getLevelTrend = async (req, res) => {
  try { res.json(await dao.getLevelTrend(getFilters(req.query))); }
  catch (e) { console.error(e); res.status(500).json({ error: '레벨 트렌드 조회 오류' }); }
};

exports.getCapability = async (req, res) => {
  try { res.json(await dao.getCapability(getFilters(req.query))); }
  catch (e) { console.error(e); res.status(500).json({ error: '역량 조회 오류' }); }
};

exports.getEqCapability = async (req, res) => {
  try { res.json(await dao.getEqCapability(getFilters(req.query))); }
  catch (e) { console.error(e); res.status(500).json({ error: '설비별 역량 조회 오류' }); }
};

exports.getMPI = async (req, res) => {
  try { res.json(await dao.getMPI(getFilters(req.query))); }
  catch (e) { console.error(e); res.status(500).json({ error: 'MPI 조회 오류' }); }
};

exports.getWorklogStats = async (req, res) => {
  try { res.json(await dao.getWorklogStats(getFilters(req.query))); }
  catch (e) { console.error(e); res.status(500).json({ error: '작업이력 통계 조회 오류' }); }
};

exports.getEngineerInfo = async (req, res) => {
  try {
    const name = req.query.name;
    if (!name) return res.json(null);
    res.json(await dao.getEngineerInfo(name));
  } catch (e) { console.error(e); res.status(500).json({ error: '엔지니어 상세 조회 오류' }); }
};

exports.getExportData = async (req, res) => {
  try { res.json(await dao.getExportData(getFilters(req.query))); }
  catch (e) { console.error(e); res.status(500).json({ error: '내보내기 데이터 조회 오류' }); }
};
