document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('x-access-token');

    // 체크리스트 불러오기
    if (token) {
        try {
            const response = await axios.get('http://3.37.165.84:3001/supra-setup', {
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

        // 모든 체크리스트 항목을 0으로 초기화
        const checklistFields = [
            'DRAWING_TEMPLATE_ALIGNMENT', 'DRAWING_TEMPLATE_MARKING', 'LINE_ALIGNMENT_CHECK', 'UTILITY_SPEC_KNOWLEDGE',
            'FAB_IN_CAUTION', 'FAB_IN_ORDER', 'GAP_CHECK', 'PACKING_LIST_CHECK', 'TOOL_SIZE_KNOWLEDGE', 'LASER_JIG_ALIGNMENT',
            'LIFT_USE', 'MODULE_HEIGHT_KNOWLEDGE', 'MODULE_DOCKING', 'DOCKING_REALIGNMENT', 'LEVELER_POSITION_KNOWLEDGE',
            'LEVELING_SPEC_KNOWLEDGE', 'INTERNAL_HOOK_UP', 'TRAY_CHECK', 'CABLE_CLASSIFICATION', 'GRATING_OPEN_CAUTION',
            'LADDER_SAFETY', 'CABLE_INSTALLATION', 'CABLE_CONNECTION', 'CABLE_TRAY_ORGANIZATION', 'CABLE_CUTTING',
            'CABLE_RACK_CONNECTION', 'PUMP_CABLE_TYPE_KNOWLEDGE', 'PUMP_CABLE_INSTALLATION', 'PUMP_CABLE_PM_CONNECTION',
            'POWER_SYSTEM_KNOWLEDGE', 'POWER_ON_ORDER', 'CB_TYPE_KNOWLEDGE', 'SYCON_NUMBER_KNOWLEDGE', 'MODULE_CB_TURN_ON',
            'SAFETY_MODULE_KNOWLEDGE', 'EMO_CHECK', 'ALARM_TROUBLE_SHOOTING', 'UTILITY_ON_ORDER', 'VACUUM_ON_ADJUSTMENT',
            'CDA_ON_ADJUSTMENT', 'PCW_ON_ADJUSTMENT', 'GAS_ON_KNOWLEDGE', 'GAS_ON_CHECK', 'GAS_FLOW_CHECK',
            'MANOMETER_ADJUSTMENT', 'EFEM_ROBOT_PENDANT', 'EFEM_ROBOT_LEVELING', 'EFEM_ARM_LEVELING', 'EFEM_DATA_SAVE',
            'TM_ROBOT_PENDANT', 'TM_PICK_ADJUST', 'TM_BM_TEACHING', 'TM_PM_TEACHING', 'TM_DATA_SAVE', 'WAFER_JIG_USE',
            'LASER_JIG_USE', 'FINE_TEACHING', 'MARGIN_CHECK', 'SEMI_AUTO_TRANSFER', 'AGING_TEST', 'GAUGE_INSTALLATION',
            'EPD_INSTALLATION', 'PIO_INSTALLATION', 'SIGNAL_TOWER_INSTALLATION', 'CTC_INSTALLATION', 'PORTABLE_RACK_INSTALLATION',
            'SAFETY_COVER_INSTALLATION', 'PROCESS_KIT_INSTALLATION', 'PUMP_ON', 'PM_LEAK_CHECK', 'GAS_LEAK_CHECK',
            'HELIUM_DETECTOR_USE', 'ECID_MATCHING', 'COOLING_STAGE_ADJUSTMENT', 'PUMPING_VENTING_ADJUSTMENT',
            'EPD_ADJUSTMENT', 'TEMP_AUTOTUNE', 'DOOR_VALVE_ADJUSTMENT', 'APC_AUTOLEARN', 'PIN_SPEED_ADJUSTMENT',
            'GAS_PRESSURE_CHECK', 'MFC_HUNTING_CHECK', 'FCIP_CAL', 'TTTM_SHEET', 'OHT_LAYOUT_CERTIFICATION',
            'OHT_CERTIFICATION', 'MID_CERTIFICATION_TOOL_KNOWLEDGE', 'EFEM_MID_CERTIFICATION', 'TM_MID_CERTIFICATION',
            'PM_MID_CERTIFICATION', 'SUB_UNIT_MID_CERTIFICATION', 'RACK_MID_CERTIFICATION', 'MID_CERTIFICATION_RESPONSE',
            'ENV_QUAL_RESPONSE', 'AGING_TEST_KNOWLEDGE', 'EES_REPORT_PROCEDURE'
        ];

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
            const response = await axios.post('http://3.37.165.84:3001/supra-setup', data, {
                headers: {
                    'Content-Type': 'application/json',
                    'x-access-token': token // JWT 토큰 추가
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
        signOutButton.addEventListener("click", function () {
            localStorage.removeItem("x-access-token");
            alert("Logged out successfully.");
            window.location.replace("./signin.html");
        });
    }
});
