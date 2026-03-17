const businessDao = require('../dao/businessDao');

const ALLOWED_TRIP_REASONS = ['SET UP', 'MAINT', 'SET UP&MAINT', 'GTS'];

function normalizeBody(body = {}) {
    return {
        name: String(body.name || '').trim(),
        company: String(body.company || '').trim(),
        group: String(body.group || '').trim(),
        site: String(body.site || '').trim(),
        country: String(body.country || '').trim(),
        city: String(body.city || '').trim(),
        customer: String(body.customer || '').trim(),
        equipment: String(body.equipment || '').trim(),
        tripReason: String(body.tripReason || body.reason || '').trim(),
        startDate: String(body.startDate || '').trim(),
        endDate: String(body.endDate || '').trim()
    };
}

function validatePayload(payload) {
    const requiredFields = ['name', 'company', 'group', 'site', 'country', 'city', 'customer', 'equipment', 'tripReason', 'startDate', 'endDate'];
    const missingField = requiredFields.find((field) => !payload[field]);

    if (missingField) {
        return `${missingField} 값이 비어 있습니다.`;
    }

    if (!ALLOWED_TRIP_REASONS.includes(payload.tripReason)) {
        return 'tripReason 값이 올바르지 않습니다.';
    }

    if (payload.endDate < payload.startDate) {
        return '종료일은 시작일보다 빠를 수 없습니다.';
    }

    return null;
}

exports.getBusinessData = async (req, res) => {
    try {
        const data = await businessDao.getBusinessData(req.query || {});
        res.status(200).json(data);
    } catch (err) {
        console.error('Error retrieving business data:', err.message);
        res.status(500).json({ error: err.message });
    }
};

exports.addBusinessData = async (req, res) => {
    const payload = normalizeBody(req.body);
    const validationError = validatePayload(payload);

    if (validationError) {
        return res.status(400).json({ error: validationError });
    }

    try {
        const result = await businessDao.addBusinessData(payload);
        res.status(201).json({ message: 'Business data added successfully', id: result.insertId });
    } catch (err) {
        console.error('Error adding business data:', err.message);
        res.status(500).json({ error: err.message });
    }
};

exports.updateBusinessData = async (req, res) => {
    const id = Number(req.params.id);
    const payload = normalizeBody(req.body);
    const validationError = validatePayload(payload);

    if (validationError) {
        return res.status(400).json({ error: validationError });
    }

    try {
        const result = await businessDao.updateBusinessData(id, payload);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'No business data found with the specified ID' });
        }
        res.status(200).json({ message: 'Business data updated successfully' });
    } catch (err) {
        console.error('Error updating business data:', err.message);
        res.status(500).json({ error: err.message });
    }
};

exports.deleteBusinessData = async (req, res) => {
    const id = Number(req.params.id);

    try {
        const result = await businessDao.deleteBusinessData(id);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'No business data found with the specified ID' });
        }
        res.status(200).json({ message: 'Business data deleted successfully' });
    } catch (err) {
        console.error('Error deleting business data:', err.message);
        res.status(500).json({ error: err.message });
    }
};
