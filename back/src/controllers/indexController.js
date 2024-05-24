// 회원가입
exports.createUsers = async function (req, res) {
  const { userID, password, nickname, group, site, level } = req.body;

  // 1. 유저 데이터 검증
  const userIDRegExp = /^[a-z]+[a-z0-9]{5,19}$/; // 아이디 정규식 영문자로 시작하는 영문자 또는 숫자 6-20
  const passwordRegExp = /^(?=.*\d)(?=.*[a-zA-Z])[0-9a-zA-Z]{8,16}$/; // 비밀번호 정규식 8-16 문자, 숫자 조합
  const nicknameRegExp = /^[가-힣|a-z|A-Z|0-9|]{2,10}$/; // 닉네임 정규식 2-10 한글, 숫자 또는 영문
  const groupRegExp = /^(PEE1|PEE2|PEE3)$/; // 그룹 정규식 PEE1, PEE2, PEE3 중 하나
  const siteRegExp = /^(PT|HS|IC|CJ|PSKH)$/; // 사이트 정규식 PT, HS, IC, CJ, PSKH 중 하나
  const levelRegExp = /^[0-4]$/; // 레벨 정규식 0-4

  if (!userIDRegExp.test(userID)) {
    return res.send({
      isSuccess: false,
      code: 400,
      message: "아이디 정규식: 영문자로 시작하는 영문자 또는 숫자 6-20",
    });
  }

  if (!passwordRegExp.test(password)) {
    return res.send({
      isSuccess: false,
      code: 400,
      message: "비밀번호 정규식: 8-16 문자, 숫자 조합",
    });
  }

  if (!nicknameRegExp.test(nickname)) {
    return res.send({
      isSuccess: false,
      code: 400,
      message: "닉네임 정규식: 2-10 한글, 숫자 또는 영문",
    });
  }

  if (!groupRegExp.test(group)) {
    return res.send({
      isSuccess: false,
      code: 400,
      message: "그룹 정규식: PEE1, PEE2, PEE3 중 하나",
    });
  }

  if (!siteRegExp.test(site)) {
    return res.send({
      isSuccess: false,
      code: 400,
      message: "사이트 정규식: PT, HS, IC, CJ, PSKH 중 하나",
    });
  }

  if (!levelRegExp.test(level)) {
    return res.send({
      isSuccess: false,
      code: 400,
      message: "레벨 정규식: 0-4",
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
        level
      );

      // 입력된 유저 인덱스
      const userIdx = rows.insertId;

      // 3. JWT 발급
      const token = jwt.sign(
        { userIdx: userIdx, nickname: nickname },
        secret.jwtsecret
      );

      return res.send({
        result: { jwt: token },
        isSuccess: true,
        code: 200,
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
