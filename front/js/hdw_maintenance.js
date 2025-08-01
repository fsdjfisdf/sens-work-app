document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('x-access-token');

    if (!token) {
        alert('로그인이 필요합니다.');
        window.location.replace('./signin.html');
        return;
    }

    // 체크리스트 불러오기
    try {
        const response = await axios.get('http://3.37.73.151:3001/hdw-maintenance', {
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

        // 모든 체크리스트 항목을 0으로 초기화
        const checklistFields = [
            'OD_REP', 'Relay_REP', 'Fan_REP', 'NTC_NTU_REP', 'SSR_REP',
            'MC_REP', 'Fuse_REP', 'CT_REP', 'HBD_REP', 'SMPS_REP',
            'PLC_REP', 'ELB_REP', 'Heater_REP', 'Qtz_tank_REP',
            'Leak_troubleshooting', 'Flow_meter_REP', 'Air_valve_REP',
            'Shut_off_valve_REP', 'Sol_valve_REP', 'Elbow_fitting_REP',
            'Leak_tray', 'TC_Sensor', 'Touch_panel_patch', 'PLC_patch',
            'Touch_panel_REP', 'PLC_REP_SW'
        ];

        checklistFields.forEach(field => {
            data[field] = 0;
        });

        formData.forEach((value, key) => {
            if (value === 'O') {
                data[key] = 100;
            }
        });

        try {
            const response = await axios.post('http://3.37.73.151:3001/hdw-maintenance', data, {
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
