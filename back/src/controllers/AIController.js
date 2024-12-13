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
              너는 SEnS 회사의 작업 데이터를 분석해주는 SQL 전문가 AI야.
              모든 SQL 쿼리는 반드시 'work_log_db.work_log' 테이블을 사용해야 하며, 정확하고 유효한 SQL 쿼리를 생성해야 한다.
              SQL 쿼리를 생성할 때 항상 'FROM work_log_db.work_log'를 사용하고, 데이터베이스를 명시적으로 지정해줘.
              질문이 SQL과 관련이 없더라도 자연스럽게 한국어로 친절한 응답을 생성해.
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

      // 항상 `work_log_db.work_log`를 사용하도록 강제
      if (!sqlQuery.includes("work_log_db.work_log")) {
        sqlQuery = sqlQuery.replace(/FROM\s+work_log/i, "FROM work_log_db.work_log");
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
              너는 SEnS라는 회사의 작업 데이터를 분석해주는 AI야.
              작업 데이터에 대해 유저 친화적인 대답을 생성하고,
              질문과 관련된 SQL 쿼리 결과를 자연스럽게 요약해줘.
                            아래는 work_log_db 데이터베이스의 work_log table에 있는 column들이야.
- id: int (Primary Key)
- task_name: varchar(255) (작업의 제목)
- task_date: date (작업이 진행된 날짜)
- task_man: varchar(255) (작업자 이름 보통 ","로 구분되며 이름 뒤에 (main)혹은 (support)가 붙어있음)
- group: varchar(255) (작업한 설비가 속한 그룹)
- site: varchar(255) (작업한 설비가 속해있는 지역)
- line: varchar(255) (작업한 설비가 속해있는 라인)
- equipment_type: varchar(255) (작업한 설비의 종류)
- equipment_name: varchar(255) (작업한 설비의 이름)
- task_description: text (작업 내용 및 액션)
- task_cause: varchar(255) (작업의 원인)
- task_result: varchar(255) (작업의 결과)
- task_duration: time (작업에 소요된 시간)
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
