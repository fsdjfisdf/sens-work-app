const editDao = require("../dao/editDao");

// 특정 작업 이력 조회 (id로 조회)
const getWorkLogById = async (req, res) => {
    try {
        const { id } = req.params;
        const workLog = await editDao.getWorkLogById(id);
        if (!workLog) {
            return res.status(404).json({ message: "작업 이력을 찾을 수 없습니다." });
        }
        res.json(workLog);
    } catch (error) {
        console.error("작업 이력 조회 오류:", error);
        res.status(500).json({ message: "서버 오류 발생" });
    }
};

// 작업 이력 수정
const updateWorkLog = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const result = await editDao.updateWorkLog(id, updateData);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "업데이트할 작업 이력을 찾을 수 없습니다." });
        }
        res.json({ message: "작업 이력이 성공적으로 수정되었습니다." });
    } catch (error) {
        console.error("작업 이력 수정 오류:", error);
        res.status(500).json({ message: "서버 오류 발생" });
    }
};

// 특정 작업 이력 삭제
const deleteWorkLog = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await editDao.deleteWorkLog(id);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "삭제할 작업 이력을 찾을 수 없습니다." });
        }

        res.json({ message: "작업 이력이 성공적으로 삭제되었습니다." });
    } catch (error) {
        console.error("작업 이력 삭제 오류:", error);
        res.status(500).json({ message: "서버 오류 발생" });
    }
};

module.exports = {
    getWorkLogById,
    updateWorkLog,
    deleteWorkLog,
};
