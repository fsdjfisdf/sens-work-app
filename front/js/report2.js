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

    await getCurrentUser();
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

        const excelData = datesArray.map(date => {
            const dayLogs = logsByDate[date] || [];
            const isHoliday = holidays.includes(date);
            const isWeekendFlag = isWeekend(date);

            return {
                "날짜": date.split('-').slice(1).join('-'),
                "현장대응": dayLogs.length > 0 ? 'O' : 'X',
                "SITE(LINE)": dayLogs.length > 0 ? dayLogs[0].line : '',
                "작업내용": dayLogs.length > 0 ? dayLogs[0].task_name : '',
                "작업시간(Hr)": dayLogs.length > 0 ? formatTaskDuration(dayLogs[0].task_duration) : '',
                "비고": (dayLogs.length > 0 && (isHoliday || isWeekendFlag)) ? '주말 근무' : ''
            };
        });

        const worksheet = XLSX.utils.json_to_sheet(excelData, { origin: "A3" });

        XLSX.utils.sheet_add_aoa(worksheet, [
            [`${currentYear}${String(currentMonth).padStart(2, '0')} - ${currentUserNickname} - 국내출장보고서 근거자료`]
        ], { origin: "A1" });

        XLSX.utils.sheet_add_aoa(worksheet, [
            ["날짜", "현장대응", "SITE(LINE)", "작업내용", "작업시간(Hr)", "비고"]
        ], { origin: "A3" });

        let fieldCounts = { weekdays: 0, onsite: 0, holidayWork: 0 };
        
        excelData.forEach(row => {
            const isHoliday = holidays.includes(`${currentYear}-${row.날짜}`);
            const isWeekendFlag = isWeekend(`${currentYear}-${row.날짜}`);
            if (!isHoliday && !isWeekendFlag) fieldCounts.weekdays++;
            if (row["현장대응"] === "O") fieldCounts.onsite++;
            if ((isHoliday || isWeekendFlag) && row["현장대응"] === "O") fieldCounts.holidayWork++;
        });

        XLSX.utils.sheet_add_aoa(worksheet, [
            ["평일", `${fieldCounts.weekdays}일`],
            ["현장 근무", `${fieldCounts.onsite}일`],
            ["휴일 근무", `${fieldCounts.holidayWork}일`],
            ["TOTAL", `${fieldCounts.onsite + fieldCounts.holidayWork}일`]
        ], { origin: "H3" });

        const range = XLSX.utils.decode_range(worksheet['!ref']);

        for (let R = range.s.r; R <= range.e.r; ++R) {
            for (let C = range.s.c; C <= range.e.c; ++C) {
                const cell_address = XLSX.utils.encode_cell({ r: R, c: C });
                if (!worksheet[cell_address]) continue;

                worksheet[cell_address].s = {
                    border: {
                        top: { style: "thin" }, bottom: { style: "thin" },
                        left: { style: "thin" }, right: { style: "thin" }
                    }
                };

                if (R === 2) {
                    worksheet[cell_address].s.fill = { fgColor: { rgb: "FFFF00" } };
                }

                if (C === 0 && (isWeekend(worksheet[cell_address].v) || holidays.includes(worksheet[cell_address].v))) {
                    worksheet[cell_address].s.fill = { fgColor: { rgb: "FFCCCC" } };
                }
            }
        }

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Worklog");
        XLSX.writeFile(workbook, `${currentYear}${String(currentMonth).padStart(2, '0')}-${currentUserNickname}-Worklog.xlsx`);
    }

    document.getElementById('exportExcelButton').addEventListener('click', exportToExcel);

    async function getCurrentUser() {
        try {
            const response = await axios.get('http://3.37.73.151:3001/user-info', {
                headers: {
                    'x-access-token': localStorage.getItem('x-access-token')
                }
            });
            currentUserNickname = response.data.result.NAME;
        } catch (error) {
            console.error('사용자 정보 불러오기 실패:', error);
        }
    }

    async function loadWorkLogs() {
        try {
            const response = await axios.get('http://3.37.73.151:3001/logs');
            logs = response.data.sort((a, b) => new Date(b.task_date) - new Date(a.task_date));
        } catch (error) {
            console.error('작업 로그 불러오기 실패:', error);
        }
    }
});
