document.addEventListener('DOMContentLoaded', async () => {
    const form = document.getElementById('checklistForm');
  
    // 페이지 로드 시 기존 데이터 불러오기
    async function loadChecklist() {
      try {
        const response = await axios.get('http://3.37.165.84:3001/supra-maintenance', {
          headers: {
            'x-access-token': localStorage.getItem('x-access-token')
          }
        });
  
        const data = response.data;
        const checklistFields = [
          'LP_ESCORT', 'ROBOT_ESCORT', 'EFEM_ROBOT_TEACHING', 'EFEM_ROBOT_REP', 'EFEM_ROBOT_CONTROLLER_REP',
          'TM_ROBOT_TEACHING', 'TM_ROBOT_REP', 'TM_ROBOT_CONTROLLER_REP', 'PASSIVE_PAD_REP', 'PIN_CYLINDER',
          'PUSHER_CYLINDER', 'IB_FLOW', 'DRT', 'FFU_CONTROLLER', 'FAN', 'MOTOR_DRIVER', 'FCIP', 'R1', 'R3', 'R5',
          'R3_TO_R5', 'MICROWAVE', 'APPLICATOR', 'GENERATOR', 'CHUCK', 'PROCESS_KIT', 'HELIUM_DETECTOR', 'HOOK_LIFT_PIN',
          'BELLOWS', 'PIN_SENSOR', 'LM_GUIDE', 'PIN_MOTOR_CONTROLLER', 'SINGLE', 'DUAL', 'GAS_BOX_BOARD',
          'TEMP_CONTROLLER_BOARD', 'POWER_DISTRIBUTION_BOARD', 'DC_POWER_SUPPLY', 'BM_SENSOR', 'PIO_SENSOR', 'SAFETY_MODULE',
          'D_NET', 'MFC', 'VALVE', 'SOLENOID', 'FAST_VAC_VALVE', 'SLOW_VAC_VALVE', 'SLIT_DOOR', 'APC_VALVE', 'SHUTOFF_VALVE',
          'BARATRON_ASSY', 'PIRANI_ASSY', 'VIEW_PORT_QUARTZ', 'FLOW_SWITCH', 'CERAMIC_PLATE', 'MONITOR', 'KEYBOARD', 'MOUSE',
          'CTC', 'PMC', 'EDA', 'EFEM_CONTROLLER', 'SW_PATCH'
        ];
  
        checklistFields.forEach(field => {
          const checkbox = document.querySelector(`input[name="${field}"]`);
          if (checkbox) {
            checkbox.checked = data[field] === 100;
          }
        });
      } catch (error) {
        console.error('Error loading checklist:', error);
      }
    }
  
    // 기존 데이터 불러오기
    loadChecklist();
  
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
  
      const formData = new FormData(form);
      const data = {};
  
      // 모든 체크리스트 항목을 0으로 초기화
      const checklistFields = [
        'LP_ESCORT', 'ROBOT_ESCORT', 'EFEM_ROBOT_TEACHING', 'EFEM_ROBOT_REP', 'EFEM_ROBOT_CONTROLLER_REP',
        'TM_ROBOT_TEACHING', 'TM_ROBOT_REP', 'TM_ROBOT_CONTROLLER_REP', 'PASSIVE_PAD_REP', 'PIN_CYLINDER',
        'PUSHER_CYLINDER', 'IB_FLOW', 'DRT', 'FFU_CONTROLLER', 'FAN', 'MOTOR_DRIVER', 'FCIP', 'R1', 'R3', 'R5',
        'R3_TO_R5', 'MICROWAVE', 'APPLICATOR', 'GENERATOR', 'CHUCK', 'PROCESS_KIT', 'HELIUM_DETECTOR', 'HOOK_LIFT_PIN',
        'BELLOWS', 'PIN_SENSOR', 'LM_GUIDE', 'PIN_MOTOR_CONTROLLER', 'SINGLE', 'DUAL', 'GAS_BOX_BOARD',
        'TEMP_CONTROLLER_BOARD', 'POWER_DISTRIBUTION_BOARD', 'DC_POWER_SUPPLY', 'BM_SENSOR', 'PIO_SENSOR', 'SAFETY_MODULE',
        'D_NET', 'MFC', 'VALVE', 'SOLENOID', 'FAST_VAC_VALVE', 'SLOW_VAC_VALVE', 'SLIT_DOOR', 'APC_VALVE', 'SHUTOFF_VALVE',
        'BARATRON_ASSY', 'PIRANI_ASSY', 'VIEW_PORT_QUARTZ', 'FLOW_SWITCH', 'CERAMIC_PLATE', 'MONITOR', 'KEYBOARD', 'MOUSE',
        'CTC', 'PMC', 'EDA', 'EFEM_CONTROLLER', 'SW_PATCH'
      ];
  
      // 모든 필드를 0으로 초기화
      checklistFields.forEach(field => {
        data[field] = 0;
      });
  
      // 체크된 항목을 100으로 설정
      formData.forEach((value, key) => {
        if (value === 'on') {
          data[key] = 100;
        }
      });
  
      try {
        const response = await axios.post('http://3.37.165.84:3001/supra-maintenance', data, {
          headers: {
            'Content-Type': 'application/json',
            'x-access-token': localStorage.getItem('x-access-token') // JWT 토큰 추가
          }
        });
  
        if (response.status === 201) {
          alert('Checklist saved successfully.');
        } else {
          alert('Error saving checklist.');
        }
      } catch (error) {
        console.error(error);
        alert('Error saving checklist.');
      }
    });
  
    const signOutButton = document.querySelector("#sign-out");
    if (signOutButton) {
      signOutButton.addEventListener("click", function() {
        localStorage.removeItem("x-access-token");
        alert("Logged out successfully.");
        window.location.replace("./signin.html");
      });
    }
  });
  