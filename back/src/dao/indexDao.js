const { pool } = require("../../config/database");

// 로그인 (회원검증)
exports.isValidUsers = async function (connection, userID, password) {
    const Query = `SELECT userIdx, nickname FROM Users where userID = ? and password = ? and status = 'A';`;
    const Params = [userID, password];

    const rows = await connection.query(Query, Params);

    return rows;
};

// 회원가입
exports.insertUsers = async function (connection, userID, password, nickname, group, site, level, hireDate, mainSetUpCapa, mainMaintCapa, mainCapa, multiSetUpCapa, multiMaintCapa, multiCapa, totalCapa) {
    const Query = `insert into Users(userID, password, nickname, \`group\`, site, level, hire_date, main_set_up_capa, main_maint_capa, main_capa, multi_set_up_capa, multi_maint_capa, multi_capa, total_capa) values (?,?,?,?,?,?,?,?,?,?,?,?,?,?);`;
    const Params = [userID, password, nickname, group, site, level, hireDate, mainSetUpCapa, mainMaintCapa, mainCapa, multiSetUpCapa, multiMaintCapa, multiCapa, totalCapa];

    const rows = await connection.query(Query, Params);

    return rows;
};

// 회원 정보 조회
exports.getUserById = async function (connection, userIdx) {
    const Query = `SELECT userID, nickname, \`group\`, site, level, hire_date, main_set_up_capa, main_maint_capa, main_capa, multi_set_up_capa, multi_maint_capa, multi_capa, total_capa FROM Users WHERE userIdx = ? AND status = 'A';`;
    const Params = [userIdx];

    const [rows] = await connection.query(Query, Params);
    return rows;
};

// 회원 검색
exports.searchUsers = async function (connection, group, site, level, nickname) {
  let Query = `SELECT userID, nickname, \`group\`, site, level, hire_date, main_set_up_capa, main_maint_capa, main_capa, multi_set_up_capa, multi_maint_capa, multi_capa, total_capa FROM Users WHERE status = 'A'`;
  let Params = [];

  if (group) {
      Query += ` AND \`group\` = ?`;
      Params.push(group);
  }
  if (site) {
      Query += ` AND site = ?`;
      Params.push(site);
  }
  if (level) {
      Query += ` AND level = ?`;
      Params.push(level);
  }
  if (nickname) {
      Query += ` AND nickname LIKE ?`;
      Params.push(`%${nickname}%`);
  }

  const [rows] = await connection.query(Query, Params);
  return rows;
};

// 평균 통계 계산
exports.calculateAverageStats = async function (connection, group, site, level, nickname) {
  let Query = `SELECT AVG(DATEDIFF(NOW(), hire_date)) AS average_tenure, AVG(level) AS average_level, AVG(main_set_up_capa) AS average_main_set_up_capa, AVG(main_maint_capa) AS average_main_maint_capa, AVG(main_capa) AS average_main_capa, AVG(multi_set_up_capa) AS average_multi_set_up_capa, AVG(multi_maint_capa) AS average_multi_maint_capa, AVG(multi_capa) AS average_multi_capa, AVG(total_capa) AS average_total_capa FROM Users WHERE status = 'A'`;
  let Params = [];

  if (group) {
      Query += ` AND \`group\` = ?`;
      Params.push(group);
  }
  if (site) {
      Query += ` AND site = ?`;
      Params.push(site);
  }
  if (level) {
      Query += ` AND level = ?`;
      Params.push(level);
  }
  if (nickname) {
      Query += ` AND nickname LIKE ?`;
      Params.push(`%${nickname}%`);
  }

  const [rows] = await connection.query(Query, Params);
  return rows[0];
};