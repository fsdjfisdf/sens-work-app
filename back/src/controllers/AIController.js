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
      // OpenAI API 호출
      const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: "You are a SQL expert for the `work_log` table in the `work_log_db` database. Generate only SQL queries related to this table." },
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

      const sqlQuery = response.data.choices[0].message.content.trim();

      if (!sqlQuery.toLowerCase().includes("select") || sqlQuery.endsWith(";")) {
        return res.status(400).json({
          error: "Generated SQL query is not valid or secure.",
        });
      }

      console.log("Generated SQL Query:", sqlQuery);

      // 검증 로직: SQL이 work_log 테이블과 관련된 쿼리인지 확인
      if (!/work_log/i.test(sqlQuery)) {
        return res.status(400).json({
          error: "Generated SQL query is not related to the work_log table.",
        });
      }

      // SQL 쿼리 실행 및 결과 반환
      const queryResult = await AIDao.executeSQL(sqlQuery);

      res.status(200).json({
        question,
        sqlQuery,
        result: queryResult,
      });
    } catch (error) {
      console.error("Error processing query:", error.message);
      res.status(500).json({ error: "Failed to process the query." });
    }
  },
};

module.exports = AIController;
