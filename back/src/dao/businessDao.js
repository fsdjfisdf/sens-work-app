const { pool } = require('../../config/database');

// 출장 데이터 조회
exports.getBusinessData = async (filters = {}) => {
    const connection = await pool.getConnection(async conn => conn);
    try {
        let query = 'SELECT * FROM BUSINESS_TRIP';
        const conditions = [];
        const values = [];

        // 필터 조건 추가
        if (filters.name) {
            conditions.push('NAME LIKE ?');
            values.push(`%${filters.name}%`);
        }
        if (filters.group) {
            conditions.push('`GROUP` = ?');
            values.push(filters.group);
        }
        if (filters.site) {
            conditions.push('SITE = ?');
            values.push(filters.site);
        }
        if (filters.country) {
            conditions.push('COUNTRY = ?');
            values.push(filters.country);
        }
        if (filters.city) {
            conditions.push('CITY = ?');
            values.push(filters.city);
        }
        if (filters.customer) {
            conditions.push('CUSTOMER = ?');
            values.push(filters.customer);
        }
        if (filters.equipment) {
            conditions.push('EQUIPMENT = ?');
            values.push(filters.equipment);
        }

        if (conditions.length > 0) {
            query += ` WHERE ${conditions.join(' AND ')}`;
        }
        query += ' ORDER BY id ASC'; // ID 순서로 정렬

        const [rows] = await connection.query(query, values);
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
