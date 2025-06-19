document.addEventListener('DOMContentLoaded', async () => {
  const userInfo = await loadUserInfo();  // loadUserInfo 함수에서 반환된 userInfo를 기다림
  const workLogs = await loadWorkLogs(); // 작업 이력을 가져오고 변수에 저장
  const monthlyHours = calculateMonthlyWorkHoursByMonth(workLogs); // 월별 작업 시간을 계산

  const today = new Date();
  const todayString = today.toISOString().split('T')[0];
  
  // 최초 작업 날짜 구하기
  const firstLogDate = new Date(Math.min(...workLogs.map(log => new Date(log.task_date))));
  const firstLogDateString = firstLogDate.toISOString().split('T')[0]; // 최초 작업 날짜

  renderMonthlyWorkHoursChart(monthlyHours); // 그래프 렌더링

  // 작업 시작 시간별 AM/PM 계산
  const { amCount, pmCount } = calculateTaskStartTime(workLogs);
  
  // AM/PM 작업 수로 차트 렌더링
  renderTaskStartTimeChart(amCount, pmCount);

  // Regular vs Overtime 계산
  const { regularCount, overtimeCount } = calculateRegularVsOvertime(workLogs);
  
  // Regular vs Overtime 차트 렌더링
  renderRegularVsOvertimeChart(regularCount, overtimeCount);

  // 작업 시간 범위 계산
  const timeRanges = calculateTaskDurationRanges(workLogs);
  
  // 작업 시간 범위 차트 렌더링
  renderTimeRangeChart(timeRanges);

  // 0건, 1건, 2건, 3건 이상 작업한 날짜 수 계산
  const dailyWorkCount = calculateDailyWorkCount(workLogs, holidays, firstLogDateString, todayString);
  renderDailyWorkCountChart(dailyWorkCount); // 그래프 렌더링

  // 이번 달의 작업 시간만 계산하여 화면에 표시
  const currentMonthIndex = new Date().getMonth(); // 현재 달의 인덱스 (0: 1월, ..., 11: 12월)
  const currentMonthHours = monthlyHours[currentMonthIndex];
  document.getElementById('userMonthlyHours').textContent = `${currentMonthHours.toFixed(2)} 시간`;

  await calculateAndRenderUserRanking();

  const workTypeCounts = calculateWorkTypeCounts(workLogs);
  renderWorkTypeChart(workTypeCounts);

  // 설비 유형별 작업 건수 그래프 생성
  const equipmentTypeCounts = calculateEquipmentTypeCounts(workLogs);
  renderEquipmentTypeChart(equipmentTypeCounts);

  // 공휴일을 주말에 포함하도록 holidays 배열을 전달
  const averageHours = calculateAverageWorkingHoursByDayType(workLogs, holidays);
  renderAverageWorkingHoursChart(averageHours);

  // 사용자 작업 건수 계산 및 랭킹 생성
  const userTaskCount = calculateUserTaskCount(workLogs);
  await calculateAndRenderUserTaskRanking(userTaskCount);

  const lineWorkCount = calculateLineWorkCount(workLogs);  // LINE별 작업 건수 계산
  renderLineWorkCountChart(lineWorkCount);  // LINE별 작업 건수 그래프 렌더링

  const groupWorkCount = calculateGroupWorkCount(workLogs);  // GROUP별 작업 건수 계산
  renderGroupWorkCountChart(groupWorkCount);  // GROUP별 작업 건수 그래프 렌더링

  const siteWorkCount = calculateSiteWorkCount(workLogs);  // SITE별 작업 건수 계산
  renderSiteWorkCountChart(siteWorkCount);  // SITE별 작업 건수 그래프 렌더링

  // WARRANTY별 작업 건수 계산
  const warrantyWorkCount = calculateWarrantyWorkCount(workLogs);

  // WARRANTY별 작업 건수 그래프 렌더링
  renderWarrantyWorkCountChart(warrantyWorkCount);

// 레벨 변화 데이터 계산
const { levelChanges, allQuarters } = await calculateLevelChange(userInfo);

// 레벨 변화 그래프 렌더링
renderLevelChangeChart(levelChanges, allQuarters);
});

let loggedInUserName = ''; // 로그인한 사용자의 이름을 저장할 변수

