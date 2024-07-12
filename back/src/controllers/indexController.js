const { pool } = require("../../config/database");
const { logger } = require("../../config/winston");
const jwt = require("jsonwebtoken");
const secret = require("../../config/secret");
const indexDao = require("../dao/indexDao");

// 로그인 유지, 토큰 검증
exports.readJwt = async function (req, res) {
  const { userIdx, nickname } = req.verifiedToken;

  return res.send({
    result: { userIdx: userIdx, nickname: nickname },
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
      message: "회원정보를 입력해주세요.",
    });
  }

  try {
    const connection = await pool.getConnection(async (conn) => conn);
    try {
      const [rows] = await indexDao.isValidUsers(connection, userID, password);

      if (rows.length < 1) {
        return res.send({
          isSuccess: false,
          code: 410,
          message: "회원정보가 존재하지 않습니다.",
        });
      }

      const { userIdx, nickname } = rows[0];
      const token = jwt.sign(
        { userIdx: userIdx, nickname: nickname },
        secret.jwtsecret
      );

      return res.send({
        result: { jwt: token },
        isSuccess: true,
        code: 200,
        message: "로그인 성공",
      });
    } catch (err) {
      logger.error(`createJwt Query error\n: ${JSON.stringify(err)}`);
      return res.status(500).json({
        isSuccess: false,
        code: 500,
        message: "로그인 중 서버 오류가 발생했습니다.",
      });
    } finally {
      connection.release();
    }
  } catch (err) {
    logger.error(`createJwt DB Connection error\n: ${JSON.stringify(err)}`);
    return res.status(500).json({
      isSuccess: false,
      code: 500,
      message: "로그인 중 서버 오류가 발생했습니다.",
    });
  }
};


exports.createUsers = async function (req, res) {
  const { userID, password, nickname, group, site, level, hireDate, mainSetUpCapa, mainMaintCapa, mainCapa, multiSetUpCapa, multiMaintCapa, multiCapa, totalCapa } = req.body;

  // 1. 유저 데이터 검증
  const userIDRegExp = /^[a-z]+[a-z0-9]{5,19}$/; // 아이디 정규식 영문자로 시작하는 영문자 또는 숫자 6-20
  const passwordRegExp = /^(?=.*\d)(?=.*[a-zA-Z])[0-9a-zA-Z]{8,16}$/; // 비밀번호 정규식 8-16 문자, 숫자 조합
  const nicknameRegExp = /^[가-힣|a-z|A-Z|0-9|]{2,10}$/; // 닉네임 정규식 2-10 한글, 숫자 또는 영문

  if (!userIDRegExp.test(userID)) {
    return res.send({
      isSuccess: false,
      code: 400, // 요청 실패시 400번대 코드
      message: "아이디 정규식 영문자로 시작하는 영문자 또는 숫자 6-20",
    });
  }

  if (!passwordRegExp.test(password)) {
    return res.send({
      isSuccess: false,
      code: 400, // 요청 실패시 400번대 코드
      message: "비밀번호 정규식 8-16 문자, 숫자 조합",
    });
  }

  if (!nicknameRegExp.test(nickname)) {
    return res.send({
      isSuccess: false,
      code: 400, // 요청 실패시 400번대 코드
      message: "닉네임 정규식 2-10 한글, 숫자 또는 영문",
    });
  }

  try {
    const connection = await pool.getConnection(async (conn) => conn);
    try {
      // 아이디 중복 검사가 필요. 직접 구현해보기.

      // 2. DB 입력
      const [rows] = await indexDao.insertUsers(
        connection,
        userID,
        password,
        nickname,
        group,
        site,
        level,
        hireDate,
        mainSetUpCapa,
        mainMaintCapa,
        mainCapa,
        multiSetUpCapa,
        multiMaintCapa,
        multiCapa,
        totalCapa
      );

      console.log(rows)

      // 입력된 유저 인덱스
      const userIdx = rows.insertId;

      // 3. JWT 발급
      const token = jwt.sign(
        { userIdx: userIdx, nickname: nickname }, // payload 정의
        secret.jwtsecret // 서버 비밀키
      );

      return res.send({
        result: { jwt: token },
        isSuccess: true,
        code: 200, // 요청 실패시 400번대 코드
        message: "회원가입 성공",
      });
    } catch (err) {
      logger.error(`createUsers Query error\n: ${JSON.stringify(err)}`);
      return false;
    } finally {
      connection.release();
    }
  } catch (err) {
    logger.error(`createUsers DB Connection error\n: ${JSON.stringify(err)}`);
    return false;
  }
};


