document.addEventListener('DOMContentLoaded', async () => {
    let logs = JSON.parse(localStorage.getItem('logs')) || [];
    let engineers = JSON.parse(localStorage.getItem('engineers')) || [];

    if (logs.length === 0) {
        console.error('No logs data available');
        return;
    }

    const filterGroup = document.getElementById('filterGroup');
    const filterSite = document.getElementById('filterSite');
    const filterEngineer = document.getElementById('filterEngineer');
    const filterStartDate = document.getElementById('filterStartDate');
    const filterEndDate = document.getElementById('filterEndDate');
    const applyFiltersButton = document.getElementById('applyFilters');
    const resetFiltersButton = document.getElementById('resetFilters');

    let countChartInstance = null;
    let durationChartInstance = null;
    let avgDurationChartInstance = null;

    applyFiltersButton.addEventListener('click', () => {
        const selectedGroup = filterGroup.value;
        const selectedSite = filterSite.value;
        const selectedEngineer = filterEngineer.value.toLowerCase();
        const startDate = filterStartDate.value;
        const endDate = filterEndDate.value;

        const filteredLogs = logs.filter(log => {
            const logDate = new Date(log.task_date);
            const startDateMatch = !startDate || logDate >= new Date(startDate);
            const endDateMatch = !endDate || logDate <= new Date(endDate);
            const groupMatch = !selectedGroup || log.group === selectedGroup;
            const siteMatch = !selectedSite || log.site === selectedSite;
            const engineerMatch = !selectedEngineer || log.task_man.toLowerCase().includes(selectedEngineer);
            return startDateMatch && endDateMatch && groupMatch && siteMatch && engineerMatch;
        });

        renderCharts(filteredLogs);
    });

    resetFiltersButton.addEventListener('click', () => {
        filterGroup.value = '';
        filterSite.value = '';
        filterEngineer.value = '';
        filterStartDate.value = '';
        filterEndDate.value = '';
        renderCharts(logs);
    });

    function renderCharts(logs) {
        const transferItemCounts = {};
        const transferItemDurations = {};

        logs.forEach(log => {
            const transferItem = log.transfer_item ? log.transfer_item.trim().toUpperCase() : '';
            if (transferItem === 'SELECT' || !transferItem) return;

            const durationParts = log.task_duration.split(':');
            const hours = parseInt(durationParts[0], 10);
            const minutes = parseInt(durationParts[1], 10);
            const taskDurationMinutes = (hours * 60) + minutes;

            if (!transferItemCounts[transferItem]) {
                transferItemCounts[transferItem] = 0;
                transferItemDurations[transferItem] = 0;
            }
            transferItemCounts[transferItem] += 1;
            transferItemDurations[transferItem] += taskDurationMinutes;
        });

        const transferItemLabels = Object.keys(transferItemCounts);
        const transferItemCountData = transferItemLabels.map(item => transferItemCounts[item]);
        const transferItemDurationData = transferItemLabels.map(item => (transferItemDurations[item] / 60).toFixed(1));
        const transferItemAvgDurationData = transferItemLabels.map(item => (transferItemDurations[item] / transferItemCounts[item] / 60).toFixed(1));

        const countMax = Math.max(...transferItemCountData);
        const durationMax = Math.max(...transferItemDurationData);
        const avgDurationMax = Math.max(...transferItemAvgDurationData);
        const countMaxValue = Math.ceil(countMax * 1.2);
        const durationMaxValue = Math.ceil(durationMax * 1.2);
        const avgDurationMaxValue = Math.ceil(avgDurationMax * 1.2);

        // Destroy previous chart instances if they exist
        if (countChartInstance) {
            countChartInstance.destroy();
        }
        if (durationChartInstance) {
            durationChartInstance.destroy();
        }
        if (avgDurationChartInstance) {
            avgDurationChartInstance.destroy();
        }

        // Count Chart
        const ctxCount = document.getElementById('transferItemCountChart').getContext('2d');
        countChartInstance = new Chart(ctxCount, {
            type: 'bar',
            data: {
                labels: transferItemLabels,
                datasets: [{
                    label: 'Count of Logs',
                    data: transferItemCountData,
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom'
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Transfer Item'
                        },
                        ticks: {
                            autoSkip: false,
                            maxRotation: 90,
                            minRotation: 90
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Count'
                        },
                        beginAtZero: true,
                        max: countMaxValue
                    }
                }
            }
        });

        // Duration Chart
        const ctxDuration = document.getElementById('transferItemDurationChart').getContext('2d');
        durationChartInstance = new Chart(ctxDuration, {
            type: 'bar',
            data: {
                labels: transferItemLabels,
                datasets: [{
                    label: 'Total Duration of Logs (hours)',
                    data: transferItemDurationData,
                    backgroundColor: 'rgba(153, 102, 255, 0.2)',
                    borderColor: 'rgba(153, 102, 255, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom'
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Transfer Item'
                        },
                        ticks: {
                            autoSkip: false,
                            maxRotation: 90,
                            minRotation: 90
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Duration (hours)'
                        },
                        beginAtZero: true,
                        max: durationMaxValue
                    }
                }
            }
        });

        // Average Duration Chart
        const ctxAvgDuration = document.getElementById('transferItemAvgDurationChart').getContext('2d');
        avgDurationChartInstance = new Chart(ctxAvgDuration, {
            type: 'bar',
            data: {
                labels: transferItemLabels,
                datasets: [{
                    label: 'Average Duration per Log (hours)',
                    data: transferItemAvgDurationData,
                    backgroundColor: 'rgba(255, 159, 64, 0.2)',
                    borderColor: 'rgba(255, 159, 64, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom'
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Transfer Item'
                        },
                        ticks: {
                            autoSkip: false,
                            maxRotation: 90,
                            minRotation: 90
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Average Duration (hours)'
                        },
                        beginAtZero: true,
                        max: avgDurationMaxValue
                    }
                }
            }
        });
    }

    renderCharts(logs);
});
