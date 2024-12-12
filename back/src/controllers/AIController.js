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
You are an expert in analyzing work logs stored in a database. The database table is named 'work_log' with the following structure:

Columns:
- id: int (primary key)
- task_name: varchar(255) (Title of the task)
- task_date: date (Date when the task was performed)
- task_man: varchar(255) (Comma-separated list of workers who performed the task)
- group: varchar(255) (Group or department the equipment belongs to)
- site: varchar(255) (Site location of the equipment)
- line: varchar(255) (Production line related to the task)
- equipment_type: varchar(255) (Type of equipment)
- warranty: varchar(255) (Warranty status of the equipment)
- equipment_name: varchar(255) (Name of the equipment)
- status: varchar(255) (Current status of the task)
- task_description: text (Detailed description of the task)
- task_cause: varchar(255) (Reason for performing the task)
- task_result: varchar(255) (Result of the task)
- task_duration: time (Total time taken to complete the task)
- start_time: time (Start time of the task)
- end_time: time (End time of the task)
- move_time: int (Time taken to move to the work location)
- none_time: int (Time spent resting during the task)

**Your goal** is to interpret user questions and provide meaningful, conversational answers by analyzing the table data. Always use the table data to respond with insightful, user-friendly messages. When responding, do not just return raw data but craft meaningful summaries or explanations using the data.

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
