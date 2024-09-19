document.addEventListener('DOMContentLoaded', async () => {
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
  });
  