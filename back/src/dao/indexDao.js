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

// 작업 시간 조회
exports.getWorkTimeByDate = async function (connection, startDate, endDate) {
  const query = `
    SELECT task_date, SUM(TIME_TO_SEC(task_duration)) / 3600 AS work_hours
    FROM work_log
    WHERE task_date BETWEEN ? AND ?
    GROUP BY task_date
  `;
  const params = [startDate, endDate];
  const [rows] = await connection.query(query, params);
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

exports.getAverageInfo = async function (connection, group, site, level, nickname) {
  let query = `
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
          SUM(level = 0) as level_0,
          SUM(level = 1) as level_1,
          SUM(level = 2) as level_2,
          SUM(level = 3) as level_3,
          SUM(level = 4) as level_4
      FROM Users
      WHERE status = 'A'
  `;
  const params = [];

  if (group) {
      query += " AND `group` = ?";
      params.push(group);
  }
  if (site) {
      query += " AND site IN (?)"; // multiple site filter
      params.push(site.split(','));
  }
  if (level) {
      query += " AND level = ?";
      params.push(level);
  }
  if (nickname) {
      query += " AND nickname LIKE ?";
      params.push(`%${nickname}%`);
  }

  const [rows] = await connection.query(query, params);
  return rows[0];
};


// 사용자 목록 조회
exports.getUsers = async function (connection) {
  const Query = `SELECT userID, nickname, \`group\`, site, level FROM Users WHERE status = 'A';`;
  const [rows] = await connection.query(Query);
  return rows;
};


exports.getDailyOperationRates = async function (connection, group, site, startDate, endDate) {
  const query = `
    SELECT 
      task_date,
      SUM(TIMESTAMPDIFF(MINUTE, start_time, end_time) * (LENGTH(task_man) - LENGTH(REPLACE(task_man, ',', '')) + 1)) AS total_minutes,
      COUNT(DISTINCT task_date) AS unique_dates,
      (SELECT COUNT(*) FROM Users WHERE status = 'A' AND \`group\` = ? AND site = ?) AS total_engineers
    FROM work_log
    WHERE \`group\` = ? AND site = ? AND task_date BETWEEN ? AND ?
    GROUP BY task_date
  `;
  const params = [group, site, group, site, startDate, endDate];

  const [rows] = await connection.query(query, params);
  return rows;
};
