const signalDao = require('../dao/signalDao');


// 특정 장비의 INFO 가져오기
exports.getEquipmentInfo = async (req, res) => {
    const { eqName } = req.params;
    try {
        const equipment = await signalDao.getEquipmentByName(eqName);
        if (!equipment) {
            return res.status(404).json({ message: 'Equipment not found' });
        }
        res.status(200).json(equipment);
    } catch (error) {
        console.error(`Error fetching equipment info for ${eqName}:`, error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// 특정 장비의 INFO 수정
exports.updateEquipmentInfo = async (req, res) => {
    const { eqName } = req.params;
    const { INFO } = req.body;

    if (!INFO || typeof INFO !== 'string') {
        return res.status(400).json({ message: 'Invalid INFO value' });
    }

    try {
        const updated = await signalDao.updateEquipmentInfo(eqName, INFO);
        if (!updated) {
            return res.status(404).json({ message: 'Equipment not found or no changes made' });
        }
        res.status(200).json({ message: 'INFO updated successfully' });
    } catch (error) {
        console.error(`Error updating INFO for ${eqName}:`, error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
