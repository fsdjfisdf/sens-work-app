document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('workType').addEventListener('change', function() {
      updateFieldsBasedOnSelection();
    });
  
    document.getElementById('additionalWorkType').addEventListener('change', function() {
      updateFieldsBasedOnSelection();
    });
  
    function updateFieldsBasedOnSelection() {
      const workType = document.getElementById('workType').value;
      const setupItem = document.getElementById('additionalWorkType').value;
  
      if ((workType === 'SET UP' || workType === 'RELOCATION') && setupItem === 'FAB IN') {
        document.getElementById('task_name').value = 'Setup 설비반입';
        resetAndFillFields('task_cause', ['SET-UP으로 인한 설비 반입']);
        resetAndFillFields('task_description', ['All Module 반입 완료', '설비 위치 확인(Bay를 입력하세요)', 'Cable box 반입 완료', '펜스 설치 완료', 'AC rack 반입 완료']);
        resetAndFillFields('task_result', ['설비 반입 완료']);
      }
  
      if ((workType === 'SET UP' || workType === 'RELOCATION') && setupItem === 'INSTALLATION PREPARATION') {
        document.getElementById('task_name').value = 'Template 타공 확인';
        resetAndFillFields('task_cause', ['Template 타공 확인']);
        resetAndFillFields('task_description', ['설비 타공 확인 완료 ( Bay를 작성하세요. )', 'Hole Grating 4,4,2,2 확인', 'Grating 주위 Template 타공 확인']);
        resetAndFillFields('task_result', ['타공 확인 완료']);
      }
  
      // Add more conditions here based on the setupItem values...
  
      if ((workType === 'SET UP' || workType === 'RELOCATION') && setupItem === 'DOCKING') {
        document.getElementById('task_name').value = 'Set up으로 인한 Docking';
        resetAndFillFields('task_cause', ['Set up으로 인한 Docking']);
        resetAndFillFields('task_description', ['OHT Line 확인, LP Center 확인 완료', 'EFEM 정위치 완료','All Module Docking 완료','EFEM, TM Level 완료','Accessory part, Protection Bar 장착', '지진방지 BKT, CTC, Portable Rack 장착', 'ALL PM 내부 HOOK UP 완료', 'Exhaust Port 장착 완료', 'GAS LINE 장착 완료']);
        resetAndFillFields('task_result', ['Docking 완료', '내부 Hook up 완료']);
      }
  
      if ((workType === 'SET UP' || workType === 'RELOCATION') && setupItem === 'CABLE HOOK UP') {
        document.getElementById('task_name').value = 'Set up으로 인한 Cable hook up';
        resetAndFillFields('task_cause', ['Set up으로 인한 Cable hook up']);
        resetAndFillFields('task_description', ['ALL PM TM CABLE 포설 완료', 'ODT 1s ADJ','Cable 재단 완료','RACK SIGNAL TOWER 설치 완료']);
        resetAndFillFields('task_result', ['Cable hook up 완료']);
      }
  
      // Add more conditions here based on the setupItem values...
  
      if ((workType === 'SET UP' || workType === 'RELOCATION') && setupItem === 'PUMP CABLE HOOK UP') {
        document.getElementById('task_name').value = 'Set up 으로 인한 Pump cable hook up';
        resetAndFillFields('task_cause', ['Set up으로 인한 Pump cable hook up']);
        resetAndFillFields('task_description', ['Rack <-> Pump power, signal cable 포설 완료', 'Pump단 Cable 주기 완료','주변정리 완료']);
        resetAndFillFields('task_result', ['Pump Cable hook up 완료']);
      }
  
      // Add more conditions here based on the setupItem values...
  
      if ((workType === 'SET UP' || workType === 'RELOCATION') && setupItem === 'CABLE HOOK UP : SILICON 마감') {
        document.getElementById('task_name').value = 'SET UP 으로 인한 SILICON 마감';
        resetAndFillFields('task_cause', ['SET UP 으로 인한 SILICON 마감']);
        resetAndFillFields('task_description', ['Rack 상부 실리콘 마감 완료', '빛 투과 없음 확인 완료','Agv 포설 확인 후 Pump hole hole 실리콘 마감 완료']);
        resetAndFillFields('task_result', ['Silicon 마감 완료']);
      }
  
      // Add more conditions here based on the setupItem values...
  
      if ((workType === 'SET UP' || workType === 'RELOCATION') && setupItem === 'POWER TURN ON') {
        document.getElementById('task_name').value = 'SET UP 으로 인한 Power turn on';
        resetAndFillFields('task_cause', ['SET UP 으로 인한 Power turn on']);
        resetAndFillFields('task_description', ['AC Rack turn on 완료', '설비 Power turn on 완료','EDA, EFEM PC 원격 연결 확인 완료','Utility 및 TM FFU 관련 Alarm 제외 Clear 완료']);
        resetAndFillFields('task_result', ['Power turn on 완료']);
      }
  
      // Add more conditions here based on the setupItem values...
  
      if ((workType === 'SET UP' || workType === 'RELOCATION') && setupItem === 'UTILITY TURN ON') {
        document.getElementById('task_name').value = 'SET UP 으로 인한 Utility turn on';
        resetAndFillFields('task_cause', ['SET UP 으로 인한 Utility turn on']);
        resetAndFillFields('task_description', ['Utility turn on sheet 작성 필요', 'CDA, VAC Turn on 완료','PCW Turn ON 완료','ALL PM 유량 7.0~7.3 수준(수정 필요)']);
        resetAndFillFields('task_result', ['Utility turn on 완료']);
      }
  
      // Add more conditions here based on the setupItem values...
  
      if ((workType === 'SET UP' || workType === 'RELOCATION') && setupItem === 'GAS TURN ON') {
        document.getElementById('task_name').value = 'SET UP 으로 인한 Gas turn on';
        resetAndFillFields('task_cause', ['SET UP 으로 인한 Gas turn on']);
        resetAndFillFields('task_description', ['ALL PM Purge N2 Turn on 완료', 'ALL PM O2 Turn on 완료','ALL PM N2 Turn on 완료']);
        resetAndFillFields('task_result', ['Gas turn on 완료']);
      }
  
      // Add more conditions here based on the setupItem values...
  
      if ((workType === 'SET UP' || workType === 'RELOCATION') && setupItem === 'TEACHING LEVELING') {
        document.getElementById('task_name').value = 'SET UP 으로 인한 TEACHING LEVELING';
        resetAndFillFields('task_cause', ['SET UP 으로 인한 Teaching LEVELING']);
        resetAndFillFields('task_description', ['ALL PM CHAMBER LEVELING 완료', 'TEMP UP 이전 PIN HEIGHT 측정 완료','EFEM PICK, ARM LEVELING 완료','TM PICK 장착 완료','TM 380mm 및 경향성 ADJ 완료','BM LEVELING 완료','TEMP UP 완료']);
        resetAndFillFields('task_result', ['LEVELING 완료']);
      }
  
      // Add more conditions here based on the setupItem values...
  
      if ((workType === 'SET UP' || workType === 'RELOCATION') && setupItem === 'TEACHING') {
        document.getElementById('task_name').value = 'SET UP 으로 인한 Teaching';
        resetAndFillFields('task_cause', ['SET UP 으로 인한 Teaching']);
        resetAndFillFields('task_description', ['ALL PM temp up 후 pin height adj 및 메모장 저장 완료', 'EFEM - TM 직교 완료','EFEM - TM 연결 완료','LP teaching 완료','TM Z축 Teaching 완료','EFEM Z축 Teaching 완료','ALL PM 미세 Teaching 완료','ALL PM SIGNLE TEACHING 완료']);
        resetAndFillFields('task_result', ['Teaching 진행 중', 'Teaching 완료']);
      }
  
      // Add more conditions here based on the setupItem values...
  
      if ((workType === 'SET UP' || workType === 'RELOCATION') && setupItem === 'PART INSTALLATION') {
        document.getElementById('task_name').value = 'SET UP 으로 인한 PART INSTALLATION PROCESS KIT 장착';
        resetAndFillFields('task_cause', ['SET UP 으로 인한 PART INSTALLATION']);
        resetAndFillFields('task_description', ['ALL PM TOP LID CLEAN', 'ALL PM PROCESS KIT 장착','PROCESS KIT S/N 메모장 작성 완료','장착 후 PUMPING 및 TEMP UP 완료']);
        resetAndFillFields('task_result', ['PART INSTALLATION 완료']);
      }
  
      // Add more conditions here based on the setupItem values...
  
      if ((workType === 'SET UP' || workType === 'RELOCATION') && setupItem === 'LEAK CHECK') {
        document.getElementById('task_name').value = 'SET UP 으로 인한 LEAK CHECK';
        resetAndFillFields('task_cause', ['SET UP 으로 인한 LEAK CHECK']);
        resetAndFillFields('task_description', ['ALL PM LEAK CHECK : SPIC IN', 'ALL PM O2, N2 GAS LEAK CHECK : SPEC IN']);
        resetAndFillFields('task_result', ['LEAK CHECK 완료']);
      }
  
      // Add more conditions here based on the setupItem values...
  
      if ((workType === 'SET UP' || workType === 'RELOCATION') && setupItem === 'CUSTOMER CERTIFICATION 중간인증 준비') {
        document.getElementById('task_name').value = 'SET UP 으로 인한 중간인증 준비';
        resetAndFillFields('task_cause', ['SET UP 으로 인한 중간인증 준비']);
        resetAndFillFields('task_description', ['RACK 8계통 진행 완료', 'EFEM, TM, PM, SUB UNIT 8계통 진행 완료', 'GAS BOX 1, 2 우레탄 시트 부착 완료', '중간인증 관련 서류 준비 완료']);
        resetAndFillFields('task_result', ['중간 인증 준비 진행 중', '중간 인증 준비 완료']);
      }
  
      // Add more conditions here based on the setupItem values...
  
      if ((workType === 'SET UP' || workType === 'RELOCATION') && setupItem === 'CUSTOMER CERTIFICATION(PIO 장착)') {
        document.getElementById('task_name').value = 'SET UP 으로 인한 PIO SENSOR 장착';
        resetAndFillFields('task_cause', ['SET UP 으로 인한 PIO SENSOR 장착']);
        resetAndFillFields('task_description', ['ALL LP PIO SESNSOR 장착', 'ALL LP PIO AUTO/MANUAL 정상 점등 확인', 'PIO SENSOR S/N 메모장 작성 완료']);
        resetAndFillFields('task_result', ['PIO SENSOR 장착완료']);
      }
  
      // Add more conditions here based on the setupItem values...
  
      if ((workType === 'SET UP' || workType === 'RELOCATION') && setupItem === 'CUSTOMER CERTIFICATION 사전중간인증') {
        document.getElementById('task_name').value = 'SET UP 으로 인한 사전중간인증';
        resetAndFillFields('task_cause', ['SET UP 으로 인한 사전중간인증']);
        resetAndFillFields('task_description', ['Leak Check 정상', 'Interlock Check sheet, Gas Box 도면 확인', 'Gas Box Open alarm check', 'Light Curtain alarm check', 'Protection bar alarm check', 'EFEM SIDE DOOR alarm check','LM GUIDE 구동 간 간섭 CHECK', 'MAIN RACK 확인','중간 인증 Pass']);
        resetAndFillFields('task_result', ['사전중간인증 완료']);
      }
  
      // Add more conditions here based on the setupItem values...
  
      if ((workType === 'SET UP' || workType === 'RELOCATION') && setupItem === 'CUSTOMER CERTIFICATION 중간인증') {
        document.getElementById('task_name').value = 'SET UP 으로 인한 중간인증';
        resetAndFillFields('task_cause', ['SET UP 으로 인한 중간인증']);
        resetAndFillFields('task_description', ['Leak Check 정상', 'Interlock Check sheet, Gas Box 도면 확인', 'Gas Box Open alarm check', 'Light Curtain alarm check', 'Protection bar alarm check', 'EFEM SIDE DOOR alarm check','LM GUIDE 구동 간 간섭 CHECK', 'MAIN RACK 확인','중간 인증 Pass']);
        resetAndFillFields('task_result', ['중간인증 완료']);
      }
  
      // Add more conditions here based on the setupItem values...
  
      if ((workType === 'SET UP' || workType === 'RELOCATION') && setupItem === 'TTTM') {
        document.getElementById('task_name').value = 'TTTM';
        resetAndFillFields('task_cause', ['TTTM']);
        resetAndFillFields('task_description', ['설비 사양 작성(O)', 'EC MATCHING(O)', 'PIRANI CAL(O)', 'PIN UP/DOWN TIME ADJ(O)', 'ALL PM PIN HEIGHT ADJ(O)', 'ALL PM DOOR SPEED ADJ(O)','PUMPING/VENTING TIME ADJ(O)', 'C/S PIN SPEED ADJ(O)','MFC ZERO CAL(O)', 'TEMP AUTO TUNE(O)', 'APC AUTO LEARN(O)', 'GAS PRESSURE 35.5 ADJ(O)', 'APC PARTIAL CHECK(O)', 'GAS PARTIAL CHECK(O)', 'FCIP CAL(O)', 'EPD CAL(O)', 'LEAK CHECK 값 작성(O)', 'PURGE N2 값 확인(O)','TTTM SHEET 작성(O)', 'LP MARGIN CHECK(O)']);
        resetAndFillFields('task_result', ['TTTM 완료']);
      }
    }
  
    function resetAndFillFields(field, values) {
      const container = document.getElementById(`${field}Fields`);
      container.innerHTML = ''; // 기존 필드 초기화
      values.forEach(value => addField(field, value));
    }
  
    function addField(field, value) {
      const container = document.getElementById(`${field}Fields`);
      const newField = document.createElement('textarea');
      newField.name = field;
      newField.className = `${field}-input`;
      newField.value = value;
      newField.required = true;
      container.appendChild(newField);
    }
  });
  