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
    const { eqname } = req.params; // id 대신 eqname으로 받음
    const { info } = req.body;
    try {
        await signalDao.updateSignalData(eqname, info); // eqname을 전달
        res.status(200).send('Signal data updated');
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
