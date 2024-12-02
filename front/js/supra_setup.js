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
            const response = await axios.get('http://3.37.73.151:3001/supra-setup', {
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
        const username = localStorage.getItem('username') || 'Default Name';
        const token = localStorage.getItem('x-access-token');
    
        // 모든 체크리스트 항목을 0으로 초기화
        const checklistFields = [
            'DRAWING_TEMPLATE_SETUP', 'DRAWING_TEMPLATE_MARKING', 'CUSTOMER_OHT_LINE_CHECK', 'UTILITY_SPEC_UNDERSTANDING',
            'EQUIPMENT_IMPORT_CAUTION', 'EQUIPMENT_IMPORT_ORDER', 'EQUIPMENT_SPACING_CHECK', 'PACKING_LIST_CHECK',
            'TOOL_SIZE_UNDERSTANDING', 'LASER_JIG_ALIGNMENT', 'LIFT_CASTER_REMOVAL', 'MODULE_HEIGHT_DOCKING',
            'MODULE_DOCKING', 'DOCKING_REALIGNMENT', 'LEVELER_POSITION_UNDERSTANDING', 'MODULE_LEVELING', 'HOOK_UP',
            'TRAY_CHECK', 'CABLE_SORTING', 'GRATING_OPEN_CAUTION', 'LADDER_SAFETY_RULES', 'CABLE_INSTALLATION',
            'CABLE_CONNECTION', 'CABLE_TRAY_ARRANGEMENT', 'CABLE_CUTTING', 'PUMP_CABLE_TRAY', 'PUMP_CABLE_ARRANGEMENT',
            'CABLE_PM_PUMP_CONNECTION', 'GPS_UPS_SPS_UNDERSTANDING', 'POWER_TURN_ON_SEQUENCE', 'RACK_CB_UNDERSTANDING',
            'SYCON_NUMBER_UNDERSTANDING', 'MODULE_CB_TURN_ON', 'SAFETY_MODULE_UNDERSTANDING', 'EMO_CHECK',
            'POWER_TURN_ON_ALARM_TROUBLESHOOTING', 'UTILITY_TURN_ON_SEQUENCE', 'VACUUM_TURN_ON', 'CDA_TURN_ON',
            'PCW_TURN_ON', 'GAS_TURN_ON', 'GAS_TURN_ON_CHECK', 'OX_NX_GAS_TURN_ON', 'MANOMETER_LIMIT_ADJUST',
            'EFEM_ROBOT_PENDANT_CONTROL', 'EFEM_ROBOT_LEVELING', 'EFEM_ROBOT_ARM_LEVELING', 'EFEM_TEACHING_DATA_SAVE',
            'TM_ROBOT_PENDANT_CONTROL', 'TM_ROBOT_PICK_ADJUST', 'TM_ROBOT_BM_TEACHING', 'TM_ROBOT_PM_TEACHING',
            'TM_TEACHING_DATA_SAVE', 'WAFER_JIG_USE', 'LASER_JIG_USE', 'FINE_TEACHING', 'MARGIN_CHECK',
            'SEMI_AUTO_TRANSFER', 'AGING_TEST', 'BARATRON_PIRANI_GAUGE_INSTALLATION', 'EPD_INSTALLATION',
            'PIO_SENSOR_CABLE_INSTALLATION', 'RACK_SIGNAL_TOWER_INSTALLATION', 'CTC_INSTALLATION',
            'PORTABLE_RACK_INSTALLATION', 'PM_SAFETY_COVER_INSTALLATION', 'PROCESS_KIT_INSTALLATION', 'PUMP_TURN_ON',
            'PM_LEAK_CHECK', 'GAS_LINE_LEAK_CHECK', 'HELIUM_DETECTOR_USE', 'ECID_MATCHING', 'COOLING_STAGE_PIN_CONTROL',
            'PUMP_VENT_TIME_ADJUST', 'EPD_PEAK_OFFSET_ADJUST', 'TEMP_AUTOTUNE', 'DOOR_VALVE_CONTROL', 'APC_AUTOLEARN',
            'PIN_SPEED_HEIGHT_ADJUST', 'GAS_SUPPLY_PRESSURE_CHECK', 'MFC_HUNTING_CHECK', 'FCIP_CAL',
            'TTTM_SHEET_COMPLETION', 'OHT_LAY_OUT_CERTIFICATION', 'OHT_CERTIFICATION', 'TOOL_PREP_CERTIFICATION',
            'EFEM_CERTIFICATION_PREP', 'TM_CERTIFICATION_PREP', 'PM_CERTIFICATION_PREP', 'SUB_UNIT_CERTIFICATION_PREP',
            'RACK_CERTIFICATION_PREP', 'CERTIFICATION_RESPONSE', 'ENVIRONMENTAL_QUAL_RESPONSE',
            'AGING_TEST_PROCESS_CONFIRM', 'EES_REPORT_PROCEDURE'
        ];
    
        // 사용자 이름 추가
        data.name = username;
    
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
    
        // 승인 대기 상태로 저장
        data.approvalStatus = 'Pending';
    
        try {
            const response = await axios.post('http://3.37.73.151:3001/supra-setup', data, {
                headers: {
                    'Content-Type': 'application/json',
                    'x-access-token': token
                }
            });
    
            if (response.status === 201) {
                alert('체크리스트가 결재 대기 상태로 저장되었습니다.');
            } else {
                alert('체크리스트 저장 중 오류가 발생했습니다.');
            }
        } catch (error) {
            console.error('체크리스트 저장 중 오류 발생:', error);
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

