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
      // OpenAI API로 SQL 쿼리 생성 요청
      const queryResponse = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: `
                너는 SEnS 회사의 작업 데이터를 분석해주는 SQL 전문가 AI야.
                모든 SQL 쿼리는 반드시 'work_log_db.work_log' 테이블을 사용해야 하며, 질문을 정확한 SQL 쿼리로 변환해야 한다.
                만약 질문이 SQL과 관련이 없거나 변환할 수 없는 경우, 자연스럽고 친절하게 한국어로 대답을 작성해줘.
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

      // OpenAI로부터 생성된 응답 추출
      let sqlQuery = queryResponse.data.choices[0].message.content.trim();

      // SQL 쿼리만 추출
      const sqlMatch = sqlQuery.match(/SELECT\s+.*\s+FROM\s+.*;/i);
      if (sqlMatch) {
        sqlQuery = sqlMatch[0];

        // `work_log_db.work_log` 테이블을 강제 사용
        if (!sqlQuery.includes("work_log_db.work_log")) {
          sqlQuery = sqlQuery.replace(/FROM\s+work_log/i, "FROM work_log_db.work_log");
        }

        console.log("Generated SQL Query:", sqlQuery);

        // SQL 쿼리 실행
        const queryResult = await AIDao.executeSQL(sqlQuery);

        // 결과에 대한 대화형 응답 생성
        const response = await axios.post(
          "https://api.openai.com/v1/chat/completions",
          {
            model: "gpt-3.5-turbo",
            messages: [
              {
                role: "system",
                content: `
                  너는 SEnS 회사의 작업 데이터를 분석해주는 AI야.
                  작업 데이터 결과를 분석하고 질문에 대한 자연스러운 대답을 제공해줘.
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
      } else {
        // SQL이 아닌 경우 대화형 응답 반환
        console.log("Non-SQL Query Generated:", sqlQuery);

        res.status(200).json({
          question,
          sqlQuery: null,
          result: sqlQuery, // OpenAI가 생성한 대화형 응답 반환
        });
      }
    } catch (error) {
      console.error("Error processing query:", error.message);
      res.status(500).json({
        error: error.message.includes("SQL")
          ? "SQL 쿼리가 유효하지 않거나 실행 중 오류가 발생했습니다."
          : "질문을 처리하는 중 오류가 발생했습니다.",
      });
    }
  },
};

module.exports = AIController;
