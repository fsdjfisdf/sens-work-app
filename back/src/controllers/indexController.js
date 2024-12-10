const { pool } = require("../../config/database");
const { logger } = require("../../config/winston");
const jwt = require("jsonwebtoken");
const secret = require("../../config/secret");
const indexDao = require("../dao/indexDao");
const redisClient = require("../../config/redisClient");

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

      const { userIdx, nickname, role } = rows[0]; // 역할(role)을 포함
      const token = jwt.sign(
        { userIdx: userIdx, nickname: nickname, role: role }, // 역할(role)을 포함
        secret.jwtsecret
      );

            // 로그인 성공 시 nickname을 콘솔에 출력
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

// 로그인 후 SMS 인증 요청
exports.requestSmsCode = async function (req, res) {
  const { phoneNumber } = req.body;

  if (!phoneNumber) {
    return res.status(400).json({ message: "전화번호를 입력해주세요." });
  }

  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6자리 코드 생성

  try {
    // Redis에 인증 코드 저장 (5분 만료)
    await redisClient.set(phoneNumber, verificationCode, {
      EX: 300, // 만료 시간: 300초 (5분)
    });

    // SMS 서비스 API 호출 (여기에 실제 SMS 전송 로직 추가)
    // 예: await sendSms(phoneNumber, `Your verification code is ${verificationCode}`);

    return res.status(200).json({ message: "인증 코드가 발송되었습니다." });
  } catch (error) {
    console.error("SMS 전송 오류:", error);
    return res.status(500).json({ message: "SMS 전송 중 오류가 발생했습니다." });
  }
};

// SMS 인증 코드 검증
exports.verifySmsCode = async function (req, res) {
  const { phoneNumber, verificationCode } = req.body;

  if (!phoneNumber || !verificationCode) {
    return res.status(400).json({ message: "전화번호와 인증 코드를 입력해주세요." });
  }

  try {
    const storedCode = await redisClient.get(phoneNumber); // Redis에서 코드 조회

    if (!storedCode) {
      return res.status(400).json({ message: "인증 코드가 만료되었습니다." });
    }

    if (storedCode !== verificationCode) {
      return res.status(400).json({ message: "인증 코드가 올바르지 않습니다." });
    }

    await redisClient.del(phoneNumber); // 인증 성공 후 코드 삭제

    return res.status(200).json({ message: "인증이 완료되었습니다." });
  } catch (error) {
    console.error("인증 검증 오류:", error);
    return res.status(500).json({ message: "인증 검증 중 오류가 발생했습니다." });
  }
};