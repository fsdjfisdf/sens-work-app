const businessDao = require('../dao/businessDao');

exports.getBusinessData = async (req, res) => {
  try {
    const rows = await businessDao.getBusinessData(req.query || {});
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error retrieving business data:', error.message);
    res.status(500).json({ error: error.message });
  }
};

exports.addBusinessData = async (req, res) => {
  const payload = extractPayload(req.body || {});

  try {
    validatePayload(payload);
    const result = await businessDao.addBusinessData(payload);
    res.status(201).json({ message: 'Business trip created successfully', id: result.insertId });
  } catch (error) {
    console.error('Error adding business data:', error.message);
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

exports.updateBusinessData = async (req, res) => {
  const payload = extractPayload(req.body || {});
  const id = req.params.id;

  try {
    validatePayload(payload);
    const result = await businessDao.updateBusinessData(id, payload);
    if (!result.affectedRows) {
      return res.status(404).json({ error: 'No business trip found with the specified ID' });
    }
    res.status(200).json({ message: 'Business trip updated successfully' });
  } catch (error) {
    console.error('Error updating business data:', error.message);
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

exports.deleteBusinessData = async (req, res) => {
  const id = req.params.id;

  try {
    const result = await businessDao.deleteBusinessData(id);
    if (!result.affectedRows) {
      return res.status(404).json({ error: 'No business trip found with the specified ID' });
    }
    res.status(200).json({ message: 'Business trip deleted successfully' });
  } catch (error) {
    console.error('Error deleting business data:', error.message);
    res.status(500).json({ error: error.message });
  }
};

function extractPayload(body) {
  return {
    name: `${body.name || ''}`.trim(),
    company: `${body.company || ''}`.trim(),
    group: `${body.group || ''}`.trim(),
    site: `${body.site || ''}`.trim(),
    country: `${body.country || ''}`.trim(),
    city: `${body.city || ''}`.trim(),
    customer: `${body.customer || ''}`.trim(),
    equipment: `${body.equipment || ''}`.trim(),
    tripReason: `${body.tripReason || body.trip_reason || 'SET UP'}`.trim(),
    startDate: `${body.startDate || body.start_date || ''}`.trim(),
    endDate: `${body.endDate || body.end_date || ''}`.trim(),
  };
}

function validatePayload(payload) {
  const allowedReasons = new Set(['SET UP', 'MAINT', 'SET UP&MAINT', 'GTS']);

  if (!payload.name) throw httpError(400, 'name is required');
  if (!payload.country) throw httpError(400, 'country is required');
  if (!payload.startDate) throw httpError(400, 'startDate is required');
  if (!payload.endDate) throw httpError(400, 'endDate is required');
  if (payload.startDate > payload.endDate) throw httpError(400, 'endDate cannot be earlier than startDate');
  if (!allowedReasons.has(payload.tripReason)) throw httpError(400, 'tripReason is invalid');
}

function httpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}
