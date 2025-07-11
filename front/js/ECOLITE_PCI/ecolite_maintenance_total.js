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
  "M124V_Teaching": "M124V Teaching",
  "M124C_Teaching": "M124C Teaching",
  "EFEM_Robot_REP": "Robot REP",
  "EFEM_Robot_Controller_REP": "Robot Controller REP",
  "SR8250_Teaching": "SR8250 Teaching",
  "SR8232_Teaching": "SR8232 Teaching",
  "TM_Robot_REP": "Robot REP",
  "TM_Robot_Controller_REP": "Robot Controller REP",
  "Pin_Cylinder": "Pin Cylinder",
  "Pusher_Cylinder": "Pusher Cylinder",
  "DRT": "DRT",
  "FFU_Controller": "FFU Controller",
  "FFU_Fan": "Fan",
  "FFU_Motor_Driver": "Motor Driver",
  "Microwave": "Microwave",
  "Applicator": "Applicator",
  "Applicator_Tube": "Applicator Tube",
  "Microwave_Generator": "Generator",
  "RF_Matcher": "Matcher",
  "RF_Generator": "Generator",
  "Chuck": "Chuck",
  "Toplid_Process_Kit": "Toplid Process Kit",
  "Chamber_Process_Kit": "Chamber Process Kit",
  "Helium_Detector": "Helium Detector",
  "Hook_Lift_Pin": "Hook Lift Pin",
  "Pin_Bellows": "Bellows",
  "Pin_Sensor": "Pin Sensor",
  "LM_Guide": "LM Guide",
  "HOOK_LIFTER_SERVO_MOTOR": "HOOK LIFTER SERVO MOTOR",
  "Pin_Motor_Controller": "Pin Motor Controller",
  "EPD_Single": "Single",
  "Gas_Box_Board": "Gas Box Board",
  "Power_Distribution_Board": "Power Distribution Board",
  "DC_Power_Supply": "DC Power Supply",
  "BM_Sensor": "BM Sensor",
  "PIO_Sensor": "PIO Sensor",
  "Safety_Module": "Safety Module",
  "IO_BOX": "IO BOX",
  "Rack_Board": "Rack Board",
  "D_NET": "D-NET",
  "IGS_MFC": "MFC",
  "IGS_Valve": "Valve",
  "Solenoid": "Solenoid",
  "Fast_Vac_Valve": "Fast Vac Valve",
  "Slow_Vac_Valve": "Slow Vac Valve",
  "Slit_Door": "Slit Door",
  "APC_Valve": "APC Valve",
  "Shutoff_Valve": "Shutoff Valve",
  "Baratron_ASSY": "Baratron Ass'y",
  "Pirani_ASSY": "Pirani Ass'y",
  "View_Port_Quartz": "View Port Quartz",
  "Flow_Switch": "Flow Switch",
  "Monitor": "Monitor",
  "Keyboard": "Keyboard",
  "Mouse": "Mouse",
  "Water_Leak_Detector": "Water Leak Detector",
  "Manometer": "Manometer",
  "LIGHT_CURTAIN": "LIGHT CURTAIN",
  "GAS_SPRING": "GAS SPRING",
  "CTC": "CTC",
  "PMC": "PMC",
  "EDA": "EDA",
  "EFEM_CONTROLLER": "EFEM CONTROLLER",
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
      { name: "SR8240_Teaching", displayName: "SR8240 Teaching", 기준작업수: 5 },
      { name: "M124V_Teaching", displayName: "M124V Teaching", 기준작업수: 5 },
      { name: "M124C_Teaching", displayName: "M124C Teaching", 기준작업수: 5 },
      { name: "EFEM_Robot_REP", displayName: "Robot REP", 기준작업수: 5 },
      { name: "EFEM_Robot_Controller_REP", displayName: "Robot Controller REP", 기준작업수: 5 }
    ]
  },
  {
    category: "TM Robot",
    subcategories: [
      { name: "SR8250_Teaching", displayName: "SR8250 Teaching", 기준작업수: 5 },
      { name: "SR8232_Teaching", displayName: "SR8232 Teaching", 기준작업수: 5 },
      { name: "TM_Robot_REP", displayName: "Robot REP", 기준작업수: 5 },
      { name: "TM_Robot_Controller_REP", displayName: "Robot Controller REP", 기준작업수: 5 }
    ]
  },
  {
    category: "BM Module",
    subcategories: [
      { name: "Pin_Cylinder", displayName: "Pin Cylinder", 기준작업수: 5 },
      { name: "Pusher_Cylinder", displayName: "Pusher Cylinder", 기준작업수: 5 },
      { name: "DRT", displayName: "DRT", 기준작업수: 5 }
    ]
  },
  {
    category: "FFU (EFEM, TM)",
    subcategories: [
      { name: "FFU_Controller", displayName: "FFU Controller", 기준작업수: 3 },
      { name: "FFU_Fan", displayName: "Fan", 기준작업수: 3 },
      { name: "FFU_Motor_Driver", displayName: "Motor Driver", 기준작업수: 3 }
    ]
  },
  {
    category: "Microwave",
    subcategories: [
      { name: "Microwave", displayName: "Microwave", 기준작업수: 1 },
      { name: "Applicator", displayName: "Applicator", 기준작업수: 3 },
      { name: "Applicator_Tube", displayName: "Applicator Tube", 기준작업수: 3 },
      { name: "Microwave_Generator", displayName: "Generator", 기준작업수: 3 }
    ]
  },
  {
    category: "RF bias",
    subcategories: [
      { name: "RF_Matcher", displayName: "Matcher", 기준작업수: 3 },
      { name: "RF_Generator", displayName: "Generator", 기준작업수: 3 }
    ]
  },
  {
    category: "Chuck",
    subcategories: [
      { name: "Chuck", displayName: "Chuck", 기준작업수: 3 }
    ]
  },
  {
    category: "Process Kit",
    subcategories: [
      { name: "Toplid_Process_Kit", displayName: "Toplid Process Kit", 기준작업수: 1 },
      { name: "Chamber_Process_Kit", displayName: "Chamber Process Kit", 기준작업수: 5 }
    ]
  },
  {
    category: "Leak",
    subcategories: [
      { name: "Helium_Detector", displayName: "Helium Detector", 기준작업수: 5 }
    ]
  },
  {
    category: "Pin",
    subcategories: [
      { name: "Hook_Lift_Pin", displayName: "Hook Lift Pin", 기준작업수: 3 },
      { name: "Pin_Bellows", displayName: "Bellows", 기준작업수: 3 },
      { name: "Pin_Sensor", displayName: "Pin Sensor", 기준작업수: 3 },
      { name: "LM_Guide", displayName: "LM Guide", 기준작업수: 3 },
      { name: "HOOK_LIFTER_SERVO_MOTOR", displayName: "HOOK LIFTER SERVO MOTOR", 기준작업수: 3 },
      { name: "Pin_Motor_Controller", displayName: "Pin Motor Controller", 기준작업수: 3 }
    ]
  },
  {
    category: "EPD",
    subcategories: [
      { name: "EPD_Single", displayName: "Single", 기준작업수: 1 }
    ]
  },
  {
    category: "Board",
    subcategories: [
      { name: "Gas_Box_Board", displayName: "Gas Box Board", 기준작업수: 1 },
      { name: "Power_Distribution_Board", displayName: "Power Distribution Board", 기준작업수: 1 },
      { name: "DC_Power_Supply", displayName: "DC Power Supply", 기준작업수: 1 },
      { name: "BM_Sensor", displayName: "BM Sensor", 기준작업수: 1 },
      { name: "PIO_Sensor", displayName: "PIO Sensor", 기준작업수: 1 },
      { name: "Safety_Module", displayName: "Safety Module", 기준작업수: 1 },
      { name: "IO_BOX", displayName: "IO BOX", 기준작업수: 5 },
      { name: "Rack_Board", displayName: "Rack Board", 기준작업수: 1 },
      { name: "D_NET", displayName: "D-NET", 기준작업수: 1 }
    ]
  },
  {
    category: "IGS Block",
    subcategories: [
      { name: "IGS_MFC", displayName: "MFC", 기준작업수: 1 },
      { name: "IGS_Valve", displayName: "Valve", 기준작업수: 1 }
    ]
  },
  {
    category: "Valve",
    subcategories: [
      { name: "Solenoid", displayName: "Solenoid", 기준작업수: 1 },
      { name: "Fast_Vac_Valve", displayName: "Fast Vac Valve", 기준작업수: 1 },
      { name: "Slow_Vac_Valve", displayName: "Slow Vac Valve", 기준작업수: 1 },
      { name: "Slit_Door", displayName: "Slit Door", 기준작업수: 1 },
      { name: "APC_Valve", displayName: "APC Valve", 기준작업수: 1 },
      { name: "Shutoff_Valve", displayName: "Shutoff Valve", 기준작업수: 1 }
    ]
  },
  {
    category: "ETC",
    subcategories: [
      { name: "Baratron_ASSY", displayName: "Baratron Ass'y", 기준작업수: 1 },
      { name: "Pirani_ASSY", displayName: "Pirani Ass'y", 기준작업수: 1 },
      { name: "View_Port_Quartz", displayName: "View Port Quartz", 기준작업수: 1 },
      { name: "Flow_Switch", displayName: "Flow Switch", 기준작업수: 1 },
      { name: "Monitor", displayName: "Monitor", 기준작업수: 1 },
      { name: "Keyboard", displayName: "Keyboard", 기준작업수: 1 },
      { name: "Mouse", displayName: "Mouse", 기준작업수: 1 },
      { name: "Water_Leak_Detector", displayName: "Water Leak Detector", 기준작업수: 1 },
      { name: "Manometer", displayName: "Manometer", 기준작업수: 1 },
      { name: "LIGHT_CURTAIN", displayName: "LIGHT CURTAIN", 기준작업수: 1 },
      { name: "GAS_SPRING", displayName: "GAS SPRING", 기준작업수: 1 }
    ]
  },
  {
    category: "CTR",
    subcategories: [
      { name: "CTC", displayName: "CTC", 기준작업수: 3 },
      { name: "PMC", displayName: "PMC", 기준작업수: 3 },
      { name: "EDA", displayName: "EDA", 기준작업수: 3 },
      { name: "EFEM_CONTROLLER", displayName: "EFEM CONTROLLER", 기준작업수: 3 }
    ]
  },
  {
    category: "S/W",
    subcategories: [
      { name: "SW_Patch", displayName: "S/W Patch", 기준작업수: 1 }
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

async function loadEcoliteMaintenanceData() {
    try {
        const response = await axios.get('http://3.37.73.151:3001/ecolite-maintenance/all', {
            headers: {
                'x-access-token': token
            }
        });
        return response.data;
    } catch (error) {
        console.error('Ecolite Maintenance 데이터를 불러오는 중 오류 발생:', error);
        return [];
    }
}

function renderCombinedTable(worklogData, ecoliteData, taskCategories, filteredWorkers = null) {
    const worklogPercentages = JSON.parse(localStorage.getItem('worklogPercentages')) || {};

    const tableHead = document.getElementById('combined-table-head');
    const tableBody = document.getElementById('combined-table-body');
    const totalAverageContainer = document.getElementById('total-average-container'); // 전체 평균을 출력할 공간
    tableHead.innerHTML = '';
    tableBody.innerHTML = '';
    totalAverageContainer.innerHTML = ''; // 이전의 전체 평균을 지움

    let allWorkers = new Set(Object.keys(worklogPercentages));
    ecoliteData.forEach(ecolite => allWorkers.add(ecolite.name));
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
                const mappedTaskNameEcolite = Object.keys(taskMapping).find(key => taskMapping[key] === subcategory.name) || subcategory.name;

                const worklogPercent = worklogPercentages[worker]?.[mappedTaskNameWorklog] || 0;
                const ecoliteItem = ecoliteData.find(ecolite => ecolite.name === worker);
                const ecolitePercent = ecoliteItem ? ecoliteItem[mappedTaskNameEcolite] || 0 : 0;

                const finalPercent = (worklogPercent * 0.8) + (ecolitePercent * 0.2);
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
                const mappedTaskNameEcolite = Object.keys(taskMapping).find(key => taskMapping[key] === subcategory.name) || subcategory.name;

                const worklogPercent = worklogPercentages[worker]?.[mappedTaskNameWorklog] || 0;
                const ecoliteItem = ecoliteData.find(ecolite => ecolite.name === worker);
                const ecolitePercent = ecoliteItem ? ecoliteItem[mappedTaskNameEcolite] || 0 : 0;

                const finalPercent = (worklogPercent * 0.8) + (ecolitePercent * 0.2);

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

function applySearchFilter(searchName, worklogData, ecoliteData, taskCategories) {
    console.log("Applying search filter for:", searchName); // 필터 적용 콘솔 로그

    // 검색어가 포함된 작업자만 필터링
    const filteredWorkers = worklogData
        .filter(log => log.task_man.includes(searchName))  // 작업자 필터링
        .map(log => log.task_man);  // 필터된 작업자의 이름 리스트 생성

    const filteredEcoliteWorkers = ecoliteData
        .filter(ecolite => ecolite.name.includes(searchName))  // Ecolite 데이터에서 작업자 필터링
        .map(ecolite => ecolite.name);  // 필터된 작업자의 이름 리스트 생성

    const filteredWorkerNames = [...new Set([...filteredWorkers, ...filteredEcoliteWorkers])];  // 중복 제거

    console.log("Filtered workers:", filteredWorkerNames);

    // 필터링된 작업자들만 테이블에 표시
    renderCombinedTable(worklogData, ecoliteData, taskCategories, filteredWorkerNames);
}

document.getElementById('search-button').addEventListener('click', () => {
    const searchName = document.getElementById('search-name').value.trim();
    if (searchName) {
        applySearchFilter(searchName, worklogData, ecoliteData, taskCategories);  // 검색 실행
    }
});

document.getElementById('reset-button').addEventListener('click', () => {
    document.getElementById('search-name').value = ''; // 검색어 초기화
    renderCombinedTable(worklogData, ecoliteData, taskCategories); // 전체 데이터 다시 표시
});

// 데이터를 불러오고 전역 변수에 저장
let worklogData = await loadWorklogData();
let ecoliteData = await loadEcoliteMaintenanceData();

// 데이터를 렌더링
renderCombinedTable(worklogData, ecoliteData, taskCategories);
});