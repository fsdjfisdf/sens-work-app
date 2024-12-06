const { pool } = require('../../config/database');

// 출장 데이터 조회
exports.getBusinessData = async () => {
    const connection = await pool.getConnection(async conn => conn);
    try {
        const [rows] = await connection.query('SELECT * FROM BUSINESS_TRIP ORDER BY START_DATE DESC');
        connection.release();
        return rows;
    } catch (err) {
        connection.release();
        throw new Error(`Error retrieving business data: ${err.message}`);
    }
};

// 출장 데이터 추가
exports.addBusinessData = async (data) => {
    const { name, company, group, site, country, city, customer, equipment, startDate, endDate } = data;

    const connection = await pool.getConnection(async conn => conn);
    try {
        const query = `
            INSERT INTO BUSINESS_TRIP (NAME, COMPANY, \`GROUP\`, SITE, COUNTRY, CITY, CUSTOMER, EQUIPMENT, START_DATE, END_DATE)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const [result] = await connection.query(query, [name, company, group, site, country, city, customer, equipment, startDate, endDate]);
        connection.release();
        return result;
    } catch (err) {
        connection.release();
        throw new Error(`Error adding business data: ${err.message}`);
    }
};

// 출장 데이터 수정
exports.updateBusinessData = async (id, data) => {
    const { name, company, group, site, country, city, customer, equipment, startDate, endDate } = data;

    const connection = await pool.getConnection(async conn => conn);
    try {
        const query = `
            UPDATE BUSINESS_TRIP
            SET NAME = ?, COMPANY = ?, \`GROUP\` = ?, SITE = ?, COUNTRY = ?, CITY = ?, CUSTOMER = ?, EQUIPMENT = ?, START_DATE = ?, END_DATE = ?
            WHERE id = ?
        `;
        const [result] = await connection.query(query, [name, company, group, site, country, city, customer, equipment, startDate, endDate, id]);
        connection.release();
        return result;
    } catch (err) {
        connection.release();
        throw new Error(`Error updating business data: ${err.message}`);
    }
};

// 출장 데이터 삭제
exports.deleteBusinessData = async (id) => {
    const connection = await pool.getConnection(async conn => conn);
    try {
        const query = 'DELETE FROM BUSINESS_TRIP WHERE id = ?';
        const [result] = await connection.query(query, [id]);
        connection.release();
        return result;
    } catch (err) {
        connection.release();
        throw new Error(`Error deleting business data: ${err.message}`);
    }
};
