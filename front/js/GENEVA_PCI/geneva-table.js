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


const excludedWorkers = ["김지웅", "퇴사자 여기에 추가"];  // 제외할 작업자들의 이름


// 대분류 및 중분류와 작업 항목 리스트 정의
window.taskCategories = [
  {
    category: "Escort",
    subcategories: [
      { name: "LP Escort", 기준작업수: 1 },
      { name: "Robot Escort", 기준작업수: 1 }
    ]
  },
  {
    category: "EFEM Robot",
    subcategories: [
      { name: "SR8240 Teaching", 기준작업수: 3 },
      { name: "GENMARK robot teaching", 기준작업수: 3 },
      { name: "SR8240 Robot REP", 기준작업수: 3 },
      { name: "GENMARK Robot REP", 기준작업수: 3 },
      { name: "Robot Controller REP", 기준작업수: 3 }
    ]
  },
  {
    category: "FFU",
    subcategories: [
      { name: "FFU Controller", 기준작업수: 3 },
      { name: "Fan", 기준작업수: 3 },
      { name: "Motor Driver", 기준작업수: 3 }
    ]
  },
  {
    category: "Heater",
    subcategories: [
      { name: "Elbow heater", 기준작업수: 3 },
      { name: "Insulation heater", 기준작업수: 3 },
      { name: "Chuck heater", 기준작업수: 3 }
    ]
  },
  {
    category: "Disc",
    subcategories: [
      { name: "Harmonic driver", 기준작업수: 3 },
      { name: "Amplifier (Disc controller)", 기준작업수: 3 },
      { name: "Disc bearing", 기준작업수: 3 }
    ]
  },
  {
    category: "PM 후",
    subcategories: [
      { name: "Chuck leveling", 기준작업수: 3 },
      { name: "Wafer support pin alignment", 기준작업수: 3 },
      { name: "Temp profile", 기준작업수: 3 },
      { name: "O2 leak test", 기준작업수: 3 },
      { name: "Chuck up & down status", 기준작업수: 3 }
    ]
  },
  {
    category: "Sealing",
    subcategories: [
      { name: "Ring seal", 기준작업수: 3 },
      { name: "Door seal", 기준작업수: 3 }
    ]
  },
  {
    category: "LL O-ring",
    subcategories: [
      { name: "Ring seal O-ring", 기준작업수: 3 },
      { name: "Door seal O-ring", 기준작업수: 3 }
    ]
  },
  {
    category: "Board",
    subcategories: [
      { name: "Gas Box Board", 기준작업수: 1 },
      { name: "Temp Controller Board", 기준작업수: 1 },
      { name: "Power Distribution Board", 기준작업수: 1 },
      { name: "DC Power Supply", 기준작업수: 1 },
      { name: "Facility Board", 기준작업수: 1 },
      { name: "Station Board", 기준작업수: 1 },
      { name: "Bubbler Board", 기준작업수: 1 },
      { name: "D-NET", 기준작업수: 1 }
    ]
  },
  {
    category: "Gas box",
    subcategories: [
      { name: "MFC", 기준작업수: 3 },
      { name: "Valve", 기준작업수: 3 }
    ]
  },
  {
    category: "O2 analyzer",
    subcategories: [
      { name: "O2 analyzer 교체", 기준작업수: 3 },
      { name: "O2 controller 교체", 기준작업수: 3 },
      { name: "O2 pump 교체", 기준작업수: 3 },
      { name: "O2 cell 교체", 기준작업수: 3 }
    ]
  },
  {
    category: "Valve",
    subcategories: [
      { name: "O2 Sample valve", 기준작업수: 3 },
      { name: "Feed & Delivery valve", 기준작업수: 3 },
      { name: "Fill & Vent valve", 기준작업수: 3 },
      { name: "Drain valve", 기준작업수: 3 },
      { name: "APC valve", 기준작업수: 3 },
      { name: "Bypass valve", 기준작업수: 3 },
      { name: "Shutoff valve", 기준작업수: 3 },
      { name: "Vac sol valve", 기준작업수: 3 },
      { name: "Vac CDA valve", 기준작업수: 3 }
    ]
  },
  {
    category: "Bubbler",
    subcategories: [
      { name: "Bubbler level sensor", 기준작업수: 1 },
      { name: "Bubbler flexible hose", 기준작업수: 1 }
    ]
  },
  {
    category: "ETC",
    subcategories: [
      { name: "Baratron Ass'y", 기준작업수: 1 },
      { name: "View Port", 기준작업수: 1 },
      { name: "Flow Switch", 기준작업수: 3 },
      { name: "LL Door cylinder", 기준작업수: 3 },
      { name: "Chuck cylinder", 기준작업수: 3 },
      { name: "Monitor", 기준작업수: 1 },
      { name: "Keyboard", 기준작업수: 1 },
      { name: "Mouse", 기준작업수: 1 },
      { name: "Water Leak Detector", 기준작업수: 3 },
      { name: "Formic Detector", 기준작업수: 3 },
      { name: "Exhaust gauge", 기준작업수: 3 }
    ]
  },
  {
    category: "CTR",
    subcategories: [
      { name: "CTC", 기준작업수: 3 },
      { name: "EDA", 기준작업수: 1 },
      { name: "Temp Limit Controller", 기준작업수: 3 },
      { name: "Temp Controller", 기준작업수: 3 }
    ]
  },
  {
    category: "S/W",
    subcategories: [
      { name: "S/W Patch", 기준작업수: 3 }
    ]
  }
];



const validEquipmentTypes = [
    "GENEVA"
];