async function loadUserInfo() {
  const userName = document.getElementById('userName');
  const userGroup = document.getElementById('userGroup');
  const userSite = document.getElementById('userSite');
  const userHireDate = document.getElementById('userHireDate');
  const userLevel = document.getElementById('userLevel');
  const userMultiLevel = document.getElementById('userMultiLevel');
  const userMainEq = document.getElementById('userMainEq');
  const userMultiEq = document.getElementById('userMultiEq');

  const token = localStorage.getItem('x-access-token');
  if (!token) {
      alert('로그인이 필요합니다.');
      window.location.replace('./signin.html');
      return;
  }

  

  try {
      const response = await fetch('http://3.37.73.151:3001/user-info', {
          method: 'GET',
          headers: {
              'Content-Type': 'application/json',
              'x-access-token': token
          }
      });

      if (!response.ok) {
          throw new Error('Network response was not ok');
      }

// LEVEL 값을 변환하는 함수
function getFormattedLevel(level) {
  switch (level) {
      case 0:
          return '0';
      case 1:
          return '1-1';
      case 2:
          return '1-2';
      case 3:
          return '1-3';
      case 4:
          return '2';
      default:
          return `${level}`; // 기본적으로 원래 값 반환
  }
}

// MULTI LEVEL 값을 변환하는 함수
function getFormattedMultiLevel(level) {
  switch (level) {
      case 0:
          return '0';
      case 1:
          return '2-2';
      case 2:
          return '2-3';
      case 3:
          return '2-4';
      case 4:
          return '2-5';
      default:
          return `${level}`; // 기본적으로 원래 값 반환
  }
}

      const data = await response.json();
      if (data.isSuccess) {
          const userInfo = data.result;
          loggedInUserName = userInfo.NAME; // 로그인한 사용자의 이름 저장
          userName.textContent = `${userInfo.NAME}`;
          userGroup.textContent = `${userInfo.GROUP}`;
          userSite.textContent = `${userInfo.SITE}`;
          userHireDate.textContent = `${new Date(userInfo.HIRE).toLocaleDateString()}`;
          userLevel.textContent = getFormattedLevel(userInfo.LEVEL);
          userMultiLevel.textContent = getFormattedMultiLevel(userInfo['MULTI LEVEL']);
          userMainEq.textContent = `${userInfo['MAIN EQ']}`;
          userMultiEq.textContent = `${userInfo['MULTI EQ']}`;
  
        // 그래프 데이터
        const hireDate = new Date(userInfo.HIRE);
        const achievementData = [
          { label: 'Level 1-1', date: userInfo['Level1 Achieve'] ? new Date(userInfo['Level1 Achieve']) : null },
          { label: 'Level 1-2', date: userInfo['Level2 Achieve'] ? new Date(userInfo['Level2 Achieve']) : null },
          { label: 'Level 1-3', date: userInfo['Level3 Achieve'] ? new Date(userInfo['Level3 Achieve']) : null },
          { label: 'Level 2', date: userInfo['Level4 Achieve'] ? new Date(userInfo['Level4 Achieve']) : null }
        ].map(level => ({
          label: level.label,
          timeToAchieve: level.date ? calculateYearsMonths(hireDate, level.date) : null
        })).filter(level => level.timeToAchieve !== null);
  
        function calculateYearsMonths(startDate, endDate) {
          const totalMonths = (endDate.getFullYear() - startDate.getFullYear()) * 12 + (endDate.getMonth() - startDate.getMonth());
          const years = Math.floor(totalMonths / 12);
          const months = totalMonths % 12;
          return { years, months };
        }
  
        // CAPA 그래프 레이블 설정
        const mainEq = userInfo['MAIN EQ'];
        const multiEq = userInfo['MULTI EQ'];
        const multiSetUp = userInfo[`${multiEq} SET UP`];
        const multiMaint = userInfo[`${multiEq} MAINT`];
        const multiCapa = (multiSetUp + multiMaint) / 2;
        const capaLabels = [
          `${mainEq} SET UP CAPA`,
          `${mainEq} MAINT CAPA`,
          `${multiEq} CAPA`,
          'TOTAL CAPA'
        ];
  
        const capaData = {
          labels: capaLabels,
          datasets: [{
            label: 'CAPA Values',
            data: [
              (userInfo[`${mainEq} SET UP`] * 100).toFixed(1),
              (userInfo[`${mainEq} MAINT`] * 100).toFixed(1),
              (multiCapa * 100).toFixed(1),
              (userInfo['CAPA'] * 100).toFixed(1)
            ],
            backgroundColor: [
              'rgba(75, 192, 192, 0.2)',
              'rgba(153, 102, 255, 0.2)',
              'rgba(255, 206, 86, 0.2)',
              'rgba(54, 162, 235, 0.2)'
            ],
            borderColor: [
              'rgba(75, 192, 192, 1)',
              'rgba(153, 102, 255, 1)',
              'rgba(255, 206, 86, 1)',
              'rgba(54, 162, 235, 1)'
            ],
            borderWidth: 1
          }]
        };
  
        const currentMonthIndex = new Date().getMonth();
        const monthlyCapaLabels = ['24YJUL', '24YAUG', '24YSEP', '24YOCT', '24YNOV', '24YDEC','25YJAN', '25YFEB', '25YMAR', '25YAPR', '25YMAY'].slice(0,);
        const monthlyCapaData = monthlyCapaLabels.map(label => userInfo[label] ? (userInfo[label] * 100).toFixed(1) : 0);
  
        // 그래프 생성
        const achievementCtx = document.getElementById('achievementChart').getContext('2d');
        const capaCtx = document.getElementById('capaChart').getContext('2d');
        const monthlyCapaCtx = document.getElementById('monthlyCapaChart').getContext('2d');
  
        new Chart(achievementCtx, {
          type: 'bar',
          data: {
            labels: achievementData.map(level => level.label),
            datasets: [{
              label: 'Time to Achieve',
              data: achievementData.map(level => level.timeToAchieve.years + level.timeToAchieve.months / 12),
              backgroundColor: 'rgba(153, 102, 255, 0.2)',
              borderColor: 'rgba(153, 102, 255, 1)',
              borderWidth: 1,
              fill: true
            }]
          },
          options: {
            plugins: {
              datalabels: {
                formatter: (value, context) => {
                  const years = Math.floor(value);
                  const months = Math.round((value - years) * 12);
                  return `${years}Y ${months}M`;
                },
                color: 'black',
                font: {
                  size: 12
                },
                anchor: 'end',
                align: 'end'
              }
            },
            scales: {
              x: {
                title: {
                  display: true,
                  text: 'Level',
                  color: 'grey'
                },
                ticks: {
                  color: 'grey'
                }
              },
              y: {
                title: {
                  display: true,
                  text: 'Time (years)',
                  color: 'grey'
                },
                beginAtZero: true,
                ticks: {
                  color: 'grey',
                  callback: (value) => {
                    const years = Math.floor(value);
                    const months = Math.round((value - years) * 12);
                    return `${years}Y ${months}M`;
                  }
                }
              }
            }
          },
          plugins: [ChartDataLabels]
        });
  
        new Chart(capaCtx, {
          type: 'bar',
          data: capaData,
          options: {
            plugins: {
              datalabels: {
                formatter: (value, context) => `${value}%`,
                color: 'black',
                font: {
                  size: 12
                },
                anchor: 'end',
                align: 'end'
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  color: 'grey'
                }
              },
              x: {
                ticks: {
                  color: 'grey'
                }
              }
            }
          },
          plugins: [ChartDataLabels]
        });
  
        new Chart(monthlyCapaCtx, {
          type: 'line',
          data: {
            labels: monthlyCapaLabels.map(label => label.replace('24Y', '24Y ').replace('25Y', '25Y ')),
            datasets: [{
              label: 'Monthly CAPA',
              data: monthlyCapaData,
              backgroundColor: 'rgba(54, 162, 235, 0.2)',
              borderColor: 'rgba(54, 162, 235, 1)',
              borderWidth: 1,
              fill: true
            }]
          },
          options: {
            plugins: {
              datalabels: {
                formatter: (value, context) => `${value}%`,
                color: 'black',
                font: {
                  size: 12
                },
                anchor: 'end',
                align: 'end'
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  color: 'grey',
                  callback: (value) => `${value}%`
                }
              },
              x: {
                ticks: {
                  color: 'grey'
                }
              }
            }
          },
          plugins: [ChartDataLabels]
        });

        
        return userInfo;  // userInfo 반환
  
      } else {
        alert('사용자 정보를 가져오는데 실패했습니다.');
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
      alert('사용자 정보를 가져오는 중 오류가 발생했습니다.');
    }

    const viewAverageInfoButton = document.getElementById("view-average-info");

    if (viewAverageInfoButton) {
        viewAverageInfoButton.addEventListener("click", function() {
            window.location.href = "./SECM.html";
        });
    }
  }




// 입사일을 기준으로 분기 계산하는 함수
function getQuarter(date) {
  const month = date.getMonth() + 1; // 월(0-based index)
  if (month <= 3) return `Y${date.getFullYear()}-1Q`;
  if (month <= 6) return `Y${date.getFullYear()}-2Q`;
  if (month <= 9) return `Y${date.getFullYear()}-3Q`;
  return `Y${date.getFullYear()}-4Q`;
}

