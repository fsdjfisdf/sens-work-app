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
            {
                role: "system",
                content: `
              You are a SQL expert specifically working with the 'work_log' table in the 'work_log_db' database. 
              The table has the following structure:
              
              Columns:
              - id (int, auto-increment, primary key)
              - task_name (varchar(255)): The name of the task.
              - task_date (date): The date the task was performed.
              - task_man (varchar(255)): The person responsible for the task.
              - group (varchar(255)): The group the task belongs to.
              - site (varchar(255)): The site where the task was performed.
              - line (varchar(255)): The production line involved in the task.
              - equipment_type (varchar(255)): The type of equipment.
              - warranty (varchar(255)): Warranty status.
              - equipment_name (varchar(255)): The name of the equipment.
              - status (varchar(255)): The status of the task.
              - task_description (text): A detailed description of the task.
              - task_cause (varchar(255)): The cause of the task.
              - task_result (varchar(255)): The result of the task.
              - SOP (varchar(255)): Standard Operating Procedure.
              - tsguide (varchar(255)): Technical Support Guide.
              - work_type (varchar(255)): Type of work.
              - setup_item (varchar(255)): Setup item details.
              - maint_item (varchar(255)): Maintenance item details.
              - transfer_item (varchar(255)): Transfer item details.
              - task_duration (time): Duration of the task.
              - start_time (time): Start time of the task.
              - end_time (time): End time of the task.
              - none_time (int): Non-operational time in minutes.
              - move_time (int): Movement time in minutes.
              - task_maint (varchar(255)): Maintenance-related task details.
              
              Always generate plain SQL queries without additional formatting (e.g., no markdown or code blocks). Ensure all column names match the table structure exactly. If a query cannot be resolved, provide a clear explanation and do not generate invalid SQL.
              `
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

      // 불필요한 포맷 제거 (```sql ... ```)
      sqlQuery = sqlQuery.replace(/```sql|```/g, "").trim();

      console.log("Generated SQL Query:", sqlQuery);

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
