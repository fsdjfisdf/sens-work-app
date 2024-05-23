const { pool } = require("../../config/database");
const { logger } = require("../../config/winston");
const jwt = require("jsonwebtoken");
const secret = require("../../config/secret");
const indexDao = require("../dao/indexDao");

// 로그인 유지, 토큰 검증
exports.readJwt = async function (req, res) {
  const { userIdx, name } = req.verifiedToken;

  return res.send({
    result: { userIdx: userIdx, name: name },
    code: 200,
    message: "유효한 토큰입니다.",
  });
};

// 로그인
exports.createJwt = async function (req, res) {
  const { userID, password } = req.body;

  if (!userID || !password) {
    return res.send({
      isSuccess: false,
      code: 400,
      message: "회원 정보를 입력해주세요.",
    });
  }

  try {
    const connection = await pool.getConnection(async (conn) => conn);
    try {
      // DB 회원 검증
      const [rows] = await indexDao.isValidUsers(connection, userID, password);

      if (rows.length < 1) {
        return res.send({
          isSuccess: false,
          code: 410,
          message: "회원 정보가 존재하지 않습니다.",
        });
      }

      const { userIdx, name } = rows[0];

      // JWT 발급
      const token = jwt.sign(
        { userIdx: userIdx, name: name }, // payload 정의
        secret.jwtsecret // 서버 비밀키
      );

      return res.send({
        result: { jwt: token },
        isSuccess: true,
        code: 200,
        message: "로그인 성공",
      });
    } catch (err) {
      logger.error(`createJwt Query error\n: ${JSON.stringify(err)}`);
      return res.status(500).send({
        isSuccess: false,
        code: 500,
        message: "로그인 중 오류가 발생했습니다.",
      });
    } finally {
      connection.release();
    }
  } catch (err) {
    logger.error(`createJwt DB Connection error\n: ${JSON.stringify(err)}`);
    return res.status(500).send({
      isSuccess: false,
      code: 500,
      message: "로그인 중 오류가 발생했습니다.",
    });
  }
};
