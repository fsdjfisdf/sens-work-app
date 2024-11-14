document.addEventListener('DOMContentLoaded', async () => {
  await loadUserInfo();
  const workLogs = await loadWorkLogs(); // 작업 이력을 가져오고 변수에 저장
  const monthlyHours = calculateMonthlyWorkHoursByMonth(workLogs); // 월별 작업 시간을 계산
  renderMonthlyWorkHoursChart(monthlyHours); // 그래프 렌더링

  // 이번 달의 작업 시간만 계산하여 화면에 표시
  const currentMonthIndex = new Date().getMonth(); // 현재 달의 인덱스 (0: 1월, ..., 11: 12월)
  const currentMonthHours = monthlyHours[currentMonthIndex];
  document.getElementById('userMonthlyHours').textContent = `${currentMonthHours.toFixed(2)} 시간`;

  await calculateAndRenderUserRanking(currentMonthHours);

  const workTypeCounts = calculateWorkTypeCounts(workLogs);
  renderWorkTypeChart(workTypeCounts);

  // 설비 유형별 작업 건수 그래프 생성
  const equipmentTypeCounts = calculateEquipmentTypeCounts(workLogs);
  renderEquipmentTypeChart(equipmentTypeCounts);

  // 공휴일을 주말에 포함하도록 holidays 배열을 전달
  const averageHours = calculateAverageWorkingHoursByDayType(workLogs, holidays);
  renderAverageWorkingHoursChart(averageHours);
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

      const data = await response.json();
      if (data.isSuccess) {
          const userInfo = data.result;
          loggedInUserName = userInfo.NAME; // 로그인한 사용자의 이름 저장
          userName.textContent = `${userInfo.NAME}`;
          userGroup.textContent = `${userInfo.GROUP}`;
          userSite.textContent = `${userInfo.SITE}`;
          userHireDate.textContent = `${new Date(userInfo.HIRE).toLocaleDateString()}`;
          userLevel.textContent = `${userInfo.LEVEL}`;
          userMultiLevel.textContent = `${userInfo['MULTI LEVEL']}`;
          userMainEq.textContent = `${userInfo['MAIN EQ']}`;
          userMultiEq.textContent = `${userInfo['MULTI EQ']}`;
  
        // 그래프 데이터
        const hireDate = new Date(userInfo.HIRE);
        const achievementData = [
          { label: 'Level 1', date: userInfo['Level1 Achieve'] ? new Date(userInfo['Level1 Achieve']) : null },
          { label: 'Level 2', date: userInfo['Level2 Achieve'] ? new Date(userInfo['Level2 Achieve']) : null },
          { label: 'Level 3', date: userInfo['Level3 Achieve'] ? new Date(userInfo['Level3 Achieve']) : null },
          { label: 'Level 4', date: userInfo['Level4 Achieve'] ? new Date(userInfo['Level4 Achieve']) : null }
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
        const monthlyCapaLabels = ['24YJAN', '24YFEB', '24YMAR', '24YAPR', '24YMAY', '24YJUN', '24YJUL', '24YAUG', '24YSEP', '24YOCT', '24YNOV', '24YDEC'].slice(0, currentMonthIndex + 1);
        const monthlyCapaData = monthlyCapaLabels.map(label => userInfo[label] * 100);
  
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
            labels: monthlyCapaLabels.map(label => label.replace('24Y', '')),
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
        console.log("로그인한 사용자의 모든 작업 이력:", userLogs);

        return userLogs;
    } catch (error) {
        console.error('작업 로그를 불러오는 중 오류 발생:', error);
        return [];
    }
}

// 월별 작업 시간 계산 함수
function calculateMonthlyWorkHoursByMonth(workLogs) {
  const monthlyHours = Array(12).fill(0);
  
  workLogs.forEach(log => {
      const logMonth = new Date(log.task_date).getMonth();
      if (log.task_duration) {
          const [hours, minutes, seconds] = log.task_duration.split(':').map(Number);
          const durationInHours = hours + minutes / 60 + seconds / 3600;
          monthlyHours[logMonth] += durationInHours;
      }
  });
  
  return monthlyHours;
}

// 월별 작업 시간 그래프 생성 함수
function renderMonthlyWorkHoursChart(monthlyHours) {
  const maxHours = Math.max(...monthlyHours) * 1.2; // 최대값의 1.2배로 설정

  const ctx = document.getElementById('monthlyWorkHoursChart').getContext('2d');
  new Chart(ctx, {
      type: 'bar',
      data: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
          datasets: [{
              label: 'Monthly Working time(hrs)',
              data: monthlyHours,
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

async function calculateAndRenderUserRanking(currentUserHours) {
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

              // task_man 필드를 쉼표로 분리해 각 이름을 개별적으로 처리
              const userNames = log.task_man.split(',').map(name => name.replace(/\(.*?\)/g, '').trim());

              userNames.forEach(userName => {
                  // 월별 작업 시간을 각 사용자별로 누적 계산
                  if (!allUserMonthlyHours[userName]) {
                      allUserMonthlyHours[userName] = 0;
                  }
                  allUserMonthlyHours[userName] += durationInHours;

                  console.log(`사용자: ${userName}, 작업 날짜: ${log.task_date}, 작업 시간: ${log.task_duration}, 계산된 시간(시간 단위): ${durationInHours.toFixed(2)}`);
              });
          }
      });

      const sortedHours = Object.values(allUserMonthlyHours).sort((a, b) => b - a);
      const userRank = sortedHours.indexOf(currentUserHours) + 1;
      const percentageRank = ((userRank / sortedHours.length) * 100).toFixed(1);

      document.getElementById('userRankingPercent').textContent = `Top ${percentageRank}%`;

      renderUserRankingChart(sortedHours, currentUserHours, userRank, percentageRank);
  } catch (error) {
      console.error('모든 사용자 작업 로그를 불러오는 중 오류 발생:', error);
  }
}

// 사용자 랭킹 차트 생성 함수
function renderUserRankingChart(sortedHours, currentUserHours, userRank, percentageRank) {
  const ctx = document.getElementById('userRankingChart').getContext('2d');
  const backgroundColors = sortedHours.map(hours => hours === currentUserHours ? 'rgba(255, 99, 132, 1)' : 'rgba(54, 162, 235, 0.4)');

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

  console.log(`사용자 랭킹: ${userRank}, Top ${percentageRank}%`);
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

  console.log("작업 유형별 건수:", workTypeCounts);
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

  console.log("설비 유형별 건수:", equipmentTypeCounts);
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

  console.log(`주말 평균 근무 시간: ${weekendAverageHours} 시간, 평일 평균 근무 시간: ${weekdayAverageHours} 시간`);
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