document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('x-access-token');
  const username = localStorage.getItem('username');

  if (!token) {
    alert("로그인이 필요합니다.");
    window.location.replace("./signin.html");
    return;
  }

  if (token) {
    try {
      const response = await axios.get('http://3.37.73.151:3001/hdw-setup', {
        headers: {
          'x-access-token': token
        }
      });

      if (response.status === 200) {
        const checklistData = response.data;
        const form = document.getElementById('checklistForm');

        for (const [key, value] of Object.entries(checklistData)) {
          if (value === 100) {
            const checkbox = form.querySelector(`input[name="${key}"]`);
            if (checkbox) checkbox.checked = true;
          }
        }
      } else {
        console.error('체크리스트 로딩 실패');
      }
    } catch (error) {
      console.error('체크리스트 로딩 중 오류:', error);
    }
  }

  const form = document.getElementById('checklistForm');
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const data = {};
    const username = localStorage.getItem('username') || 'Default Name';

    // name 필드 추가
    if (username) data.name = username;

    // 체크리스트 필드 전체 수동 작성 (html 기준)
    const checklistFields = [
      'EQ_IMPORT_ORDER', 'PACK_LIST_CHECK', 'OHT_LINE_CHECK_GENERAL', 'EQ_SPACING_CHECK', 'DRAWING_TEMPLATE_SETUP',
      'DRAWING_TEMPLATE_MARKING', 'POKE_POSITION_UNDERSTANDING', 'UTILITY_SPEC_UNDERSTANDING',
      'MODULE_UNPACKING_CAUTION', 'MODULE_CLEAN_CAUTION', 'MODULE_MOVEMENT_CAUTION',
      'TOOL_REQUIREMENT_UNDERSTANDING', 'TOOL_SIZE_UNDERSTANDING', 'MODULE_HEIGHT_DOCKING',
      'CASTER_JIG_SEPARATION', 'MODULE_DOCKING', 'DOCKING_PIPE_REALIGNMENT', 'CUSTOM_PIPE_REALIGNMENT',
      'LEVEL_CONSIDERATION_POSITION',
      'GRATING_OPEN_CAUTION', 'CABLE_CONNECTION', 'CABLE_NO_INTERFERENCE', 'CN1_POSITION_UNDERSTANDING',
      'SIGNAL_CABLE_PINMAP', 'SIGNAL_CABLE_FUNCTION_EXPLANATION',
      'GPS_UPS_UNDERSTANDING', 'POWER_TURN_ON_SEQUENCE', 'ALARM_TROUBLESHOOTING', 'RACK_CB_UNDERSTANDING',
      'EMO_CHECK', 'UTILITY_TURN_ON_SEQUENCE', 'CDA_TURN_ON', 'UPW_TURN_ON', 'INLET_VALVE_OPERATION',
      'OUTLET_VALVE_OPERATION', 'BYPASS_VALVE_OPERATION', 'DRAIN_VALVE_OPERATION',
      'GAS_TURN_ON_SEQUENCE', 'CDA_GAS_CHECK',
      'VALVE_INSTALLATION', 'LEAK_SENSOR_INSTALLATION', 'SIGNAL_TOWER_INSTALLATION',
      'HDW_LEAK_CHECK', 'GAS_LINE_LEAK_CHECK', 'PIPE_LEAK_CHECK', 'UPW_LEAK_CHECK_METHOD', 'LEAK_RESPONSE_ACTION',
      'FLOW_OFF_ADJUST', 'FLOW_ON_ADJUST', 'TEMP_SETTING', 'PARAMETER_SETTING', 'TC_ADJUST',
      'OD_ADJUST', 'PIPE_DI_LEAK_CHECK',
      'IMARKING_POSITION', 'GND_LABELING', 'MID_CERT_RESPONSE', 'AIR_CAP_REMOVAL',
      'HDW_REMOTE_TEST', 'HDW_LOCAL_TEST'
    ];

    // 모든 필드 초기화
    checklistFields.forEach(field => {
      data[field] = 0;
    });

    // 체크된 필드 100으로
    formData.forEach((value, key) => {
      if (value === 'O') {
        data[key] = 100;
      }
    });

    try {
      const response = await axios.post('http://3.37.73.151:3001/hdw-setup', data, {
        headers: {
          'Content-Type': 'application/json',
          'x-access-token': token
        }
      });

      if (response.status === 201) {
        alert('체크리스트가 성공적으로 저장되었습니다.');
      } else {
        alert('체크리스트 저장 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error(error);
      alert('체크리스트 저장 중 오류가 발생했습니다.');
    }
  });

  // 로그아웃
  const signOutButton = document.querySelector("#sign-out");
  if (signOutButton) {
    signOutButton.addEventListener("click", function () {
      localStorage.removeItem("x-access-token");
      alert("로그아웃 되었습니다.");
      window.location.replace("./signin.html");
    });
  }

  // ALL CHECK 버튼
  document.querySelectorAll('.all-check-btn').forEach(button => {
    button.addEventListener('click', function () {
      const category = button.closest('.category');
      category.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = true;
      });
    });
  });
});
