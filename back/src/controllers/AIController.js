const axios = require("axios");
const AIDao = require("../dao/AIDao");
const secrets = require("../../config/secret");

const createFriendlyResponse = (rows, question) => {
  if (rows.length === 0) {
    return `죄송합니다. "${question}"에 대한 관련 작업 기록을 찾을 수 없습니다.`;
  }

  const response = rows.map((row, index) => {
    return `${index + 1}. **작업 제목**: ${row.task_name}\n` +
           `   - **작업 날짜**: ${row.task_date}\n` +
           `   - **작업 내용**: ${row.task_description || "설명 없음"}\n` +
           `   - **원인**: ${row.task_cause || "원인 정보 없음"}\n` +
           `   - **결과**: ${row.task_result || "결과 정보 없음"}\n` +
           `   - **작업 시간**: ${row.task_duration || "시간 정보 없음"}\n`;
  }).join("\n");

  return `다음은 "${question}"에 대한 작업 기록입니다:\n\n${response}`;
};

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
            {
              role: "system",
              content: `
              You are a SQL expert working with the 'work_log' table in the 'work_log_db' database. 
              The table has the following structure:

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

              When filtering by 'task_man', use the SQL function 'FIND_IN_SET' to search for a worker in the comma-separated list.
              Always generate plain SQL queries without additional formatting (e.g., no markdown or code blocks). If a query cannot be resolved, provide a clear explanation.
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

      let sqlQuery = response.data.choices[0].message.content.trim();

      // 불필요한 포맷 제거
      sqlQuery = sqlQuery.replace(/```sql|```/g, "").trim();

      console.log("Generated SQL Query:", sqlQuery);

      // SQL 쿼리 실행 및 결과 반환
      const queryResult = await AIDao.executeSQL(sqlQuery);
      const friendlyResponse = createFriendlyResponse(queryResult, question);

      res.status(200).json({
        question,
        sqlQuery,
        result: friendlyResponse,
      });
    } catch (error) {
      console.error("Error processing query:", error.message);
      res.status(500).json({ error: "Failed to process the query." });
    }
  },
};

module.exports = AIController;
