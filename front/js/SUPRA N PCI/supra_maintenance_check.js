document.addEventListener('DOMContentLoaded', async () => {
    const tableHead = document.getElementById('supra-maintenance-table-head');
    const tableBody = document.getElementById('supra-maintenance-table-body');
    let allData = []; // 전역 변수로 선언

    // 서버로부터 모든 작업자의 데이터를 불러오는 함수
    async function loadAllSupraMaintenanceData() {
        try {
            // 토큰을 가져옴 (로그인이 되어 있을 경우)
            const token = localStorage.getItem("x-access-token");

            // 서버에서 모든 작업자의 데이터를 가져옴
            const response = await axios.get('http://3.37.73.151:3001/supra-maintenance/all', {
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
                { name: "LP_ESCORT", displayName: "LP ESCORT" },
                { name: "ROBOT_ESCORT", displayName: "Robot Escort" }
            ]
        },
        {
            category: "EFEM Robot",
            subcategories: [
                { name: "EFEM_ROBOT_TEACHING", displayName: "EFEM ROBOT TEACHING" },
                { name: "EFEM_ROBOT_REP", displayName: "EFEM ROBOT REP" },
                { name: "EFEM_ROBOT_CONTROLLER_REP", displayName: "EFEM ROBOT CONTROLLER REP" }
            ]
        },
        {
            category: "TM Robot",
            subcategories: [
                { name: "TM_ROBOT_TEACHING", displayName: "TM ROBOT TEACHING" },
                { name: "TM_ROBOT_REP", displayName: "TM ROBOT REP" },
                { name: "TM_ROBOT_CONTROLLER_REP", displayName: "TM ROBOT CONTROLLER REP" },
                { name: "PASSIVE_PAD_REP", displayName: "Passive Pad REP" }
            ]
        },
        {
            category: "BM Module",
            subcategories: [
                { name: "PIN_CYLINDER", displayName: "Pin Cylinder" },
                { name: "PUSHER_CYLINDER", displayName: "Pusher Cylinder" },
                { name: "IB_FLOW", displayName: "IB Flow" },
                { name: "DRT", displayName: "DRT" }
            ]
        },
        {
            category: "FFU (EFEM, TM)",
            subcategories: [
                { name: "FFU_CONTROLLER", displayName: "FFU Controller" },
                { name: "FAN", displayName: "FAN" },
                { name: "MOTOR_DRIVER", displayName: "Motor Driver" }
            ]
        },
        {
            category: "FCIP",
            subcategories: [
                { name: "FCIP", displayName: "FCIP" },
                { name: "R1", displayName: "R1" },
                { name: "R3", displayName: "R3" },
                { name: "R5", displayName: "R5" },
                { name: "R3_TO_R5", displayName: "R3 To R5" }
            ]
        },
        {
            category: "Microwave",
            subcategories: [
                { name: "MICROWAVE", displayName: "Microwave" },
                { name: "APPLICATOR", displayName: "Applicator" },
                { name: "GENERATOR", displayName: "Generator" }
            ]
        },
        {
            category: "Chuck",
            subcategories: [
                { name: "CHUCK", displayName: "Chuck" }
            ]
        },
        {
            category: "Process Kit",
            subcategories: [
                { name: "PROCESS_KIT", displayName: "Process Kit" }
            ]
        },
        {
            category: "Leak",
            subcategories: [
                { name: "HELIUM_DETECTOR", displayName: "Helium Detector" }
            ]
        },
        {
            category: "Pin",
            subcategories: [
                { name: "HOOK_LIFT_PIN", displayName: "Hook Lift Pin" },
                { name: "BELLOWS", displayName: "Bellows" },
                { name: "PIN_SENSOR", displayName: "Pin Sensor" },
                { name: "LM_GUIDE", displayName: "LM Guide" },
                { name: "PIN_MOTOR_CONTROLLER", displayName: "Pin Motor Controller" }
            ]
        },
        {
            category: "EPD",
            subcategories: [
                { name: "SINGLE_EPD", displayName: "SINGLE EPD" },
                { name: "DUAL_EPD", displayName: "DUAL EPD" }
            ]
        },
        {
            category: "Board",
            subcategories: [
                { name: "GAS_BOX_BOARD", displayName: "Gas Box Board" },
                { name: "TEMP_CONTROLLER_BOARD", displayName: "Temp Controller Board" },
                { name: "POWER_DISTRIBUTION_BOARD", displayName: "Power Distribution Board" },
                { name: "DC_POWER_SUPPLY", displayName: "DC Power Supply" },
                { name: "BM_SENSOR", displayName: "BM Sensor" },
                { name: "PIO_SENSOR", displayName: "PIO Sensor" },
                { name: "SAFETY_MODULE", displayName: "Safety Module" },
                { name: "D_NET", displayName: "D-NET" }
            ]
        },
        {
            category: "Valve",
            subcategories: [
                { name: "SOLENOID", displayName: "Solenoid" },
                { name: "FAST_VAC_VALVE", displayName: "Fast Vac Valve" },
                { name: "SLOW_VAC_VALVE", displayName: "Slow Vac Valve" },
                { name: "SLIT_DOOR", displayName: "Slit Door" },
                { name: "APC_VALVE", displayName: "APC Valve" },
                { name: "SHUTOFF_VALVE", displayName: "Shutoff Valve" }
            ]
        },
        {
            category: "ETC",
            subcategories: [
                { name: "BARATRON_ASSY", displayName: "Baratron Ass'y" },
                { name: "PIRANI_ASSY", displayName: "Pirani Ass'y" },
                { name: "VIEW_PORT_QUARTZ", displayName: "View Port Quartz" },
                { name: "FLOW_SWITCH", displayName: "Flow Switch" },
                { name: "CERAMIC_PLATE", displayName: "Ceramic Plate" },
                { name: "MONITOR", displayName: "Monitor" },
                { name: "KEYBOARD", displayName: "Keyboard" },
                { name: "MOUSE", displayName: "Mouse" }
            ]
        },
        {
            category: "24Y 신규",
            subcategories: [
                { name: "CTC", displayName: "CTC" },
                { name: "PMC", displayName: "PMC" },
                { name: "EDA", displayName: "EDA" },
                { name: "EFEM_CONTROLLER", displayName: "EFEM CONTROLLER" },
                { name: "SW_PATCH", displayName: "S/W PATCH" }
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
    loadAllSupraMaintenanceData();
});