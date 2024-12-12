const { pool } = require("../../config/database");

const AIDao = {
  async executeSQL(sqlQuery) {
    try {
      // 먼저 데이터베이스를 선택
      await pool.query(`USE work_log_db;`);
      
      // SQL 쿼리 실행
      const [rows] = await pool.query(sqlQuery);
      return rows;
    } catch (error) {
      console.error("Database query failed:", error.message);
      throw new Error("Failed to execute SQL query.");
    }
  },
};

module.exports = AIDao;
