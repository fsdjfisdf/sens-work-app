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
            const response = await axios.get('http://3.37.73.151:3001/integer-setup', {
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
            'DRAWING_TEMPLATE_SETUP', 'DRAWING_TEMPLATE_MARKING', 'CUSTOMER_OHT_LINE_CHECK', 'UTILITY_SPEC_UNDERSTANDING',
            'EQUIPMENT_IMPORT_CAUTION', 'EQUIPMENT_IMPORT_ORDER', 'EQUIPMENT_SPACING_CHECK', 'PACKING_LIST_CHECK',
            'TOOL_SIZE_UNDERSTANDING', 'LASER_JIG_ALIGNMENT', 'LIFT_CASTER_REMOVAL', 'MODULE_HEIGHT_DOCKING',
            'MODULE_DOCKING', 'DOCKING_REALIGNMENT', 'LEVELER_POSITION_UNDERSTANDING', 'MODULE_LEVELING', 'DOCKING_PIN_CHECK',
            'HOOK_UP', 'TRAY_CHECK', 'CABLE_SORTING', 'GRATING_OPEN_CAUTION', 'LADDER_SAFETY_RULES', 'CABLE_INSTALLATION',
            'CABLE_CONNECTION', 'CABLE_TRAY_ARRANGEMENT', 'CABLE_CUTTING', 'CABLE_RACK_CONNECTION', 'PUMP_CABLE_TRAY',
            'PUMP_CABLE_ARRANGEMENT', 'CABLE_PM_PUMP_CONNECTION', 'GPS_UPS_SPS_UNDERSTANDING', 'POWER_TURN_ON_SEQUENCE',
            'RACK_CB_UNDERSTANDING', 'SAFETY_MODULE_UNDERSTANDING', 'EMO_CHECK', 'MODULE_CB_TURN_ON', 'SYCON_NUMBER_UNDERSTANDING',
            'POWER_TURN_ON_ALARM_TROUBLESHOOTING', 'IP_ADDRESS_CHANGE', 'UTILITY_TURN_ON_SEQUENCE', 'VACUUM_TURN_ON',
            'CDA_TURN_ON', 'PCW_TURN_ON', 'SOLENOID_VALVE_UNDERSTANDING', 'RELIEF_VALVE_UNDERSTANDING', 'MANUAL_VALVE_UNDERSTANDING',
            'PUMP_TURN_ON', 'N2_PURGE_CHECK', 'CHILLER_TURN_ON', 'MANOMETER_LIMIT_ADJUST', 'GAS_TURN_ON', 'GAS_TURN_ON_CHECK',
            'NF3_LINE_LEAK_CHECK', 'H2_LINE_LEAK_CHECK', 'GAS_DILUTION_TEST', 'EFEM_ROBOT_PENDANT_CONTROL',
            'EFEM_ROBOT_LEVELING', 'EFEM_ROBOT_ARM_LEVELING', 'EFEM_ROBOT_PARAMETER_ADJUST', 'EFEM_TEACHING_DATA_SAVE',
            'TM_ROBOT_PENDANT_CONTROL', 'TM_ROBOT_LEVELING', 'TM_ROBOT_XYZ_VALUES', 'TM_ROBOT_PM_TEACHING',
            'TM_ROBOT_AM_TEACHING', 'TM_TEACHING_DATA_SAVE', 'WAFER_JIG_USE', 'LASER_JIG_USE', 'MARGIN_CHECK',
            'SEMI_AUTO_TRANSFER', 'AGING_TEST', 'CERAMIC_PLATE_PIN_INSTALLATION', 'PIN_HEIGHT_ADJUST', 'PIO_SENSOR_INSTALLATION',
            'VIEW_PORT_COVER_INSTALLATION', 'LOAD_LOCK_LEVELING', 'TM_ROBOT_PICK_INSTALLATION', 'TM_ROBOT_PICK_LEVELING',
            'GAS_BOX_WINDOW_INSTALLATION', 'GAS_BOX_DAMPER_INSTALLATION', 'LINE_MANUAL_LEAK_CHECK', 'MANUAL_LEAK_CHECK_HISTORY',
            'HE_DETECTOR_USE', 'HE_BOTTLE_ORDER', 'HE_DETECTOR_HOUSING_LEAK_CHECK', 'SLOT_VALVE_HE_LEAK_CHECK',
            'VAC_CDA_SPEC_ADJUST', 'TEMP_PROFILE', 'PUMP_VENT_TIME_ADJUST', 'EPD_PEAK_OFFSET_ADJUST', 'PM_BAFFLE_TEMP_AUTOTUNE',
            'DOOR_VALVE_CONTROL', 'APC_AUTOLEARN', 'PIN_HEIGHT_ADJUST', 'GAS_SUPPLY_PRESSURE_CHECK', 'GAS_EXHAUST_MONAMETER_CONTROL',
            'MFC_HUNTING_CHECK', 'LP_FLOW_CONTROL', 'AICP_POWER_CAL', 'PRODUCT_REPORT_COMPLETION', 'TTTM_SHEET_COMPLETION',
            'LP_CERTIFICATION', 'FULL_PUMPING', 'MID_OPERATION_CERTIFICATION_PREP', 'LABEL_PLACEMENT', 'I_MARKING_PROCEDURE',
            'I_MARKING_LOCATION', 'GAS_BOX_BOARD_LEVELING', 'ENVIRONMENTAL_QUAL_TEST', 'OHT_AUTO_TRANSFER_CERTIFICATION',
            'PARTICLE_TEST', 'EA_TEST'
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
            const response = await axios.post('http://3.37.73.151:3001/integer-setup', data, {
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