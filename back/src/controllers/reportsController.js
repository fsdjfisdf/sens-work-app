// src/controllers/reportsController.js
const reportsDao = require('../dao/reportsDao');

// 주간 요약 조회(필요시 생성/캐시)
exports.getWeeklySummary = async (req, res) => {
  try {
    const { group = 'PEE1', site = 'PT', week, force = '0' } = req.query;
    const data = await reportsDao.getOrCreateWeeklySummary({
      group,
      site,
      weekStart: week,  // 'YYYY-MM-DD' (월요일) 미지정시 DAO에서 KST 기준 월요일 계산
      force: force === '1'
    });
    res.status(200).json(data);
  } catch (err) {
    console.error('[reportsController] error:', err);
    res.status(500).json({ error: err.message || 'weekly summary failed' });
  }
};
