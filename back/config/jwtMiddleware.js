const jwt = require("jsonwebtoken");
const secret_config = require("./secret");
const { pool } = require("./database");

const jwtMiddleware = async (req, res, next) => {
  const token = req.headers["x-access-token"] || req.query.token;

  if (!token) {
    return res.status(403).json({
      isSuccess: false,
      code: 403,
      message: "로그인이 되어 있지 않습니다.",
    });
  }

  try {
    const verifiedToken = jwt.verify(token, secret_config.jwtsecret);
    req.verifiedToken = verifiedToken;

    const connection = await pool.getConnection(async (conn) => conn);
    const [rows] = await connection.query('SELECT role FROM Users WHERE userIdx = ?', [verifiedToken.userIdx]);

    if (rows.length < 1) {
      return res.status(403).json({
        isSuccess: false,
        code: 403,
        message: "유효하지 않은 사용자입니다.",
      });
    }

    req.userRole = rows[0].role;

    connection.release();
    next();
  } catch (error) {
    res.status(403).json({
      isSuccess: false,
      code: 403,
      message: "검증 실패",
    });
  }
};

const adminMiddleware = (req, res, next) => {
  if (req.userRole !== 'admin') {
    return res.status(403).json({
      isSuccess: false,
      code: 403,
      message: "접근 권한이 없습니다.",
    });
  }
  next();
};

module.exports = {
  jwtMiddleware,
  adminMiddleware
};
