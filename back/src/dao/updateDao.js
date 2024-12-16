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
