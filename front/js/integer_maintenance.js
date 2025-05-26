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
            const response = await axios.get('http://3.37.73.151:3001/integer-maintenance', {
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
            'SWAP_KIT', 'GAS_LINE_&_GAS_FILTER',
            'TOP_FEED_THROUGH', 'GAS_FEED_THROUGH', // new 2항목
            'CERAMIC_PARTS', 'MATCHER', 'PM_BAFFLE', 'AM_BAFFLE', 'FLANGE_ADAPTOR',
            'SLOT_VALVE_ASSY(HOUSING)', 'SLOT_VALVE', 'DOOR_VALVE', 'PENDULUM_VALVE', 'PIN_ASSY_MODIFY', 'MOTOR_&_CONTROLLER',
            'PIN_구동부_ASSY', 'PIN_BELLOWS', 'SENSOR', 'STEP_MOTOR_&_CONTROLLER', 'CASSETTE_&_HOLDER_PAD', 'BALL_SCREW_ASSY',
            'BUSH', 'MAIN_SHAFT', 'BELLOWS', 'EFEM_ROBOT_REP', 'TM_ROBOT_REP', 'EFEM_ROBOT_TEACHING', 'TM_ROBOT_TEACHING',
            'TM_ROBOT_SERVO_PACK',// new 1항목 
            'UNDER_COVER', 'VAC._LINE', 'BARATRON_GAUGE', 'PIRANI_GAUGE', 'CONVACTRON_GAUGE', 'MANUAL_VALVE',
            'PNEUMATIC_VALVE', 'ISOLATION_VALVE', 'VACUUM_BLOCK', 'CHECK_VALVE', 'EPC',
            'PURGE_LINE_REGULATOR', // new 1항목
            'COOLING_CHUCK', 'HEATER_CHUCK',
            'GENERATOR',
            'D-NET_BOARD', 'SOURCE_BOX_BOARD', 'INTERFACE_BOARD', 'SENSOR_BOARD', 'PIO_SENSOR_BOARD', // new 5항목
            'AIO_CALIBRATION[PSK_BOARD]', 'AIO_CALIBRATION[TOS_BOARD]', 'CODED_SENSOR', 'GAS_BOX_DOOR_SENSOR',
            'LASER_SENSOR_AMP', 'HE_LEAK_CHECK', 'DIFFUSER', 'LOT_조사',
            'GAS_SPRING' // new 1항목
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
            const response = await axios.post('http://3.37.73.151:3001/integer-maintenance', data, {
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
