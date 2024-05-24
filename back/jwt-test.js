const jwt = require("jsonwebtoken");
const { jwtsecret } = require("./config/secret"); // 올바른 경로로 수정

const token = jwt.sign(
  { userIdx: 100, nickname: "김철수" }, // payload 정의
  jwtsecret // secret 키 불러오기
);

console.log("Generated Token:", token);

const verifiedToken = jwt.verify(token, jwtsecret);

console.log("Verified Token:", verifiedToken);
