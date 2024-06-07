const express = require('express');
const router = express.Router();
const { pool } = require('../../config/database');

// 기존 평균 정보 조회 라우트
router.get('/', async (req, res) => {
    const { group, site, level, nickname } = req.query;

    try {
        let query = `
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
            WHERE 1=1
        `;

        const params = [];

        if (group) {
            query += ` AND \`group\` = ?`;
            params.push(group);
        }

        if (site) {
            const siteList = site.split(',').map(s => s.trim());
            query += ` AND site IN (${siteList.map(() => '?').join(',')})`;
            params.push(...siteList);
        }

        if (level) {
            query += ` AND level = ?`;
            params.push(level);
        }

        if (nickname) {
            query += ` AND nickname LIKE ?`;
            params.push(`%${nickname}%`);
        }

        const [rows] = await pool.query(query, params);

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

// 새로운 라우트 추가
router.get('/search', async (req, res) => {
    const { nickname } = req.query;

    if (!nickname) {
        return res.status(400).json({ message: 'nickname is required' });
    }

    try {
        const [rows] = await pool.query(`
            SELECT COUNT(*) as total_tasks, 
                   SUM(TIME_TO_SEC(TIMEDIFF(end_time, start_time)) / 60) as total_duration_minutes
            FROM work_log 
            WHERE task_man LIKE ?
        `, [`%${nickname}%`]);

        if (rows.length > 0) {
            const result = rows[0];
            result.total_duration_minutes = parseFloat(result.total_duration_minutes).toFixed(2);
            res.status(200).json({ result });
        } else {
            res.status(404).json({ message: 'No matching logs found' });
        }
    } catch (error) {
        console.error('Error fetching work logs:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;
