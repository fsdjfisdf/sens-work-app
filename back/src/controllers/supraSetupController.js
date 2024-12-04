const supraSetupDao = require('../dao/supraSetupDao');
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
    const user = await supraSetupDao.getUserById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // 사용자 nickname을 checklistData에 추가
    checklistData.name = user.nickname;

    // 체크리스트 저장 또는 업데이트
    const existingEntry = await supraSetupDao.findByName(checklistData.name);
    if (existingEntry) {
      await supraSetupDao.updateChecklist(checklistData);
    } else {
      await supraSetupDao.insertChecklist(checklistData);
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
    const user = await supraSetupDao.getUserById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const checklist = await supraSetupDao.getChecklistByName(user.nickname);
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
      const checklists = await supraSetupDao.getAllChecklists();  // DAO에서 모든 작업 데이터를 가져오는 함수 호출
      res.status(200).json(checklists);
  } catch (err) {
      console.error('Error retrieving all checklists:', err);
      res.status(500).json({ error: 'Error retrieving checklists' });
  }
};

exports.getSupraSetupData = async (req, res) => {
  try {
    // SUPRA_SETUP 테이블에서 데이터를 가져오는 함수 호출
    const data = await supraSetupDao.getAllSupraSetupData(); 
    res.status(200).json(data);  // 데이터를 클라이언트에 반환
  } catch (err) {
    console.error('Error retrieving SUPRA_SETUP data:', err);
    res.status(500).json({ error: 'Error retrieving SUPRA_SETUP data' });
  }
};


exports.requestApproval = async (req, res) => {
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

    await supraMaintenanceDao.insertApprovalRequest(checklistData);

    res.status(201).json({ message: 'Approval request submitted successfully' });
  } catch (err) {
    console.error('Error submitting approval request:', err);
    res.status(500).json({ error: 'Error submitting approval request' });
  }
};

exports.approveChecklist = async (req, res) => {
  const { id, status } = req.body;

  try {
    const approvalRequest = await supraMaintenanceDao.getApprovalRequestById(id);
    if (!approvalRequest) {
      return res.status(404).json({ message: 'Approval request not found' });
    }

    if (status === 'approved') {
      await supraMaintenanceDao.saveChecklist(JSON.parse(approvalRequest.checklist_data));
      await supraMaintenanceDao.deleteApprovalRequest(id);
      res.status(200).json({ message: 'Checklist approved and saved' });
    } else if (status === 'rejected') {
      await supraMaintenanceDao.updateApprovalStatus(id, 'rejected');
      res.status(200).json({ message: 'Checklist rejected' });
    } else {
      res.status(400).json({ message: 'Invalid status' });
    }
  } catch (err) {
    console.error('Error approving/rejecting checklist:', err);
    res.status(500).json({ error: 'Error approving/rejecting checklist' });
  }
};
