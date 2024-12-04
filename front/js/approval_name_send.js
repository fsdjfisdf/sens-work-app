document.getElementById("request-approval").addEventListener("click", async () => {
    const approverSelect = document.getElementById("approver-select");
    const approverName = approverSelect.value; // 선택된 결재자 이름
    const checklistData = {
      /* 체크리스트 데이터 */
    };
  
    try {
      const response = await axios.post(`${API_URL}/supra-maintenance/request-approval`, {
        checklistData,
        approverName, // 선택된 결재자 이름 포함
      }, {
        headers: { 'x-access-token': token },
      });
  
      if (response.status === 201) {
        alert("결재 요청이 성공적으로 제출되었습니다.");
      } else {
        console.error("Error submitting approval request:", response.data);
      }
    } catch (error) {
      console.error("Error submitting approval request:", error);
    }
  });
  