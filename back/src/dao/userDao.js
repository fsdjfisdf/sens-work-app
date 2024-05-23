const { pool } = require('../../config/database');
const bcrypt = require('bcrypt');

exports.getUserByUsername = async (username) => {
  const connection = await pool.getConnection(async conn => conn);
  try {
    const [rows] = await connection.query('SELECT * FROM users WHERE username = ?', [username]);
    connection.release();
    return rows[0];
  } catch (err) {
    connection.release();
    throw new Error(`Error retrieving user: ${err.message}`);
  }
};

exports.createUser = async (username, password, nickname) => {
  const connection = await pool.getConnection(async conn => conn);
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await connection.query('INSERT INTO users (username, password, nickname) VALUES (?, ?, ?)', [username, hashedPassword, nickname]);
  } catch (err) {
    throw new Error(`Error creating user: ${err.message}`);
  } finally {
    connection.release();
  }
};
