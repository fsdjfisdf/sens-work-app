const setupeqDao = require("../dao/SetupeqDao");

// 설비 목록 가져오기
exports.getEquipmentList = async (req, res) => {
    try {
        const equipmentList = await setupeqDao.getAllEquipment();
        console.log("Fetched equipment list:", equipmentList); // 데이터 확인용
        res.status(200).json(equipmentList);
    } catch (error) {
        console.error("Error fetching equipment list:", error);
        res.status(500).json({ error: "Error fetching equipment list" });
    }
};

// 특정 설비의 SET UP 진행 상태 가져오기
exports.getEquipmentStatus = async (req, res) => {
    const { id } = req.params;
    try {
        const status = await setupeqDao.getEquipmentById(id);
        if (!status) {
            return res.status(404).json({ message: "Equipment not found" });
        }
        console.log(`Fetched status for equipment ID ${id}:`, status); // 데이터 확인용
        res.status(200).json(status);
    } catch (error) {
        console.error("Error fetching equipment status:", error);
        res.status(500).json({ error: "Error fetching equipment status" });
    }
};

// 특정 설비 작업 상태 업데이트
exports.updateEquipmentStatus = async (req, res) => {
    const { id } = req.params;
    const updates = req.body; // { INSTALLATION_PREPARATION_PERCENT, INSTALLATION_PREPARATION_COMPANY, ... }

    try {
        const result = await setupeqDao.updateEquipmentStatus(id, updates);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Equipment not found or no changes made" });
        }
        res.status(200).json({ message: "Equipment status updated successfully" });
    } catch (error) {
        console.error("Error updating equipment status:", error);
        res.status(500).json({ error: "Error updating equipment status" });
    }
};
