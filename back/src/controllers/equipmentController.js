const equipmentDao = require('../dao/equipmentDao');

exports.getEquipment = async (req, res) => {
    try {
        const equipments = await equipmentDao.getEquipment();
        res.status(200).json(equipments);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
