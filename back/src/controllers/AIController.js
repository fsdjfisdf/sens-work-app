const axios = require('axios');
const AIDao = require('../dao/AIDao');
const secrets = require('../config/secret.js'); // OpenAI API 키 가져오기

const AIController = {
  async processQuery(req, res) {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({ error: 'Question is required.' });
    }

    try {
      // OpenAI API 호출
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: 'You are a SQL expert.' },
            { role: 'user', content: `Convert this question into an SQL query: "${question}"` },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${secrets.openaiApiKey}`, // secret.js에서 가져온 API 키 사용
            'Content-Type': 'application/json',
          },
        }
      );

      const sqlQuery = response.data.choices[0].message.content.trim();

      console.log('Generated SQL Query:', sqlQuery);

      // SQL 쿼리 실행 및 결과 반환
      const queryResult = await AIDao.executeSQL(sqlQuery);

      res.status(200).json({
        question,
        sqlQuery,
        result: queryResult,
      });
    } catch (error) {
      console.error('Error processing query:', error.message);
      res.status(500).json({ error: 'Failed to process the query.' });
    }
  },
};

module.exports = AIController;
