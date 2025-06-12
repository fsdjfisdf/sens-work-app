const jwt = require("jsonwebtoken");
const secret_config = require("./secret");
const redisClient = require("./redisClient"); // Redis 클라이언트 추가

const jwtMiddleware = function (req, res, next) {
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
    req.user = verifiedToken;

    // 검증된 토큰 정보 로그 출력
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
