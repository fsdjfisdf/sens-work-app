// back/src/dao/skillDao.js
const { pool } = require('../../config/database');

// 전체
async function fetchAllUsers() {
  const [rows] = await pool.query('SELECT * FROM userDB');
  return rows;
}

// ID 단건
async function fetchUserById(id) {
  const [rows] = await pool.query('SELECT * FROM userDB WHERE ID = ?', [id]);
  return rows[0] || null;
}

// 이름 LIKE
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
