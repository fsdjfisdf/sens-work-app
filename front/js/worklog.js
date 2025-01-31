document.addEventListener('DOMContentLoaded', async () => {

    document.getElementById('worklogForm').addEventListener('keydown', (event) => {
        const activeElement = document.activeElement;

        // 현재 입력 중인 요소가 textarea가 아닌 경우에만 Enter 키를 방지
        if (event.key === 'Enter' && activeElement.tagName.toLowerCase() !== 'textarea') {
            event.preventDefault();
        }
    });

    function checkLogin() {
        const token = localStorage.getItem('x-access-token');
        if (!token) {
            alert("로그인이 필요합니다.");
            window.location.replace("./signin.html");
            return false;
        }
        return true;
    }

    function getTodayDate() {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    document.getElementById('task_date').value = getTodayDate();

    // Work Type 변경 이벤트 처리
    document.getElementById('workType').addEventListener('change', function() {
        const workTypeValue = this.value;
        const additionalOptions = document.getElementById('additionalOptions');
        const maintOptions = document.getElementById('maintOptions');
        const transferOptions = document.getElementById('transferOptions');
        const transferOptions2 = document.getElementById('transferOptions2');
        if (workTypeValue === 'SET UP' || workTypeValue === 'RELOCATION') {
            additionalOptions.style.display = 'block';
            maintOptions.style.display = 'none';
            transferOptions.style.display = 'none';
            transferOptions2.style.display = 'none';
        } else if (workTypeValue === 'MAINT') {
            transferOptions.style.display = 'block';
            transferOptions2.style.display = 'block';
            additionalOptions.style.display = 'none';
        } else {
            additionalOptions.style.display = 'none';
            maintOptions.style.display = 'none';
            transferOptions.style.display = 'none';
            transferOptions2.style.display = 'none';
        }
    });

    // 미리보기 이벤트 처리
    document.getElementById('preview-save').addEventListener('click', () => {
        const task_date = document.getElementById('task_date').value;
        const start_time = document.getElementById('start_time').value;
        const end_time = document.getElementById('end_time').value;
        const task_name = document.getElementById('task_name').value;
        const equipment_name = document.getElementById('equipment_name').value;
        const setupItem = document.getElementById('additionalWorkType').value;
        const transferItem = document.getElementById('transferOptionSelect').value;

        const taskMans = Array.from(document.querySelectorAll('.task-man-container')).map(container => {
            const input = container.querySelector('.task-man-input').value;
            const role = container.querySelector('.task-man-select').value;
            return `${input} (${role})`;
        });

        const uniqueTaskMans = [...new Set(taskMans)].join(', ');

        document.getElementById('preview-task_date').innerText = task_date;
        document.getElementById('preview-start_time').innerText = start_time;
        document.getElementById('preview-end_time').innerText = end_time;
        document.getElementById('preview-task_name').innerText = task_name;
        document.getElementById('preview-equipment_name').innerText = equipment_name;
        document.getElementById('preview-setupItem').innerText = setupItem;
        document.getElementById('preview-transferItem').innerText = transferItem;
        document.getElementById('preview-task_man').innerText = uniqueTaskMans;

        document.getElementById('modal-overlay').classList.add('visible');
        document.getElementById('preview-modal').classList.add('visible');
    });

    document.getElementById('confirm-save').addEventListener('click', () => {
        document.getElementById('modal-overlay').classList.remove('visible');
        document.getElementById('preview-modal').classList.remove('visible');
        document.getElementById('save-button').click();
    });

    document.getElementById('cancel-save').addEventListener('click', () => {
        document.getElementById('modal-overlay').classList.remove('visible');
        document.getElementById('preview-modal').classList.remove('visible');
    });

        // 모달 관련 요소 가져오기
    const equipmentAddModal = document.getElementById('equipment-add-modal');
    const equipmentAddMessage = document.getElementById('equipment-add-message');
    const confirmEquipmentAdd = document.getElementById('confirm-equipment-add');
    const cancelEquipmentAdd = document.getElementById('cancel-equipment-add');

    // 모달 열기 함수
    function openEquipmentAddModal(eqName, group, site, line, eqType) {
        document.getElementById('new_eqname').value = eqName;
        document.getElementById('new_group').value = group !== "SELECT" ? group : "";
        document.getElementById('new_site').value = site !== "SELECT" ? site : "";
        document.getElementById('new_line').value = line !== "SELECT" ? line : "";
        document.getElementById('new_type').value = eqType !== "SELECT" ? eqType : "";
    
        equipmentAddMessage.innerText = `${eqName}이(가) SETUP_EQUIPMENT 테이블에 존재하지 않습니다. 추가하시겠습니까?`;
        equipmentAddModal.style.display = 'block';
    }
    
    // "추가" 버튼 클릭 시 설비 추가 요청
    confirmEquipmentAdd.addEventListener('click', async () => {
        const eqName = document.getElementById('new_eqname').value.trim();
        const group = document.getElementById('new_group').value.trim();
        const site = document.getElementById('new_site').value.trim();
        const line = document.getElementById('new_line').value.trim();
        const eqType = document.getElementById('new_type').value.trim();
    
        // 필수 입력값 체크
        if (!eqName || !group || !site || !line || !eqType) {
            alert('모든 필드를 입력해주세요.');
            return;
        }
    
        try {
            const addResponse = await axios.post(`http://3.37.73.151:3001/api/setup_equipment`, {
                EQNAME: eqName,
                GROUP: group,
                SITE: site,
                LINE: line,
                TYPE: eqType
            });
    
            if (addResponse.status === 201) {
                alert('설비가 SETUP_EQUIPMENT 테이블에 추가되었습니다.');
                equipmentAddModal.style.display = 'none';
            } else {
                alert('설비 추가 중 오류가 발생했습니다.');
            }
        } catch (error) {
            console.error('설비 추가 중 오류 발생:', error);
        }
    });

    // 모달 닫기 함수
    function closeEquipmentAddModal() {
        equipmentAddModal.style.display = 'none';
    }

    // "취소" 버튼 클릭 시 모달 닫기
    cancelEquipmentAdd.addEventListener('click', closeEquipmentAddModal);


    const form = document.getElementById('worklogForm');
    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const task_name = document.getElementById('task_name').value;
        const status = document.getElementById('status').value;

        const taskResults = Array.from(document.getElementsByClassName('task-result-input')).map(input => input.value).join('<br>');
        const taskCauses = Array.from(document.getElementsByClassName('task-cause-input')).map(input => input.value).join('<br>');
        let taskMans = Array.from(document.querySelectorAll('.task-man-container')).map((container, index) => {
            const input = container.querySelector('.task-man-input').value;
            const role = container.querySelector('.task-man-select').value;
            return `${input}(${role})`;
        });
        taskMans = [...new Set(taskMans)].join(', ');

        console.log('TaskMans:', taskMans);

        const taskDescriptions = Array.from(document.getElementsByClassName('task-description-input')).map(input => input.value).join('<br>');

        let task_date = document.getElementById('task_date').value;
        let start_time = document.getElementById('start_time').value;
        let end_time = document.getElementById('end_time').value;
        const noneTime = document.getElementById('noneTime').value;
        const moveTime = document.getElementById('moveTime').value;

        if (!task_date) {
            task_date = getTodayDate();
        }
        if (!start_time) {
            start_time = '00:00:00';
        } else {
            start_time = `${start_time}:00`;
        }
        if (!end_time) {
            end_time = '00:00:00';
        } else {
            end_time = `${end_time}:00`;
        }

        const group = document.getElementById('group').value;
        const site = document.getElementById('site').value;
        const line = document.getElementById('line').value;
        const SOP = document.getElementById('SOP').value;
        const tsguide = document.getElementById('tsguide').value;
        const warranty = document.getElementById('warranty').value;
        const equipment_type = document.getElementById('equipment_type').value;
        const equipment_name = document.getElementById('equipment_name').value;
        const workType = document.getElementById('workType').value;
            // 1️⃣ SETUP 작업일 경우에만 실행
            if (workType === 'SET UP') {
                try {
                    const encodedEqName = encodeURIComponent(equipment_name);
                    const checkResponse = await axios.get(`http://3.37.73.151:3001/api/setup_equipment?eqname=${encodedEqName}`);
            
                    console.log("설비 확인 응답:", checkResponse.data);
            
                    if (!checkResponse.data.exists) {  
                        openEquipmentAddModal(
                            equipment_name,
                            document.getElementById('group').value,
                            document.getElementById('site').value,
                            document.getElementById('line').value,
                            document.getElementById('equipment_type').value
                        );
                    }
                } catch (error) {
                    if (error.response && error.response.status === 404) {
                        console.warn("설비가 존재하지 않음, 추가 가능");
                        openEquipmentAddModal(
                            equipment_name,
                            document.getElementById('group').value,
                            document.getElementById('site').value,
                            document.getElementById('line').value,
                            document.getElementById('equipment_type').value
                        );
                    } else {
                        console.error('설비 확인 및 추가 중 오류 발생:', error);
                    }
                }
            }
        const workType2 = document.getElementById('workType2').value;
        const setupItem = (workType === 'SET UP' || workType === 'RELOCATION') ? document.getElementById('additionalWorkType').value : 'SELECT';
        const maintItem = (workType === 'MAINT') ? document.getElementById('maintOptionSelect').value : 'SELECT';
        const transferItem = (workType === 'MAINT') ? document.getElementById('transferOptionSelect').value : 'SELECT';
        const task_maint = maintItem;

        try {
            const response = await axios.post(`http://3.37.73.151:3001/log`, {
                task_name,
                task_result: taskResults,
                task_cause: taskCauses,
                task_man: taskMans,
                task_description: taskDescriptions,
                task_date,
                start_time,
                end_time,
                none_time: noneTime,
                move_time: moveTime,
                group,
                site,
                SOP,
                tsguide,
                warranty,
                line,
                equipment_type,
                equipment_name,
                workType,
                workType2,
                setupItem,
                maintItem,
                transferItem,
                task_maint,
                status
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.status === 201) {
                alert('작업 이력 추가 성공');
                loadWorkLogs();
            
                const engineers = taskMans.split(',').map(engineer => engineer.trim().split('(')[0]);
                for (const engineer of engineers) {
                    try {
                        console.log(`Updating count for: ${engineer}, Task: ${transferItem}`);

                        const response = await axios.post('http://3.37.73.151:3001/api/update-task-count', {
                            task_man: engineer.trim(),
                            transfer_item: transferItem
                        });

                        console.log('카운트 업데이트 응답:', response.data);

                    } catch (error) {
                        console.error(`작업 카운트 업데이트 실패 (${engineer} - ${transferItem}):`, error);
                    }
                }
            }
        } catch (error) {
            console.error('작업 이력 추가 실패:', error);
        }
    });

    if (checkLogin()) {
        await loadEngineers();
        await loadWorkLogs();
        renderCalendar(logs, engineers, currentYear, currentMonth);
    }

    // "추가" 버튼 클릭 시 설비 추가 요청
confirmEquipmentAdd.addEventListener('click', async () => {
    const eqName = document.getElementById('new_eqname').value;
    const group = document.getElementById('new_group').value;
    const site = document.getElementById('new_site').value;
    const line = document.getElementById('new_line').value;
    const eqType = document.getElementById('new_type').value;

    try {
        const addResponse = await axios.post(`http://3.37.73.151:3001/api/setup_equipment`, {
            EQNAME: eqName,
            GROUP: group,
            SITE: site,
            LINE: line,
            TYPE: eqType
        });

        if (addResponse.status === 201) {
            alert('설비가 SETUP_EQUIPMENT 테이블에 추가되었습니다.');
        } else {
            alert('설비 추가 중 오류가 발생했습니다.');
        }
    } catch (error) {
        console.error('설비 추가 중 오류 발생:', error);
    } finally {
        closeEquipmentAddModal();
    }
});

    const signOutButton = document.querySelector("#sign-out");

    if (signOutButton) {
        signOutButton.addEventListener("click", function() {
            localStorage.removeItem("x-access-token");
            alert("로그아웃 되었습니다.");
            window.location.replace("./signin.html");
        });
    }

    const menuBtn = document.querySelector('.menu-btn');
    const menuContent = document.querySelector('.menu-content');

    menuBtn.addEventListener('click', function() {
        menuContent.classList.toggle('show');
    });

    document.addEventListener('click', function(event) {
        if (!menuBtn.contains(event.target) && !menuContent.contains(event.target)) {
            menuContent.classList.remove('show');
        }
    });

    function animateMenuItems() {
        const menuItems = document.querySelectorAll('.menu-item');
        menuItems.forEach((item, index) => {
            item.style.transform = `translateX(${index % 2 === 0 ? '-' : ''}100px)`;
            item.style.opacity = '0';
            setTimeout(() => {
                item.style.transform = 'translateX(0)';
                item.style.opacity = '1';
            }, index * 100);
        });
    }
});
