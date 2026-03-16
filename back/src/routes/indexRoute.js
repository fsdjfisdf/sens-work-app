module.exports = function (app) {
    const index = require("../controllers/indexController");
    const jwtMiddleware = require("../../config/jwtMiddleware");

    // 관리자 전용 계정 생성
    app.post("/sign-up", jwtMiddleware, index.createUsers);
    app.post("/admin/users", jwtMiddleware, index.createUsers);

    // 로그인
    app.post("/sign-in", index.createJwt);

    // 로그인 유지, 토큰 검증
    app.get("/jwt", jwtMiddleware, index.readJwt);

    // 회원 정보 조회
    app.get("/user-info", jwtMiddleware, index.getUserInfo);

    // 평균 정보 조회
    app.get("/average-info", jwtMiddleware, index.getAverageInfo);

    // 모든 사용자 조회 (admin only)
    app.get("/users", jwtMiddleware, index.getAllUsers);

    // 작업 시간 조회
    app.get("/worktime-by-date", jwtMiddleware, index.getWorkTimeByDate);

    // 아이디 찾기
    app.post("/find-id", index.findId);

    // 비밀번호 재설정
    app.post("/find-password", index.resetPassword);

    // 비밀번호 변경
    app.post("/change-password", jwtMiddleware, index.changePassword);

    // 관리자 비밀번호 초기화
    app.post("/admin/reset-password", jwtMiddleware, index.adminResetPassword);
};
