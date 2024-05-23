const mysql = require('mysql2/promise');
const { logger } = require('./winston');
const secret = require('./secret');
const bcrypt = require('bcrypt');

console.log('Database Config:', secret);

const pool = mysql.createPool({
  host: secret.host,
  user: secret.user,
  port: secret.port,
  password: secret.password,
  database: secret.database,
});

async function checkDatabase() {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT DATABASE() AS db');
    logger.info(`현재 연결된 데이터베이스: ${rows[0].db}`);
    logger.info(`DB_HOST: ${secret.host}`);
    logger.info(`DB_USER: ${secret.user}`);
    logger.info(`DB_NAME: ${secret.database}`);
    connection.release();
  } catch (err) {
    logger.error('데이터베이스 연결 확인 중 오류 발생:', err);
  }
}

checkDatabase();

async function insertUser(username, password, nickname) {
  const connection = await pool.getConnection(async conn => conn);
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const query = 'INSERT INTO users (username, password, nickname) VALUES (?, ?, ?)';
    await connection.query(query, [username, hashedPassword, nickname]);
  } catch (err) {
    throw new Error(`사용자 추가 중 오류 발생: ${err.message}`);
  } finally {
    connection.release();
  }
}

module.exports = {
  pool: pool,
  insertUser: insertUser,
};
