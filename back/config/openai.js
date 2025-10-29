// back/config/openai.js
const OpenAI = require('openai');
const secret = require('./secret');

if (!secret.openai_api_key) {
  console.warn('[openai] Missing API Key. Set secret.openai_api_key');
}

const openai = new OpenAI({ apiKey: secret.openai_api_key });

const MODELS = {
  embedding: 'text-embedding-3-small',
  chat: 'gpt-4o-mini',
};

module.exports = { openai, MODELS };
