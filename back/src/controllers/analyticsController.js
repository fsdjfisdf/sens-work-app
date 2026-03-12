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
exports.getWorklogStats = async (req, res) => {
  try { res.json(await dao.getWorklogStats(getFilters(req.query))); }
  catch (e) { console.error(e); res.status(500).json({ error: '작업이력 통계 조회 오류' }); }
};
exports.getEngineerInfo = async (req, res) => {
  try {
    const n = req.query.name;
    if (!n) return res.json(null);
    res.json(await dao.getEngineerInfo(n));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: '엔지니어 상세 조회 오류' });
  }
};
exports.getExportData = async (req, res) => {
  try { res.json(await dao.getExportData(getFilters(req.query))); }
  catch (e) { console.error(e); res.status(500).json({ error: '내보내기 데이터 조회 오류' }); }
};
exports.getMPICoverage = async (req, res) => {
  try { res.json(await dao.getMPICoverage(getFilters(req.query))); }
  catch (e) { console.error(e); res.status(500).json({ error: 'MPI 커버리지 조회 오류' }); }
};

exports.addEngineer = async (req, res) => {
  try {
    const b = req.body || {};
    if (!b.name || !b.company || !b.group || !b.site) {
      return res.status(400).json({ error: '이름, 회사, 그룹, 사이트는 필수입니다.' });
    }
    const id = await dao.addEngineer(b);
    res.status(201).json({ message: '엔지니어 등록 완료', id });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: '엔지니어 등록 오류' });
  }
};

exports.updateEngineer = async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ error: 'id가 필요합니다.' });
    await dao.updateEngineer(id, req.body || {});
    res.json({ message: '엔지니어 수정 완료' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: '엔지니어 수정 오류' });
  }
};

exports.resignEngineer = async (req, res) => {
  try {
    const b = req.body || {};
    if (!b.id && !b.name) return res.status(400).json({ error: 'id 또는 name이 필요합니다.' });
    if (!b.resign_date) return res.status(400).json({ error: 'resign_date가 필요합니다.' });
    await dao.resignEngineer(b);
    res.json({ message: '퇴사 처리 완료' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: '퇴사 처리 오류' });
  }
};

exports.reinstateEngineer = async (req, res) => {
  try {
    const b = req.body || {};
    if (!b.name) return res.status(400).json({ error: 'name이 필요합니다.' });
    await dao.reinstateEngineer(b.name);
    res.json({ message: '복직 처리 완료' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: '복직 처리 오류' });
  }
};
