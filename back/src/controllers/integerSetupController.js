const integerSetupDao = require('../dao/integerSetupDao');
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
    const user = await integerSetupDao.getUserById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // 사용자 nickname을 checklistData에 추가
    checklistData.name = user.nickname;

    // 체크리스트 저장 또는 업데이트
    const existingEntry = await integerSetupDao.findByName(checklistData.name);
    if (existingEntry) {
      await integerSetupDao.updateChecklist(checklistData);
    } else {
      await integerSetupDao.insertChecklist(checklistData);
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
    const user = await integerSetupDao.getUserById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const checklist = await integerSetupDao.getChecklistByName(user.nickname);
    if (!checklist) {
      return res.status(404).json({ message: 'Checklist not found' });
    }

    res.status(200).json(checklist);
  } catch (err) {
    console.error('Error retrieving checklist:', err);
    res.status(500).json({ error: 'Error retrieving checklist' });
  }
};


exports.getAllChecklists = async (req, res) => {
  try {
      const checklists = await integerSetupDao.getAllChecklists();  // DAO에서 모든 작업 데이터를 가져오는 함수 호출
      res.status(200).json(checklists);
  } catch (err) {
      console.error('Error retrieving all checklists:', err);
      res.status(500).json({ error: 'Error retrieving checklists' });
  }
};

exports.getIntegerSetupData = async (req, res) => {
  try {
    // INTEGER_SETUP 테이블에서 데이터를 가져오는 함수 호출
    const data = await integerSetupDao.getAllIntegerSetupData(); 
    res.status(200).json(data);  // 데이터를 클라이언트에 반환
  } catch (err) {
    console.error('Error retrieving INTEGER_SETUP data:', err);
    res.status(500).json({ error: 'Error retrieving INTEGER_SETUP data' });
  }
};
