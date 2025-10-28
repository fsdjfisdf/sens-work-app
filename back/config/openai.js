// back/config/openai.js
const OpenAI = require('openai');
const secret = require('./secret');

// OpenAI SDK v4
const openai = new OpenAI({ apiKey: secret.openai_api_key });

const MODELS = {
  embedding: 'text-embedding-3-small', // 가성비 임베딩
  chat: 'gpt-4o-mini',                 // 요약/답변
};

module.exports = { openai, MODELS };
