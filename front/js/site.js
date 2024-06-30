document.getElementById('site').addEventListener('change', function() {
    const siteSelection = this.value;
    const lineSelect = document.getElementById('line');
    
    // 기존 옵션 초기화
    lineSelect.innerHTML = '<option value="SELECT">SELECT</option>';
  
    // SITE에 따른 LINE 옵션 정의
    const lineOptions = {
      "PT": ["P1F", "P1D", "P2F", "P2D", "P2-S5", "P3F", "P3D", "P3-S5"],
      "HS": ["12L", "13L", "15L", "16L", "17L", "S1", "S3",  "S4", "S3V", "NRD", "NRD-V", "U4", "M1", "5L"],
      "IC": ["M14", "M16"],
      "CJ": ["M11", "M12", "M15"],
      "PSKH": ["PSKH"] // PSKH의 경우 선택할 수 있는 하나의 옵션만 존재
    };
  
    // 선택된 SITE에 맞는 LINE 옵션 추가
    if (lineOptions[siteSelection]) {
      lineOptions[siteSelection].forEach(function(line) {
        const option = document.createElement('option');
        option.value = option.textContent = line;
        lineSelect.appendChild(option);
      });
    }
  });
  