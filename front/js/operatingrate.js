document.addEventListener('DOMContentLoaded', async () => {
    // 공휴일 리스트를 전역으로 선언하여 모든 함수에서 접근 가능하게 합니다.
    const holidays = [
        '2024-01-01', '2024-02-09', '2024-02-10', '2024-02-11', '2024-02-12',
        '2024-03-01', '2024-05-05', '2024-05-06', '2024-05-15', '2024-06-06',
        '2024-08-15', '2024-09-16', '2024-09-17', '2024-09-18', '2024-10-03',
        '2024-10-09', '2024-12-25', '2024-10-01'
    ];

    // 주차별 GROUP과 SITE에 따라 평일 및 주말 엔지니어 수 설정
    const weeklyEngineerCount = {
        //6월
        '2024-05-27': {
            weekday: { 'PEE1 PT': 16, 'PEE1 HS': 0, 'PEE1 IC': 0, 'PEE1 CJ': 0, 'PEE2 PT': 0, 'PEE2 HS': 0, 'PSKH PSKH': 0 },
            weekend: { 'PEE1 PT': 3, 'PEE1 HS': 0, 'PEE1 IC': 0, 'PEE1 CJ': 0, 'PEE2 PT': 0, 'PEE2 HS': 0, 'PSKH PSKH': 0 },
        },
        '2024-06-03': {
            weekday: { 'PEE1 PT': 16, 'PEE1 HS': 0, 'PEE1 IC': 0, 'PEE1 CJ': 0, 'PEE2 PT': 0, 'PEE2 HS': 0, 'PSKH PSKH': 0 },
            weekend: { 'PEE1 PT': 3, 'PEE1 HS': 0, 'PEE1 IC': 0, 'PEE1 CJ': 0, 'PEE2 PT': 0, 'PEE2 HS': 0, 'PSKH PSKH': 0 },
        },
        '2024-06-10': {
            weekday: { 'PEE1 PT': 16, 'PEE1 HS': 0, 'PEE1 IC': 0, 'PEE1 CJ': 0, 'PEE2 PT': 0, 'PEE2 HS': 0, 'PSKH PSKH': 0 },
            weekend: { 'PEE1 PT': 3, 'PEE1 HS': 0, 'PEE1 IC': 0, 'PEE1 CJ': 0, 'PEE2 PT': 0, 'PEE2 HS': 0, 'PSKH PSKH': 0 },
        },
        '2024-06-17': {
            weekday: { 'PEE1 PT': 16, 'PEE1 HS': 0, 'PEE1 IC': 0, 'PEE1 CJ': 0, 'PEE2 PT': 0, 'PEE2 HS': 0, 'PSKH PSKH': 0 },
            weekend: { 'PEE1 PT': 3, 'PEE1 HS': 0, 'PEE1 IC': 0, 'PEE1 CJ': 0, 'PEE2 PT': 0, 'PEE2 HS': 0, 'PSKH PSKH': 0 },
        },
        '2024-06-24': {
            weekday: { 'PEE1 PT': 16, 'PEE1 HS': 0, 'PEE1 IC': 0, 'PEE1 CJ': 0, 'PEE2 PT': 0, 'PEE2 HS': 0, 'PSKH PSKH': 0 },
            weekend: { 'PEE1 PT': 3, 'PEE1 HS': 0, 'PEE1 IC': 0, 'PEE1 CJ': 0, 'PEE2 PT': 0, 'PEE2 HS': 0, 'PSKH PSKH': 0 },
        },
        //7월
        '2024-07-01': {
            weekday: { 'PEE1 PT': 16, 'PEE1 HS': 17, 'PEE1 IC': 0, 'PEE1 CJ': 0, 'PEE2 PT': 0, 'PEE2 HS': 0, 'PSKH PSKH': 0 },
            weekend: { 'PEE1 PT': 3, 'PEE1 HS': 4, 'PEE1 IC': 0, 'PEE1 CJ': 0, 'PEE2 PT': 0, 'PEE2 HS': 0, 'PSKH PSKH': 0 },
        },
        '2024-07-08': {
            weekday: { 'PEE1 PT': 16, 'PEE1 HS': 17, 'PEE1 IC': 0, 'PEE1 CJ': 0, 'PEE2 PT': 0, 'PEE2 HS': 0, 'PSKH PSKH': 0 },
            weekend: { 'PEE1 PT': 3, 'PEE1 HS': 4, 'PEE1 IC': 0, 'PEE1 CJ': 0, 'PEE2 PT': 0, 'PEE2 HS': 0, 'PSKH PSKH': 0 },
        },
        '2024-07-15': {
            weekday: { 'PEE1 PT': 16, 'PEE1 HS': 17, 'PEE1 IC': 0, 'PEE1 CJ': 0, 'PEE2 PT': 0, 'PEE2 HS': 0, 'PSKH PSKH': 0 },
            weekend: { 'PEE1 PT': 3, 'PEE1 HS': 4, 'PEE1 IC': 0, 'PEE1 CJ': 0, 'PEE2 PT': 0, 'PEE2 HS': 0, 'PSKH PSKH': 0 },
        },
        '2024-07-22': {
            weekday: { 'PEE1 PT': 16, 'PEE1 HS': 17, 'PEE1 IC': 0, 'PEE1 CJ': 0, 'PEE2 PT': 0, 'PEE2 HS': 0, 'PSKH PSKH': 0 },
            weekend: { 'PEE1 PT': 3, 'PEE1 HS': 4, 'PEE1 IC': 0, 'PEE1 CJ': 0, 'PEE2 PT': 0, 'PEE2 HS': 0, 'PSKH PSKH': 0 },
        },
        '2024-07-29': {
            weekday: { 'PEE1 PT': 15, 'PEE1 HS': 17, 'PEE1 IC': 4, 'PEE1 CJ': 3, 'PEE2 PT': 8, 'PEE2 HS': 6, 'PSKH PSKH': 0 },
            weekend: { 'PEE1 PT': 3, 'PEE1 HS': 4, 'PEE1 IC': 1, 'PEE1 CJ': 1, 'PEE2 PT': 2, 'PEE2 HS': 2, 'PSKH PSKH': 0 },
        },
        //8월
        '2024-08-05': {
            weekday: { 'PEE1 PT': 15, 'PEE1 HS': 17, 'PEE1 IC': 4, 'PEE1 CJ': 3, 'PEE2 PT': 8, 'PEE2 HS': 6, 'PSKH PSKH': 0 },
            weekend: { 'PEE1 PT': 3, 'PEE1 HS': 4, 'PEE1 IC': 1, 'PEE1 CJ': 1, 'PEE2 PT': 2, 'PEE2 HS': 2, 'PSKH PSKH': 0 },
        },
        '2024-08-12': {
            weekday: { 'PEE1 PT': 15, 'PEE1 HS': 17, 'PEE1 IC': 4, 'PEE1 CJ': 3, 'PEE2 PT': 8, 'PEE2 HS': 6, 'PSKH PSKH': 0 },
            weekend: { 'PEE1 PT': 3, 'PEE1 HS': 4, 'PEE1 IC': 1, 'PEE1 CJ': 1, 'PEE2 PT': 2, 'PEE2 HS': 2, 'PSKH PSKH': 0 },
        },
        '2024-08-19': {
            weekday: { 'PEE1 PT': 15, 'PEE1 HS': 17, 'PEE1 IC': 4, 'PEE1 CJ': 3, 'PEE2 PT': 8, 'PEE2 HS': 6, 'PSKH PSKH': 0 },
            weekend: { 'PEE1 PT': 3, 'PEE1 HS': 4, 'PEE1 IC': 1, 'PEE1 CJ': 1, 'PEE2 PT': 2, 'PEE2 HS': 2, 'PSKH PSKH': 0 },
        },
        '2024-08-26': {
            weekday: { 'PEE1 PT': 15, 'PEE1 HS': 17, 'PEE1 IC': 4, 'PEE1 CJ': 3, 'PEE2 PT': 8, 'PEE2 HS': 6, 'PSKH PSKH': 0 },
            weekend: { 'PEE1 PT': 3, 'PEE1 HS': 4, 'PEE1 IC': 1, 'PEE1 CJ': 1, 'PEE2 PT': 2, 'PEE2 HS': 2, 'PSKH PSKH': 0 },
        },
        //9월
        '2024-09-02': {
            weekday: { 'PEE1 PT': 15, 'PEE1 HS': 17, 'PEE1 IC': 4, 'PEE1 CJ': 3, 'PEE2 PT': 8, 'PEE2 HS': 6, 'PSKH PSKH': 7 },
            weekend: { 'PEE1 PT': 3, 'PEE1 HS': 4, 'PEE1 IC': 1, 'PEE1 CJ': 1, 'PEE2 PT': 2, 'PEE2 HS': 2, 'PSKH PSKH': 1 },
        },
        '2024-09-09': {
            weekday: { 'PEE1 PT': 15, 'PEE1 HS': 17, 'PEE1 IC': 4, 'PEE1 CJ': 3, 'PEE2 PT': 8, 'PEE2 HS': 6, 'PSKH PSKH': 7 },
            weekend: { 'PEE1 PT': 3, 'PEE1 HS': 4, 'PEE1 IC': 1, 'PEE1 CJ': 1, 'PEE2 PT': 2, 'PEE2 HS': 2, 'PSKH PSKH': 1 },
        },
        '2024-09-16': {
            weekday: { 'PEE1 PT': 15, 'PEE1 HS': 17, 'PEE1 IC': 4, 'PEE1 CJ': 3, 'PEE2 PT': 8, 'PEE2 HS': 6, 'PSKH PSKH': 7 },
            weekend: { 'PEE1 PT': 3, 'PEE1 HS': 4, 'PEE1 IC': 1, 'PEE1 CJ': 1, 'PEE2 PT': 2, 'PEE2 HS': 2, 'PSKH PSKH': 1 },
        },
        '2024-09-23': {
            weekday: { 'PEE1 PT': 15, 'PEE1 HS': 17, 'PEE1 IC': 4, 'PEE1 CJ': 3, 'PEE2 PT': 8, 'PEE2 HS': 6, 'PSKH PSKH': 7 },
            weekend: { 'PEE1 PT': 3, 'PEE1 HS': 4, 'PEE1 IC': 1, 'PEE1 CJ': 1, 'PEE2 PT': 2, 'PEE2 HS': 2, 'PSKH PSKH': 1 },
        },
        '2024-09-30': {
            weekday: { 'PEE1 PT': 15, 'PEE1 HS': 17, 'PEE1 IC': 4, 'PEE1 CJ': 3, 'PEE2 PT': 8, 'PEE2 HS': 6, 'PSKH PSKH': 7 },
            weekend: { 'PEE1 PT': 3, 'PEE1 HS': 4, 'PEE1 IC': 1, 'PEE1 CJ': 1, 'PEE2 PT': 2, 'PEE2 HS': 2, 'PSKH PSKH': 1 },
        },

        //10월
        '2024-10-07': {
            weekday: { 'PEE1 PT': 14, 'PEE1 HS': 19, 'PEE1 IC': 4, 'PEE1 CJ': 4, 'PEE2 PT': 7, 'PEE2 HS': 6, 'PSKH PSKH': 7 },
            weekend: { 'PEE1 PT': 3, 'PEE1 HS': 4, 'PEE1 IC': 1, 'PEE1 CJ': 1, 'PEE2 PT': 1, 'PEE2 HS': 1, 'PSKH PSKH': 1 },
        },
        '2024-10-14': {
            weekday: { 'PEE1 PT': 14, 'PEE1 HS': 19, 'PEE1 IC': 4, 'PEE1 CJ': 4, 'PEE2 PT': 7, 'PEE2 HS': 6, 'PSKH PSKH': 7 },
            weekend: { 'PEE1 PT': 3, 'PEE1 HS': 4, 'PEE1 IC': 1, 'PEE1 CJ': 1, 'PEE2 PT': 1, 'PEE2 HS': 1, 'PSKH PSKH': 1 },
        },
        '2024-10-21': {
            weekday: { 'PEE1 PT': 14, 'PEE1 HS': 19, 'PEE1 IC': 4, 'PEE1 CJ': 4, 'PEE2 PT': 7, 'PEE2 HS': 6, 'PSKH PSKH': 7 },
            weekend: { 'PEE1 PT': 3, 'PEE1 HS': 4, 'PEE1 IC': 1, 'PEE1 CJ': 1, 'PEE2 PT': 1, 'PEE2 HS': 1, 'PSKH PSKH': 1 },
        },
        '2024-10-28': {
            weekday: { 'PEE1 PT': 11.1, 'PEE1 HS': 17.7, 'PEE1 IC': 2.5, 'PEE1 CJ': 2.6, 'PEE2 PT': 5.3, 'PEE2 HS': 4.3, 'PSKH PSKH': 7.2 },
            weekend: { 'PEE1 PT': 3, 'PEE1 HS': 4, 'PEE1 IC': 1, 'PEE1 CJ': 1, 'PEE2 PT': 1, 'PEE2 HS': 1, 'PSKH PSKH': 1 },
        },
        //11월
        '2024-11-04': {
            weekday: { 'PEE1 PT': 11.1, 'PEE1 HS': 17.7, 'PEE1 IC': 2.5, 'PEE1 CJ': 2.6, 'PEE2 PT': 5.3, 'PEE2 HS': 4.3, 'PSKH PSKH': 7.2 },
            weekend: { 'PEE1 PT': 3, 'PEE1 HS': 4, 'PEE1 IC': 1, 'PEE1 CJ': 1, 'PEE2 PT': 1, 'PEE2 HS': 1, 'PSKH PSKH': 1 },
        },
    };

    let currentYear = new Date().getFullYear();
    let currentMonth = new Date().getMonth();
    const today = new Date();
    let weeklyOperatingRateChart;

    let logs = await loadWorkLogs();
    renderCalendar(logs, currentYear, currentMonth);

    document.getElementById('day-type-select').value = 'all';
    applyFilters('all');

    document.getElementById('prev-month').addEventListener('click', () => {
        if (currentMonth === 0) {
            currentMonth = 11;
            currentYear--;
        } else {
            currentMonth--;
        }
        applyFilters();
    });

    document.getElementById('next-month').addEventListener('click', () => {
        if (currentMonth === 11) {
            currentMonth = 0;
            currentYear++;
        } else {
            currentMonth++;
        }
        applyFilters();
    });

    document.getElementById('filter-btn').addEventListener('click', applyFilters);

    document.getElementById('reset-btn').addEventListener('click', () => {
        document.getElementById('start-date').value = '';
        document.getElementById('end-date').value = '';
        document.getElementById('group-select').value = '';
        document.getElementById('site-select').value = '';
        document.getElementById('day-type-select').value = 'all'; // 날짜 타입 필터 초기화
        applyFilters();
    });

    async function loadWorkLogs() {
        try {
            const response = await axios.get('http://3.37.73.151:3001/logs', {
                headers: {
                    'x-access-token': localStorage.getItem('x-access-token')
                }
            });
            return response.data;
        } catch (error) {
            console.error('작업 일지를 불러오는 중 오류 발생:', error);
            return [];
        }
    }
    



    async function applyFilters() {
        const startDate = document.getElementById('start-date').value;
        const endDate = document.getElementById('end-date').value;
        const group = document.getElementById('group-select').value;
        const site = document.getElementById('site-select').value;
        const dayType = document.getElementById('day-type-select').value;
    
        const filteredLogs = logs.filter(log => {
            const logDate = log.task_date;
            const dateMatch = (!startDate || logDate >= startDate) && (!endDate || logDate <= endDate);
            const groupMatch = !group || log.group === group;
            const siteMatch = !site || log.site === site;
    
            const logDateStr = new Date(logDate).toISOString().split('T')[0];
            const dayOfWeek = new Date(logDate).getDay();
            const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
            const isHoliday = holidays.includes(logDateStr);
    
            // "전체"가 선택된 경우 모든 날짜를 포함
            let dayTypeMatch = true;
            if (dayType === 'workday') {
                dayTypeMatch = !isWeekend && !isHoliday;
            } else if (dayType === 'holiday') {
                dayTypeMatch = isWeekend || isHoliday;
            }
    
            const isFutureDate = new Date(logDate) > today;
    
            return dateMatch && groupMatch && siteMatch && dayTypeMatch && !isFutureDate;
        });
    
        renderCalendar(filteredLogs, currentYear, currentMonth, dayType);
    }
    
    
    
    
    
    
    
    
    
    
    
    
    


    function getTotalEngineersByFilter(weekKey, isWeekend, group, site) {
        const engineerCountData = weeklyEngineerCount[weekKey];
        if (!engineerCountData) return 0;
    
        const dayType = isWeekend ? 'weekend' : 'weekday';
        const selectedData = engineerCountData[dayType];
    
        return Object.keys(selectedData).reduce((total, key) => {
            const [grp, st] = key.split(' ');
    
            // 그룹과 사이트가 모두 선택된 경우 정확히 일치하는 항목만 합산
            if (group && site) {
                if (group === grp && site === st) {
                    total += selectedData[key];
                }
            }
            // 그룹만 선택된 경우 해당 그룹의 모든 사이트 합산
            else if (group && !site) {
                if (group === grp) {
                    total += selectedData[key];
                }
            }
            // 사이트만 선택된 경우 해당 사이트의 모든 그룹 합산
            else if (!group && site) {
                if (site === st) {
                    total += selectedData[key];
                }
            }
            // 그룹과 사이트 모두 선택되지 않은 경우 전체 합산
            else {
                total += selectedData[key];
            }
    
            return total;
        }, 0);
    }
    

    function renderCalendar(filteredLogs, year, month, dayType) {
        const calendarContainer = document.getElementById('calendar-container');
        calendarContainer.innerHTML = '';
    
        const monthDisplay = document.getElementById('current-month');
        monthDisplay.innerText = `${year}년 ${month + 1}월`;
    
        renderDaysRow();
    
        const firstDayOfMonth = new Date(Date.UTC(year, month, 1)).getUTCDay();
        const adjustedFirstDay = (firstDayOfMonth + 6) % 7;
        const totalDays = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
        const lastDayOfMonth = new Date(Date.UTC(year, month, totalDays)).getUTCDay();
    
        const logsByDate = {};
        const weeklyRates = {}; // 주차별 가동율을 저장할 객체
    
        filteredLogs.forEach(log => {
            const logDate = new Date(new Date(log.task_date).getTime() + 9 * 60 * 60 * 1000).toISOString().split('T')[0];
            if (!logsByDate[logDate]) logsByDate[logDate] = [];
            logsByDate[logDate].push(log);
        });
    
        // 이전 달 날짜 채우기
        const prevMonthLastDate = new Date(Date.UTC(year, month, 0)).getUTCDate();
        const prevMonthYear = month === 0 ? year - 1 : year;
        const prevMonth = month === 0 ? 11 : month - 1;
    
        for (let i = adjustedFirstDay; i > 0; i--) {
            const day = prevMonthLastDate - i + 1;
            const dateString = `${prevMonthYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayDiv = createDayDiv(dateString, logsByDate[dateString], weeklyRates, dayType);
            calendarContainer.appendChild(dayDiv);
        }
    
        // 현재 달 날짜 채우기
        for (let day = 1; day <= totalDays; day++) {
            const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayDiv = createDayDiv(dateString, logsByDate[dateString], weeklyRates, dayType);
            calendarContainer.appendChild(dayDiv);
        }
    
        // 마지막 주 일요일까지 날짜 채우기
        const nextMonthYear = month === 11 ? year + 1 : year;
        const nextMonth = month === 11 ? 0 : month + 1;
        let daysToAdd = 6 - lastDayOfMonth;
        if (daysToAdd < 0) daysToAdd += 7;
    
        for (let i = 1; i <= daysToAdd; i++) {
            const day = i;
            const dateString = `${nextMonthYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayDiv = createDayDiv(dateString, logsByDate[dateString], weeklyRates, dayType);
            calendarContainer.appendChild(dayDiv);
        }
    
        // 마지막으로 하루 더 출력
        const extraDay = daysToAdd + 1;
        const extraDateString = `${nextMonthYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(extraDay).padStart(2, '0')}`;
        const extraDayDiv = createDayDiv(extraDateString, logsByDate[extraDateString], weeklyRates, dayType);
        calendarContainer.appendChild(extraDayDiv);
    
        // 주차별 평균 가동율 계산
        const weeklyAverageRates = Object.keys(weeklyRates)
            .sort((a, b) => new Date(a) - new Date(b))
            .map(weekKey => {
                const rates = weeklyRates[weekKey];
                if (rates && rates.length > 0) {
                    const averageRate = rates.reduce((a, b) => a + b, 0) / rates.length;
                    return { week: formatWeekLabel(weekKey), averageRate: Number(averageRate.toFixed(3)) };
                } else {
                    return { week: formatWeekLabel(weekKey), averageRate: 0 };
                }
            });
    
        renderWeeklyOperatingRateChart(weeklyAverageRates);
    }
    
    function createDayDiv(dateString, dailyLogs = [], weeklyRates, dayType, isEmpty = false) {
        const dayDiv = document.createElement('div');
        dayDiv.classList.add('calendar-day');
    
        const date = new Date(new Date(dateString).getTime() + 9 * 60 * 60 * 1000);
        const dayOfWeek = date.getUTCDay();
        const isWeekend = (dayOfWeek === 6 || dayOfWeek === 0);
        const isHoliday = holidays.includes(dateString);
    
        // 오늘 이후 날짜는 빈공간으로 설정
        if (date > today) {
            dayDiv.classList.add('empty');
            return dayDiv;
        }
    
        if (isHoliday) {
            dayDiv.classList.add('holiday');
        }
        if (isWeekend) {
            dayDiv.classList.add('weekend');
        }
    
        if (isEmpty) {
            dayDiv.classList.add('empty');
            return dayDiv;
        }
    
        const taskCount = dailyLogs.length;
        const totalMinutes = dailyLogs.reduce((acc, log) => {
            const workerCount = log.task_man.split(',').length;
            const [hours, minutes] = log.task_duration.split(':').map(Number);
            return acc + (hours * 60 + minutes) * workerCount;
        }, 0);
    
        const additionalTime = Array.from(new Set(dailyLogs.flatMap(log => log.task_man.split(',').map(worker => worker.trim().split('(')[0].trim())))).reduce((acc, worker) => {
            const workerTaskCount = dailyLogs.filter(log => log.task_man.includes(worker)).length;
            return acc + (workerTaskCount === 1 ? 4 : 4.5);
        }, 0);
    
        const totalWorkHours = totalMinutes / 60 + additionalTime;
        const requiredEngineers = (totalWorkHours / 8).toFixed(1);
    
        const group = document.getElementById('group-select').value;
        const site = document.getElementById('site-select').value;
        const weekKey = getWeekKey(dateString);
        const totalEngineers = getTotalEngineersByFilter(weekKey, isWeekend || isHoliday, group, site);
        const operatingRate = totalEngineers ? ((requiredEngineers / totalEngineers) * 100).toFixed(1) : 0;
    
        if (!weeklyRates[weekKey]) weeklyRates[weekKey] = [];
    
        // 주차별 평균에 포함할 날짜의 조건을 설정합니다.
        if (dayType === 'all' || 
            (dayType === 'workday' && !isWeekend && !isHoliday) || 
            (dayType === 'holiday' && (isWeekend || isHoliday))) {
             weeklyRates[weekKey].push(parseFloat(operatingRate));
         }
    
        if (operatingRate === "0.0") {
            dayDiv.classList.add('empty');
            return dayDiv;
        }
    
        if (operatingRate >= 100) {
            dayDiv.classList.add('lack');
        } else if (operatingRate >= 70 && operatingRate < 100) {
            dayDiv.classList.add('optimal');
        } else if (operatingRate > 0 && operatingRate < 70) {
            dayDiv.classList.add('surplus');
        }
    
        const dateElement = document.createElement('h2');
        dateElement.innerText = date.toISOString().split('T')[0];
        dayDiv.appendChild(dateElement);
    
        const taskCountElement = document.createElement('p');
        taskCountElement.classList.add('task-count');
        taskCountElement.innerText = `건 수: ${taskCount}`;
        dayDiv.appendChild(taskCountElement);
    
        const requiredEngineersElement = document.createElement('p');
        requiredEngineersElement.classList.add('required-engineers');
        requiredEngineersElement.innerText = `필요 Eng'r 수: ${requiredEngineers}`;
        dayDiv.appendChild(requiredEngineersElement);
    
        const operatingRateElement = document.createElement('p');
        operatingRateElement.classList.add('operating-rate');
        operatingRateElement.innerText = `가동율: ${operatingRate}%`;
        dayDiv.appendChild(operatingRateElement);
    
        dayDiv.addEventListener('click', () => openModal(dateString, dailyLogs));
        return dayDiv;
    }
    
    
    
    
    
    
    
    
    
    
    

    function formatWeekLabel(weekKey) {
        const [year, month, day] = weekKey.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        const weekNumber = getWeekNumber(date);
        const monthName = date.toLocaleString('en', { month: 'short' });
        return `${monthName} - ${weekNumber}W`;
    }
    

    function getWeekNumber(date) {
        const startOfYear = new Date(date.getFullYear(), 0, 1);
        const dayOfYear = ((date - startOfYear + 86400000) / 86400000);
        return Math.ceil((dayOfYear + startOfYear.getDay() + 1) / 7);
    }
    

    function renderWeeklyOperatingRateChart(weeklyAverageRates) {
        const ctx = document.getElementById('weeklyOperatingRateChart').getContext('2d');
        const labels = weeklyAverageRates.map(item => item.week);
        const data = weeklyAverageRates.map(item => item.averageRate);
        
        // 가동률을 시간으로 변환한 값을 보조 축 데이터로 사용합니다 (8시간 기준 가동률)
        const timeData = data.map(rate => (rate / 100) * 8); // 근무 시간 계산 (가동률의 8시간 기준)
        const maxTimeValue = Math.max(...timeData) * 1.2;
        const maxRateValue = Math.max(...data) * 1.6;
    
        if (weeklyOperatingRateChart) {
            weeklyOperatingRateChart.destroy();
        }
    
        weeklyOperatingRateChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [
                    {
                        label: '주차별 평균 가동율 (%)',
                        data,
                        backgroundColor: 'rgba(54, 162, 235, 0.6)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 1,
                        yAxisID: 'y',
                    },
                    {
                        label: '근무 시간 (시간)',
                        data: timeData,
                        type: 'line',
                        borderColor: 'rgba(255, 99, 132, 1)',
                        backgroundColor: 'rgba(255, 99, 132, 0.2)',
                        yAxisID: 'y1',
                        fill: false // 음영 제거
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    datalabels: {
                        display: true,
                        formatter: (value, context) => {
                            const datasetLabel = context.dataset.label;
                            if (datasetLabel === '근무 시간 (시간)') {
                                const hours = Math.floor(value);
                                const minutes = Math.round((value - hours) * 60);
                                return `${hours}시간 ${minutes}분`;
                            }
                            return `${value}%`;
                        },
                        color: '#000',
                        anchor: 'end',
                        align: 'top',
                        font: {
                            size: 14 // 데이터 레이블의 폰트 크기 조정
                        }
                        
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            font: {
                                size: 14 // x축 폰트 크기 조정
                            }
                        }
                    },
                    y: {
                        beginAtZero: true,
                        max: maxRateValue, // 가동율 최대값 설정
                        title: {
                            display: true,
                            text: '가동율 (%)'
                        },
                        ticks: {
                            display: false // 주축 값 숨김 처리
                        }
                    },
                    y1: {
                        beginAtZero: true,
                        max: maxTimeValue, // 동적 최대값 설정
                        position: 'right', // 보조 축을 오른쪽에 표시
                        title: {
                            display: true,
                            text: '근무 시간 (시간)'
                            
                        },
                        ticks: {
                            font: {
                                size: 14 // y1축 폰트 크기 조정
                            },
                            display: false, // 주축 값 숨김 처리
                            callback: function(value) {
                                const hours = Math.floor(value);
                                const minutes = Math.round((value - hours) * 60);
                                return `${hours}시간 ${minutes}분`;
                                
                            }
                        }
                    }
                }
            },
            plugins: [ChartDataLabels] // dataLabels 플러그인 활성화
        });
    }
    
    


    function renderDaysRow() {
        const daysRow = document.getElementById('days-row');
        daysRow.innerHTML = '';
        const days = ['월', '화', '수', '목', '금', '토', '일'];
        
        days.forEach(day => {
            const dayElement = document.createElement('div');
            dayElement.classList.add('day-header');
            dayElement.innerText = day;
            daysRow.appendChild(dayElement);
        });
    }

    function openModal(dateString, dailyLogs) {
        const modal = document.getElementById('modal');
        const uniqueWorkers = new Set();
        const workerTasks = {};

        dailyLogs.forEach(log => {
            const workers = log.task_man.split(',').map(worker => worker.trim().split('(')[0].trim());
            workers.forEach(worker => {
                uniqueWorkers.add(worker);
                workerTasks[worker] = (workerTasks[worker] || 0) + 1;
            });
        });

        const totalMinutes = calculateTotalMinutes(dailyLogs);
        const additionalTime = Array.from(uniqueWorkers).reduce((acc, worker) => {
            const taskCount = workerTasks[worker];
            return acc + (taskCount === 1 ? 4 : 4.5);
        }, 0);

        const totalWorkHours = (totalMinutes / 60) + additionalTime;
        const requiredEngineers = (totalWorkHours / 8).toFixed(1);
        
        const isWeekend = holidays.includes(dateString) || new Date(dateString).getDay() === 6 || new Date(dateString).getDay() === 0;
        const group = document.getElementById('group-select').value;
        const site = document.getElementById('site-select').value;
        const weekKey = getWeekKey(dateString);
        const totalEngineers = getTotalEngineersByFilter(weekKey, isWeekend, group, site);
        const operatingRate = totalEngineers ? ((requiredEngineers / totalEngineers) * 100).toFixed(2) : "N/A";

        // INFO 탭 컨텐츠 설정
        document.getElementById('modal-info').innerHTML = `
            <!-- INFO Tab Content -->
            <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                <tr>
                    <th style="text-align: left; padding: 8px; border-bottom: 1px solid #ddd;">항목</th>
                    <th style="text-align: left; padding: 8px; border-bottom: 1px solid #ddd;">내용</th>
                </tr>
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">작업 시간</td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">${Math.floor(totalMinutes / 60)}시간 ${totalMinutes % 60}분</td>
                </tr>
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">1건 진행한 인원 수</td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">${Object.values(workerTasks).filter(cnt => cnt === 1).length}명</td>
                </tr>
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">2건 이상 진행한 인원 수</td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">${Object.values(workerTasks).filter(cnt => cnt >= 2).length}명</td>
                </tr>
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">근무 시간</td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">
                        <div>작업 시간 + (1건 작업 인원 수 x 4시간) + (2건 이상 작업 인원 수 x 4.5시간)</div>
                        <div>
                            <strong>${Math.floor(totalMinutes / 60)}시간 ${totalMinutes % 60}분</strong> + 
                            (<strong>${Object.values(workerTasks).filter(cnt => cnt === 1).length}명</strong> x 4시간) + 
                            (<strong>${Object.values(workerTasks).filter(cnt => cnt >= 2).length}명</strong> x 4.5시간)
                            = <strong>${totalWorkHours.toFixed(1)}시간</strong>
                        </div>
                    </td>
                </tr>
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">필요 Eng'r 수</td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">
                        <div>총 근무 시간 / 8</div>
                        <div><strong>${totalWorkHours.toFixed(1)}</strong> / 8 = <strong>${requiredEngineers}</strong></div>
                    </td>
                </tr>
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">가동율</td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">
                        <div>(필요 Eng'r 수 / 주간 가용 Eng'r 수) x 100</div>
                        <div>(${requiredEngineers} / ${totalEngineers}) x 100 = <strong>${operatingRate}%</strong></div>
                    </td>
                </tr>
            </table>
            <div style="margin-top: 20px; font-size: 14px; line-height: 1.5; color: #555;">
                <strong>IT TIME ( 4시간, 4.5시간 ) 에 대한 근거</strong><br>
                -. IT TIME : FAB 내에서 작업하는 시간 및 식사시간을 제외한 시간<br>
                -. 1건 작업 시 IT TIME(4시간) : TBM(0.5시간) + 작업 분배 및 준비(1시간) + 이력 작성(0.5시간) + 이동시간(2시간)<br>
                -. 2건 작업 시 IT TIME(4.5시간) : TBM(0.5시간) + 작업 분배 및 준비(1시간) + 이력 작성(0.5시간) + 이동시간(2.5시간)<br>
                -. 이동시간에는 Site 이동 및 방진복 착용, Air Shower 등의 시간이 포함됨
            </div>
        `;
        const workTypeSummary = summarizeWorkTypes(dailyLogs);
        document.getElementById('modal-worker').innerHTML = `
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
            <thead>
                <tr style="background-color: #f2f2f2;">
                    <th style="text-align: left; padding: 8px; border-bottom: 1px solid #ddd;">작업 유형</th>
                    <th style="text-align: right; padding: 8px; border-bottom: 1px solid #ddd;">작업 건수</th>
                    <th style="text-align: right; padding: 8px; border-bottom: 1px solid #ddd;">작업 시간</th>
                    <th style="text-align: right; padding: 8px; border-bottom: 1px solid #ddd;">비중 (%)</th>
                </tr>
            </thead>
            <tbody>
                ${workTypeSummary.map(item => `
                    <tr>
                        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.type}</td>
                        <td style="padding: 8px; text-align: right; border-bottom: 1px solid #ddd;">${item.count} 건</td>
                        <td style="padding: 8px; text-align: right; border-bottom: 1px solid #ddd;">${item.hours.toFixed(1)} 시간</td>
                        <td style="padding: 8px; text-align: right; border-bottom: 1px solid #ddd;">${item.percentage}%</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
        modal.style.display = "block";
    }

    function summarizeWorkTypes(dailyLogs) {
        const workTypeCounts = { 'SET UP': 0, 'MAINT': 0, 'RELOCATION': 0 };
        const workTypeTimes = { 'SET UP': 0, 'MAINT': 0, 'RELOCATION': 0 };

        dailyLogs.forEach(log => {
            if (workTypeCounts[log.work_type] !== undefined) {
                workTypeCounts[log.work_type]++;
                const [hours, minutes] = log.task_duration.split(':').map(Number);
                workTypeTimes[log.work_type] += hours + minutes / 60;
            }
        });

        const totalTasks = Object.values(workTypeCounts).reduce((a, b) => a + b, 0);
        return Object.keys(workTypeCounts).map(type => ({
            type,
            count: workTypeCounts[type],
            hours: workTypeTimes[type],
            percentage: totalTasks ? ((workTypeCounts[type] / totalTasks) * 100).toFixed(1) : 0
        }));
    }

    // Event listeners for tab switching
    document.getElementById('info-tab').addEventListener('click', () => {
        document.getElementById('modal-info').style.display = 'block';
        document.getElementById('modal-worker').style.display = 'none';
    });
    document.getElementById('worker-tab').addEventListener('click', () => {
        document.getElementById('modal-info').style.display = 'none';
        document.getElementById('modal-worker').style.display = 'block';
    });
    
    

    // 모달 닫기 기능 추가
    const closeModalButton = document.getElementById('close-modal');
    closeModalButton.addEventListener('click', () => {
        const modal = document.getElementById('modal');
        modal.style.display = "none";
    });

    window.addEventListener('click', (event) => {
        const modal = document.getElementById('modal');
        if (event.target === modal) modal.style.display = "none";
    });

    function calculateTotalMinutes(dailyLogs) {
        return dailyLogs.reduce((acc, log) => {
            const workerCount = log.task_man.split(',').length;
            const [hours, minutes] = log.task_duration.split(':').map(Number);
            return acc + (hours * 60 + minutes) * workerCount;
        }, 0);
    }


    function getWeekKey(dateString) {
        const date = new Date(dateString);
        const dayOfWeek = date.getDay(); // Sunday = 0, Monday = 1, ..., Saturday = 6
        const diffToMonday = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek; // Adjust to get previous Monday
        const monday = new Date(date);
        monday.setDate(date.getDate() + diffToMonday);
    
        // Format as yyyy-mm-dd to match keys in weeklyEngineerCount
        return `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;
    }
    
});