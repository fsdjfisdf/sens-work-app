document.addEventListener('DOMContentLoaded', async () => {
    const tableHead = document.getElementById('ecolite-maintenance-table-head');
    const tableBody = document.getElementById('ecolite-maintenance-table-body');
    let allData = []; // 전역 변수로 선언

    // 서버로부터 모든 작업자의 데이터를 불러오는 함수
    async function loadAllEcoliteMaintenanceData() {
        try {
            // 토큰을 가져옴 (로그인이 되어 있을 경우)
            const token = localStorage.getItem("x-access-token");

            // 서버에서 모든 작업자의 데이터를 가져옴
            const response = await axios.get('http://3.37.73.151:3001/ecolite-maintenance/all', {
                headers: {
                    'x-access-token': token // 필요한 경우 토큰을 전달
                }
            });

            allData = response.data; // 서버로부터 받아온 모든 작업자의 데이터를 전역 변수에 저장
            console.log("전체 작업자 데이터를 확인:", allData); // 서버에서 받은 전체 데이터를 확인

            if (!Array.isArray(allData)) {
                console.error('Received data is not an array:', allData);
                return;
            }

            generateTable(allData); // 데이터를 테이블로 생성
        } catch (error) {
            console.error('데이터를 불러오는 중 오류 발생:', error);
            if (error.response && error.response.status === 403) {
                alert('권한이 없습니다. 다시 로그인하세요.');
                window.location.replace('./signin.html');
            }
        }
    }

    // 대분류 및 중분류와 작업 항목 리스트 정의
        const taskCategories = [
        {
            category: "Escort",
            subcategories: [
            { name: "LP_Escort", displayName: "LP Escort" },
            { name: "Robot_Escort", displayName: "Robot Escort" }
            ]
        },
        {
            category: "EFEM Robot",
            subcategories: [
            { name: "SR8240_Teaching", displayName: "SR8240 Teaching" },
            { name: "M124V_Teaching", displayName: "M124V Teaching" },
            { name: "M124C_Teaching", displayName: "M124C Teaching" },
            { name: "EFEM_Robot_REP", displayName: "Robot REP" },
            { name: "EFEM_Robot_Controller_REP", displayName: "Robot Controller REP" }
            ]
        },
        {
            category: "TM Robot",
            subcategories: [
            { name: "SR8250_Teaching", displayName: "SR8250 Teaching" },
            { name: "SR8232_Teaching", displayName: "SR8232 Teaching" },
            { name: "TM_Robot_REP", displayName: "Robot REP" },
            { name: "TM_Robot_Controller_REP", displayName: "Robot Controller REP" }
            ]
        },
        {
            category: "BM Module",
            subcategories: [
            { name: "Pin_Cylinder", displayName: "Pin Cylinder" },
            { name: "Pusher_Cylinder", displayName: "Pusher Cylinder" },
            { name: "DRT", displayName: "DRT" }
            ]
        },
        {
            category: "FFU",
            subcategories: [
            { name: "FFU_Controller", displayName: "FFU Controller" },
            { name: "FFU_Fan", displayName: "Fan" },
            { name: "FFU_Motor_Driver", displayName: "Motor Driver" }
            ]
        },
        {
            category: "Microwave",
            subcategories: [
            { name: "Microwave", displayName: "Microwave" },
            { name: "Applicator", displayName: "Applicator" },
            { name: "Applicator_Tube", displayName: "Applicator Tube" },
            { name: "Microwave_Generator", displayName: "Generator" }
            ]
        },
        {
            category: "RF bias",
            subcategories: [
            { name: "RF_Matcher", displayName: "Matcher" },
            { name: "RF_Generator", displayName: "Generator" }
            ]
        },
        {
            category: "Chuck",
            subcategories: [
            { name: "Chuck", displayName: "Chuck" }
            ]
        },
        {
            category: "Process Kit",
            subcategories: [
            { name: "Toplid_Process_Kit", displayName: "Toplid Process Kit" },
            { name: "Chamber_Process_Kit", displayName: "Chamber Process Kit" }
            ]
        },
        {
            category: "Leak",
            subcategories: [
            { name: "Helium_Detector", displayName: "Helium Detector" }
            ]
        },
        {
            category: "Pin",
            subcategories: [
            { name: "Hook_Lift_Pin", displayName: "Hook Lift Pin" },
            { name: "Pin_Bellows", displayName: "Bellows" },
            { name: "Pin_Sensor", displayName: "Pin Sensor" },
            { name: "LM_Guide", displayName: "LM Guide" },
            { name: "HOOK_LIFTER_SERVO_MOTOR", displayName: "HOOK LIFTER SERVO MOTOR" },
            { name: "Pin_Motor_Controller", displayName: "Pin Motor Controller" }
            ]
        },
        {
            category: "EPD",
            subcategories: [
            { name: "EPD_Single", displayName: "Single" }
            ]
        },
        {
            category: "Board",
            subcategories: [
            { name: "Gas_Box_Board", displayName: "Gas Box Board" },
            { name: "Power_Distribution_Board", displayName: "Power Distribution Board" },
            { name: "DC_Power_Supply", displayName: "DC Power Supply" },
            { name: "BM_Sensor", displayName: "BM Sensor" },
            { name: "PIO_Sensor", displayName: "PIO Sensor" },
            { name: "Safety_Module", displayName: "Safety Module" },
            { name: "IO_BOX", displayName: "IO BOX" },
            { name: "Rack_Board", displayName: "Rack Board" },
            { name: "D_NET", displayName: "D-NET" }
            ]
        },
        {
            category: "IGS Block",
            subcategories: [
            { name: "IGS_MFC", displayName: "MFC" },
            { name: "IGS_Valve", displayName: "Valve" }
            ]
        },
        {
            category: "Valve",
            subcategories: [
            { name: "Solenoid", displayName: "Solenoid" },
            { name: "Fast_Vac_Valve", displayName: "Fast Vac Valve" },
            { name: "Slow_Vac_Valve", displayName: "Slow Vac Valve" },
            { name: "Slit_Door", displayName: "Slit Door" },
            { name: "APC_Valve", displayName: "APC Valve" },
            { name: "Shutoff_Valve", displayName: "Shutoff Valve" }
            ]
        },
        {
            category: "ETC",
            subcategories: [
            { name: "Baratron_ASSY", displayName: "Baratron Ass'y" },
            { name: "Pirani_ASSY", displayName: "Pirani Ass'y" },
            { name: "View_Port_Quartz", displayName: "View Port Quartz" },
            { name: "Flow_Switch", displayName: "Flow Switch" },
            { name: "Monitor", displayName: "Monitor" },
            { name: "Keyboard", displayName: "Keyboard" },
            { name: "Mouse", displayName: "Mouse" },
            { name: "Water_Leak_Detector", displayName: "Water Leak Detector" },
            { name: "Manometer", displayName: "Manometer" },
            { name: "LIGHT_CURTAIN", displayName: "LIGHT CURTAIN" },
            { name: "GAS_SPRING", displayName: "GAS SPRING" }
            ]
        },
        {
            category: "CTR",
            subcategories: [
            { name: "CTC", displayName: "CTC" },
            { name: "PMC", displayName: "PMC" },
            { name: "EDA", displayName: "EDA" },
            { name: "EFEM_CONTROLLER", displayName: "EFEM CONTROLLER" }
            ]
        },
        {
            category: "S/W",
            subcategories: [
            { name: "SW_Patch", displayName: "S/W Patch" }
            ]
        }
        ];


    // 작업자별 평균 계산 함수
    function calculateAverages(data, workers) {
        const averages = {};
        workers.forEach(workerName => {
            let totalTasks = 0;
            let completedTasks = 0;

            data.forEach(row => {
                if (row.name === workerName) {
                    taskCategories.forEach(category => {
                        category.subcategories.forEach(subcategory => {
                            const value = row[subcategory.name];
                            if (value !== undefined) {
                                totalTasks++;
                                if (value === 100) {
                                    completedTasks++;
                                }
                            }
                        });
                    });
                }
            });

            const average = (completedTasks / totalTasks) * 100;
            averages[workerName] = average.toFixed(2); // 소수점 둘째 자리까지 표시
        });
        return averages;
    }

    // 테이블을 생성하는 함수
    function generateTable(data) {
        tableHead.innerHTML = ''; // 기존 테이블 헤더 삭제
        tableBody.innerHTML = ''; // 기존 테이블 바디 삭제

        const workers = [...new Set(data.map(row => row.name))];
        const averages = calculateAverages(data, workers);

        // 평균값 기준으로 작업자 정렬 (높은 사람부터 낮은 순으로)
        const sortedWorkers = workers.sort((a, b) => averages[b] - averages[a]);

        // 테이블 헤더 생성
        const headerRow = document.createElement('tr');
        const categoryHeader = document.createElement('th');
        categoryHeader.textContent = '';
        headerRow.appendChild(categoryHeader);

        const taskHeader = document.createElement('th');
        taskHeader.textContent = '작업 항목';
        headerRow.appendChild(taskHeader);

        sortedWorkers.forEach(worker => {
            const th = document.createElement('th');
            th.textContent = worker;
            headerRow.appendChild(th);
        });
        tableHead.appendChild(headerRow);

        // 작업자별 평균을 표시하는 AVERAGE 행 생성
        const averageRow = document.createElement('tr');
        averageRow.appendChild(document.createElement('td')); // 중분류 칸 빈칸
        const avgLabelCell = document.createElement('td');
        avgLabelCell.textContent = 'Average';
        averageRow.appendChild(avgLabelCell);

        sortedWorkers.forEach(worker => {
            const avgCell = document.createElement('td');
            avgCell.textContent = `${averages[worker]}%`; // 평균값 추가
            avgCell.style.fontWeight = 'bold'; // 평균값을 굵게 표시
            avgCell.style.backgroundColor = '#e0e0e0'; // AVERAGE 행의 색을 회색으로 설정
            averageRow.appendChild(avgCell);
        });
        tableBody.appendChild(averageRow);

        // 작업 항목에 대한 데이터 추가
        taskCategories.forEach(category => {
            category.subcategories.forEach((subcategory, index) => {
                const row = document.createElement('tr');

                if (index === 0) {
                    const categoryCell = document.createElement('td');
                    categoryCell.textContent = category.category;
                    categoryCell.rowSpan = category.subcategories.length; 
                    categoryCell.style.fontWeight = 'bold'; 
                    row.appendChild(categoryCell);
                }

                const taskCell = document.createElement('td');
                taskCell.textContent = subcategory.displayName;
                row.appendChild(taskCell);

                sortedWorkers.forEach(workerName => {
                    const workerData = data.find(worker => worker.name === workerName);
                    const taskValue = workerData ? workerData[subcategory.name] : 'N/A'; 
                    
                    const cell = document.createElement('td');
                    cell.textContent = taskValue;
                    if (taskValue === 100) {
                        cell.style.color = 'blue';
                    } else if (taskValue === 0) {
                        cell.style.color = 'red';
                    } else {
                        cell.style.color = 'gray';
                    }
                    row.appendChild(cell);
                });

                tableBody.appendChild(row);
            });
        });
    }

    // 검색 기능 적용 함수
    function applySearchFilter(searchName) {
        console.log('검색어:', searchName); // 검색어 확인
        const filteredData = allData.filter(worker => worker.name.includes(searchName));
        console.log('필터링된 데이터:', filteredData); // 필터링된 데이터 확인
        generateTable(filteredData);
    }

    // 검색 및 리셋 버튼 이벤트 리스너
    document.getElementById('search-button').addEventListener('click', () => {
        const searchName = document.getElementById('search-name').value.trim();
        if (searchName) {
            applySearchFilter(searchName);  // 검색 실행
        }
    });

    document.getElementById('reset-button').addEventListener('click', () => {
        document.getElementById('search-name').value = '';
        generateTable(allData);  // 전체 데이터 다시 표시
    });

    // 데이터 로드 및 테이블 생성
    loadAllEcoliteMaintenanceData();
});