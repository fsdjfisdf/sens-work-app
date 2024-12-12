const { pool } = require('../../config/database');

const AIDao = {
  async executeSQL(sqlQuery) {
    try {
      const [rows] = await pool.query(sqlQuery); // SQL 쿼리 실행
      return rows;
    } catch (error) {
      console.error('Database query failed:', error.message);
      throw new Error('Failed to execute SQL query.');
    }
  },
};

module.exports = AIDao;
