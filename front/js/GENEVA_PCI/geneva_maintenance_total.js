document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('x-access-token');

    if (!token) {
        alert('로그인이 필요합니다.');
        window.location.replace('./signin.html');
        return;
    }

const taskMapping = {
  "LP_Escort": "LP Escort",
  "Robot_Escort": "Robot Escort",
  "SR8240_Teaching": "SR8240 Teaching",
  "GENMARK_Robot_Teaching": "GENMARK robot teaching",
  "SR8240_Robot_REP": "SR8240 Robot REP",
  "GENMARK_Robot_REP": "GENMARK Robot REP",
  "Robot_Controller_REP": "Robot Controller REP",
  "FFU_Controller": "FFU Controller",
  "Fan": "Fan",
  "Motor_Driver": "Motor Driver",
  "Elbow_Heater": "Elbow heater",
  "Insulation_Heater": "Insulation heater",
  "Chuck_Heater": "Chuck heater",
  "Harmonic_Driver": "Harmonic driver",
  "Amplifier": "Amplifier (Disc controller)",
  "Disc_Bearing": "Disc bearing",
  "Chuck_Leveling": "Chuck leveling",
  "Wafer_Support_Pin_Alignment": "Wafer support pin alignment",
  "Temp_Profile": "Temp profile",
  "O2_Leak_Test": "O2 leak test",
  "Chuck_Up_Down_Status": "Chuck up & down status",
  "Ring_Seal": "Ring seal",
  "Door_Seal": "Door seal",
  "Ring_seal_Oring": "Ring seal O-ring",
  "Door_seal_Oring": "Door seal O-ring",
  "Gas_Box_Board": "Gas Box Board",
  "Temp_Controller_Board": "Temp Controller Board",
  "Power_Distribution_Board": "Power Distribution Board",
  "DC_Power_Supply": "DC Power Supply",
  "Facility_Board": "Facility Board",
  "Station_Board": "Station Board",
  "Bubbler_Board": "Bubbler Board",
  "D_NET": "D-NET",
  "MFC": "MFC",
  "Valve": "Valve",
  "O2_Analyzer": "O2 analyzer 교체",
  "O2_Controller": "O2 controller 교체",
  "O2_Pump": "O2 pump 교체",
  "O2_Cell": "O2 cell 교체",
  "O2_Sample_Valve": "O2 Sample valve",
  "Feed_Delivery_Valve": "Feed & Delivery valve",
  "Fill_Vent_Valve": "Fill & Vent valve",
  "Drain_Valve": "Drain valve",
  "APC_Valve": "APC valve",
  "Bypass_Valve": "Bypass valve",
  "Shutoff_Valve": "Shutoff valve",
  "Vac_Sol_Valve": "Vac sol valve",
  "Vac_CDA_Valve": "Vac CDA valve",
  "Bubbler_Level_Sensor": "Bubbler level sensor",
  "Bubbler_Flexible_Hose": "Bubbler flexible hose",
  "Baratron_Assy": "Baratron Ass'y",
  "View_Port": "View Port",
  "Flow_Switch": "Flow Switch",
  "LL_Door_Cylinder": "LL Door cylinder",
  "Chuck_Cylinder": "Chuck cylinder",
  "Monitor": "Monitor",
  "Keyboard": "Keyboard",
  "Mouse": "Mouse",
  "Water_Leak_Detector": "Water Leak Detector",
  "Formic_Detector": "Formic Detector",
  "Exhaust_Gauge": "Exhaust gauge",
  "CTC": "CTC",
  "EDA": "EDA",
  "Temp_Limit_Controller": "Temp Limit Controller",
  "Temp_Controller": "Temp Controller",
  "SW_Patch": "S/W Patch"
};

    

