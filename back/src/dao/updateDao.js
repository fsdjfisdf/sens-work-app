const { pool } = require("../../config/database");

exports.getAllUpdates = async () => {
    const connection = await pool.getConnection(async conn => conn);
    try {
        const query = "SELECT id, title, content, created_at FROM updates ORDER BY created_at DESC";
        const [rows] = await connection.query(query);
        return rows;
    } catch (err) {
        throw new Error(`Error fetching updates: ${err.message}`);
    } finally {
        connection.release();
    }
};

exports.addUpdate = async (title, content) => {
    const connection = await pool.getConnection(async conn => conn);
    try {
        const query = "INSERT INTO updates (title, content, created_at) VALUES (?, ?, NOW())";
        await connection.query(query, [title, content]);
    } catch (err) {
        throw new Error(`Error adding update: ${err.message}`);
    } finally {
        connection.release();
    }
};

exports.getUpdateById = async (id) => {
    const connection = await pool.getConnection(async conn => conn);
    try {
        const query = "SELECT id, title, content, created_at FROM updates WHERE id = ?";
        const [rows] = await connection.query(query, [id]);
        return rows[0]; // ID는 고유하므로 한 개의 결과만 반환
    } catch (err) {
        throw new Error(`Error fetching update by ID: ${err.message}`);
    } finally {
        connection.release();
    }
};

// 공지사항 수정
exports.updateUpdate = async (id, title, content) => {
    const connection = await pool.getConnection(async conn => conn);
    try {
        const query = "UPDATE updates SET title = ?, content = ?, updated_at = NOW() WHERE id = ?";
        const [result] = await connection.query(query, [title, content, id]);
        return result; // 수정된 행 개수 반환
    } catch (err) {
        throw new Error(`Error editing update: ${err.message}`);
    } finally {
        connection.release();
    }
};