async function loadWorkLogs() {
    try {
        const response = await axios.get('http://3.37.73.151:3001/logs');
        logs = response.data.sort((a, b) => new Date(b.task_date) - new Date(a.task_date));
        await loadDbTaskCounts();
        calculateTaskCounts(logs);  // 로그가 로드된 후에 호출
        saveAggregatedDataToServer(taskCounts);  // 작업 완료 후 데이터 전송
    } catch (error) {
        console.error('작업 로그를 불러오는 중 오류 발생:', error);
    }
}


async function loadDbTaskCounts() {
    try {
        const response = await axios.get('http://3.37.73.151:3001/api/geneva-task-count');
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
        
        // DB에서 가져온 작업 카운트를 확인하기 위한 콘솔 로그
        console.log('DB 작업 카운트 데이터:', dbTaskCounts);
        
    } catch (error) {
        console.error('DB 작업 카운트를 불러오는 중 오류 발생:', error);
    }
}



// 모든 데이터 계산 후 서버로 전송하는 함수 추가
async function saveAggregatedDataToServer(aggregatedData) {
try {
    const response = await axios.post('http://3.37.73.151:3001/api/geneva-maintenance/aggregated', aggregatedData, {

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

    // 작업 로그 데이터를 먼저 처리
    logs.forEach(log => {
        if (!validEquipmentTypes.includes(log.equipment_type)) return;
    
        // (main)을 제거하고 (support)는 제외
        let workers = log.task_man.split(/[\s,]+/).map(worker => worker.replace(/\(main\)/g, '').trim());
    
        workers.forEach(worker => {
            // (support) 작업자는 카운트하지 않음
            if (!worker || excludedWorkers.includes(worker) || log.task_man.includes('(support)')) return;
    
            // worker가 처음 등장할 때 taskCounts에 해당 worker의 항목을 초기화
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
    

    // DB에서 가져온 데이터 합산 처리
    Object.keys(dbTaskCounts).forEach(worker => {
        if (!taskCounts[worker]) {
            // 만약 로그에서 찾지 못한 작업자라면 새로운 작업자 항목을 초기화
            taskCounts[worker] = {};
            taskCategories.forEach(category => {
                category.subcategories.forEach(item => {
                    taskCounts[worker][item.name] = { count: 0, 기준작업수: item.기준작업수 };
                });
            });
        }

        // DB에서 작업 항목 처리
        Object.keys(dbTaskCounts[worker]).forEach(taskType => {
            if (!taskCounts[worker][taskType]) {
                const taskCategory = taskCategories.find(category => category.subcategories.some(item => item.name === taskType));
                const 기준작업수 = taskCategory?.subcategories.find(item => item.name === taskType)?.기준작업수 || 1;
                taskCounts[worker][taskType] = { count: 0, 기준작업수: 기준작업수 };
            }

            // DB에서 가져온 작업 수를 로그와 합산
            taskCounts[worker][taskType].count += dbTaskCounts[worker][taskType];
        });
    });

    addRelatedTaskCounts();
    displayTaskCounts(taskCounts);
}






function addRelatedTaskCounts() {
    Object.keys(taskCounts).forEach(worker => {
        if (taskCounts[worker]["TM ROBOT TEACHING"] && taskCounts[worker]["TM ROBOT REP"]) {
            taskCounts[worker]["TM ROBOT TEACHING"].count += taskCounts[worker]["TM ROBOT REP"].count || 0;
        }
        if (taskCounts[worker]["EFEM ROBOT CONTROLLER REP"] && taskCounts[worker]["EFEM ROBOT REP"]) {
            taskCounts[worker]["EFEM ROBOT CONTROLLER REP"].count += taskCounts[worker]["EFEM ROBOT REP"].count || 0;
        }
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
    const workerAveragePercents = calculateWorkerAveragePercent(averagePercentages);

    console.log('최종 taskCounts:', taskCounts);  // 최종 출력 전 로그 확인

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
    // 1. 셀 클릭 시 로그 표시
    if (e.target.classList.contains('clickable-cell')) {
        const worker = e.target.getAttribute('data-worker');
        const task = e.target.getAttribute('data-task');
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
            matchedLogs.forEach((log, index) => {
                const item = document.createElement('li');
                item.classList.add('log-item');

                const date = new Date(log.task_date).toISOString().split('T')[0];
                const taskName = log.task_name || '-';
                const taskMan = log.task_man || '-';
                const equipmentName = log.equipment_name || '-';
                const taskDuration = log.task_duration || '-';
                const taskDesc = (log.task_description || '설명 없음').replace(/\n/g, '<br>');

                item.innerHTML = `
                    <div class="log-summary">
                        <strong>📅 ${date}</strong> | 🧾 ${taskName} | 👷‍♂️ ${taskMan} | 🛠 ${equipmentName} | ⏱ ${taskDuration}
                        <button class="toggle-desc-btn" data-index="${index}">자세히 보기</button>
                    </div>
                    <div class="log-desc hidden" id="desc-${index}">
                        ${taskDesc}
                    </div>
                `;

                logList.appendChild(item);
            });
        }

        document.getElementById('log-modal').classList.remove('hidden');
    }

    // 2. 자세히 보기 / 접기 버튼 클릭 처리
    if (e.target.classList.contains('toggle-desc-btn')) {
        const index = e.target.getAttribute('data-index');
        const descBox = document.getElementById(`desc-${index}`);
        if (descBox.classList.contains('hidden')) {
            descBox.classList.remove('hidden');
            e.target.textContent = '접기';
        } else {
            descBox.classList.add('hidden');
            e.target.textContent = '자세히 보기';
        }
    }
});

document.getElementById('close-modal').addEventListener('click', () => {
    document.getElementById('log-modal').classList.add('hidden');
});