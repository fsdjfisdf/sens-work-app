const axios = require("axios");
const AIDao = require("../dao/AIDao");
const secrets = require("../../config/secret");

const AIController = {
  async processQuery(req, res) {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({ error: "Question is required." });
    }

    try {
      // OpenAI API 호출: 질문 -> SQL 쿼리 변환
      const chatResponse = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: `
                You are a SQL and data analysis expert working with the 'work_log' table in the 'work_log_db' database.
                Your job is to generate a SQL query based on the user's question and analyze the results to create a conversational response.
                Provide both the SQL query and a natural language explanation of the results.
              `,
            },
            { role: "user", content: `Convert this question into an SQL query: "${question}"` },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${secrets.openaiApiKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      let sqlQuery = chatResponse.data.choices[0].message.content.trim();

      // 순수 SQL만 추출
      sqlQuery = sqlQuery.replace(/```sql|```/g, "").trim();
      console.log("Generated SQL Query:", sqlQuery);

      // SQL 쿼리 실행
      const queryResult = await AIDao.executeSQL(sqlQuery);

      // OpenAI API 호출: 결과를 기반으로 대화형 응답 생성
      const explanationResponse = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: `
                You are a helpful assistant analyzing SQL query results.
                Based on the given data, provide a meaningful, conversational response to the user's question.
              `,
            },
            {
              role: "user",
              content: `
                Question: "${question}"
                SQL Query: "${sqlQuery}"
                Query Results: ${JSON.stringify(queryResult)}
              `,
            },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${secrets.openaiApiKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      const naturalResponse = explanationResponse.data.choices[0].message.content.trim();

      res.status(200).json({
        question,
        sqlQuery,
        result: queryResult,
        naturalResponse,
      });
    } catch (error) {
      console.error("Error processing query:", error.message);
      res.status(500).json({ error: "Failed to process the query." });
    }
  },
};

module.exports = AIController;
