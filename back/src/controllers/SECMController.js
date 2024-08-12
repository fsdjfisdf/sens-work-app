const { pool } = require('../../config/database');
const jwt = require('jsonwebtoken'); // JWT 토큰을 확인하기 위해 사용

exports.getUserInfo = async (req, res) => {
  try {
    const token = req.headers['x-access-token'];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, 'your_secret_key'); // JWT 토큰을 디코드, 'your_secret_key'를 실제 비밀 키로 변경하세요
    const userId = decoded.id; // 토큰에서 유저 ID를 추출 (토큰 구조에 따라 변경될 수 있음)

    const [rows] = await pool.query('SELECT NAME FROM userDB WHERE id = ?', [userId]);

    if (rows.length > 0) {
      res.status(200).json({ name: rows[0].NAME });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (err) {
    console.error('Error retrieving user information:', err);
    res.status(500).json({ error: 'Error retrieving user information' });
  }
};
