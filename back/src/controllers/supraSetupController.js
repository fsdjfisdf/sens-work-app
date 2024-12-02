const supraSetupDao = require('../dao/supraSetupDao');
const jwt = require('jsonwebtoken');
const secret = require('../../config/secret');

exports.saveChecklist = async (req, res) => {
  const checklistData = req.body;

  const token = req.headers['x-access-token'];
  if (!token) {
    return res.status(401).json({ message: 'Token is missing' });
  }

  try {
    const decoded = jwt.verify(token, secret.jwtsecret);
    const userId = decoded.userIdx;

    const user = await supraSetupDao.getUserById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    checklistData.name = user.nickname;

    // 결재 상태를 Pending으로 설정
    checklistData.approvalStatus = 'Pending'; // 새로 추가됨

    const existingEntry = await supraSetupDao.findByName(checklistData.name);
    if (existingEntry) {
      await supraSetupDao.updateChecklist(checklistData);
    } else {
      await supraSetupDao.insertChecklist(checklistData);
    }

    res.status(201).json({ message: 'Checklist saved successfully and pending approval.' });
  } catch (err) {
    console.error('Error saving checklist:', err);
    res.status(500).json({ error: 'Error saving checklist' });
  }
};

exports.approveChecklist = async (req, res) => {
  const { name } = req.params; // SUPRA_SETUP의 name
  const { status } = req.body; // Approved 또는 Rejected
  const token = req.headers['x-access-token'];

  if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
  }

  if (!token) {
      return res.status(401).json({ message: 'Token is missing' });
  }

  try {
      const decoded = jwt.verify(token, secret.jwtsecret);
      const approverId = decoded.userIdx;

      // 결재자 정보 확인
      const approver = await supraSetupDao.getUserById(approverId);
      if (!approver) {
          return res.status(403).json({ message: 'Approver not found' });
      }

      // 결재 상태 업데이트
      const approvalDate = new Date();
      await supraSetupDao.updateApprovalStatusByName(name, status, approver.nickname, approvalDate);

      res.status(200).json({
          message: `Checklist ${status.toLowerCase()} successfully.`,
          updatedData: {
              name,
              status,
              approver: approver.nickname,
              approvalDate,
          },
      });
  } catch (err) {
      console.error('Error approving checklist:', err);
      res.status(500).json({ error: 'Error approving checklist' });
  }
};

exports.getPendingApprovals = async (req, res) => {
  try {
    const pendingApprovals = await supraSetupDao.getPendingChecklists();
    res.status(200).json(pendingApprovals);
  } catch (err) {
    console.error('Error retrieving pending approvals:', err);
    res.status(500).json({ error: 'Error retrieving pending approvals' });
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
