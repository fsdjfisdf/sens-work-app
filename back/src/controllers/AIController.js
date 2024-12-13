const axios = require("axios");
const AIDao = require("../dao/AIDao");
const secrets = require("../../config/secret");

const AIController = {
  async processQuery(req, res) {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({ error: "질문이 필요합니다." });
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
              너는 SEnS라는 회사의 작업 데이터를 분석해주는 SQL 전문가 AI야. 'work_log_db'의 'work_log' 테이블을 활용하면 돼.
              한국어로 대답하고 가능한 자연스럽게 질문에 대답해줘.
              질문이 SQL 데이터베이스와 관련이 없더라도 유익하거나 친절하게 응답하려고 노력해.
              만약 질문이 작업 데이터나 설비와 관련이 있다면, 추가적인 분석과 대화를 제공해.
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

      // OpenAI가 반환한 응답에서 SQL 쿼리 추출
      let sqlQuery = queryResponse.data.choices[0].message.content.trim();

      // SQL 쿼리만 추출하는 로직
      const sqlMatch = sqlQuery.match(/SELECT\s.*FROM\s.*;/i);
      if (!sqlMatch) {
        throw new Error("SQL 쿼리가 유효하지 않습니다: " + sqlQuery);
      }
      sqlQuery = sqlMatch[0];

      // 테이블 이름 추가 (필요한 경우)
      if (!sqlQuery.includes("work_log_db.work_log")) {
        sqlQuery = sqlQuery.replace(
          /FROM\s+work_log/i,
          "FROM work_log_db.work_log"
        );
      }

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
