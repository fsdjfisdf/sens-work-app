document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('x-access-token');

    if (!token) {
        alert('로그인이 필요합니다.');
        window.location.replace('./signin.html');
        return;
    }

    // 데이터를 로드하고 테이블을 렌더링하는 함수
    async function initializeTables() {
        console.log("Initializing tables...");  // 로그 추가

        try {
            // 데이터를 로드하는 함수
            const setupData = await loadSetupData();
            const worklogData = await loadWorkLogs();
            const checklistData = await loadChecklistData();

            // 로드된 데이터를 로그로 확인
            console.log('Setup Data:', setupData);
            console.log('Work Log Data:', worklogData);
            console.log('Checklist Data:', checklistData);

            // 데이터가 제대로 로드되었는지 확인
            if (setupData.length === 0 || checklistData.length === 0 || worklogData.length === 0) {
                console.error('Data is missing or not loaded correctly.');
                return; // 데이터가 비어 있으면 중단
            }

            // 테이블을 렌더링하는 함수 호출
            renderSetupTable(setupData, worklogData);
            renderChecklistTable(checklistData);
            renderCombinedTable(setupData, checklistData);  // 합산된 표를 렌더링
        } catch (error) {
            console.error('Error during table initialization:', error);
        }
    }

    initializeTables(); // 테이블을 초기화하고 렌더링
        



    // SUPRA XP SETUP 데이터를 불러오는 함수
    async function loadSetupData() {
        try {
            const response = await axios.get('http://3.37.73.151:3001/supraxp-setup/all', {
                headers: {
                    'x-access-token': token
                }
            });
            return response.data;
        } catch (error) {
            console.error('SUPRA XP SETUP 데이터를 불러오는 중 오류 발생:', error);
            return [];
        }
    }

    // 체크리스트 데이터를 불러오는 함수
    async function loadChecklistData() {
        try {
            const response = await axios.get('http://3.37.73.151:3001/supraxp-setup/data', {
                headers: {
                    'x-access-token': token
                }
            });
            return response.data;
        } catch (error) {
            console.error('체크리스트 데이터를 불러오는 중 오류 발생:', error);
            return [];
        }
    }

    // 작업 이력 데이터를 불러오는 함수
    async function loadWorkLogs() {
        try {
            const response = await axios.get('http://3.37.73.151:3001/logs');
            return response.data;
        } catch (error) {
            console.error('작업 로그를 불러오는 중 오류 발생:', error);
            return [];
        }
    }

    // 중분류 클릭 시 소분류를 토글하는 함수

function toggleSubcategories(event) {
    const categoryRow = event.currentTarget;
    let nextRow = categoryRow.nextElementSibling;

    // 소분류 행들이 나올 때까지 탐색하여 애니메이션 적용
    while (nextRow && !nextRow.classList.contains('category-row')) {
        if (nextRow.classList.contains('subcategory-row')) {
            if (nextRow.classList.contains('visible')) {
                // 소분류 숨기기
                nextRow.classList.remove('visible');
                nextRow.style.maxHeight = '0';
            } else {
                // 소분류 표시하기
                nextRow.classList.add('visible');
                nextRow.style.maxHeight = nextRow.scrollHeight + 'px';
            }
        }
        nextRow = nextRow.nextElementSibling;
    }
}


    // 중분류별 소분류 항목의 평균값을 계산하는 함수
    function calculateCategoryAverage(items, checklistData, workerName) {
        if (!Array.isArray(items) || items.length === 0) {
            return 0; // items가 유효하지 않거나 항목이 없을 경우 0 반환
        }
        
        const workerData = checklistData.find(worker => worker.name === workerName);
        let totalTasks = items.length; // 소분류의 전체 항목 수
        let completedTasks = 0;
    
        // 각 소분류 항목에서 완료된 항목을 카운트 (100 또는 'O')
        items.forEach(item => {
            const taskValue = workerData ? workerData[item] : 0;
            if (taskValue === 100 || taskValue === 'O') {
                completedTasks += 1;
            }
        });
    
        // 완료된 항목 수를 기반으로 평균 퍼센티지 계산
        return (completedTasks / totalTasks) * 100;
    }

    // 중분류 평균값을 계산하는 함수
    function calculateTotalAverage(checklistData, workerName, categories) {
        let totalWeightedAverage = 0;
    
        for (const [category, weight] of Object.entries(categoryWeights)) {
            const categoryItems = categories[category];
            if (!categoryItems || !Array.isArray(categoryItems) || categoryItems.length === 0) {
                continue;  // categories에 해당 category가 없거나 항목이 없으면 건너뜀
            }
            const categoryAverage = calculateCategoryAverage(categoryItems, checklistData, workerName);
            totalWeightedAverage += categoryAverage * (weight / 100);
        }
    
        return totalWeightedAverage;
    }
    
// 각 작업자의 가중 평균을 개별적으로 계산하는 함수 (계산 로그 추가)
// 각 작업자의 가중 평균을 개별적으로 계산하는 함수 (계산 로그 추가)
function calculateWeightedAverageForWorker(workerData, columns) {
    let totalWeightedSum = 0;
    let totalWeight = 0;

    columns.forEach(col => {
        const weight = categoryWeights[col.name.replace(/_/g, ' ')] || 0; // 가중치 가져오기 (없으면 0)
        const taskCount = workerData ? workerData[col.name] || 0 : 0;
        
        // 작업 수가 기준 작업 수를 넘으면 1로 제한
        const percentage = Math.min((taskCount / col.기준작업수), 1); // 백분율을 최대 100%로 제한

        // 백분율에 가중치 적용하여 계산
        const weightedValue = percentage * (weight / 100);

        // 가중치를 곱해서 합산
        totalWeightedSum += weightedValue;
        totalWeight += weight; // 가중치 합산
    });

    // 가중 평균 계산
    const weightedAverage = totalWeightedSum * 100;  // 가중치를 적용한 값은 비율이므로 100을 곱함


    return weightedAverage;
}

