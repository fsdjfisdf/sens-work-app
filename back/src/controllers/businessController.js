const businessDao = require('../dao/businessDao');

// 출장 데이터 조회
exports.getBusinessData = async (req, res) => {
    try {
        const filters = req.query; // 검색 필터 받아오기
        const data = await businessDao.getBusinessData(filters);
        res.status(200).json(data);
    } catch (err) {
        console.error("Error retrieving business data:", err.message);
        res.status(500).json({ error: err.message });
    }
};

// 출장 데이터 추가
exports.addBusinessData = async (req, res) => {
    const { name, company, group, site, country, city, customer, equipment, startDate, endDate } = req.body;

    try {
        const result = await businessDao.addBusinessData({ name, company, group, site, country, city, customer, equipment, startDate, endDate });
        res.status(201).json({ message: 'Business data added successfully', id: result.insertId });
    } catch (err) {
        console.error("Error adding business data:", err.message);
        res.status(500).json({ error: err.message });
    }
};

// 출장 데이터 수정
exports.updateBusinessData = async (req, res) => {
    const id = req.params.id;
    const { name, company, group, site, country, city, customer, equipment, startDate, endDate } = req.body;

    try {
        const result = await businessDao.updateBusinessData(id, { name, company, group, site, country, city, customer, equipment, startDate, endDate });
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'No business data found with the specified ID' });
        }
        res.status(200).json({ message: 'Business data updated successfully' });
    } catch (err) {
        console.error("Error updating business data:", err.message);
        res.status(500).json({ error: err.message });
    }
};

// 출장 데이터 삭제
exports.deleteBusinessData = async (req, res) => {
    const id = req.params.id;

    try {
        const result = await businessDao.deleteBusinessData(id);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'No business data found with the specified ID' });
        }
        res.status(200).json({ message: 'Business data deleted successfully' });
    } catch (err) {
        console.error("Error deleting business data:", err.message);
        res.status(500).json({ error: err.message });
    }
};
