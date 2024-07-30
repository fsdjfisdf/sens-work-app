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
    const lineChart = document.getElementById('lineChart').getContext('2d');
    const warrantyChart = document.getElementById('warrantyChart').getContext('2d');
    const typeChart = document.getElementById('typeChart').getContext('2d');
    const modal = document.getElementById('modal');
    const modalClose = document.getElementById('modalClose');
    const modalCanvas = document.getElementById('modalCanvas').getContext('2d');

    let equipments = [];
    let filteredEquipments = [];
    let page = 1;
    const itemsPerPage = 10;
    let lineChartInstance = null;
    let warrantyChartInstance = null;
    let typeChartInstance = null;
    let modalChartInstance = null;

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
                <td>${equipment.EQNAME}</td>
                <td>${equipment.BAY}</td>
                <td>${equipment.GROUP}</td>
                <td>${equipment.SITE}</td>
                <td>${equipment.TYPE}</td>
                <td>${equipment.LINE}</td>
                <td>${formatDate(equipment.START_DATE)}</td>
                <td>${formatDate(equipment.END_DATE)}</td>
                <td>${equipment.WARRANTY_STATUS}</td>
            `;
            equipmentTbody.appendChild(equipmentRow);
        });
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

        if (lineChartInstance) lineChartInstance.destroy();
        if (warrantyChartInstance) warrantyChartInstance.destroy();
        if (typeChartInstance) typeChartInstance.destroy();

        lineChartInstance = new Chart(lineChart, {
            type: 'bar',
            data: {
                labels: Object.keys(lineData).sort((a, b) => lineData[b] - lineData[a]),
                datasets: [{
                    label: 'Line',
                    data: Object.values(lineData).sort((a, b) => b - a),
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }]
            },
            plugins: [ChartDataLabels],
            options: {
                indexAxis: 'y',
                scales: {
                    x: {
                        beginAtZero: true,
                        ticks: {
                            maxTicksLimit: 10,
                            font: {
                                size: 14 // 축 레이블의 글꼴 크기를 조정
                            }
                        }
                    },
                    y: {
                        ticks: {
                            maxTicksLimit: 10,
                            font: {
                                size: 14 // 축 레이블의 글꼴 크기를 조정
                            }
                        }
                    }
                },
                plugins: {
                    datalabels: {
                        formatter: (value, ctx) => {
                            const percentage = ((value / totalEquipments) * 100).toFixed(2);
                            return `${value} (${percentage}%)`;
                        },
                        color: '#000',
                        anchor: 'end',
                        align: 'end'
                    }
                }
            }
        });

        warrantyChartInstance = new Chart(warrantyChart, {
            type: 'bar',
            data: {
                labels: Object.keys(warrantyData),
                datasets: [{
                    label: 'Warranty',
                    data: Object.values(warrantyData),
                    backgroundColor: 'rgba(153, 102, 255, 0.2)',
                    borderColor: 'rgba(153, 102, 255, 1)',
                    borderWidth: 1
                }]
            },
            plugins: [ChartDataLabels],
            options: {
                indexAxis: 'y',
                scales: {
                    x: {
                        beginAtZero: true,
                        ticks: {
                            maxTicksLimit: 10,
                            font: {
                                size: 14 // 축 레이블의 글꼴 크기를 조정
                            }
                        }
                    },
                    y: {
                        ticks: {
                            maxTicksLimit: 10,
                            font: {
                                size: 14 // 축 레이블의 글꼴 크기를 조정
                            }
                        }
                    }
                },
                plugins: {
                    datalabels: {
                        formatter: (value, ctx) => {
                            const percentage = ((value / totalEquipments) * 100).toFixed(2);
                            return `${value} (${percentage}%)`;
                        },
                        color: '#000',
                        anchor: 'end',
                        align: 'end'
                    }
                }
            }
        });

        typeChartInstance = new Chart(typeChart, {
            type: 'bar',
            data: {
                labels: Object.keys(typeData),
                datasets: [{
                    label: 'EQ TYPE',
                    data: Object.values(typeData),
                    backgroundColor: 'rgba(255, 206, 86, 0.2)',
                    borderColor: 'rgba(255, 206, 86, 1)',
                    borderWidth: 1
                }]
            },
            plugins: [ChartDataLabels],
            options: {
                indexAxis: 'y',
                scales: {
                    x: {
                        beginAtZero: true,
                        ticks: {
                            maxTicksLimit: 10,
                            font: {
                                size: 14 // 축 레이블의 글꼴 크기를 조정
                            }
                        }
                    },
                    y: {
                        ticks: {
                            maxTicksLimit: 10,
                            font: {
                                size: 14 // 축 레이블의 글꼴 크기를 조정
                            }
                        }
                    }
                },
                plugins: {
                    datalabels: {
                        formatter: (value, ctx) => {
                            const percentage = ((value / totalEquipments) * 100).toFixed(2);
                            return `${value} (${percentage}%)`;
                        },
                        color: '#000',
                        anchor: 'end',
                        align: 'end'
                    }
                }
            }
        });
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
        }
    });

    nextPage.addEventListener('click', () => {
        if (page * itemsPerPage < filteredEquipments.length) {
            page++;
            displayEquipments();
            currentPage.textContent = page;
        }
    });

    searchSite.addEventListener('change', function() {
        const siteSelection = this.value;
        const lineSelect = searchLine;
        
        // 기존 옵션 초기화
        lineSelect.innerHTML = '<option value="">Search by Line</option>';
      
        // SITE에 따른 LINE 옵션 정의
        const lineOptions = {
          "PT": ["P1F", "P1D", "P2F", "P2D", "P2-S5", "P3F", "P3D", "P3-S5", "P4F", "P4D", "P4-S5"],
          "HS": ["12L", "13L", "15L", "16L", "17L", "S1", "S3",  "S4", "S3V", "NRD", "NRD-V", "U4", "M1", "5L"],
          "IC": ["M10", "M14", "M16", "R3"],
          "CJ": ["M11", "M12", "M15"],
          "PSKH": ["PSKH"] // PSKH의 경우 선택할 수 있는 하나의 옵션만 존재
        };
      
        // 선택된 SITE에 맞는 LINE 옵션 추가
        if (lineOptions[siteSelection]) {
          lineOptions[siteSelection].forEach(function(line) {
            const option = document.createElement('option');
            option.value = line;
            option.textContent = line;
            lineSelect.appendChild(option);
          });
        }
      });

    loadEquipment();

    function showModal(chartInstance) {
        modal.style.display = 'block';
        if (modalChartInstance) {
            modalChartInstance.destroy();
        }
        modalChartInstance = new Chart(modalCanvas, {
            type: 'bar',
            data: chartInstance.data,
            options: {
                plugins: {
                    title: {
                        display: true,
                        text: chartInstance.options.plugins.title.text
                    },
                    datalabels: chartInstance.options.plugins.datalabels
                },
                indexAxis: 'y',
                scales: {
                    x: {
                        beginAtZero: true,
                        ticks: {
                            maxTicksLimit: 10,
                            font: {
                                size: 14 // 축 레이블의 글꼴 크기를 조정
                            }
                        }
                    },
                    y: {
                        ticks: {
                            maxTicksLimit: 10,
                            font: {
                                size: 14 // 축 레이블의 글꼴 크기를 조정
                            }
                        }
                    }
                }
            }
        });
    }

    function closeModal() {
        modal.style.display = 'none';
        if (modalChartInstance) {
            modalChartInstance.destroy();
        }
    }

    lineChart.canvas.parentNode.addEventListener('click', () => showModal(lineChartInstance));
    warrantyChart.canvas.parentNode.addEventListener('click', () => showModal(warrantyChartInstance));
    typeChart.canvas.parentNode.addEventListener('click', () => showModal(typeChartInstance));
    modalClose.addEventListener('click', closeModal);
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            closeModal();
        }
    });
});