// SUPRAXP SETUP 테이블 렌더링 함수
function renderSetupTable(setupData, worklogData) {
    const tableHead = document.getElementById('setup-table-head');
    const tableBody = document.getElementById('setup-table-body');
    tableHead.innerHTML = '';
    tableBody.innerHTML = '';

    const columns = [
        { name: 'INSTALLATION_PREPARATION', 기준작업수: 5 },
        { name: 'FAB_IN', 기준작업수: 5 },
        { name: 'DOCKING', 기준작업수: 10 },
        { name: 'CABLE_HOOK_UP', 기준작업수: 10 },
        { name: 'POWER_TURN_ON', 기준작업수: 10 },
        { name: 'UTILITY_TURN_ON', 기준작업수: 5 },
        { name: 'GAS_TURN_ON', 기준작업수: 5 },
        { name: 'TEACHING', 기준작업수: 15 },
        { name: 'PART_INSTALLATION', 기준작업수: 5 },
        { name: 'LEAK_CHECK', 기준작업수: 5 },
        { name: 'TTTM', 기준작업수: 15 },
        { name: 'CUSTOMER_CERTIFICATION', 기준작업수: 10 },
        { name: 'PROCESS_CONFIRM', 기준작업수: 3 }
    ];

    let workerNames = setupData.map(worker => worker.name);

    // 작업 이력에서 setup_item을 columns 항목과 매칭하여 카운트를 증가시킴
    workerNames.forEach(workerName => {
        const workerLogs = worklogData.filter(log => log.task_man.includes(workerName));  // 작업자가 포함된 작업 이력을 필터링
        const workerData = setupData.find(worker => worker.name === workerName);

        columns.forEach(col => {
            const matchingLogs = workerLogs.filter(log => log.setup_item.replace(/ /g, "_").toUpperCase() === col.name);  
            if (workerData) {
                workerData[col.name] = (workerData[col.name] || 0) + matchingLogs.length;  // 작업 카운트 증가
            }
        });
    });

    // 테이블 헤더 생성
    const headerRow = document.createElement('tr');
    headerRow.appendChild(document.createElement('th')).textContent = '작업 항목';
    headerRow.appendChild(document.createElement('th')).textContent = '기준 작업 수';
    workerNames.forEach(name => {
        const th = document.createElement('th');
        th.textContent = name;
        headerRow.appendChild(th);
    });
    tableHead.appendChild(headerRow);

    // 평균값 행 추가 (각 작업자별 가중 평균 계산)
    const averageRow = document.createElement('tr');
    averageRow.style.backgroundColor = '#e0e0e0'; // AVERAGE 행의 색을 회색으로 설정
    averageRow.style.fontWeight = 'bold';
    averageRow.classList.add('total-average-row'); // total-average-row 클래스를 추가하여 디자인 적용
    averageRow.appendChild(document.createElement('td')).textContent = 'AVERAGE';
    averageRow.appendChild(document.createElement('td')).textContent = '';

    workerNames.forEach(workerName => {
        const workerData = setupData.find(worker => worker.name === workerName);
        const weightedAverage = calculateWeightedAverageForWorker(workerData, columns); // 개별 가중 평균 계산
        const td = document.createElement('td');
        td.textContent = `${weightedAverage.toFixed(1)}%`;
        averageRow.appendChild(td);
    });
    tableBody.appendChild(averageRow);

    // 각 작업 항목에 대한 데이터를 세로로 나열
    columns.forEach(col => {
        const row = document.createElement('tr');
        row.classList.add('category-row'); // 각 항목에 category-row 클래스를 추가하여 디자인 적용
        row.appendChild(document.createElement('td')).textContent = col.name;
        row.appendChild(document.createElement('td')).textContent = col.기준작업수;

        workerNames.forEach(workerName => {
            const workerData = setupData.find(worker => worker.name === workerName);
            const taskCount = workerData ? workerData[col.name] || 0 : 0;
            let percentage = (taskCount / col.기준작업수) * 100;
            percentage = Math.min(percentage, 100);
    
            const td = document.createElement('td');
            td.textContent = `${taskCount} (${Math.round(percentage)}%)`;
    
            // 퍼센트에 따른 색상 적용
            if (percentage === 100) {
                td.style.color = 'blue';
            } else if (percentage === 0) {
                td.style.color = 'red';
            } else {
                td.style.color = 'black';
            }
    
            row.appendChild(td);
        });
        tableBody.appendChild(row);
    });
}






    const categoryWeights = {
        'INSTALLATION PREPARATION': 5,
        'FAB IN': 5,
        'DOCKING': 10,
        'CABLE HOOK UP': 10,
        'POWER TURN ON': 10,
        'UTILITY TURN ON': 2.5,
        'GAS TURN ON': 2.5,
        'TEACHING': 30,
        'PART INSTALLATION': 2.5,
        'LEAK CHECK': 2.5,
        'TTTM': 10,
        'CUSTOMER CERTIFICATION': 5,
        'PROCESS CONFIRM': 5
    };
    


    

    // 전체 평균을 계산하는 함수
    function calculateTotalAverage(checklistData, workerName, categories) {
        let totalWeightedAverage = 0;
    
        for (const [category, weight] of Object.entries(categoryWeights)) {
            const categoryItems = categories[category];  // 각 중분류에 해당하는 소분류 항목들
            const categoryAverage = calculateCategoryAverage(categoryItems, checklistData, workerName);
            totalWeightedAverage += categoryAverage * (weight / 100);  // 가중 평균
        }
    
        return totalWeightedAverage;  // 전체 평균 반환
    }

    // 체크리스트 테이블 렌더링 함수 (중분류 기준 열로 표시)
    function renderChecklistTable(checklistData) {
        const checklistTableHead = document.getElementById('checklist-table-head');
        const checklistTableBody = document.getElementById('checklist-table-body');
        const itemDescriptions = {
            'INST_IMPORT_ORDER': '설비반입 순서를 숙지하고 있는가?',
            'INST_PACKING_LIST': 'Packing List 확인하여 반입 Part 확인이 가능 한가?',
            'INST_OHT_CHECK': '고객사에서 그린 기준선과 OHT라인이 일치하는지 확인 알고 있는가?',
            'INST_SPACING_CHECK': '설비간 유격거리가 충분한지 확인 알고 있는가?',
            'INST_DRAW_SETUP': 'Drawing Template을 기준선에 맞춰 배치 알고 있는가?',
            'INST_DRAW_MARKING': 'Drawing Template를 펼쳐 타공, H빔 및 Adjust 를 Marking 알고 있는가?',
            'INST_UTILITY_SPEC': '타공별 Utility Spec을 숙지하고 있는가?',
            'FAB_UNPACK_WARN': 'Module Unpacking시 주의 사항에 대해 숙지하고 있는가?',
            'FAB_CLEAN_WARN': 'Module Clean시 주의 사항에 대해 숙지하고 있는가?',
            'FAB_MOVE_WARN': 'Module 이동시 주의 사항에 대해 숙지하고 있는가?',
            'DOCK_TOOL_SIZE': '장비별 Tool size를 숙지하고 있는가?',
            'DOCK_LASER_JIG': 'Laser Jig 를 이용하여 OHT Line 과 설비를 정렬 알고 있는가?',
            'DOCK_LIFT_CASTER': 'Lift를 활용하여 EFEM의 Caster 를 제거 알고 있는가?',
            'DOCK_FRAME_HEIGHT': '각 Module의 지면에서 frame의 높이를 알고 Spec에 맞춰 Docking 알고 있는가?',
            'DOCK_MODULE': 'Module간 Docking 할 수 있는가?',
            'DOCK_REALIGN': 'Docking작업 중 설비와 OHT Line 정렬이 틀어졌을 경우 재정렬 알고 있는가?',
            'DOCK_LEVELER_POS': '각 Moudule의 Leveler 정위치를 숙지하고 있는가?',
            'DOCK_LEVEL_SPEC': '각 Moudule의 Leveling Spec을 알고 Adjust를 이용, Leveling 알고 있는가?',
            'DOCK_ACCESSORY': 'Accessory(Baratron, Pirani, EPD)를 정위치에 장착 알고 있는가?',
            'DOCK_HOOK_UP': '내부 Hook Up 알고 있는가?',
            'CABLE_TRAY_CHECK': '설비에서 Rack까지 Tray 확인 및 작업가능여부 판단알고 있는가?',
            'CABLE_SORTING': 'Cable 각 Module별로 분류 알고 있는가?',
            'CABLE_GRATING': 'Grating Open시 주의 사항을 숙지하고 있는가?',
            'CABLE_LADDER_RULES': '사다리 작업시 환경안전수칙을 숙지하고 있는가?',
            'CABLE_INSTALL': '설비에서 Rack까지 포설 알고 있는가?',
            'CABLE_CONNECTION': 'Cable을 설비에 정확히 연결 알고 있는가?',
            'CABLE_TRAY_ARRANGE': 'Cable을 Tray에 규격에 맞게 정리 알고 있는가?',
            'CABLE_CUTTING': '설비와 Rack간의 거리를 고려해 Cable 재단 알고 있는가?',
            'CABLE_RACK_CONNECT': 'Cable을 Rack에 정확히 연결 알고 있는가?',
            'CABLE_PUMP_TRAY': 'Pump Cable의 종류를 알고 알맞은 Tray로 내려줄 수 있는가?',
            'CABLE_PUMP_ARRANGE': 'Pump단에서 Cable 포설 및 정리 알고 있는가?',
            'CABLE_MODULE_PUMP': 'Cable을 구분하여 모듈별로 Pump에 정확히 연결 알고 있는가?',
            'POWER_GPS_UPS_SPS': 'GPS, UPS, SPS 의 역할과 원리에 대해 숙지하고 있는가?',
            'POWER_TURN_SEQ': 'Power turn on 순서를 숙지하고 있는가?',
            'POWER_ALARM_TROUBLE': 'Power turn on 후 발생하는 Alram Troble Shooting 알고 있는가?',
            'POWER_CB_UNDERSTAND': 'Rack의 CB 종류와 기능을 숙지하고 있는가?',
            'POWER_SAFETY_MODULE': 'Safety Module의 위치와 기능을 숙지하고 있는가?',
            'POWER_EMO_CHECK': 'EMO 동작 Check 알고 있는가?',
            'POWER_SYCON_UNDERST': 'Sycon number 별 의미하는 Part를 숙지하고 있는가?',
            'POWER_SYCON_TROUBLE': 'Sycon 실행시 통신되지않는 Part에 대해 Troble Shooting 알고 있는가?',
            'UTIL_TURN_SEQ': 'Utility turn on 의 순서를 숙지하고 있는가?',
            'UTIL_VACUUM_TURN': 'Vacuum Turn on 및 Spec에 맞게 조정 알고 있는가?',
            'UTIL_CDA_TURN': 'CDA Turn on 및 Spec에 맞게 조정 알고 있는가?',
            'UTIL_PCW_TURN': 'PCW Turn on 및 Spec에 맞게 조정 알고 있는가?',
            'GAS_TURN_SEQ': 'Gas turn on 의 순서를 숙지하고 있는가?',
            'GAS_O2_N2_CHECK': 'O2, N2 Gas Turn on 및 가스 유입유무를 확인 알고 있는가?',
            'GAS_TOXIC_CHECK': 'Toxic Gas Turn on 및 가스 유입유무를 확인 알고 있는가?',
            'GAS_MANOMETER_ADJUST': 'Manometer의 Low, High Limit 값 Spec에 맞게 조정 알고 있는가?',
            'TEACH_ROBOT_CONTROL': 'EFEM Robot Pendant 조작 가능한가?',
            'TEACH_ROBOT_LEVEL': 'EFEM Robot Leveling 알고 있는가?? ( SANKYO )',
            'TEACH_ARM_LEVEL': 'EFEM Robot Arm Leveling 알고 있는가?? ( SANKYO )',
            'TEACH_LOAD_PORT': 'EFEM Robot Load Port Teaching 가능한가? ( SANKYO )',
            'TEACH_LOADLOCK': 'EFEM Robot Loadlock Teaching 가능한가? ( SANKYO )',
            'TEACH_SIDE_STORAGE': 'EFEM Robot Side Storage Teaching 가능한가? ( SANKYO )',
            'TEACH_DATA_SAVE': 'EFEM Teaching Data 저장 가능한가 ?',
            'TEACH_TM_CONTROL': 'TM Robot Pendant 조작 가능한가?',
            'TEACH_TM_LOADLOCK': 'TM Robot Loadlock Teeaching 가능 한가 ? ( PERSIMMON )',
            'TEACH_TM_PM': 'TM Robot PM Teeaching 가능 한가 ? ( PERSIMMON )',
            'TEACH_TM_DATA_SAVE': 'TM Robot Teaching Data 저장 가능한가 ? ( PERSIMMON )',
            'TEACH_WAFER_JIG': 'Teachig Wafer Jig 사용 가능한가 ?',
            'TEACH_FINE': '미세 Teaching 가능한가 ?',
            'TEACH_MARGIN': '마진 Check 가능한가 ?',
            'TEACH_SEMI_TRANSFER': 'Semi Auto Transfer 알고 있는가?',
            'PART_EXHAUST_PORT': 'Exhaust Port 설치 위치와 방법을 알고 있는가?',
            'PART_EFF_SANKYO': 'EFEM Robot EndEffector 장착이 가능한가? ( SANKYO )',
            'PART_EFF_ADJUST': 'EFEM Robot End Effector Omm Adjust 가능 한가? ( SANKYO )',
            'PART_EFF_LEVEL': 'EFEM Robot EndEffector Level 조절이 가능한가?( SANKYO )',
            'PART_TM_EFF': 'TM Robot End Effector 장착이 가능한가?',
            'PART_TM_ADJUST_380': 'TM Robot End Effector 좌우 380mm Adjust 가능 한가?',
            'PART_TM_ADJUST_16': 'TM Robot End Effector 상하 16mm Adjust 가능 한가?',
            'PART_TM_LEVEL': 'TM Robot End Effector Level 조절이 가능한가?',
            'PART_PROCESS_KIT': 'Process Kit 장착이 가능한가?',
            'PART_PIO_CABLE': 'PIO Sensor, Cable 장착이 가능한가?',
            'PART_RACK_SIGNAL': 'Rack Signal Tower 설치가 가능한가?',
            'LEAK_PUMP_TURN': 'PUMP Turn On 알고 있는가?',
            'LEAK_PM_CHECK': 'PM Leak Check에 대해 알고 있는가?',
            'LEAK_GAS_CHECK': 'Gas Line Leak Check에 대해 알고 있는가?',
            'LEAK_TM_LL_CHECK': 'TM, LL Leak Check 에 대해 알고 있는가?',
            'TTTM_ECID_MATCH': 'ECID Matching할 수 있는가?',
            'TTTM_PUMP_TIME': 'Load Lock Pumping/Purge Time 조절 가능한가?',
            'TTTM_VENT_TIME': 'Puming / Venting Time 조절 가능한가?',
            'TTTM_EPD_ADJUST': 'EPD Peak, Offset 조절 가능한가?',
            'TTTM_TEMP_AUTOTUNE': 'Temp autotune 가능 한가?',
            'TTTM_VALVE_CONTROL': 'Slot Valve Open, Close Time 조절 가능 한가?',
            'TTTM_PENDULUM': 'Pendulum Autolearn 가능 한가?',
            'TTTM_PIN_ADJUST': 'Pin speed, height Adjust 가능 한가?',
            'TTTM_GAS_PRESSURE': 'Gas Supply Pressure Check 가능 한가?',
            'TTTM_MFC_HUNT': 'MFC Normal 상태 Hunting 유/무 확인 가능 한가?',
            'TTTM_GAS_LEAK': 'Gas Line Leak Check 가능 한가?',
            'TTTM_DNET_CAL': 'Prism D-Net Cal 가능한가?',
            'TTTM_SHEET': 'TTTM Sheet 작성 가능한가?',
            'CUST_OHT_CERT': 'OHT 인증에 대해 알고 대응 할 수 있는가?',
            'CUST_I_MARKING': '중간인증 전 IMarking 위치 알고 있는가?',
            'CUST_GND_LABEL': 'GND 저항값, 각 Gas 및 PCW 라인에 대해 라벨링 가능한가?',
            'CUST_CSF_SEAL': 'CSF(Rack단) 실리콘 마감 가능한가?',
            'CUST_CERT_RESPONSE': '중간인증에 대해 알고 대응 할 수 있는가?',
            'CUST_ENV_QUAL': '환경Qual에 대해 알고 대응 할 수 있는가?',
            'CUST_OHT_LAYOUT': 'OHT Lay Out 인증에 대해 알고 대응 할 수 있는가?',
            'PROCESS_AGING': 'Aging Test 알고 있는가?',
            'PROCESS_AR_TEST': 'AR Test 알고 있는가?',
            'PROCESS_SCRATCH': 'Scratch Test 알고 있는가?',
            'PROCESS_PARTICLE': 'Paticle Check 알고 있는가?',
            'PROCESS_EES_MATCH': 'EES Tool Matching 알고 있는가?'
        };
        
        
        
        checklistTableHead.innerHTML = '';
        checklistTableBody.innerHTML = '';
    
        const categories = {
            'INSTALLATION_PREPARATION': [
                'INST_IMPORT_ORDER',
                'INST_PACKING_LIST',
                'INST_OHT_CHECK',
                'INST_SPACING_CHECK',
                'INST_DRAW_SETUP',
                'INST_DRAW_MARKING',
                'INST_UTILITY_SPEC'
            ],
            'FAB_IN': [
                'FAB_UNPACK_WARN',
                'FAB_CLEAN_WARN',
                'FAB_MOVE_WARN'
            ],
            'DOCKING': [
                'DOCK_TOOL_SIZE',
                'DOCK_LASER_JIG',
                'DOCK_LIFT_CASTER',
                'DOCK_FRAME_HEIGHT',
                'DOCK_MODULE',
                'DOCK_REALIGN',
                'DOCK_LEVELER_POS',
                'DOCK_LEVEL_SPEC',
                'DOCK_ACCESSORY',
                'DOCK_HOOK_UP'
            ],
            'CABLE_HOOK_UP': [
                'CABLE_TRAY_CHECK',
                'CABLE_SORTING',
                'CABLE_GRATING',
                'CABLE_LADDER_RULES',
                'CABLE_INSTALL',
                'CABLE_CONNECTION',
                'CABLE_TRAY_ARRANGE',
                'CABLE_CUTTING',
                'CABLE_RACK_CONNECT',
                'CABLE_PUMP_TRAY',
                'CABLE_PUMP_ARRANGE',
                'CABLE_MODULE_PUMP'
            ],
            'POWER_TURN_ON': [
                'POWER_GPS_UPS_SPS',
                'POWER_TURN_SEQ',
                'POWER_ALARM_TROUBLE',
                'POWER_CB_UNDERSTAND',
                'POWER_SAFETY_MODULE',
                'POWER_EMO_CHECK',
                'POWER_SYCON_UNDERST',
                'POWER_SYCON_TROUBLE'
            ],
            'UTILITY_TURN_ON': [
                'UTIL_TURN_SEQ',
                'UTIL_VACUUM_TURN',
                'UTIL_CDA_TURN',
                'UTIL_PCW_TURN'
            ],
            'GAS_TURN_ON': [
                'GAS_TURN_SEQ',
                'GAS_O2_N2_CHECK',
                'GAS_TOXIC_CHECK',
                'GAS_MANOMETER_ADJUST'
            ],
            'TEACHING': [
                'TEACH_ROBOT_CONTROL',
                'TEACH_ROBOT_LEVEL',
                'TEACH_ARM_LEVEL',
                'TEACH_LOAD_PORT',
                'TEACH_LOADLOCK',
                'TEACH_SIDE_STORAGE',
                'TEACH_DATA_SAVE',
                'TEACH_TM_CONTROL',
                'TEACH_TM_LOADLOCK',
                'TEACH_TM_PM',
                'TEACH_TM_DATA_SAVE',
                'TEACH_WAFER_JIG',
                'TEACH_FINE',
                'TEACH_MARGIN',
                'TEACH_SEMI_TRANSFER'
            ],
            'PART_INSTALLATION': [
                'PART_EXHAUST_PORT',
                'PART_EFF_SANKYO',
                'PART_EFF_ADJUST',
                'PART_EFF_LEVEL',
                'PART_TM_EFF',
                'PART_TM_ADJUST_380',
                'PART_TM_ADJUST_16',
                'PART_TM_LEVEL',
                'PART_PROCESS_KIT',
                'PART_PIO_CABLE',
                'PART_RACK_SIGNAL'
            ],
            'LEAK_CHECK': [
                'LEAK_PUMP_TURN',
                'LEAK_PM_CHECK',
                'LEAK_GAS_CHECK',
                'LEAK_TM_LL_CHECK'
            ],
            'TTTM': [
                'TTTM_ECID_MATCH',
                'TTTM_PUMP_TIME',
                'TTTM_VENT_TIME',
                'TTTM_EPD_ADJUST',
                'TTTM_TEMP_AUTOTUNE',
                'TTTM_VALVE_CONTROL',
                'TTTM_PENDULUM',
                'TTTM_PIN_ADJUST',
                'TTTM_GAS_PRESSURE',
                'TTTM_MFC_HUNT',
                'TTTM_GAS_LEAK',
                'TTTM_DNET_CAL',
                'TTTM_SHEET'
            ],
            'CUSTOMER_CERTIFICATION': [
                'CUST_OHT_CERT',
                'CUST_I_MARKING',
                'CUST_GND_LABEL',
                'CUST_CSF_SEAL',
                'CUST_CERT_RESPONSE',
                'CUST_ENV_QUAL',
                'CUST_OHT_LAYOUT'
            ],
            'PROCESS_CONFIRM': [
                'PROCESS_AGING',
                'PROCESS_AR_TEST',
                'PROCESS_SCRATCH',
                'PROCESS_PARTICLE',
                'PROCESS_EES_MATCH'
            ]
        };
        
        
    
        let workerNames = checklistData.map(worker => worker.name);

        // 테이블 헤더 생성
        const headerRow = document.createElement('tr');
        headerRow.appendChild(document.createElement('th')).textContent = '작업 항목';
        workerNames.forEach(name => {
            const th = document.createElement('th');
            th.textContent = name;
            headerRow.appendChild(th);
        });
        checklistTableHead.appendChild(headerRow);
    
// 전체 평균 행 추가
const totalAverageRow = document.createElement('tr');
totalAverageRow.style.backgroundColor = '#e0e0e0'; // AVERAGE 행의 색을 회색으로 설정
totalAverageRow.style.fontWeight = 'bold';
totalAverageRow.classList.add('total-average-row');
totalAverageRow.appendChild(document.createElement('td')).textContent = 'AVERAGE';

// 중분류별 평균을 계산하여 AVERAGE 행에 출력
workerNames.forEach(workerName => {
    let totalAverage = 0;
    let totalCategories = 0;

    for (const [category, items] of Object.entries(categories)) {
        // 각 중분류에 대한 소분류 평균값 계산
        const categoryAverage = calculateCategoryAverage(items, checklistData, workerName);
        totalAverage += categoryAverage;
        totalCategories++;
    }

    // 중분류의 평균값을 합산하여 전체 평균 계산
    const overallAverage = totalCategories > 0 ? (totalAverage / totalCategories) : 0;

    const td = document.createElement('td');
    td.textContent = `${overallAverage.toFixed(1)}%`;

    // 퍼센트에 따른 색상 적용
    if (overallAverage === 100) {
        td.style.color = 'blue';
    } else if (overallAverage === 0) {
        td.style.color = 'red';
    } else {
        td.style.color = 'black';
    }

    totalAverageRow.appendChild(td);
});

checklistTableBody.appendChild(totalAverageRow);
    
        // 중분류에 대한 평균값을 열로 추가
        for (const [category, items] of Object.entries(categories)) {
            const categoryRow = document.createElement('tr');
            categoryRow.classList.add('category-row');
    
            const categoryCell = document.createElement('td');
            categoryCell.textContent = `${category}`;
            categoryRow.appendChild(categoryCell);
    
            workerNames.forEach(workerName => {
                // 각 중분류에 대한 소분류 평균값 계산
                const categoryAverage = calculateCategoryAverage(items, checklistData, workerName);
                const td = document.createElement('td');
                td.textContent = `${categoryAverage.toFixed(1)}%`;
    
                // 퍼센트에 따른 색상 적용
                if (categoryAverage === 100) {
                    td.style.color = 'blue';
                } else if (categoryAverage === 0) {
                    td.style.color = 'red';
                } else {
                    td.style.color = 'black';
                }
    
                categoryRow.appendChild(td);
            });
    
            checklistTableBody.appendChild(categoryRow);
    
            // 소분류 행 추가 (기본적으로 숨김 처리)
            items.forEach(item => {
                const subcategoryRow = document.createElement('tr');
                subcategoryRow.classList.add('subcategory-row');
                subcategoryRow.style.display = 'none';  // 소분류는 기본적으로 숨김 처리
    
                const itemCell = document.createElement('td');
                itemCell.textContent = item.replace(/_/g, ' ');
    
                // itemDescriptions에서 해당 항목의 설명을 가져와 title 속성에 추가
                if (itemDescriptions[item]) {
                    itemCell.setAttribute('title', itemDescriptions[item]);  // 호버 시 설명 표시
                }
    
                subcategoryRow.appendChild(itemCell);
    
                workerNames.forEach(workerName => {
                    const workerData = checklistData.find(worker => worker.name === workerName);
                    const taskValue = workerData ? workerData[item] : '';  // 값이 없을 경우 빈 값 처리
                    const td = document.createElement('td');
                    td.textContent = taskValue !== undefined ? taskValue : '';
    
                    // 퍼센트 값이 있는 경우 색상 적용
                    if (typeof taskValue === 'number') {
                        if (taskValue === 100) {
                            td.style.color = 'blue';
                        } else if (taskValue === 0) {
                            td.style.color = 'red';
                        } else {
                            td.style.color = 'black';
                        }
                    }
    
                    subcategoryRow.appendChild(td);
                });
    
                checklistTableBody.appendChild(subcategoryRow);
            });
    
            // 중분류 클릭 시 소분류 행을 토글하는 이벤트 추가
            categoryRow.addEventListener('click', () => {
                let nextRow = categoryRow.nextElementSibling;
                while (nextRow && nextRow.classList.contains('subcategory-row')) {
                    nextRow.style.display = nextRow.style.display === 'none' ? 'table-row' : 'none';
                    nextRow = nextRow.nextElementSibling;
                }
            });
        }
    }

    const setupData = await loadSetupData();
    const worklogData = await loadWorkLogs();
    renderSetupTable(setupData, worklogData);

    const checklistData = await loadChecklistData();
    renderChecklistTable(checklistData);

    // 검색 및 리셋 기능 추가
    document.getElementById('search-button').addEventListener('click', () => {
        const searchName = document.getElementById('search-name').value.trim();
        if (searchName) {
            const filteredSetupData = setupData.filter(worker => worker.name.includes(searchName));
            const filteredChecklistData = checklistData.filter(worker => worker.name.includes(searchName));
            const filteredWorklogData = worklogData.filter(log => log.task_man.includes(searchName));
            renderSetupTable(filteredSetupData, filteredWorklogData);
            renderChecklistTable(filteredChecklistData);
            renderCombinedTable(filteredSetupData, filteredChecklistData); // 합산된 표도 렌더링
        }
    });

    document.getElementById('reset-button').addEventListener('click', () => {
        document.getElementById('search-name').value = '';
        renderSetupTable(setupData, worklogData);
        renderChecklistTable(checklistData);
        renderCombinedTable(setupData, checklistData); // 합산된 표도 렌더링
    });
});



