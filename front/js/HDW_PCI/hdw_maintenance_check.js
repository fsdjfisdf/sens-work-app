document.addEventListener('DOMContentLoaded', async () => {
    const tableHead = document.getElementById('hdw-maintenance-table-head');
    const tableBody = document.getElementById('hdw-maintenance-table-body');
    let allData = []; // 전역 변수로 선언

    // 서버로부터 모든 작업자의 데이터를 불러오는 함수
    async function loadAllHdwMaintenanceData() {
        try {
            // 토큰을 가져옴 (로그인이 되어 있을 경우)
            const token = localStorage.getItem("x-access-token");

            // 서버에서 모든 작업자의 데이터를 가져옴
            const response = await axios.get('http://3.37.73.151:3001/hdw-maintenance/all', {
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
    category: "전장부",
    subcategories: [
      { name: "OD_REP", displayName: "OD REP", 기준작업수: 3 },
      { name: "Relay_REP", displayName: "Relay REP", 기준작업수: 1 },
      { name: "Fan_REP", displayName: "Fan REP", 기준작업수: 1 },
      { name: "NTC_/_NTU_REP", displayName: "NTC / NTU REP", 기준작업수: 1 },
      { name: "SSR_REP", displayName: "SSR REP", 기준작업수: 3 },
      { name: "MC_REP", displayName: "MC REP", 기준작업수: 1 },
      { name: "Fuse_REP", displayName: "Fuse REP", 기준작업수: 1 },
      { name: "CT_REP", displayName: "CT REP", 기준작업수: 3 },
      { name: "HBD_REP", displayName: "HBD REP", 기준작업수: 1 },
      { name: "SMPS_REP", displayName: "SMPS REP", 기준작업수: 1 },
      { name: "PLC_(main_unit_제외)_REP", displayName: "PLC (main unit 제외) REP", 기준작업수: 3 },
      { name: "ELB_REP", displayName: "ELB REP", 기준작업수: 1 }
    ]
  },
  {
    category: "배관부",
    subcategories: [
      { name: "Heater_REP_(Halogen_lamp)", displayName: "Heater REP (Halogen lamp)", 기준작업수: 1 },
      { name: "Q'tz_tank_REP", displayName: "Q'tz tank REP", 기준작업수: 3 },
      { name: "Leak_troubleshooting", displayName: "Leak troubleshooting", 기준작업수: 3 },
      { name: "Flow_meter_REP", displayName: "Flow meter REP", 기준작업수: 1 },
      { name: "Air_valve_REP", displayName: "Air valve REP", 기준작업수: 1 },
      { name: "Shut_off_valve_REP", displayName: "Shut off valve REP", 기준작업수: 3 },
      { name: "Sol_valve_REP", displayName: "Sol valve REP", 기준작업수: 1 },
      { name: "Elbow_fitting_REP_(Qtz)", displayName: "Elbow fitting REP (Qtz)", 기준작업수: 3 },
      { name: "Leak_tray", displayName: "Leak tray", 기준작업수: 1 },
      { name: "TC_Sensor", displayName: "TC Sensor", 기준작업수: 1 }
    ]
  },
  {
    category: "SW",
    subcategories: [
      { name: "Touch_panel_patch", displayName: "Touch panel patch", 기준작업수: 3 },
      { name: "PLC_patch", displayName: "PLC patch", 기준작업수: 3 },
      { name: "Touch_panel_REP", displayName: "Touch panel REP", 기준작업수: 1 },
      { name: "PLC_REP", displayName: "PLC REP", 기준작업수: 1 }
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
    loadAllHdwMaintenanceData();
});