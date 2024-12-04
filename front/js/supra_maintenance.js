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
            const response = await axios.get('http://3.37.73.151:3001/supra-maintenance', {
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
            'LP_ESCORT', 'ROBOT_ESCORT', 'EFEM_ROBOT_TEACHING', 'EFEM_ROBOT_REP', 'EFEM_ROBOT_CONTROLLER_REP',
            'TM_ROBOT_TEACHING', 'TM_ROBOT_REP', 'TM_ROBOT_CONTROLLER_REP', 'PASSIVE_PAD_REP', 'PIN_CYLINDER',
            'PUSHER_CYLINDER', 'IB_FLOW', 'DRT', 'FFU_CONTROLLER', 'FAN', 'MOTOR_DRIVER', 'FCIP', 'R1', 'R3', 'R5',
            'R3_TO_R5', 'MICROWAVE', 'APPLICATOR', 'GENERATOR', 'CHUCK', 'PROCESS_KIT', 'HELIUM_DETECTOR', 'HOOK_LIFT_PIN',
            'BELLOWS', 'PIN_SENSOR', 'LM_GUIDE', 'PIN_MOTOR_CONTROLLER', 'SINGLE_EPD', 'DUAL_EPD', 'GAS_BOX_BOARD',
            'TEMP_CONTROLLER_BOARD', 'POWER_DISTRIBUTION_BOARD', 'DC_POWER_SUPPLY', 'BM_SENSOR', 'PIO_SENSOR', 'SAFETY_MODULE',
            'D_NET', 'MFC', 'VALVE', 'SOLENOID', 'FAST_VAC_VALVE', 'SLOW_VAC_VALVE', 'SLIT_DOOR', 'APC_VALVE', 'SHUTOFF_VALVE',
            'BARATRON_ASSY', 'PIRANI_ASSY', 'VIEW_PORT_QUARTZ', 'FLOW_SWITCH', 'CERAMIC_PLATE', 'MONITOR', 'KEYBOARD', 'MOUSE',
            'CTC', 'PMC', 'EDA', 'EFEM_CONTROLLER', 'SW_PATCH'
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

        // 결재자 이름 가져오기
        const approverSelect = document.getElementById('approver-select');
        const approverName = approverSelect.value;

        if (!approverName) {
            alert('결재자를 선택하세요.');
            return;
        }

        try {
            // 서버로 데이터 전송
            const response = await axios.post('http://3.37.73.151:3001/supra-maintenance/request-approval', {
                checklistData: data, // 체크리스트 데이터
                approverName      // 결재자 이름
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'x-access-token': token // JWT 토큰 추가
                }
            });

            if (response.status === 201) {
                alert('결재 요청이 제출되었습니다.');
            } else {
                console.error('Error submitting approval request:', response.data);
                alert('결재 요청 중 에러 발생');
            }
        } catch (error) {
            console.error('Error submitting approval request:', error);
            alert('Error submitting approval request.');
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
