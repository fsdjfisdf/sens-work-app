module.exports = function (app) {
    const index = require("../controllers/indexController");
    const jwtMiddleware = require("../../config/jwtMiddleware");

    // 회원가입
    app.post("/sign-up", index.createUsers);

    // 로그인
    app.post("/sign-in", index.createJwt);

    // 로그인 유지, 토큰 검증
    app.get("/jwt", jwtMiddleware, index.readJwt);

    // 회원 정보 조회
    app.get("/user-info", jwtMiddleware, index.getUserInfo);

    // 평균 정보 조회
    app.use("/average-info", jwtMiddleware, require('./averageInfoRoute'));
};
