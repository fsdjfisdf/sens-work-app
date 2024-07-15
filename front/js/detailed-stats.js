document.addEventListener('DOMContentLoaded', () => {
    const date = localStorage.getItem('selectedDate');
    const dailyLogs = JSON.parse(localStorage.getItem('dailyLogs'));

    if (!dailyLogs || dailyLogs.length === 0) {
        console.error('No logs data available');
        return;
    }

    const dateTitle = document.getElementById('date-title');
    dateTitle.textContent = `Detailed Stats for ${date}`;

    const workTypeSummary = document.getElementById('work-type-summary');
    const logsSummary = document.getElementById('logs-summary');

    const workTypeCounts = { 'SET UP': 0, 'MAINT': 0, 'RELOCATION': 0 };
    const workTypeDurations = { 'SET UP': 0, 'MAINT': 0, 'RELOCATION': 0 };
    let totalDuration = 0;

    dailyLogs.forEach(log => {
        const durationParts = log.task_duration.split(':');
        const hours = parseInt(durationParts[0], 10);
        const minutes = parseInt(durationParts[1], 10);
        const taskDurationMinutes = (hours * 60) + minutes;
        const numWorkers = log.task_man.split(',').length;
        const totalTaskDuration = taskDurationMinutes * numWorkers;

        totalDuration += totalTaskDuration;
        const workType = log.work_type.trim().toUpperCase();
        if (workTypeCounts[workType] !== undefined) {
            workTypeCounts[workType] += 1;
            workTypeDurations[workType] += totalTaskDuration;
        }
    });

    const totalLogs = dailyLogs.length;
    const totalHours = Math.floor(totalDuration / 60);
    const totalMinutes = totalDuration % 60;

    workTypeSummary.innerHTML = `
        <div class="summary-item"><strong>Total Logs:</strong> ${totalLogs}</div>
        <div class="summary-item"><strong>Total Duration:</strong> ${totalHours}h ${totalMinutes}min</div>
    `;

    Object.keys(workTypeCounts).forEach(type => {
        const count = workTypeCounts[type];
        const duration = workTypeDurations[type];
        const hours = Math.floor(duration / 60);
        const minutes = duration % 60;
        const percentage = totalDuration > 0 ? ((duration / totalDuration) * 100).toFixed(1) : '0.0';
        logsSummary.innerHTML += `
            <div class="work-type-item">
                <h3>${type}</h3>
                <p><strong>Count:</strong> ${count}</p>
                <p><strong>Duration:</strong> ${hours}h ${minutes}min</p>
                <p><strong>Percentage:</strong> ${percentage}%</p>
            </div>
        `;
    });

    // Create charts
    const workTypeLabels = Object.keys(workTypeCounts);
    const workTypeCountData = Object.values(workTypeCounts);
    const workTypeDurationData = Object.values(workTypeDurations).map(duration => (duration / 60).toFixed(1)); // Convert minutes to hours
    const workTypeCountPercentageData = Object.values(workTypeCounts).map(count => totalLogs > 0 ? ((count / totalLogs) * 100).toFixed(1) : '0.0');
    const workTypeDurationPercentageData = Object.values(workTypeDurations).map(duration => totalDuration > 0 ? ((duration / totalDuration) * 100).toFixed(1) : '0.0');

    // Calculate y-axis max value
    const countMax = Math.max(...workTypeCountData);
    const durationMax = Math.max(...workTypeDurationData);
    const countMaxValue = Math.ceil(countMax * 1.2);
    const durationMaxValue = Math.ceil(durationMax * 1.2);

    // Count Chart
    const ctxCount = document.getElementById('workTypeCountChart').getContext('2d');
    new Chart(ctxCount, {
        type: 'bar',
        data: {
            labels: workTypeLabels,
            datasets: [{
                label: 'Count of Logs',
                data: workTypeCountData,
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                datalabels: {
                    anchor: 'end',
                    align: 'end',
                    formatter: (value, context) => `${value} (${workTypeCountPercentageData[context.dataIndex]}%)`,
                    font: {
                        weight: 'bold'
                    },
                    color: 'black'
                },
                legend: {
                    display: true,
                    position: 'bottom'
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Work Type'
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
        },
        plugins: [ChartDataLabels]
    });

    // Duration Chart
    const ctxDuration = document.getElementById('workTypeDurationChart').getContext('2d');
    new Chart(ctxDuration, {
        type: 'bar',
        data: {
            labels: workTypeLabels,
            datasets: [{
                label: 'Duration of Logs (hours)',
                data: workTypeDurationData,
                backgroundColor: 'rgba(153, 102, 255, 0.2)',
                borderColor: 'rgba(153, 102, 255, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                datalabels: {
                    anchor: 'end',
                    align: 'end',
                    formatter: (value, context) => `${value}h (${workTypeDurationPercentageData[context.dataIndex]}%)`,
                    font: {
                        weight: 'bold'
                    },
                    color: 'black'
                },
                legend: {
                    display: true,
                    position: 'bottom'
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Work Type'
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
        },
        plugins: [ChartDataLabels]
    });
});
