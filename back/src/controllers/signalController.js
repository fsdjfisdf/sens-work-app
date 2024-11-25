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
    const eqName = req.params.eqName.trim().toLowerCase(); // 소문자로 통일
    const { info } = req.body;

    try {
        await signalDao.updateSignalData(eqName, info);
        res.status(200).send('Signal data updated');
    } catch (err) {
        if (err.message.includes('No matching EQNAME')) {
            res.status(404).json({ error: `Equipment with EQNAME '${eqName}' not found.` });
        } else {
            console.error('Error updating signal data:', err.message);
            res.status(500).json({ error: err.message });
        }
    }
};
