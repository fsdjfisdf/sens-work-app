let businessData = []; // 데이터를 전역 변수로 선언

document.addEventListener('DOMContentLoaded', () => {
    // 로그인 체크
    const token = localStorage.getItem('x-access-token');
    if (!token || token.trim() === '') {
        alert('로그인이 필요합니다.');
        window.location.replace('./signin.html');
        return;
    }
    
    const tableBody = document.querySelector('#business-table tbody');
    const currentEngineerCountElement = document.createElement('p'); // 현재 출장 중인 엔지니어 수를 표시할 요소
    currentEngineerCountElement.id = 'current-engineer-count';
    document.querySelector('#engineer-count .inner').appendChild(currentEngineerCountElement);
    const canvas = document.getElementById('trip-chart');
    const ctx = canvas.getContext('2d'); // ctx 초기화
    const tooltip = document.createElement('div'); // 툴팁 요소 생성
    tooltip.classList.add('tooltip');
    document.body.appendChild(tooltip);

    let zoomFactor = 1.0; // 초기 줌 배율
    const margin = 50;

    

    

    // Helper Functions
    const dateToTimestamp = (date) => new Date(date).getTime();
    const addDaysToDate = (date, days) => {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result.toISOString().split('T')[0];
    };
    const dateToX = (date, zoomFactor) => {
        const timestamp = dateToTimestamp(date);
        const startTimestamp = dateToTimestamp('2018-01-01');
        const endTimestamp = dateToTimestamp('2025-12-31');
        return margin + ((timestamp - startTimestamp) / (endTimestamp - startTimestamp)) * (1600 * zoomFactor - 2 * margin);
    };
    // 고유 엔지니어 수 계산 함수
const calculateUniqueEngineers = (data) => {
    const uniqueNames = new Set(data.map(trip => trip.NAME));
    const engineerCount = uniqueNames.size;
    document.getElementById('unique-engineer-count').textContent = `Total Engineers: ${engineerCount}`;
};

const calculateCurrentEngineers = (data) => {
    const today = new Date();
    const currentTrips = data.filter(trip => {
        const startDate = new Date(trip.START_DATE);
        const endDate = new Date(trip.END_DATE);
        return startDate <= today && today <= endDate;
    });
    const uniqueCurrentEngineers = new Set(currentTrips.map(trip => trip.NAME));
    const currentCount = uniqueCurrentEngineers.size;
    document.getElementById('current-engineer-count').textContent = `Currently On Business Trips: ${currentCount}`;
};



    // 데이터 가져오기 함수
    const fetchTrips = async () => {
        try {
            const response = await axios.get('http://3.37.73.151:3001/api/business');
            businessData = response.data;
            renderTable(businessData); // 데이터를 렌더링
            drawChart(businessData);  // 그래프 렌더링
            calculateUniqueEngineers(businessData); // 고유 엔지니어 수 계산
            calculateCurrentEngineers(businessData);
            renderYearlyTripsChart(businessData);
            renderGroupSiteChart(businessData);
            renderCountryCityChart(businessData);
            renderEquipmentChart(businessData);
            renderEngineerTripCountChart(businessData);
        } catch (error) {
            console.error('Error fetching trips:', error);
        }
    };

    // 테이블 렌더링 함수
    const renderTable = (data) => {
        const sortedData = [...data].sort((a, b) => a.id - b.id);
        tableBody.innerHTML = '';
        sortedData.forEach(trip => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${trip.id}</td>
                <td>${trip.NAME}</td>
                <td>${trip.GROUP}</td>
                <td>${trip.SITE}</td>
                <td>${trip.COUNTRY}</td>
                <td>${trip.CITY}</td>
                <td>${trip.CUSTOMER}</td>
                <td>${trip.EQUIPMENT}</td>
                <td>${trip.START_DATE.split('T')[0]}</td>
                <td>${trip.END_DATE.split('T')[0]}</td>
            `;
            tableBody.appendChild(row);
        });
    };

    const countryColors = { // 나라별 그래프 색깔 !!
        USA: '#007bff', // 파란색
        Ireland: '#28a745', // 초록색
        Japan: '#ffc107', // 노란색
        China: '#dc3545', // 빨간색
        Taiwan: '#17a2b8', // 청록색
        Singapore: '#6610f2', // 보라색
    };


// 그래프를 그리는 함수
const drawChart = (data) => {
    canvas.width = 1580 * zoomFactor;
    canvas.height = 550; // 높이 증가하여 범례 공간 확보
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const years = Array.from({ length: 2025 - 2018 + 1 }, (_, i) => 2018 + i);

    // Draw Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw Country Legend (범례)
        const legendMargin = 20;
        const legendBoxSize = 15;
        const legendPadding = 10; // 아이템 간 간격
        const legendItems = Object.entries(countryColors);
        const legendWidth = legendItems.length * (legendBoxSize + legendPadding + 50) - legendPadding; // 범례 전체 폭
        const legendXStart = (canvas.width - legendWidth) / 2; // 가운데 정렬 시작 좌표
        let legendX = legendXStart;
        let legendY = legendMargin;

        Object.entries(countryColors).forEach(([country, color], index) => {
            // Draw color box
            ctx.fillStyle = color;
            ctx.fillRect(legendX, legendY, legendBoxSize, legendBoxSize);
    
            // Draw country name
            ctx.fillStyle = '#333';
            ctx.font = '12px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(country, legendX + legendBoxSize + 5, legendY + legendBoxSize - 2);
    
            // Move to next position
            legendX += 100; // 가로 간격
            if (legendX + 100 > canvas.width) {
                legendX = legendXStart;
                legendY += legendBoxSize + 10; // 세로 간격
            }
        });

    // Draw Axis
    years.forEach((year) => {
        const x = dateToX(`${year}-01-01`, zoomFactor);
        ctx.beginPath();
        ctx.moveTo(x, margin + 50); // 범례 아래로 이동
        ctx.lineTo(x, canvas.height - margin);
        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = '#333';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(year, x, canvas.height - margin + 20);
    });

    // Draw Current Date Line
    const today = new Date().toISOString().split('T')[0];
    const todayX = dateToX(today, zoomFactor);
    ctx.beginPath();
    ctx.moveTo(todayX, margin + 50); // 범례 아래로 이동
    ctx.lineTo(todayX, canvas.height - margin);
    ctx.strokeStyle = '#ff3b30';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]); // 점선
    ctx.stroke();
    ctx.setLineDash([]); // 점선 초기화

    // Trips Rendering Logic
    const lineHeight = 30;
    const rows = [];

    data.forEach((trip) => {
        const xStart = dateToX(trip.START_DATE.split('T')[0], zoomFactor);
        const xEnd = dateToX(trip.END_DATE.split('T')[0], zoomFactor);

        const extendedStart = addDaysToDate(trip.START_DATE.split('T')[0], -30);
        const extendedEnd = addDaysToDate(trip.END_DATE.split('T')[0], 30);
        const extendedXStart = dateToX(extendedStart, zoomFactor);
        const extendedXEnd = dateToX(extendedEnd, zoomFactor);

        let rowIndex = rows.findIndex((row) =>
            row.every((existingTrip) => {
                const existingExtendedStart = addDaysToDate(
                    existingTrip.START_DATE.split('T')[0],
                    -30
                );
                const existingExtendedEnd = addDaysToDate(
                    existingTrip.END_DATE.split('T')[0],
                    30
                );
                const existingXStart = dateToX(existingExtendedStart, zoomFactor);
                const existingXEnd = dateToX(existingExtendedEnd, zoomFactor);
                return extendedXEnd < existingXStart || extendedXStart > existingXEnd;
            })
        );

        if (rowIndex === -1) {
            rowIndex = rows.length;
            rows.push([]);
        }

        rows[rowIndex].push(trip);

        const y = margin + 50 + rowIndex * lineHeight;

        // Apply country color or default color
        const tripColor = countryColors[trip.COUNTRY] || '#cccccc'; // Default color

        ctx.beginPath();
        ctx.moveTo(xStart, y);
        ctx.lineTo(xEnd, y);
        ctx.strokeStyle = tripColor; // Assign country color
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        ctx.stroke();

        ctx.fillStyle = '#333';
        ctx.font = '12px Arial';
        ctx.fillText(`${trip.NAME}`, xStart + 5, y - 5);
    });

    canvas.onmousemove = (event) => {
        const rect = canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;

        const hoveredTrip = data.find((trip) => {
            const xStart = dateToX(trip.START_DATE.split('T')[0], zoomFactor);
            const xEnd = dateToX(trip.END_DATE.split('T')[0], zoomFactor);
            const y =
                margin +
                rows.findIndex((row) => row.includes(trip)) * lineHeight;
            return (
                mouseX >= xStart &&
                mouseX <= xEnd &&
                mouseY >= y - 15 &&
                mouseY <= y + 15
            );
        });

        if (hoveredTrip) {
            tooltip.style.display = 'block';
            tooltip.style.left = `${event.clientX + 15}px`;
            tooltip.style.top = `${event.clientY + 15}px`;
            tooltip.innerHTML = `
                ${hoveredTrip.NAME} - ${hoveredTrip.START_DATE.split('T')[0]} ~ ${
                hoveredTrip.END_DATE.split('T')[0]
            } - ${hoveredTrip.COUNTRY} - ${hoveredTrip.CITY}
            `;
        } else {
            tooltip.style.display = 'none';
        }
    };

    canvas.onmouseleave = () => {
        tooltip.style.display = 'none';
    };

    canvas.oncontextmenu = (event) => {
        event.preventDefault();
    };
};

        

    // 검색 필터링 함수
    const filterData = () => {
        const name = document.getElementById('search-name').value.toLowerCase();
        const group = document.getElementById('search-group').value;
        const site = document.getElementById('search-site').value;
        const country = document.getElementById('search-country').value;
        const city = document.getElementById('search-city').value;
        const customer = document.getElementById('search-customer').value;
        const equipment = document.getElementById('search-equipment').value;

        const filteredData = businessData.filter(trip => {
            return (
                (name === '' || trip.NAME.toLowerCase().includes(name)) &&
                (group === 'SELECT' || trip.GROUP === group) &&
                (site === 'SELECT' || trip.SITE === site) &&
                (country === 'SELECT' || trip.COUNTRY === country) &&
                (city === 'SELECT' || trip.CITY === city) &&
                (customer === 'SELECT' || trip.CUSTOMER === customer) &&
                (equipment === 'SELECT' || trip.EQUIPMENT === equipment)
            );
        });

        renderTable(filteredData);
        drawChart(filteredData); // 필터링된 데이터로 그래프 업데이트
        renderYearlyTripsChart(filteredData); // 연도별 그래프 업데이트
        calculateUniqueEngineers(filteredData);
        renderGroupSiteChart(filteredData); // 그룹-사이트별 그래프 업데이트
        renderCountryCityChart(filteredData); // 국가-도시별 그래프 업데이트
        renderEquipmentChart(filteredData); // 장비별 그래프 업데이트
        renderEngineerTripCountChart(filteredData); // 엔지니어 출장 횟수 분포 업데이트
        calculateCurrentEngineers(filteredData);
    };

        // Reset 필터 함수
        const resetFilters = () => {
            document.getElementById('search-name').value = '';
            document.getElementById('search-group').value = 'SELECT';
            document.getElementById('search-site').value = 'SELECT';
            document.getElementById('search-country').value = 'SELECT';
            document.getElementById('search-city').innerHTML = '<option value="SELECT">City</option>';
            document.getElementById('search-customer').value = 'SELECT';
            document.getElementById('search-equipment').value = 'SELECT';
    
            renderTable(businessData); // 원본 데이터 다시 렌더링
            drawChart(businessData); // 필터링된 데이터로 그래프 업데이트
            calculateUniqueEngineers(businessData);
            renderYearlyTripsChart(businessData); // 연도별 그래프 원본 데이터로 업데이트
            renderGroupSiteChart(businessData); // 그룹-사이트별 그래프 원본 데이터로 업데이트
            renderCountryCityChart(businessData); // 국가-도시별 그래프 원본 데이터로 업데이트
            renderEquipmentChart(businessData); // 장비별 그래프 원본 데이터로 업데이트
            renderEngineerTripCountChart(businessData); // 엔지니어 출장 횟수 분포 업데이트
            calculateCurrentEngineers(businessData);
        };

    // 도시 필터 옵션 업데이트 함수
    const updateCityOptions = (country) => {
        const citySelect = document.getElementById('search-city');
        citySelect.innerHTML = '<option value="SELECT">City</option>';

        const cityOptions = {
            USA: ['Portland', 'Arizona'],
            Ireland: ['Leixlip'],
            Japan: ['Hiroshima'],
            China: ['Wuxi', 'Xian', 'Shanghai', 'Beijing'],
            Taiwan: ['Taichoung'],
            Singapore: ['Singapore'],
        };

        if (cityOptions[country]) {
            cityOptions[country].forEach(city => {
                const option = document.createElement('option');
                option.value = city;
                option.textContent = city;
                citySelect.appendChild(option);
            });
        }
    };

    let yearlyTripsChart = null;
let groupSiteChart = null;
let countryCityChart = null;
let equipmentChart = null;
let engineerTripCountChart = null;

const renderYearlyTripsChart = (data) => {
    const ctx = document.getElementById('yearly-trips-chart').getContext('2d');
    const years = Array.from({ length: 2025 - 2018 + 1 }, (_, i) => 2018 + i);
    const tripsPerYear = years.map(year =>
        data.filter(trip => new Date(trip.START_DATE).getFullYear() === year).length
    );

    // 기존 그래프 삭제
    if (yearlyTripsChart) {
        yearlyTripsChart.destroy();
    }

    // 새로운 그래프 생성
    yearlyTripsChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: years,
            datasets: [{
                label: 'Yearly Business Trips',
                data: tripsPerYear,
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Number of Trips'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Years'
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: (context) => `${context.raw} trips`
                    }
                },
                datalabels: {
                    color: 'black',
                    anchor: 'end',
                    align: 'end',
                    font: { size: 12 }
                }
            }
        },
        plugins: [ChartDataLabels]
    });
};
    
const renderGroupSiteChart = (data) => {
    const ctx = document.getElementById('group-site-chart').getContext('2d');
    const groupSitePairs = ['PEE1-PT', 'PEE1-HS', 'PEE1-IC', 'PEE1-CJ', 'PEE2-PT', 'PEE2-HS', 'PSKH-PSKH'];
    const tripsPerGroupSite = groupSitePairs.map(pair => {
        const [group, site] = pair.split('-');
        return data.filter(trip => trip.GROUP === group && trip.SITE === site).length;
    });

    // 기존 그래프 삭제
    if (groupSiteChart) {
        groupSiteChart.destroy();
    }

    // 새로운 그래프 생성
    groupSiteChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: groupSitePairs,
            datasets: [{
                label: 'Trips per Group-Site',
                data: tripsPerGroupSite,
                backgroundColor: 'rgba(153, 102, 255, 0.2)',
                borderColor: 'rgba(153, 102, 255, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Number of Trips'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Group-Site'
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: (context) => `${context.raw} trips`
                    }
                },
                datalabels: {
                    color: 'black',
                    anchor: 'end',
                    align: 'end',
                    font: { size: 12 }
                }
            }
        },
        plugins: [ChartDataLabels]
    });
};
    
    const renderCountryCityChart = (data) => {
        const ctx = document.getElementById('country-city-chart').getContext('2d');
        const countryCityPairs = [...new Set(data.map(trip => `${trip.COUNTRY}-${trip.CITY}`))];
        const tripsPerCountryCity = countryCityPairs.map(pair => {
            const [country, city] = pair.split('-');
            return data.filter(trip => trip.COUNTRY === country && trip.CITY === city).length;
        });

        if (countryCityChart) {
            countryCityChart.destroy();
        }
    
        countryCityChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: countryCityPairs,
                datasets: [{
                    label: 'Trips per Country-City',
                    data: tripsPerCountryCity,
                    backgroundColor: 'rgba(255, 159, 64, 0.2)',
                    borderColor: 'rgba(255, 159, 64, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Number of Trips'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Country-City'
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: (context) => `${context.raw} trips`
                        }
                    },
                    datalabels: {
                        color: 'black',
                        anchor: 'end',
                        align: 'end',
                        font: { size: 12 }
                    }
                }
            },
            plugins: [ChartDataLabels]
        });
    };
    
    const renderEquipmentChart = (data) => {
        const ctx = document.getElementById('equipment-chart').getContext('2d');
        const equipmentTypes = [...new Set(data.map(trip => trip.EQUIPMENT))];
        const tripsPerEquipment = equipmentTypes.map(equipment =>
            data.filter(trip => trip.EQUIPMENT === equipment).length
        );

        if (equipmentChart) {
            equipmentChart.destroy();
        }
    
        equipmentChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: equipmentTypes,
                datasets: [{
                    label: 'Trips per Equipment',
                    data: tripsPerEquipment,
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Number of Trips'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Equipment'
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: (context) => `${context.raw} trips`
                        }
                    },
                    datalabels: {
                        color: 'black',
                        anchor: 'end',
                        align: 'end',
                        font: { size: 12 }
                    }
                }
            },
            plugins: [ChartDataLabels]
        });
    };
    
    const renderEngineerTripCountChart = (data) => {
        const ctx = document.getElementById('engineer-trip-count-chart').getContext('2d');
        const tripCounts = data.reduce((acc, trip) => {
            acc[trip.NAME] = (acc[trip.NAME] || 0) + 1;
            return acc;
        }, {});
        const countCategories = [1, 2, 3, 4, '5+'];
        const counts = countCategories.map(category => {
            if (category === '5+') {
                return Object.values(tripCounts).filter(count => count >= 5).length;
            }
            return Object.values(tripCounts).filter(count => count === category).length;
        });

        if (engineerTripCountChart) {
            engineerTripCountChart.destroy();
        }
    
        engineerTripCountChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: countCategories,
                datasets: [{
                    label: 'Engineer Trip Count',
                    data: counts,
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Number of Engineers'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Trip Count Categories'
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: (context) => `${context.raw} engineers`
                        }
                    },
                    datalabels: {
                        color: 'black',
                        anchor: 'end',
                        align: 'end',
                        font: { size: 12 }
                    }
                }
            },
            plugins: [ChartDataLabels]
        });
    };
    

    // 이벤트 리스너 추가
    document.getElementById('search-button').addEventListener('click', filterData);
    document.getElementById('reset-button').addEventListener('click', resetFilters);

    document.getElementById('search-country').addEventListener('change', (event) => {
        const country = event.target.value;
        updateCityOptions(country);
    });

    fetchTrips();
});


document.getElementById('export-button').addEventListener('click', () => {
    if (!businessData || businessData.length === 0) {
        alert('No data available to export!');
        return;
    }

    // 데이터를 워크시트로 변환
    const worksheetData = businessData.map((trip) => ({
        ID: trip.id,
        Name: trip.NAME,
        Group: trip.GROUP,
        Site: trip.SITE,
        Country: trip.COUNTRY,
        City: trip.CITY,
        Customer: trip.CUSTOMER,
        Equipment: trip.EQUIPMENT,
        'Start Date': trip.START_DATE.split('T')[0],
        'End Date': trip.END_DATE.split('T')[0],
    }));

    // 워크시트 및 워크북 생성
    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Business Trips');

    // 엑셀 파일 다운로드
    XLSX.writeFile(workbook, 'Business_Trips.xlsx');
});