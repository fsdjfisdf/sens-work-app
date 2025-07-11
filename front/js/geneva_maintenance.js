document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('x-access-token');

    if (!token) {
        alert('로그인이 필요합니다.');
        window.location.replace('./signin.html');
        return;
    }

    try {
        const response = await axios.get('http://3.37.73.151:3001/geneva-maintenance', {
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
            'SR8240_Teaching', 'GENMARK_Robot_Teaching', 'SR8240_Robot_REP', 'GENMARK_Robot_REP', 'Robot_Controller_REP',
            'FFU_Controller', 'Fan', 'Motor_Driver',
            'Elbow_Heater', 'Insulation_Heater', 'Chuck_Heater',
            'Harmonic_Driver', 'Amplifier', 'Disc_Bearing', 'Chuck_Leveling', 'Wafer_Support_Pin_Alignment', 'Temp_Profile',
            'O2_Leak_Test', 'Chuck_Up_Down_Status',
            'Ring_Seal', 'Door_Seal', 'Ring_Seal_O_Ring', 'Door_Seal_O_Ring',
            'Gas_Box_Board', 'Temp_Controller_Board', 'Power_Distribution_Board', 'DC_Power_Supply',
            'Facility_Board', 'Station_Board', 'Bubbler_Board', 'D_NET',
            'MFC', 'Valve',
            'O2_Analyzer', 'O2_Controller', 'O2_Pump', 'O2_Cell', 'O2_Sample_Valve',
            'Feed_Delivery_Valve', 'Fill_Vent_Valve', 'Drain_Valve', 'APC_Valve', 'Bypass_Valve', 'Shutoff_Valve', 'Vac_Sol_Valve', 'Vac_CDA_Valve',
            'Bubbler_Level_Sensor', 'Bubbler_Flexible_Hose',
            'Baratron_Assy', 'View_Port', 'Flow_Switch', 'LL_Door_Cylinder', 'Chuck_Cylinder',
            'Monitor', 'Keyboard', 'Mouse', 'Water_Leak_Detector', 'Formic_Detector', 'Exhaust_Gauge',
            'CTC', 'EDA', 'Temp_Limit_Controller', 'Temp_Controller',
            'SW_Patch'
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
            const response = await axios.post('http://3.37.73.151:3001/geneva-maintenance', data, {
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
