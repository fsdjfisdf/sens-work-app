const jwt = require("jsonwebtoken");
const secret_config = require("./secret");
const redisClient = require("./redisClient"); // Redis 클라이언트 추가

const jwtMiddleware = async function (req, res, next) {
  const token = req.headers["x-access-token"] || req.query.token;

  if (!token) {
    return res.status(403).json({
      isSuccess: false,
      code: 403,
      message: "로그인이 되어 있지 않습니다.",
    });
  }

  try {
    // JWT 토큰 검증
    const verifiedToken = jwt.verify(token, secret_config.jwtsecret);
    req.verifiedToken = verifiedToken;

    // Redis 세션 검증
    const sessionKey = `session:${verifiedToken.userIdx}`; // Redis에 저장된 세션 키
    const session = await redisClient.get(sessionKey);

    if (!session) {
      // Redis에 세션이 없으면 토큰 만료 처리
      console.log("Session expired or invalid for user:", verifiedToken.userIdx);
      return res.status(403).json({
        isSuccess: false,
        code: 403,
        message: "세션이 만료되었습니다. 다시 로그인해주세요.",
      });
    }

    // 검증된 토큰 및 세션 정보 로그 출력
    console.log('Verified Token:', verifiedToken);
    next();
  } catch (err) {
    console.log('Token verification failed:', err.message); // 검증 실패 로그
    res.status(403).json({
      isSuccess: false,
      code: 403,
      message: "검증 실패",
    });
  }
};

module.exports = jwtMiddleware;
