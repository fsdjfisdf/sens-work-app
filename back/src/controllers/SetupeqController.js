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
exports.updateEquipment = async (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    try {
        // 현재 진행률 계산
        const currentEquipment = await setupeqDao.getEquipmentById(id);
        if (!currentEquipment) {
            return res.status(404).json({ message: "Equipment not found" });
        }

        // 진행률 계산 (각 섹션 평균)
        const sections = [
            currentEquipment.INSTALLATION_PREPARATION_PERCENT,
            currentEquipment.FAB_IN_PERCENT,
            currentEquipment.DOCKING_PERCENT,
            currentEquipment.CABLE_HOOK_UP_PERCENT,
            currentEquipment.POWER_TURN_ON_PERCENT,
            currentEquipment.UTILITY_TURN_ON_PERCENT,
            currentEquipment.GAS_TURN_ON_PERCENT,
            currentEquipment.TEACHING_PERCENT,
            currentEquipment.PART_INSTALLATION_PERCENT,
            currentEquipment.LEAK_CHECK_PERCENT,
            currentEquipment.TTTM_PERCENT,
            currentEquipment.CUSTOMER_CERTIFICATION_PERCENT
        ];
        
        // 진행률 평균 계산
        const averageProgress = Math.round(
            (sections.reduce((sum, value) => sum + value, 0) / sections.length) * 100
        );

        // COMPLETE 상태 결정
        updates.COMPLETE = averageProgress === 100 ? "COMPLETE" : "ING";

        // 업데이트 실행
        const result = await setupeqDao.updateEquipmentById(id, updates);
        if (result.affectedRows > 0) {
            res.status(200).json({ message: "Equipment updated successfully", complete: updates.COMPLETE });
        } else {
            res.status(404).json({ message: "Equipment not found" });
        }
    } catch (error) {
        console.error("Error updating equipment:", error);
        res.status(500).json({ error: "Error updating equipment" });
    }
};

exports.checkEquipmentExists = async (req, res) => {
    const { eqname } = req.query;
    try {
        const exists = await setupeqDao.checkEquipmentExists(eqname);
        res.status(200).json({ exists });
    } catch (error) {
        console.error("Error checking equipment existence:", error);
        res.status(500).json({ error: "Error checking equipment existence" });
    }
};

// ✅ SETUP_EQUIPMENT 테이블에 새 설비 추가
exports.addEquipment = async (req, res) => {
    const { EQNAME, GROUP, SITE, LINE, TYPE } = req.body;

    if (!EQNAME || !GROUP || !SITE || !LINE || !TYPE) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    try {
        const result = await setupeqDao.addEquipment({ EQNAME, GROUP, SITE, LINE, TYPE });
        if (result.insertId) {
            res.status(201).json({ message: "Equipment added successfully", id: result.insertId });
        } else {
            res.status(500).json({ error: "Failed to add equipment" });
        }
    } catch (error) {
        console.error("Error adding equipment:", error);
        res.status(500).json({ error: "Error adding equipment" });
    }
};