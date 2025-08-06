document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('x-access-token');

    if (!token) {
        alert('로그인이 필요합니다.');
        window.location.replace('./signin.html');
        return;
    }

const taskMapping = {
  "OD_REP": "OD REP",
  "Relay_REP": "Relay REP",
  "Fan_REP": "Fan REP",
  "NTC_NTU_REP": "NTC / NTU REP",
  "SSR_REP": "SSR REP",
  "MC_REP": "MC REP",
  "Fuse_REP": "Fuse REP",
  "CT_REP": "CT REP",
  "HBD_REP": "HBD REP",
  "SMPS_REP": "SMPS REP",
  "PLC_REP": "PLC (main unit 제외) REP",
  "ELB_REP": "ELB REP",
  "Heater_REP": "Heater REP (Halogen lamp)",
  "Qtz_tank_REP": "Q'tz tank REP",
  "Leak_troubleshooting": "Leak troubleshooting",
  "Flow_meter_REP": "Flow meter REP",
  "Air_valve_REP": "Air valve REP",
  "Shut_off_valve_REP": "Shut off valve REP",
  "Sol_valve_REP": "Sol valve REP",
  "Elbow_fitting_REP": "Elbow fitting REP (Qtz)",
  "Leak_tray": "Leak tray",
  "TC_Sensor": "TC Sensor",
  "Touch_panel_patch": "Touch panel patch",
  "PLC_patch": "PLC patch",
  "Touch_panel_REP": "Touch panel REP",
  "PLC_REP_SW": "PLC REP"
};


const taskWeights = {
  "OD_REP": 5,
  "Relay_REP": 4,
  "Fan_REP": 4,
  "NTC_NTU_REP": 2,
  "SSR_REP": 4,
  "MC_REP": 4,
  "Fuse_REP": 3,
  "CT_REP": 3,
  "HBD_REP": 4,
  "SMPS_REP": 4,
  "PLC_REP": 2,
  "ELB_REP": 2,
  "Heater_REP": 6,
  "Qtz_tank_REP": 6,
  "Leak_troubleshooting": 7,
  "Flow_meter_REP": 3,
  "Air_valve_REP": 3,
  "Shut_off_valve_REP": 5,
  "Sol_valve_REP": 3,
  "Elbow_fitting_REP": 5,
  "Leak_tray": 4,
  "TC_Sensor": 5,
  "Touch_panel_patch": 3,
  "PLC_patch": 3,
  "Touch_panel_REP": 3,
  "PLC_REP_SW": 3
};
    

const taskCategories = [
  {
    category: "전장부",
    subcategories: [
      { name: "OD_REP", displayName: "OD REP", 기준작업수: 3 },
      { name: "Relay_REP", displayName: "Relay REP", 기준작업수: 1 },
      { name: "Fan_REP", displayName: "Fan REP", 기준작업수: 1 },
      { name: "NTC_NTU_REP", displayName: "NTC / NTU REP", 기준작업수: 1 },
      { name: "SSR_REP", displayName: "SSR REP", 기준작업수: 3 },
      { name: "MC_REP", displayName: "MC REP", 기준작업수: 1 },
      { name: "Fuse_REP", displayName: "Fuse REP", 기준작업수: 1 },
      { name: "CT_REP", displayName: "CT REP", 기준작업수: 3 },
      { name: "HBD_REP", displayName: "HBD REP", 기준작업수: 1 },
      { name: "SMPS_REP", displayName: "SMPS REP", 기준작업수: 1 },
      { name: "PLC_REP", displayName: "PLC (main unit 제외) REP", 기준작업수: 3 },
      { name: "ELB_REP", displayName: "ELB REP", 기준작업수: 1 }
    ]
  },
  {
    category: "배관부",
    subcategories: [
      { name: "Heater_REP", displayName: "Heater REP (Halogen lamp)", 기준작업수: 1 },
      { name: "Qtz_tank_REP", displayName: "Q'tz tank REP", 기준작업수: 3 },
      { name: "Leak_troubleshooting", displayName: "Leak troubleshooting", 기준작업수: 3 },
      { name: "Flow_meter_REP", displayName: "Flow meter REP", 기준작업수: 1 },
      { name: "Air_valve_REP", displayName: "Air valve REP", 기준작업수: 1 },
      { name: "Shut_off_valve_REP", displayName: "Shut off valve REP", 기준작업수: 3 },
      { name: "Sol_valve_REP", displayName: "Sol valve REP", 기준작업수: 1 },
      { name: "Elbow_fitting_REP", displayName: "Elbow fitting REP (Qtz)", 기준작업수: 3 },
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
      { name: "PLC_REP_SW", displayName: "PLC REP", 기준작업수: 1 }
    ]
  }
];

    

