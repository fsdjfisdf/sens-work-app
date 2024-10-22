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
            const response = await axios.get('http://3.37.73.151:3001/precia-setup', {
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
            'INST_OHT_CHECK', 'INST_SPACING_CHECK', 'INST_DRAW_SETUP', 'INST_DRAW_MARKING', 'INST_UTILITY_SPEC',
        
            // FAB IN Section
            'FAB_IMPORT_ORDER', 'FAB_WARN_ISSUE', 'FAB_INSPECT', 'FAB_FORBIDDEN', 'FAB_GRATING', 'FAB_PACKING_LIST',
        
            // DOCKING Section
            'DOCK_TOOL_SIZE', 'DOCK_LASER_JIG', 'DOCK_CASTER', 'DOCK_HEIGHT', 'DOCK_MODULE', 
            'DOCK_REALIGN', 'DOCK_LEVEL_POS', 'DOCK_LEVEL_SPEC', 'DOCK_ACCESSORY', 'DOCK_HOOK_UP',
        
            // CABLE HOOK UP Section
            'CABLE_TRAY_CHECK', 'CABLE_SORTING', 'CABLE_GRATING', 'CABLE_LADDER_RULES', 'CABLE_INSTALL', 
            'CABLE_CONNECTION', 'CABLE_TRAY_ARRANGE', 'CABLE_CUTTING', 'CABLE_RACK_CONNECT', 'CABLE_PUMP_TRAY', 
            'CABLE_PUMP_ARRANGE', 'CABLE_MODULE_PUMP',
        
            // POWER TURN ON Section
            'POWER_GPS_UPS_SPS', 'POWER_TURN_SEQ', 'POWER_CB_UNDERSTAND', 'POWER_SAFETY_MODULE', 'POWER_EMO_CHECK', 
            'POWER_MODULE_MCB', 'POWER_SYCON_UNDERST', 'POWER_SYCON_TROUBLE', 'POWER_NAVIGATOR', 'POWER_SERVO_CHECK', 
            'POWER_ALARM_TROUBLE', 'POWER_CHECKLIST', 'POWER_VISION_CONNECT', 'POWER_IP_CHANGE',
        
            // UTILITY TURN ON Section
            'UTIL_CDA_TURN', 'UTIL_PRE_CHECK', 'UTIL_SETUP_MOD', 'UTIL_TURN_SEQ', 'UTIL_VACUUM_TURN', 
            'UTIL_SOLENOID', 'UTIL_RELIEF_VALVE', 'UTIL_MANUAL_VALVE', 'UTIL_PUMP_TURN', 'UTIL_SIGNAL_CHECK', 
            'UTIL_CHILLER_TURN', 'UTIL_CHILLER_CHECK', 'UTIL_MANOMETER_ADJUST',
        
            // GAS TURN ON Section
            'GAS_TURN_SEQ', 'GAS_O2_LEAK', 'GAS_N2_LEAK', 'GAS_AR_TURN', 'GAS_CF4_TURN', 
            'GAS_SF6_TURN', 'GAS_TURN_WARN', 'GAS_DILLUTION_TEST', 'GAS_FLOW_CHECK',
        
            // TEACHING Section
            'TEACH_ROBOT_CONTROL', 'TEACH_ROBOT_XYZ', 'TEACH_ROBOT_PARAM', 'TEACH_DATA_SAVE', 'TEACH_AWC_CAL', 
            'TEACH_TM_CONTROL', 'TEACH_TM_LEVELING', 'TEACH_TM_VALUES', 'TEACH_TM_PM', 'TEACH_TM_AWC', 
            'TEACH_TM_LL', 'TEACH_TM_LL_AWC', 'TEACH_TM_DATA_SAVE', 'TEACH_TM_MACRO', 'TEACH_TM_AXIS', 
            'TEACH_SEMI_TRANSFER', 'TEACH_AGING', 'TEACH_PIN', 'TEACH_CHUCK', 'TEACH_GAP', 
            'TEACH_SENSOR', 'TEACH_CAL', 'TEACH_CENTERING',
        
            // PART INSTALLATION Section
            'PART_PROCESS_KIT', 'PART_PIN_HEIGHT', 'PART_PIO_SENSOR', 'PART_EARTHQUAKE', 
            'PART_EFEM_PICK', 'PART_EFEM_PICK_LEVEL', 'PART_EFEM_PICK_ADJUST', 'PART_TM_PICK', 
            'PART_TM_PICK_LEVEL', 'PART_TM_PICK_ADJUST',
        
            // LEAK CHECK Section
            'LEAK_CHAMBER', 'LEAK_LINE', 'LEAK_HISTORY',
        
            // TTTM Section
            'TTTM_MANOMETER_DNET', 'TTTM_PIRANI_DNET', 'TTTM_VALVE_TIME', 'TTTM_APC_AUTOTUNE', 
            'TTTM_PIN_HEIGHT', 'TTTM_GAS_PRESSURE', 'TTTM_MFC_CAL', 'TTTM_LP_FLOW', 'TTTM_REPORT', 'TTTM_SHEET',
        
            // CUSTOMER CERTIFICATION Section
            'CUST_LP_CERT', 'CUST_RUN_CERT', 'CUST_LABEL', 'CUST_I_MARK', 'CUST_I_MARK_LOC', 
            'CUST_ENV_QUAL', 'CUST_OHT_CERT', 'CUST_RUN_CERTIFY',
        
            // PROCESS CONFIRM Section
            'PROC_PARTICLE', 'PROC_EA_TEST'
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
            const response = await axios.post('http://3.37.73.151:3001/precia-setup', data, {
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