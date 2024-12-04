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

    // 가장 최신 데이터를 가져옴
    const latestChecklist = await supraMaintenanceDao.getLatestChecklistByName(user.nickname);
    if (!latestChecklist) {
      return res.status(404).json({ message: 'Checklist not found' });
    }

    res.status(200).json(latestChecklist); // 최신 데이터를 반환
  } catch (err) {
    console.error('Error retrieving checklist:', err);
    res.status(500).json({ error: 'Error retrieving checklist' });
  }
};


// 모든 사용자 체크리스트 불러오기 (새로운 기능 추가)
exports.getAllChecklists = async (req, res) => {
  try {
    // 모든 체크리스트 데이터를 가져오는 Dao 함수 호출
    const allChecklists = await supraMaintenanceDao.getAllChecklists();
    if (!allChecklists || allChecklists.length === 0) {
      return res.status(404).json({ message: 'No checklist data found' });
    }

    res.status(200).json(allChecklists); // 모든 사용자 데이터를 반환
  } catch (err) {
    console.error('Error retrieving all checklists:', err);
    res.status(500).json({ error: 'Error retrieving all checklists' });
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
    // 1. 승인 요청 데이터 가져오기
    const approvalRequest = await supraMaintenanceDao.getApprovalRequestById(id);
    if (!approvalRequest) {
      return res.status(404).json({ message: 'Approval request not found' });
    }

    if (status === 'approved') {
      let checklistData = approvalRequest.checklist_data;

      // 2. JSON 데이터 파싱 (필요 시)
      if (typeof checklistData === 'string') {
        checklistData = JSON.parse(checklistData);
      }

      // 3. 누락된 값 설정
      checklistData.approver_name = checklistData.approver_name || '관리자'; // 관리자 이름
      checklistData.approval_status = 'approved';
      checklistData.approval_date = new Date();

      // 4. 데이터 저장
      try {
        await supraMaintenanceDao.saveChecklist(checklistData);
        await supraMaintenanceDao.deleteApprovalRequest(id); // 승인 완료 후 삭제

        res.status(200).json({ message: 'Checklist approved and saved' });
      } catch (err) {
        console.error('Error saving checklist:', err);
        res.status(500).json({ message: 'Error saving checklist data' });
      }
    } else if (status === 'rejected') {
      // 5. 반려 처리
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



exports.getApprovalRequests = async (req, res) => {
  try {
    const approvalRequests = await supraMaintenanceDao.getAllApprovalRequests();

    if (!approvalRequests || approvalRequests.length === 0) {
      return res.status(404).json({ message: "No approval requests found" });
    }

    res.status(200).json(approvalRequests);
  } catch (err) {
    console.error("Error retrieving approval requests:", err);
    res.status(500).json({ error: "Error retrieving approval requests" });
  }
};

exports.getApprovalDetails = async (req, res) => {
  const { id } = req.params;

  try {
    const approvalRequest = await supraMaintenanceDao.getApprovalRequestById(id);

    if (!approvalRequest) {
      return res.status(404).json({ message: "Approval request not found" });
    }

    const requestedData = approvalRequest.checklist_data;

    const currentData = await supraMaintenanceDao.getChecklistByName(approvalRequest.name);

    res.status(200).json({
      currentData: currentData || {}, // 현재 데이터가 없으면 빈 객체 반환
      requestedData,
    });
  } catch (err) {
    console.error("Error retrieving approval details:", err);
    res.status(500).json({ error: "Error retrieving approval details" });
  }
};