// 회원 정보 조회
exports.getUserInfo = async function (req, res) {
  const userIdx = req.verifiedToken.userIdx;

  try {
    const connection = await pool.getConnection(async (conn) => conn);
    try {
      const userInfo = await indexDao.getUserById(connection, userIdx);
      if (userInfo.length < 1) {
        return res.status(404).json({
          isSuccess: false,
          code: 404,
          message: "사용자 정보를 찾을 수 없습니다.",
        });
      }
      return res.status(200).json({
        isSuccess: true,
        code: 200,
        message: "사용자 정보 조회 성공",
        result: userInfo[0],
      });
    } catch (err) {
      logger.error(`getUserInfo Query error\n: ${JSON.stringify(err)}`);
      return res.status(500).json({
        isSuccess: false,
        code: 500,
        message: "서버 오류입니다.",
      });
    } finally {
      connection.release();
    }
  } catch (err) {
    logger.error(`getUserInfo DB Connection error\n: ${JSON.stringify(err)}`);
    return res.status(500).json({
      isSuccess: false,
      code: 500,
      message: "서버 오류입니다.",
    });
  }
};

// 예시 코드
exports.example = async function (req, res) {
  try {
    const connection = await pool.getConnection(async (conn) => conn);
    try {
      const [rows] = await indexDao.exampleDao(connection);

      return res.send({
        result: rows,
        isSuccess: true,
        code: 200, // 요청 실패시 400번대 코드
        message: "요청 성공",
      });
    } catch (err) {
      logger.error(`example Query error\n: ${JSON.stringify(err)}`);
      return false;
    } finally {
      connection.release();
    }
  } catch (err) {
    logger.error(`example DB Connection error\n: ${JSON.stringify(err)}`);
    return false;
  }
};


exports.getAverageInfo = async function (req, res) {
  const { group, site, level, nickname } = req.query;

  try {
      const connection = await pool.getConnection(async (conn) => conn);
      try {
          const averageInfo = await indexDao.getAverageInfo(connection, group, site, level, nickname);
          return res.status(200).json({
              isSuccess: true,
              code: 200,
              message: "평균 정보 조회 성공",
              result: averageInfo,
          });
      } catch (err) {
          logger.error(`getAverageInfo Query error\n: ${JSON.stringify(err)}`);
          return res.status(500).json({
              isSuccess: false,
              code: 500,
              message: "서버 오류입니다.",
          });
      } finally {
          connection.release();
      }
  } catch (err) {
      logger.error(`getAverageInfo DB Connection error\n: ${JSON.stringify(err)}`);
      return res.status(500).json({
          isSuccess: false,
          code: 500,
          message: "서버 오류입니다.",
      });
  }
};


exports.getAllUsers = async function (req, res) {
  try {
      const connection = await pool.getConnection(async (conn) => conn);
      try {
          const query = "SELECT userID, nickname, `group`, site, level FROM Users WHERE status = 'A'";
          const [rows] = await connection.query(query);
          return res.status(200).json({
              isSuccess: true,
              code: 200,
              message: "사용자 목록 조회 성공",
              result: rows,
          });
      } catch (err) {
          logger.error(`getAllUsers Query error\n: ${JSON.stringify(err)}`);
          return res.status(500).json({
              isSuccess: false,
              code: 500,
              message: "서버 오류입니다.",
          });
      } finally {
          connection.release();
      }
  } catch (err) {
      logger.error(`getAllUsers DB Connection error\n: ${JSON.stringify(err)}`);
      return res.status(500).json({
          isSuccess: false,
          code: 500,
          message: "서버 오류입니다.",
      });
  }
};

exports.getDailyOperationRates = async function (req, res) {
  const { group, site, startDate, endDate } = req.query;

  try {
      const connection = await pool.getConnection(async (conn) => conn);
      try {
          const query = `
              SELECT task_date, 
                     SUM(TIME_TO_SEC(task_duration)) / 60 AS total_minutes,
                     COUNT(DISTINCT task_date) AS unique_dates,
                     COUNT(DISTINCT task_man) AS total_engineers
              FROM work_log
              WHERE (\`group\` = ? OR ? IS NULL)
                AND (site = ? OR ? IS NULL)
                AND (task_date BETWEEN ? AND ?)
              GROUP BY task_date;
          `;
          const [rows] = await connection.query(query, [group, group, site, site, startDate, endDate]);
          return res.status(200).json({
              isSuccess: true,
              code: 200,
              message: "Daily operation rates fetched successfully",
              result: rows,
          });
      } catch (err) {
          logger.error(`getDailyOperationRates Query error\n: ${JSON.stringify(err)}`);
          return res.status(500).json({
              isSuccess: false,
              code: 500,
              message: "Server error",
          });
      } finally {
          connection.release();
      }
  } catch (err) {
      logger.error(`getDailyOperationRates DB Connection error\n: ${JSON.stringify(err)}`);
      return res.status(500).json({
          isSuccess: false,
          code: 500,
          message: "Server error",
      });
  }
};
