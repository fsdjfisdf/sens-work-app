document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('x-access-token');
    const username = localStorage.getItem('username'); // 사용자 이름을 저장한 localStorage에서 가져옴

    // 토큰이 없는 경우 로그인 페이지로 리다이렉트
    if (!token) {
        alert("로그인이 필요합니다.");
        window.location.replace("./signin.html");
        return;
    }

    // 체크리스트 불러오기
    if (token) {
        try {
            const response = await axios.get('http://3.37.73.151:3001/supraxp-setup', {
                headers: {
                    'x-access-token': token
                }
            });

            if (response.status === 200) {
                const checklistData = response.data;
                const form = document.getElementById('checklistForm');

                // 불러온 데이터로 체크박스 설정
                for (const [key, value] of Object.entries(checklistData)) {
                    if (value === 100) {
                        const checkbox = form.querySelector(`input[name="${key}"]`);
                        if (checkbox) {
                            checkbox.checked = true;
                        }
                    }
                }
            } else {
                console.error('Error loading checklist.');
            }
        } catch (error) {
            console.error('Error loading checklist:', error);
        }
    }

    const form = document.getElementById('checklistForm');
    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const formData = new FormData(form);
        const data = {};

        const username = localStorage.getItem('username') || 'Default Name'; // 사용자 이름이 없을 때 기본값 설정

        // 모든 체크리스트 항목을 0으로 초기화
        const checklistFields = [
            // INSTALLATION PREPARATION Section
            'INST_IMPORT_ORDER', 'INST_PACKING_LIST', 'INST_OHT_CHECK', 'INST_SPACING_CHECK', 'INST_DRAW_SETUP', 
            'INST_DRAW_MARKING', 'INST_UTILITY_SPEC',

            // FAB IN Section
            'FAB_UNPACK_WARN', 'FAB_CLEAN_WARN', 'FAB_MOVE_WARN',

            // DOCKING Section
            'DOCK_TOOL_SIZE', 'DOCK_LASER_JIG', 'DOCK_LIFT_CASTER', 'DOCK_FRAME_HEIGHT', 'DOCK_MODULE', 
            'DOCK_REALIGN', 'DOCK_LEVELER_POS', 'DOCK_LEVEL_SPEC', 'DOCK_ACCESSORY', 'DOCK_HOOK_UP',

            // CABLE HOOK UP Section
            'CABLE_TRAY_CHECK', 'CABLE_SORTING', 'CABLE_GRATING', 'CABLE_LADDER_RULES', 'CABLE_INSTALL', 
            'CABLE_CONNECTION', 'CABLE_TRAY_ARRANGE', 'CABLE_CUTTING', 'CABLE_RACK_CONNECT', 'CABLE_PUMP_TRAY', 
            'CABLE_PUMP_ARRANGE', 'CABLE_MODULE_PUMP',

            // POWER TURN ON Section
            'POWER_GPS_UPS_SPS', 'POWER_TURN_SEQ', 'POWER_ALARM_TROUBLE', 'POWER_CB_UNDERSTAND', 
            'POWER_SAFETY_MODULE', 'POWER_EMO_CHECK', 'POWER_SYCON_UNDERST', 'POWER_SYCON_TROUBLE',

            // UTILITY TURN ON Section
            'UTIL_TURN_SEQ', 'UTIL_VACUUM_TURN', 'UTIL_CDA_TURN', 'UTIL_PCW_TURN',

            // GAS TURN ON Section
            'GAS_TURN_SEQ', 'GAS_O2_N2_CHECK', 'GAS_TOXIC_CHECK', 'GAS_MANOMETER_ADJUST',

            // TEACHING Section
            'TEACH_ROBOT_CONTROL', 'TEACH_ROBOT_LEVEL', 'TEACH_ARM_LEVEL', 'TEACH_LOAD_PORT', 'TEACH_LOADLOCK', 
            'TEACH_SIDE_STORAGE', 'TEACH_DATA_SAVE', 'TEACH_TM_CONTROL', 'TEACH_TM_LOADLOCK', 'TEACH_TM_PM', 
            'TEACH_TM_DATA_SAVE', 'TEACH_WAFER_JIG', 'TEACH_FINE', 'TEACH_MARGIN', 'TEACH_SEMI_TRANSFER',

            // PART INSTALLATION Section
            'PART_EXHAUST_PORT', 'PART_EFF_SANKYO', 'PART_EFF_ADJUST', 'PART_EFF_LEVEL', 
            'PART_TM_EFF', 'PART_TM_ADJUST_380', 'PART_TM_ADJUST_16', 'PART_TM_LEVEL', 
            'PART_PROCESS_KIT', 'PART_PIO_CABLE', 'PART_RACK_SIGNAL',

            // LEAK CHECK Section
            'LEAK_PUMP_TURN', 'LEAK_PM_CHECK', 'LEAK_GAS_CHECK', 'LEAK_TM_LL_CHECK',

            // TTTM Section
            'TTTM_ECID_MATCH', 'TTTM_PUMP_TIME', 'TTTM_VENT_TIME', 'TTTM_EPD_ADJUST', 'TTTM_TEMP_AUTOTUNE', 
            'TTTM_VALVE_CONTROL', 'TTTM_PENDULUM', 'TTTM_PIN_ADJUST', 'TTTM_GAS_PRESSURE', 'TTTM_MFC_HUNT', 
            'TTTM_GAS_LEAK', 'TTTM_DNET_CAL', 'TTTM_SHEET',

            // CUSTOMER CERTIFICATION Section
            'CUST_OHT_CERT', 'CUST_I_MARKING', 'CUST_GND_LABEL', 'CUST_CSF_SEAL', 
            'CUST_CERT_RESPONSE', 'CUST_ENV_QUAL', 'CUST_OHT_LAYOUT',

            // PROCESS CONFIRM Section
            'PROCESS_AGING', 'PROCESS_AR_TEST', 'PROCESS_SCRATCH', 'PROCESS_PARTICLE', 'PROCESS_EES_MATCH'

        ];
        

        // 사용자 이름 추가 (name 필드)
        if (username) {
            data.name = username;  // 사용자 이름 추가
        }

        // 모든 필드를 0으로 초기화
        checklistFields.forEach(field => {
            data[field] = 0;
        });

        // 체크된 항목을 100으로 설정
        formData.forEach((value, key) => {
            if (value === 'O') {
                data[key] = 100;
            }
        });

        try {
            const response = await axios.post('http://3.37.73.151:3001/supraxp-setup', data, {
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

    const signOutButton = document.querySelector("#sign-out");
    if (signOutButton) {
        signOutButton.addEventListener("click", function () {
            localStorage.removeItem("x-access-token");
            alert("로그아웃 되었습니다.");
            window.location.replace("./signin.html");
        });
    }
    document.querySelectorAll('.all-check-btn').forEach(button => {
        button.addEventListener('click', function () {
          const category = button.closest('.category');
          category.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.checked = true;
          });
        });
      });
});