const taskCategories = [
  {
    category: "Escort",
    subcategories: [
      { name: "LP_Escort", displayName: "LP Escort", 기준작업수: 1 },
      { name: "Robot_Escort", displayName: "Robot Escort", 기준작업수: 1 }
    ]
  },
  {
    category: "EFEM Robot",
    subcategories: [
      { name: "SR8240_Teaching", displayName: "SR8240 Teaching", 기준작업수: 3 },
      { name: "GENMARK_Robot_Teaching", displayName: "GENMARK robot teaching", 기준작업수: 3 },
      { name: "SR8240_Robot_REP", displayName: "SR8240 Robot REP", 기준작업수: 3 },
      { name: "GENMARK_Robot_REP", displayName: "GENMARK Robot REP", 기준작업수: 3 },
      { name: "Robot_Controller_REP", displayName: "Robot Controller REP", 기준작업수: 3 }
    ]
  },
  {
    category: "FFU (EFEM, TM)",
    subcategories: [
      { name: "FFU_Controller", displayName: "FFU Controller", 기준작업수: 3 },
      { name: "Fan", displayName: "Fan", 기준작업수: 3 },
      { name: "Motor_Driver", displayName: "Motor Driver", 기준작업수: 3 }
    ]
  },
  {
    category: "Heater",
    subcategories: [
      { name: "Elbow_Heater", displayName: "Elbow heater", 기준작업수: 3 },
      { name: "Insulation_Heater", displayName: "Insulation heater", 기준작업수: 3 },
      { name: "Chuck_Heater", displayName: "Chuck heater", 기준작업수: 3 }
    ]
  },
  {
    category: "Disc",
    subcategories: [
      { name: "Harmonic_Driver", displayName: "Harmonic driver", 기준작업수: 3 },
      { name: "Amplifier", displayName: "Amplifier (Disc controller)", 기준작업수: 3 },
      { name: "Disc_Bearing", displayName: "Disc bearing", 기준작업수: 3 }
    ]
  },
  {
    category: "PM 후",
    subcategories: [
      { name: "Chuck_Leveling", displayName: "Chuck leveling", 기준작업수: 3 },
      { name: "Wafer_Support_Pin_Alignment", displayName: "Wafer support pin alignment", 기준작업수: 3 },
      { name: "Temp_Profile", displayName: "Temp profile", 기준작업수: 3 },
      { name: "O2_Leak_Test", displayName: "O2 leak test", 기준작업수: 3 },
      { name: "Chuck_Up_Down_Status", displayName: "Chuck up & down status", 기준작업수: 3 }
    ]
  },
  {
    category: "Sealing",
    subcategories: [
      { name: "Ring_Seal", displayName: "Ring seal", 기준작업수: 3 },
      { name: "Door_Seal", displayName: "Door seal", 기준작업수: 3 }
    ]
  },
  {
    category: "LL O-ring",
    subcategories: [
      { name: "Ring_seal_Oring", displayName: "Ring seal O-ring", 기준작업수: 3 },
      { name: "Door_seal_Oring", displayName: "Door seal O-ring", 기준작업수: 3 }
    ]
  },
  {
    category: "Board",
    subcategories: [
      { name: "Gas_Box_Board", displayName: "Gas Box Board", 기준작업수: 1 },
      { name: "Temp_Controller_Board", displayName: "Temp Controller Board", 기준작업수: 1 },
      { name: "Power_Distribution_Board", displayName: "Power Distribution Board", 기준작업수: 1 },
      { name: "DC_Power_Supply", displayName: "DC Power Supply", 기준작업수: 1 },
      { name: "Facility_Board", displayName: "Facility Board", 기준작업수: 1 },
      { name: "Station_Board", displayName: "Station Board", 기준작업수: 1 },
      { name: "Bubbler_Board", displayName: "Bubbler Board", 기준작업수: 1 },
      { name: "D_NET", displayName: "D-NET", 기준작업수: 1 }
    ]
  },
  {
    category: "Gas box",
    subcategories: [
      { name: "MFC", displayName: "MFC", 기준작업수: 3 },
      { name: "Valve", displayName: "Valve", 기준작업수: 3 }
    ]
  },
  {
    category: "O2 analyzer",
    subcategories: [
      { name: "O2_Analyzer", displayName: "O2 analyzer 교체", 기준작업수: 3 },
      { name: "O2_Controller", displayName: "O2 controller 교체", 기준작업수: 3 },
      { name: "O2_Pump", displayName: "O2 pump 교체", 기준작업수: 3 },
      { name: "O2_Cell", displayName: "O2 cell 교체", 기준작업수: 3 }
    ]
  },
  {
    category: "Valve",
    subcategories: [
      { name: "O2_Sample_Valve", displayName: "O2 Sample valve", 기준작업수: 3 },
      { name: "Feed_Delivery_Valve", displayName: "Feed & Delivery valve", 기준작업수: 3 },
      { name: "Fill_Vent_Valve", displayName: "Fill & Vent valve", 기준작업수: 3 },
      { name: "Drain_Valve", displayName: "Drain valve", 기준작업수: 3 },
      { name: "APC_Valve", displayName: "APC valve", 기준작업수: 3 },
      { name: "Bypass_Valve", displayName: "Bypass valve", 기준작업수: 3 },
      { name: "Shutoff_Valve", displayName: "Shutoff valve", 기준작업수: 3 },
      { name: "Vac_Sol_Valve", displayName: "Vac sol valve", 기준작업수: 3 },
      { name: "Vac_CDA_Valve", displayName: "Vac CDA valve", 기준작업수: 3 }
    ]
  },
  {
    category: "Bubbler",
    subcategories: [
      { name: "Bubbler_Level_Sensor", displayName: "Bubbler level sensor", 기준작업수: 1 },
      { name: "Bubbler_Flexible_Hose", displayName: "Bubbler flexible hose", 기준작업수: 1 }
    ]
  },
  {
    category: "ETC",
    subcategories: [
      { name: "Baratron_Assy", displayName: "Baratron Ass'y", 기준작업수: 1 },
      { name: "View_Port", displayName: "View Port", 기준작업수: 1 },
      { name: "Flow_Switch", displayName: "Flow Switch", 기준작업수: 3 },
      { name: "LL_Door_Cylinder", displayName: "LL Door cylinder", 기준작업수: 3 },
      { name: "Chuck_Cylinder", displayName: "Chuck cylinder", 기준작업수: 3 },
      { name: "Monitor", displayName: "Monitor", 기준작업수: 1 },
      { name: "Keyboard", displayName: "Keyboard", 기준작업수: 1 },
      { name: "Mouse", displayName: "Mouse", 기준작업수: 1 },
      { name: "Water_Leak_Detector", displayName: "Water Leak Detector", 기준작업수: 3 },
      { name: "Formic_Detector", displayName: "Formic Detector", 기준작업수: 3 },
      { name: "Exhaust_Gauge", displayName: "Exhaust gauge", 기준작업수: 3 }
    ]
  },
  {
    category: "CTR",
    subcategories: [
      { name: "CTC", displayName: "CTC", 기준작업수: 3 },
      { name: "EDA", displayName: "EDA", 기준작업수: 1 },
      { name: "Temp_Limit_Controller", displayName: "Temp Limit Controller", 기준작업수: 3 },
      { name: "Temp_Controller", displayName: "Temp Controller", 기준작업수: 3 }
    ]
  },
  {
    category: "S/W",
    subcategories: [
      { name: "SW_Patch", displayName: "S/W Patch", 기준작업수: 3 }
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

async function loadGenevaMaintenanceData() {
    try {
        const response = await axios.get('http://3.37.73.151:3001/geneva-maintenance/all', {
            headers: {
                'x-access-token': token
            }
        });
        return response.data;
    } catch (error) {
        console.error('Geneva Maintenance 데이터를 불러오는 중 오류 발생:', error);
        return [];
    }
}

function renderCombinedTable(worklogData, genevaData, taskCategories, filteredWorkers = null) {
    const worklogPercentages = JSON.parse(localStorage.getItem('worklogPercentages')) || {};

    const tableHead = document.getElementById('combined-table-head');
    const tableBody = document.getElementById('combined-table-body');
    const totalAverageContainer = document.getElementById('total-average-container'); // 전체 평균을 출력할 공간
    tableHead.innerHTML = '';
    tableBody.innerHTML = '';
    totalAverageContainer.innerHTML = ''; // 이전의 전체 평균을 지움

    let allWorkers = new Set(Object.keys(worklogPercentages));
    genevaData.forEach(geneva => allWorkers.add(geneva.name));
    allWorkers = Array.from(allWorkers);

    if (filteredWorkers) {
        allWorkers = allWorkers.filter(worker => filteredWorkers.includes(worker));
    }

    const averageScores = allWorkers.map(worker => {
        let totalPercent = 0;
        let taskCount = 0;

        taskCategories.forEach(category => {
            category.subcategories.forEach(subcategory => {
                const mappedTaskNameWorklog = taskMapping[subcategory.name] || subcategory.name;
                const mappedTaskNameGeneva = Object.keys(taskMapping).find(key => taskMapping[key] === subcategory.name) || subcategory.name;

                const worklogPercent = worklogPercentages[worker]?.[mappedTaskNameWorklog] || 0;
                const genevaItem = genevaData.find(geneva => geneva.name === worker);
                const genevaPercent = genevaItem ? genevaItem[mappedTaskNameGeneva] || 0 : 0;

                const finalPercent = (worklogPercent * 0.8) + (genevaPercent * 0.2);
                totalPercent += finalPercent;
                taskCount++;
            });
        });

        const averagePercent = totalPercent / taskCount;
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
                const mappedTaskNameGeneva = Object.keys(taskMapping).find(key => taskMapping[key] === subcategory.name) || subcategory.name;

                const worklogPercent = worklogPercentages[worker]?.[mappedTaskNameWorklog] || 0;
                const genevaItem = genevaData.find(geneva => geneva.name === worker);
                const genevaPercent = genevaItem ? genevaItem[mappedTaskNameGeneva] || 0 : 0;

                const finalPercent = (worklogPercent * 0.8) + (genevaPercent * 0.2);

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

function applySearchFilter(searchName, worklogData, genevaData, taskCategories) {
    console.log("Applying search filter for:", searchName); // 필터 적용 콘솔 로그

    // 검색어가 포함된 작업자만 필터링
    const filteredWorkers = worklogData
        .filter(log => log.task_man.includes(searchName))  // 작업자 필터링
        .map(log => log.task_man);  // 필터된 작업자의 이름 리스트 생성

    const filteredGenevaWorkers = genevaData
        .filter(geneva => geneva.name.includes(searchName))  // Geneva 데이터에서 작업자 필터링
        .map(geneva => geneva.name);  // 필터된 작업자의 이름 리스트 생성

    const filteredWorkerNames = [...new Set([...filteredWorkers, ...filteredGenevaWorkers])];  // 중복 제거

    console.log("Filtered workers:", filteredWorkerNames);

    // 필터링된 작업자들만 테이블에 표시
    renderCombinedTable(worklogData, genevaData, taskCategories, filteredWorkerNames);
}

document.getElementById('search-button').addEventListener('click', () => {
    const searchName = document.getElementById('search-name').value.trim();
    if (searchName) {
        applySearchFilter(searchName, worklogData, genevaData, taskCategories);  // 검색 실행
    }
});

document.getElementById('reset-button').addEventListener('click', () => {
    document.getElementById('search-name').value = ''; // 검색어 초기화
    renderCombinedTable(worklogData, genevaData, taskCategories); // 전체 데이터 다시 표시
});

// 데이터를 불러오고 전역 변수에 저장
let worklogData = await loadWorklogData();
let genevaData = await loadGenevaMaintenanceData();

// 데이터를 렌더링
renderCombinedTable(worklogData, genevaData, taskCategories);
});