// 레벨 변화 계산 함수
async function calculateLevelChange(userInfo) {
  const hireDate = new Date(userInfo.HIRE);
  const levelDates = [
    { level: 1, date: userInfo['Level1 Achieve'] },
    { level: 2, date: userInfo['Level2 Achieve'] },
    { level: 3, date: userInfo['Level3 Achieve'] },
    { level: 4, date: userInfo['Level4 Achieve'] }
  ].filter(entry => entry.date !== null);

  const levelChanges = [];
  let currentLevel = 0;
  let currentDate = new Date(hireDate);

  // 입사일 이후 분기부터 시작
  levelChanges.push({
    level: currentLevel,
    quarter: getQuarter(currentDate),
    date: currentDate.toLocaleDateString()
  });

  let level4Quarter = null;

  // 각 레벨 달성 날짜에 따라 분기별 최대 레벨 추출
  levelDates.forEach(({ level, date }) => {
    const quarter = getQuarter(new Date(date));
    const existingEntry = levelChanges.find(entry => entry.quarter === quarter);

    if (existingEntry) {
      if (existingEntry.level < level) {
        existingEntry.level = level;
        existingEntry.date = new Date(date).toLocaleDateString();
      }
    } else {
      levelChanges.push({
        level: level,
        quarter: quarter,
        date: new Date(date).toLocaleDateString()
      });
    }

    // 레벨 4 달성 시 분기 기록
    if (level === 4) {
      level4Quarter = quarter;
    }
  });

  // 전체 분기 목록 생성 (레벨 4 달성 분기까지만 포함)
  const allQuarters = [];
  let startQuarter = getQuarter(hireDate);
  let endQuarter = level4Quarter || getQuarter(new Date());
  let startYear = parseInt(startQuarter.slice(1, 5));
  let endYear = parseInt(endQuarter.slice(1, 5));
  let startQuarterIndex = parseInt(startQuarter.slice(6, 7));
  let endQuarterIndex = parseInt(endQuarter.slice(6, 7));

  for (let year = startYear; year <= endYear; year++) {
    for (let quarter = startQuarterIndex; quarter <= 4; quarter++) {
      if (year === endYear && quarter > endQuarterIndex) break;
      allQuarters.push(`Y${year}-${quarter}Q`);
    }
    startQuarterIndex = 1;
  }

  return { levelChanges, allQuarters };
}



// 레벨 변화 그래프 렌더링 함수
async function renderLevelChangeChart(levelChangeData, allQuarters) {
  if (!levelChangeData || !allQuarters || allQuarters.length === 0) {
    console.error('Invalid data: levelChangeData or allQuarters is missing.');
    return;
  }

  console.log('Level Changes:', levelChangeData);
  console.log('All Quarters:', allQuarters);

  const labels = allQuarters;
  let currentLevel = 0;

  // 각 분기별로 레벨을 설정하면서 이전 레벨을 유지
  const levelData = allQuarters.map(quarter => {
    const matchingData = levelChangeData.find(item => item.quarter === quarter);
    if (matchingData) {
      currentLevel = matchingData.level; // 레벨 변경이 있는 경우 업데이트
    }
    return currentLevel; // 현재 레벨을 반환
  });

  const ctx = document.getElementById('levelChangeChart').getContext('2d');
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Level Progression',
        data: levelData,
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        fill: true,
        borderWidth: 2,
        pointRadius: 5,
        pointBackgroundColor: 'rgba(75, 192, 192, 1)',
      }]
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
          max: 5,  // 레벨은 최대 4까지
        }
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: (context) => {
              const level = context.raw;
              const date = levelChangeData.find(item => item.level === level)?.date || 'N/A';
              return `Level ${level} - Achieved on: ${date}`;
            }
          }
        },
        datalabels: {
          formatter: (value, context) => {
            // 레벨이 달성된 분기인지 확인
            const quarter = context.chart.data.labels[context.dataIndex];
            const achievedData = levelChangeData.find(item => item.quarter === quarter);
            if (achievedData) {
              const level = achievedData.level;
              const date = achievedData.date;
              return `Level ${level} (${date})`;
            }
            return ''; // 달성한 분기만 표시
          },
          color: 'black',
          font: {
            size: 12
          },
          anchor: 'end',
          align: 'end'
        }
      }
    },
    plugins: [ChartDataLabels]
  });
}





  async function loadWorkLogs() {
    const token = localStorage.getItem('x-access-token');
    if (!token) {
        alert('로그인이 필요합니다.');
        window.location.replace('./signin.html');
        return;
    }

    try {
        const response = await axios.get('http://3.37.73.151:3001/logs', {
            headers: { 'x-access-token': token }
        });

        const userLogs = response.data.filter(log => log.task_man.includes(loggedInUserName));
        const firstLogDate = new Date(Math.min(...userLogs.map(log => new Date(log.task_date))));
        const firstLogDateString = firstLogDate.toISOString().split('T')[0];  // 최초 작업 날짜
    

        return userLogs;
    } catch (error) {
        console.error('작업 로그를 불러오는 중 오류 발생:', error);
        return [];
    }
}

// 월별 작업 시간 계산 함수
function calculateMonthlyWorkHoursByMonth(workLogs) {
  const monthlyHours = Array(24).fill(0); // 2024년 6월 ~ 2025년 5월까지 24개월 배열

  workLogs.forEach(log => {
      const logDate = new Date(log.task_date);
      const logYear = logDate.getFullYear();
      const logMonth = logDate.getMonth();

      if (logYear === 2024) {
          monthlyHours[logMonth - 5] += log.task_duration ? parseFloat(log.task_duration) : 0;
      } else if (logYear === 2025) {
          monthlyHours[logMonth + 7] += log.task_duration ? parseFloat(log.task_duration) : 0;
      }
  });

  console.log("Monthly Hours Data:", monthlyHours); // 디버깅용
  return monthlyHours;
}

// 월별 작업 시간 그래프 생성 함수
function renderMonthlyWorkHoursChart(monthlyHours) {
  const maxHours = Math.max(...monthlyHours) * 1.2; // 최대값의 1.2배로 설정
  const labels = [
    '2024-06', '2024-07', '2024-08', '2024-09', '2024-10', '2024-11',
    '2024-12', '2025-01', '2025-02', '2025-03', '2025-04', '2025-05', '2025-06', '2025-07'
  ];

  const ctx = document.getElementById('monthlyWorkHoursChart').getContext('2d');
  new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,  // 새로운 X축 레이블 적용
        datasets: [{
            label: 'Monthly Working time (hrs)',
            data: monthlyHours.slice(0, 14), // 6월부터 다음 해 5월까지 데이터 추출
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1
        }]
    },
      options: {
          scales: {
              y: {
                  beginAtZero: true,
                  max: maxHours, // y축 최대값 설정
                  title: {
                      display: true,
                      text: 'Working Hours'
                  }
              }
          },
          plugins: {
              tooltip: {
                  callbacks: {
                      label: (context) => `${context.raw.toFixed(1)}h`
                  }
              },
              datalabels: {
                  formatter: (value) => `${value.toFixed(1)}h`, // 소수점 첫째 자리까지 표시
                  color: 'black',
                  anchor: 'end',
                  align: 'end'
              }
          }
      },
      plugins: [ChartDataLabels]
  });
}

async function calculateAndRenderUserRanking() {
  const token = localStorage.getItem('x-access-token');
  if (!token) return;

  try {
      const response = await axios.get('http://3.37.73.151:3001/logs', {
          headers: { 'x-access-token': token }
      });

      const currentMonth = new Date().getMonth();
      const allUserMonthlyHours = {};

      response.data.forEach(log => {
          const logMonth = new Date(log.task_date).getMonth();
          if (logMonth === currentMonth && log.task_duration) {
              const [hours, minutes, seconds] = log.task_duration.split(':').map(Number);
              const durationInHours = hours + minutes / 60 + seconds / 3600;

              const userNames = log.task_man.split(',').map(name => name.replace(/\(.*?\)/g, '').trim());

              userNames.forEach(userName => {
                  if (!allUserMonthlyHours[userName]) {
                      allUserMonthlyHours[userName] = 0;
                  }
                  allUserMonthlyHours[userName] += durationInHours;
              });
          }
      });

      const currentUserHours = allUserMonthlyHours[loggedInUserName] || 0;

      const sortedHours = Object.values(allUserMonthlyHours).sort((a, b) => b - a);
      const userRank = sortedHours.indexOf(currentUserHours) + 1;
      const percentageRank = ((userRank / sortedHours.length) * 100).toFixed(1);

      // 화면 출력
      document.getElementById('userMonthlyHours').textContent = `${currentUserHours.toFixed(2)} 시간`;
      document.getElementById('userRankingPercent').textContent = `Top ${percentageRank}%`;

      renderUserRankingChart(sortedHours, currentUserHours, userRank, percentageRank);
  } catch (error) {
      console.error('모든 사용자 작업 로그를 불러오는 중 오류 발생:', error);
  }
}

