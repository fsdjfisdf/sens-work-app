const supraMaintenanceDao = require('../dao/supraMaintenanceDao');
const jwt = require('jsonwebtoken');
const secret = require('../../config/secret');

exports.saveChecklist = async (req, res) => {
  const checklistData = req.body;

  // JWT 토큰에서 사용자 정보 추출
  const token = req.headers['x-access-token'];
  if (!token) {
    return res.status(401).json({ message: 'Token is missing' });
  }

  try {
    const decoded = jwt.verify(token, secret.jwtsecret);
    const userId = decoded.userIdx;

    // 사용자 정보 가져오기
    const user = await supraMaintenanceDao.getUserById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // 사용자 nickname을 checklistData에 추가
    checklistData.name = user.nickname;

    // 체크리스트 저장 또는 업데이트
    const existingEntry = await supraMaintenanceDao.findByName(checklistData.name);
    if (existingEntry) {
      await supraMaintenanceDao.updateChecklist(checklistData);
    } else {
      await supraMaintenanceDao.insertChecklist(checklistData);
    }

    res.status(201).json({ message: 'Checklist saved successfully' });
  } catch (err) {
    console.error('Error saving checklist:', err);
    res.status(500).json({ error: 'Error saving checklist' });
  }
};

exports.getChecklist = async (req, res) => {
  // JWT 토큰에서 사용자 정보 추출
  const token = req.headers['x-access-token'];
  if (!token) {
    return res.status(401).json({ message: 'Token is missing' });
  }

  try {
    const decoded = jwt.verify(token, secret.jwtsecret);
    const userId = decoded.userIdx;

    // 사용자 정보 가져오기
    const user = await supraMaintenanceDao.getUserById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const checklist = await supraMaintenanceDao.getChecklistByName(user.nickname);
    if (!checklist) {
      return res.status(404).json({ message: 'Checklist not found' });
    }

    res.status(200).json(checklist);
  } catch (err) {
    console.error('Error retrieving checklist:', err);
    res.status(500).json({ error: 'Error retrieving checklist' });
  }
};
