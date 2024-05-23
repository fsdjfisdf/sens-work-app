const { pool } = require('../../config/database'); // 상대 경로 수정
const bcrypt = require('bcrypt');

exports.createUser = async (username, password, nickname) => {
  const connection = await pool.getConnection(async conn => conn);
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const query = 'INSERT INTO users (username, password, nickname) VALUES (?, ?, ?)';
    await connection.query(query, [username, hashedPassword, nickname]);
  } catch (err) {
    throw new Error(`Error creating user: ${err.message}`);
  } finally {
    connection.release();
  }
};

exports.getUserByUsername = async (username) => {
  const connection = await pool.getConnection(async conn => conn);
  try {
    const query = 'SELECT * FROM users WHERE username = ?';
    const [rows] = await connection.query(query, [username]);
    return rows[0];
  } catch (err) {
    throw new Error(`Error retrieving user: ${err.message}`);
  } finally {
    connection.release();
  }
};
