document.getElementById('equipment_type').addEventListener('change', function() {
    const equipment_typeSelection = this.value;
    const transferItemSelect = document.getElementById('transferItem');
    
    // 기존 옵션 초기화
    transferItemSelect.innerHTML = '<option value="SELECT">SELECT</option>';
  
    // 설비종류에 따른 이관항목 옵션 정의
    const transferItemOptions = {
      "SELECT": ["GROUP을 선택해야 활성화 됩니다."],
      "SUPRA N": ["Escort", "EFEM ROBOT"],
      "SUPRA XP": ["이관항목 없음"],
      "INTEGER": ["M11", "M12", "M15"],
      "PRECIA": ["이관항목 없음"],
      "ECOLITE": ["이관항목 없음"],
      "GENEVA": ["이관항목 없음"],
    };
  
    // 선택된 SITE에 맞는 LINE 옵션 추가
    if (transferItemOptions[equipment_typeSelection]) {
        transferItemOptions[equipment_typeSelection].forEach(function(transferItem) {
        const option = document.createElement('option');
        option.value = option.textContent = transferItem;
        transferItemSelect.appendChild(option);
      });
    }
  });
  