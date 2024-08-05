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

    const workLogContainer = document.getElementById('work-log-container');
    const workLogEqName = document.getElementById('work-log-eq-name');
    const workLogList = document.getElementById('work-log-list');

    let equipments = [];
    let filteredEquipments = [];
    let page = 1;
    const itemsPerPage = 10;
    let lineChartInstance = null;
    let warrantyChartInstance = null;
    let typeChartInstance = null;
    let selectedRow = null;

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
            equipmentRow.addEventListener('click', () => {
                if (selectedRow) {
                    selectedRow.classList.remove('selected');
                }
                selectedRow = equipmentRow;
                equipmentRow.classList.add('selected');
                displayWorkLogs(equipment.EQNAME);
            });
            equipmentTbody.appendChild(equipmentRow);
        });
    }

    async function displayWorkLogs(equipmentName) {
        try {
            const response = await axios.get(`http://3.37.165.84:3001/api/work-logs?equipment_name=${encodeURIComponent(equipmentName)}`);
            const workLogs = response.data;
            workLogEqName.textContent = equipmentName;
            workLogList.innerHTML = '';
            if (workLogs.length === 0) {
                workLogList.innerHTML = '<li>No work logs found.</li>';
            } else {
                workLogs.forEach(log => {
                    const logItem = document.createElement('li');
                    logItem.textContent = `${log.task_date}: ${log.task_description}`;
                    workLogList.appendChild(logItem);
                });
            }
            workLogContainer.classList.remove('hidden');
        } catch (error) {
            console.error('Error fetching work logs:', error);
        }
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
        if (warrantyChartInstance) lineChartInstance.destroy();
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
});
