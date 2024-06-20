const supraMaintenanceDao = require('../dao/supraMaintenanceDao');
const jwt = require('jsonwebtoken');
const secret = require('../../config/secret');

exports.getChecklist = async (req, res) => {
  const token = req.headers['x-access-token'];
  if (!token) {
    return res.status(401).json({ message: 'Token is missing' });
  }

  try {
    const decoded = jwt.verify(token, secret.jwtsecret);
    const userId = decoded.userIdx;

    const user = await supraMaintenanceDao.getUserById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const checklist = await supraMaintenanceDao.findByName(user.nickname);
    res.status(200).json(checklist);
  } catch (err) {
    console.error('Error retrieving checklist:', err);
    res.status(500).json({ error: 'Error retrieving checklist' });
  }
};

exports.saveChecklist = async (req, res) => {
  const checklistData = req.body;

  const token = req.headers['x-access-token'];
  if (!token) {
    return res.status(401).json({ message: 'Token is missing' });
  }

  try {
    const decoded = jwt.verify(token, secret.jwtsecret);
    const userId = decoded.userIdx;

    const user = await supraMaintenanceDao.getUserById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    checklistData.name = user.nickname;

    await supraMaintenanceDao.saveChecklist(checklistData);

    res.status(201).json({ message: 'Checklist saved successfully' });
  } catch (err) {
    console.error('Error saving checklist:', err);
    res.status(500).json({ error: 'Error saving checklist' });
  }
};
