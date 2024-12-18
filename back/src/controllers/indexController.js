const { pool } = require("../../config/database");
const { logger } = require("../../config/winston");
const jwt = require("jsonwebtoken");
const secret = require("../../config/secret");
const indexDao = require("../dao/indexDao");
const redis = require("../../config/redisClient"); // Redis 클라이언트 불러오기

// 로그인 유지, 토큰 검증
exports.readJwt = async function (req, res) {
  const { userIdx, nickname } = req.verifiedToken;

  return res.send({
    result: { userIdx: userIdx, nickname: nickname },
    code: 200,
    message: "유효한 토큰입니다.",
  });
};

exports.createJwt = async function (req, res) {
  const { userID, password } = req.body;
  const clientIp = req.headers["x-forwarded-for"] || req.connection.remoteAddress;

  if (!userID || !password) {
    return res.send({
      isSuccess: false,
      code: 400,
      message: "회원정보를 입력해주세요.",
    });
  }

  // 브루트포스 방지 - Redis에 IP 기반 로그인 시도 저장
  const loginAttemptsKey = `login_attempts:${clientIp}`;
  const blockTimeKey = `block_time:${clientIp}`;
  const maxAttempts = 5; // 최대 시도 횟수
  const baseBlockTime = 15 * 60; // 기본 차단 시간 (15분)

  try {
    const attempts = await redis.get(loginAttemptsKey);
    const blockTime = await redis.get(blockTimeKey);

    if (blockTime) {
      return res.status(429).send({
        isSuccess: false,
        code: 429,
        message: `너무 많은 로그인 시도가 감지되었습니다. ${Math.ceil(blockTime / 60)}분 후 다시 시도하세요.`,
      });
    }

    const connection = await pool.getConnection(async (conn) => conn);
    try {
      const [rows] = await indexDao.isValidUsers(connection, userID, password);

      if (rows.length < 1) {
        // 로그인 실패 시 시도 횟수 증가
        const newAttempts = await redis.incr(loginAttemptsKey);
        if (newAttempts === 1) {
          await redis.expire(loginAttemptsKey, baseBlockTime); // 만료 시간 설정
        }

        if (newAttempts >= maxAttempts) {
          const blockDuration = baseBlockTime * Math.pow(2, newAttempts - maxAttempts); // 점진적 증가
          await redis.set(blockTimeKey, blockDuration, "EX", blockDuration);

          return res.status(429).send({
            isSuccess: false,
            code: 429,
            message: `너무 많은 실패 시도로 인해 ${Math.ceil(blockDuration / 60)}분 동안 계정이 잠겼습니다.`,
          });
        }

        return res.send({
          isSuccess: false,
          code: 410,
          message: `아이디 또는 비밀번호가 올바르지 않습니다. (${newAttempts}/${maxAttempts}회 실패)`,
        });
      }

      // 로그인 성공 시 시도 횟수 초기화
      await redis.del(loginAttemptsKey);
      await redis.del(blockTimeKey);

      const { userIdx, nickname, role } = rows[0];
      const token = jwt.sign(
        { userIdx: userIdx, nickname: nickname, role: role },
        secret.jwtsecret,
        { expiresIn: "1h" } // 1시간 만료 설정
    );

      console.log(`User logged in: ${nickname}`);

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
    logger.error(`createJwt Redis error\n: ${JSON.stringify(err)}`);
    return res.status(500).json({
      isSuccess: false,
      code: 500,
      message: "서버 오류가 발생했습니다.",
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
  const userNickname = req.verifiedToken.nickname;

  try {
    const connection = await pool.getConnection(async (conn) => conn);
    try {
      const userInfo = await indexDao.getUserInfoByNickname(connection, userNickname);
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



// 작업 시간 조회
exports.getWorkTimeByDate = async function (req, res) {
  const { startDate, endDate } = req.query;

  try {
    const connection = await pool.getConnection(async (conn) => conn);
    try {
      const workTimeData = await indexDao.getWorkTimeByDate(connection, startDate, endDate);
      return res.status(200).json({
        isSuccess: true,
        code: 200,
        message: "작업 시간 조회 성공",
        result: workTimeData,
      });
    } catch (err) {
      logger.error(`getWorkTimeByDate Query error\n: ${JSON.stringify(err)}`);
      return res.status(500).json({
        isSuccess: false,
        code: 500,
        message: "서버 오류입니다.",
      });
    } finally {
      connection.release();
    }
  } catch (err) {
    logger.error(`getWorkTimeByDate DB Connection error\n: ${JSON.stringify(err)}`);
    return res.status(500).json({
      isSuccess: false,
      code: 500,
      message: "서버 오류입니다.",
    });
  }
};

// 페이지 접근 시 사용자 정보를 로그로 남기는 미들웨어
exports.logPageAccess = function (req, res, next) {
  console.log('logPageAccess middleware triggered'); // 미들웨어가 호출되는지 확인하는 로그

  if (req.verifiedToken) {
    const { nickname } = req.verifiedToken;
    const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const requestedUrl = req.originalUrl;

    console.log(`User: ${nickname}, IP: ${clientIp}, Accessed URL: ${requestedUrl}`);

    if (requestedUrl === '/readworklog') {
      console.log(`User: ${nickname} accessed readworklog from IP: ${clientIp}`);
    }
  } else {
    console.log('No verified token found.');
  }

  next();
};


// 아이디 찾기
exports.findId = async function (req, res) {
  const { name, group, site, hireDate } = req.body;

  try {
    const connection = await pool.getConnection(async (conn) => conn);
    try {
      const query = `SELECT userID FROM Users WHERE nickname = ? AND \`group\` = ? AND site = ? AND hire_date = ? AND status = 'A'`;
      const params = [name, group, site, hireDate];
      const [rows] = await connection.query(query, params);

      if (rows.length < 1) {
        return res.status(404).json({
          isSuccess: false,
          message: "일치하는 아이디가 없습니다.",
        });
      }

      return res.status(200).json({
        isSuccess: true,
        message: `아이디는 ${rows[0].userID} 입니다.`,
      });
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error("아이디 찾기 오류:", err);
    return res.status(500).json({
      isSuccess: false,
      message: "아이디 찾기 중 서버 오류가 발생했습니다.",
    });
  }
};

// 비밀번호 재설정
exports.resetPassword = async function (req, res) {
  const { userID, name, group, site, hireDate, newPassword } = req.body;

  try {
    const connection = await pool.getConnection(async (conn) => conn);
    try {
      const query = `SELECT userIdx FROM Users WHERE userID = ? AND nickname = ? AND \`group\` = ? AND site = ? AND hire_date = ? AND status = 'A'`;
      const params = [userID, name, group, site, hireDate];
      const [rows] = await connection.query(query, params);

      if (rows.length < 1) {
        return res.status(404).json({
          isSuccess: false,
          message: "일치하는 회원 정보가 없습니다.",
        });
      }

      const updateQuery = `UPDATE Users SET password = ? WHERE userIdx = ?`;
      await connection.query(updateQuery, [newPassword, rows[0].userIdx]);

      return res.status(200).json({
        isSuccess: true,
        message: "비밀번호가 성공적으로 변경되었습니다.",
      });
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error("비밀번호 재설정 오류:", err);
    return res.status(500).json({
      isSuccess: false,
      message: "비밀번호 재설정 중 서버 오류가 발생했습니다.",
    });
  }
};


