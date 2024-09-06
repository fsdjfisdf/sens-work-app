document.addEventListener('DOMContentLoaded', async () => {
        const token = localStorage.getItem('x-access-token');

    if (!token) {
        alert('로그인이 필요합니다.');
        window.location.replace('./signin.html');
        return;
    }
    

    let logs = [];
    let taskCounts = {};  // 전역으로 이동
    let dbTaskCounts = {};  // DB에서 가져온 작업자별 작업 건수를 저장할 객체
    const excludedWorkers = ["김지웅", "퇴사자 여기에 추가"];  // 제외할 작업자들의 이름

    // 대분류 및 중분류와 작업 항목 리스트 정의
    const taskCategories = [
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
                { name: "EFEM ROBOT TEACHING", 기준작업수: 5 },
                { name: "EFEM ROBOT REP", 기준작업수: 5 },
                { name: "EFEM ROBOT CONTROLLER REP", 기준작업수: 5 }
            ]
        },
        {
            category: "TM ROBOT",
            subcategories: [
                { name: "TM ROBOT TEACHING", 기준작업수: 5 },
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
                { name: "R3 TO R5", 기준작업수: 5 }
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
                { name: "MOUSE", 기준작업수: 1 }
            ]
        },
        {
            category: "Y24 신규",
            subcategories: [
                { name: "CTC", 기준작업수: 2 },
                { name: "PMC", 기준작업수: 2 },
                { name: "EDA", 기준작업수: 2 },
                { name: "EFEM CONTROLLER", 기준작업수: 2 },
                { name: "S/W PATCH", 기준작업수: 2 }
            ]
        }
    ];

    const validEquipmentTypes = [
        "SUPRA N", "SUPRA NM", "SUPRA III", "SUPRA IV", "SUPRA V", 
        "SUPRA Vplus", "SUPRA VM"
    ];

    async function loadWorkLogs() {
        try {
            const response = await axios.get('http://3.37.165.84:3001/logs');
            logs = response.data.sort((a, b) => new Date(b.task_date) - new Date(a.task_date));
            await loadDbTaskCounts();  
            calculateTaskCounts(logs);
        } catch (error) {
            console.error('작업 로그를 불러오는 중 오류 발생:', error);
        }
    }

    async function loadDbTaskCounts() {
        try {
            const response = await axios.get('http://3.37.165.84:3001/api/task-count');
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
        const response = await axios.post('http://3.37.165.84:3001/supra-maintenance/aggregated', aggregatedData, {
            headers: {
                'x-access-token': localStorage.getItem('x-access-token')
            }
        });
        console.log('Aggregated data saved successfully:', response.data);
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
            taskCounts[worker]["TM ROBOT TEACHING"].count += taskCounts[worker]["TM ROBOT REP"].count;
            taskCounts[worker]["TM ROBOT CONTROLLER REP"].count += taskCounts[worker]["TM ROBOT REP"].count;
            taskCounts[worker]["IB FLOW"].count += taskCounts[worker]["PIN CYLINDER"].count;
            taskCounts[worker]["EFEM ROBOT TEACHING"].count += taskCounts[worker]["EFEM ROBOT REP"].count;
            taskCounts[worker]["EFEM ROBOT CONTROLLER REP"].count += taskCounts[worker]["EFEM ROBOT REP"].count;
            taskCounts[worker]["R3"].count += taskCounts[worker]["R3 TO R5"].count;
            taskCounts[worker]["R5"].count += taskCounts[worker]["R3 TO R5"].count;
        });
    }

    function calculateAveragePercentages(taskCounts) {
        const percentages = {};
    
        Object.keys(taskCounts).forEach(worker => {
            if (!percentages[worker]) {
                percentages[worker] = {};
            }
    
            Object.keys(taskCounts[worker]).forEach(task => {
                const count = taskCounts[worker][task].count;
                const 기준작업수 = taskCounts[worker][task].기준작업수;
                const percentage = Math.min((count / 기준작업수) * 100, 100);
    
                percentages[worker][task] = percentage;
    
                // 각 작업자의 작업 항목별 퍼센트 값을 콘솔에 출력
                console.log(`작업자: ${worker}, 작업 항목: ${task}, 작업 수: ${count}, 기준 작업 수: ${기준작업수}, 퍼센트: ${percentage}%`);
            });
        });
    
        // 로컬 스토리지에 퍼센트 값 저장
        localStorage.setItem('worklogPercentages', JSON.stringify(percentages));
    
        return percentages;
    }

    function calculateOverallAverage(averagePercentages) {
        let total = 0;
        let count = 0;
        Object.values(averagePercentages).forEach(percentage => {
            total += percentage;
            count++;
        });
        return (total / count).toFixed(2);
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

    function displayAnalysis(taskCounts, sortedWorkers) {
        const analysisDiv = document.getElementById('analysis-results');
        analysisDiv.innerHTML = '';  // 기존 내용을 초기화
    
        const filteredTaskCounts = {};
        sortedWorkers.forEach(worker => {
            filteredTaskCounts[worker] = taskCounts[worker];
        });
    
        const averagePercentages = calculateAveragePercentages(filteredTaskCounts);
        const overallAverage = calculateOverallAverage(averagePercentages);
        const topIncompleteTasks = findTopIncompleteTasks(filteredTaskCounts);
        const topIncompletePercentages = findTopIncompletePercentages(filteredTaskCounts);
    
        analysisDiv.innerHTML = `
            <h3>ENG'r AVERAGE CAPA: ${overallAverage}%</h3>
            <h3>작업 수가 부족한 작업:</h3>
            <ul>${topIncompleteTasks.map(task => `<li>${task}</li>`).join('')}</ul>
            <h3>CAPA가 부족한 항목:</h3>
            <ul>${topIncompletePercentages.map(task => `<li>${task}</li>`).join('')}</ul>
        `;
    }

    function displayTaskCounts(taskCounts, filterWorker = null) {
        const tableHead = document.getElementById('task-count-table-head');
        const tableBody = document.getElementById('task-count-table-body');
        tableHead.innerHTML = '';
        tableBody.innerHTML = '';
    
        const averagePercentages = calculateAveragePercentages(taskCounts);
    
        // 검색된 작업자가 있을 경우 해당 작업자만 정렬
        const sortedWorkers = filterWorker 
            ? [filterWorker]
            : Object.keys(averagePercentages)
                .filter(worker => !excludedWorkers.includes(worker))
                .sort((a, b) => averagePercentages[b] - averagePercentages[a]);
    
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
    
        // 작업자별 평균 퍼센트 출력
        const averageRow = document.createElement('tr');
        averageRow.appendChild(document.createElement('td')).textContent = 'AVERAGE';  // 이관항목 빈 열
        averageRow.appendChild(document.createElement('td')).textContent = '';  // 작업 항목 빈 열
        averageRow.appendChild(document.createElement('td')).textContent = '';  // 기준 작업 수 빈 열
    
        sortedWorkers.forEach(worker => {
            const averageCell = document.createElement('td');
            averageCell.textContent = `${Math.round(averagePercentages[worker])}%`;
    
            averageCell.style.fontWeight = 'bold';
            averageCell.style.backgroundColor = '#e0e0e0';
    
            if (averagePercentages[worker] === 100) {
                averageCell.classList.add('blue');
            } else if (averagePercentages[worker] === 0) {
                averageCell.classList.add('red');
            }
    
            averageRow.appendChild(averageCell);
        });
    
        tableBody.appendChild(averageRow);
    
        // 각 작업 항목에 대한 데이터를 세로로 나열
        taskCategories.forEach((category) => {
            // 대분류 표시
            category.subcategories.forEach((taskItem, taskIndex) => {
                const row = document.createElement('tr');
    
                if (taskIndex === 0) {
                    // 이관항목(중분류)을 출력하고 병합
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
                    // 수정된 부분: taskCounts와 해당 작업 항목이 정의되어 있는지 확인
                    if (taskCounts[worker] && taskCounts[worker][taskItem.name]) {
                        const countData = taskCounts[worker][taskItem.name];
                        const count = countData.count;
                        const 기준작업수 = countData.기준작업수;
                        let percentage = Math.min((count / 기준작업수) * 100, 100);
    
                        const countCell = document.createElement('td');
                        countCell.textContent = `${count} (${Math.round(percentage)}%)`;
    
                        if (percentage === 100) {
                            countCell.classList.add('blue');
                        } else if (percentage === 0) {
                            countCell.classList.add('red');
                        }
    
                        row.appendChild(countCell);
                    } else {
                        // 작업 항목이 없을 경우 빈 셀을 추가
                        const emptyCell = document.createElement('td');
                        emptyCell.textContent = 'N/A';  // 작업이 없음을 표시
                        row.appendChild(emptyCell);
                    }
                });
    
                tableBody.appendChild(row);
            });
        });
    
        // 검색된 작업자 또는 전체에 대한 분석 데이터를 표시
        displayAnalysis(taskCounts, sortedWorkers);
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

    

    loadWorkLogs();
});