async function loadWorklogData() {
    try {
        const response = await axios.get('http://3.37.73.151:3001/logs', {
            headers: {
                'x-access-token': token
            }
        });
        return response.data;
    } catch (error) {
        console.error('Worklog 데이터를 불러오는 중 오류 발생:', error);
        return [];
    }
}

async function loadHdwMaintenanceData() {
    try {
        const response = await axios.get('http://3.37.73.151:3001/hdw-maintenance/all', {
            headers: {
                'x-access-token': token
            }
        });
        return response.data;
    } catch (error) {
        console.error('Hdw Maintenance 데이터를 불러오는 중 오류 발생:', error);
        return [];
    }
}

function renderCombinedTable(worklogData, hdwData, taskCategories, filteredWorkers = null) {
    const worklogPercentages = JSON.parse(localStorage.getItem('worklogPercentages')) || {};

    const tableHead = document.getElementById('combined-table-head');
    const tableBody = document.getElementById('combined-table-body');
    const totalAverageContainer = document.getElementById('total-average-container'); // 전체 평균을 출력할 공간
    tableHead.innerHTML = '';
    tableBody.innerHTML = '';
    totalAverageContainer.innerHTML = ''; // 이전의 전체 평균을 지움

    let allWorkers = new Set(Object.keys(worklogPercentages));
    hdwData.forEach(hdw => allWorkers.add(hdw.name));
    allWorkers = Array.from(allWorkers);

    if (filteredWorkers) {
        allWorkers = allWorkers.filter(worker => filteredWorkers.includes(worker));
    }

    const averageScores = allWorkers.map(worker => {
        let totalWeightedPercent = 0;
        let totalWeight = 0;
    
        taskCategories.forEach(category => {
            category.subcategories.forEach(subcategory => {
                const taskKey = subcategory.name;
                const weight = taskWeights[taskKey] || 0;
    
                const mappedTaskNameWorklog = taskMapping[taskKey] || taskKey;
                const mappedTaskNameHdw = Object.keys(taskMapping).find(key => taskMapping[key] === taskKey) || taskKey;
    
                const worklogPercent = worklogPercentages[worker]?.[mappedTaskNameWorklog] || 0;
                const hdwItem = hdwData.find(hdw => hdw.name === worker);
                const hdwPercent = hdwItem ? hdwItem[mappedTaskNameHdw] || 0 : 0;
    
                const finalPercent = (worklogPercent * 0.8) + (hdwPercent * 0.2);
    
                totalWeightedPercent += finalPercent * weight;
                totalWeight += weight;
            });
        });
    
        const averagePercent = totalWeight > 0 ? totalWeightedPercent / totalWeight : 0;
        return { worker, averagePercent };
    });

    // 작업자를 평균 퍼센트에 따라 내림차순 정렬
    averageScores.sort((a, b) => b.averagePercent - a.averagePercent);
    const sortedWorkers = averageScores.map(score => score.worker);

    // 전체 평균 계산
    let totalAveragePercent = 0;
    averageScores.forEach(score => {
        totalAveragePercent += score.averagePercent;
    });
    totalAveragePercent /= averageScores.length;  // 전체 평균 계산

    // 전체 평균을 HTML에 표시
    totalAverageContainer.innerHTML = `Total Average : ${totalAveragePercent.toFixed(2)}%`;

    // 테이블 헤더 생성
    const headerRow = document.createElement('tr');
    headerRow.appendChild(document.createElement('th')).textContent = '';
    headerRow.appendChild(document.createElement('th')).textContent = '작업 항목';
    sortedWorkers.forEach(worker => {
        const th = document.createElement('th');
        th.textContent = worker;
        headerRow.appendChild(th);
    });
    tableHead.appendChild(headerRow);

    // AVERAGE 행 추가
    const averageRow = document.createElement('tr');
    averageRow.style.backgroundColor = '#e0e0e0'; // AVERAGE 행의 색을 회색으로 설정
    averageRow.style.fontWeight = 'bold';
    averageRow.appendChild(document.createElement('td')).textContent = ''; // 중분류 열 비워둠
    averageRow.appendChild(document.createElement('td')).textContent = 'AVERAGE';
    sortedWorkers.forEach(worker => {
        const averagePercent = averageScores.find(score => score.worker === worker).averagePercent;
        const td = document.createElement('td');
        td.textContent = `${averagePercent.toFixed(2)}%`;
        averageRow.appendChild(td);
    });
    tableHead.appendChild(averageRow);

    // 작업 항목 및 작업자별 퍼센트 계산
    taskCategories.forEach(category => {
        let firstCategoryRow = true;
        category.subcategories.forEach((subcategory, index) => {
            const row = document.createElement('tr');

            // 중분류(카테고리) 열 추가
            if (firstCategoryRow) {
                const categoryCell = document.createElement('td');
                categoryCell.rowSpan = category.subcategories.length;
                categoryCell.textContent = category.category;
                categoryCell.style.fontWeight = 'bold';
                row.appendChild(categoryCell);
                firstCategoryRow = false;
            }

            const taskCell = document.createElement('td');
            taskCell.textContent = subcategory.displayName;
            row.appendChild(taskCell);

            sortedWorkers.forEach(worker => {
                const mappedTaskNameWorklog = taskMapping[subcategory.name] || subcategory.name;
                const mappedTaskNameHdw = Object.keys(taskMapping).find(key => taskMapping[key] === subcategory.name) || subcategory.name;

                const worklogPercent = worklogPercentages[worker]?.[mappedTaskNameWorklog] || 0;
                const hdwItem = hdwData.find(hdw => hdw.name === worker);
                const hdwPercent = hdwItem ? hdwItem[mappedTaskNameHdw] || 0 : 0;

                const finalPercent = (worklogPercent * 0.8) + (hdwPercent * 0.2);

                const percentCell = document.createElement('td');
                percentCell.textContent = `${finalPercent.toFixed(2)}%`;

                // 퍼센트에 따른 색상 적용
                if (finalPercent === 100) {
                    percentCell.style.color = 'blue';
                } else if (finalPercent === 0) {
                    percentCell.style.color = 'red';
                } else {
                    percentCell.style.color = 'black';
                }

                row.appendChild(percentCell);
            });

            tableBody.appendChild(row);
        });
    });
}

