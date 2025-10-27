const OpenAI = require('openai');
const secret = require('./secret');
const openai = new OpenAI({
  apiKey: secret.openai_api_key
});


// 공용 모델 설정
const MODELS = {
  embedding: 'text-embedding-3-small', // 가성비
  chat: 'gpt-4o-mini'                  // 요약/답변
};

module.exports = { openai, MODELS };

