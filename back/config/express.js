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

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../../front', 'index.html'));
});
app.post('/log', async (req, res) => {
  logger.info('POST /log 요청 수신됨');
  const { task_name, worker, task_result, task_cause, task_description, task_date, start_time, end_time } = req.body;
  logger.info('요청 데이터:', req.body);

  // 전송된 데이터 콘솔 출력
  console.log('전송 데이터:', req.body);

  try {
    const query = `
      INSERT INTO work_log 
      (task_name, worker, task_result, task_cause, task_description, task_date, start_time, end_time) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [task_name, worker, task_result, task_cause, task_description, task_date, start_time, end_time];
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
