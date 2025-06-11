    let logs = [];
    let taskCounts = {};  // 전역으로 이동
    let dbTaskCounts = {};  // DB에서 가져온 작업자별 작업 건수를 저장할 객체

document.addEventListener('DOMContentLoaded', async () => {
        const token = localStorage.getItem('x-access-token');

    if (!token) {
        alert('로그인이 필요합니다.');
        window.location.replace('./signin.html');
        return;
    }
    

    const excludedWorkers = ["김지웅", "김태형", "홍정욱", "김희수", "김태준"];  // 제외할 작업자들의 이름

    // 대분류 및 중분류와 작업 항목 리스트 정의
    window.taskCategories = [
        {
            category: "ESCORT",
            subcategories: [
                { name: "LP ESCORT", 기준작업수: 3 },
                { name: "ROBOT ESCORT", 기준작업수: 3 }
            ]
        },
        {
            category: "EFEM ROBOT",
            subcategories: [
                { name: "SR8241 TEACHING", 기준작업수: 5 },
                { name: "SR8240 TEACHING", 기준작업수: 5 },
                { name: "M124 TEACHING", 기준작업수: 5 },
                { name: "EFEM FIXTURE", 기준작업수: 5 },
                { name: "EFEM ROBOT REP", 기준작업수: 5 },
                { name: "EFEM ROBOT CONTROLLER REP", 기준작업수: 5 }
            ]
        },
        {
            category: "TM ROBOT",
            subcategories: [
                { name: "SR8250 TEACHING", 기준작업수: 5 },
                { name: "SR8232 TEACHING", 기준작업수: 5 },
                { name: "TM ROBOT REP", 기준작업수: 5 },
                { name: "TM ROBOT CONTROLLER REP", 기준작업수: 5 },
                { name: "PASSIVE PAD REP", 기준작업수: 3 }
            ]
        },
        {
            category: "BM MODULE",
            subcategories: [
                { name: "PIN CYLINDER", 기준작업수: 3 },
                { name: "PUSHER CYLINDER", 기준작업수: 1 },
                { name: "IB FLOW", 기준작업수: 1 },
                { name: "DRT", 기준작업수: 1 }
            ]
        },
        {
            category: "FFU (EFEM, TM)",
            subcategories: [
                { name: "FFU CONTROLLER", 기준작업수: 3 },
                { name: "FAN", 기준작업수: 3 },
                { name: "MOTOR DRIVER", 기준작업수: 1 }
            ]
        },
        {
            category: "FCIP",
            subcategories: [
                { name: "R1", 기준작업수: 5 },
                { name: "R3", 기준작업수: 5 },
                { name: "R5", 기준작업수: 5 },
                { name: "R3 TO R5", 기준작업수: 5 },
                { name: "PRISM", 기준작업수: 3 }
            ]
        },
        {
            category: "MICROWAVE",
            subcategories: [
                { name: "MICROWAVE", 기준작업수: 3 },
                { name: "APPLICATOR", 기준작업수: 2 },
                { name: "GENERATOR", 기준작업수: 2 }
            ]
        },
        {
            category: "CHUCK",
            subcategories: [
                { name: "CHUCK", 기준작업수: 5 }
            ]
        },
        {
            category: "PROCESS KIT",
            subcategories: [
                { name: "PROCESS KIT", 기준작업수: 5 }
            ]
        },
        {
            category: "LEAK",
            subcategories: [
                { name: "HELIUM DETECTOR", 기준작업수: 3 }
            ]
        },
        {
            category: "PIN",
            subcategories: [
                { name: "HOOK LIFT PIN", 기준작업수: 3 },
                { name: "BELLOWS", 기준작업수: 1 },
                { name: "PIN SENSOR", 기준작업수: 1 },
                { name: "LM GUIDE", 기준작업수: 1 },
                { name: "PIN MOTOR CONTROLLER", 기준작업수: 3 }
            ]
        },
        {
            category: "EPD",
            subcategories: [
                { name: "SINGLE EPD", 기준작업수: 3 },
                { name: "DUAL EPD", 기준작업수: 1 }
            ]
        },
        {
            category: "BOARD",
            subcategories: [
                { name: "GAS BOX BOARD", 기준작업수: 2 },
                { name: "TEMP CONTROLLER BOARD", 기준작업수: 2 },
                { name: "POWER DISTRIBUTION BOARD", 기준작업수: 2 },
                { name: "DC POWER SUPPLY", 기준작업수: 2 },
                { name: "BM SENSOR", 기준작업수: 1 },
                { name: "PIO SENSOR", 기준작업수: 1 },
                { name: "SAFETY MODULE", 기준작업수: 1 },
                { name: "IO BOX", 기준작업수: 3 },
                { name: "FPS BOARD", 기준작업수: 1 },
                { name: "D-NET", 기준작업수: 2 }
            ]
        },
        {
            category: "IGS BLOCK",
            subcategories: [
                { name: "MFC", 기준작업수: 2 },
                { name: "VALVE", 기준작업수: 2 }
            ]
        },
        {
            category: "VALVE",
            subcategories: [
                { name: "SOLENOID", 기준작업수: 2 },
                { name: "FAST VAC VALVE", 기준작업수: 2 },
                { name: "SLOW VAC VALVE", 기준작업수: 2 },
                { name: "SLIT DOOR", 기준작업수: 3 },
                { name: "APC VALVE", 기준작업수: 3 },
                { name: "SHUTOFF VALVE", 기준작업수: 3 }
            ]
        },
        {
            category: "ETC",
            subcategories: [
                { name: "BARATRON ASS'Y", 기준작업수: 1 },
                { name: "PIRANI ASS'Y", 기준작업수: 1 },
                { name: "VIEW PORT QUARTZ", 기준작업수: 1 },
                { name: "FLOW SWITCH", 기준작업수: 1 },
                { name: "CERAMIC PLATE", 기준작업수: 3 },
                { name: "MONITOR", 기준작업수: 1 },
                { name: "KEYBOARD", 기준작업수: 1 },
                { name: "MOUSE", 기준작업수: 1 },
                { name: "HEATING JACKET", 기준작업수: 1 },
                { name: "WATER LEAK DETECTOR", 기준작업수: 1 },
                { name: "MANOMETER", 기준작업수: 1 }
            ]
        },
        {
            category: "CTR",
            subcategories: [
                { name: "CTC", 기준작업수: 2 },
                { name: "PMC", 기준작업수: 2 },
                { name: "EDA", 기준작업수: 2 },
                { name: "EFEM CONTROLLER", 기준작업수: 2 },
                { name: "TEMP LIMIT CONTROLLER", 기준작업수: 3 },
                { name: "TEMP CONTROLLER", 기준작업수: 3 },
            ]
        },
        {
            category: "S/W",
            subcategories: [
                { name: "S/W PATCH", 기준작업수: 2 }
            ]
        }
    ];

    const validEquipmentTypes = [
        "SUPRA N", "SUPRA NM", "SUPRA III", "SUPRA IV", "SUPRA V", 
        "SUPRA Vplus", "SUPRA VM", "SUPRA Q"
    ];

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

    // 모든 데이터 계산 후 서버로 전송하는 함수 추가
async function saveAggregatedDataToServer(aggregatedData) {
    try {
        const response = await axios.post('http://3.37.73.151:3001/supra-maintenance/aggregated', aggregatedData, {
            headers: {
                'x-access-token': localStorage.getItem('x-access-token')
            }
        });
    } catch (error) {
        console.error('Error saving aggregated data:', error);
    }
}

// 작업 완료 후 데이터를 서버로 전송
calculateTaskCounts(logs);
saveAggregatedDataToServer(taskCounts);


    function calculateTaskCounts(logs) {
        taskCounts = {};

        logs.forEach(log => {
            if (!validEquipmentTypes.includes(log.equipment_type)) return;
        
            // (main)을 제거하고 (support)는 제외
            let workers = log.task_man.split(/[\s,]+/).map(worker => worker.replace(/\(main\)/g, '').trim());
        
            workers.forEach(worker => {
                // (support) 작업자는 카운트하지 않음
                if (!worker || excludedWorkers.includes(worker) || worker.includes('(support)')) return;
        
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
            const safeGet = (taskCounts, worker, taskName) => taskCounts[worker][taskName] || { count: 0 };
    
            taskCounts[worker]["SR8250 TEACHING"].count += safeGet(taskCounts, worker, "TM ROBOT REP").count;
            taskCounts[worker]["TM ROBOT CONTROLLER REP"].count += safeGet(taskCounts, worker, "TM ROBOT REP").count;
            taskCounts[worker]["IB FLOW"].count += safeGet(taskCounts, worker, "PIN CYLINDER").count;
            taskCounts[worker]["SR8241 TEACHING"].count += safeGet(taskCounts, worker, "EFEM ROBOT REP").count;
            taskCounts[worker]["EFEM ROBOT CONTROLLER REP"].count += safeGet(taskCounts, worker, "EFEM ROBOT REP").count;
            taskCounts[worker]["R3"].count += safeGet(taskCounts, worker, "R3 TO R5").count;
            taskCounts[worker]["R5"].count += safeGet(taskCounts, worker, "R3 TO R5").count;
        });
    }

    function calculateAveragePercentages(taskCounts) {
        const percentages = {};
        
        // 각 작업자별로 퍼센트를 계산
        Object.keys(taskCounts).forEach(worker => {
            if (!percentages[worker]) {
                percentages[worker] = {};
            }
    
            Object.keys(taskCounts[worker]).forEach(task => {
                const taskData = taskCounts[worker][task] || { count: 0, 기준작업수: 1 };  // 기본값 설정
                const count = taskData.count;
                const 기준작업수 = taskData.기준작업수;
    
                // 기준 작업 수가 0 이상일 때 퍼센트를 계산하고, 그렇지 않으면 0으로 설정
                if (기준작업수 > 0) {
                    const percentage = Math.min((count / 기준작업수) * 100, 100);
                    percentages[worker][task] = percentage;
                } else {
                    percentages[worker][task] = 0;  // 기준작업수가 0일 경우 퍼센트는 0
                }
    
            });
        });
    
        // 로컬 스토리지에 퍼센트 값 저장
        localStorage.setItem('worklogPercentages', JSON.stringify(percentages));
    
        return percentages;
    }

    function calculateOverallAverage(averagePercentages) {
        let total = 0;
        let count = 0;
    
        // 각 작업자의 퍼센트 값들만 더함
        Object.values(averagePercentages).forEach(workerPercentages => {
            Object.values(workerPercentages).forEach(percentage => {
                // NaN 또는 잘못된 값이 아닌 경우에만 계산
                if (!isNaN(percentage) && percentage !== null && percentage !== undefined) {
                    total += percentage;
                    count++;
                }
            });
        });
    
        // count가 0 이상인 경우에만 평균을 계산
        return count > 0 ? (total / count).toFixed(2) : '0.00';
    }

    function findTopIncompleteTasks(taskCounts, limit = 5) {
        const incompleteTasks = [];
        taskCategories.forEach(category => {
            category.subcategories.forEach(taskItem => {
                let totalDeficit = 0;
                Object.keys(taskCounts).forEach(worker => {
                    const task = taskCounts[worker][taskItem.name];
                    if (task && task.count < task.기준작업수) {
                        totalDeficit += (task.기준작업수 - task.count);
                    }
                });
                if (totalDeficit > 0) {
                    incompleteTasks.push({ task: taskItem.name, deficit: totalDeficit });
                }
            });
        });
        incompleteTasks.sort((a, b) => b.deficit - a.deficit);
        return incompleteTasks.slice(0, limit).map(item => item.task).concat(incompleteTasks.length > limit ? '... 그 외' : []);
    }

    function findTopIncompletePercentages(taskCounts, limit = 5) {
        const percentageDeficits = [];
        taskCategories.forEach(category => {
            category.subcategories.forEach(taskItem => {
                let totalPercentageDeficit = 0;
                Object.keys(taskCounts).forEach(worker => {
                    const task = taskCounts[worker][taskItem.name];
                    if (task) {
                        const percentage = (task.count / task.기준작업수) * 100;
                        if (percentage < 100) {
                            totalPercentageDeficit += (100 - percentage);
                        }
                    }
                });
                if (totalPercentageDeficit > 0) {
                    percentageDeficits.push({ task: taskItem.name, deficit: totalPercentageDeficit });
                }
            });
        });
        percentageDeficits.sort((a, b) => b.deficit - a.deficit);
        return percentageDeficits.slice(0, limit).map(item => item.task).concat(percentageDeficits.length > limit ? '... 그 외' : []);
    }



    function displayTaskCounts(taskCounts, filterWorker = null) {
        const tableHead = document.getElementById('task-count-table-head');
        const tableBody = document.getElementById('task-count-table-body');
        tableHead.innerHTML = '';
        tableBody.innerHTML = '';
    
        const averagePercentages = calculateAveragePercentages(taskCounts);
        const workerAveragePercents = calculateWorkerAveragePercent(averagePercentages);  // 작업자별 평균 퍼센트 계산
    
        // 검색된 작업자가 있을 경우 해당 작업자만 정렬
        const sortedWorkers = filterWorker 
            ? [filterWorker]
            : Object.keys(averagePercentages)
                .filter(worker => !excludedWorkers.includes(worker))
                .sort((a, b) => workerAveragePercents[b] - workerAveragePercents[a]);  // 평균 퍼센트로 정렬
    
        // 작업자 이름을 테이블 헤더에 추가
        const headerRow = document.createElement('tr');
        headerRow.appendChild(document.createElement('th')).textContent = "";  // 이관항목 열 추가
        headerRow.appendChild(document.createElement('th')).textContent = "작업항목";  // 작업 항목 열 추가
        headerRow.appendChild(document.createElement('th')).textContent = "기준 작업 수";  // 기준 작업 수 열 추가
    
        sortedWorkers.forEach(worker => {
            const workerCell = document.createElement('th');
            workerCell.textContent = worker;
            headerRow.appendChild(workerCell);
        });
        tableHead.appendChild(headerRow);
    
        // 작업자별 평균 퍼센트 출력 (AVERAGE 행)
        const averageRow = document.createElement('tr');
        averageRow.appendChild(document.createElement('td')).textContent = 'AVERAGE';  // 이관항목 빈 열
        averageRow.appendChild(document.createElement('td')).textContent = '';  // 작업 항목 빈 열
        averageRow.appendChild(document.createElement('td')).textContent = '';  // 기준 작업 수 빈 열
    
        sortedWorkers.forEach(worker => {
            const averageCell = document.createElement('td');
            averageCell.textContent = `${workerAveragePercents[worker]}%`;  // 작업자별 평균 퍼센트 표시
    
            averageCell.style.fontWeight = 'bold';
            averageCell.style.backgroundColor = '#e0e0e0';
    
            if (workerAveragePercents[worker] == 100) {
                averageCell.classList.add('blue');
            } else if (workerAveragePercents[worker] == 0) {
                averageCell.classList.add('red');
            }
    
            averageRow.appendChild(averageCell);
        });
    
        tableBody.appendChild(averageRow);
    
        // 각 작업 항목에 대한 데이터를 세로로 나열
        taskCategories.forEach((category) => {
            category.subcategories.forEach((taskItem, taskIndex) => {
                const row = document.createElement('tr');
    
                if (taskIndex === 0) {
                    const categoryCell = document.createElement('td');
                    categoryCell.rowSpan = category.subcategories.length;
                    categoryCell.textContent = category.category;
                    categoryCell.style.fontWeight = 'bold';
                    row.appendChild(categoryCell);
                }
    
                const taskCell = document.createElement('td');
                taskCell.textContent = taskItem.name;
                row.appendChild(taskCell);
    
                const 기준작업수Cell = document.createElement('td');
                기준작업수Cell.textContent = taskItem.기준작업수;
                row.appendChild(기준작업수Cell);
    
                sortedWorkers.forEach(worker => {
                    if (taskCounts[worker] && taskCounts[worker][taskItem.name]) {
                        const countData = taskCounts[worker][taskItem.name];
                        const count = countData.count;
                        const 기준작업수 = countData.기준작업수;
                        let percentage = Math.min((count / 기준작업수) * 100, 100);
    
                        const countCell = document.createElement('td');
                        countCell.textContent = `${count} (${Math.round(percentage)}%)`;
                        countCell.setAttribute('data-worker', worker);
                        countCell.setAttribute('data-task', taskItem.name);
                        countCell.classList.add('clickable-cell');
                        row.appendChild(countCell);
    
                        if (percentage === 100) {
                            countCell.classList.add('blue');
                        } else if (percentage === 0) {
                            countCell.classList.add('red');
                        }
    
                        row.appendChild(countCell);
                    } else {
                        const emptyCell = document.createElement('td');
                        emptyCell.textContent = 'N/A';  // 작업이 없음을 표시
                        row.appendChild(emptyCell);
                    }
                });
    
                tableBody.appendChild(row);
            });
        });
    
        // 검색된 작업자 또는 전체에 대한 분석 데이터를 표시
    }
    

    document.getElementById('search-button').addEventListener('click', () => {
        const searchName = document.getElementById('search-name').value.trim();
        if (searchName) {
            displayTaskCounts(taskCounts, searchName);  // 특정 인원에 대해 데이터 표시
        }
    });

    document.getElementById('reset-button').addEventListener('click', () => {
        document.getElementById('search-name').value = '';
        displayTaskCounts(taskCounts);
    });

    function calculateWorkerAveragePercent(averagePercentages) {
        const workerAverages = {};
        
        Object.keys(averagePercentages).forEach(worker => {
            let totalPercentage = 0;
            let taskCount = 0;
    
            // 작업자별로 모든 작업 항목의 퍼센트를 합산
            Object.keys(averagePercentages[worker]).forEach(task => {
                const percentage = averagePercentages[worker][task];
    
                if (!isNaN(percentage)) {
                    totalPercentage += percentage;
                    taskCount++;
                }
            });
    
            // 작업자가 수행한 작업이 있는 경우 평균 계산
            workerAverages[worker] = taskCount > 0 ? (totalPercentage / taskCount).toFixed(2) : 0;
        });
    
        return workerAverages;
    }
    

    

    loadWorkLogs();
});

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

document.addEventListener('click', function (e) {
    if (e.target.classList.contains('clickable-cell')) {
        const worker = e.target.getAttribute('data-worker');
        const task = e.target.getAttribute('data-task');

        // (main) 제거
        const normalizedWorker = worker.replace(/\(main\)/g, '').trim();

        const matchedLogs = logs.filter(log =>
            log.transfer_item === task &&
            log.task_man &&
            log.task_man.split(/[\s,]+/)
                .map(w => w.replace(/\(main\)/g, '').trim())
                .includes(normalizedWorker)
        );

        const logList = document.getElementById('log-list');
        logList.innerHTML = '';
        if (matchedLogs.length === 0) {
            logList.innerHTML = '<li>관련 로그가 없습니다.</li>';
        } else {
matchedLogs.forEach(log => {
    const item = document.createElement('li');
    item.classList.add('log-item');

    const date = new Date(log.task_date).toISOString().split('T')[0];
    const eq = log.equipment_name || '장비명 없음';
    const desc = (log.task_description || '내용 없음').replace(/\n/g, '<br>');

    item.innerHTML = `
        <div class="log-date">📅 ${date}</div>
        <div class="log-eq">🔧 ${eq}</div>
        <div class="log-desc">${desc}</div>
    `;

    logList.appendChild(item);
});
        }

        document.getElementById('log-modal').classList.remove('hidden');
    }
});

document.getElementById('close-modal').addEventListener('click', () => {
    document.getElementById('log-modal').classList.add('hidden');
});
