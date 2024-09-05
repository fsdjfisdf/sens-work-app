document.addEventListener('DOMContentLoaded', async () => {
    let logs = [];
    let taskCounts = {};  // 전역으로 이동
    let dbTaskCounts = {};  // DB에서 가져온 작업자별 작업 건수를 저장할 객체

    // 작업 항목 리스트 정의 (세로로 나열될 항목들)
    const taskItems = [
        { name: "LP ESCORT", 기준작업수: 1 },
        { name: "Robot Escort", 기준작업수: 1 },
        { name: "EFEM ROBOT TEACHING", 기준작업수: 3 },
        { name: "EFEM ROBOT REP", 기준작업수: 3 },
        { name: "EFEM Robot Controller REP", 기준작업수: 3 },
        { name: "TM ROBOT TEACHING", 기준작업수: 3 },
        { name: "TM ROBOT REP", 기준작업수: 3 },
        { name: "TM ROBOT Controller REP", 기준작업수: 3 },
        { name: "Passive Pad REP", 기준작업수: 3 },
        { name: "Pin Cylinder", 기준작업수: 3 },
        { name: "Pusher Cylinder", 기준작업수: 3 },
        { name: "IB Flow", 기준작업수: 3 },
        { name: "DRT", 기준작업수: 3 },
        { name: "FFU Controller", 기준작업수: 1 },
        { name: "FAN", 기준작업수: 1 },
        { name: "Motor Driver", 기준작업수: 1 },
        { name: "R1", 기준작업수: 2 },
        { name: "R3", 기준작업수: 2 },
        { name: "R5", 기준작업수: 2 },
        { name: "R3 To R5", 기준작업수: 2 },
        { name: "Microwave", 기준작업수: 2 },
        { name: "Applicator", 기준작업수: 2 },
        { name: "Generator", 기준작업수: 2 },
        { name: "Chuck", 기준작업수: 2 },
        { name: "Process Kit", 기준작업수: 1 },
        { name: "Helium Detector", 기준작업수: 2 },
        { name: "Hook Lift Pin", 기준작업수: 2 },
        { name: "Bellows", 기준작업수: 2 },
        { name: "Pin Sensor", 기준작업수: 2 },
        { name: "LM Guide", 기준작업수: 2 },
        { name: "Pin Motor Controller", 기준작업수: 2 },
        { name: "SINGLE EPD", 기준작업수: 1 },
        { name: "DUAL EPD", 기준작업수: 1 },
        { name: "Gas Box Board", 기준작업수: 1 },
        { name: "Temp Controller Board", 기준작업수: 1 },
        { name: "Power Distribution Board", 기준작업수: 1 },
        { name: "DC Power Supply", 기준작업수: 1 },
        { name: "BM Sensor", 기준작업수: 1 },
        { name: "PIO Sensor", 기준작업수: 1 },
        { name: "Safety Module", 기준작업수: 1 },
        { name: "D-NET", 기준작업수: 1 },
        { name: "MFC", 기준작업수: 1 },
        { name: "Valve", 기준작업수: 1 },
        { name: "Solenoid", 기준작업수: 1 },
        { name: "Fast Vac Valve", 기준작업수: 1 },
        { name: "Slow Vac Valve", 기준작업수: 1 },
        { name: "Slit Door", 기준작업수: 1 },
        { name: "APC Valve", 기준작업수: 1 },
        { name: "Shutoff Valve", 기준작업수: 1 },
        { name: "Baratron Ass'y", 기준작업수: 1 },
        { name: "Pirani Ass'y", 기준작업수: 1 },
        { name: "View Port Quartz", 기준작업수: 1 },
        { name: "Flow Switch", 기준작업수: 1 },
        { name: "Ceramic Plate", 기준작업수: 1 },
        { name: "Monitor", 기준작업수: 1 },
        { name: "Keyboard", 기준작업수: 1 },
        { name: "Mouse", 기준작업수: 1 },
        { name: "CTC", 기준작업수: 2 },
        { name: "PMC", 기준작업수: 2 },
        { name: "EDA", 기준작업수: 2 },
        { name: "EFEM CONTROLLER", 기준작업수: 2 },
        { name: "S/W Patch", 기준작업수: 2 }
    ];

    const validEquipmentTypes = [
        "SUPRA N", "SUPRA NM", "SUPRA III", "SUPRA IV", "SUPRA V", 
        "SUPRA Vplus", "SUPRA VM"
    ];  // 사용 가능한 EQUIPMENT TYPE 리스트

    // 작업 로그 불러오기
    async function loadWorkLogs() {
        try {
            const response = await axios.get('http://3.37.165.84:3001/logs');
            logs = response.data.sort((a, b) => new Date(b.task_date) - new Date(a.task_date));
            await loadDbTaskCounts();  // 데이터베이스에서 작업 카운트를 불러옴
            calculateTaskCounts(logs);
        } catch (error) {
            console.error('작업 로그를 불러오는 중 오류 발생:', error);
        }
    }

    // DB에서 작업 카운트를 불러오는 함수
    async function loadDbTaskCounts() {
        try {
            const response = await axios.get('http://3.37.165.84:3001/api/task-count');
            dbTaskCounts = response.data.reduce((acc, row) => {
                Object.keys(row).forEach(worker => {
                    if (!acc[worker]) acc[worker] = {};
                    acc[worker][row['작업_항목']] = row[worker];
                });
                return acc;
            }, {});
        } catch (error) {
            console.error('DB 작업 카운트를 불러오는 중 오류 발생:', error);
        }
    }

    // 작업 카운트를 계산하는 함수
    function calculateTaskCounts(logs) {
        taskCounts = {};  // 전역에 있는 taskCounts 업데이트

        logs.forEach(log => {
            if (!validEquipmentTypes.includes(log.equipment_type)) return;

            let workers = log.task_man.split(/[\s,]+/).map(worker => worker.replace(/\(main\)|\(support\)/g, '').trim());
            workers.forEach(worker => {
                if (!worker || worker.trim() === '') return;

                if (!taskCounts[worker]) {
                    taskCounts[worker] = {};
                    taskItems.forEach(item => taskCounts[worker][item.name] = { count: 0, 기준작업수: item.기준작업수 });
                }

                const taskType = log.transfer_item;
                if (taskCounts[worker][taskType]) {
                    taskCounts[worker][taskType].count++;
                }

                // DB에서 가져온 작업 카운트를 추가로 더함
                if (dbTaskCounts[worker] && dbTaskCounts[worker][taskType]) {
                    taskCounts[worker][taskType].count += dbTaskCounts[worker][taskType];
                }
            });
        });

        // 작업 항목 간의 연결된 값 더하기
        addRelatedTaskCounts();

        Object.keys(taskCounts).forEach(worker => {
            const totalTaskCount = Object.values(taskCounts[worker]).reduce((acc, task) => acc + task.count, 0);
            if (totalTaskCount === 0) delete taskCounts[worker];
        });

        displayTaskCounts(taskCounts);
    }

    // 연결된 작업 항목의 값을 추가하는 함수
    function addRelatedTaskCounts() {
        Object.keys(taskCounts).forEach(worker => {
            // TM ROBOT REP의 값을 TM ROBOT TEACHING, TM ROBOT CONTROLLER REP에 더하기
            taskCounts[worker]["TM ROBOT TEACHING"].count += taskCounts[worker]["TM ROBOT REP"].count;
            taskCounts[worker]["TM ROBOT Controller REP"].count += taskCounts[worker]["TM ROBOT REP"].count;

            // Pin Cylinder의 값을 IB FLOW에 더하기
            taskCounts[worker]["IB Flow"].count += taskCounts[worker]["Pin Cylinder"].count;

            // EFEM ROBOT REP의 값을 EFEM ROBOT TEACHING, EFEM Robot Controller REP에 더하기
            taskCounts[worker]["EFEM ROBOT TEACHING"].count += taskCounts[worker]["EFEM ROBOT REP"].count;
            taskCounts[worker]["EFEM Robot Controller REP"].count += taskCounts[worker]["EFEM ROBOT REP"].count;

            // R3 To R5의 값을 R3, R5에 더하기
            taskCounts[worker]["R3"].count += taskCounts[worker]["R3 To R5"].count;
            taskCounts[worker]["R5"].count += taskCounts[worker]["R3 To R5"].count;
        });
    }

    // 작업자별 평균 퍼센트를 계산하는 함수
    function calculateAveragePercentages(taskCounts) {
        const averagePercentages = {};

        Object.keys(taskCounts).forEach(worker => {
            const totalTasks = Object.keys(taskCounts[worker]).length;
            let totalPercentage = 0;

            Object.values(taskCounts[worker]).forEach(task => {
                const percentage = Math.min((task.count / task.기준작업수) * 100, 100);
                totalPercentage += percentage;
            });

            averagePercentages[worker] = totalPercentage / totalTasks;
        });

        return averagePercentages;
    }

    // 작업 카운트를 테이블로 표시하는 함수
    function displayTaskCounts(taskCounts, filterWorker = null) {
        const tableHead = document.getElementById('task-count-table-head');
        const tableBody = document.getElementById('task-count-table-body');
        tableHead.innerHTML = '';
        tableBody.innerHTML = '';

        // 작업자 이름을 테이블 헤더에 추가
        const headerRow = document.createElement('tr');
        headerRow.appendChild(document.createElement('th'));  // 작업 항목 열
        headerRow.appendChild(document.createElement('th')).textContent = "기준 작업 수";  // 기준 작업 수 열

        Object.keys(taskCounts).forEach(worker => {
            if (filterWorker && worker !== filterWorker) return;

            const workerCell = document.createElement('th');
            workerCell.textContent = worker;
            headerRow.appendChild(workerCell);
        });
        tableHead.appendChild(headerRow);

        // 작업자별 평균 퍼센트 출력
        const averagePercentages = calculateAveragePercentages(taskCounts);
        const averageRow = document.createElement('tr');
        averageRow.appendChild(document.createElement('td')).textContent = 'AVERAGE';
        averageRow.appendChild(document.createElement('td'));  // 기준 작업 수 열은 비워둠

        Object.keys(averagePercentages).forEach(worker => {
            if (filterWorker && worker !== filterWorker) return;

            const averageCell = document.createElement('td');
            averageCell.textContent = `${Math.round(averagePercentages[worker])}%`;

            if (averagePercentages[worker] === 100) {
                averageCell.classList.add('blue');
            } else if (averagePercentages[worker] === 0) {
                averageCell.classList.add('red');
            }

            averageRow.appendChild(averageCell);
        });

        tableBody.appendChild(averageRow);

        // 각 작업 항목에 대한 데이터를 세로로 나열
        taskItems.forEach(taskItem => {
            const row = document.createElement('tr');

            const taskCell = document.createElement('td');
            taskCell.textContent = taskItem.name;
            row.appendChild(taskCell);

            const 기준작업수Cell = document.createElement('td');
            기준작업수Cell.textContent = taskItem.기준작업수;
            row.appendChild(기준작업수Cell);

            Object.keys(taskCounts).forEach(worker => {
                if (filterWorker && worker !== filterWorker) return;

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
            });

            tableBody.appendChild(row);
        });
    }

    // 이름 검색 기능
    document.getElementById('search-button').addEventListener('click', () => {
        const searchName = document.getElementById('search-name').value.trim();
        if (searchName) {
            displayTaskCounts(taskCounts, searchName);
        }
    });

    // 초기화 버튼 (모든 데이터를 다시 표시)
    document.getElementById('reset-button').addEventListener('click', () => {
        document.getElementById('search-name').value = '';
        displayTaskCounts(taskCounts);
    });

    loadWorkLogs();
});
