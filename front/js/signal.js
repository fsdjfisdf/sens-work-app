// 전역 변수 정의
let selectedEqName; // 설비 이름을 저장할 변수
let token; 
let equipmentData = []; 
let workLogData = []; 


document.addEventListener('DOMContentLoaded', async () => {
    const signalContainer = document.getElementById('signal-container');
    const equipmentDetails = document.getElementById('equipment-details');
    selectedEqName = document.getElementById('selected-eq-name');
    const eqInfo = document.getElementById('eq-info');
    const workLogBody = document.getElementById('work-log-body');
    const backToListButton = document.getElementById('back-to-list');
    const selectedPoint = document.getElementById('selected-point');

    const applyFilterButton = document.getElementById('apply-filter');
    const resetFilterButton = document.getElementById('reset-filter');
    const filterEqName = document.getElementById('filter-eq-name');
    const filterGroup = document.getElementById('filter-group');
    const filterSite = document.getElementById('filter-site');
    const filterLine = document.getElementById('filter-line');
    const filterEqType = document.getElementById('filter-eq-type');
    const filterWarranty = document.getElementById('filter-warranty');


    const token = localStorage.getItem('x-access-token');
    if (!token || token.trim() === '') {
        alert('로그인이 필요합니다.');
        window.location.replace('./signin.html');
        return;
    }
    console.log('Token:', token); // 디버깅용

        // SITE와 LINE 데이터 정의
        const siteLineOrder = {
            "PT": ["P1F", "P1D", "P2F", "P2D", "P2-S5", "P3F", "P3D", "P3-S5", "P4F", "P4D", "P4-S5"],
            "HS": ["12L", "13L", "15L", "16L", "17L", "S1", "S3", "S4", "S3V", "NRD", "NRD-V", "U4", "M1", "5L"],
            "IC": ["M10", "M14", "M16", "R3"],
            "CJ": ["M11", "M12", "M15"],
            "PSKH": ["PSKH", "C1", "C2", "C3", "C5"]
        };
    
        // LINE 선택 항목 업데이트
        function updateLineOptions() {
            const selectedSite = filterSite.value; // 선택된 SITE 값
            const lines = siteLineOrder[selectedSite] || []; // 선택된 SITE에 해당하는 LINE 목록
    
            // LINE 선택 항목 초기화
            filterLine.innerHTML = '<option value="">LINE</option>';
    
            // 새로운 LINE 옵션 추가
            lines.forEach(line => {
                const option = document.createElement('option');
                option.value = line;
                option.textContent = line;
                filterLine.appendChild(option);
            });
        }
    
        // SITE 변경 시 LINE 목록 업데이트
        filterSite.addEventListener('change', updateLineOptions);

        
        async function loadData() {
            try {
                console.log("Loading equipment data...");
                const equipmentResponse = await axios.get('http://3.37.73.151:3001/api/equipment', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                console.log("Equipment Data:", equipmentResponse.data);
        
                const workLogResponse = await axios.get('http://3.37.73.151:3001/logs', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                console.log("WorkLog Data:", workLogResponse.data);
        
                equipmentData = equipmentResponse.data;
                workLogData = workLogResponse.data;
        
                displayEquipmentSignals(equipmentData);
            } catch (error) {
                console.error("Error loading data:", error.message);
                alert('장비 데이터를 불러오는 데 실패했습니다.');
            }
        }
        
        

    function getEquipmentColor(logCount) {
        if (logCount >= 10) {
            return 'darkred'; // 심각 상태
        } else if (logCount >= 5) {
            return 'red'; // 주의 상태
        } else if (logCount >= 3) {
            return 'yellow'; // 경고 상태
        } else if (logCount > 0) {
            return 'green'; // 양호 상태
        } else {
            return 'gray'; // 작업 이력 없음
        }
    }
    

    function displayEquipmentSignals(data) {
        console.log("Data to Display:", data); // 데이터를 확인
        if (!data || data.length === 0) {
            console.log("Filtered data is empty.");
            document.getElementById('signal-container').innerHTML = '<p>No equipment matches the filter criteria.</p>';
            return;
        }
    
        const stats = calculateColorStats(data); // 색상별 통계 계산
        displayColorStats(stats); // 통계 및 색상 의미 표시
    
        const selectedPeriod = parseInt(document.getElementById('filter-period').value, 10); // 선택된 기간(일)
        signalContainer.innerHTML = ''; // 기존 신호등 초기화
        equipmentDetails.classList.add('hidden');
        signalContainer.classList.remove('hidden');
    
        data.forEach(eq => {
            // 작업 이력 필터링
            const recentLogs = workLogData.filter(log =>
                log.equipment_name.trim().toLowerCase() === eq.EQNAME.trim().toLowerCase() &&
                new Date(log.task_date) >= new Date(Date.now() - selectedPeriod * 24 * 60 * 60 * 1000)
            );
    
            const logCount = recentLogs.length;
            const color = getEquipmentColor(logCount);
    
            // 장비 카드 생성
            const equipmentCard = document.createElement('div');
            equipmentCard.className = 'equipment-card';
            equipmentCard.innerHTML = `
                <div class="equipment-point" style="background-color: ${color};"></div>
                <div class="equipment-label">${eq.EQNAME}</div>
            `;
    
            // 툴팁 생성
            equipmentCard.addEventListener('mouseenter', (e) => showTooltip(e, eq, logCount));
            equipmentCard.addEventListener('mouseleave', hideTooltip);
    
            equipmentCard.addEventListener('click', () => displayEquipmentDetails(eq, recentLogs, color));
            signalContainer.appendChild(equipmentCard);
        });
    }
    
    
    // 툴팁 생성 함수
    function showTooltip(event, eq, logCount) {
        const tooltip = document.createElement('div');
        tooltip.id = 'equipment-tooltip';
        tooltip.className = 'tooltip';
        tooltip.innerHTML = `
            <p>작업 이력: ${logCount}</p>
            <p>특이사항: ${eq.INFO || '없음'}</p>
        `;
    
        document.body.appendChild(tooltip);
    
        // 툴팁 위치 조정
        const rect = event.target.getBoundingClientRect();
        tooltip.style.left = `${rect.left + window.scrollX + 20}px`;
        tooltip.style.top = `${rect.top + window.scrollY}px`;
    }
    
    // 툴팁 제거 함수
    function hideTooltip() {
        const tooltip = document.getElementById('equipment-tooltip');
        if (tooltip) {
            tooltip.remove();
        }
    }
    
    
    function applyFilter() {
        const selectedColor = document.getElementById('filter-color').value;
        const selectedPeriod = parseInt(document.getElementById('filter-period').value, 10);
    
        if (
            !filterEqName.value &&
            !filterGroup.value &&
            !filterSite.value &&
            !filterLine.value &&
            !filterEqType.value &&
            !filterWarranty.value &&
            !selectedColor
        ) {
            console.log("No filters applied. Displaying all equipment.");
            displayEquipmentSignals(equipmentData);
            return;
        }
    
        const filteredData = equipmentData.filter(eq => {
            const recentLogs = workLogData.filter(log =>
                log.equipment_name.trim().toLowerCase() === eq.EQNAME.trim().toLowerCase() &&
                new Date(log.task_date) >= new Date(Date.now() - selectedPeriod * 24 * 60 * 60 * 1000)
            );
    
            const logCount = recentLogs.length;
            const color = getEquipmentColor(logCount);
    
            return (
                (!filterEqName.value || eq.EQNAME.toLowerCase().includes(filterEqName.value.toLowerCase())) &&
                (!filterGroup.value || eq.GROUP === filterGroup.value) &&
                (!filterSite.value || eq.SITE === filterSite.value) &&
                (!filterLine.value || eq.LINE === filterLine.value) &&
                (!filterEqType.value || eq.TYPE === filterEqType.value) &&
                (!filterWarranty.value || eq.WARRANTY_STATUS === filterWarranty.value) &&
                (!selectedColor || color === selectedColor)
            );
        });
    
        console.log("Filtered Data Count:", filteredData.length);
        console.log("Filtered Data:", filteredData);
    
        displayEquipmentSignals(filteredData);
    }
    
    

    function resetFilter() {
        filterEqName.value = '';
        filterGroup.value = '';
        filterSite.value = '';
        filterLine.value = '';
        filterEqType.value = '';
        filterWarranty.value = '';
        document.getElementById('filter-period').value = '30'; // 기본값: 최근 1개월
        document.getElementById('filter-color').value = ''; // 색상 필터 초기화
        displayEquipmentSignals(equipmentData); // 전체 데이터 표시
    }

    function displayEquipmentDetails(eq, logs, color) {
        console.log('Selected EQNAME:', eq.EQNAME);
        const allCards = document.querySelectorAll('.equipment-card');
        allCards.forEach(card => {
            card.style.transform = 'scale(0)';
            card.style.opacity = '0';
        });
    
        setTimeout(() => {
            signalContainer.classList.add('hidden');
            equipmentDetails.classList.remove('hidden');
    
            selectedPoint.style.backgroundColor = color;
            selectedPoint.style.transform = 'scale(3)';
            selectedEqName.textContent = eq.EQNAME;
    
            // Display Equipment Information
            eqInfo.innerHTML = `
                <p>Group: ${eq.GROUP}</p>
                <p>Site: ${eq.SITE}</p>
                <p>Line: ${eq.LINE}</p>
                <p>Type: ${eq.TYPE}</p>
                <p>Floor: ${eq.FLOOR}</p>
                <p>Bay: ${eq.BAY}</p>
                <p>Warranty End Date: ${new Date(eq.END_DATE).toISOString().split('T')[0]}</p>
                <p>Warranty: ${eq.WARRANTY_STATUS}</p>
            `;
    
            // Set the INFO field value
            const infoText = document.getElementById('info-text');
            infoText.value = eq.INFO || '설비 특이사항이 아직 없습니다. 추가해주세요.';
            infoText.disabled = true;
    
            // Reset buttons state
            document.getElementById('edit-info').classList.remove('hidden');
            document.getElementById('save-info').classList.add('hidden');
            document.getElementById('cancel-edit').classList.add('hidden');
    
            // Display Work Logs
            workLogBody.innerHTML = '';
            logs.forEach(log => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${new Date(log.task_date).toLocaleDateString()}</td>
                    <td>${log.work_type}</td>
                    <td>${log.task_name}</td>
                    <td>${log.task_cause || 'N/A'}</td>
                    <td>${log.task_result || 'N/A'}</td>
                    <td>${log.task_man}</td>
                    <td>${log.task_duration}</td>
                `;
                row.addEventListener('click', () => openTaskModal(log));
                workLogBody.appendChild(row);
            });
        }, 300);
    }
    
    

    function calculateColorStats(data) {
        const colorCounts = {
            darkred: 0,
            red: 0,
            yellow: 0,
            green: 0,
            gray: 0,
        };
    
        data.forEach(eq => {
            // 최근 작업 이력 확인
            const recentLogs = workLogData.filter(log =>
                log.equipment_name.trim().toLowerCase() === eq.EQNAME.trim().toLowerCase()
            );
    
            const logCount = recentLogs.length;
            const color = getEquipmentColor(logCount); // 색상 계산
    
            if (color in colorCounts) {
                colorCounts[color]++;
            }
        });
    
        const totalCount = data.length; // 총 설비 대수
        return { colorCounts, totalCount };
    }
    

    function displayColorStats({ colorCounts, totalCount }) {
        const statsContainer = document.getElementById('stats-container');
        statsContainer.innerHTML = ''; // 기존 내용 초기화
    
        // 색상별 의미 정의
        const colorMeanings = {
            darkred: '10↑ work logs',
            red: '5-9 work logs',
            yellow: '3-4 work logs',
            green: '1-2 work logs',
            gray: '0 work log',
        };
    
        // 총 설비 대수 표시
        const totalElement = document.createElement('div');
        totalElement.className = 'total-equipment';
        totalElement.innerHTML = `<strong>Total Equipment:</strong> ${totalCount}`;
        statsContainer.appendChild(totalElement);
    
        // 색상별 데이터를 HTML로 추가
        Object.keys(colorCounts).forEach(color => {
            const count = colorCounts[color];
            const percentage = totalCount > 0 ? ((count / totalCount) * 100).toFixed(2) : 0;
    
            const statElement = document.createElement('div');
            statElement.className = 'stat-item';
            statElement.innerHTML = `
                <span style="display: inline-block; width: 15px; height: 15px; background-color: ${color}; margin-right: 5px;"></span>
                <strong>${color.toUpperCase()}</strong>: ${count} (${percentage}%) - ${colorMeanings[color]}
            `;
            statsContainer.appendChild(statElement);
        });
    }
    
    

    backToListButton.addEventListener('click', () => {
        const allCards = document.querySelectorAll('.equipment-card');
        signalContainer.classList.remove('hidden');
        equipmentDetails.classList.add('hidden');

        setTimeout(() => {
            allCards.forEach(card => {
                card.style.transform = 'scale(1)';
                card.style.opacity = '1';
            });
        }, 100);
    });

    applyFilterButton.addEventListener('click', applyFilter);
    resetFilterButton.addEventListener('click', resetFilter);

    loadData();
});


function openTaskModal(log) {
    const modal = document.getElementById('task-details-modal');
    const modalTableBody = document.getElementById('modal-task-table').querySelector('tbody');

    // 테이블 초기화
    modalTableBody.innerHTML = '';

    // 표시할 데이터 객체
    const taskDetails = {
        'Task Date': new Date(log.task_date).toLocaleDateString(),
        'Task Name': log.task_name,
        'Task Man': log.task_man,
        'Group': log.group,
        'Site': log.site,
        'Line': log.line,
        'Equipment Type': log.equipment_type,
        'Warranty': log.warranty,
        'Equipment Name': log.equipment_name,
        'Status': log.status,
        'Task Description': log.task_description || 'N/A',
        'Task Cause': log.task_cause || 'N/A',
        'Task Result': log.task_result || 'N/A',
        'SOP': log.SOP || 'N/A',
        'TS Guide': log.tsguide || 'N/A',
        'Work Type': log.work_type,
        'Setup Item': log.setup_item || 'N/A',
        'Transfer Item': log.transfer_item || 'N/A',
        'Task Duration': log.task_duration,
        'Start Time': log.start_time || 'N/A',
        'End Time': log.end_time || 'N/A',
        'None Time': log.none_time || 0,
        'Move Time': log.move_time || 0
    };

    // 데이터를 모달 테이블에 추가
    Object.entries(taskDetails).forEach(([key, value]) => {
        const row = document.createElement('tr');
        row.innerHTML = `<th>${key}</th><td>${value}</td>`;
        modalTableBody.appendChild(row);
    });

    modal.classList.remove('hidden'); // 모달 표시
}

// 모달 창 닫기 - 하단 닫기 버튼
document.getElementById('close-task-modal-bottom').addEventListener('click', () => {
    const modal = document.getElementById('task-details-modal'); // 올바른 ID 참조
    modal.classList.add('hidden'); // 모달 숨기기
});


// Enable editing of INFO field
document.getElementById('edit-info').addEventListener('click', () => {
    const infoText = document.getElementById('info-text');
    infoText.disabled = false;
    document.getElementById('edit-info').classList.add('hidden');
    document.getElementById('save-info').classList.remove('hidden');
    document.getElementById('cancel-edit').classList.remove('hidden');
});

// Cancel editing of INFO field
document.getElementById('cancel-edit').addEventListener('click', () => {
    const infoText = document.getElementById('info-text');
    infoText.disabled = true;
    infoText.value = equipmentData.find(eq => eq.EQNAME === selectedEqName.textContent).INFO || '설비 특이사항이 아직 없습니다. 작성해주세요.';
    document.getElementById('edit-info').classList.remove('hidden');
    document.getElementById('save-info').classList.add('hidden');
    document.getElementById('cancel-edit').classList.add('hidden');
});

document.getElementById('save-info').addEventListener('click', async () => {
    const infoText = document.getElementById('info-text');
    const eqName = selectedEqName.textContent.trim().toLowerCase();
    const updatedInfo = infoText.value.trim();

    console.log('PUT Request to:', `http://3.37.73.151:3001/api/Equipment/${encodeURIComponent(eqName)}`);
    console.log('Payload:', { info: updatedInfo });

    if (!eqName) {
        alert('EQNAME이 설정되지 않았습니다.');
        return;
    }

    try {
        const response = await axios.put(
            `http://3.37.73.151:3001/api/Equipment/${encodeURIComponent(eqName)}`,
            { info: updatedInfo },
            { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.status === 200) {
            alert('특이사항이 수정되었습니다. 감사합니다.');
            
            // 저장 성공 후 버튼 상태 변경
            infoText.disabled = true; // 다시 수정 불가 상태로 변경
            document.getElementById('save-info').classList.add('hidden'); // SAVE 버튼 숨김
            document.getElementById('cancel-edit').classList.add('hidden'); // CANCEL 버튼 숨김
            document.getElementById('edit-info').classList.remove('hidden'); // EDIT 버튼 표시
        } else {
            console.error('Unexpected response status:', response.status);
            alert('INFO 업데이트 실패: 서버 응답 에러.');
        }
    } catch (error) {
        console.error('Error updating INFO:', error.message);
        alert('INFO 업데이트 실패: 네트워크 또는 서버 문제.');
    }
});


// Textarea 자동 높이 조절 함수
function adjustTextareaHeight(textarea) {
    textarea.style.height = "auto"; // 높이 초기화
    textarea.style.height = textarea.scrollHeight + "px"; // 내용에 맞게 높이 설정
}

// 텍스트 입력 시 높이 자동 조절
const infoText = document.getElementById('info-text');

// 내용 변경 시 높이 자동 조정
infoText.addEventListener('input', () => adjustTextareaHeight(infoText));

// 페이지 로드 시 높이 자동 조정
document.addEventListener('DOMContentLoaded', () => {
    adjustTextareaHeight(infoText);
    if (!infoText.value.trim()) {
        infoText.placeholder = "특이사항이 없습니다. 추가해주세요."; // 내용이 없을 때 기본 텍스트
    }
});
