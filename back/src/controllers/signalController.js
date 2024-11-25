const signalDao = require('../dao/signalDao');

exports.getSignalData = async (req, res) => {
    try {
        const data = await signalDao.getSignalData();
        const normalizedData = data.map(item => ({
            ...item,
            EQNAME: item.EQNAME.trim().toLowerCase(), // EQNAME 정리
        }));
        res.status(200).json(normalizedData);
    } catch (err) {
        console.error("Error retrieving equipment data:", err.message);
        res.status(500).json({ error: err.message });
    }
};

exports.updateSignalData = async (req, res) => {
    const eqName = req.params.eqName.trim().toLowerCase(); // URL에서 EQNAME 가져오기 및 정리
    const { info } = req.body;

    if (!eqName || !info) {
        return res.status(400).json({ error: 'EQNAME 또는 INFO가 누락되었습니다.' });
    }

    try {
        const result = await signalDao.updateSignalData(eqName, info); // EQNAME 기반 수정
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: '해당 EQNAME을 찾을 수 없습니다.' });
        }
        res.status(200).send('Signal data updated successfully');
    } catch (err) {
        console.error('Error updating signal data:', err.message);
        res.status(500).json({ error: err.message });
    }
};

