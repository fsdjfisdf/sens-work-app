document.addEventListener('DOMContentLoaded', async () => {
    const signalContainer = document.getElementById('signal-container');
    const equipmentDetails = document.getElementById('equipment-details');
    const selectedEqName = document.getElementById('selected-eq-name');
    const eqInfo = document.getElementById('eq-info');
    const workLogBody = document.getElementById('work-log-body');
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

    async function loadData() {
        try {
            const equipmentResponse = await axios.get('http://3.37.73.151:3001/api/equipment');
            const workLogResponse = await axios.get('http://3.37.73.151:3001/logs');

            equipmentData = equipmentResponse.data;
            workLogData = workLogResponse.data;

            displayEquipmentSignals(equipmentData); // 초기 로드 시 전체 데이터를 표시
        } catch (error) {
            console.error('Error loading data:', error);
        }
    }

    function displayEquipmentSignals(data) {
        signalContainer.innerHTML = ''; // Clear previous data
        equipmentDetails.classList.add('hidden');
        signalContainer.classList.remove('hidden');

        if (data.length === 0) {
            signalContainer.innerHTML = '<p>No equipment matches the filter criteria.</p>';
            return;
        }

        data.forEach(eq => {
            const recentLogs = workLogData.filter(log =>
                log.equipment_name === eq.EQNAME &&
                new Date(log.task_date) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            );

            const logCount = recentLogs.length;
            let color = '';

            if (logCount >= 5) {
                color = 'red';
            } else if (logCount >= 3) {
                color = 'yellow';
            } else {
                color = 'blue';
            }

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
            eqInfo.innerHTML = `
                <p>Group: ${eq.GROUP}</p>
                <p>Site: ${eq.SITE}</p>
                <p>Line: ${eq.LINE}</p>
                <p>Type: ${eq.TYPE}</p>
                <p>Warranty: ${eq.WARRANTY_STATUS}</p>
            `;

            workLogBody.innerHTML = '';
            logs.forEach(log => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${new Date(log.task_date).toLocaleDateString()}</td>
                    <td>${log.work_type}</td>
                    <td>${log.task_name}</td>
                    <td>${log.task_duration}</td>
                `;
                workLogBody.appendChild(row);
            });
        }, 300);
    }

    document.body.addEventListener('click', (e) => {
        if (!equipmentDetails.contains(e.target) && !signalContainer.contains(e.target)) {
            equipmentDetails.classList.add('hidden');
            displayEquipmentSignals(equipmentData);
        }
    });

    applyFilterButton.addEventListener('click', applyFilter);
    resetFilterButton.addEventListener('click', resetFilter);

    loadData();
});