// 사용자 랭킹 차트 생성 함수
function renderUserRankingChart(sortedHours, currentUserHours, userRank, percentageRank) {
  const ctx = document.getElementById('userRankingChart').getContext('2d');
  const backgroundColors = sortedHours.map(hours =>
    Math.abs(hours - currentUserHours) < 0.01 ? 'rgba(255, 99, 132, 1)' : 'rgba(54, 162, 235, 0.4)'
  );

  new Chart(ctx, {
      type: 'bar',
      data: {
          labels: Array.from({ length: sortedHours.length }, (_, i) => i + 1),
          datasets: [{
              label: 'Working time',
              data: sortedHours,
              backgroundColor: backgroundColors,
              borderWidth: 1
          }]
      },
      options: {
          plugins: {
              tooltip: {
                  callbacks: {
                      label: (context) => `${context.raw.toFixed(2)} 시간`
                  }
              }
          }
      }
  });

}



// 작업 유형별 작업 건수 계산 함수
function calculateWorkTypeCounts(workLogs) {
  const workTypeCounts = {};

  workLogs.forEach(log => {
    const workType = log.work_type;
    if (workType) {
      workTypeCounts[workType] = (workTypeCounts[workType] || 0) + 1;
    }
  });

  return workTypeCounts;
}

// 작업 유형별 작업 건수 그래프 생성 함수
function renderWorkTypeChart(workTypeCounts) {
  const totalTasks = Object.values(workTypeCounts).reduce((acc, count) => acc + count, 0);
  const maxCount = Math.max(...Object.values(workTypeCounts)) * 1.2; // 최대값의 1.2배로 설정

  const ctx = document.getElementById('workTypeChart').getContext('2d');
  new Chart(ctx, {
      type: 'bar',
      data: {
          labels: Object.keys(workTypeCounts),
          datasets: [{
              label: 'work log',
              data: Object.values(workTypeCounts),
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
              borderColor: 'rgba(75, 192, 192, 1)',
              borderWidth: 1
          }]
      },
      options: {
        indexAxis: 'y',
        scales: {
            x: {
                max: maxCount // 최대값 설정
            }
        },
        plugins: {
            tooltip: {
                callbacks: {
                    label: (context) => {
                        const count = context.raw;
                        const percentage = ((count / totalTasks) * 100).toFixed(1);
                        return `${count} 건 (${percentage}%)`;
                    }
                }
            },
            datalabels: {
                formatter: (value, context) => {
                    const percentage = ((value / totalTasks) * 100).toFixed(1);
                    return `${value}건\n(${percentage}%)`;
                },
                color: 'black',
                anchor: 'end',
                align: 'end'
            }
        }
      },
      plugins: [ChartDataLabels]
  });
}

// 설비 유형별 작업 건수 계산 함수
function calculateEquipmentTypeCounts(workLogs) {
  const equipmentTypeCounts = {};

  workLogs.forEach(log => {
    const equipmentType = log.equipment_type;
    if (equipmentType) {
      equipmentTypeCounts[equipmentType] = (equipmentTypeCounts[equipmentType] || 0) + 1;
    }
  });

  return equipmentTypeCounts;
}

// 설비 유형별 작업 건수 그래프 생성 함수
function renderEquipmentTypeChart(equipmentTypeCounts) {
  const totalTasks = Object.values(equipmentTypeCounts).reduce((acc, count) => acc + count, 0);
  const maxCount = Math.max(...Object.values(equipmentTypeCounts)) * 1.2;

  const ctx = document.getElementById('equipmentTypeChart').getContext('2d');
  new Chart(ctx, {
      type: 'bar',
      data: {
          labels: Object.keys(equipmentTypeCounts),
          datasets: [{
              label: 'work log',
              data: Object.values(equipmentTypeCounts),
              backgroundColor: 'rgba(153, 102, 255, 0.2)',
              borderColor: 'rgba(153, 102, 255, 1)',
              borderWidth: 1
          }]
      },
      options: {
        indexAxis: 'y',
        scales: {
            x: {
                max: maxCount
            }
        },
        plugins: {
            tooltip: {
                callbacks: {
                    label: (context) => {
                        const count = context.raw;
                        const percentage = ((count / totalTasks) * 100).toFixed(1);
                        return `${count} 건 (${percentage}%)`;
                    }
                }
            },
            datalabels: {
                formatter: (value, context) => {
                    const percentage = ((value / totalTasks) * 100).toFixed(1);
                    return `${value}건\n(${percentage}%)`;
                },
                color: 'black',
                anchor: 'end',
                align: 'end'
            }
        }
      },
      plugins: [ChartDataLabels]
  });
}


// 주말과 평일의 하루 평균 근무 시간을 계산하는 함수
function calculateAverageWorkingHoursByDayType(workLogs, holidays) {
  let weekendTotalHours = 0;
  let weekdayTotalHours = 0;
  let weekendCount = 0;
  let weekdayCount = 0;

  workLogs.forEach(log => {
    if (log.task_duration) {
      const [hours, minutes, seconds] = log.task_duration.split(':').map(Number);
      const durationInHours = hours + minutes / 60 + seconds / 3600;

      // 작업 날짜의 요일을 구하여 주말, 평일 및 공휴일을 구분
      const logDate = new Date(log.task_date);
      const dayOfWeek = logDate.getDay();
      const logDateString = logDate.toISOString().split('T')[0];

      // 주말 또는 공휴일에 해당하는 경우
      if (dayOfWeek === 0 || dayOfWeek === 6 || holidays.includes(logDateString)) {
        weekendTotalHours += durationInHours;
        weekendCount++;
      } else { // 평일
        weekdayTotalHours += durationInHours;
        weekdayCount++;
      }
    }
  });

  // 주말 및 평일 평균 시간 계산
  const weekendAverageHours = weekendCount > 0 ? (weekendTotalHours / weekendCount).toFixed(2) : 0;
  const weekdayAverageHours = weekdayCount > 0 ? (weekdayTotalHours / weekdayCount).toFixed(2) : 0;

  return { weekendAverageHours, weekdayAverageHours };
}


const holidays = [
  '2024-01-01', '2024-02-09', '2024-02-10', '2024-02-11', '2024-02-12',
  '2024-03-01', '2024-05-05', '2024-05-06', '2024-05-15', '2024-06-06',
  '2024-08-15', '2024-09-16', '2024-09-17', '2024-09-18', '2024-10-03',
  '2024-10-09', '2024-12-25', '2024-10-01'
];


