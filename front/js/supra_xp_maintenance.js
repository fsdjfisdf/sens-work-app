document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('x-access-token');

    if (!token) {
        alert('로그인이 필요합니다.');
        window.location.replace('./signin.html');
        return;
    }

    // 체크리스트 불러오기
    if (token) {
        try {
            const response = await axios.get('http://3.37.73.151:3001/supraxp-maintenance', {
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
            'LP_ESCORT', 'ROBOT_ESCORT', 'SR8241_TEACHING', 'ROBOT_REP', 'ROBOT_CONTROLLER_REP', 'END_EFFECTOR_REP',
            'PERSIMMON_TEACHING', 'END_EFFECTOR_PAD_REP', 'L/L_PIN', 'L/L_SENSOR', 'L/L_DSA', 'GAS_LINE', 'L/L_ISOLATION_VV',
            'FFU_CONTROLLER', 'FAN', 'MOTOR_DRIVER', 'MATCHER', '3000QC', '3100QC', 'CHUCK', 'PROCESS_KIT', 'SLOT_VALVE_BLADE',
            'TEFLON_ALIGN_PIN', 'O_RING_류', 'HELIUM_DETECTOR', 'HOOK_LIFT_PIN', 'BELLOWS', 'PIN_BOARD', 'LM_GUIDE',
            'PIN_MOTOR_CONTROLLER', 'LASER_PIN_SENSOR', 'DUAL', 'DC_POWER_SUPPLY', 'PIO_SENSOR', 'D_NET', 'SIM_BOARD',
            'MFC', 'VALVE', 'SOLENOID', 'PENDULUM_VALVE', 'SLOT_VALVE_DOOR_VALVE', 'SHUTOFF_VALVE', 'RF_GENERATOR',
            'BARATRON_ASSY', 'PIRANI_ASSY', 'VIEW_PORT_QUARTZ', 'FLOW_SWITCH', 'CERAMIC_PLATE', 'MONITOR', 'KEYBOARD',
            'SIDE_STORAGE', 'MULTI_PORT_32', 'MINI8', 'TM_EPC_MFC', 'CTC', 'EFEM_CONTROLLER', 'SW_PATCH'
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
            const response = await axios.post('http://3.37.73.151:3001/supraxp-maintenance', data, {
                headers: {
                    'Content-Type': 'application/json',
                    'x-access-token': token // JWT 토큰 추가
                }
            });

            if (response.status === 201) {
                alert('체크리스트가 저장되었습니다.');
            } else {
                alert('저장 중 에러 발생');
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