function applySearchFilter(searchName, worklogData, hdwData, taskCategories) {
    console.log("Applying search filter for:", searchName); // 필터 적용 콘솔 로그

    // 검색어가 포함된 작업자만 필터링
    const filteredWorkers = worklogData
        .filter(log => log.task_man.includes(searchName))  // 작업자 필터링
        .map(log => log.task_man);  // 필터된 작업자의 이름 리스트 생성

    const filteredHdwWorkers = hdwData
        .filter(hdw => hdw.name.includes(searchName))  // Hdw 데이터에서 작업자 필터링
        .map(hdw => hdw.name);  // 필터된 작업자의 이름 리스트 생성

    const filteredWorkerNames = [...new Set([...filteredWorkers, ...filteredHdwWorkers])];  // 중복 제거

    console.log("Filtered workers:", filteredWorkerNames);

    // 필터링된 작업자들만 테이블에 표시
    renderCombinedTable(worklogData, hdwData, taskCategories, filteredWorkerNames);
}

document.getElementById('search-button').addEventListener('click', () => {
    const searchName = document.getElementById('search-name').value.trim();
    if (searchName) {
        applySearchFilter(searchName, worklogData, hdwData, taskCategories);  // 검색 실행
    }
});

document.getElementById('reset-button').addEventListener('click', () => {
    document.getElementById('search-name').value = ''; // 검색어 초기화
    renderCombinedTable(worklogData, hdwData, taskCategories); // 전체 데이터 다시 표시
});

// 데이터를 불러오고 전역 변수에 저장
let worklogData = await loadWorklogData();
let hdwData = await loadHdwMaintenanceData();

// 데이터를 렌더링
renderCombinedTable(worklogData, hdwData, taskCategories);
});