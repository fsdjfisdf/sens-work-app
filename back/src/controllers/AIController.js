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
                너는 SEnS라는 회사의 작업 데이터를 분석해주는 SQL 전문가 AI야.
                'work_log_db'의 'work_log' 테이블을 반드시 사용해야 하고,
                질문에 맞는 정확한 SQL 쿼리를 생성해.
                질문이 SQL 데이터베이스와 관련이 없더라도 유익하거나 친절하게 응답하려고 노력해.
                만약 질문이 작업 데이터나 설비와 관련이 있다면, 추가적인 분석과 대화를 제공해.
The 'work_log_db.work_log' table contains the following columns:
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

      // OpenAI가 반환한 응답
      let openaiResponse = queryResponse.data.choices[0].message.content.trim();

      // SQL 쿼리 여부 판단
      const isSQLQuery = /^SELECT\s.+FROM\s.+;/i.test(openaiResponse);

      if (isSQLQuery) {
        // SQL 쿼리만 추출
        let sqlQuery = openaiResponse
          .replace(/```sql/g, "")
          .replace(/```/g, "")
          .trim();

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
        const analysisResponse = await axios.post(
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
                질문이 SQL 데이터베이스와 관련이 없더라도 유익하거나 친절하게 응답하려고 노력해.
                만약 질문이 작업 데이터나 설비와 관련이 있다면, 추가적인 분석과 대화를 제공해.
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

        const aiResponse = analysisResponse.data.choices[0].message.content;

        return res.status(200).json({
            question,
            sqlQuery: isSQLQuery ? sqlQuery : null,
            result: isSQLQuery ? aiResponse : openaiResponse,
        });
      } else {
        // SQL 쿼리가 아닌 일반 응답 처리
        console.log("OpenAI General Response:", openaiResponse);
        return res.status(200).json({
          question,
          response: openaiResponse,
        });
      }
    } catch (error) {
      console.error("Error processing query:", error.message);
      res.status(500).json({ error: "질문을 처리하는 중 오류가 발생했습니다." });
    }
  },
};

module.exports = AIController;
