const reportsDao = require('../dao/reportsDao');

exports.getWeeklySummary = async (req, res) => {
  try {
    const { group = 'PEE1', site = 'PT', week, force = '0' } = req.query;
    const data = await reportsDao.getOrCreateWeeklySummary({
      group, site, weekStart: week, force: force === '1'
    });
    res.status(200).json(data);
  } catch (err) {
    console.error('[reportsController] error:', err);
    res.status(500).json({ error: err.message || 'weekly summary failed' });
  }
};
