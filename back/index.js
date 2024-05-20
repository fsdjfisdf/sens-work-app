const app = require('./config/express'); // express 설정 파일을 가져옴
const port = 3001; // 여기에서 포트를 설정

app.listen(port, () => {
  console.log(`서버가 ${port} 포트에서 실행 중입니다.`);
});
