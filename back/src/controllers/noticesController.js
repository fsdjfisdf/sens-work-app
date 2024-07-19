const { pool } = require('../database');
const { logger } = require('../winston');

exports.getNotices = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM notices ORDER BY notice_date DESC');
        res.status(200).json(rows);
    } catch (err) {
        logger.error('공지사항 조회 중 오류 발생:', err.message);
        res.status(500).json({ message: '공지사항 조회 중 오류가 발생했습니다.' });
    }
};

exports.createNotice = async (req, res) => {
    const { notice_date, title, content } = req.body;

    try {
        const query = 'INSERT INTO notices (notice_date, title, content) VALUES (?, ?, ?)';
        await pool.execute(query, [notice_date, title, content]);
        res.status(201).json({ message: '공지사항이 성공적으로 작성되었습니다.' });
    } catch (err) {
        logger.error('공지사항 작성 중 오류 발생:', err.message);
        res.status(500).json({ message: '공지사항 작성 중 오류가 발생했습니다.' });
    }
};

exports.updateNotice = async (req, res) => {
    const { id } = req.params;
    const { notice_date, title, content } = req.body;

    try {
        const query = 'UPDATE notices SET notice_date = ?, title = ?, content = ? WHERE id = ?';
        await pool.execute(query, [notice_date, title, content, id]);
        res.status(200).json({ message: '공지사항이 성공적으로 수정되었습니다.' });
    } catch (err) {
        logger.error('공지사항 수정 중 오류 발생:', err.message);
        res.status(500).json({ message: '공지사항 수정 중 오류가 발생했습니다.' });
    }
};

exports.deleteNotice = async (req, res) => {
    const { id } = req.params;

    try {
        const query = 'DELETE FROM notices WHERE id = ?';
        await pool.execute(query, [id]);
        res.status(200).json({ message: '공지사항이 성공적으로 삭제되었습니다.' });
    } catch (err) {
        logger.error('공지사항 삭제 중 오류 발생:', err.message);
        res.status(500).json({ message: '공지사항 삭제 중 오류가 발생했습니다.' });
    }
};
