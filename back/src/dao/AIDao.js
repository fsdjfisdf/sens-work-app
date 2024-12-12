const { pool } = require("../../config/database");

const AIDao = {
  async executeSQL(sqlQuery) {
    try {
      // work_log_db 데이터베이스에 연결하여 쿼리 실행
      const [rows] = await pool.query(`USE work_log_db; ${sqlQuery}`);
      return rows;
    } catch (error) {
      console.error("Database query failed:", error.message);
      throw new Error("Failed to execute SQL query.");
    }
  },
};

module.exports = AIDao;
