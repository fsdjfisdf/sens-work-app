const paidDao = require('../dao/work_LogPaidDao');
const workLogDao = require('../dao/work_LogDao');

// POST /api/work-log-paid/pending/:pendingId
exports.savePaidRowsForPending = async (req, res) => {
  try {
    const pendingId = Number(req.params.pendingId);
    const rows = Array.isArray(req.body?.rows) ? req.body.rows : [];
    if (!pendingId) return res.status(400).json({ error: 'invalid pendingId' });
    if (!rows.length) return res.status(400).json({ error: 'rows required' });

    // 대기건 존재 확인 + 스냅샷용 데이터 읽기
    const p = await workLogDao.getPendingById(pendingId);
    if (!p) return res.status(404).json({ error: 'pending not found' });

    // 프론트 유효성은 있지만, 백엔드에서도 최소 검증
    const hhmm = v => /^\d{2}:\d{2}$/.test(v || '');
    for (const r of rows) {
      if (!r.paid_worker) return res.status(422).json({ error: '작업자 필수' });
      const need = ['line_start_time','line_end_time','inform_start_time','inform_end_time'];
      if (!need.every(k => hhmm(r[k])))
        return res.status(422).json({ error: '시간은 HH:MM 형식이어야 합니다.' });

      // 포함관계: line_start < inform_start < inform_end < line_end
      const toMin = v => { const [h,m]=v.split(':').map(Number); return h*60+m; };
      const ls=toMin(r.line_start_time), le=toMin(r.line_end_time),
            is=toMin(r.inform_start_time), ie=toMin(r.inform_end_time);
      if (!(ls < is && is < ie && ie < le))
        return res.status(422).json({ error: '라인/작업 시간의 순서를 확인하세요.' });
    }

    await paidDao.insertPaidRowsPending(pendingId, rows, {
      task_name: p.task_name,
      task_date: p.task_date,
      group: p.group, site: p.site, line: p.line,
      warranty: p.warranty, equipment_type: p.equipment_type, equipment_name: p.equipment_name,
      ems: p.ems
    });

    return res.status(201).json({ message: 'paid rows saved' });
  } catch (e) {
    console.error('[paid] save error:', e);
    return res.status(500).json({ error: 'internal error' });
  }
};

exports.searchPaidRows = async (req, res) => {
  try {
    const f = {
      date_from: req.query.date_from || null,
      date_to:   req.query.date_to   || null,
      group:     req.query.group     || '',
      site:      req.query.site      || '',
      worker:    req.query.worker    || '',
      line:      req.query.line      || '',
      equipment_type: req.query.equipment_type || '',
      equipment_name: req.query.equipment_name || '',
      ems: (req.query.ems === '0' || req.query.ems === '1') ? Number(req.query.ems) : null,
      limit: Math.min( Number(req.query.limit || 5000), 20000 )
    };
    const rows = await paidDao.searchPaidRows(f);
    return res.json(rows);
  } catch (e) {
    console.error('[work_log_paid.search] error', e);
    return res.status(500).json({ error: 'internal error' });
  }
};