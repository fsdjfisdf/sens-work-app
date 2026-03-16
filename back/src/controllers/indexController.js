const { pool } = require("../../config/database");
const { logger } = require("../../config/winston");
const jwt = require("jsonwebtoken");
const secret = require("../../config/secret");
const indexDao = require("../dao/indexDao");
const redis = require("../../config/redisClient"); // Redis 클라이언트 불러오기

const bcrypt = require("bcrypt");
const SALT_ROUNDS = 10;

function isAdminRequest(req) {
  return req.verifiedToken && req.verifiedToken.role === "admin";
}

function validatePassword(password) {
  const passwordRegExp = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&^~+=-])[A-Za-z\d@$!%*#?&^~+=-]{8,16}$/;
  return passwordRegExp.test(password);
}

function validateCreateUserPayload({ userID, password, nickname, group, site, level, hireDate, role, status }) {
  const userIDRegExp = /^[a-zA-Z][a-zA-Z0-9]{5,19}$/;
  const nicknameRegExp = /^[가-힣a-zA-Z0-9]{2,10}$/;
  const allowedRoles = ["admin", "worker", "editor"];
  const allowedStatus = ["A", "I", "D"];

  if (!userIDRegExp.test(userID || "")) {
    return "아이디는 영문으로 시작하는 6~20자의 영문/숫자만 사용할 수 있습니다.";
  }

  if (!validatePassword(password || "")) {
    return "비밀번호는 8~16자이며 영문, 숫자, 특수문자를 각각 1개 이상 포함해야 합니다.";
  }

  if (!nicknameRegExp.test(nickname || "")) {
    return "닉네임은 2~10자의 한글/영문/숫자만 사용할 수 있습니다.";
  }

  if (!group || !site || !hireDate) {
    return "group, site, hireDate는 필수입니다.";
  }

  if (!Number.isInteger(Number(level)) || Number(level) < 0) {
    return "level은 0 이상의 정수여야 합니다.";
  }

  if (!allowedRoles.includes(role)) {
    return "role 값이 올바르지 않습니다.";
  }

  if (!allowedStatus.includes(status)) {
    return "status 값이 올바르지 않습니다.";
  }

  return null;
}

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

  const loginAttemptsKey = `login_attempts:${clientIp}`;
  const blockTimeKey = `block_time:${clientIp}`;
  const maxAttempts = 5; // 최대 시도 횟수
  const baseBlockTime = 15 * 60; // 기본 차단 시간 (15분)

  // 공통: 로그인 실패 처리 함수
  const handleLoginFail = async () => {
    const newAttempts = await redis.incr(loginAttemptsKey);
    if (newAttempts === 1) {
      await redis.expire(loginAttemptsKey, baseBlockTime);
    }

    if (newAttempts >= maxAttempts) {
      const blockDuration = baseBlockTime * Math.pow(2, newAttempts - maxAttempts);
      await redis.set(blockTimeKey, blockDuration, "EX", blockDuration);

      return res.status(429).send({
        isSuccess: false,
        code: 429,
        message: `너무 많은 실패 시도로 인해 ${Math.ceil(
          blockDuration / 60
        )}분 동안 계정이 잠겼습니다.`,
      });
    }

    return res.send({
      isSuccess: false,
      code: 410,
      message: `아이디 또는 비밀번호가 올바르지 않습니다. (${newAttempts}/${maxAttempts}회 실패)`,
    });
  };

  try {
    const attempts = await redis.get(loginAttemptsKey);
    const blockTime = await redis.get(blockTimeKey);

    if (blockTime) {
      return res.status(429).send({
        isSuccess: false,
        code: 429,
        message: `너무 많은 로그인 시도가 감지되었습니다. ${Math.ceil(
          blockTime / 60
        )}분 후 다시 시도하세요.`,
      });
    }

    const connection = await pool.getConnection(async (conn) => conn);
    try {
      const [rows] = await indexDao.isValidUsers(connection, userID);

      // 아이디 없음
      if (rows.length < 1) {
        return await handleLoginFail();
      }

      const user = rows[0];
      const storedPassword = user.password;

      let isMatch = false;
      let isLegacy = false; // 평문 비번인지 여부

      if (storedPassword && storedPassword.startsWith("$2")) {
        // 이미 bcrypt 해시로 저장된 경우
        isMatch = await bcrypt.compare(password, storedPassword);
      } else {
        // 옛날 방식: 평문으로 저장된 경우
        if (password === storedPassword) {
          isMatch = true;
          isLegacy = true;
        }
      }

      if (!isMatch) {
        return await handleLoginFail();
      }

      // 로그인 성공 시 시도 횟수 초기화
      await redis.del(loginAttemptsKey);
      await redis.del(blockTimeKey);

      // ⬇️ 레거시 평문 비번이면 여기서 해시로 자동 마이그레이션
      if (isLegacy) {
        const newHash = await bcrypt.hash(password, SALT_ROUNDS);
        await connection.query(
          `
          UPDATE Users
          SET password = ?, password_changed_at = NULL
          WHERE userIdx = ?
        `,
          [newHash, user.userIdx]
        );
      }

      // 비밀번호 변경 정책 체크
      let mustChangePassword = false; // 최초 로그인 강제 변경
      let passwordChangeRecommended = false; // 3개월 경과 권고

      if (!user.password_changed_at) {
        // 정책 기준상 "한 번도 비밀번호 변경 이력 없음" → 무조건 변경 요구
        mustChangePassword = true;
      } else {
        const lastChange = new Date(user.password_changed_at);
        const now = new Date();
        const diffDays = (now - lastChange) / (1000 * 60 * 60 * 24);

        if (diffDays >= 90) {
          passwordChangeRecommended = true;
        }
      }

      // 레거시→해시로 막 변환한 유저는 첫 로그인이니 무조건 변경 강제
      if (isLegacy) {
        mustChangePassword = true;
        passwordChangeRecommended = false;
      }

      const { userIdx, nickname, role } = user;
      const token = jwt.sign(
        { userIdx: userIdx, nickname: nickname, role: role },
        secret.jwtsecret,
        { expiresIn: "1h" }
      );

      console.log(`User logged in: ${nickname}`);

      return res.send({
        result: {
          jwt: token,
          mustChangePassword,
          passwordChangeRecommended,
        },
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
  if (!isAdminRequest(req)) {
    return res.status(403).json({
      isSuccess: false,
      code: 403,
      message: "admin 권한이 있는 사용자만 계정을 생성할 수 있습니다.",
    });
  }

  const {
    userID,
    password,
    nickname,
    group,
    site,
    level,
    hireDate,
    role = "worker",
    status = "A",
  } = req.body;

  const validationMessage = validateCreateUserPayload({
    userID,
    password,
    nickname,
    group,
    site,
    level,
    hireDate,
    role,
    status,
  });

  if (validationMessage) {
    return res.status(400).json({
      isSuccess: false,
      code: 400,
      message: validationMessage,
    });
  }

  try {
    const connection = await pool.getConnection(async (conn) => conn);
    try {
      const [existingIdRows] = await indexDao.getUserByUserID(connection, userID);
      if (existingIdRows.length > 0) {
        return res.status(409).json({
          isSuccess: false,
          code: 409,
          message: "이미 사용 중인 아이디입니다.",
        });
      }

      const [existingNicknameRows] = await indexDao.getUserByNickname(connection, nickname);
      if (existingNicknameRows.length > 0) {
        return res.status(409).json({
          isSuccess: false,
          code: 409,
          message: "이미 사용 중인 닉네임입니다.",
        });
      }

      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

      const [rows] = await indexDao.insertUsers(
        connection,
        userID,
        hashedPassword,
        nickname,
        group,
        site,
        Number(level),
        hireDate,
        role,
        status
      );

      return res.status(201).json({
        isSuccess: true,
        code: 201,
        message: "사용자 계정이 생성되었습니다.",
        result: {
          userIdx: rows.insertId,
          userID,
          nickname,
          group,
          site,
          level: Number(level),
          hireDate,
          role,
          status,
        },
      });
    } catch (err) {
      logger.error(`createUsers Query error\n: ${JSON.stringify(err)}`);
      return res.status(500).json({
        isSuccess: false,
        code: 500,
        message: "사용자 생성 중 서버 오류가 발생했습니다.",
      });
    } finally {
      connection.release();
    }
  } catch (err) {
    logger.error(`createUsers DB Connection error\n: ${JSON.stringify(err)}`);
    return res.status(500).json({
      isSuccess: false,
      code: 500,
      message: "DB 연결 중 오류가 발생했습니다.",
    });
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
  if (!isAdminRequest(req)) {
    return res.status(403).json({
      isSuccess: false,
      code: 403,
      message: "admin 권한이 있는 사용자만 사용자 목록을 조회할 수 있습니다.",
    });
  }

  try {
      const connection = await pool.getConnection(async (conn) => conn);
      try {
          const query = `
            SELECT
              userIdx,
              userID,
              nickname,
              \`group\`,
              site,
              level,
              role,
              status,
              hire_date,
              created_at,
              updated_at
            FROM Users
            WHERE status <> 'D'
            ORDER BY created_at DESC, userIdx DESC
          `;
          const [rows] = await connection.query(query);
          return res.status(200).json({
              isSuccess: true,
              code: 200,
              message: "사용자 목록 조회 성공",
              result: rows,
          });
      } catch (err) {
          logger.error(`getAllUsers Query error
: ${JSON.stringify(err)}`);
          return res.status(500).json({
              isSuccess: false,
              code: 500,
              message: "서버 오류입니다.",
          });
      } finally {
          connection.release();
      }
  } catch (err) {
      logger.error(`getAllUsers DB Connection error
: ${JSON.stringify(err)}`);
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

      if (!validatePassword(newPassword)) {
return res.status(400).json({
  isSuccess: false,
  message: "비밀번호는 8~16자의 영문, 숫자, 특수문자를 각각 1개 이상 포함해야 합니다.",
});
      }

      const hashed = await bcrypt.hash(newPassword, SALT_ROUNDS);

      const updateQuery = `
        UPDATE Users
        SET password = ?, password_changed_at = NOW()
        WHERE userIdx = ?
      `;
      await connection.query(updateQuery, [hashed, rows[0].userIdx]);

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

exports.changePassword = async function (req, res) {
  const userIdx = req.verifiedToken.userIdx;
  const { currentPassword, newPassword } = req.body;

  if (!validatePassword(newPassword)) {
return res.status(400).json({
  isSuccess: false,
  message: "비밀번호는 8~16자의 영문, 숫자, 특수문자를 각각 1개 이상 포함해야 합니다.",
});
  }

  try {
    const connection = await pool.getConnection(async (conn) => conn);
    try {
      const [rows] = await connection.query(
        "SELECT password FROM Users WHERE userIdx = ? AND status = 'A'",
        [userIdx]
      );

      if (rows.length < 1) {
        return res.status(404).json({
          isSuccess: false,
          message: "사용자 정보를 찾을 수 없습니다.",
        });
      }

      const user = rows[0];
      let isMatch = false;

      if (user.password && user.password.startsWith("$2")) {
        isMatch = await bcrypt.compare(currentPassword, user.password);
      } else {
        isMatch = currentPassword === user.password;
      }

      if (!isMatch) {
        return res.status(400).json({
          isSuccess: false,
          message: "현재 비밀번호가 일치하지 않습니다.",
        });
      }

      const hashed = await bcrypt.hash(newPassword, SALT_ROUNDS);
      await connection.query(
        "UPDATE Users SET password = ?, password_changed_at = NOW() WHERE userIdx = ?",
        [hashed, userIdx]
      );

      return res.status(200).json({
        isSuccess: true,
        message: "비밀번호가 성공적으로 변경되었습니다.",
      });
    } finally {
      connection.release();
    }
  } catch (err) {
    logger.error(`changePassword error\n: ${JSON.stringify(err)}`);
    return res.status(500).json({
      isSuccess: false,
      message: "비밀번호 변경 중 서버 오류가 발생했습니다.",
    });
  }
};



exports.adminResetPassword = async function (req, res) {
  if (!isAdminRequest(req)) {
    return res.status(403).json({
      isSuccess: false,
      code: 403,
      message: "admin 권한이 있는 사용자만 비밀번호를 초기화할 수 있습니다.",
    });
  }

  const { userIdx, newPassword } = req.body;

  if (!userIdx) {
    return res.status(400).json({
      isSuccess: false,
      code: 400,
      message: "초기화할 userIdx가 필요합니다.",
    });
  }

  if (!validatePassword(newPassword || "")) {
    return res.status(400).json({
      isSuccess: false,
      code: 400,
      message: "비밀번호는 8~16자이며 영문, 숫자, 특수문자를 각각 1개 이상 포함해야 합니다.",
    });
  }

  try {
    const connection = await pool.getConnection(async (conn) => conn);
    try {
      const [rows] = await connection.query(
        "SELECT userIdx, nickname, userID, status FROM Users WHERE userIdx = ? LIMIT 1",
        [userIdx]
      );

      if (rows.length < 1 || rows[0].status === "D") {
        return res.status(404).json({
          isSuccess: false,
          code: 404,
          message: "대상 사용자를 찾을 수 없습니다.",
        });
      }

      const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
      await connection.query(
        `
          UPDATE Users
          SET password = ?, password_changed_at = NULL
          WHERE userIdx = ?
        `,
        [hashedPassword, userIdx]
      );

      return res.status(200).json({
        isSuccess: true,
        code: 200,
        message: "비밀번호가 초기화되었습니다. 해당 사용자는 다음 로그인 시 비밀번호를 변경해야 합니다.",
        result: {
          userIdx: rows[0].userIdx,
          userID: rows[0].userID,
          nickname: rows[0].nickname,
        },
      });
    } catch (err) {
      logger.error(`adminResetPassword Query error\n: ${JSON.stringify(err)}`);
      return res.status(500).json({
        isSuccess: false,
        code: 500,
        message: "비밀번호 초기화 중 서버 오류가 발생했습니다.",
      });
    } finally {
      connection.release();
    }
  } catch (err) {
    logger.error(`adminResetPassword DB Connection error\n: ${JSON.stringify(err)}`);
    return res.status(500).json({
      isSuccess: false,
      code: 500,
      message: "DB 연결 중 오류가 발생했습니다.",
    });
  }
};
