const updateDao = require("../dao/updateDao");

exports.getUpdates = async (req, res) => {
    try {
        const updates = await updateDao.getAllUpdates();
        res.status(200).json(updates);
    } catch (error) {
        console.error("Error fetching updates:", error);
        res.status(500).json({ error: "Error fetching updates" });
    }
};

exports.addUpdate = async (req, res) => {
    try {
        const { title, content } = req.body;
        if (!title || !content) {
            return res.status(400).json({ message: "Title and content are required" });
        }
        await updateDao.addUpdate(title, content);
        res.status(201).json({ message: "Update added successfully" });
    } catch (error) {
        console.error("Error adding update:", error);
        res.status(500).json({ error: "Error adding update" });
    }
};

exports.getUpdateById = async (req, res) => {
    const { id } = req.params;
    try {
        const update = await updateDao.getUpdateById(id);
        if (!update) {
            return res.status(404).json({ message: "Update not found" });
        }
        res.status(200).json(update);
    } catch (error) {
        console.error("Error fetching update by ID:", error);
        res.status(500).json({ error: "Error fetching update by ID" });
    }
};

// 공지사항 수정
exports.updateUpdate = async (req, res) => {
    const { id } = req.params;
    const { title, content } = req.body;
    try {
        if (!title || !content) {
            return res.status(400).json({ message: "Title and content are required" });
        }
        const result = await updateDao.updateUpdate(id, title, content);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Update not found" });
        }
        res.status(200).json({ message: "Update edited successfully" });
    } catch (error) {
        console.error("Error editing update:", error);
        res.status(500).json({ error: "Error editing update" });
    }
};
