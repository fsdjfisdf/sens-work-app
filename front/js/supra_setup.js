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
            'DRAWING_TEMPLATE', 'DRAWING_TEMPLATE_MARKING', 'OHT_LINE_CONFIRM', 'UTILITY_SPEC',
            'FAB_IN_NOTICE', 'FAB_IN_ORDER', 'CLEARANCE_CHECK', 'PACKING_LIST_CHECK',
            'TOOL_SIZE', 'LASER_JIG_ALIGN', 'EFEM_CASTER_REMOVE', 'MODULE_DOCKING',
            'MODULE_DOCKING_CONFIRM', 'DOCKING_REALIGN', 'LEVELER_POSITION', 'LEVELING_SPEC',
            'HOOK_UP', 'TRAY_CHECK', 'CABLE_MODULE_SORT', 'GRATING_OPEN_NOTICE',
            'LADDER_SAFETY', 'CABLE_ROUTE', 'CABLE_CONNECTION', 'CABLE_TRAY_SORT',
            'CABLE_CUT', 'CABLE_RACK_CONNECTION', 'PUMP_CABLE_SORT', 'PUMP_CABLE_ROUTE',
            'CABLE_PM_CONNECTION', 'POWER_SYSTEM_ROLE', 'POWER_TURN_ON_ORDER', 'CB_FUNCTION',
            'SYCON_PART', 'MODULE_CB_POSITION', 'SAFETY_MODULE_FUNCTION', 'EMO_CHECK',
            'ALARM_TROUBLESHOOTING', 'UTILITY_TURN_ON_ORDER', 'VACUUM_ADJUST', 'CDA_ADJUST',
            'PCW_ADJUST', 'GAS_TURN_ON', 'GAS_TURN_ON_CHECK', 'GAS_FLOW_CHECK',
            'MANOMETER_ADJUST', 'EFEM_PENDANT_OPERATION', 'EFEM_LEVELING', 'EFEM_ARM_LEVELING',
            'EFEM_TEACHING_DATA', 'TM_PENDANT_OPERATION', 'TM_PICK_ADJUST', 'TM_BM_TEACHING',
            'TM_PM_TEACHING', 'TM_TEACHING_DATA', 'TEACHING_WAFER_JIG', 'LASER_TEACHING_JIG',
            'FINE_TEACHING', 'MARGIN_CHECK', 'SEMI_AUTO_TRANSFER', 'AGING_TEST',
            'GAUGE_INSTALL', 'EPD_INSTALL', 'PIO_INSTALL', 'SIGNAL_TOWER_INSTALL',
            'CTC_INSTALL', 'PORTABLE_RACK_INSTALL', 'SAFETY_COVER_INSTALL', 'PROCESS_KIT_INSTALL',
            'PUMP_TURN_ON', 'PM_LEAK_CHECK', 'GAS_LEAK_CHECK', 'HELIUM_DETECTOR_USE',
            'ECID_MATCHING', 'COOLING_STAGE_ADJUST', 'PUMING_VENTING_ADJUST', 'EPD_ADJUST',
            'TEMP_AUTOTUNE', 'DOOR_VALVE_ADJUST', 'APC_AUTOLEARN', 'PIN_ADJUST',
            'GAS_SUPPLY_CHECK', 'MFC_HUNTING_CHECK', 'FCIP_CAL', 'TTTM_SHEET',
            'OHT_LAYOUT_CERT', 'OHT_CERT', 'MID_CERT_TOOL', 'EFEM_MID_CERT',
            'TM_MID_CERT', 'PM_MID_CERT', 'SUB_UNIT_MID_CERT', 'RACK_MID_CERT',
            'MID_CERT', 'ENV_QUAL', 'AGING_TEST_QUAL', 'EES_REPORT'
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
            const response = await axios.post('http://3.37.165.84/supra-setup', data, {
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
