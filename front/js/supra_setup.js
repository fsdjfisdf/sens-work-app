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
                    'x-access-token': token
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
