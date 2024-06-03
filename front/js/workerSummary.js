document.getElementById('searchWorkerSummary').addEventListener('click', async () => {
    const workerName = document.getElementById('workerName').value;

    try {
        const response = await axios.get(`http://3.37.165.84:3001/worker-summary/${workerName}`);
        const summary = response.data[0];

        if (summary) {
            document.getElementById('workerSummaryResult').innerHTML = `
                <p><strong>작업자:</strong> ${summary.task_man}</p>
                <p><strong>총 작업 시간:</strong> ${summary.total_hours} 시간</p>
                <p><strong>총 작업 건수:</strong> ${summary.total_tasks} 건</p>
            `;
        } else {
            document.getElementById('workerSummaryResult').innerHTML = '<p>해당 작업자의 요약 정보를 찾을 수 없습니다.</p>';
        }
    } catch (error) {
        console.error('Error fetching worker summary:', error);
        document.getElementById('workerSummaryResult').innerHTML = '<p>작업자 요약 정보를 검색하는 중 오류가 발생했습니다.</p>';
    }
});
