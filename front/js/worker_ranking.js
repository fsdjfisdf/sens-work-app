let workLogs = [];
let taskCountChart, workTimeChart;

document.addEventListener('DOMContentLoaded', async () => {
        const userRole = localStorage.getItem('user-role');
    console.log("User role:", userRole); // role 정보를 콘솔에 출력
    if (userRole !== 'admin') {
        alert("접근 권한이 없습니다.");
        window.location.replace("./index.html");
        return;
    }
  const res = await fetch("http://13.125.122.202:3001/logs");
  workLogs = await res.json();
  updateCharts(workLogs);

  document.getElementById('searchBtn').addEventListener('click', filterAndUpdate);
  document.getElementById('resetBtn').addEventListener('click', () => {
    document.getElementById('startDate').value = '';
    document.getElementById('endDate').value = '';
    document.getElementById('groupSelect').value = '';
    document.getElementById('siteSelect').value = '';
    updateCharts(workLogs);
  });
});

function filterAndUpdate() {
  const start = document.getElementById('startDate').value;
  const end = document.getElementById('endDate').value;
  const group = document.getElementById('groupSelect').value;
  const site = document.getElementById('siteSelect').value;

  const filtered = workLogs.filter(log => {
    const date = log.task_date;
    return (!start || date >= start) &&
           (!end || date <= end) &&
           (!group || log.group === group) &&
           (!site || log.site === site);
  });

  updateCharts(filtered);
}

function calculateDailyAverages(logs) {
  const timeMap = {};      // 총 작업 시간 (분)
  const countMap = {};     // 총 작업 건수
  const dateSetMap = {};   // 작업한 날짜 수

  logs.forEach(log => {
    const workers = log.task_man?.split(',').map(w => w.split('(')[0].trim()) || [];
    const [h, m] = log.task_duration.split(':').map(Number);
    const totalMin = h * 60 + m;
    const date = log.task_date;

    workers.forEach(worker => {
      timeMap[worker] = (timeMap[worker] || 0) + totalMin;
      countMap[worker] = (countMap[worker] || 0) + 1;
      if (!dateSetMap[worker]) dateSetMap[worker] = new Set();
      dateSetMap[worker].add(date);
    });
  });

  const labels = Object.keys(timeMap);
  const avgTimeData = [];
  const avgCountData = [];

  labels.forEach(worker => {
    const dayCount = dateSetMap[worker].size || 1;
    avgTimeData.push((timeMap[worker] / dayCount) / 60); // 시간
    avgCountData.push(countMap[worker] / dayCount);      // 건수
  });

  const avgOfAvgTime = avgTimeData.reduce((a, b) => a + b, 0) / avgTimeData.length;
  const avgOfAvgCount = avgCountData.reduce((a, b) => a + b, 0) / avgCountData.length;

  return {
    labels,
    avgTimeData,
    avgCountData,
    avgOfAvgTime,
    avgOfAvgCount
  };
}


function updateCharts(logs) {
  const taskCounts = {};
  const workTimes = {};

  logs.forEach(log => {
    const duration = log.task_duration || '00:00:00';
    const [h, m] = duration.split(':').map(Number);
    const totalMin = h * 60 + m;

    const workers = log.task_man?.split(',').map(w => w.split('(')[0].trim());
    if (!workers) return;

    workers.forEach(worker => {
      taskCounts[worker] = (taskCounts[worker] || 0) + 1;
      workTimes[worker] = (workTimes[worker] || 0) + totalMin;
    });
  });

  const labels = Object.keys(taskCounts);
  const taskData = labels.map(name => taskCounts[name]);
  const timeData = labels.map(name => workTimes[name]);

  const avgTask = taskData.reduce((a, b) => a + b, 0) / taskData.length || 0;
  const avgTime = timeData.reduce((a, b) => a + b, 0) / timeData.length || 0;

  renderChart('taskCountChart', labels, taskData, avgTask, '작업 건수 (건)');
  renderChart('workTimeChart', labels, timeData.map(m => m / 60), avgTime / 60, '작업 시간 (시간)');
}

function renderChart(canvasId, labels, data, average, label) {
  // 값 높은 순 정렬
  const combined = labels.map((label, i) => ({
    label,
    value: data[i]
  })).sort((a, b) => b.value - a.value);

  const sortedLabels = combined.map(item => item.label);
  const sortedData = combined.map(item => item.value);

  const ctx = document.getElementById(canvasId).getContext('2d');

  if (canvasId === 'taskCountChart' && taskCountChart) taskCountChart.destroy();
  if (canvasId === 'workTimeChart' && workTimeChart) workTimeChart.destroy();

  const chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: sortedLabels,
      datasets: [
        {
          label: label,
          data: sortedData,
          backgroundColor: '#3a3a3a',
        },
        {
          label: `평균 (${average.toFixed(1)}${label.includes('건') ? '건' : '시간'})`,
          data: new Array(sortedLabels.length).fill(average),
          type: 'line',
          borderColor: 'red',
          borderWidth: 2,
          fill: false,
          pointRadius: 0,
          datalabels: {
            align: 'end',
            anchor: 'end',
            display: (ctx) => ctx.dataIndex === ctx.chart.data.labels.length - 1, // 마지막에만 표시
            formatter: () => `${average.toFixed(1)}${label.includes('건') ? '건' : '시간'}`,
            color: 'red',
            font: { weight: 'bold' }
          }
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: true },
        tooltip: {
          callbacks: {
            label: function (context) {
              return `${context.dataset.label}: ${context.raw.toFixed(1)}${label.includes('건') ? '건' : '시간'}`;
            }
          }
        },
        datalabels: {
          display: false // 👈 작업자 데이터 라벨 숨김
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: label }
        }
      }
    },
    plugins: [ChartDataLabels]
  });

  if (canvasId === 'taskCountChart') taskCountChart = chart;
  else workTimeChart = chart;
}