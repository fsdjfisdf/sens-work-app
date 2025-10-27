const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// 공용 모델 설정
const MODELS = {
  embedding: 'text-embedding-3-small', // 가성비
  chat: 'gpt-4o-mini'                  // 요약/답변
};

module.exports = { openai, MODELS };
