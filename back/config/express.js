const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors'); // CORS 추가
const path = require('path');
const { pool } = require('./database');
const { logger } = require('./winston');

const app = express();

// CORS 설정 추가
app.use(cors());

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../../front')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../../front', 'index.html'));
});

app.post('/log', async (req, res) => {
  logger.info('POST /log 요청 수신됨');
  const { task_name, worker, task_result, task_cause } = req.body;
  logger.info(`요청 바디: ${JSON.stringify(req.body)}`);
  try {
    const query = 'INSERT INTO work_log (task_name, worker, task_result, task_cause) VALUES (?, ?, ?, ?)';
    await pool.query(query, [task_name, worker, task_result, task_cause]);
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
    res.status(200).json(rows);
  } catch (err) {
    logger.error('작업 이력 목록을 가져오는 중 오류 발생:', err);
    res.status(500).send('작업 이력 목록을 가져오는 중 오류가 발생했습니다.');
  }
});

// 데이터베이스 연결 확인
pool.getConnection()
  .then(connection => {
    console.log('데이터베이스 연결 성공');
    connection.release();
  })
  .catch(err => {
    console.error('데이터베이스 연결 실패:', err);
  });

module.exports = app;
