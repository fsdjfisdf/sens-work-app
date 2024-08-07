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
    const resetFiltersButton = document.getElementById('resetFilters');

    let transferItemCountChart, transferItemDurationChart, transferItemAvgDurationChart;

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
        const transferItemCounts = {};
        const transferItemDurations = {};

        function processLogs(logs, counts, durations) {
            logs.forEach(log => {
                const transferItem = log.transfer_item ? log.transfer_item.trim().toUpperCase() : '';
                if (transferItem === 'SELECT' || !transferItem) return;

                const durationParts = log.task_duration.split(':');
                const hours = parseInt(durationParts[0], 10);
                const minutes = parseInt(durationParts[1], 10);
                const taskDurationMinutes = (hours * 60) + minutes;

                if (!counts[transferItem]) {
                    counts[transferItem] = 0;
                    durations[transferItem] = 0;
                }
                counts[transferItem] += 1;
                durations[transferItem] += taskDurationMinutes;
            });
        }

        processLogs(filteredLogs, transferItemCounts, transferItemDurations);

        const transferItemLabels = Object.keys(transferItemCounts);
        const transferItemCountData = transferItemLabels.map(item => transferItemCounts[item] || 0);
        const transferItemDurationData = transferItemLabels.map(item => (transferItemDurations[item] / 60).toFixed(1));

        const overallTransferItemCounts = {};
        const overallTransferItemDurations = {};
        processLogs(allLogs, overallTransferItemCounts, overallTransferItemDurations);
        const overallTransferItemAvgDurationData = transferItemLabels.map(item => (overallTransferItemDurations[item] / overallTransferItemCounts[item] / 60).toFixed(1));
        const transferItemAvgDurationData = transferItemLabels.map(item => (transferItemDurations[item] / transferItemCounts[item] / 60).toFixed(1));

        const countMax = Math.max(...transferItemCountData);
        const durationMax = Math.max(...transferItemDurationData);
        const avgDurationMax = Math.max(...transferItemAvgDurationData, ...overallTransferItemAvgDurationData);
        const countMaxValue = Math.ceil(countMax * 1.2);
        const durationMaxValue = Math.ceil(durationMax * 1.2);
        const avgDurationMaxValue = Math.ceil(avgDurationMax * 1.2);

        if (transferItemCountChart) transferItemCountChart.destroy();
        if (transferItemDurationChart) transferItemDurationChart.destroy();
        if (transferItemAvgDurationChart) transferItemAvgDurationChart.destroy();

        const ctxCount = document.getElementById('transferItemCountChart').getContext('2d');
        transferItemCountChart = new Chart(ctxCount, {
            type: 'bar',
            data: {
                labels: transferItemLabels,
                datasets: [
                    {
                        label: 'Count of Logs',
                        data: transferItemCountData,
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
                            text: 'Transfer Item'
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

        const ctxDuration = document.getElementById('transferItemDurationChart').getContext('2d');
        transferItemDurationChart = new Chart(ctxDuration, {
            type: 'bar',
            data: {
                labels: transferItemLabels,
                datasets: [
                    {
                        label: 'Total Duration of Logs (hours)',
                        data: transferItemDurationData,
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
                            text: 'Transfer Item'
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

        const ctxAvgDuration = document.getElementById('transferItemAvgDurationChart').getContext('2d');
        transferItemAvgDurationChart = new Chart(ctxAvgDuration, {
            type: 'bar',
            data: {
                labels: transferItemLabels,
                datasets: [
                    {
                        label: 'Average Duration per Log (Filtered) (hours)',
                        data: transferItemAvgDurationData,
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Average Duration per Log (Overall) (hours)',
                        data: overallTransferItemAvgDurationData,
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
                            text: 'Transfer Item'
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
