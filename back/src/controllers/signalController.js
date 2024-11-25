const signalDao = require('../dao/signalDao');

exports.getSignalData = async (req, res) => {
    try {
        const data = await signalDao.getSignalData();
        res.status(200).json(data);
    } catch (err) {
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