// 주말과 평일의 하루 평균 근무 시간 그래프 생성 함수
function renderAverageWorkingHoursChart(averageHours) {
  const maxHours = Math.max(averageHours.weekdayAverageHours, averageHours.weekendAverageHours) * 1.2;

  const ctx = document.getElementById('averageWorkingHoursChart').getContext('2d');
  new Chart(ctx, {
      type: 'bar',
      data: {
          labels: ['weekday', 'holiday'],
          datasets: [{
              label: 'Average working time per day',
              data: [averageHours.weekdayAverageHours, averageHours.weekendAverageHours],
              backgroundColor: ['rgba(255, 159, 64, 0.2)', 'rgba(54, 162, 235, 0.2)'],
              borderColor: ['rgba(255, 159, 64, 1)', 'rgba(54, 162, 235, 1)'],
              borderWidth: 1
          }]
      },
      options: {
        indexAxis: 'y',
        scales: {
            x: {
                max: maxHours
            }
        },
        plugins: {
            tooltip: {
                callbacks: {
                    label: (context) => `${context.raw} Hrs`
                }
            },
            datalabels: {
                formatter: (value) => `${value} Hrs`,
                color: 'black',
                anchor: 'end',
                align: 'end'
            }
        }
      },
      plugins: [ChartDataLabels]
  });
}

// 작업 건수 계산 함수
function calculateUserTaskCount(workLogs) {
  let taskCount = 0;

  workLogs.forEach(log => {
    const logMonth = new Date(log.task_date).getMonth();
    if (logMonth === new Date().getMonth()) {
      const userNames = log.task_man.split(',').map(name => name.replace(/\(.*?\)/g, '').trim());
      if (userNames.includes(loggedInUserName)) {
        taskCount += 1;
      }
    }
  });

  return taskCount;
}
// 작업 건수 랭킹을 계산하고 화면에 표시
async function calculateAndRenderUserTaskRanking(userTaskCount) {
  const token = localStorage.getItem('x-access-token');
  if (!token) return;

  try {
      const response = await axios.get('http://3.37.73.151:3001/logs', {
          headers: { 'x-access-token': token }
      });

      const currentMonth = new Date().getMonth(); // 이번 달의 인덱스
      const allUserTaskCounts = {};

      // 이번 달의 작업 건수만 계산
      response.data.forEach(log => {
          const logMonth = new Date(log.task_date).getMonth();
          
          // 이번 달의 작업만 필터링
          if (logMonth === currentMonth) {
              const userNames = log.task_man.split(',').map(name => name.replace(/\(.*?\)/g, '').trim());

              userNames.forEach(userName => {
                  if (!allUserTaskCounts[userName]) {
                      allUserTaskCounts[userName] = 0;
                  }
                  allUserTaskCounts[userName] += 1; // 작업 건수 증가
              });
          }
      });

      // 모든 사용자 작업 건수 정렬 (내림차순)
      const sortedTaskCounts = Object.values(allUserTaskCounts).sort((a, b) => b - a);

      // 사용자 작업 건수의 랭킹과 퍼센트 계산
      const userRank = sortedTaskCounts.indexOf(userTaskCount) + 1;
      const percentageRank = userRank ? ((userRank / sortedTaskCounts.length) * 100).toFixed(1) : 0;

      // 화면에 작업 건수, 랭킹, 퍼센트 출력
      document.getElementById('userMonthlyTasks').textContent = `${userTaskCount} 건`;
      document.getElementById('userTaskRankingPercent').textContent = `Top ${percentageRank}%`;

      renderUserTaskRankingChart(sortedTaskCounts, userTaskCount, userRank, percentageRank);

  } catch (error) {
      console.error('작업 건수 랭킹을 불러오는 중 오류 발생:', error);
  }
}


// 작업 건수 랭킹 차트 생성 함수
function renderUserTaskRankingChart(sortedTaskCounts, userTaskCount, userRank, percentageRank) {
  const ctx = document.getElementById('userTaskRankingChart').getContext('2d');
  const backgroundColors = sortedTaskCounts.map(count => count === userTaskCount ? 'rgba(255, 99, 132, 1)' : 'rgba(54, 162, 235, 0.4)');

  new Chart(ctx, {
      type: 'bar',
      data: {
          labels: Array.from({ length: sortedTaskCounts.length }, (_, i) => i + 1),
          datasets: [{
              label: 'Task Count',
              data: sortedTaskCounts,
              backgroundColor: backgroundColors,
              borderWidth: 1
          }]
      },
      options: {
          plugins: {
              tooltip: {
                  callbacks: {
                      label: (context) => `${context.raw} 건`
                  }
              }
          }
      }
  });

  console.log(`사용자 작업 건수 랭킹: ${userRank}, Top ${percentageRank}%`);
}

// 작업 시작 시간 AM/PM 계산 함수
function calculateTaskStartTime(workLogs) {
  let amCount = 0;
  let pmCount = 0;

  workLogs.forEach(log => {
    const startTime = new Date(`1970-01-01T${log.start_time}Z`);  // start_time을 시간으로 처리
    const hours = startTime.getUTCHours();  // getUTCHours()로 시간을 가져옴

    // AM: 12시 이전
    if (hours < 12) {
      amCount += 1;
    }
    // PM: 12시 이후
    else {
      pmCount += 1;
    }
  });

  return { amCount, pmCount };
}

function renderTaskStartTimeChart(amCount, pmCount) {
  const maxCount = Math.max(amCount, pmCount) * 1.2; // 최대값을 1.5배로 설정하여 여유 공간 확보

  const ctx = document.getElementById('taskStartTimeChart').getContext('2d');
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['AM', 'PM'],
      datasets: [{
        label: 'Task Start Time',
        data: [amCount, pmCount],
        backgroundColor: ['rgba(75, 192, 192, 0.2)', 'rgba(255, 99, 132, 0.2)'],
        borderColor: ['rgba(75, 192, 192, 1)', 'rgba(255, 99, 132, 1)'],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      indexAxis: 'y', // 가로 막대형 그래프
      
      scales: {
        x: {
          max: maxCount, // 최대값을 max로 강제 설정
          ticks: {
            color: 'grey',
            beginAtZero: true,
          }
        }
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: (context) => {
              const percentage = ((context.raw / (amCount + pmCount)) * 100).toFixed(1); // 비율 계산
              return `${context.raw} tasks (${percentage}%)`; // 비율 추가
            }
          }
        },
        datalabels: {
          formatter: (value, context) => {
            const percentage = ((value / (amCount + pmCount)) * 100).toFixed(1); // 비율 계산
            return `${value} (${percentage}%)`; // 데이터 라벨에 비율 추가
          },
          color: 'black',
          font: {
            size: 12
          },
          anchor: 'end',
          align: 'end'
        }
      }
    },
    plugins: [ChartDataLabels] // 플러그인 등록
  });
}


// 작업 시간 기준으로 Regular vs Overtime 계산 함수
function calculateRegularVsOvertime(workLogs) {
  let regularCount = 0;
  let overtimeCount = 0;

  workLogs.forEach(log => {
    const endTime = new Date(`1970-01-01T${log.end_time}Z`); // end_time을 시간으로 처리
    const hours = endTime.getUTCHours();  // getUTCHours()로 시간을 가져옴

    // 18시 이전이면 Regular
    if (hours < 18) {
      regularCount += 1;
    } 
    // 18시 이후면 Overtime
    else {
      overtimeCount += 1;
    }
  });

  return { regularCount, overtimeCount };
}

