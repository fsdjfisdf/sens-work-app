const { pool } = require('../../config/database');

exports.getBusinessData = async (filters = {}) => {
    const connection = await pool.getConnection(async (conn) => conn);

    try {
        let query = `
            SELECT
                id,
                NAME,
                COMPANY,
                \`GROUP\`,
                SITE,
                COUNTRY,
                CITY,
                CUSTOMER,
                EQUIPMENT,
                TRIP_REASON,
                START_DATE,
                END_DATE,
                created_at,
                updated_at,
                DATEDIFF(END_DATE, START_DATE) + 1 AS trip_days
            FROM BUSINESS_TRIP
        `;
        const conditions = [];
        const values = [];

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
        if (filters.tripReason) {
            conditions.push('TRIP_REASON = ?');
            values.push(filters.tripReason);
        }

        if (filters.dateFrom && filters.dateTo) {
            conditions.push('END_DATE >= ? AND START_DATE <= ?');
            values.push(filters.dateFrom, filters.dateTo);
        } else if (filters.dateFrom) {
            conditions.push('END_DATE >= ?');
            values.push(filters.dateFrom);
        } else if (filters.dateTo) {
            conditions.push('START_DATE <= ?');
            values.push(filters.dateTo);
        }

        if (conditions.length > 0) {
            query += ` WHERE ${conditions.join(' AND ')}`;
        }

        query += ' ORDER BY START_DATE DESC, id DESC';

        const [rows] = await connection.query(query, values);
        return rows;
    } catch (err) {
        throw new Error(`Error retrieving business data: ${err.message}`);
    } finally {
        connection.release();
    }
};

exports.addBusinessData = async (data) => {
    const connection = await pool.getConnection(async (conn) => conn);

    try {
        const query = `
            INSERT INTO BUSINESS_TRIP (
                NAME,
                COMPANY,
                \`GROUP\`,
                SITE,
                COUNTRY,
                CITY,
                CUSTOMER,
                EQUIPMENT,
                TRIP_REASON,
                START_DATE,
                END_DATE
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const [result] = await connection.query(query, [
            data.name,
            data.company,
            data.group,
            data.site,
            data.country,
            data.city,
            data.customer,
            data.equipment,
            data.tripReason,
            data.startDate,
            data.endDate
        ]);

        return result;
    } catch (err) {
        throw new Error(`Error adding business data: ${err.message}`);
    } finally {
        connection.release();
    }
};

exports.updateBusinessData = async (id, data) => {
    const connection = await pool.getConnection(async (conn) => conn);

    try {
        const query = `
            UPDATE BUSINESS_TRIP
            SET
                NAME = ?,
                COMPANY = ?,
                \`GROUP\` = ?,
                SITE = ?,
                COUNTRY = ?,
                CITY = ?,
                CUSTOMER = ?,
                EQUIPMENT = ?,
                TRIP_REASON = ?,
                START_DATE = ?,
                END_DATE = ?
            WHERE id = ?
        `;

        const [result] = await connection.query(query, [
            data.name,
            data.company,
            data.group,
            data.site,
            data.country,
            data.city,
            data.customer,
            data.equipment,
            data.tripReason,
            data.startDate,
            data.endDate,
            id
        ]);

        return result;
    } catch (err) {
        throw new Error(`Error updating business data: ${err.message}`);
    } finally {
        connection.release();
    }
};

exports.deleteBusinessData = async (id) => {
    const connection = await pool.getConnection(async (conn) => conn);

    try {
        const [result] = await connection.query('DELETE FROM BUSINESS_TRIP WHERE id = ?', [id]);
        return result;
    } catch (err) {
        throw new Error(`Error deleting business data: ${err.message}`);
    } finally {
        connection.release();
    }
};
