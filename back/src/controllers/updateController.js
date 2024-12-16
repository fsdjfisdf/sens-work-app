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
