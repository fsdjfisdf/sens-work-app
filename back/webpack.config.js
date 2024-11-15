// webpack.config.js
const path = require('path');

module.exports = {
  mode: 'production',  // 프로덕션 모드 설정
  entry: './src/index.js',  // 엔트리 파일 설정
  output: {
    filename: 'bundle.js',  // 출력할 파일 이름 설정
    path: path.resolve(__dirname, 'dist'),  // dist 폴더에 출력
  },
  optimization: {
    minimize: true,  // 파일 압축
  },
};