// Regular vs Overtime 그래프 렌더링 함수
function renderRegularVsOvertimeChart(regularCount, overtimeCount) {
  const maxCount = Math.max(regularCount, overtimeCount) * 1.2; // 최대값을 1.5배로 설정하여 여유 공간 확보

  const ctx = document.getElementById('regularVsOvertimeChart').getContext('2d');
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Regular', 'Overtime'],
      datasets: [{
        label: 'Task Count',
        data: [regularCount, overtimeCount],
        backgroundColor: ['rgba(75, 192, 192, 0.2)', 'rgba(255, 99, 132, 0.2)'],
        borderColor: ['rgba(75, 192, 192, 1)', 'rgba(255, 99, 132, 1)'],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      indexAxis: 'y', // 가로 막대형 그래프
      scales: {
        x: {
          suggestedMax: maxCount, // 최대값을 suggestedMax로 설정
          ticks: {
            color: 'grey',
            beginAtZero: true,
          }
        }
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: (context) => {
              const percentage = ((context.raw / (regularCount + overtimeCount)) * 100).toFixed(1); // 비율 계산
              return `${context.raw} tasks (${percentage}%)`; // 비율 추가
            }
          }
        },
        datalabels: {
          formatter: (value, context) => {
            const percentage = ((value / (regularCount + overtimeCount)) * 100).toFixed(1); // 비율 계산
            return `${value} (${percentage}%)`; // 데이터 라벨에 비율 추가
          },
          color: 'black',
          font: {
            size: 12
          },
          anchor: 'end',
          align: 'end'
        }
      }
    },
    plugins: [ChartDataLabels] // 플러그인 등록
  });
}

// 작업 시간을 범위별로 계산하는 함수
function calculateTaskDurationRanges(workLogs) {
  const ranges = {
    '0-1 hour': 0,
    '1-2 hours': 0,
    '2-3 hours': 0,
    '3-4 hours': 0,
    '4+ hours': 0
  };

  workLogs.forEach(log => {
    if (log.task_duration) {
      const [hours, minutes, seconds] = log.task_duration.split(':').map(Number);
      const totalHours = hours + minutes / 60 + seconds / 3600;

      if (totalHours < 1) {
        ranges['0-1 hour']++;
      } else if (totalHours >= 1 && totalHours < 2) {
        ranges['1-2 hours']++;
      } else if (totalHours >= 2 && totalHours < 3) {
        ranges['2-3 hours']++;
      } else if (totalHours >= 3 && totalHours < 4) {
        ranges['3-4 hours']++;
      } else {
        ranges['4+ hours']++;
      }
    }
  });

  return ranges;
}

function renderTimeRangeChart(ranges) {
  const maxCount = Math.max(...Object.values(ranges)) * 1.2; // 최대값을 1.2배로 설정하여 여유 공간 확보

  const ctx = document.getElementById('timeRangeChart').getContext('2d');
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: Object.keys(ranges),  // 범위별 레이블
      datasets: [{
        label: 'Working time',
        data: Object.values(ranges),  // 각 범위별 작업 수
        backgroundColor: [
          'rgba(75, 192, 192, 0.2)',
          'rgba(153, 102, 255, 0.2)',
          'rgba(255, 159, 64, 0.2)',
          'rgba(54, 162, 235, 0.2)',
          'rgba(255, 99, 132, 0.2)'
        ],
        borderColor: [
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 99, 132, 1)'
        ],
        borderWidth: 1
      }]
    },
    options: {
      indexAxis: 'y', // 가로 막대형 그래프
      responsive: true,
      scales: {
        x: {
          max: maxCount, // 최대값을 max로 설정
          ticks: {
            color: 'grey',
            beginAtZero: true,
          }
        },

      },
      plugins: {
        tooltip: {
          callbacks: {
            label: (context) => {
              const percentage = ((context.raw / Object.values(ranges).reduce((a, b) => a + b, 0)) * 100).toFixed(1);
              return `${context.raw} tasks (${percentage}%)`;
            }
          }
        },
        datalabels: {
          formatter: (value, context) => {
            const percentage = ((value / Object.values(ranges).reduce((a, b) => a + b, 0)) * 100).toFixed(1);
            return `${value} (${percentage}%)`;  // 각 막대에 비율 표시
          },
          color: 'black',
          font: {
            size: 12
          },
          anchor: 'end',
          align: 'end'
        }
      }
    },
    plugins: [ChartDataLabels] // 플러그인 등록
  });
}


// 공휴일을 제외한 날짜 계산 함수
function calculateWorkingDays(startDate, endDate, holidays) {
  const workingDays = [];
  let currentDate = new Date(startDate);
  endDate = new Date(endDate);
  
  while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay(); // 0: 일요일, 6: 토요일
      const logDateString = currentDate.toISOString().split('T')[0]; // 날짜 형식 YYYY-MM-DD

      // 주말(토, 일) 및 공휴일을 제외한 평일만 workingDays에 추가
      if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidays.includes(logDateString)) {
          workingDays.push(logDateString);
      }
      
      currentDate.setDate(currentDate.getDate() + 1); // 하루씩 증가
  }

  return workingDays;
}

// 공휴일을 제외한 평일에 하루 작업 건수를 카운트하는 함수
function calculateDailyWorkCount(workLogs, holidays, startDate, endDate) {
  const dailyWorkCount = { 0: 0, 1: 0, 2: 0, 3: 0, '3+': 0 };  // 작업 건수별 날짜 수
  const workingDays = calculateWorkingDays(startDate, endDate, holidays);  // 평일 작업 날짜 배열

  workLogs.forEach(log => {
      if (log.task_duration) {
          const logDateString = new Date(log.task_date).toISOString().split('T')[0]; // 날짜 형식 YYYY-MM-DD

          // 공휴일과 주말을 제외한 날짜에 대해서만 카운트
          if (workingDays.includes(logDateString)) {
              // 하루에 작업 건수 계산 (task_man 필드를 쉼표로 분리하여 각 작업 건수 계산)
              const taskCount = log.task_man.split(',').length;

              // 작업 건수별로 날짜 수 카운트
              if (taskCount === 1) {
                  dailyWorkCount[1]++; // 1건 작업을 진행한 날짜 수 증가
              } else if (taskCount === 2) {
                  dailyWorkCount[2]++; // 2건 작업을 진행한 날짜 수 증가
              } else if (taskCount === 3) {
                  dailyWorkCount[3]++; // 3건 작업을 진행한 날짜 수 증가
              } else if (taskCount > 3) {
                  dailyWorkCount['3+']++; // 3건 이상 작업을 진행한 날짜 수 증가
              } 
          }
      }
  });

  // 콘솔에 각 작업 건수를 진행한 날짜 수 출력
  console.log("1건 작업한 날:", dailyWorkCount[1]);
  console.log("2건 작업한 날:", dailyWorkCount[2]);
  console.log("3건 이상 작업한 날:", dailyWorkCount[3] + dailyWorkCount['3+']);  // 3건 이상 합산

  return dailyWorkCount;
}

