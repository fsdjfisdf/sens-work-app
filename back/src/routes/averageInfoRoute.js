const express = require('express');
const router = express.Router();
const { pool } = require('../../config/database');

router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT 
                AVG(level) as avg_level,
                AVG(main_set_up_capa) as avg_main_set_up_capa,
                AVG(main_maint_capa) as avg_main_maint_capa,
                AVG(main_capa) as avg_main_capa,
                AVG(multi_set_up_capa) as avg_multi_set_up_capa,
                AVG(multi_maint_capa) as avg_multi_maint_capa,
                AVG(multi_capa) as avg_multi_capa,
                AVG(total_capa) as avg_total_capa,
                COUNT(*) as total_users,
                SUM(CASE WHEN level = 0 THEN 1 ELSE 0 END) as level_0,
                SUM(CASE WHEN level = 1 THEN 1 ELSE 0 END) as level_1,
                SUM(CASE WHEN level = 2 THEN 1 ELSE 0 END) as level_2,
                SUM(CASE WHEN level = 3 THEN 1 ELSE 0 END) as level_3,
                SUM(CASE WHEN level = 4 THEN 1 ELSE 0 END) as level_4
            FROM Users
        `);

        if (rows.length > 0) {
            const result = rows[0];
            // ensure all values are numbers
            for (let key in result) {
                result[key] = parseFloat(result[key]);
            }
            res.status(200).json({ result });
        } else {
            res.status(404).json({ message: 'No data found' });
        }
    } catch (error) {
        console.error('Error fetching average info:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;
