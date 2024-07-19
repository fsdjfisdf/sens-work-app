const { pool } = require("../config/database");

exports.getAllNotices = async () => {
  const query = "SELECT * FROM notices ORDER BY notice_date DESC";
  const [result] = await pool.query(query);
  return result;
};

exports.getNoticeById = async (id) => {
  const query = "SELECT * FROM notices WHERE id = ?";
  const [result] = await pool.query(query, [id]);
  return result[0];
};

exports.createNotice = async (notice_date, title, content) => {
  const query = "INSERT INTO notices (notice_date, title, content) VALUES (?, ?, ?)";
  const [result] = await pool.query(query, [notice_date, title, content]);
  return { id: result.insertId };
};

exports.updateNotice = async (id, notice_date, title, content) => {
  const query = "UPDATE notices SET notice_date = ?, title = ?, content = ? WHERE id = ?";
  await pool.query(query, [notice_date, title, content, id]);
};

exports.deleteNotice = async (id) => {
  const query = "DELETE FROM notices WHERE id = ?";
  await pool.query(query, [id]);
};
