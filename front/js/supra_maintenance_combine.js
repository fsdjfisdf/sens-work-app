document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('x-access-token');
    if (!token) {
        alert('로그인이 필요합니다.');
        window.location.replace('./signin.html');
        return;
    }

    let logs = [];
    let taskCounts = {};  
    let dbTaskCounts = {};  
    let allData = []; // supra maintenance 데이터를 저장할 변수
    const excludedWorkers = ["김지웅", "퇴사자 여기에 추가"];
    const validEquipmentTypes = ["SUPRA N", "SUPRA NM", "SUPRA III", "SUPRA IV", "SUPRA V", "SUPRA Vplus", "SUPRA VM"];
    
    const taskCategories = [
        {
            category: "ESCORT",
            subcategories: [
                { name: "LP ESCORT", displayName: "LP ESCORT", 기준작업수: 3 },
                { name: "ROBOT ESCORT", displayName: "Robot Escort", 기준작업수: 3 }
            ]
        },
        {
            category: "EFEM Robot",
            subcategories: [
                { name: "EFEM ROBOT TEACHING", displayName: "EFEM ROBOT TEACHING", 기준작업수: 5 },
                { name: "EFEM_ROBOT_REP", displayName: "EFEM ROBOT REP", 기준작업수: 5 },
                { name: "EFEM_ROBOT_CONTROLLER_REP", displayName: "EFEM Robot Controller REP", 기준작업수: 5 }
            ]
        },
        {
            category: "TM Robot",
            subcategories: [
                { name: "TM_ROBOT_TEACHING", displayName: "TM ROBOT TEACHING", 기준작업수: 5 },
                { name: "TM_ROBOT_REP", displayName: "TM ROBOT REP", 기준작업수: 5 },
                { name: "TM_ROBOT_CONTROLLER_REP", displayName: "TM ROBOT CONTROLLER REP", 기준작업수: 5 },
                { name: "PASSIVE_PAD_REP", displayName: "Passive Pad REP", 기준작업수: 3 }
            ]
        },
        {
            category: "BM Module",
            subcategories: [
                { name: "PIN_CYLINDER", displayName: "Pin Cylinder", 기준작업수: 3 },
                { name: "PUSHER_CYLINDER", displayName: "Pusher Cylinder", 기준작업수: 1 },
                { name: "IB_FLOW", displayName: "IB Flow", 기준작업수: 1 },
                { name: "DRT", displayName: "DRT", 기준작업수: 1 }
            ]
        },
        {
            category: "FFU (EFEM, TM)",
            subcategories: [
                { name: "FFU_CONTROLLER", displayName: "FFU Controller", 기준작업수: 3 },
                { name: "FAN", displayName: "FAN", 기준작업수: 3 },
                { name: "MOTOR_DRIVER", displayName: "Motor Driver", 기준작업수: 1 }
            ]
        },
        {
            category: "FCIP",
            subcategories: [
                { name: "R1", displayName: "R1", 기준작업수: 5 },
                { name: "R3", displayName: "R3", 기준작업수: 5 },
                { name: "R5", displayName: "R5", 기준작업수: 5 },
                { name: "R3_TO_R5", displayName: "R3 To R5", 기준작업수: 5 }
            ]
        },
        {
            category: "Microwave",
            subcategories: [
                { name: "MICROWAVE", displayName: "Microwave", 기준작업수: 3 },
                { name: "APPLICATOR", displayName: "Applicator", 기준작업수: 2 },
                { name: "GENERATOR", displayName: "Generator", 기준작업수: 2 }
            ]
        },
        {
            category: "Chuck",
            subcategories: [
                { name: "CHUCK", displayName: "Chuck", 기준작업수: 5 }
            ]
        },
        {
            category: "Process Kit",
            subcategories: [
                { name: "PROCESS_KIT", displayName: "Process Kit", 기준작업수: 5 }
            ]
        },
        {
            category: "Leak",
            subcategories: [
                { name: "HELIUM_DETECTOR", displayName: "Helium Detector", 기준작업수: 3 }
            ]
        },
        {
            category: "Pin",
            subcategories: [
                { name: "HOOK_LIFT_PIN", displayName: "Hook Lift Pin", 기준작업수: 3 },
                { name: "BELLOWS", displayName: "Bellows", 기준작업수: 1 },
                { name: "PIN_SENSOR", displayName: "Pin Sensor", 기준작업수: 1 },
                { name: "LM_GUIDE", displayName: "LM Guide", 기준작업수: 1 },
                { name: "PIN_MOTOR_CONTROLLER", displayName: "Pin Motor Controller", 기준작업수: 3 }
            ]
        },
        {
            category: "EPD",
            subcategories: [
                { name: "SINGLE", displayName: "SINGLE EPD", 기준작업수: 3 },
                { name: "DUAL", displayName: "DUAL EPD", 기준작업수: 1 }
            ]
        },
        {
            category: "Board",
            subcategories: [
                { name: "GAS_BOX_BOARD", displayName: "Gas Box Board", 기준작업수: 2 },
                { name: "TEMP_CONTROLLER_BOARD", displayName: "Temp Controller Board", 기준작업수: 2 },
                { name: "POWER_DISTRIBUTION_BOARD", displayName: "Power Distribution Board", 기준작업수: 2 },
                { name: "DC_POWER_SUPPLY", displayName: "DC Power Supply", 기준작업수: 2 },
                { name: "BM_SENSOR", displayName: "BM Sensor", 기준작업수: 1 },
                { name: "PIO_SENSOR", displayName: "PIO Sensor", 기준작업수: 1 },
                { name: "SAFETY_MODULE", displayName: "Safety Module", 기준작업수: 1 },
                { name: "D_NET", displayName: "D-NET", 기준작업수: 2 }
            ]
        },
        {
            category: "Valve",
            subcategories: [
                { name: "SOLENOID", displayName: "Solenoid", 기준작업수: 2 },
                { name: "FAST_VAC_VALVE", displayName: "Fast Vac Valve", 기준작업수: 2 },
                { name: "SLOW_VAC_VALVE", displayName: "Slow Vac Valve", 기준작업수: 2 },
                { name: "SLIT_DOOR", displayName: "Slit Door", 기준작업수: 3 },
                { name: "APC_VALVE", displayName: "APC Valve", 기준작업수: 3 },
                { name: "SHUTOFF_VALVE", displayName: "Shutoff Valve", 기준작업수: 3 }
            ]
        },
        {
            category: "ETC",
            subcategories: [
                { name: "BARATRON_ASSY", displayName: "Baratron Ass'y", 기준작업수: 1 },
                { name: "PIRANI_ASSY", displayName: "Pirani Ass'y", 기준작업수: 1 },
                { name: "VIEW_PORT_QUARTZ", displayName: "View Port Quartz", 기준작업수: 1 },
                { name: "FLOW_SWITCH", displayName: "Flow Switch", 기준작업수: 1 },
                { name: "CERAMIC_PLATE", displayName: "Ceramic Plate", 기준작업수: 3 },
                { name: "MONITOR", displayName: "Monitor", 기준작업수: 1 },
                { name: "KEYBOARD", displayName: "Keyboard", 기준작업수: 1 },
                { name: "MOUSE", displayName: "Mouse", 기준작업수: 1 }
            ]
        }
    ];

    // 작업 로그와 DB에서 작업자별 데이터를 불러오는 함수
    async function loadWorkLogs() {
        try {
            const response = await axios.get('http://3.37.73.151:3001/logs');
            logs = response.data.sort((a, b) => new Date(b.task_date) - new Date(a.task_date));
            await loadDbTaskCounts();
            calculateTaskCounts(logs);
        } catch (error) {
            console.error('작업 로그를 불러오는 중 오류 발생:', error);
        }
    }

    async function loadDbTaskCounts() {
        try {
            const response = await axios.get('http://3.37.73.151:3001/api/task-count');
            dbTaskCounts = response.data.reduce((acc, row) => {
                const taskItem = row['작업_항목'];
                Object.keys(row).forEach(worker => {
                    if (worker !== '작업_항목' && !excludedWorkers.includes(worker)) {
                        if (!acc[worker]) acc[worker] = {};
                        acc[worker][taskItem] = row[worker] || 0;
                    }
                });
                return acc;
            }, {});
        } catch (error) {
            console.error('DB 작업 카운트를 불러오는 중 오류 발생:', error);
        }
    }

    function calculateTaskCounts(logs) {
        taskCounts = {};
        logs.forEach(log => {
            if (!validEquipmentTypes.includes(log.equipment_type)) return;
            let workers = log.task_man.split(/[\s,]+/).map(worker => worker.replace(/\(main\)|\(support\)/g, '').trim());
            workers.forEach(worker => {
                if (!worker || excludedWorkers.includes(worker)) return;

                if (!taskCounts[worker]) {
                    taskCounts[worker] = {};
                    taskCategories.forEach(category => {
                        category.subcategories.forEach(item => {
                            taskCounts[worker][item.name] = { count: 0, 기준작업수: item.기준작업수 };
                        });
                    });
                }
                const taskType = log.transfer_item;
                if (taskType && taskType !== "SELECT" && taskCounts[worker][taskType]) {
                    taskCounts[worker][taskType].count++;
                }
            });
        });

        Object.keys(dbTaskCounts).forEach(worker => {
            if (!taskCounts[worker]) {
                taskCounts[worker] = {};
                taskCategories.forEach(category => {
                    category.subcategories.forEach(item => {
                        taskCounts[worker][item.name] = { count: 0, 기준작업수: item.기준작업수 };
                    });
                });
            }
            Object.keys(dbTaskCounts[worker]).forEach(taskType => {
                if (!taskCounts[worker][taskType]) {
                    taskCounts[worker][taskType] = { count: 0, 기준작업수: taskCategories.find(category => category.subcategories.some(item => item.name === taskType))?.subcategories.find(item => item.name === taskType)?.기준작업수 || 1 };
                }
                taskCounts[worker][taskType].count += dbTaskCounts[worker][taskType];
            });
        });

        addRelatedTaskCounts();
        displayTaskCounts(taskCounts);
    }

    function addRelatedTaskCounts() {
        Object.keys(taskCounts).forEach(worker => {
            taskCounts[worker]["TM_ROBOT_TEACHING"].count += taskCounts[worker]["TM_ROBOT_REP"].count;
            taskCounts[worker]["TM_ROBOT_CONTROLLER_REP"].count += taskCounts[worker]["TM_ROBOT_REP"].count;
            taskCounts[worker]["IB_FLOW"].count += taskCounts[worker]["PIN_CYLINDER"].count;
            taskCounts[worker]["EFEM_ROBOT_TEACHING"].count += taskCounts[worker]["EFEM_ROBOT_REP"].count;
            taskCounts[worker]["EFEM_ROBOT_CONTROLLER_REP"].count += taskCounts[worker]["EFEM_ROBOT_REP"].count;
            taskCounts[worker]["R3"].count += taskCounts[worker]["R3_TO_R5"].count;
            taskCounts[worker]["R5"].count += taskCounts[worker]["R3_TO_R5"].count;
        });
    }

    function displayTaskCounts(taskCounts) {
        const tableHead = document.getElementById('task-count-table-head');
        const tableBody = document.getElementById('task-count-table-body');
        tableHead.innerHTML = '';
        tableBody.innerHTML = '';

        const sortedWorkers = Object.keys(taskCounts).sort();

        const headerRow = document.createElement('tr');
        headerRow.appendChild(document.createElement('th')).textContent = "작업 항목";
        sortedWorkers.forEach(worker => {
            const th = document.createElement('th');
            th.textContent = worker;
            headerRow.appendChild(th);
        });
        tableHead.appendChild(headerRow);

        taskCategories.forEach(category => {
            category.subcategories.forEach(item => {
                const row = document.createElement('tr');
                const taskCell = document.createElement('td');
                taskCell.textContent = item.displayName;
                row.appendChild(taskCell);

                sortedWorkers.forEach(worker => {
                    const count = taskCounts[worker][item.name].count;
                    const 기준작업수 = taskCounts[worker][item.name].기준작업수;
                    const percentage = Math.min((count / 기준작업수) * 100, 100);

                    const countCell = document.createElement('td');
                    countCell.textContent = `${count} (${Math.round(percentage)}%)`;
                    row.appendChild(countCell);
                });

                tableBody.appendChild(row);
            });
        });
    }

    async function loadAllSupraMaintenanceData() {
        try {
            const response = await axios.get('http://3.37.73.151:3001/supra-maintenance/all', {
                headers: { 'x-access-token': token }
            });
            allData = response.data;
            generateTable(allData);
        } catch (error) {
            console.error('데이터를 불러오는 중 오류 발생:', error);
        }
    }

    function generateTable(data) {
        const tableHead = document.getElementById('supra-maintenance-table-head');
        const tableBody = document.getElementById('supra-maintenance-table-body');
        tableHead.innerHTML = ''; 
        tableBody.innerHTML = ''; 

        const headerRow = document.createElement('tr');
        const categoryHeader = document.createElement('th');
        categoryHeader.textContent = '중분류';
        headerRow.appendChild(categoryHeader);

        const taskHeader = document.createElement('th');
        taskHeader.textContent = '작업 항목';
        headerRow.appendChild(taskHeader);

        const workers = [...new Set(data.map(row => row.name))]; 
        workers.forEach(worker => {
            const th = document.createElement('th');
            th.textContent = worker;
            headerRow.appendChild(th);
        });
        tableHead.appendChild(headerRow);

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

                workers.forEach(workerName => {
                    const workerData = data.find(worker => worker.name === workerName);
                    const taskValue = workerData ? workerData[subcategory.name] : 'N/A';
                    const cell = document.createElement('td');
                    cell.textContent = taskValue;
                    row.appendChild(cell);
                });

                tableBody.appendChild(row);
            });
        });
    }

    loadWorkLogs();
    loadAllSupraMaintenanceData();
});
