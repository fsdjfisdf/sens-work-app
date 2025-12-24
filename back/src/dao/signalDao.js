// back/src/dao/signalDao.js
const { pool } = require('../../config/database');

exports.getSignalData = async (filters = {}) => {
  const connection = await pool.getConnection(async (conn) => conn);
  try {
    const {
      eqname,
      group,
      site,
      line,
      type,
      warranty_status,
    } = filters;

    let query = 'SELECT * FROM Equipment';
    const conditions = [];
    const params = [];

    // EQNAME 부분 검색 (대소문자 무시)
    if (eqname && eqname.trim() !== '') {
      conditions.push('LOWER(EQNAME) LIKE LOWER(?)');
      params.push(`%${eqname.trim()}%`);
    }

    if (group && group.trim() !== '') {
      conditions.push('`GROUP` = ?');
      params.push(group.trim());
    }

    if (site && site.trim() !== '') {
      conditions.push('SITE = ?');
      params.push(site.trim());
    }

    if (line && line.trim() !== '') {
      conditions.push('LINE = ?');
      params.push(line.trim());
    }

    if (type && type.trim() !== '') {
      conditions.push('TYPE = ?');
      params.push(type.trim());
    }

    if (warranty_status && warranty_status.trim() !== '') {
      conditions.push('WARRANTY_STATUS = ?');
      params.push(warranty_status.trim());
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY SITE, LINE, EQNAME';

    console.log('==== [signalDao.getSignalData] Executed Query ====');
    console.log(query);
    console.log('Params:', params);

    const [rows] = await connection.query(query, params);
    connection.release();
    return rows;
  } catch (err) {
    connection.release();
    throw new Error(`Error retrieving signal data: ${err.message}`);
  }
};

exports.updateSignalData = async (eqName, info) => {
  const connection = await pool.getConnection(async (conn) => conn);
  try {
    const query = 'UPDATE Equipment SET INFO = ? WHERE LOWER(EQNAME) = LOWER(?)';
    console.log('Executing query:', query, [info, eqName]);

    const [result] = await connection.query(query, [info, eqName]);
    console.log('Query result:', result);

    if (result.affectedRows === 0) {
      console.error(`No matching EQNAME found for ${eqName}`);
      throw new Error(`No matching EQNAME found for ${eqName}`);
    }

    connection.release();
    return result;
  } catch (err) {
    console.error('Database error:', err.message);
    connection.release();
    throw new Error(`Error updating signal data: ${err.message}`);
  }
};
