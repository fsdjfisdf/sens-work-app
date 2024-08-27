document.addEventListener('DOMContentLoaded', function() {
    const monthInput = document.getElementById('month');
    const calendarContainer = document.getElementById('calendar');
    const copyButton = document.getElementById('copy-report');
    const generateReportButton = document.getElementById('generate-report');

    // 공휴일 목록
    const holidays = [
        '2024-08-15', '2024-09-16', '2024-09-17', 
        '2024-09-18', '2024-10-03', '2024-10-09', 
        '2024-12-25'
    ];

    monthInput.addEventListener('change', function() {
        const selectedMonth = new Date(this.value);
        generateCalendar(selectedMonth.getFullYear(), selectedMonth.getMonth());
    });

    generateReportButton.addEventListener('click', function() {
        const reportData = collectReportData();
        displayReport(reportData);
        copyButton.style.display = 'block'; // 복사하기 버튼을 보고서 생성 후에 나타나게 함
    });

    copyButton.addEventListener('click', function() {
        const reportOutput = document.getElementById('report-output');
        const selection = window.getSelection();
        selection.removeAllRanges();
        const range = document.createRange();
        range.selectNodeContents(reportOutput);
        selection.addRange(range);
        document.execCommand('copy');
        selection.removeAllRanges();
        alert('보고서 내용이 복사되었습니다.');
    });

    function generateCalendar(year, month) {
        calendarContainer.innerHTML = ''; // 이전 달력 초기화
        const daysInMonth = new Date(year, month + 1, 0).getDate(); // 해당 월의 총 일수
        const startDay = new Date(year, month, 1).getDay(); // 해당 월의 첫날 요일

        let calendarHTML = '<div class="calendar-grid">';
        const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

        // 요일 헤더 추가
        dayNames.forEach(day => {
            calendarHTML += `<div class="calendar-header">${day}</div>`;
        });

        // 빈 셀 채우기 (첫 주의 시작 요일까지)
        for (let i = 0; i < startDay; i++) {
            calendarHTML += '<div class="empty-cell"></div>';
        }

        // 날짜 셀 추가
        for (let day = 1; day <= daysInMonth; day++) {
            const dateId = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayOfWeek = new Date(year, month, day).getDay();
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            const isHoliday = holidays.includes(dateId);
            const isRedDay = isWeekend || isHoliday;
            const defaultValue = isRedDay ? "휴일" : "평일";
            const options = isRedDay
                ? '<option value="휴일" style="color: gray;">휴일</option><option value="근무" style="color: red;">근무</option>'
                : '<option value="평일" style="color: blue;">평일</option><option value="휴가" style="color: green;">휴가</option><option value="반차" style="color: orange;">반차</option><option value="반반차" style="color: purple;">반반차</option><option value="사내" style="color: teal;">사내</option>';

            calendarHTML += `
                <div class="calendar-cell">
                    <div class="date-label" style="color: ${isRedDay ? 'red' : 'black'};">${day}</div>
                    <select id="${dateId}">
                        ${options}
                    </select>
                </div>`;
        }

        // 마지막 주의 빈 셀 채우기
        const totalCells = startDay + daysInMonth;
        const remainingCells = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
        for (let i = 0; i < remainingCells; i++) {
            calendarHTML += '<div class="empty-cell"></div>';
        }

        calendarHTML += '</div>';
        calendarContainer.innerHTML = calendarHTML;
    }

    function countWeekdays(year, month) {
        let weekdays = 0;
        let weekends = 0;
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dayOfWeek = date.getDay();
            const dateId = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isHoliday = holidays.includes(dateId);

            if (dayOfWeek === 0 || dayOfWeek === 6 || isHoliday) {
                weekends++;
            } else {
                weekdays++;
            }
        }

        return { weekdays, weekends };
    }

    function collectReportData() {
        const inputs = document.querySelectorAll('.calendar-cell select');
        let reportData = {
            weekdaysWorked: 0,
            holidayCount: 0,
            holidayWork: 0,
            personalLeaveDays: 0, // 연차 일수 누적
            personalLeave: [],
            holidayDetails: [],
            officeWork: [],
            blankWeekdays: 0,
        };
    
        const selectedMonth = new Date(monthInput.value);
        const { weekdays, weekends } = countWeekdays(selectedMonth.getFullYear(), selectedMonth.getMonth());
    
        inputs.forEach(input => {
            const value = input.value.trim();
            const date = input.id.split('-');
            const dayOfWeek = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), parseInt(date[2], 10)).getDay();
            const dateId = `${selectedMonth.getFullYear()}-${String(selectedMonth.getMonth() + 1).padStart(2, '0')}-${String(date[2]).padStart(2, '0')}`;
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            const isHoliday = holidays.includes(dateId);
            const isRedDay = isWeekend || isHoliday;
            const formattedDate = `${parseInt(date[1], 10)}월 ${parseInt(date[2], 10)}일`;
    
            if (value === '휴가') {
                reportData.personalLeave.push(formattedDate);
                reportData.personalLeaveDays += 1;
            } else if (value === '반차') {
                reportData.personalLeave.push(formattedDate);
                reportData.personalLeaveDays += 0.5;
            } else if (value === '반반차') {
                reportData.personalLeave.push(formattedDate);
                reportData.personalLeaveDays += 0.25;
            } else if (value === '주말근무' || value === '근무') {
                reportData.holidayWork += 1;
                reportData.holidayDetails.push(formattedDate);
            } else if (value === '사내') {
                reportData.officeWork.push(formattedDate);
            } else if (value === '평일' && !isRedDay) {
                reportData.blankWeekdays += 1; // 평일 중 '평일'로 선택된 날짜
            }
        });
    
        return {
            weekdays: weekdays,
            weekends: weekends,
            weekdaysWorked: reportData.blankWeekdays, // 평일 중 '평일'로 선택된 날짜의 수
            holidayCount: weekends,
            holidayWork: reportData.holidayWork,
            personalLeaveDays: reportData.personalLeaveDays,
            personalLeave: reportData.personalLeave,
            holidayDetails: reportData.holidayDetails,
            officeWork: reportData.officeWork,
            selectedMonthText: `${selectedMonth.getMonth() + 1}월`, // 선택된 월 텍스트
        };
    }

    function displayReport(data) {
        let reportHTML = `
            <h3>- ${data.selectedMonthText} 국내 출장 내역</h3>
            <h4>1. 출장 근무 내역</h4>
            <table class="report-table">
                <tr>
                    <th class="report-header">NO</th>
                    <th class="report-header">근무형태</th>
                    <th class="report-header">총 일수</th>
                    <th class="report-header">근무 일수</th>
                </tr>
                <tr>
                    <td class="report-cell">1</td>
                    <td class="report-cell">평일</td>
                    <td class="report-cell">${data.weekdays}</td>
                    <td class="report-cell">${data.weekdaysWorked}</td>
                </tr>
                <tr>
                    <td class="report-cell">2</td>
                    <td class="report-cell">휴일</td>
                    <td class="report-cell">${data.weekends}</td>
                    <td class="report-cell">${data.holidayWork}</td>
                </tr>
                <tr>
                    <td colspan="2" class="report-cell bold-text">합계</td>
                    <td class="report-cell bold-text">${data.weekdays + data.weekends}</td>
                    <td class="report-cell bold-text">${data.weekdaysWorked + data.holidayWork}</td>
                </tr>
            </table>
            <p>* 전체 ${data.selectedMonthText} 출장 근무 ${data.weekdays + data.weekends} 일 중 ${data.weekdaysWorked + data.holidayWork}일 근무</p>
            <h4>2. 휴일 근무 내역</h4>
            ${data.holidayDetails.length > 0 ? `<p class="report-date">${data.holidayDetails.join('</p><p class="report-date">')}</p>` : '<p class="inline-text">- 없음</p>'}
            ${data.holidayDetails.length > 0 ? `<p>* 휴일 근무 ${data.weekends}일 중 ${data.holidayWork}일 근무</p>` : ''}
            <h4>3. 사내 근무 내역</h4>
            ${data.officeWork.length > 0 ? `<p class="report-date">${data.officeWork.join('</p><p class="report-date">')}</p>` : '<p class="inline-text">- 없음</p>'}
            <h4>4. 개인 휴가 내역</h4>
            ${data.personalLeave.length > 0 ? 
                `<p class="report-date">${data.personalLeave.join('</p><p class="report-date">')}</p>` 
                : `<p class="inline-text">- 없음${'&nbsp;'.repeat(50)}-끝-</p>`}
            <div class="report-summary" style="margin-top: ${data.endTextMargin}px;">
                ${data.personalLeave.length > 0 ? `<p>* 연차소진으로 인한 ${data.personalLeaveDays}일 연차 사용${'&nbsp;'.repeat(12)}-끝-</p>` : ''}
            </div>
        `;
    
        document.getElementById('report-output').innerHTML = reportHTML;
    }
});

document.getElementById('generate-report').addEventListener('click', function() {
    const reportData = collectReportData();
    displayReport(reportData);

    // 보고서 생성 후 복사하기 버튼 표시
    document.getElementById('copy-report').style.display = 'inline-block';
});