// 하루 작업 건수 비교 그래프를 생성하는 함수
function renderDailyWorkCountChart(dailyWorkCount) {
  const ctx = document.getElementById('dailyWorkCountChart').getContext('2d');
  const totalDays = dailyWorkCount[1] + dailyWorkCount[2] + dailyWorkCount[3] + dailyWorkCount['3+'];  // 전체 작업 건수
  const maxCount = Math.max(dailyWorkCount[1], dailyWorkCount[2], dailyWorkCount[3] + dailyWorkCount['3+']) * 1.2; // x축 최대값을 1.2배로 설정

  new Chart(ctx, {
      type: 'bar',
      data: {
          labels: ['1', '2', '3+'], // 그래프에 표시될 레이블
          datasets: [{
              label: 'Task count per day',
              data: [
                  dailyWorkCount[1],        // 1건 작업한 날
                  dailyWorkCount[2],        // 2건 작업한 날
                  dailyWorkCount[3] + dailyWorkCount['3+'] // 3건 이상 작업한 날 (합쳐서 표시)
              ],
              backgroundColor: [
                  'rgba(75, 192, 192, 0.2)',
                  'rgba(153, 102, 255, 0.2)',
                  'rgba(255, 159, 64, 0.2)'
              ],
              borderColor: [
                  'rgba(75, 192, 192, 1)',
                  'rgba(153, 102, 255, 1)',
                  'rgba(255, 159, 64, 1)'
              ],
              borderWidth: 1
          }]
      },
      options: {
        indexAxis: 'y', // 가로 막대형 그래프
        scales: {
            x: {
                max: maxCount, // 최대값을 1.2배로 설정
                ticks: {
                    color: 'grey',
                    beginAtZero: true,
                }
            },
            y: {
                title: {
                    display: true,
                    text: 'Task Count'
                }
            }
        },
        plugins: {
            tooltip: {
                callbacks: {
                    label: (context) => {
                        const percentage = ((context.raw / totalDays) * 100).toFixed(1); // 비율 계산
                        return `${context.raw} days (${percentage}%)`; // 툴팁에 작업 건수와 비율 추가
                    }
                }
            },
            datalabels: {
                formatter: (value) => {
                    const percentage = ((value / totalDays) * 100).toFixed(1); // 비율 계산
                    return `${value} days\n(${percentage}%)`; // 데이터 라벨에 작업 건수와 비율 추가
                },
                color: 'black',
                anchor: 'end',
                align: 'end',
                font: {
                    size: 12
                }
            }
        }
      },
      plugins: [ChartDataLabels] // 데이터 라벨 플러그인 추가
  });
}
// LINE별 작업 건수 및 비율 계산 함수
function calculateLineWorkCount(workLogs) {
  const lineWorkCount = {}; // LINE별 작업 건수

  // 각 작업 로그를 순회하면서 LINE별 작업 건수를 세기
  workLogs.forEach(log => {
    const line = log.line; // line 필드를 기준으로 작업 건수 세기
    if (line) {
      if (!lineWorkCount[line]) {
        lineWorkCount[line] = 0;
      }
      lineWorkCount[line]++;
    }
  });

  return lineWorkCount;
}

// LINE별 작업 건수 그래프를 생성하는 함수
function renderLineWorkCountChart(lineWorkCount) {
  const totalTasks = Object.values(lineWorkCount).reduce((acc, count) => acc + count, 0);  // 전체 작업 건수
  
  // LINE별 작업 건수를 내림차순으로 정렬
  const sortedLineWorkCount = Object.entries(lineWorkCount).sort((a, b) => b[1] - a[1]);

  // 정렬된 데이터를 다시 객체로 변환
  const sortedLabels = sortedLineWorkCount.map(item => item[0]);
  const sortedData = sortedLineWorkCount.map(item => item[1]);

  const maxCount = Math.max(...sortedData) * 1.4;  // x축 최대값을 1.4배로 설정

  const ctx = document.getElementById('lineWorkCountChart').getContext('2d');
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: sortedLabels, // 작업 건수 내림차순으로 정렬된 LINE
      datasets: [{
        label: 'Work Count',
        data: sortedData, // 작업 건수 내림차순으로 정렬된 작업 건수
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1
      }]
    },
    options: {
      scales: {
        x: {
          ticks: {
            color: 'grey',
            beginAtZero: true,
          }
        },
        y: {
          max: maxCount // 최대값을 1.4배로 설정
        }
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: (context) => {
              const percentage = ((context.raw / totalTasks) * 100).toFixed(1); // 비율 계산
              return `${context.raw} tasks (${percentage}%)`; // 툴팁에 작업 건수와 비율 추가
            }
          }
        },
        datalabels: {
          formatter: (value) => {
            const percentage = ((value / totalTasks) * 100).toFixed(1); // 비율 계산
            return `${value} tasks\n(${percentage}%)`; // 데이터 라벨에 작업 건수와 비율 추가
          },
          color: 'black',
          anchor: 'end',
          align: 'end',
          font: {
            size: 12
          }
        }
      }
    },
    plugins: [ChartDataLabels] // 데이터 라벨 플러그인 추가
  });
}

// GROUP별 작업 건수 계산 함수
function calculateGroupWorkCount(workLogs) {
  const groupWorkCount = {}; // GROUP별 작업 건수

  // 각 작업 로그를 순회하면서 group별 작업 건수를 세기
  workLogs.forEach(log => {
    const group = log.group; // group 필드를 기준으로 작업 건수 세기
    if (group) {
      if (!groupWorkCount[group]) {
        groupWorkCount[group] = 0;
      }
      groupWorkCount[group]++;
    }
  });

  return groupWorkCount;
}

// GROUP별 작업 건수 그래프를 생성하는 함수
function renderGroupWorkCountChart(groupWorkCount) {
  const totalTasks = Object.values(groupWorkCount).reduce((acc, count) => acc + count, 0);  // 전체 작업 건수
  const maxCount = Math.max(...Object.values(groupWorkCount)) * 1.2;  // x축 최대값을 1.2배로 설정

  const ctx = document.getElementById('groupWorkCountChart').getContext('2d');
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: Object.keys(groupWorkCount), // 각 group별 레이블
      datasets: [{
        label: 'Work Count per Group',
        data: Object.values(groupWorkCount), // 각 group별 작업 건수
        backgroundColor: 'rgba(153, 102, 255, 0.2)',
        borderColor: 'rgba(153, 102, 255, 1)',
        borderWidth: 1
      }]
    },
    options: {
      indexAxis: 'y', // 가로 막대형 그래프
      scales: {
        x: {
          max: maxCount, // 최대값을 1.2배로 설정
          ticks: {
            color: 'grey',
            beginAtZero: true,
          }
        }
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: (context) => {
              const percentage = ((context.raw / totalTasks) * 100).toFixed(1); // 비율 계산
              return `${context.raw} tasks (${percentage}%)`; // 툴팁에 작업 건수와 비율 추가
            }
          }
        },
        datalabels: {
          formatter: (value) => {
            const percentage = ((value / totalTasks) * 100).toFixed(1); // 비율 계산
            return `${value} tasks\n(${percentage}%)`; // 데이터 라벨에 작업 건수와 비율 추가
          },
          color: 'black',
          anchor: 'end',
          align: 'end',
          font: {
            size: 12
          }
        }
      }
    },
    plugins: [ChartDataLabels] // 데이터 라벨 플러그인 추가
  });
}

// SITE별 작업 건수 계산 함수
function calculateSiteWorkCount(workLogs) {
  const siteWorkCount = {}; // SITE별 작업 건수

  // 각 작업 로그를 순회하면서 site별 작업 건수를 세기
  workLogs.forEach(log => {
    const site = log.site; // site 필드를 기준으로 작업 건수 세기
    if (site) {
      if (!siteWorkCount[site]) {
        siteWorkCount[site] = 0;
      }
      siteWorkCount[site]++;
    }
  });

  return siteWorkCount;
}

