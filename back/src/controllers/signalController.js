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
    const { id } = req.params;
    const { info } = req.body;
    try {
        await signalDao.updateSignalData(id, info);
        res.status(200).send('Signal data updated');
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
