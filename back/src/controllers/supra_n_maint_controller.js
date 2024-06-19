const { pool } = require("../../config/database");
const supraNMaintDao = require("../dao/supra_n_maint_dao");

exports.createMaintSelf = async function (req, res) {
    const maintSelfData = req.body;

    try {
        const connection = await pool.getConnection(async (conn) => conn);
        try {
            const result = await supraNMaintDao.createMaintSelf(connection, maintSelfData);
            connection.release();
            return res.status(201).json({
                isSuccess: true,
                code: 201,
                message: "Maint Self data successfully created",
                result: result
            });
        } catch (err) {
            connection.release();
            console.error(`Create Maint Self Error: ${err}`);
            return res.status(500).json({
                isSuccess: false,
                code: 500,
                message: "Database error"
            });
        }
    } catch (err) {
        console.error(`Database Connection Error: ${err}`);
        return res.status(500).json({
            isSuccess: false,
            code: 500,
            message: "Database connection error"
        });
    }
};

exports.getMaintSelfByNickname = async function (req, res) {
    const { nickname } = req.params;

    try {
        const connection = await pool.getConnection(async (conn) => conn);
        try {
            const result = await supraNMaintDao.getMaintSelfByNickname(connection, nickname);
            connection.release();
            if (result.length < 1) {
                return res.status(404).json({
                    isSuccess: false,
                    code: 404,
                    message: "No Maint Self data found for the provided nickname"
                });
            }
            return res.status(200).json({
                isSuccess: true,
                code: 200,
                message: "Maint Self data successfully retrieved",
                result: result
            });
        } catch (err) {
            connection.release();
            console.error(`Get Maint Self by Nickname Error: ${err}`);
            return res.status(500).json({
                isSuccess: false,
                code: 500,
                message: "Database error"
            });
        }
    } catch (err) {
        console.error(`Database Connection Error: ${err}`);
        return res.status(500).json({
            isSuccess: false,
            code: 500,
            message: "Database connection error"
        });
    }
};