// SITE별 작업 건수 그래프를 생성하는 함수
function renderSiteWorkCountChart(siteWorkCount) {
  const totalTasks = Object.values(siteWorkCount).reduce((acc, count) => acc + count, 0);  // 전체 작업 건수
  const maxCount = Math.max(...Object.values(siteWorkCount)) * 1.2;  // x축 최대값을 1.2배로 설정

  const ctx = document.getElementById('siteWorkCountChart').getContext('2d');
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: Object.keys(siteWorkCount), // 각 site별 레이블
      datasets: [{
        label: 'Work Count per Site',
        data: Object.values(siteWorkCount), // 각 site별 작업 건수
        backgroundColor: 'rgba(255, 159, 64, 0.2)',
        borderColor: 'rgba(255, 159, 64, 1)',
        borderWidth: 1
      }]
    },
    options: {
      indexAxis: 'y', // 가로 막대형 그래프
      scales: {
        x: {
          max: maxCount, // 최대값을 1.2배로 설정
          ticks: {
            color: 'grey',
            beginAtZero: true,
          }
        }
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: (context) => {
              const percentage = ((context.raw / totalTasks) * 100).toFixed(1); // 비율 계산
              return `${context.raw} tasks (${percentage}%)`; // 툴팁에 작업 건수와 비율 추가
            }
          }
        },
        datalabels: {
          formatter: (value) => {
            const percentage = ((value / totalTasks) * 100).toFixed(1); // 비율 계산
            return `${value} tasks\n(${percentage}%)`; // 데이터 라벨에 작업 건수와 비율 추가
          },
          color: 'black',
          anchor: 'end',
          align: 'end',
          font: {
            size: 12
          }
        }
      }
    },
    plugins: [ChartDataLabels] // 데이터 라벨 플러그인 추가
  });
}


// WARRANTY별 작업 건수 계산 함수
function calculateWarrantyWorkCount(workLogs) {
  const warrantyWorkCount = {}; // WARRANTY별 작업 건수

  // 각 작업 로그를 순회하면서 WARRANTY별 작업 건수를 세기
  workLogs.forEach(log => {
      const warranty = log.warranty; // warranty 필드를 기준으로 작업 건수 세기
      if (warranty) {
          if (!warrantyWorkCount[warranty]) {
              warrantyWorkCount[warranty] = 0;
          }
          warrantyWorkCount[warranty]++;
      }
  });

  return warrantyWorkCount;
}

// WARRANTY별 작업 건수 그래프를 생성하는 함수
function renderWarrantyWorkCountChart(warrantyWorkCount) {
  const totalTasks = Object.values(warrantyWorkCount).reduce((acc, count) => acc + count, 0);  // 전체 작업 건수
  const maxCount = Math.max(...Object.values(warrantyWorkCount)) * 1.4;  // x축 최대값을 1.4배로 설정

  const ctx = document.getElementById('warrantyWorkCountChart').getContext('2d');
  new Chart(ctx, {
      type: 'bar',
      data: {
          labels: Object.keys(warrantyWorkCount), // 각 WARRANTY별 레이블
          datasets: [{
              label: 'Work Count per WARRANTY',
              data: Object.values(warrantyWorkCount), // 각 WARRANTY별 작업 건수
              backgroundColor: 'rgba(153, 102, 255, 0.2)',
              borderColor: 'rgba(153, 102, 255, 1)',
              borderWidth: 1
          }]
      },
      options: {
        indexAxis: 'y', // 가로 막대형 그래프
          scales: {
              x: {
                max: maxCount, // 최대값을 1.4배로 설정
                  ticks: {
                      color: 'grey',
                      beginAtZero: true,
                  }
              }
          },
          plugins: {
              tooltip: {
                  callbacks: {
                      label: (context) => {
                          const percentage = ((context.raw / totalTasks) * 100).toFixed(1); // 비율 계산
                          return `${context.raw} tasks (${percentage}%)`; // 툴팁에 작업 건수와 비율 추가
                      }
                  }
              },
              datalabels: {
                  formatter: (value) => {
                      const percentage = ((value / totalTasks) * 100).toFixed(1); // 비율 계산
                      return `${value} tasks\n(${percentage}%)`; // 데이터 라벨에 작업 건수와 비율 추가
                  },
                  color: 'black',
                  anchor: 'end',
                  align: 'end',
                  font: {
                      size: 12
                  }
              }
          }
      },
      plugins: [ChartDataLabels] // 데이터 라벨 플러그인 추가
  });
}


// 각 차트 설명
const chartDescriptions = {
  achievement: "레벨별로 취득까지 걸린 기간을 나타냅니다.",
  capa: "CAPA(역량)을 출력합니다. 본인의 그룹에 맞게 설비가 출력됩니다.",
  monthlyCapa: "월별 CAPA TREND 를 보여줍니다.",
  monthlyWorkHours: "월별 WORKING TIME TREND 를 나타냅니다.",
  userRanking: "이번 달의 WORKING TIME을 기준으로 상위% 를 보여줍니다.",
  userTaskRanking: "이번 달의 TASK COUNT을 기준으로 상위% 를 보여줍니다.",
  workType: "작업 유형별 작업 건 수를 비교합니다.",
  equipmentType: "장비 유형별 작업 건 수를 비교합니다.",
  averageWorkingHours: "평일과 휴일의 하루 평균 WORKING TIME을 비교합니다.",
  taskStartTime: "작업 시작 시간을 12시를 기준으로 오전과 오후로 나누어 비교합니다.",
  regularVsOvertime: "작업이 끝나는 시간을 18시를 기준으로 정규 근무와 초과 근무로 나누어 비교합니다.",
  timeRange: "작업에 소요된 시간을 범위로 나타내어 비교합니다.",
  dailyWorkCount: "1건, 2건, 3건 이상 작업한 날짜의 수를 세어 비교합니다.",
  lineWorkCount: "라인별 작업 건 수를 비교합니다.",
  groupWorkCount: "그룹별 작업 건 수를 비교합니다.",
  siteWorkCount: "사이트별 작업 건 수를 비교합니다.",
  warrantyWorkCount: "워런티별 작업 건 수를 비교합니다.",
  levelChange: "레벨을 취득해온 과정을 출력합니다.",
  EquipmentType: "설비별 작업 건 수를 비교합니다."
};

// 모달 기능 구현
document.addEventListener('DOMContentLoaded', () => {
  const infoButtons = document.querySelectorAll('.info-btn');
  const modal = document.getElementById('infoModal');
  const modalText = document.getElementById('modalText');
  const closeModal = document.querySelector('.modal .close');

  // "?" 버튼 클릭 시 설명 모달 열기
  infoButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      const infoKey = e.target.getAttribute('data-info');
      modalText.textContent = chartDescriptions[infoKey];
      modal.style.display = 'block';
    });
  });

  // 모달 닫기 버튼 클릭 시 모달 닫기
  closeModal.addEventListener('click', () => {
    modal.style.display = 'none';
  });

  // 모달 외부 클릭 시 모달 닫기
  window.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.style.display = 'none';
    }
  });
});

document.getElementById('view-average-info').addEventListener('click', function() {
  window.location.href = './SECM.html';
});