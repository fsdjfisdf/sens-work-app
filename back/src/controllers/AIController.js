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
      const chatResponse = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: `
                You are an AI assistant that interacts with the 'work_log' database. 
                Answer user questions in a conversational and clear manner, based on the database results.
                The database table has these columns: id, task_name, task_date, task_man, group, site, 
                line, equipment_type, warranty, equipment_name, status, task_description, task_cause, 
                task_result, SOP, tsguide, work_type, setup_item, maint_item, transfer_item, task_duration, 
                start_time, end_time, none_time, move_time, task_maint.
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
      sqlQuery = sqlQuery.replace(/```sql|```/g, "").trim(); // 포맷 제거

      console.log("Generated SQL Query:", sqlQuery);

      // SQL 쿼리 실행
      const queryResult = await AIDao.executeSQL(sqlQuery);

      // OpenAI를 이용하여 대화형 응답 생성
      const responseMessage = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: `
                You are an AI assistant. Based on the following database query result, explain it in a conversational format:
                ${JSON.stringify(queryResult, null, 2)}
              `,
            },
            { role: "user", content: `Explain the result of this query: "${sqlQuery}"` },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${secrets.openaiApiKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      const conversationalResponse = responseMessage.data.choices[0].message.content.trim();

      res.status(200).json({
        question,
        sqlQuery,
        result: queryResult,
        explanation: conversationalResponse,
      });
    } catch (error) {
      console.error("Error processing query:", error.message);
      res.status(500).json({ error: "Failed to process the query." });
    }
  },
};

module.exports = AIController;
