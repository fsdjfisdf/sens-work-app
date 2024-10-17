document.addEventListener('DOMContentLoaded', async () => {
    let logs = [];
    let currentUserNickname = null; // 현재 로그인한 사용자의 닉네임
    const currentDate = new Date(); // 현재 날짜
    const currentMonth = currentDate.getMonth() + 1; // 현재 월
    const currentYear = currentDate.getFullYear(); // 현재 연도
    const holidays = [
        '2024-01-01', '2024-02-09', '2024-02-10', '2024-02-11', '2024-02-12',
        '2024-03-01', '2024-05-05', '2024-05-06', '2024-05-15', '2024-06-06',
        '2024-08-15', '2024-09-16', '2024-09-17', '2024-09-18', '2024-10-03',
        '2024-10-09', '2024-12-25'
    ];

    await getCurrentUser();  // 사용자 정보를 가져오는 함수 호출
    await loadWorkLogs();

    function getDaysInMonth(year, month) {
        return new Date(year, month, 0).getDate();
    }

    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const datesArray = Array.from({ length: daysInMonth }, (v, i) => `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`);

    function isWeekend(dateString) {
        const date = new Date(dateString);
        const day = date.getDay();
        return day === 0 || day === 6;
    }

    function formatTaskDuration(duration) {
        const [hours, minutes] = duration.split(':').map(Number);
        const totalHours = hours + (minutes > 0 ? minutes / 60 : 0);
        return totalHours.toFixed(2) + " Hrs";
    }

    function exportToExcel() {
        const userLogs = logs.filter(log => log.task_man.includes(currentUserNickname));
        
        const logsByDate = userLogs.reduce((acc, log) => {
            const date = log.task_date.split('T')[0];
            if (!acc[date]) acc[date] = [];
            acc[date].push(log);
            return acc;
        }, {});
    
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Worklog');
    
        // A1 셀에 제목 추가
        worksheet.getCell('A1').value = `${currentUserNickname} - ${currentMonth}월 - 국내출장보고서 근거자료`;
        worksheet.getCell('A1').font = { bold: true };
    
        // A3 셀부터 헤더 추가
        worksheet.getRow(3).values = ['날짜', '현장대응', 'SITE(LINE)', '작업내용', '작업시간(Hr)', '비고'];
    
        // 스타일 적용 (헤더는 A3부터 시작)
        worksheet.getRow(3).eachCell(cell => {
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFD9EAD3' } // 연녹색 배경
            };
            cell.font = { bold: true };
            cell.alignment = { horizontal: 'center' };
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
        });

            // 전체 열 너비 조절 (모든 열의 너비를 일괄적으로 20으로 설정)
    for (let i = 1; i <= 6; i++) {
        worksheet.getColumn(i).width = 12;  // 각 열의 너비를 20으로 설정
    }
    
        let weekdaysCount = 0;
        let onsiteCount = 0;
        let holidayWorkCount = 0;
    
        // 데이터 추가 (A4부터 시작)
        datesArray.forEach((date, index) => {
            const dayLogs = logsByDate[date] || [];
            const isHoliday = holidays.includes(date);
            const isWeekendFlag = isWeekend(date);
    
            if (!isHoliday && !isWeekendFlag) weekdaysCount++; // 평일 계산
            if (dayLogs.length > 0) onsiteCount++; // 현장 대응일 계산
            if (dayLogs.length > 0 && (isHoliday || isWeekendFlag)) holidayWorkCount++; // 휴일 근무일 계산
    
            worksheet.getRow(4 + index).values = [
                date.split('-').slice(1).join('-'),  // 날짜 형식: MM-DD
                dayLogs.length > 0 ? 'O' : 'X',      // 현장 대응 여부
                dayLogs.length > 0 ? dayLogs[0].line : '',  // SITE(LINE)
                dayLogs.length > 0 ? dayLogs[0].task_name : '', // 작업내용
                dayLogs.length > 0 ? formatTaskDuration(dayLogs[0].task_duration) : '', // 작업시간
                (dayLogs.length > 0 && (isHoliday || isWeekendFlag)) ? '주말 근무' : ''  // 비고
            ];
    
            // 주말 및 공휴일 색상 적용
            if (isWeekend(date) || isHoliday) {
                worksheet.getRow(4 + index).getCell(1).fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFFFCCCC' } // 연한 빨간색
                };
            }
        });
    
        // 테두리 적용
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber > 3) {  // 데이터 행부터 테두리 적용
                row.eachCell(cell => {
                    cell.border = {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' }
                    };
                });
            }
        });
    
        // 요약 데이터 추가
        const summaryStartRow = worksheet.lastRow.number + 2; // 마지막 데이터 행 아래 2칸 띄우고 요약 시작
        worksheet.getRow(summaryStartRow).values = ['평일 수', weekdaysCount + '일'];
        worksheet.getRow(summaryStartRow + 1).values = ['평일 근무일수', onsiteCount + '일'];
        worksheet.getRow(summaryStartRow + 2).values = ['휴일 근무일수', holidayWorkCount + '일'];
        worksheet.getRow(summaryStartRow + 3).values = ['총 근무일수', onsiteCount + holidayWorkCount + '일'];
    
        // 요약 테두리 및 스타일 적용
        for (let i = summaryStartRow; i <= summaryStartRow + 3; i++) {
            worksheet.getRow(i).eachCell(cell => {
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
                cell.font = { bold: true }; // 강조
                cell.alignment = { horizontal: 'center' }; // 가운데 정렬
            });
        }
    
        // 파일 다운로드
        workbook.xlsx.writeBuffer().then(buffer => {
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `${currentYear}${String(currentMonth).padStart(2, '0')}-${currentUserNickname}-Worklog.xlsx`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
    }
    
    
    // 엑셀 내보내기 버튼에 클릭 이벤트 추가
    document.getElementById('exportExcelButton').addEventListener('click', exportToExcel);

    async function loadWorkLogs() {
        try {
            const response = await axios.get('http://3.37.73.151:3001/logs');
            logs = response.data.sort((a, b) => new Date(b.task_date) - new Date(a.task_date));
        } catch (error) {
            console.error('작업 로그 불러오기 실패:', error);
        }
    }

    // getCurrentUser 함수 정의
    async function getCurrentUser() {
        try {
            const response = await axios.get('http://3.37.73.151:3001/user-info', {
                headers: { 'x-access-token': localStorage.getItem('x-access-token') }
            });
            currentUserNickname = response.data.result.NAME;
        } catch (error) {
            console.error('사용자 정보 불러오기 실패:', error);
            alert('사용자 정보를 불러오는데 문제가 발생했습니다. 다시 로그인해 주세요.');
            window.location.replace("./signin.html");
        }
    }
});
