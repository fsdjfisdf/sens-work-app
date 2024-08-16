// src/controllers/TitleController.js

const { pool } = require("../../config/database");
const { logger } = require("../../config/winston");

exports.saveTitle = async (req, res) => {
    const { name, title, reason } = req.body;

    try {
        const query = 'INSERT INTO site_titles (name, title, reason) VALUES (?, ?, ?)';
        await pool.query(query, [name, title, reason]);

        res.status(201).json({ success: true, message: 'Title saved successfully.' });
    } catch (err) {
        logger.error('Error saving title:', err.message);
        res.status(500).json({ success: false, message: 'Failed to save title.' });
    }
};
