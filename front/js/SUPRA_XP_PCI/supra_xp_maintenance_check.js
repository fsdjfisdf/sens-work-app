document.addEventListener('DOMContentLoaded', async () => {
    const tableHead = document.getElementById('supraxp-maintenance-table-head');
    const tableBody = document.getElementById('supraxp-maintenance-table-body');
    let allData = []; // 전역 변수로 선언

    // 서버로부터 모든 작업자의 데이터를 불러오는 함수
    async function loadAllSupraxpMaintenanceData() {
        try {
            // 토큰을 가져옴 (로그인이 되어 있을 경우)
            const token = localStorage.getItem("x-access-token");

            // 서버에서 모든 작업자의 데이터를 가져옴
            const response = await axios.get('http://3.37.73.151:3001/supraxp-maintenance/all', {
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
            "category": "Escort",
            "subcategories": [
                {"name": "LP_ESCORT", "displayName": "LP ESCORT"},
                {"name": "ROBOT_ESCORT", "displayName": "ROBOT ESCORT"}
            ]
        },
        {
            "category": "EFEM Robot",
            "subcategories": [
                {"name": "SR8241_TEACHING", "displayName": "SR8241 TEACHING"},
                {"name": "ROBOT_REP", "displayName": "ROBOT REP"},
                {"name": "ROBOT_CONTROLLER_REP", "displayName": "ROBOT CONTROLLER REP"},
                {"name": "END_EFFECTOR_REP", "displayName": "END EFFECTOR REP"}
            ]
        },
        {
            "category": "TM Robot",
            "subcategories": [
                {"name": "PERSIMMON_TEACHING", "displayName": "PERSIMMON TEACHING"},
                {"name": "END_EFFECTOR_PAD_REP", "displayName": "END EFFECTORPAD REP"}
            ]
        },
        {
            "category": "L/L",
            "subcategories": [
                {"name": "L_L_PIN", "displayName": "LL PIN"},
                {"name": "L_L_SENSOR", "displayName": "LL SENSOR"},
                {"name": "L_L_DSA", "displayName": "LL DSA"},
                {"name": "GAS_LINE", "displayName": "GAS LINE"},
                {"name": "L_L_ISOLATION_VV", "displayName": "LL ISOLATION VV"}
            ]
        },
        {
            "category": "EFEM FFU",
            "subcategories": [
                {"name": "FFU_CONTROLLER", "displayName": "FFU CONTROLLER"},
                {"name": "FAN", "displayName": "FAN"},
                {"name": "MOTOR_DRIVER", "displayName": "MOTOR DRIVER"}
            ]
        },
        {
            "category": "Source",
            "subcategories": [
                {"name": "MATCHER", "displayName": "MATCHER"},
                {"name": "3000QC", "displayName": "3000QC"},
                {"name": "3100QC", "displayName": "3100QC"}
            ]
        },
        {
            "category": "Chuck",
            "subcategories": [
                {"name": "CHUCK", "displayName": "CHUCK"}
            ]
        },
        {
            "category": "Preventive Maintenance",
            "subcategories": [
                {"name": "PROCESS_KIT", "displayName": "PROCESS KIT"},
                {"name": "SLOT_VALVE_BLADE", "displayName": "SLOT VALVE BLADE"},
                {"name": "TEFLON_ALIGN_PIN", "displayName": "TEFLON ALIGN PIN"},
                {"name": "O_RING", "displayName": "O-RING"}
            ]
        },
        {
            "category": "Leak",
            "subcategories": [
                {"name": "HELIUM_DETECTOR", "displayName": "HELIUM DETECTOR"}
            ]
        },
        {
            "category": "Pin",
            "subcategories": [
                {"name": "HOOK_LIFT_PIN", "displayName": "HOOK LIFT PIN"},
                {"name": "BELLOWS", "displayName": "BELLOWS"},
                {"name": "PIN_BOARD", "displayName": "PIN BOARD"},
                {"name": "LM_GUIDE", "displayName": "LM GUIDE"},
                {"name": "PIN_MOTOR_CONTROLLER", "displayName": "PIN MOTOR CONTROLLER"},
                {"name": "LASER_PIN_SENSOR", "displayName": "LASER PIN SENSOR"}
            ]
        },
        {
            "category": "EPD",
            "subcategories": [
                {"name": "DUAL", "displayName": "DUAL"}
            ]
        },
        {
            "category": "Board",
            "subcategories": [
                {"name": "DC_POWER_SUPPLY", "displayName": "DC POWER SUPPLY"},
                {"name": "PIO_SENSOR", "displayName": "PIO SENSOR"},
                {"name": "D_NET", "displayName": "D-NET"},
                {"name": "SIM_BOARD", "displayName": "SIM BOARD"}
            ]
        },
        {
            "category": "IGS Block",
            "subcategories": [
                {"name": "MFC", "displayName": "MFC"},
                {"name": "VALVE", "displayName": "VALVE"}
            ]
        },
        {
            "category": "Valve",
            "subcategories": [
                {"name": "SOLENOID", "displayName": "SOLENOID"},
                {"name": "PENDULUM_VALVE", "displayName": "PENDULUM VALVE"},
                {"name": "SLOT_VALVE_DOOR_VALVE", "displayName": "SLOT VALVE DOOR VALVE"},
                {"name": "SHUTOFF_VALVE", "displayName": "SHUTOFF VALVE"}
            ]
        },
        {
            "category": "Rack",
            "subcategories": [
                {"name": "RF_GENERATOR", "displayName": "RF GENERATOR"}
            ]
        },
        {
            "category": "ETC",
            "subcategories": [
                {"name": "BARATRON_ASSY", "displayName": "BARATRON ASSY"},
                {"name": "PIRANI_ASSY", "displayName": "PIRANI ASSY"},
                {"name": "VIEW_PORT_QUARTZ", "displayName": "VIEW PORT QUARTZ"},
                {"name": "FLOW_SWITCH", "displayName": "FLOW SWITCH"},
                {"name": "CERAMIC_PLATE", "displayName": "CERAMIC PLATE"},
                {"name": "MONITOR", "displayName": "MONITOR"},
                {"name": "KEYBOARD", "displayName": "KEYBOARD"},
                {"name": "SIDE_STORAGE", "displayName": "SIDE STORAGE"},
                {"name": "MULTI_PORT_32", "displayName": "32 MULTI PORT"},
                {"name": "MINI8", "displayName": "MINI8"},
                {"name": "TM_EPC_MFC", "displayName": "TM EPC (MFC)"}
            ]
        },
        {
            "category": "CTR",
            "subcategories": [
                {"name": "CTC", "displayName": "CTC"},
                {"name": "EFEM_CONTROLLER", "displayName": "EFEM CONTROLLER"}
            ]
        },
        {
            "category": "S/W",
            "subcategories": [
                {"name": "SW_PATCH", "displayName": "SW PATCH"}
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
    loadAllSupraxpMaintenanceData();
});