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
    const eqName = req.params.eqName; // URL에서 EQNAME 가져오기
    const { info } = req.body;

    try {
        await signalDao.updateSignalData(eqName, info); // EQNAME 기반 수정
        res.status(200).send('Signal data updated');
    } catch (err) {
        console.error('Error updating signal data:', err.message);
        res.status(500).json({ error: err.message });
    }
};
