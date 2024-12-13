const axios = require("axios");
const AIDao = require("../dao/AIDao");
const secrets = require("../../config/secret");

const AIController = {
  async processQuery(req, res) {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({ error: "질문이 필요합니다." });
    }

    // 일반적인 질문 처리
    if (!question.includes("설비") && !question.includes("작업") && !question.includes("데이터")) {
      const generalResponse = handleGeneralQuestion(question);
      return res.status(200).json({
        question,
        response: generalResponse,
      });
    }

    try {
      // OpenAI API를 통해 SQL 쿼리 생성
      const queryResponse = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: `
You are an SQL expert working with the 'work_log' table in the 'work_log_db' database. 
Your task is to analyze user queries and generate accurate SQL queries. Additionally, you analyze the SQL query results to create conversational responses. 
The 'work_log' table contains the following columns:
- id: int (Primary Key)
- task_name: varchar(255) (Title of the task)
- task_date: date (Date of the task)
- task_man: varchar(255) (Comma-separated list of workers)
- group: varchar(255) (Group)
- site: varchar(255) (Site)
- line: varchar(255) (Line)
- equipment_type: varchar(255) (Equipment type)
- equipment_name: varchar(255) (Equipment name)
- task_description: text (Description of the task)
- task_cause: varchar(255) (Cause of the task)
- task_result: varchar(255) (Result of the task)
- task_duration: time (Task duration)
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

      // 생성된 SQL 쿼리
      let sqlQuery = queryResponse.data.choices[0].message.content.trim();
      sqlQuery = sqlQuery.replace(/```sql|```/g, "").trim();
      sqlQuery = sqlQuery.replace(/.*SELECT/i, "SELECT").replace(/;.*/, ";").trim();

      console.log("Generated SQL Query:", sqlQuery);

      // SQL 쿼리 실행
      const queryResult = await AIDao.executeSQL(sqlQuery);

      // OpenAI를 사용하여 데이터 분석 및 대화형 응답 생성
      const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: `
              You are an assistant that analyzes work log data and generates conversational responses based on the input.
              The data comes from a database and may include tasks performed by engineers, equipment names, and task descriptions.
              Always provide a user-friendly and conversational explanation of the data.
              `,
            },
            {
              role: "user",
              content: `
              Here is the query result:
              SQL Query: ${sqlQuery}
              Result: ${JSON.stringify(queryResult)}
              
              Summarize and provide a conversational response for the question "${question}".
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

      // OpenAI의 대화형 응답
      const aiResponse = response.data.choices[0].message.content;

      res.status(200).json({
        question,
        sqlQuery,
        result: aiResponse,
      });
    } catch (error) {
      console.error("Error processing query:", error.message);
      res.status(500).json({ error: "질문을 처리하는 중 오류가 발생했습니다." });
    }
  },
};

module.exports = AIController;
