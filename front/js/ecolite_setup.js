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
            const response = await axios.get('http://3.37.73.151:3001/ecolite-setup', {
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
            // INSTALLATION PREPERATION Section
            'EQ_IMPORT_ORDER', 'PACK_LIST_CHECK', 'OHT_LINE_CHECK_300', 'OHT_LINE_CHECK_400', 'EQ_SPACING_CHECK', 
            'DRAWING_TEMPLATE_SETUP', 'DRAWING_TEMPLATE_MARKING', 'UTILITY_SPEC_UNDERSTANDING',
        
            // FAB IN Section
            'MODULE_UNPACKING_CAUTION', 'MODULE_CLEAN_CAUTION', 'MODULE_MOVEMENT_CAUTION',
        
            // DOCKING Section
            'TOOL_SIZE_UNDERSTANDING', 'LASER_JIG_ALIGNMENT_300', 'LASER_JIG_ALIGNMENT_400', 'JACK_USAGE_UNDERSTANDING', 
            'MODULE_HEIGHT_DOCKING', 'MODULE_DOCKING', 'DOCKING_REALIGNMENT', 'LEVELER_POSITION_UNDERSTANDING', 
            'MODULE_LEVELING', 'ACCESSORY_INSTALLATION', 'HOOK_UP_UNDERSTANDING',
        
            // CABLE HOOK UP Section
            'TRAY_CHECK', 'CABLE_SORTING', 'GRATING_OPEN_CAUTION', 'LADDER_SAFETY_RULES', 'CABLE_INSTALLATION', 
            'CABLE_CONNECTION', 'CABLE_TRAY_ARRANGEMENT', 'CABLE_CUTTING', 'CABLE_RACK_CONNECTION', 'PUMP_CABLE_TRAY', 
            'PUMP_CABLE_ARRANGEMENT', 'CABLE_PM_PUMP_CONNECTION',
        
            // POWER TURN ON Section
            'GPS_UPS_SPS_UNDERSTANDING', 'POWER_TURN_ON_SEQUENCE', 'ALARM_TROUBLESHOOTING', 'RACK_CB_UNDERSTANDING', 
            'SAFETY_MODULE_UNDERSTANDING', 'EMO_CHECK', 'SYCON_NUMBER_UNDERSTANDING', 'SYCON_INITIAL_SETUP', 
            'SYCON_TROUBLESHOOTING',
        
            // UTILITY TURN ON Section
            'UTILITY_TURN_ON_SEQUENCE', 'VACUUM_TURN_ON', 'CDA_TURN_ON', 'PCW_TURN_ON', 'CHILLER_TEMP_ADJUST', 'IONIZER_TURN_ON',
        
            // GAS TURN ON Section
            'GAS_TURN_ON_SEQUENCE', 'O2_N2_GAS_TURN_ON', 'CF4_GAS_TURN_ON', 'CF4_H2N2_PRESSURE_TEST', 'MANOMETER_ADJUST',
        
            // TEACHING Section
            'EFEM_LEVELING_SANKYO', 'EFEM_ARM_LEVEL_SANKYO', 'EFEM_LOAD_PORT_SANKYO', 'EFEM_LOADLOCK_SANKYO', 
            'EFEM_BM_MODULE_SANKYO', 'EFEM_TEACH_SAVE_SANKYO', 'EFEM_LEVELING_YASKAWA', 'EFEM_ARM_LEVEL_YASKAWA', 
            'EFEM_LOAD_PORT_YASKAWA', 'EFEM_LOADLOCK_YASKAWA', 'EFEM_BM_MODULE_YASKAWA', 'EFEM_TEACH_SAVE_YASKAWA', 
            'ABS_HOME_SETTING', 'TM_ROBOT_PENDANT_CONTROL', 'TM_BM_TEACHING', 'TM_PM_TEACHING', 'TM_TEACH_SAVE', 
            'FINE_TEACHING', 'MARGIN_CHECK', 'SEMI_AUTO_TRANSFER',
        
            // PART INSTALLATION Section
            'EXHAUST_PORT_INSTALLATION', 'ENDEFFECTOR_INSTALL_SANKYO', 'ENDEFFECTOR_ADJUST_SANKYO', 'ENDEFFECTOR_LEVEL_SANKYO', 
            'TM_ENDEFFECTOR_INSTALL', 'TM_ENDEFFECTOR_ADJUST_38X', 'TM_ENDEFFECTOR_ADJUST_16', 'TM_ENDEFFECTOR_LEVEL', 
            'PROCESS_KIT_INSTALL', 'PIO_SENSOR_INSTALL', 'SIGNAL_TOWER_INSTALL', 'WALL_LINEAR_INSTALL',
        
            // LEAK CHECK Section
            'PUMP_TURN_ON', 'PM_LEAK_CHECK', 'GAS_LINE_LEAK_CHECK', 'TM_LEAK_CHECK',
        
            // TTTM Section
            'ECID_MATCHING', 'PUMP_PURGE_TIME', 'VENTING_TIME_ADJUST', 'EPD_PEAK_OFFSET_ADJUST', 'TEMP_AUTOTUNE', 
            'SLIT_DOOR_CONTROL', 'APC_AUTOLEARN', 'PART_LIST_SHEET', 'PIN_ADJUST', 'GAS_PRESSURE_CHECK', 
            'MFC_HUNTING_CHECK', 'GAS_LEAK_CHECK', 'DNET_CAL', 'TTTM_SHEET',
        
            // CUSTOMER CERTIFICATION Section
            'OHT_CERTIFICATION', 'IMARKING_POSITION', 'GND_LABELING', 'CSF_SILICONE_FINISH', 'MID_CERT_RESPONSE', 
            'ENV_QUAL_RESPONSE', 'MFC_CERT_RESPONSE', 'OHT_LAYOUT_CERTIFICATION',
        
            // PROCESS CONFIRM Section
            'AGING_TEST', 'AR_TEST', 'SCRATCH_TEST', 'PARTICLE_CHECK', 'EC_TOOL_MATCH'
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
            const response = await axios.post('http://3.37.73.151:3001/ecolite-setup', data, {
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