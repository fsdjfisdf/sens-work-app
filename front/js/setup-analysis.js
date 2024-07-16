document.addEventListener('DOMContentLoaded', async () => {
    const logs = JSON.parse(localStorage.getItem('logs')) || [];
    const engineers = JSON.parse(localStorage.getItem('engineers')) || [];

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
    const resetFiltersButton = document.getElementById('resetButton');

    let setupItemCountChart, setupItemDurationChart, setupItemAvgDurationChart;

    const setupItemOrder = [
        "INSTALLATION PREPARATION", "FAB IN", "DOCKING", "CABLE HOOK UP",
        "PUMP CABLE HOOK UP", "CABLE HOOK UP : SILICON", "POWER TURN ON",
        "UTILITY TURN ON", "GAS TURN ON", "LEVELING", "TEACHING",
        "PART INSTALLATION", "LEAK CHECK", "TTTM", 
        "CUSTOMER CERTIFICATION 중간 인증 준비",
        "CUSTOMER CERTIFICATION(PIO 장착)",
        "CUSTOMER CERTIFICATION 사전 중간 인증",
        "CUSTOMER CERTIFICATION 중간 인증",
        "PROCESS CONFIRM", "MAINTENANCE"
    ];

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

        renderCharts(logs, filteredLogs);
    });

    resetFiltersButton.addEventListener('click', () => {
        filterGroup.value = '';
        filterSite.value = '';
        filterEngineer.value = '';
        filterStartDate.value = '';
        filterEndDate.value = '';
        renderCharts(logs, logs);
    });

    function renderCharts(allLogs, filteredLogs) {
        const setupItemCounts = {};
        const setupItemDurations = {};

        function processLogs(logs, counts, durations) {
            logs.forEach(log => {
                const setupItem = log.setup_item ? log.setup_item.trim().toUpperCase() : '';
                if (setupItem === 'SELECT' || !setupItem) return;

                const durationParts = log.task_duration.split(':');
                const hours = parseInt(durationParts[0], 10);
                const minutes = parseInt(durationParts[1], 10);
                const taskDurationMinutes = (hours * 60) + minutes;

                if (!counts[setupItem]) {
                    counts[setupItem] = 0;
                    durations[setupItem] = 0;
                }
                counts[setupItem] += 1;
                durations[setupItem] += taskDurationMinutes;
            });
        }

        processLogs(filteredLogs, setupItemCounts, setupItemDurations);

        const setupItemLabels = setupItemOrder.filter(item => setupItemCounts[item]);
        const setupItemCountData = setupItemLabels.map(item => setupItemCounts[item] || 0);
        const setupItemDurationData = setupItemLabels.map(item => (setupItemDurations[item] / 60).toFixed(1));
        
        const overallSetupItemCounts = {};
        const overallSetupItemDurations = {};
        processLogs(allLogs, overallSetupItemCounts, overallSetupItemDurations);
        const overallSetupItemAvgDurationData = setupItemLabels.map(item => (overallSetupItemDurations[item] / overallSetupItemCounts[item] / 60).toFixed(1));
        const setupItemAvgDurationData = setupItemLabels.map(item => (setupItemDurations[item] / setupItemCounts[item] / 60).toFixed(1));

        const countMax = Math.max(...setupItemCountData);
        const durationMax = Math.max(...setupItemDurationData);
        const avgDurationMax = Math.max(...setupItemAvgDurationData, ...overallSetupItemAvgDurationData);
        const countMaxValue = Math.ceil(countMax * 1.2);
        const durationMaxValue = Math.ceil(durationMax * 1.2);
        const avgDurationMaxValue = Math.ceil(avgDurationMax * 1.2);

        if (setupItemCountChart) setupItemCountChart.destroy();
        if (setupItemDurationChart) setupItemDurationChart.destroy();
        if (setupItemAvgDurationChart) setupItemAvgDurationChart.destroy();

        const ctxCount = document.getElementById('setupItemCountChart').getContext('2d');
        setupItemCountChart = new Chart(ctxCount, {
            type: 'bar',
            data: {
                labels: setupItemLabels,
                datasets: [
                    {
                        label: 'Count of Logs',
                        data: setupItemCountData,
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom'
                    },
                    datalabels: {
                        display: true,
                        color: 'black',
                        align: 'end',
                        anchor: 'end'
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Setup Item'
                        },
                        ticks: {
                            maxRotation: 90,
                            minRotation: 45,
                            autoSkip: false
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

        const ctxDuration = document.getElementById('setupItemDurationChart').getContext('2d');
        setupItemDurationChart = new Chart(ctxDuration, {
            type: 'bar',
            data: {
                labels: setupItemLabels,
                datasets: [
                    {
                        label: 'Total Duration of Logs (hours)',
                        data: setupItemDurationData,
                        backgroundColor: 'rgba(153, 102, 255, 0.2)',
                        borderColor: 'rgba(153, 102, 255, 1)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom'
                    },
                    datalabels: {
                        display: true,
                        color: 'black',
                        align: 'end',
                        anchor: 'end'
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Setup Item'
                        },
                        ticks: {
                            maxRotation: 90,
                            minRotation: 45,
                            autoSkip: false
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

        const ctxAvgDuration = document.getElementById('setupItemAvgDurationChart').getContext('2d');
        setupItemAvgDurationChart = new Chart(ctxAvgDuration, {
            type: 'bar',
            data: {
                labels: setupItemLabels,
                datasets: [
                    {
                        label: 'Average Duration per Log (Filtered) (hours)',
                        data: setupItemAvgDurationData,
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Average Duration per Log (Overall) (hours)',
                        data: overallSetupItemAvgDurationData,
                        backgroundColor: 'rgba(153, 102, 255, 0.2)',
                        borderColor: 'rgba(153, 102, 255, 1)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom'
                    },
                    datalabels: {
                        display: true,
                        color: 'black',
                        align: 'end',
                        anchor: 'end'
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Setup Item'
                        },
                        ticks: {
                            maxRotation: 90,
                            minRotation: 45,
                            autoSkip: false
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

    renderCharts(logs, logs);
});
