const axios = require("axios");
const AIDao = require("../dao/AIDao");
const secrets = require("../../config/secret");

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

const createFriendlyResponse = (rows, question) => {
  if (rows.length === 0) {
    return `죄송합니다. "${question}"에 대한 관련 작업 기록을 찾을 수 없습니다.`;
  }

  const totalTasks = rows.length;
  const totalDuration = rows.reduce((acc, row) => {
    const [hours, minutes, seconds] = row.task_duration.split(":").map(Number);
    return acc + hours * 60 + minutes + seconds / 60;
  }, 0);
  const avgDuration = (totalDuration / totalTasks).toFixed(2);

  const workTypeCounts = rows.reduce((acc, row) => {
    acc[row.work_type] = (acc[row.work_type] || 0) + 1;
    return acc;
  }, {});
  const mostCommonWorkType = Object.entries(workTypeCounts).reduce((max, curr) =>
    curr[1] > max[1] ? curr : max
  )[0];

  const detailedTasks = rows
    .map((row, index) => {
      return `${index + 1}. **작업 제목**: ${row.task_name}\n` +
             `   - **작업 날짜**: ${new Date(row.task_date).toLocaleDateString("ko-KR")}\n` +
             `   - **작업 내용**: ${row.task_description || "설명 없음"}\n` +
             `   - **원인**: ${row.task_cause || "원인 정보 없음"}\n` +
             `   - **결과**: ${row.task_result || "결과 정보 없음"}\n` +
             `   - **작업 시간**: ${row.task_duration || "시간 정보 없음"}\n`;
    })
    .join("\n");

  return (
    `다음은 "${question}"에 대한 분석 결과입니다:\n\n` +
    `1. **총 작업 건수**: ${totalTasks}건\n` +
    `2. **총 작업 시간**: ${Math.floor(totalDuration / 60)}시간 ${Math.round(totalDuration % 60)}분\n` +
    `3. **평균 작업 시간**: ${avgDuration}분\n` +
    `4. **가장 많이 수행된 작업 유형**: ${mostCommonWorkType}\n\n` +
    `세부 작업 기록:\n${detailedTasks}`
  );
};

const AIController = {
  async processQuery(req, res) {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({ error: "Question is required." });
    }

    if (!question.includes("설비") && !question.includes("작업") && !question.includes("데이터")) {
      const generalResponse = handleGeneralQuestion(question);
      return res.status(200).json({
        question,
        response: generalResponse,
      });
    }

    try {
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
              - group: varchar(255)
              - site: varchar(255)
              - equipment_name: varchar(255)
              - work_type: varchar(255)
              - task_duration: time

              When filtering by 'task_man', use the SQL function 'FIND_IN_SET' for comma-separated values.
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
