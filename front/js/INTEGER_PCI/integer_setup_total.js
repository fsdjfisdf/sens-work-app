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
        



    // INTEGER SETUP 데이터를 불러오는 함수
    async function loadSetupData() {
        try {
            const response = await axios.get('http://3.37.73.151:3001/integer-setup/all', {
                headers: {
                    'x-access-token': token
                }
            });
            return response.data;
        } catch (error) {
            console.error('INTEGER SETUP 데이터를 불러오는 중 오류 발생:', error);
            return [];
        }
    }

    // 체크리스트 데이터를 불러오는 함수
    async function loadChecklistData() {
        try {
            const response = await axios.get('http://3.37.73.151:3001/integer-setup/data', {
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

// INTEGER SETUP 테이블 렌더링 함수
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
            'CUSTOMER_OHT_LINE_CHECK': '고객사에서 그린 기준선과 OHT라인이 일치하는지 확인 알고 있는가?',
            'EQUIPMENT_CLEARANCE_CHECK': '설비간 유격거리가 충분한지 확인 알고 있는가?',
            'DRAWING_TEMPLATE_SETUP': 'Drawing Template을 기준선에 맞춰 배치 알고 있는가?',
            'DRAWING_TEMPLATE_MARKING': 'Drawing Template를 펼쳐 타공, H빔 및 Adjust 를 Marking 알고 있는가?',
            'UTILITY_SPEC_UNDERSTANDING': '타공별 Utility Spec을 기입 해야 하는지 알고 있는가?',
            'EQUIPMENT_IMPORT_ORDER': '설비반입 순서를 숙지하고 있는가?',
            'IMPORT_COMPANY_CAUTION': '반입 업체에게 주의점을 설명할 수 있는가?',
            'IMPORT_INSPECTION_POINTS': '설비반입 시 확인해야하는 부분을 숙지하고 있는가?',
            'PROHIBITED_ITEMS_IMPORT': '설비반입 금지 물품에 대해 알고 있는가?',
            'GRATING_OPENING_CHECK': 'Grating 개구부 마감 처리 확인에 대해 알고 있는가?',
            'PACKING_LIST_VERIFICATION': 'Packing List 확인하여 반입 Part 확인이 가능 한가?',
            'TOOL_SIZE_UNDERSTANDING': '장비별 Tool size를 숙지하고 있는가?',
            'LASER_JIG_ALIGNMENT': 'Laser Jig 를 이용하여 OHT Line 과 설비를 정렬 알고 있는가?',
            'LIFT_CASTER_REMOVAL': 'Lift를 활용하여 EFEM의 Caster 를 제거 알고 있는가?',
            'MODULE_HEIGHT_DOCKING': '각 Module의 지면에서 frame의 높이를 알고 Spec에 맞춰 Docking 알고 있는가?',
            'MODULE_DOCKING': 'Module간 Docking 할 수 있는가?',
            'DOCKING_REALIGNMENT': 'Docking작업 중 설비와 OHT Line 정렬이 틀어졌을 경우 재정렬 알고 있는가?',
            'LEVELER_POSITION_UNDERSTANDING': '각 Moudule의 Leveler 정위치를 숙지하고 있는가?',
            'MODULE_LEVELING': '각 Moudule의 Leveling Spec을 알고 Adjust를 이용, Leveling 알고 있는가?',
            'DOCKING_PIN_POSITION': 'Docking Pin 정위치 판단할 수 있는가?',
            'HOOK_UP': '내부 Hook Up 알고 있는가?',
            'TRAY_CHECK': '설비에서 Rack까지 Tray 확인 및 작업가능여부 판단 알고 있는가?',
            'CABLE_SORTING': 'Cable 각 Module별로 분류 알고 있는가?',
            'GRATING_OPEN_CAUTION': 'Grating Open시 주의 사항을 숙지하고 있는가?',
            'LADDER_SAFETY_RULES': '사다리 작업시 환경안전수칙을 숙지하고 있는가?',
            'CABLE_INSTALLATION': '설비에서 Rack까지 포설 알고 있는가?',
            'CABLE_CONNECTION': 'Cable을 설비에 정확히 연결 알고 있는가?',
            'CABLE_TRAY_ARRANGEMENT': 'Cable을 Tray에 규격에 맞게 정리 알고 있는가?',
            'CABLE_CUTTING': '설비와 Rack간의 거리를 고려해 Cable 재단 알고 있는가?',
            'CABLE_RACK_CONNECTION': 'Cable을 Rack에 정확히 연결 알고 있는가?',
            'PUMP_CABLE_TRAY': 'Pump Cable의 종류를 알고 알맞은 Tray로 내려줄 수 있는가?',
            'PUMP_CABLE_ARRANGEMENT': 'Pump단에서 Cable 포설 및 정리 알고 있는가?',
            'CABLE_PM_PUMP_CONNECTION': 'Cable을 구분하여 PM별로 Pump에 정확히 연결 알고 있는가?',
            'GPS_UPS_SPS_UNDERSTANDING': 'GPS, UPS, SPS 의 역할과 원리에 대해 숙지하고 있는가?',
            'POWER_TURN_ON_SEQUENCE': 'Power turn on 순서를 숙지하고 있는가?',
            'RACK_ELCB_MCB_UNDERSTANDING': 'Rack의 ELCB, MCB 종류와 기능을 숙지하고 있는가?',
            'SAFETY_MODULE_UNDERSTANDING': 'Safety Module의 위치와 기능을 숙지하고 있는가?',
            'EMO_CHECK': 'EMO 동작 Check 알고 있는가?',
            'MODULE_MCB_TURN_ON': 'Module별 MCB 위치를 알고 Turn on 알고 있는가?',
            'SYCON_NUMBER_UNDERSTANDING': 'Sycon number 별 의미하는 Part를 숙지하고 있는가?',
            'SYCON_TROUBLESHOOTING': 'Sycon 실행시 통신되지않는 Part에 대해 Troble Shooting 알고 있는가?',
            'POWER_TURN_ON_ALARM_TROUBLESHOOTING': 'Power turn on 후 발생하는 Alram Troble Shooting 알고 있는가?',
            'CHECKLIST_COMPLETION': '구동 Checklist 작성 가능한가?',
            'IP_ADDRESS_CHANGE': 'ip 주소 변경 방법에 대해 알고 있는가?',
            'UTILITY_TURN_ON_PRECHECK': 'Utility Turn on 전 확인사항을 알고 있는가?',
            'SETUP_INI_MODIFICATION': 'SetUp.ini 파일 수정 하는 방법에 대해 알고 있는가?',
            'UTILITY_TURN_ON_SEQUENCE': 'Utility turn on 의 순서를 숙지하고 있는가?',
            'VACUUM_TURN_ON': 'Vacuum Turn on 및 Spec에 맞게 조정 알고 있는가?',
            'CDA_TURN_ON': 'CDA Turn on 및 Spec에 맞게 조정 알고 있는가?',
            'PCW_TURN_ON': 'PCW Turn on 및 Spec에 맞게 조정 알고 있는가?',
            'SOLANOID_VALVE_LOCATION': 'Solanoid Valve 위치를 전부 숙지하고 있는가?',
            'RELIEF_VALVE_LOCATION': 'Relief Valve 위치를 전부 숙지하고 있는가?',
            'MANUAL_VALVE_LOCATION': 'Manual Valve 위치를 전부 숙지하고 있는가?',
            'PUMP_TURN_ON': 'PUMP Turn On 알고 있는가?',
            'PURGE_N2_TURN_ON': 'Purge N2, N2 Turn on 및 Spec에 맞게 조정 알고 있는가?',
            'DILLUTION_SIGNAL_CHECK': 'Dillution Signal Check 방법을 알고 있는가?',
            'CHILLER_HEAT_EXCHANGER_TURN_ON': 'Chiller 및 Heat Exchanger Turn On 알고 있는가?',
            'CHILLER_HEAT_EXCHANGER_CHECK': 'Chiller 및 Heat Exchanger Turn on 이후 확인사항을 알고 있는가?',
            'MANOMETER_LIMIT_ADJUST': 'Manometer의 Low, High Limit 값 Spec에 맞게 조정 알고 있는가?',
            'GAS_TURN_ON_PRECHECK': 'Gas Turn on 전 확인사항 알고 있는가?',
            'NF3_LINE_LEAK_CHECK': 'NF3 Line Leak Check 하는 방법 알고 있는가?',
            'H2_LINE_LEAK_CHECK': 'H2 Line Leak Check 하는 방법 알고 있는가?',
            'NF3_TURN_ON': 'NF3 Turn on 하는 방법 알고 있는가?',
            'H2_TURN_ON': 'H2 Turn on 하는 방법 알고 있는가?',
            'GAS_TURN_ON_CHECK': 'Turn on 이후 확인사항에 대해 알고 있는가?',
            'GAS_TURN_ON_CAUTION': 'Gas Turn on 시 주의사항 알고 있는가?',
            'PM_DILLUTION_TEST': 'PM Dillution Test 하는 방법 알고 있는가?',
            'GAS_TURN_ON_CONFIRM': 'Gas Turn on 및 가스 유입유무를 확인 알고 있는가?',
            'EFEM_ROBOT_PENDANT_CONTROL': 'EFEM Robot Pendant 조작 가능한가?',
            'EFEM_ROBOT_XYZ_VALUES': 'EFEM X,Y,Z,TH 값을 알고 있는가? (SANKYO)',
            'EFEM_ROBOT_PARAMETER_EDIT': 'EFEM Robot Parameter 수정 가능한가? (SANKYO)',
            'EFEM_TEACHING_DATA_SAVE': 'EFEM Teaching Data 저장 가능한가? (SANKYO)',
            'TM_ROBOT_PENDANT_CONTROL': 'TM Robot Pendant 조작 가능한가? (JEL)',
            'TM_ROBOT_LEVELING': 'TM Robot Leveling 가능 한가? (JEL)',
            'TM_ROBOT_XYZ_VALUES': 'TM Robot A,B arm X,Y,Z,TH 값을 알고 있는가? (JEL)',
            'TM_ROBOT_PM_TEACHING': 'TM Robot PM Teaching 가능 한가? (JEL)',
            'TM_ROBOT_AM_TEACHING': 'TM Robot AM Teaching 가능 한가? (JEL)',
            'TM_TEACHING_DATA_SAVE': 'TM Robot Teaching Data 저장 가능한가? (JEL)',
            'WAFER_JIG_USE': 'Teaching Wafer Jig 사용 가능한가?',
            'LASER_JIG_USE': 'Laser Teaching Jig 사용 가능한가?',
            'MARGIN_CHECK': '마진 Check 가능한가?',
            'SEMI_AUTO_TRANSFER': 'Semi Auto Transfer 알고 있는가?',
            'AGING_TEST': 'Aging Test 알고 있는가?',
            'CERAMIC_PLATE_PIN_INSTALLATION': 'Ceramic Plate, Guide Ring, Pin 장착 방법 알고 있는가?',
            'PIN_HEIGHT_ADJUST': 'Pin 장착 및 Pin 높이 조절에 대해 알고 있는가?',
            'PIO_SENSOR_INSTALLATION': 'PIO Sensor 장착 방법 알고 있는가?',
            'VIEW_PORT_COVER_INSTALLATION': 'View Port Cover 장착 방법 알고 있는가?',
            'LOAD_LOCK_LEVELING': 'Load Lock Leveling 방법 알고 있는가?',
            'TM_ROBOT_PICK_INSTALLATION': 'TM Robot Pick 장착 방법 알고 있는가?',
            'TM_ROBOT_PICK_LEVELING': 'TM Robot Pick Leveling 방법 알고 있는가?',
            'GAS_BOX_WINDOW_INSTALLATION': 'Gas Box Window 장착 가능한가?',
            'GAS_BOX_DAMPER_INSTALLATION': 'Gas Box Damper 장착 가능한가?',
            'LINE_MANUAL_LEAK_CHECK': 'Line Manual Leak Check 방법 알고 있는가?',
            'MANUAL_LEAK_CHECK_HISTORY': 'Manual Leak Check History를 확인 할 수 있는가?',
            'HE_DETECTOR_USE': 'He Detector 사용 방법 알고 있는가?',
            'HE_BOTTLE_ORDER': 'He Bottle 쏘는 위치와 순서 알고 있는가?',
            'HE_DETECTOR_HOUSING_LEAK_CHECK': 'He Detector 반응을 보고 Housing Leak와 구별할 수 있는가?',
            'SLOT_VALVE_HE_LEAK_CHECK': 'Slot Valve He Leak Check 방법 알고 있는가?',
            'VAC_CDA_SPEC_ADJUST': 'Vac, CDA Spec에 맞게 조절 가능한가?',
            'TEMP_PROFILE': 'Temp Profile 가능한가?',
            'PUMP_VENT_TIME_ADJUST': 'Pumping / Venting Time 조절 가능한가?',
            'EPD_PEAK_OFFSET_ADJUST': 'EPD Peak, Offset 조절 가능한가?',
            'PM_BAFFLE_TEMP_AUTOTUNE': 'PM Baffle Temp autotune 가능 한가?',
            'DOOR_VALVE_CONTROL': 'Door Valve Open,Close Time 조절 가능 한가?',
            'APC_AUTOLEARN': 'APC Autolearn 가능 한가?',
            'PIN_HEIGHT_ADJUST_B': 'Pin height Adjust 가능 한가?',
            'GAS_SUPPLY_PRESSURE_CHECK': 'Gas Supply Pressure Check 가능 한가?',
            'GAS_EXHAUST_MONAMETER_CONTROL': 'Gas Exhaust Monameter 조작 가능한가?',
            'MFC_HUNTING_CHECK': 'MFC Normal 상태 Hunting 유/무 확인 가능 한가?',
            'LP_FLOW_CONTROL': 'LP 유량 조절 가능한가?',
            'AICP_POWER_CAL': 'AICP Power Cal 가능한가?',
            'PRODUCT_REPORT_COMPLETION': 'Product Report 작성 가능한가?',
            'TTTM_SHEET_COMPLETION': 'TTTM Sheet 작성 가능한가?',
            'LP_CERTIFICATION': 'LP 인증 가능한가?',
            'FULL_PUMPING': 'Full Pumping을 걸 수 있는가?',
            'MID_OPERATION_CERTIFICATION_PREP': '중간가동인증 준비 사항 알고 있는가?',
            'LABEL_PLACEMENT': 'Lavel 붙여야 하는 곳이 어디인지 알고 있는가?',
            'I_MARKING_PROCEDURE': 'I-Marking 방법에 대해 알고 있는가?',
            'I_MARKING_LOCATION': 'I-Marking 하는 곳이 어디인지 알고 있는가?',
            'GAS_BOX_BOARD_LEVELING': '도면을 보고 Gas Box Board Leveling을 할 수 있는가?',
            'ENVIRONMENTAL_QUAL_TEST': '환경 Qual Test 가능한가?',
            'OHT_AUTO_TRANSFER_CERTIFICATION': 'OHT 자동반송 인증 Test 가능한가?',
            'PARTICLE_TEST': 'Particle Test 가능한가?',
            'EA_TEST': 'E/A Test 가능한가?'
        };
        
        
        checklistTableHead.innerHTML = '';
        checklistTableBody.innerHTML = '';
    
        const categories = {
            'INSTALLATION_PREPARATION': [
                'CUSTOMER_OHT_LINE_CHECK', 
                'EQUIPMENT_CLEARANCE_CHECK', 
                'DRAWING_TEMPLATE_SETUP', 
                'DRAWING_TEMPLATE_MARKING', 
                'UTILITY_SPEC_UNDERSTANDING'
            ],
            'FAB_IN': [
                'EQUIPMENT_IMPORT_ORDER', 
                'IMPORT_COMPANY_CAUTION', 
                'IMPORT_INSPECTION_POINTS', 
                'PROHIBITED_ITEMS_IMPORT', 
                'GRATING_OPENING_CHECK', 
                'PACKING_LIST_VERIFICATION'
            ],
            'DOCKING': [
                'TOOL_SIZE_UNDERSTANDING', 
                'LASER_JIG_ALIGNMENT', 
                'LIFT_CASTER_REMOVAL', 
                'MODULE_HEIGHT_DOCKING', 
                'MODULE_DOCKING', 
                'DOCKING_REALIGNMENT', 
                'LEVELER_POSITION_UNDERSTANDING', 
                'MODULE_LEVELING', 
                'DOCKING_PIN_POSITION', 
                'HOOK_UP'
            ],
            'CABLE_HOOK_UP': [
                'TRAY_CHECK', 
                'CABLE_SORTING', 
                'GRATING_OPEN_CAUTION', 
                'LADDER_SAFETY_RULES', 
                'CABLE_INSTALLATION', 
                'CABLE_CONNECTION', 
                'CABLE_TRAY_ARRANGEMENT', 
                'CABLE_CUTTING', 
                'CABLE_RACK_CONNECTION', 
                'PUMP_CABLE_TRAY', 
                'PUMP_CABLE_ARRANGEMENT', 
                'CABLE_PM_PUMP_CONNECTION'
            ],
            'POWER_TURN_ON': [
                'GPS_UPS_SPS_UNDERSTANDING', 
                'POWER_TURN_ON_SEQUENCE', 
                'RACK_ELCB_MCB_UNDERSTANDING', 
                'SAFETY_MODULE_UNDERSTANDING', 
                'EMO_CHECK', 
                'MODULE_MCB_TURN_ON', 
                'SYCON_NUMBER_UNDERSTANDING', 
                'SYCON_TROUBLESHOOTING', 
                'POWER_TURN_ON_ALARM_TROUBLESHOOTING', 
                'CHECKLIST_COMPLETION', 
                'IP_ADDRESS_CHANGE'
            ],
            'UTILITY_TURN_ON': [
                'UTILITY_TURN_ON_PRECHECK', 
                'SETUP_INI_MODIFICATION', 
                'UTILITY_TURN_ON_SEQUENCE', 
                'VACUUM_TURN_ON', 
                'CDA_TURN_ON', 
                'PCW_TURN_ON', 
                'SOLANOID_VALVE_LOCATION', 
                'RELIEF_VALVE_LOCATION', 
                'MANUAL_VALVE_LOCATION', 
                'PUMP_TURN_ON', 
                'PURGE_N2_TURN_ON', 
                'DILLUTION_SIGNAL_CHECK', 
                'CHILLER_HEAT_EXCHANGER_TURN_ON', 
                'CHILLER_HEAT_EXCHANGER_CHECK', 
                'MANOMETER_LIMIT_ADJUST'
            ],
            'GAS_TURN_ON': [
                'GAS_TURN_ON_PRECHECK', 
                'NF3_LINE_LEAK_CHECK', 
                'H2_LINE_LEAK_CHECK', 
                'NF3_TURN_ON', 
                'H2_TURN_ON', 
                'GAS_TURN_ON_CHECK', 
                'GAS_TURN_ON_CAUTION', 
                'PM_DILLUTION_TEST', 
                'GAS_TURN_ON_CONFIRM'
            ],
            'TEACHING': [
                'EFEM_ROBOT_PENDANT_CONTROL', 
                'EFEM_ROBOT_XYZ_VALUES', 
                'EFEM_ROBOT_PARAMETER_EDIT', 
                'EFEM_TEACHING_DATA_SAVE', 
                'TM_ROBOT_PENDANT_CONTROL', 
                'TM_ROBOT_LEVELING', 
                'TM_ROBOT_XYZ_VALUES', 
                'TM_ROBOT_PM_TEACHING', 
                'TM_ROBOT_AM_TEACHING', 
                'TM_TEACHING_DATA_SAVE', 
                'WAFER_JIG_USE', 
                'LASER_JIG_USE', 
                'MARGIN_CHECK', 
                'SEMI_AUTO_TRANSFER', 
                'AGING_TEST'
            ],
            'PART_INSTALLATION': [
                'CERAMIC_PLATE_PIN_INSTALLATION', 
                'PIN_HEIGHT_ADJUST', 
                'PIO_SENSOR_INSTALLATION', 
                'VIEW_PORT_COVER_INSTALLATION', 
                'LOAD_LOCK_LEVELING', 
                'TM_ROBOT_PICK_INSTALLATION', 
                'TM_ROBOT_PICK_LEVELING', 
                'GAS_BOX_WINDOW_INSTALLATION', 
                'GAS_BOX_DAMPER_INSTALLATION'
            ],
            'LEAK_CHECK': [
                'LINE_MANUAL_LEAK_CHECK', 
                'MANUAL_LEAK_CHECK_HISTORY', 
                'HE_DETECTOR_USE', 
                'HE_BOTTLE_ORDER', 
                'HE_DETECTOR_HOUSING_LEAK_CHECK', 
                'SLOT_VALVE_HE_LEAK_CHECK'
            ],
            'TTTM': [
                'VAC_CDA_SPEC_ADJUST', 
                'TEMP_PROFILE', 
                'PUMP_VENT_TIME_ADJUST', 
                'EPD_PEAK_OFFSET_ADJUST', 
                'PM_BAFFLE_TEMP_AUTOTUNE', 
                'DOOR_VALVE_CONTROL', 
                'APC_AUTOLEARN', 
                'PIN_HEIGHT_ADJUST_B', 
                'GAS_SUPPLY_PRESSURE_CHECK', 
                'GAS_EXHAUST_MONAMETER_CONTROL', 
                'MFC_HUNTING_CHECK', 
                'LP_FLOW_CONTROL', 
                'AICP_POWER_CAL', 
                'PRODUCT_REPORT_COMPLETION', 
                'TTTM_SHEET_COMPLETION'
            ],
            'CUSTOMER_CERTIFICATION': [
                'LP_CERTIFICATION', 
                'FULL_PUMPING', 
                'MID_OPERATION_CERTIFICATION_PREP', 
                'LABEL_PLACEMENT', 
                'I_MARKING_PROCEDURE', 
                'I_MARKING_LOCATION', 
                'GAS_BOX_BOARD_LEVELING', 
                'ENVIRONMENTAL_QUAL_TEST', 
                'OHT_AUTO_TRANSFER_CERTIFICATION'
            ],
            'PROCESS_CONFIRM': [
                'PARTICLE_TEST', 
                'EA_TEST'
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
            'DRAWING_TEMPLATE_SETUP', 
            'DRAWING_TEMPLATE_MARKING', 
            'CUSTOMER_OHT_LINE_CHECK', 
            'UTILITY_SPEC_UNDERSTANDING'
        ],
        'FAB_IN': [
            'EQUIPMENT_IMPORT_CAUTION', 
            'EQUIPMENT_IMPORT_ORDER', 
            'EQUIPMENT_SPACING_CHECK', 
            'PACKING_LIST_CHECK'
        ],
        'DOCKING': [
            'TOOL_SIZE_UNDERSTANDING', 
            'LASER_JIG_ALIGNMENT', 
            'LIFT_CASTER_REMOVAL', 
            'MODULE_HEIGHT_DOCKING', 
            'MODULE_DOCKING', 
            'DOCKING_REALIGNMENT', 
            'LEVELER_POSITION_UNDERSTANDING', 
            'MODULE_LEVELING', 
            'HOOK_UP'
        ],
        'CABLE_HOOK_UP': [
            'TRAY_CHECK', 
            'CABLE_SORTING', 
            'GRATING_OPEN_CAUTION', 
            'LADDER_SAFETY_RULES', 
            'CABLE_INSTALLATION', 
            'CABLE_CONNECTION', 
            'CABLE_TRAY_ARRANGEMENT', 
            'CABLE_CUTTING', 
            'PUMP_CABLE_TRAY', 
            'PUMP_CABLE_ARRANGEMENT', 
            'CABLE_PM_PUMP_CONNECTION'
        ],
        'POWER_TURN_ON': [
            'GPS_UPS_SPS_UNDERSTANDING', 
            'POWER_TURN_ON_SEQUENCE', 
            'RACK_CB_UNDERSTANDING', 
            'SYCON_NUMBER_UNDERSTANDING', 
            'MODULE_CB_TURN_ON', 
            'SAFETY_MODULE_UNDERSTANDING', 
            'EMO_CHECK', 
            'POWER_TURN_ON_ALARM_TROUBLESHOOTING'
        ],
        'UTILITY_TURN_ON': [
            'UTILITY_TURN_ON_SEQUENCE', 
            'VACUUM_TURN_ON', 
            'CDA_TURN_ON', 
            'PCW_TURN_ON'
        ],
        'GAS_TURN_ON': [
            'GAS_TURN_ON', 
            'GAS_TURN_ON_CHECK', 
            'OX_NX_GAS_TURN_ON', 
            'MANOMETER_LIMIT_ADJUST'
        ],
        'TEACHING': [
            'EFEM_ROBOT_PENDANT_CONTROL', 
            'EFEM_ROBOT_LEVELING', 
            'EFEM_ROBOT_ARM_LEVELING', 
            'EFEM_TEACHING_DATA_SAVE', 
            'TM_ROBOT_PENDANT_CONTROL', 
            'TM_ROBOT_PICK_ADJUST', 
            'TM_ROBOT_BM_TEACHING', 
            'TM_ROBOT_PM_TEACHING', 
            'TM_TEACHING_DATA_SAVE', 
            'WAFER_JIG_USE', 
            'LASER_JIG_USE', 
            'FINE_TEACHING', 
            'MARGIN_CHECK', 
            'SEMI_AUTO_TRANSFER', 
            'AGING_TEST'
        ],
        'PART_INSTALLATION': [
            'BARATRON_PIRANI_GAUGE_INSTALLATION', 
            'EPD_INSTALLATION', 
            'PIO_SENSOR_CABLE_INSTALLATION', 
            'RACK_SIGNAL_TOWER_INSTALLATION', 
            'CTC_INSTALLATION', 
            'PORTABLE_RACK_INSTALLATION', 
            'PM_SAFETY_COVER_INSTALLATION', 
            'PROCESS_KIT_INSTALLATION'
        ],
        'LEAK_CHECK': [
            'PUMP_TURN_ON', 
            'PM_LEAK_CHECK', 
            'GAS_LINE_LEAK_CHECK', 
            'HELIUM_DETECTOR_USE'
        ],
        'TTTM': [
            'ECID_MATCHING', 
            'COOLING_STAGE_PIN_CONTROL', 
            'PUMP_VENT_TIME_ADJUST', 
            'EPD_PEAK_OFFSET_ADJUST', 
            'TEMP_AUTOTUNE', 
            'DOOR_VALVE_CONTROL', 
            'APC_AUTOLEARN', 
            'PIN_SPEED_HEIGHT_ADJUST', 
            'GAS_SUPPLY_PRESSURE_CHECK', 
            'MFC_HUNTING_CHECK', 
            'FCIP_CAL', 
            'TTTM_SHEET_COMPLETION'
        ],
        'CUSTOMER_CERTIFICATION': [
            'OHT_LAY_OUT_CERTIFICATION', 
            'OHT_CERTIFICATION', 
            'TOOL_PREP_CERTIFICATION', 
            'EFEM_CERTIFICATION_PREP', 
            'TM_CERTIFICATION_PREP', 
            'PM_CERTIFICATION_PREP', 
            'SUB_UNIT_CERTIFICATION_PREP', 
            'RACK_CERTIFICATION_PREP', 
            'CERTIFICATION_RESPONSE', 
            'ENVIRONMENTAL_QUAL_RESPONSE'
        ],
        'PROCESS_CONFIRM': [
            'AGING_TEST_PROCESS_CONFIRM', 
            'EES_REPORT_PROCEDURE'
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

