module.exports = function (app) {
    const index = require("../controllers/indexController");
    const jwtMiddleware = require("../../config/jwtMiddleware");

    // 라우터 정의
    app.get("/restaurants", index.readRestaurants);

    // 회원가입
    app.post("/sign-up", index.createUsers);

    // 로그인
    app.post("/sign-in", index.createJwt);

    // 로그인 유지, 토큰 검증
    app.get("/jwt", jwtMiddleware, index.readJwt);

    // 회원 정보 조회
    app.get("/user-info", jwtMiddleware, index.getUserInfo);

    // 사용자 작업 이력 조회
    app.get("/user-work-logs", jwtMiddleware, index.getUserWorkLogs);
};
