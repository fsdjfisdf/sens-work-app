

document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('x-access-token');

    if (!token) {
        alert('로그인이 필요합니다.');
        window.location.replace('./signin.html');
        return;
    }

    const equipmentTbody = document.getElementById('equipment-tbody');
    const searchButton = document.getElementById('searchButton');
    const resetButton = document.getElementById('resetButton');
    const searchEqName = document.getElementById('searchEqName');
    const searchGroup = document.getElementById('searchGroup');
    const searchSite = document.getElementById('searchSite');
    const searchLine = document.getElementById('searchLine');
    const searchType = document.getElementById('searchType');
    const searchWarrantyStatus = document.getElementById('searchWarrantyStatus');
    const equipmentCount = document.getElementById('equipment-count');
    const prevPage = document.getElementById('prevPage');
    const nextPage = document.getElementById('nextPage');
    const currentPage = document.getElementById('currentPage');
    const pageOf = document.getElementById('pageOf');
    const lineChart = document.getElementById('lineChart').getContext('2d');
    const warrantyChart = document.getElementById('warrantyChart').getContext('2d');
    const typeChart = document.getElementById('typeChart').getContext('2d');

    let equipments = [];
    let filteredEquipments = [];
    let page = 1;
    const itemsPerPage = 10;
    let lineChartInstance = null;
    let warrantyChartInstance = null;
    let typeChartInstance = null;

    const siteLineOrder = {
        "PT": ["P1F", "P1D", "P2F", "P2D", "P2-S5", "P3F", "P3D", "P3-S5", "P4F", "P4D", "P4-S5"],
        "HS": ["12L", "13L", "15L", "16L", "17L", "S1", "S3", "S4", "S3V", "NRD", "NRD-V", "U4", "M1", "5L"],
        "IC": ["M10", "M14", "M16", "R3"],
        "CJ": ["M11", "M12", "M15"]
    };

    const siteColors = {
        "PT": 'rgba(75, 192, 192, 0.2)',
        "HS": 'rgba(153, 102, 255, 0.2)',
        "IC": 'rgba(255, 206, 86, 0.2)',
        "CJ": 'rgba(54, 162, 235, 0.2)'
    };

    const siteBorderColors = {
        "PT": 'rgba(75, 192, 192, 1)',
        "HS": 'rgba(153, 102, 255, 1)',
        "IC": 'rgba(255, 206, 86, 1)',
        "CJ": 'rgba(54, 162, 235, 1)'
    };

    function formatDate(dateString) {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    async function loadEquipment(filters = {}) {
        try {
            console.log('Loading equipment data...');
            const response = await axios.get('http://3.37.165.84:3001/api/equipment');
            console.log('Equipment data loaded:', response.data);
            equipments = response.data.sort((a, b) => new Date(a.START_DATE) - new Date(b.START_DATE));
            filterAndDisplayEquipments(filters);
        } catch (error) {
            console.error('Error loading equipment data:', error);
            equipmentTbody.innerHTML = '<tr><td colspan="9">Error loading equipment data.</td></tr>';
        }
    }

    function filterAndDisplayEquipments(filters) {
        filteredEquipments = equipments.filter(equipment => {
            return (!filters.EQNAME || equipment.EQNAME.toLowerCase().includes(filters.EQNAME.toLowerCase())) &&
                   (!filters.GROUP || equipment.GROUP === filters.GROUP) &&
                   (!filters.SITE || equipment.SITE === filters.SITE) &&
                   (!filters.LINE || equipment.LINE.toLowerCase().includes(filters.LINE.toLowerCase())) &&
                   (!filters.TYPE || equipment.TYPE.toLowerCase().includes(filters.TYPE.toLowerCase())) &&
                   (!filters.WARRANTY_STATUS || equipment.WARRANTY_STATUS === filters.WARRANTY_STATUS);
        });
        displayEquipments();
        updateCharts();
        updatePagination();
    }

    function displayEquipments() {
        equipmentTbody.innerHTML = '';
        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const pageEquipments = filteredEquipments.slice(startIndex, endIndex);
        equipmentCount.innerHTML = `<span>Total Equipment: ${filteredEquipments.length}</span>`;

        pageEquipments.forEach(equipment => {
            const equipmentRow = document.createElement('tr');
            equipmentRow.classList.add('equipment-row');
            equipmentRow.innerHTML = `
                <td>${equipment.GROUP}</td>
                <td>${equipment.SITE}</td>
                <td>${equipment.TYPE}</td>
                <td>${equipment.EQNAME}</td>
                <td>${equipment.LINE}</td>
                <td>${equipment.FLOOR}</td>
                <td>${equipment.BAY}</td>
                <td>${equipment.WARRANTY_STATUS}</td>
                <td>${formatDate(equipment.END_DATE)}</td>
            `;
            equipmentRow.addEventListener('click', async () => {
                await loadWorkLogsForEquipment(equipment.EQNAME);
            });
            equipmentTbody.appendChild(equipmentRow);
        });
    }

    function calculateMaxValue(data) {
        const maxValue = Math.max(...data);
        return Math.ceil(maxValue * 1.2);
    }

    function updateCharts() {
        const totalEquipments = filteredEquipments.length;

        const lineData = filteredEquipments.reduce((acc, equipment) => {
            acc[equipment.LINE] = (acc[equipment.LINE] || 0) + 1;
            return acc;
        }, {});

        const warrantyData = filteredEquipments.reduce((acc, equipment) => {
            acc[equipment.WARRANTY_STATUS] = (acc[equipment.WARRANTY_STATUS] || 0) + 1;
            return acc;
        }, {});

        const typeData = filteredEquipments.reduce((acc, equipment) => {
            acc[equipment.TYPE] = (acc[equipment.TYPE] || 0) + 1;
            return acc;
        }, {});

        console.log('Line Data:', lineData);
        console.log('Warranty Data:', warrantyData);
        console.log('Type Data:', typeData);

        if (lineChartInstance) lineChartInstance.destroy();
        if (warrantyChartInstance) warrantyChartInstance.destroy();
        if (typeChartInstance) typeChartInstance.destroy();

        const sortedLineLabels = Object.keys(siteLineOrder).reduce((acc, site) => {
            const lines = siteLineOrder[site].filter(line => lineData[line]);
            lines.sort((a, b) => lineData[b] - lineData[a]);
            return acc.concat(lines);
        }, []);

        const linePercentData = sortedLineLabels.map(label => (lineData[label] / totalEquipments) * 100);
        const lineMaxValue = calculateMaxValue(linePercentData);

        const lineBackgroundColors = sortedLineLabels.map(label => {
            const site = Object.keys(siteLineOrder).find(site => siteLineOrder[site].includes(label));
            return siteColors[site];
        });

        const lineBorderColors = sortedLineLabels.map(label => {
            const site = Object.keys(siteLineOrder).find(site => siteLineOrder[site].includes(label));
            return siteBorderColors[site];
        });

        lineChartInstance = new Chart(lineChart, {
            type: 'bar',
            data: {
                labels: sortedLineLabels,
                datasets: [{
                    label: 'Line',
                    data: linePercentData,
                    backgroundColor: lineBackgroundColors,
                    borderColor: lineBorderColors,
                    borderWidth: 1
                }]
            },
            plugins: [ChartDataLabels],
            options: {
                scales: {
                    y: {
                        beginAtZero: true,
                        max: lineMaxValue,
                        ticks: {
                            callback: value => value + '%',
                            font: {
                                size: 14
                            }
                        }
                    },
                    x: {
                        ticks: {
                            font: {
                                size: 14
                            }
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const count = lineData[context.label];
                                const percentage = context.raw.toFixed(2) + '%';
                                return `${count}대 (${percentage})`;
                            }
                        }
                    },
                    datalabels: {
                        formatter: (value, ctx) => {
                            const count = lineData[ctx.chart.data.labels[ctx.dataIndex]];
                            return `${count} (${value.toFixed(2)}%)`;
                        },
                        color: '#000',
                        anchor: 'end',
                        align: 'end'
                    }
                }
            }
        });

        const warrantyLabels = Object.keys(warrantyData).sort((a, b) => warrantyData[b] - warrantyData[a]);
        const warrantyPercentData = warrantyLabels.map(label => (warrantyData[label] / totalEquipments) * 100);
        const warrantyMaxValue = calculateMaxValue(warrantyPercentData);

        warrantyChartInstance = new Chart(warrantyChart, {
            type: 'bar',
            data: {
                labels: warrantyLabels,
                datasets: [{
                    label: 'Warranty',
                    data: warrantyPercentData,
                    backgroundColor: 'rgba(153, 102, 255, 0.2)',
                    borderColor: 'rgba(153, 102, 255, 1)',
                    borderWidth: 1
                }]
            },
            plugins: [ChartDataLabels],
            options: {
                scales: {
                    y: {
                        beginAtZero: true,
                        max: warrantyMaxValue,
                        ticks: {
                            callback: value => value + '%',
                            font: {
                                size: 14
                            }
                        }
                    },
                    x: {
                        ticks: {
                            font: {
                                size: 14
                            }
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const count = warrantyData[context.label];
                                const percentage = context.raw.toFixed(2) + '%';
                                return `${count} (${percentage})`;
                            }
                        }
                    },
                    datalabels: {
                        formatter: (value, ctx) => {
                            const count = warrantyData[ctx.chart.data.labels[ctx.dataIndex]];
                            return `${count} (${value.toFixed(2)}%)`;
                        },
                        color: '#000',
                        anchor: 'end',
                        align: 'end'
                    }
                }
            }
        });

        const typeLabels = Object.keys(typeData).sort((a, b) => typeData[b] - typeData[a]);
        const typePercentData = typeLabels.map(label => (typeData[label] / totalEquipments) * 100);
        const typeMaxValue = calculateMaxValue(typePercentData);

        typeChartInstance = new Chart(typeChart, {
            type: 'bar',
            data: {
                labels: typeLabels,
                datasets: [{
                    label: 'EQ TYPE',
                    data: typePercentData,
                    backgroundColor: 'rgba(255, 206, 86, 0.2)',
                    borderColor: 'rgba(255, 206, 86, 1)',
                    borderWidth: 1
                }]
            },
            plugins: [ChartDataLabels],
            options: {
                scales: {
                    y: {
                        beginAtZero: true,
                        max: typeMaxValue,
                        ticks: {
                            callback: value => value + '%',
                            font: {
                                size: 14
                            }
                        }
                    },
                    x: {
                        ticks: {
                            font: {
                                size: 14
                            }
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const count = typeData[context.label];
                                const percentage = context.raw.toFixed(2) + '%';
                                return `${count} (${percentage})`;
                            }
                        }
                    },
                    datalabels: {
                        formatter: (value, ctx) => {
                            const count = typeData[ctx.chart.data.labels[ctx.dataIndex]];
                            return `${count} (${value.toFixed(2)}%)`;
                        },
                        color: '#000',
                        anchor: 'end',
                        align: 'end'
                    }
                }
            }
        });
    }

    function updatePagination() {
        const totalPages = Math.ceil(filteredEquipments.length / itemsPerPage);
        pageOf.textContent = `of ${totalPages}`;
        currentPage.textContent = page;
        currentPage.style.fontWeight = 'bold';
    }

    searchButton.addEventListener('click', () => {
        const filters = {
            EQNAME: searchEqName.value,
            GROUP: searchGroup.value,
            SITE: searchSite.value,
            LINE: searchLine.value,
            TYPE: searchType.value,
            WARRANTY_STATUS: searchWarrantyStatus.value
        };
        page = 1;
        filterAndDisplayEquipments(filters);
    });

    resetButton.addEventListener('click', () => {
        searchEqName.value = '';
        searchGroup.value = '';
        searchSite.value = '';
        searchLine.value = '';
        searchType.value = '';
        searchWarrantyStatus.value = '';
        page = 1;
        loadEquipment();
    });

    prevPage.addEventListener('click', () => {
        if (page > 1) {
            page--;
            displayEquipments();
            currentPage.textContent = page;
            updatePagination();
        }
    });

    nextPage.addEventListener('click', () => {
        if (page * itemsPerPage < filteredEquipments.length) {
            page++;
            displayEquipments();
            currentPage.textContent = page;
            updatePagination();
        }
    });

    searchSite.addEventListener('change', function() {
        const siteSelection = this.value;
        const lineSelect = searchLine;
        
        // 기존 옵션 초기화
        lineSelect.innerHTML = '<option value="">Search by Line</option>';
      
        // SITE에 따른 LINE 옵션 정의
        const lineOptions = siteLineOrder[siteSelection] || [];
      
        // 선택된 SITE에 맞는 LINE 옵션 추가
        lineOptions.forEach(function(line) {
            const option = document.createElement('option');
            option.value = line;
            option.textContent = line;
            lineSelect.appendChild(option);
        });
    });

    loadEquipment();



    // 장비 테이블 행에 클릭 이벤트 추가
    document.getElementById('equipment-tbody').addEventListener('click', async (event) => {
        if (event.target && event.target.nodeName === 'TD') {
            const eqName = event.target.parentElement.querySelector('td:nth-child(4)').innerText;
            console.log(`Selected Equipment Name: ${eqName}`);
            await loadWorkLogsForEquipment(eqName);
        }
    });



    let workTypeChartInstance = null;

    // 특정 장비의 작업 로그를 조회하는 함수
    async function loadWorkLogsForEquipment(eqName) {
        try {
            const response = await axios.get('http://3.37.165.84:3001/logs');
            console.log('Work logs API response:', response);
            const workLogs = response.data.filter(log => log.equipment_name === eqName);
            displayWorkLogs(workLogs, eqName);
        } catch (error) {
            console.error('Error loading work logs for equipment:', error);
        }
    }

    // 작업 로그를 화면에 테이블 형식으로 표시하는 함수
    function displayWorkLogs(workLogs, eqName) {
        const worklogModal = document.getElementById('worklogModal');
        const worklogTbody = document.getElementById('worklog-tbody');
        const selectedEquipment = document.getElementById('selectedEquipment');
        worklogTbody.innerHTML = '';

        selectedEquipment.textContent = `${eqName} - ${workLogs.length}건`;

        if (workLogs.length === 0) {
            alert('작업 이력이 없습니다.');
            worklogModal.style.display = 'none';
            return;
        }

        workLogs.forEach(log => {
            const logRow = document.createElement('tr');
            logRow.className = 'worklog-row';
            logRow.innerHTML = `
                <td>${formatDate(log.task_date)}</td>
                <td>${log.work_type}</td>
                <td>${log.task_name}</td>
                <td>${log.task_result}</td>
                <td>${log.task_man}</td>
                <td>${formatDuration(log.task_duration)}</td>
            `;
            logRow.addEventListener('click', () => {
                displayWorkLogDetail(log);
            });
            worklogTbody.appendChild(logRow);
        });

        worklogModal.style.display = 'block';

        updateWorkTypeChart(workLogs);
    }

        // 작업 종류별 작업 건수를 시각화하는 함수
        function updateWorkTypeChart(workLogs) {
            const workTypeData = workLogs.reduce((acc, log) => {
                acc[log.work_type] = (acc[log.work_type] || 0) + 1;
                return acc;
            }, {});
    
            const workTypeLabels = Object.keys(workTypeData);
            const workTypeCounts = Object.values(workTypeData);
    
            if (workTypeChartInstance) workTypeChartInstance.destroy();
    
            const workTypeChart = document.getElementById('workTypeChart').getContext('2d');
            workTypeChartInstance = new Chart(workTypeChart, {
                type: 'bar',
                data: {
                    labels: workTypeLabels,
                    datasets: [{
                        label: 'Work Type',
                        data: workTypeCounts,
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        }

    function formatDate(dateString) {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function formatDuration(duration) {
        const parts = duration.split(':');
        const hours = parseInt(parts[0], 10);
        const minutes = parseInt(parts[1], 10);

        if (hours < 0 || minutes < 0) {
            return '<span class="error-text">수정 필요</span>';
        }

        let formattedDuration = '';
        if (hours > 0) {
            formattedDuration += `${hours}시간 `;
        }
        if (minutes > 0) {
            formattedDuration += `${minutes}분`;
        }
        return formattedDuration.trim() || '0분';
    }

    // 작업 로그 상세 정보 표시 함수
    function displayWorkLogDetail(log) {
        const worklogDetailModal = document.getElementById('worklogDetailModal');
        const worklogDetail = document.getElementById('worklog-detail');
        worklogDetail.innerHTML = `
            <p><strong>Title:</strong> ${log.task_name}</p>
            <p><strong>Cause:</strong> ${log.task_cause}</p>
            <p><strong>Result:</strong> ${log.task_result}</p>
            <p><strong>Description:</strong> ${log.task_description.replace(/<br\s*\/?>/g, '\n').replace(/\n/g, '<br>')}</p>
        `;
        worklogDetailModal.style.display = 'block';
    }
    

    // 모달 닫기 이벤트
    const modalCloseButtons = document.querySelectorAll('.modal .close');
    modalCloseButtons.forEach(button => {
        button.addEventListener('click', () => {
            const modal = button.closest('.modal');
            modal.style.display = 'none';
        });
    });

    // 테이블 헤더 크기 조정
    const headers = document.querySelectorAll('#worklog-table th');
    headers.forEach(header => {
        const resizer = document.createElement('div');
        resizer.className = 'resizer';
        header.appendChild(resizer);
        resizer.addEventListener('mousedown', initResize);
    });

    function initResize(event) {
        const header = event.target.parentElement;
        const startX = event.pageX;
        const startWidth = header.offsetWidth;

        function resizeColumn(e) {
            const newWidth = startWidth + (e.pageX - startX);
            header.style.width = newWidth + 'px';
        }

        function stopResize() {
            window.removeEventListener('mousemove', resizeColumn);
            window.removeEventListener('mouseup', stopResize);
        }

        window.addEventListener('mousemove', resizeColumn);
        window.addEventListener('mouseup', stopResize);
    }
});
