// back/src/dao/skillDao.js
const { pool } = require('../../config/database');

/** 전체 조회
 *  - 컬럼명이 공백/괄호를 포함하므로 SELECT *를 유지
 *  - controller에서 안전하게 브라켓 표기(['LEVEL'])로 접근
 */
async function fetchAllUsers() {
  const [rows] = await pool.query('SELECT * FROM userDB');
  return rows;
}

/** ID 단건 */
async function fetchUserById(id) {
  const [rows] = await pool.query('SELECT * FROM userDB WHERE ID = ?', [id]);
  return rows[0] || null;
}

/** 이름 LIKE */
async function fetchUsersByNameLike(name) {
  const like = `%${name}%`;
  const [rows] = await pool.query('SELECT * FROM userDB WHERE NAME LIKE ?', [like]);
  return rows;
}

module.exports = {
  fetchAllUsers,
  fetchUserById,
  fetchUsersByNameLike,
};
