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


exports.selectRestaurants = async function (connection, category) {
  const selectAllRestaurantsQuery = `SELECT title, address, category, videoUrl FROM Restaurants where status = 'A';`;
  const selectCategorizedRestaurantsQuery = `SELECT title, address, category, videoUrl FROM Restaurants where status = 'A' and category = ?;`;

  const Params = [category];

  const Query = category
    ? selectCategorizedRestaurantsQuery
    : selectAllRestaurantsQuery;

  const rows = await connection.query(Query, Params);

  return rows;
};

exports.deleteStudent = async function (connection, studentIdx) {
  const Query = `update Students set status = "D" where studentIdx = ?;`;
  const Params = [studentIdx];

  const rows = await connection.query(Query, Params);

  return rows;
};

exports.updateStudents = async function (
  connection,
  studentIdx,
  studentName,
  major,
  birth,
  address
) {
  const Query = `update Students set studentName = ifnull(?, studentName), major = ifnull(?, major), birth = ifnull(?, birth), address = ifnull(?, address) where studentIdx = ?;`;
  const Params = [studentName, major, birth, address, studentIdx];

  const rows = await connection.query(Query, Params);

  return rows;
};

exports.isValidStudentIdx = async function (connection, studentIdx) {
  const Query = `SELECT * FROM Students where studentIdx = ? and status = 'A';`;
  const Params = [studentIdx];

  const [rows] = await connection.query(Query, Params);

  if (rows < 1) {
    return false;
  }

  return true;
};

exports.insertStudents = async function (
  connection,
  studentName,
  major,
  birth,
  address
) {
  const Query = `insert into Students(studentName, major, birth, address) values (?,?,?,?);`;
  const Params = [studentName, major, birth, address];

  const rows = await connection.query(Query, Params);

  return rows;
};

exports.selectStudents = async function (connection, studentIdx) {
  const Query = `SELECT * FROM Students where studentIdx = ?;`;
  const Params = [studentIdx];

  const rows = await connection.query(Query, Params);

  return rows;
};

exports.exampleDao = async function (connection) {
  const Query = `SELECT * FROM Students;`;
  const Params = [];

  const rows = await connection.query(Query, Params);

  return rows;
};

exports.getAverageInfo = async function (connection, group, site, level) {
  let filterQuery = 'WHERE status = "A"';
  const params = [];

  if (group) {
      filterQuery += ' AND `group` = ?';
      params.push(group);
  }

  if (site) {
      filterQuery += ' AND site = ?';
      params.push(site);
  }

  if (level) {
      filterQuery += ' AND level = ?';
      params.push(level);
  }

  const Query = `
      SELECT 
          AVG(level) as avg_level,
          COUNT(*) as total_users,
          AVG(main_set_up_capa) as avg_main_set_up_capa,
          AVG(main_maint_capa) as avg_main_maint_capa,
          AVG(main_capa) as avg_main_capa,
          AVG(multi_set_up_capa) as avg_multi_set_up_capa,
          AVG(multi_maint_capa) as avg_multi_maint_capa,
          AVG(multi_capa) as avg_multi_capa,
          AVG(total_capa) as avg_total_capa,
          SUM(CASE WHEN level = 0 THEN 1 ELSE 0 END) as level_0,
          SUM(CASE WHEN level = 1 THEN 1 ELSE 0 END) as level_1,
          SUM(CASE WHEN level = 2 THEN 1 ELSE 0 END) as level_2,
          SUM(CASE WHEN level = 3 THEN 1 ELSE 0 END) as level_3,
          SUM(CASE WHEN level = 4 THEN 1 ELSE 0 END) as level_4
      FROM Users
      ${filterQuery};
  `;

  const [rows] = await connection.query(Query, params);
  return rows[0];
};
