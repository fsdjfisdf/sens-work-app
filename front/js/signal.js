document.addEventListener('DOMContentLoaded', async () => {
    const signalContainer = document.getElementById('signal-container');
    const equipmentDetails = document.getElementById('equipment-details');
    const selectedEqName = document.getElementById('selected-eq-name');
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

    let equipmentData = [];
    let workLogData = [];

    const token = localStorage.getItem('x-access-token');
    if (!token) {
        alert('로그인이 필요합니다.');
        window.location.replace('./signin.html');
        return;
    }

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
            signalContainer.innerHTML = '<p style="text-align: center; color: #fff;">Loading...</p>';
    
            const equipmentResponse = await axios.get('http://3.37.73.151:3001/api/equipment');
            const workLogResponse = await axios.get('http://3.37.73.151:3001/logs');
    
            equipmentData = equipmentResponse.data;
            workLogData = workLogResponse.data;
    
            displayEquipmentSignals(equipmentData); // 초기 로드 시 전체 데이터를 표시
        } catch (error) {
            console.error('Error loading data:', error);
            signalContainer.innerHTML = '<p style="text-align: center; color: red;">Failed to load data.</p>';
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
        const selectedPeriod = parseInt(document.getElementById('filter-period').value, 10); // 선택된 기간(일)
        
        signalContainer.innerHTML = ''; // 기존 신호등 초기화
        equipmentDetails.classList.add('hidden');
        signalContainer.classList.remove('hidden');
    
        // 색상별 개수와 비율 계산
        const colorCounts = calculateColorStats(data);
        displayColorStats(colorCounts, data.length);
    
        if (data.length === 0) {
            signalContainer.innerHTML = '<p>No equipment matches the filter criteria.</p>';
            return;
        }
    
        data.forEach(eq => {
            // 선택된 기간의 작업 이력 필터링
            const recentLogs = workLogData.filter(log =>
                log.equipment_name === eq.EQNAME &&
                new Date(log.task_date) >= new Date(Date.now() - selectedPeriod * 24 * 60 * 60 * 1000)
            );
    
            const logCount = recentLogs.length;
            const color = getEquipmentColor(logCount); // 색상 계산
    
            // 장비 카드 생성
            const equipmentCard = document.createElement('div');
            equipmentCard.className = 'equipment-card';
            equipmentCard.innerHTML = `
                <div class="equipment-point" style="background-color: ${color};"></div>
                <div class="equipment-label">${eq.EQNAME}</div>
            `;
            equipmentCard.addEventListener('click', () => displayEquipmentDetails(eq, recentLogs, color));
            signalContainer.appendChild(equipmentCard);
        });
    }
    
    function applyFilter() {
        const selectedColor = document.getElementById('filter-color').value;
        const selectedPeriod = parseInt(document.getElementById('filter-period').value, 10); // 선택된 기간(일)
    
        const filteredData = equipmentData.filter(eq => {
            const recentLogs = workLogData.filter(log =>
                log.equipment_name === eq.EQNAME &&
                new Date(log.task_date) >= new Date(Date.now() - selectedPeriod * 24 * 60 * 60 * 1000)
            );
    
            const logCount = recentLogs.length;
            const color = getEquipmentColor(logCount);
    
            return (
                (!filterEqName.value || eq.EQNAME.toLowerCase().includes(filterEqName.value.toLowerCase())) && // 이름 필터
                (!filterGroup.value || eq.GROUP === filterGroup.value) && // 그룹 필터
                (!filterSite.value || eq.SITE === filterSite.value) && // 사이트 필터
                (!filterLine.value || eq.LINE === filterLine.value) && // 라인 필터
                (!filterEqType.value || eq.TYPE === filterEqType.value) && // 장비 타입 필터
                (!filterWarranty.value || eq.WARRANTY_STATUS === filterWarranty.value) && // 보증 상태 필터
                (!selectedColor || color === selectedColor) // 색상 필터
            );
        });
    
        displayEquipmentSignals(filteredData);
        document.getElementById('info-text').value = 'No equipment selected';
        document.getElementById('info-text').disabled = true;
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
                <p>Warranty End Date: ${eq.END_DATE}</p>
                <p>Warranty: ${eq.WARRANTY_STATUS}</p>
            `;
    
            // Set the INFO field value
            const infoText = document.getElementById('info-text');
            infoText.value = eq.INFO || 'No additional info available';
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
                workLogBody.appendChild(row);
            });
        }, 300);
    }
    
    

    function calculateColorStats(data) {
        const selectedPeriod = parseInt(document.getElementById('filter-period').value, 10); // 선택된 기간(일)
        const colorCounts = {
            darkred: 0,
            red: 0,
            yellow: 0,
            green: 0,
            gray: 0
        };
    
        data.forEach(eq => {
            const recentLogs = workLogData.filter(log =>
                log.equipment_name === eq.EQNAME &&
                new Date(log.task_date) >= new Date(Date.now() - selectedPeriod * 24 * 60 * 60 * 1000)
            );
    
            const logCount = recentLogs.length;
    
            if (logCount >= 10) {
                colorCounts.darkred++;
            } else if (logCount >= 5) {
                colorCounts.red++;
            } else if (logCount >= 3) {
                colorCounts.yellow++;
            } else if (logCount > 0) {
                colorCounts.green++;
            } else {
                colorCounts.gray++;
            }
        });
    
        return colorCounts;
    }
    

    function displayColorStats(colorCounts, totalCount) {
        const statsContainer = document.getElementById('stats-container');
        statsContainer.innerHTML = ''; // 기존 내용 초기화
    
        // 색상별 데이터를 HTML로 추가
        Object.keys(colorCounts).forEach(color => {
            const count = colorCounts[color];
            const percentage = totalCount > 0 ? ((count / totalCount) * 100).toFixed(2) : 0;
    
            const statElement = document.createElement('div');
            statElement.className = 'stat-item';
            statElement.innerHTML = `
                <span style="display: inline-block; width: 15px; height: 15px; background-color: ${color}; margin-right: 5px;"></span>
                <strong>${color.toUpperCase()}</strong>: ${count} (${percentage}%)
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

function displayEquipmentDetails(eq, logs, color) {
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
            <p>Warranty End Date: ${eq.END_DATE}</p>
            <p>Warranty: ${eq.WARRANTY_STATUS}</p>
        `;

        // Populate INFO field
        const infoText = document.getElementById('info-text');
        infoText.value = eq.INFO || 'No additional info available';

        // Reset buttons state
        document.getElementById('edit-info').classList.remove('hidden');
        document.getElementById('save-info').classList.add('hidden');
        document.getElementById('cancel-edit').classList.add('hidden');
        infoText.disabled = true;

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
            workLogBody.appendChild(row);
        });
    }, 300);
}

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
    infoText.value = equipmentData.find(eq => eq.EQNAME === selectedEqName.textContent).INFO || 'No additional info available';
    document.getElementById('edit-info').classList.remove('hidden');
    document.getElementById('save-info').classList.add('hidden');
    document.getElementById('cancel-edit').classList.add('hidden');
});

// Save updated INFO field
document.getElementById('save-info').addEventListener('click', async () => {
    const infoText = document.getElementById('info-text');
    const updatedInfo = infoText.value.trim();
    const eqName = selectedEqName.textContent;

    try {
        const response = await axios.put(
            `http://3.37.73.151:3001/api/equipment/${eqName}`,
            { INFO: updatedInfo },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        // Update local data
        const eq = equipmentData.find(eq => eq.EQNAME === eqName);
        if (eq) eq.INFO = updatedInfo;

        infoText.disabled = true;
        document.getElementById('edit-info').classList.remove('hidden');
        document.getElementById('save-info').classList.add('hidden');
        document.getElementById('cancel-edit').classList.add('hidden');

        alert('INFO updated successfully!');
    } catch (error) {
        console.error('Error updating INFO:', error);
        alert('Failed to update INFO. Restoring previous value.');

        // Restore previous value
        const eq = equipmentData.find(eq => eq.EQNAME === eqName);
        infoText.value = eq.INFO || 'No additional info available';
    }
});