// 중분류별 소분류 항목의 평균값을 계산하는 함수
function calculateCategoryAverage(items, checklistData, workerName) {
    
    if (!Array.isArray(items) || items.length === 0) {
        return 0; // items가 유효하지 않거나 항목이 없을 경우 0 반환
    }

    const workerData = checklistData.find(worker => worker.name === workerName);
    if (!workerData) {
        return 0; // 해당 작업자의 데이터가 없으면 0 반환
    }

    let totalValue = 0;
    let validItems = 0; // 유효한 소분류 항목의 개수

    items.forEach(item => {
        const taskValue = workerData[item] !== undefined ? workerData[item] : 0;
        if (typeof taskValue === 'number') {
            totalValue += taskValue;
            validItems += 1; // 유효한 항목만 카운트
        }
    });

    if (validItems === 0) {
        return 0; // 유효한 소분류 항목이 없으면 0 반환
    }

    return totalValue / validItems; // 평균값 계산
}



function renderCombinedTable(setupData, checklistData) {
    const tableHead = document.getElementById('combined-table-head');
    const tableBody = document.getElementById('combined-table-body');
    const totalAverageContainer = document.getElementById('total-average-container');

    // 테이블 초기화
    tableHead.innerHTML = '';
    tableBody.innerHTML = '';
    totalAverageContainer.innerHTML = '';  // 평균값 출력 영역 초기화

    // 작업 항목 설정
    const columns = [
        { name: 'INSTALLATION_PREPARATION', 기준작업수: 5 },
        { name: 'FAB_IN', 기준작업수: 5 },
        { name: 'DOCKING', 기준작업수: 10 },
        { name: 'CABLE_HOOK_UP', 기준작업수: 10 },
        { name: 'POWER_TURN_ON', 기준작업수: 10 },
        { name: 'UTILITY_TURN_ON', 기준작업수: 5 },
        { name: 'GAS_TURN_ON', 기준작업수: 5 },
        { name: 'TEACHING', 기준작업수: 15 },
        { name: 'PART_INSTALLATION', 기준작업수: 5 },
        { name: 'LEAK_CHECK', 기준작업수: 5 },
        { name: 'TTTM', 기준작업수: 15 },
        { name: 'CUSTOMER_CERTIFICATION', 기준작업수: 10 },
        { name: 'PROCESS_CONFIRM', 기준작업수: 3 }
    ];

    const categoryWeights = {
        'INSTALLATION_PREPARATION': 5,
        'FAB_IN': 5,
        'DOCKING': 10,
        'CABLE_HOOK_UP': 10,
        'POWER_TURN_ON': 10,
        'UTILITY_TURN_ON': 2.5,
        'GAS_TURN_ON': 2.5,
        'TEACHING': 30,
        'PART_INSTALLATION': 2.5,
        'LEAK_CHECK': 2.5,
        'TTTM': 10,
        'CUSTOMER_CERTIFICATION': 5,
        'PROCESS_CONFIRM': 5
    };

    const categories = {
    'INSTALLATION_PREPARATION': [
        'INST_IMPORT_ORDER',
        'INST_PACKING_LIST',
        'INST_OHT_CHECK',
        'INST_SPACING_CHECK',
        'INST_DRAW_SETUP',
        'INST_DRAW_MARKING',
        'INST_UTILITY_SPEC'
    ],
    'FAB_IN': [
        'FAB_UNPACK_WARN',
        'FAB_CLEAN_WARN',
        'FAB_MOVE_WARN'
    ],
    'DOCKING': [
        'DOCK_TOOL_SIZE',
        'DOCK_LASER_JIG',
        'DOCK_LIFT_CASTER',
        'DOCK_FRAME_HEIGHT',
        'DOCK_MODULE',
        'DOCK_REALIGN',
        'DOCK_LEVELER_POS',
        'DOCK_LEVEL_SPEC',
        'DOCK_ACCESSORY',
        'DOCK_HOOK_UP'
    ],
    'CABLE_HOOK_UP': [
        'CABLE_TRAY_CHECK',
        'CABLE_SORTING',
        'CABLE_GRATING',
        'CABLE_LADDER_RULES',
        'CABLE_INSTALL',
        'CABLE_CONNECTION',
        'CABLE_TRAY_ARRANGE',
        'CABLE_CUTTING',
        'CABLE_RACK_CONNECT',
        'CABLE_PUMP_TRAY',
        'CABLE_PUMP_ARRANGE',
        'CABLE_MODULE_PUMP'
    ],
    'POWER_TURN_ON': [
        'POWER_GPS_UPS_SPS',
        'POWER_TURN_SEQ',
        'POWER_ALARM_TROUBLE',
        'POWER_CB_UNDERSTAND',
        'POWER_SAFETY_MODULE',
        'POWER_EMO_CHECK',
        'POWER_SYCON_UNDERST',
        'POWER_SYCON_TROUBLE'
    ],
    'UTILITY_TURN_ON': [
        'UTIL_TURN_SEQ',
        'UTIL_VACUUM_TURN',
        'UTIL_CDA_TURN',
        'UTIL_PCW_TURN'
    ],
    'GAS_TURN_ON': [
        'GAS_TURN_SEQ',
        'GAS_O2_N2_CHECK',
        'GAS_TOXIC_CHECK',
        'GAS_MANOMETER_ADJUST'
    ],
    'TEACHING': [
        'TEACH_ROBOT_CONTROL',
        'TEACH_ROBOT_LEVEL',
        'TEACH_ARM_LEVEL',
        'TEACH_LOAD_PORT',
        'TEACH_LOADLOCK',
        'TEACH_SIDE_STORAGE',
        'TEACH_DATA_SAVE',
        'TEACH_TM_CONTROL',
        'TEACH_TM_LOADLOCK',
        'TEACH_TM_PM',
        'TEACH_TM_DATA_SAVE',
        'TEACH_WAFER_JIG',
        'TEACH_FINE',
        'TEACH_MARGIN',
        'TEACH_SEMI_TRANSFER'
    ],
    'PART_INSTALLATION': [
        'PART_EXHAUST_PORT',
        'PART_EFF_SANKYO',
        'PART_EFF_ADJUST',
        'PART_EFF_LEVEL',
        'PART_TM_EFF',
        'PART_TM_ADJUST_380',
        'PART_TM_ADJUST_16',
        'PART_TM_LEVEL',
        'PART_PROCESS_KIT',
        'PART_PIO_CABLE',
        'PART_RACK_SIGNAL'
    ],
    'LEAK_CHECK': [
        'LEAK_PUMP_TURN',
        'LEAK_PM_CHECK',
        'LEAK_GAS_CHECK',
        'LEAK_TM_LL_CHECK'
    ],
    'TTTM': [
        'TTTM_ECID_MATCH',
        'TTTM_PUMP_TIME',
        'TTTM_VENT_TIME',
        'TTTM_EPD_ADJUST',
        'TTTM_TEMP_AUTOTUNE',
        'TTTM_VALVE_CONTROL',
        'TTTM_PENDULUM',
        'TTTM_PIN_ADJUST',
        'TTTM_GAS_PRESSURE',
        'TTTM_MFC_HUNT',
        'TTTM_GAS_LEAK',
        'TTTM_DNET_CAL',
        'TTTM_SHEET'
    ],
    'CUSTOMER_CERTIFICATION': [
        'CUST_OHT_CERT',
        'CUST_I_MARKING',
        'CUST_GND_LABEL',
        'CUST_CSF_SEAL',
        'CUST_CERT_RESPONSE',
        'CUST_ENV_QUAL',
        'CUST_OHT_LAYOUT'
    ],
    'PROCESS_CONFIRM': [
        'PROCESS_AGING',
        'PROCESS_AR_TEST',
        'PROCESS_SCRATCH',
        'PROCESS_PARTICLE',
        'PROCESS_EES_MATCH'
    ]
};
    
    

    const workerNames = setupData.map(worker => worker.name);

    if (workerNames.length === 0) {
        console.error('No worker names found.');
        return;
    }

    // 테이블 헤더 생성
    const headerRow = document.createElement('tr');
    headerRow.appendChild(document.createElement('th')).textContent = '작업 항목';
    headerRow.appendChild(document.createElement('th')).textContent = '기준 작업 수';

    workerNames.forEach(name => {
        const th = document.createElement('th');
        th.textContent = name;
        headerRow.appendChild(th);
    });
    tableHead.appendChild(headerRow);

    // 평균값 행 추가 (맨 위로 올릴 예정)
    const averageRow = document.createElement('tr');
    averageRow.style.backgroundColor = '#e0e0e0'; // AVERAGE 행의 색을 회색으로 설정
    averageRow.style.fontWeight = 'bold';
    averageRow.classList.add('total-average-row');
    averageRow.appendChild(document.createElement('td')).textContent = 'AVERAGE';
    averageRow.appendChild(document.createElement('td')).textContent = ''; // 기준 작업 수는 Avg에 필요 없음

    const workerAverages = [];

    // 작업 항목별 데이터
    columns.forEach(col => {
        const row = document.createElement('tr');
        row.classList.add('category-row');
        row.appendChild(document.createElement('td')).textContent = col.name;  // 작업 항목 이름 추가
        row.appendChild(document.createElement('td')).textContent = col.기준작업수;  // 기준 작업 수 추가

        workerNames.forEach(workerName => {
            const workerData = setupData.find(worker => worker.name === workerName);
            const checklistWorkerData = checklistData.find(worker => worker.name === workerName);
    
            // Setup 비율 계산 (최대 80%)
            const setupCount = workerData ? (workerData[col.name] || 0) : 0;
            const setupPercentage = Math.min((setupCount / col.기준작업수) * 80, 80);
    
            // Checklist 비율 계산 (최대 20%)
            const checklistItems = categories[col.name];  // 중분류 항목에 해당하는 소분류 항목 리스트
            const checklistAverage = checklistWorkerData ? calculateCategoryAverage(checklistItems, checklistData, workerName) : 0;
            const checklistPercentage = (checklistAverage / 100) * 20;
    
            // 두 값을 합산 (최대 100%)
            const combinedPercentage = Math.min(setupPercentage + checklistPercentage, 100);
    
            // 셀에 최종 합산 값을 추가
            const td = document.createElement('td');
            td.textContent = `${combinedPercentage.toFixed(1)}%`;
    
            // 퍼센트에 따른 색상 적용
            if (combinedPercentage === 100) {
                td.style.color = 'blue';
            } else if (combinedPercentage === 0) {
                td.style.color = 'red';
            } else {
                td.style.color = 'black';
            }
    
            row.appendChild(td);
        });
    
        tableBody.appendChild(row);  // 테이블 본문에 행 추가
    });

    // 전체 평균 계산
    workerNames.forEach(workerName => {
        let totalWeightedAverage = 0;
        let totalWeight = 0;

        columns.forEach(col => {
            const workerData = setupData.find(worker => worker.name === workerName);
            const checklistWorkerData = checklistData.find(worker => worker.name === workerName);

            // Setup 비율 계산 (최대 80%)
            const setupCount = workerData ? (workerData[col.name] || 0) : 0;
            const setupPercentage = Math.min((setupCount / col.기준작업수) * 80, 80);

            // Checklist 비율 계산 (최대 20%)
            const checklistItems = categories[col.name];
            const checklistAverage = checklistWorkerData ? calculateCategoryAverage(checklistItems, checklistData, workerName) : 0;
            const checklistPercentage = (checklistAverage / 100) * 20;

            // 두 값의 합산 비율 (최대 100%)
            const combinedPercentage = Math.min(setupPercentage + checklistPercentage, 100);

            // 가중치 적용
            const weight = categoryWeights[col.name] || 0;
            totalWeightedAverage += combinedPercentage * (weight / 100);
            totalWeight += weight;
        });

        const weightedAverage = (totalWeightedAverage / totalWeight) * 100;
        workerAverages.push(weightedAverage);  // 각 작업자의 평균값을 배열에 추가
        const td = document.createElement('td');
        td.textContent = `${weightedAverage.toFixed(1)}%`;
        averageRow.appendChild(td);
    });

        // 평균값 행을 테이블 본문 상단에 추가
        tableBody.insertBefore(averageRow, tableBody.firstChild);

            // 작업자들의 평균을 구해 화면 상단에 표시
    const totalAverage = workerAverages.reduce((acc, curr) => acc + curr, 0) / workerAverages.length;
    totalAverageContainer.innerHTML = `Total Average: ${totalAverage.toFixed(1)}%`;

    

    
        
}

document.addEventListener('DOMContentLoaded', function () {
    const mainButton = document.getElementById('main-button');
    const equipmentButtons = document.getElementById('equipment-buttons');
    
    // "다른 설비로 넘어가기" 버튼을 클릭하면 항목 리스트가 자연스럽게 보이도록 설정
    mainButton.addEventListener('click', () => {
        if (equipmentButtons.classList.contains('open')) {
            equipmentButtons.classList.remove('open'); // 닫히기
        } else {
            equipmentButtons.classList.add('open'); // 열리기
        }
    });

    // 각 설비 버튼을 눌렀을 때 해당 페이지로 이동
    const equipmentBtnElements = document.querySelectorAll('.equipment-btn');
    equipmentBtnElements.forEach(button => {
        button.addEventListener('click', () => {
            const url = button.getAttribute('data-url');
            window.location.href = url;
        });
    });
});

