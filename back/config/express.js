const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const { pool } = require('./database');
const { logger } = require('./winston');

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../../front')));






app.post('/log', async (req, res) => {
  logger.info('POST /log 요청 수신됨');
  const { task_name, worker, task_result, task_cause, task_description, task_date, start_time, end_time, group, site, line, equipment_type, equipment_name } = req.body;

  // 누락된 필드에 기본값 설정
  const taskDescription = task_description || '';
  const taskDate = task_date || '1970-01-01';
  const startTime = start_time || '00:00:00';
  const endTime = end_time || '00:00:00';
  const taskGroup = group || 'SELECT';
  const taskSite = site || 'SELECT';
  const taskLine = line || 'SELECT';
  const taskEquipmentType = equipment_type || 'SELECT';
  const taskEquipmentName = equipment_name || '';
  
  // 수정된 데이터 로그 출력
  logger.info('수정된 요청 데이터:', { task_name, worker, task_result, task_cause, taskDescription, taskDate, startTime, endTime, taskGroup, taskSite, taskLine, taskEquipmentType, taskEquipmentName });

  try {
    const query = `
      INSERT INTO work_log 
      (task_name, worker, task_result, task_cause, task_description, task_date, start_time, end_time, \`group\`, site, \`line\`, equipment_type, equipment_name) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [task_name, worker, task_result, task_cause, taskDescription, taskDate, startTime, endTime, taskGroup, taskSite, taskLine, taskEquipmentType, taskEquipmentName];
    
    // 쿼리 및 값 출력
    logger.info('실행할 쿼리:', query);
    logger.info('쿼리 값:', values);

    // 데이터베이스에 삽입
    await pool.execute(query, values);

    logger.info('작업 로그가 성공적으로 추가되었습니다.');
    res.status(200).send('작업 로그가 성공적으로 추가되었습니다.');
  } catch (err) {
    logger.error('작업 로그 추가 중 오류:', err);
    res.status(500).send('작업 로그 추가 실패.');
  }
});

app.get('/logs', async (req, res) => {
  try {
    logger.info('작업 이력 목록 요청');
    const [rows] = await pool.query('SELECT * FROM work_log');
    logger.info('작업 이력 목록:', rows);
    res.status(200).json(rows);
  } catch (err) {
    logger.error('작업 이력 목록을 가져오는 중 오류 발생:', err);
    res.status(500).send('작업 이력 목록을 가져오는 중 오류가 발생했습니다.');
  }
});










module.exports = app;
