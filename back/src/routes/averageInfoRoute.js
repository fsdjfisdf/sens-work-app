const express = require('express');
const router = express.Router();
const { pool } = require('../../config/database');

router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT 
                AVG(level) as avg_level,
                AVG(main_capa) as avg_main_capa,
                AVG(multi_capa) as avg_multi_capa,
                AVG(total_capa) as avg_total_capa
            FROM Users
        `);

        if (rows.length > 0) {
            res.status(200).json({ result: rows[0] });
        } else {
            res.status(404).json({ message: 'No data found' });
        }
    } catch (error) {
        console.error('Error fetching average info:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;
