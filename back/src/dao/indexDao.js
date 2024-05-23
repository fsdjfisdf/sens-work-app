const { pool } = require("../../config/database");

// 로그인 (회원 검증)
exports.isValidUsers = async function (connection, userID, password) {
  const Query = `SELECT userIdx, name FROM Users WHERE userID = ? AND password = ? AND status = 'A';`;
  const Params = [userID, password];

  const [rows] = await connection.query(Query, Params);
  return rows;
};