document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('x-access-token');

    if (!token) {
        alert('로그인이 필요합니다.');
        window.location.replace('./signin.html');
        return;
    }

    // 체크리스트 불러오기
    try {
        const response = await axios.get('http://3.37.73.151:3001/ecolite-maintenance', {
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

    const form = document.getElementById('checklistForm');
    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const formData = new FormData(form);
        const data = {};

        const checklistFields = [
            'LP_Escort', 'Robot_Escort',
            'SR8240_Teaching', 'M124V_Teaching', 'M124C_Teaching', 'Robot_REP', 'Robot_Controller_REP',
            'SR8250_Teaching', 'SR8232_Teaching', 'TM_Robot_REP', 'TM_Robot_Controller_REP',
            'Pin_Cylinder', 'Pusher_Cylinder', 'DRT',
            'FFU_Controller', 'FFU_Fan', 'FFU_Motor_Driver',
            'Microwave', 'Applicator', 'Applicator_Tube', 'Microwave_Generator',
            'RF_Matcher', 'RF_Generator',
            'Chuck', 'Toplid_Kit', 'Chamber_Kit', 'Helium_Detector',
            'Hook_Lift_Pin', 'Pin_Bellows', 'Pin_Sensor', 'LM_Guide', 'HOOK_LIFTER_SERVO_MOTOR', 'Pin_Motor_Controller',
            'EPD_Single',
            'Gas_Box_Board', 'Power_Distribution_Board', 'DC_Power_Supply', 'BM_Sensor', 'PIO_Sensor', 'Safety_Module', 'IO_BOX', 'Rack_Board', 'D_NET',
            'IGS_MFC', 'IGS_Valve',
            'Solenoid', 'Fast_Vac_Valve', 'Slow_Vac_Valve', 'Slit_Door', 'APC_Valve', 'Shutoff_Valve',
            'Baratron', 'Pirani', 'View_Port_Quartz', 'Flow_Switch', 'Monitor', 'Keyboard', 'Mouse', 'Water_Leak_Detector', 'Manometer', 'LIGHT_CURTAIN', 'GAS_SPRING',
            'CTC', 'PMC', 'EDA', 'EFEM_CONTROLLER',
            'SW_Patch'
        ];

        // 기본값은 0으로 초기화
        checklistFields.forEach(field => {
            data[field] = 0;
        });

        // 체크된 항목은 100으로 설정
        formData.forEach((value, key) => {
            if (value === 'O') {
                data[key] = 100;
            }
        });

        try {
            const response = await axios.post('http://3.37.73.151:3001/ecolite-maintenance', JSON.stringify(data), {
                headers: {
                    'Content-Type': 'application/json',
                    'x-access-token': token
                }
            });

            if (response.status === 201) {
                alert('체크리스트가 저장되었습니다.');
            } else {
                alert('저장 중 에러 발생');
            }
        } catch (error) {
            console.error('Error saving checklist:', error);
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
});
