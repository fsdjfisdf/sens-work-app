const axios = require("axios");
const AIDao = require("../dao/AIDao");
const secrets = require("../../config/secret");

// 일반적인 질문에 대한 대답 처리
const handleGeneralQuestion = (question) => {
  if (question.includes("안녕")) {
    return "안녕하세요! 저는 SEnS 작업이력 AI입니다. 작업 데이터나 설비와 관련된 질문을 해주세요.";
  }
  if (question.includes("누구")) {
    return "저는 SEnS 데이터베이스와 작업 데이터를 분석하는 AI입니다.";
  }
  if (question.includes("도움")) {
    return "작업 이력이나 설비 정보를 알고 싶으시면 해당 내용을 포함한 질문을 해주세요!";
  }
  return "죄송합니다. 저는 데이터베이스와 작업 기록과 관련된 질문에 답변할 수 있습니다.";
};

// 작업 데이터를 분석하여 가독성 있는 결과 생성
const analyzeWorkLogData = (rows, question) => {
    if (rows.length === 0) {
      return `죄송합니다. "${question}"에 대한 관련 작업 기록을 찾을 수 없습니다.`;
    }
  
    // 총 작업 건수
    const totalTasks = rows.length;
  
    // 총 작업 시간 (분 단위로 계산)
    const totalMinutes = rows.reduce((sum, row) => {
      const [hours, minutes, seconds] = row.task_duration.split(":").map(Number);
      return sum + hours * 60 + minutes + seconds / 60;
    }, 0);
  
    // 평균 작업 시간 (분 단위)
    const averageMinutes = (totalMinutes / totalTasks).toFixed(2);
  
    // 가장 빈번한 작업 유형
    const workTypeCounts = rows.reduce((acc, row) => {
      acc[row.work_type] = (acc[row.work_type] || 0) + 1;
      return acc;
    }, {});
    const mostCommonWorkType = Object.keys(workTypeCounts).reduce((a, b) =>
      workTypeCounts[a] > workTypeCounts[b] ? a : b
    );
  
    // 작업 요약 생성
    const summary = `
      총 작업 건수: ${totalTasks}건<br>
      총 작업 시간: ${Math.floor(totalMinutes / 60)}시간 ${Math.round(totalMinutes % 60)}분<br>
      평균 작업 시간: ${averageMinutes}분<br>
      가장 빈번한 작업 유형: ${mostCommonWorkType}<br>
    `;
  
    // 세부 작업 기록 생성
    const details = rows.map((row, index) => {
      return `${index + 1}. 작업 제목: ${row.task_name}<br>
         - 작업 날짜: ${new Date(row.task_date).toLocaleDateString("ko-KR")}<br>
         - 작업 내용: ${(row.task_description || "설명 없음").replace(/\n/g, "<br>")}<br>
         - 원인: ${row.task_cause || "원인 정보 없음"}<br>
         - 결과: ${row.task_result || "결과 정보 없음"}<br>
         - 작업 시간: ${row.task_duration || "시간 정보 없음"}<br>`;
    });
  
    // 최종 결과
    return `
      다음은 "${question}"에 대한 분석 결과입니다:<br><br>
      ${summary}<br>
      세부 작업 기록:<br>${details.join("<br><br>")}
    `;
  };
  

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
              - group: varchar(255) (Group the equipment belongs to)
              - site: varchar(255) (Site where the task was performed)
              - equipment_name: varchar(255) (Name of the equipment)
              - work_type: varchar(255) (Type of work performed)
              - task_duration: time (Duration of the task)

              When filtering by 'task_man', use the SQL function 'FIND_IN_SET' to search for a worker in the comma-separated list.
              Generate plain SQL queries without formatting or explanations.
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
      sqlQuery = sqlQuery.replace(/```sql|```/g, "").trim();

      console.log("Generated SQL Query:", sqlQuery);

      // SQL 쿼리 실행 및 결과 가져오기
      const queryResult = await AIDao.executeSQL(sqlQuery);

      // 분석 결과 생성
      const analysisResult = analyzeWorkLogData(queryResult, question);

      res.status(200).json({
        question,
        sqlQuery,
        result: analysisResult,
      });
    } catch (error) {
      console.error("Error processing query:", error.message);
      res.status(500).json({ error: "질문을 처리하는 중 오류가 발생했습니다." });
    }
  },
};

module.exports = AIController;
