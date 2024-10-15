document.addEventListener('DOMContentLoaded', async () => {
    const tableHead = document.getElementById('integer-maintenance-table-head');
    const tableBody = document.getElementById('integer-maintenance-table-body');
    let allData = []; // 전역 변수로 선언

    // 서버로부터 모든 작업자의 데이터를 불러오는 함수
    async function loadAllIntegerMaintenanceData() {
        try {
            // 토큰을 가져옴 (로그인이 되어 있을 경우)
            const token = localStorage.getItem("x-access-token");

            // 서버에서 모든 작업자의 데이터를 가져옴
            const response = await axios.get('http://3.37.73.151:3001/integer-maintenance/all', {
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
            "category": "Swap Kit",
            "subcategories": [
                {"name": "SWAP_KIT", "displayName": "SWAP KIT"},
                {"name": "GAS_LINE_&_GAS_FILTER", "displayName": "GAS LINE & GAS FILTER"},
                {"name": "CERAMIC_PARTS", "displayName": "CERAMIC PARTS"},
                {"name": "MATCHER", "displayName": "MATCHER"},
                {"name": "PM_BAFFLE", "displayName": "PM BAFFLE"},
                {"name": "AM_BAFFLE", "displayName": "AM BAFFLE"},
                {"name": "FLANGE_ADAPTOR", "displayName": "FLANGE ADAPTOR"}
            ]
        },
        {
            "category": "Slot Valve",
            "subcategories": [
                {"name": "SLOT_VALVE_ASSY(HOUSING)", "displayName": "SLOT VALVE ASSY(HOUSING)"},
                {"name": "SLOT_VALVE", "displayName": "SLOT VALVE"},
                {"name": "DOOR_VALVE", "displayName": "DOOR VALVE"}
            ]
        },
        {
            "category": "Pendulum Valve",
            "subcategories": [
                {"name": "PENDULUM_VALVE", "displayName": "PENDULUM VALVE"}
            ]
        },
        {
            "category": "Pin Motor & CTR",
            "subcategories": [
                {"name": "PIN_ASSY_MODIFY", "displayName": "PIN ASSY MODIFY"},
                {"name": "MOTOR_&_CONTROLLER", "displayName": "MOTOR & CONTROLLER"},
                {"name": "PIN_구동부_ASSY", "displayName": "PIN 구동부 ASSY"},
                {"name": "PIN_BELLOWS", "displayName": "PIN BELLOWS"},
                {"name": "SENSOR", "displayName": "SENSOR"}
            ]
        },
        {
            "category": "Step Motor & CTR",
            "subcategories": [
                {"name": "STEP_MOTOR_&_CONTROLLER", "displayName": "STEP MOTOR & CONTROLLER"},
                {"name": "CASSETTE_&_HOLDER_PAD", "displayName": "CASSETTE & HOLDER PAD"},
                {"name": "BALL_SCREW_ASSY", "displayName": "BALL SCREW ASSY"},
                {"name": "BUSH", "displayName": "BUSH"},
                {"name": "MAIN_SHAFT", "displayName": "MAIN SHAFT"},
                {"name": "BELLOWS", "displayName": "BELLOWS"}
            ]
        },
        {
            "category": "Robot",
            "subcategories": [
                {"name": "EFEM_ROBOT_REP", "displayName": "EFEM ROBOT REP"},
                {"name": "TM_ROBOT_REP", "displayName": "TM ROBOT REP"},
                {"name": "EFEM_ROBOT_TEACHING", "displayName": "EFEM ROBOT TEACHING"},
                {"name": "TM_ROBOT_TEACHING", "displayName": "TM ROBOT TEACHING"}
            ]
        },
        {
            "category": "Vac. Line",
            "subcategories": [
                {"name": "UNDER_COVER", "displayName": "UNDER COVER"},
                {"name": "VAC._LINE", "displayName": "VAC. LINE"},
                {"name": "BARATRON_GAUGE", "displayName": "BARATRON GAUGE"},
                {"name": "PIRANI_GAUGE", "displayName": "PIRANI GAUGE"},
                {"name": "CONVACTRON_GAUGE", "displayName": "CONVACTRON GAUGE"},
                {"name": "MANUAL_VALVE", "displayName": "MANUAL VALVE"},
                {"name": "PNEUMATIC_VALVE", "displayName": "PNEUMATIC VALVE"},
                {"name": "ISOLATION_VALVE", "displayName": "ISOLATION VALVE"},
                {"name": "VACUUM_BLOCK", "displayName": "VACUUM BLOCK"},
                {"name": "CHECK_VALVE", "displayName": "CHECK VALVE"},
                {"name": "EPC", "displayName": "EPC"}
            ]
        },
        {
            "category": "Chuck",
            "subcategories": [
                {"name": "COOLING_CHUCK", "displayName": "COOLING CHUCK"},
                {"name": "HEATER_CHUCK", "displayName": "HEATER CHUCK"}
            ]
        },
        {
            "category": "Rack",
            "subcategories": [
                {"name": "GENERATOR", "displayName": "GENERATOR"}
            ]
        },
        {
            "category": "Board",
            "subcategories": [
                {"name": "AIO_CALIBRATION[PSK_BOARD]", "displayName": "AIO CALIBRATION[PSK BOARD]"},
                {"name": "AIO_CALIBRATION[TOS_BOARD]", "displayName": "AIO CALIBRATION[TOS BOARD]"}
            ]
        },
        {
            "category": "Sensor",
            "subcategories": [
                {"name": "CODED_SENSOR", "displayName": "CODED SENSOR"},
                {"name": "GAS_BOX_DOOR_SENSOR", "displayName": "GAS BOX DOOR SENSOR"},
                {"name": "LASER_SENSOR_AMP", "displayName": "LASER SENSOR AMP"}
            ]
        },
        {
            "category": "ETC",
            "subcategories": [
                {"name": "HE_LEAK_CHECK", "displayName": "HE LEAK CHECK"},
                {"name": "DIFFUSER", "displayName": "DIFFUSER"},
                {"name": "LOT_조사", "displayName": "LOT 조사"}
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
    loadAllIntegerMaintenanceData();
});