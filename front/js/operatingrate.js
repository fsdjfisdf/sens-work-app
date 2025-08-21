let donutChart; // 도넛 차트를 전역 변수로 선언
let cumulativeTotalWorkHours = 0; // 전체 날짜의 총 작업 시간 누적 변수
let monthlyWorktimeChartInstance;
let lineWorkStatsChartInstance;
let workTypeStatsChartInstance;
let equipmentTypeStatsChartInstance;
let amPmStatsChartInstance;
let overtimeChartInstance;
let timeRangeChartInstance;
let warrantyChartInstance;
let groupSiteOperatingRateChartInstance;
let currentUserNickname = null; // 현재 로그인한 사용자의 닉네임을 저장할 변수


document.addEventListener('DOMContentLoaded', async () => {

    const userRole = localStorage.getItem('user-role');
    console.log("User role:", userRole); // role 정보를 콘솔에 출력
    if (userRole !== 'admin') {
        alert("접근 권한이 없습니다.");
        window.location.replace("./index.html");
        return;
    }

    // 공휴일 리스트를 전역으로 선언하여 모든 함수에서 접근 가능하게 합니다.
    const holidays = [
        '2024-01-01', '2024-02-09', '2024-02-10', '2024-02-11', '2024-02-12',
        '2024-03-01', '2024-05-05', '2024-05-06', '2024-05-15', '2024-06-06',
        '2024-08-15', '2024-09-16', '2024-09-17', '2024-09-18', '2024-10-03',
        '2024-10-09', '2024-12-25', '2024-10-01', '2025-01-01', '2025-01-27', '2025-01-28', '2025-01-29', '2025-01-30', '2025-03-03',
        '2025-05-01', '2025-05-06', '2025-05-05', '2025-06-03', '2025-06-06', '2025-08-15'
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
            weekday: { 'PEE1 PT': 9.9, 'PEE1 HS': 17.8, 'PEE1 IC': 2.8, 'PEE1 CJ': 3.7, 'PEE2 PT': 5.7, 'PEE2 HS': 4.8, 'PSKH PSKH': 7.9 },
            weekend: { 'PEE1 PT': 3, 'PEE1 HS': 4, 'PEE1 IC': 1, 'PEE1 CJ': 1, 'PEE2 PT': 1, 'PEE2 HS': 1, 'PSKH PSKH': 1 },
        },
        '2024-11-11': {
            weekday: { 'PEE1 PT': 9.3, 'PEE1 HS': 16.8, 'PEE1 IC': 2.4, 'PEE1 CJ': 2.6, 'PEE2 PT': 5.8, 'PEE2 HS': 5.2, 'PSKH PSKH': 8 },
            weekend: { 'PEE1 PT': 3, 'PEE1 HS': 4, 'PEE1 IC': 1, 'PEE1 CJ': 1, 'PEE2 PT': 1, 'PEE2 HS': 1, 'PSKH PSKH': 1 },
        },
        '2024-11-18': {
            weekday: { 'PEE1 PT': 9.6, 'PEE1 HS': 16.9, 'PEE1 IC': 2.7, 'PEE1 CJ': 3.2, 'PEE2 PT': 5.8, 'PEE2 HS': 5.2, 'PSKH PSKH': 8 },
            weekend: { 'PEE1 PT': 3, 'PEE1 HS': 4, 'PEE1 IC': 1, 'PEE1 CJ': 1, 'PEE2 PT': 1, 'PEE2 HS': 1, 'PSKH PSKH': 1 },
        },
        '2024-11-25': {
            weekday: { 'PEE1 PT': 11.5, 'PEE1 HS': 15.2, 'PEE1 IC': 2.1, 'PEE1 CJ': 2.7, 'PEE2 PT': 5.3, 'PEE2 HS': 5.5, 'PSKH PSKH': 8 },
            weekend: { 'PEE1 PT': 3, 'PEE1 HS': 4, 'PEE1 IC': 1, 'PEE1 CJ': 1, 'PEE2 PT': 1, 'PEE2 HS': 1, 'PSKH PSKH': 1 },
        },
        //24Y-12월
        '2024-12-02': {
            weekday: { 'PEE1 PT': 10.6, 'PEE1 HS': 15.5, 'PEE1 IC': 3.8, 'PEE1 CJ': 2.6, 'PEE2 PT': 5.95, 'PEE2 HS': 4.4, 'PSKH PSKH': 8 },
            weekend: { 'PEE1 PT': 3, 'PEE1 HS': 4, 'PEE1 IC': 1, 'PEE1 CJ': 1, 'PEE2 PT': 1, 'PEE2 HS': 1, 'PSKH PSKH': 1 },
        },
        '2024-12-09': {
            weekday: { 'PEE1 PT': 12, 'PEE1 HS': 17.9, 'PEE1 IC': 3.7, 'PEE1 CJ': 3, 'PEE2 PT': 4.4, 'PEE2 HS': 5.6, 'PSKH PSKH': 8 },
            weekend: { 'PEE1 PT': 3, 'PEE1 HS': 4, 'PEE1 IC': 1, 'PEE1 CJ': 1, 'PEE2 PT': 1, 'PEE2 HS': 1, 'PSKH PSKH': 1 },
        },
        '2024-12-16': {
            weekday: { 'PEE1 PT': 12.3, 'PEE1 HS': 16.6, 'PEE1 IC': 3.4, 'PEE1 CJ': 3, 'PEE2 PT': 6, 'PEE2 HS': 4.3, 'PSKH PSKH': 7,
                'PEE1 USA-Portland' : 1, 'PEE1 Taiwan-Taichoung' : 1, 'PEE1 Ireland' : 1, 'PEE2 China-Beijing' : 2 },
            weekend: { 'PEE1 PT': 3, 'PEE1 HS': 4, 'PEE1 IC': 1, 'PEE1 CJ': 1, 'PEE2 PT': 1, 'PEE2 HS': 1, 'PSKH PSKH': 1 },
        },
        '2024-12-23': {
            weekday: { 'PEE1 PT': 14.25, 'PEE1 HS': 15.5, 'PEE1 IC': 3.3, 'PEE1 CJ': 3, 'PEE2 PT': 5.625, 'PEE2 HS': 4.25, 'PSKH PSKH': 7,
                'PEE1 USA-Portland' : 1, 'PEE1 Taiwan-Taichoung' : 1, 'PEE1 Ireland' : 1, 'PEE2 China-Beijing' : 2 },
            weekend: { 'PEE1 PT': 3, 'PEE1 HS': 4, 'PEE1 IC': 1, 'PEE1 CJ': 1, 'PEE2 PT': 1, 'PEE2 HS': 1, 'PSKH PSKH': 1 },
        },
        '2024-12-30': {
            weekday: { 'PEE1 PT': 14.5, 'PEE1 HS': 14.38, 'PEE1 IC': 2.4, 'PEE1 CJ': 2.63, 'PEE2 PT': 6.5, 'PEE2 HS': 3.5, 'PSKH PSKH': 8.67,
                'PEE1 USA-Portland' : 1, 'PEE1 Taiwan-Taichoung' : 1, 'PEE1 Ireland' : 1, 'PEE2 China-Beijing' : 2 },
            weekend: { 'PEE1 PT': 3, 'PEE1 HS': 4, 'PEE1 IC': 1, 'PEE1 CJ': 1, 'PEE2 PT': 1, 'PEE2 HS': 1, 'PSKH PSKH': 1 },
        },
        //25년 1월
        '2025-01-06': {
            weekday: { 'PEE1 PT': 13.3, 'PEE1 HS': 14.75, 'PEE1 IC': 3, 'PEE1 CJ': 3, 'PEE2 PT': 6.8, 'PEE2 HS': 5, 'PSKH PSKH': 8.5,
                'PEE1 USA-Portland' : 3, 'PEE1 Taiwan-Taichoung' : 1, 'PEE1 Ireland' : 2, 'PEE2 China-Beijing' : 2 },
            weekend: { 'PEE1 PT': 3, 'PEE1 HS': 4, 'PEE1 IC': 1, 'PEE1 CJ': 1, 'PEE2 PT': 1, 'PEE2 HS': 1, 'PSKH PSKH': 1 },
        },
        '2025-01-13': {
            weekday: { 'PEE1 PT': 13.5, 'PEE1 HS': 16.3, 'PEE1 IC': 2.9, 'PEE1 CJ': 2.8, 'PEE2 PT': 5.2, 'PEE2 HS': 3.8, 'PSKH PSKH': 8.6,
                'PEE1 USA-Portland' : 3, 'PEE1 Taiwan-Taichoung' : 1, 'PEE1 Ireland' : 2, 'PEE2 China-Beijing' : 2 },
            weekend: { 'PEE1 PT': 3, 'PEE1 HS': 4, 'PEE1 IC': 1, 'PEE1 CJ': 1, 'PEE2 PT': 1, 'PEE2 HS': 1, 'PSKH PSKH': 1 },
        },
        '2025-01-20': {
            weekday: { 'PEE1 PT': 12.4, 'PEE1 HS': 16.4, 'PEE1 IC': 3, 'PEE1 CJ': 2.8, 'PEE2 PT': 7.8, 'PEE2 HS': 5, 'PSKH PSKH': 7.6,
                'PEE1 USA-Portland' : 3, 'PEE1 Taiwan-Taichoung' : 1, 'PEE1 Ireland' : 2, 'PEE2 China-Beijing' : 2 },
            weekend: { 'PEE1 PT': 3, 'PEE1 HS': 4, 'PEE1 IC': 1, 'PEE1 CJ': 1, 'PEE2 PT': 1, 'PEE2 HS': 1, 'PSKH PSKH': 1 },
        },
        '2025-01-27': {
            weekday: { 'PEE1 PT': 11, 'PEE1 HS': 16, 'PEE1 IC': 3, 'PEE1 CJ': 1, 'PEE2 PT': 8, 'PEE2 HS': 4, 'PSKH PSKH': 6,
                'PEE1 USA-Portland' : 3, 'PEE1 Taiwan-Taichoung' : 1, 'PEE1 Ireland' : 2, 'PEE2 China-Beijing' : 2 },
            weekend: { 'PEE1 PT': 3, 'PEE1 HS': 4, 'PEE1 IC': 1, 'PEE1 CJ': 1, 'PEE2 PT': 1, 'PEE2 HS': 1, 'PSKH PSKH': 1 },
        },
        '2025-02-03': {
            weekday: { 'PEE1 PT': 16.1, 'PEE1 HS': 19.1, 'PEE1 IC': 4.9, 'PEE1 CJ': 3, 'PEE2 PT': 7.1, 'PEE2 HS': 5.4, 'PSKH PSKH': 7,
                'PEE1 USA-Portland' : 3, 'PEE1 Ireland' : 1,},
            weekend: { 'PEE1 PT': 3, 'PEE1 HS': 4, 'PEE1 IC': 1, 'PEE1 CJ': 1, 'PEE2 PT': 1, 'PEE2 HS': 1, 'PSKH PSKH': 1 },
        },
        '2025-02-10': {
            weekday: { 'PEE1 PT': 16.2, 'PEE1 HS': 20, 'PEE1 IC': 4.5, 'PEE1 CJ': 2.6, 'PEE2 PT': 7.5, 'PEE2 HS': 5.2, 'PSKH PSKH': 6.4,
                'PEE1 USA-Portland' : 3, 'PEE1 Ireland' : 1,},
            weekend: { 'PEE1 PT': 3, 'PEE1 HS': 4, 'PEE1 IC': 1, 'PEE1 CJ': 1, 'PEE2 PT': 1, 'PEE2 HS': 1, 'PSKH PSKH': 1 },
        },
        '2025-02-17': {
            weekday: { 'PEE1 PT': 15.8, 'PEE1 HS': 19.9, 'PEE1 IC': 5, 'PEE1 CJ': 2.6, 'PEE2 PT': 8.2, 'PEE2 HS': 5.9, 'PSKH PSKH': 7.6,
                'PEE1 USA-Portland' : 3, 'PEE1 Ireland' : 1,},
            weekend: { 'PEE1 PT': 3, 'PEE1 HS': 4, 'PEE1 IC': 1, 'PEE1 CJ': 1, 'PEE2 PT': 1, 'PEE2 HS': 1, 'PSKH PSKH': 1 },
        },
        '2025-02-24': {
            weekday: { 'PEE1 PT': 14.7, 'PEE1 HS': 16.38, 'PEE1 IC': 6, 'PEE1 CJ': 2.6, 'PEE2 PT': 8.4, 'PEE2 HS': 5.1, 'PSKH PSKH': 5.9,
                'PEE1 USA-Portland' : 3, 'PEE1 Ireland' : 1,},
            weekend: { 'PEE1 PT': 3, 'PEE1 HS': 4, 'PEE1 IC': 1, 'PEE1 CJ': 1, 'PEE2 PT': 1, 'PEE2 HS': 1, 'PSKH PSKH': 1 },
        },
        '2025-03-03': {
            weekday: { 'PEE1 PT': 16.88, 'PEE1 HS': 16.88, 'PEE1 IC': 6, 'PEE1 CJ': 3.2, 'PEE2 PT': 10.25, 'PEE2 HS': 5.5, 'PSKH PSKH': 6,
                'PEE1 USA-Portland' : 3, 'PEE1 Ireland' : 1,},
            weekend: { 'PEE1 PT': 3, 'PEE1 HS': 4, 'PEE1 IC': 1, 'PEE1 CJ': 1, 'PEE2 PT': 1, 'PEE2 HS': 1, 'PSKH PSKH': 1 },
        },
        '2025-03-10': {
            weekday: { 'PEE1 PT': 16, 'PEE1 HS': 18.25, 'PEE1 IC': 7, 'PEE1 CJ': 4, 'PEE2 PT': 9, 'PEE2 HS': 4.6, 'PSKH PSKH': 6.4,
                'PEE1 USA-Portland' : 3, 'PEE1 Ireland' : 1,},
            weekend: { 'PEE1 PT': 3, 'PEE1 HS': 4, 'PEE1 IC': 1, 'PEE1 CJ': 1, 'PEE2 PT': 1, 'PEE2 HS': 1, 'PSKH PSKH': 1 },
        },
        '2025-03-17': {
            weekday: { 'PEE1 PT': 15.7, 'PEE1 HS': 18.9, 'PEE1 IC': 6.4, 'PEE1 CJ': 3.4, 'PEE2 PT': 9.6, 'PEE2 HS': 4.9, 'PSKH PSKH': 6.9,
                'PEE1 USA-Portland' : 3, 'PEE1 Ireland' : 1,},
            weekend: { 'PEE1 PT': 3, 'PEE1 HS': 4, 'PEE1 IC': 1, 'PEE1 CJ': 1, 'PEE2 PT': 1, 'PEE2 HS': 1, 'PSKH PSKH': 1 },
        },
        '2025-03-24': {
            weekday: { 'PEE1 PT': 15.7, 'PEE1 HS': 20.9, 'PEE1 IC': 6.3, 'PEE1 CJ': 3, 'PEE2 PT': 9.3, 'PEE2 HS': 4.7, 'PSKH PSKH': 6.3,
                'PEE1 USA-Portland' : 3, 'PEE1 Ireland' : 1,},
            weekend: { 'PEE1 PT': 3, 'PEE1 HS': 4, 'PEE1 IC': 1, 'PEE1 CJ': 1, 'PEE2 PT': 1, 'PEE2 HS': 1, 'PSKH PSKH': 1 },
        },
        '2025-03-31': {
            weekday: { 'PEE1 PT': 15.4, 'PEE1 HS': 17.9, 'PEE1 IC': 4.8, 'PEE1 CJ': 4.9, 'PEE2 PT': 10.6, 'PEE2 HS': 4.4, 'PSKH PSKH': 7.8,
                'PEE1 USA-Portland' : 3, 'PEE1 Ireland' : 1,},
            weekend: { 'PEE1 PT': 3, 'PEE1 HS': 4, 'PEE1 IC': 1, 'PEE1 CJ': 1, 'PEE2 PT': 1, 'PEE2 HS': 1, 'PSKH PSKH': 1 },
        },
        '2025-04-07': {
            weekday: { 'PEE1 PT': 18.4, 'PEE1 HS': 19.63, 'PEE1 IC': 4.2, 'PEE1 CJ': 4.2, 'PEE2 PT': 10, 'PEE2 HS': 4.8, 'PSKH PSKH': 9.5,
                'PEE1 USA-Portland' : 3, 'PEE1 Ireland' : 1,},
            weekend: { 'PEE1 PT': 3, 'PEE1 HS': 4, 'PEE1 IC': 1, 'PEE1 CJ': 1, 'PEE2 PT': 1, 'PEE2 HS': 1, 'PSKH PSKH': 1 },
        },
        '2025-04-14': {
            weekday: { 'PEE1 PT': 17.3, 'PEE1 HS': 20.5, 'PEE1 IC': 4.4, 'PEE1 CJ': 5.4, 'PEE2 PT': 9.9, 'PEE2 HS': 5.5, 'PSKH PSKH': 9.1,
                'PEE1 USA-Portland' : 3, 'PEE1 Ireland' : 1,},
            weekend: { 'PEE1 PT': 3, 'PEE1 HS': 4, 'PEE1 IC': 1, 'PEE1 CJ': 1, 'PEE2 PT': 1, 'PEE2 HS': 1, 'PSKH PSKH': 1 },
        },
        '2025-04-21': {
            weekday: { 'PEE1 PT': 18.3, 'PEE1 HS': 22.1, 'PEE1 IC': 4.4, 'PEE1 CJ': 4.8, 'PEE2 PT': 8.6, 'PEE2 HS': 4, 'PSKH PSKH': 11,
                'PEE1 USA-Portland' : 3, 'PEE1 Ireland' : 1,},
            weekend: { 'PEE1 PT': 3, 'PEE1 HS': 4, 'PEE1 IC': 1, 'PEE1 CJ': 1, 'PEE2 PT': 1, 'PEE2 HS': 1, 'PSKH PSKH': 1 },
        },
        '2025-04-28': {
            weekday: { 'PEE1 PT': 18.8, 'PEE1 HS': 22.3, 'PEE1 IC': 4.6, 'PEE1 CJ': 4.6, 'PEE2 PT': 9.5, 'PEE2 HS': 5.6, 'PSKH PSKH': 11.75,
                'PEE1 USA-Portland' : 3, 'PEE1 Ireland' : 1,},
            weekend: { 'PEE1 PT': 3, 'PEE1 HS': 4, 'PEE1 IC': 1, 'PEE1 CJ': 1, 'PEE2 PT': 1, 'PEE2 HS': 1, 'PSKH PSKH': 1 },
        },
        '2025-05-05': {
            weekday: { 'PEE1 PT': 17.7, 'PEE1 HS': 22, 'PEE1 IC': 3.7, 'PEE1 CJ': 4.5, 'PEE2 PT': 10.3, 'PEE2 HS': 6, 'PSKH PSKH': 11.75,
                'PEE1 USA-Portland' : 3, 'PEE1 Ireland' : 1,},
            weekend: { 'PEE1 PT': 3, 'PEE1 HS': 4, 'PEE1 IC': 1, 'PEE1 CJ': 1, 'PEE2 PT': 1, 'PEE2 HS': 1, 'PSKH PSKH': 1 },
        },
        '2025-05-12': {
            weekday: { 'PEE1 PT': 19.9, 'PEE1 HS': 21.3, 'PEE1 IC': 3.8, 'PEE1 CJ': 3.2, 'PEE2 PT': 10.8, 'PEE2 HS': 5.7, 'PSKH PSKH': 11.5,
                'PEE1 USA-Portland' : 3, 'PEE1 Ireland' : 1,},
            weekend:
             { 'PEE1 PT': 3, 'PEE1 HS': 4, 'PEE1 IC': 1, 'PEE1 CJ': 1, 'PEE2 PT': 1, 'PEE2 HS': 1, 'PSKH PSKH': 1 },
        },
        '2025-05-19': {
            weekday: { 'PEE1 PT': 18.2, 'PEE1 HS': 21.7, 'PEE1 IC': 4, 'PEE1 CJ': 3.6, 'PEE2 PT': 10.5, 'PEE2 HS': 5.9, 'PSKH PSKH': 11.8,
                'PEE1 USA-Portland' : 3, 'PEE1 Ireland' : 1,},
            weekend: { 'PEE1 PT': 3, 'PEE1 HS': 4, 'PEE1 IC': 1, 'PEE1 CJ': 1, 'PEE2 PT': 1, 'PEE2 HS': 1, 'PSKH PSKH': 1 },
        },
        '2025-05-26': {
            weekday: { 'PEE1 PT': 18.2, 'PEE1 HS': 21.7, 'PEE1 IC': 4, 'PEE1 CJ': 3.6, 'PEE2 PT': 10.5, 'PEE2 HS': 5.9, 'PSKH PSKH': 11,
                'PEE1 USA-Portland' : 3, 'PEE1 Ireland' : 1,},
            weekend: { 'PEE1 PT': 3, 'PEE1 HS': 4, 'PEE1 IC': 1, 'PEE1 CJ': 1, 'PEE2 PT': 1, 'PEE2 HS': 1, 'PSKH PSKH': 1 },
        },
        '2025-06-02': {
            weekday: { 'PEE1 PT': 17.8, 'PEE1 HS': 22.67, 'PEE1 IC': 5, 'PEE1 CJ': 2.7, 'PEE2 PT': 10.7, 'PEE2 HS': 5.7, 'PSKH PSKH': 11,
                'PEE1 USA-Portland' : 3, 'PEE1 Ireland' : 1,},
            weekend: { 'PEE1 PT': 3, 'PEE1 HS': 4, 'PEE1 IC': 1, 'PEE1 CJ': 1, 'PEE2 PT': 1, 'PEE2 HS': 1, 'PSKH PSKH': 1 },
        },
        '2025-06-09': {
            weekday: { 'PEE1 PT': 18.8, 'PEE1 HS': 21.3, 'PEE1 IC': 2.8, 'PEE1 CJ': 3.8, 'PEE2 PT': 10.3, 'PEE2 HS': 5.3, 'PSKH PSKH': 10.6,
                'PEE1 Ireland' : 1,},
            weekend: { 'PEE1 PT': 3, 'PEE1 HS': 4, 'PEE1 IC': 1, 'PEE1 CJ': 1, 'PEE2 PT': 1, 'PEE2 HS': 1, 'PSKH PSKH': 1 },
        },
        '2025-06-16': {
            weekday: { 'PEE1 PT': 18, 'PEE1 HS': 22.6, 'PEE1 IC': 3, 'PEE1 CJ': 3.1, 'PEE2 PT': 11, 'PEE2 HS': 5.4, 'PSKH PSKH': 10.6,
                'PEE1 Ireland' : 1,},
            weekend: { 'PEE1 PT': 3, 'PEE1 HS': 4, 'PEE1 IC': 1, 'PEE1 CJ': 1, 'PEE2 PT': 1, 'PEE2 HS': 1, 'PSKH PSKH': 1 },
        },
        '2025-06-23': {
            weekday: { 'PEE1 PT': 17.1, 'PEE1 HS': 20.5, 'PEE1 IC': 4.6, 'PEE1 CJ': 3.2, 'PEE2 PT': 11.7, 'PEE2 HS': 5.5, 'PSKH PSKH': 10.6,
                'PEE1 Ireland' : 1,},
            weekend: { 'PEE1 PT': 3, 'PEE1 HS': 4, 'PEE1 IC': 1, 'PEE1 CJ': 1, 'PEE2 PT': 1, 'PEE2 HS': 1, 'PSKH PSKH': 1 },
        },
        '2025-06-30': {
            weekday: { 'PEE1 PT': 18.5, 'PEE1 HS': 20.6, 'PEE1 IC': 4.2, 'PEE1 CJ': 5.1, 'PEE2 PT': 11.4, 'PEE2 HS': 6.6, 'PSKH PSKH': 10.8,
                'PEE1 Ireland' : 1,},
            weekend: { 'PEE1 PT': 3, 'PEE1 HS': 4, 'PEE1 IC': 1, 'PEE1 CJ': 1, 'PEE2 PT': 1, 'PEE2 HS': 1, 'PSKH PSKH': 1 },
        },
        '2025-07-07': {
            weekday: { 'PEE1 PT': 19.2, 'PEE1 HS': 20.3, 'PEE1 IC': 4.5, 'PEE1 CJ': 4, 'PEE2 PT': 11.2, 'PEE2 HS': 5.4, 'PSKH PSKH': 10.8,
                'PEE1 Ireland' : 1,},
            weekend: { 'PEE1 PT': 3, 'PEE1 HS': 4, 'PEE1 IC': 1, 'PEE1 CJ': 1, 'PEE2 PT': 1, 'PEE2 HS': 1, 'PSKH PSKH': 1 },
        },
        '2025-07-14': {
            weekday: { 'PEE1 PT': 18.2, 'PEE1 HS': 21.2, 'PEE1 IC': 4.5, 'PEE1 CJ': 4, 'PEE2 PT': 11.6, 'PEE2 HS': 5.8, 'PSKH PSKH': 10.8,
                'PEE1 Ireland' : 1,},
            weekend: { 'PEE1 PT': 3, 'PEE1 HS': 4, 'PEE1 IC': 1, 'PEE1 CJ': 1, 'PEE2 PT': 1, 'PEE2 HS': 1, 'PSKH PSKH': 1 },
        },
        '2025-07-21': {
            weekday: { 'PEE1 PT': 17.6, 'PEE1 HS': 22.1, 'PEE1 IC': 3.6, 'PEE1 CJ': 4.7, 'PEE2 PT': 11.7, 'PEE2 HS': 4.8, 'PSKH PSKH': 9.8,
                'PEE1 Ireland' : 1,},
            weekend: { 'PEE1 PT': 3, 'PEE1 HS': 4, 'PEE1 IC': 1, 'PEE1 CJ': 1, 'PEE2 PT': 1, 'PEE2 HS': 1, 'PSKH PSKH': 1 },
        },
        '2025-07-28': {
            weekday: { 'PEE1 PT': 17.6, 'PEE1 HS': 22.1, 'PEE1 IC': 3.6, 'PEE1 CJ': 4.7, 'PEE2 PT': 11.7, 'PEE2 HS': 4.8, 'PSKH PSKH': 9.8,
                'PEE1 Ireland' : 1,},
            weekend: { 'PEE1 PT': 3, 'PEE1 HS': 4, 'PEE1 IC': 1, 'PEE1 CJ': 1, 'PEE2 PT': 1, 'PEE2 HS': 1, 'PSKH PSKH': 1 },
        },
        '2025-08-04': {
            weekday: { 'PEE1 PT': 18, 'PEE1 HS': 22.7, 'PEE1 IC': 3, 'PEE1 CJ': 4.4, 'PEE2 PT': 11, 'PEE2 HS': 5.9, 'PSKH PSKH': 9.8,
                'PEE1 Ireland' : 1,},
            weekend: { 'PEE1 PT': 3, 'PEE1 HS': 4, 'PEE1 IC': 1, 'PEE1 CJ': 1, 'PEE2 PT': 1, 'PEE2 HS': 1, 'PSKH PSKH': 1 },
        },
        '2025-08-11': {
            weekday: { 'PEE1 PT': 18, 'PEE1 HS': 23.75, 'PEE1 IC': 4, 'PEE1 CJ': 4.5, 'PEE2 PT': 11.5, 'PEE2 HS': 6.5, 'PSKH PSKH': 8.9,
                'PEE1 Ireland' : 1,},
            weekend: { 'PEE1 PT': 3, 'PEE1 HS': 4, 'PEE1 IC': 1, 'PEE1 CJ': 1, 'PEE2 PT': 1, 'PEE2 HS': 1, 'PSKH PSKH': 1 },
        },
        '2025-08-18': {
            weekday: { 'PEE1 PT': 18, 'PEE1 HS': 23.75, 'PEE1 IC': 4, 'PEE1 CJ': 4.5, 'PEE2 PT': 11.5, 'PEE2 HS': 6.5, 'PSKH PSKH': 8.9,
                'PEE1 Ireland' : 1,},
            weekend: { 'PEE1 PT': 3, 'PEE1 HS': 4, 'PEE1 IC': 1, 'PEE1 CJ': 1, 'PEE2 PT': 1, 'PEE2 HS': 1, 'PSKH PSKH': 1 },
        }
        
        
        
        
    };

    async function getCurrentUser() {
        try {
            const response = await axios.get('http://3.37.73.151:3001/user-info', {
                headers: {
                    'x-access-token': localStorage.getItem('x-access-token')
                }
            });
    
            // 전체 response.data 출력하여 구조 확인
            console.log('response.data:', response.data);
    
            // 여기서 response.data의 구조에 맞게 NAME을 가져옴
            // 예시: response.data[0].NAME (만약 첫 번째 요소에 NAME이 있는 경우)
            currentUserNickname = response.data.result.NAME; // NAME 필드 가져오기
    
            // 콘솔에 저장된 이름 출력
            console.log('현재 로그인한 사용자 이름:', currentUserNickname);
    
        } catch (error) {
            console.error('현재 사용자 정보를 가져오는 중 오류 발생:', error);
        }
    }

    let currentYear = new Date().getFullYear();
    let currentMonth = new Date().getMonth();
    const today = new Date();
    let weeklyOperatingRateChart;

    let logs = await loadWorkLogs();
    renderCalendar(logs, currentYear, currentMonth);
    renderMonthlyWorktimeChart(logs); // 여기서 함수 호출
    renderLineWorkStatsChart(logs);
    renderWorkTypeStatsChart(logs); // 새로운 그래프 호출
    renderEquipmentTypeStatsChart(logs); // 새로운 그래프 호출
    renderAmPmStatsChart(logs); // 새로운 그래프 호출
    renderOvertimeChart(logs);
    renderTimeRangeChart(logs);
    renderWarrantyChart(logs);
    renderGroupSiteAverageChart(logs);
    

    document.getElementById('day-type-select').value = 'all';
    applyFilters('all');

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
            const response = await axios.get('http://3.37.73.151:3001/logs',
                 {
                headers: {
                    'x-access-token': localStorage.getItem('x-access-token')
                }
            });
            await getCurrentUser(); // 현재 사용자 정보 불러오기
            return response.data;
        } catch (error) {
            console.error('작업 일지를 불러오는 중 오류 발생:', error);
            return [];
        }
    }
    async function applyFilters() {
        const startDate = document.getElementById('start-date').value;
        const endDate = document.getElementById('end-date').value;
        console.log('Start Date:', startDate, 'End Date:', endDate);
        const group = document.getElementById('group-select').value;
        const site = document.getElementById('site-select').value;
        const dayType = document.getElementById('day-type-select').value;
    
        // 전체 작업 로그에서 가장 오래된 작업 날짜를 firstLogDate로 계산
        const firstLogDate = logs.reduce((earliest, log) => {
            const logDate = new Date(log.task_date);
            return (!earliest || logDate < earliest) ? logDate : earliest;
        }, null);
    
        // 필터링된 로그만을 사용하여 그래프와 달력을 업데이트
        const filteredLogs = logs.filter(log => {
            const logDate = new Date(log.task_date);
            const dateMatch = (!startDate || logDate >= new Date(startDate)) &&
                              (!endDate || logDate <= new Date(endDate));
            const groupMatch = !group || log.group === group;
            const siteMatch = !site || log.site === site;
    
            const logDateStr = logDate.toISOString().split('T')[0];
            const dayOfWeek = logDate.getUTCDay();
            const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
            const isHoliday = holidays.includes(logDateStr);
    
            let dayTypeMatch = true;
            if (dayType === 'workday') {
                dayTypeMatch = !isWeekend && !isHoliday;
            } else if (dayType === 'holiday') {
                dayTypeMatch = isWeekend || isHoliday;
            }
    
            return dateMatch && groupMatch && siteMatch && dayTypeMatch;
        });
    
        // weeklyRates를 renderCalendar로부터 가져와 calculateAndDisplayAverageOperatingRate에 전달
        const weeklyRates = renderCalendar(filteredLogs, currentYear, currentMonth, dayType);
        
        // 주차별 가동률과 전체 데이터를 활용해 평균 가동율 계산
        calculateAndDisplayAverageOperatingRate(weeklyRates, firstLogDate);
    
        // 필터링된 로그 데이터로 그래프 생성
        renderMonthlyWorktimeChart(filteredLogs);
        renderLineWorkStatsChart(filteredLogs);
        renderWorkTypeStatsChart(filteredLogs);
        renderEquipmentTypeStatsChart(filteredLogs);
        renderAmPmStatsChart(filteredLogs);
        renderOvertimeChart(filteredLogs);
        renderTimeRangeChart(filteredLogs);
        renderWarrantyChart(filteredLogs);
        renderGroupSiteAverageChart(filteredLogs);
    }
    
    
    
    

    

async function calculateAverageTotalEngineersForDisplayedMonth(weeklyEngineerCount, group, site) {
    let totalEngineers = 0;
    let dayCount = 0;

    // 현재 표시된 달의 주차 데이터만 필터링
    Object.keys(weeklyEngineerCount).forEach(weekKey => {
        const weekDate = new Date(weekKey);
        if (weekDate.getFullYear() === currentYear && weekDate.getMonth() === currentMonth) {
            const isWeekend = false; // 평일만 계산
            const dailyEngineers = getTotalEngineersByFilter(weekKey, isWeekend, group, site);

            // 유효한 값만 합산
            if (dailyEngineers > 0) {
                totalEngineers += dailyEngineers;
                dayCount++;
            }
        }
    });

    // 현재 표시된 달의 평일 평균 엔지니어 수 계산
    const averageTotalEngineers = dayCount > 0 ? (totalEngineers / dayCount).toFixed(2) : 0;

    return averageTotalEngineers;
}

async function calculateAndDisplayAverageOperatingRate(weeklyRates, firstLogDate) {
    if (!weeklyRates || typeof weeklyRates !== 'object') {
        console.error("weeklyRates가 정의되지 않았거나 올바른 객체가 아닙니다.");
        document.getElementById('average-operating-rate-value').innerText = `0%`;
        return;
    }

    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;
    const start = startDate ? new Date(startDate) : firstLogDate;
    const end = endDate ? new Date(endDate) : new Date();
    
    const filteredRates = Object.keys(weeklyRates)
        .flatMap(weekKey => {
            const weekDate = new Date(weekKey);
            if (weekDate >= start && weekDate <= end) {
                return weeklyRates[weekKey];
            }
            return [];
        });

        const totalOperatingRates = filteredRates.reduce((sum, rate) => sum + rate, 0);
        const count = filteredRates.length;
        const averageOperatingRate = count > 0 ? (totalOperatingRates / count).toFixed(1) : 0;

        console.log('Filtered Rates:', filteredRates); // 디버깅용
    document.getElementById('average-operating-rate-value').innerText = `${averageOperatingRate}%`;
    updateDonutChart(averageOperatingRate);

    const totalWorktimeMinutes = cumulativeTotalWorkHours * 60;
    const totalWorktimeHours = Math.floor(totalWorktimeMinutes / 60);
    const totalWorktimeRemainderMinutes = Math.round(totalWorktimeMinutes % 60);
    const workDays = filteredRates.length;

    const group = document.getElementById('group-select').value;
    const site = document.getElementById('site-select').value;
    const averageTotalEngineers = await calculateAverageTotalEngineersForDisplayedMonth(weeklyEngineerCount, group, site);

    const requiredEngineers = (averageTotalEngineers * averageOperatingRate / 100).toFixed(1);
    const avgWorktimePerEngineer = ((8 * averageOperatingRate) / 100).toFixed(1);

    document.getElementById('totalWorktime').innerText = `${totalWorktimeHours}시간 ${totalWorktimeRemainderMinutes}분`;
    document.getElementById('workDays').innerText = workDays;
    document.getElementById('totalEngineers').innerText = averageTotalEngineers;
    document.getElementById('requiredEngineers').innerText = requiredEngineers;
    document.getElementById('avgWorktimePerEngineer').innerText = `${avgWorktimePerEngineer}시간`;
}








function updateDonutChart(averageRate) {
    const ctx = document.getElementById('donutChart').getContext('2d');

    if (!donutChart) {
        donutChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                datasets: [{
                    data: [averageRate, 100 - averageRate],
                    backgroundColor: ['#36A2EB', '#E0E0E0']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 1, // 정사각형 비율 유지
                cutout: '68%',
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom'
                    },
                    tooltip: {
                        enabled: true
                    },
                    doughnutCenterText: {
                        text: `${averageRate}%`  // 초기값 설정
                    }
                }
            },
            plugins: [{
                id: 'doughnutCenterText',
                beforeDraw(chart) {
                    const { width, height, ctx } = chart;
                    ctx.restore();
                    const fontSize = (height / 7).toFixed(2);
                    ctx.font = `bold ${fontSize}px sans-serif`;
                    ctx.textBaseline = 'middle';
                    ctx.fillStyle = '#333';

                    // 중앙 텍스트 업데이트
                    const text = chart.config.options.plugins.doughnutCenterText.text || `${averageRate}%`;  // 기본값 설정
                    const textX = Math.round((width - ctx.measureText(text).width) / 2);
                    const textY = height / 2;

                    // 이전 텍스트 지우기 및 새 텍스트 설정
                    ctx.clearRect(0, 0, width, height);
                    ctx.fillText(text, textX, textY);
                    ctx.save();
                }
            }]
        });
    } else {
        // 도넛 차트 데이터 및 텍스트 업데이트
        donutChart.data.datasets[0].data = [averageRate, 100 - averageRate];
        donutChart.options.plugins.doughnutCenterText.text = `${averageRate}%`;

        // 차트 업데이트
        donutChart.update();
    }
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

function renderCalendar(filteredLogs, year, month, dayType, collectAllWeeks = false) {
    const calendarContainer = document.getElementById('calendar-container');
    calendarContainer.innerHTML = '';

    cumulativeTotalWorkHours = 0;

    renderDaysRow();

    const firstLogDate = filteredLogs.length > 0
        ? new Date(Math.min(...filteredLogs.map(log => new Date(log.task_date))))
        : new Date(year, month - 1, 1); // 작업이 없을 경우 해당 월의 첫 날
    const lastLogDate = filteredLogs.length > 0
        ? new Date(Math.max(...filteredLogs.map(log => new Date(log.task_date))))
        : new Date(year, month, 0); // 작업이 없을 경우 해당 월의 마지막 날

    const logsByDate = {};

    // 해당 월 전체 날짜를 미리 초기화
    let tempDate = new Date(firstLogDate);
    while (tempDate <= lastLogDate) {
        const dateStr = tempDate.toISOString().split('T')[0];
        logsByDate[dateStr] = [];
        tempDate.setDate(tempDate.getDate() + 1);
    }

    // 실제 로그를 각 날짜에 추가
    filteredLogs.forEach(log => {
        const logDate = new Date(log.task_date).toISOString().split('T')[0];
        if (!logsByDate[logDate]) logsByDate[logDate] = [];
        logsByDate[logDate].push(log);
    });

    // 달력 시작일: 달의 첫 날이 포함된 주의 월요일로 조정
    const calendarStartDate = new Date(firstLogDate);
    const startDayOfWeek = calendarStartDate.getDay();
    calendarStartDate.setDate(calendarStartDate.getDate() - (startDayOfWeek === 0 ? 7 : startDayOfWeek));

    // 달력 종료일: 마지막 날이 포함된 주의 일요일로 조정
    const calendarEndDate = new Date(lastLogDate);
    const endDayOfWeek = calendarEndDate.getDay();
    calendarEndDate.setDate(calendarEndDate.getDate() + (endDayOfWeek === 0 ? 0 : 7 - endDayOfWeek));

    // 오늘 날짜를 기준으로 출력 제한
    const today = new Date();
    today.setHours(0, 0, 0, 0);  // 시간 제거 (날짜 비교만 위해)

    if (calendarEndDate > today) {
        calendarEndDate.setTime(today.getTime());  // 오늘까지만 출력
    }

    const weeklyRates = {};
    let currentDate = new Date(calendarStartDate);

    // 첫 주 빈 셀 추가
    for (let i = 0; i < currentDate.getDay(); i++) {
        const emptyDiv = document.createElement('div');
        emptyDiv.classList.add('calendar-day', 'empty');
        calendarContainer.appendChild(emptyDiv);
    }

    while (currentDate <= calendarEndDate) {
        const dateString = currentDate.toISOString().split('T')[0];
        const dailyLogs = logsByDate[dateString] || [];

        const isEmptyDay = dailyLogs.length === 0;
        const dayDiv = createDayDiv(dateString, dailyLogs, weeklyRates, dayType, isEmptyDay);
        calendarContainer.appendChild(dayDiv);

        currentDate.setDate(currentDate.getDate() + 1);

        // 주가 바뀌는 시점에 줄 나누기
        if (currentDate.getDay() === 1 && currentDate <= calendarEndDate) {
            const lineBreak = document.createElement('div');
            lineBreak.classList.add('week-separator');
            calendarContainer.appendChild(lineBreak);
        }
    }

    // 마지막 주 빈 셀 추가
    for (let i = currentDate.getDay(); i <= 6 && i !== 0; i++) {
        const emptyDiv = document.createElement('div');
        emptyDiv.classList.add('calendar-day', 'empty');
        calendarContainer.appendChild(emptyDiv);
    }

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
    return weeklyRates;
}


    
    
    
    
    
function createDayDiv(dateString, dailyLogs = [], weeklyRates, dayType, isEmpty = false) {
    const dayDiv = document.createElement('div');
    dayDiv.classList.add('calendar-day');

    const date = new Date(dateString);
    const dayOfWeek = date.getUTCDay();
    const isWeekend = dayOfWeek === 6 || dayOfWeek === 0;
    const isHoliday = holidays.includes(dateString);

    // 날짜 항상 표시
    const dateElement = document.createElement('h2');
    dateElement.innerText = date.toISOString().split('T')[0];
    dayDiv.appendChild(dateElement);

    const group = document.getElementById('group-select').value;
    const site = document.getElementById('site-select').value;
    const isWeekendOrHoliday = isWeekend || isHoliday;
    const weekKey = getWeekKey(dateString);

    // 작업이 없는 날 처리
    if (isEmpty) {
        dayDiv.classList.add('empty');

        const totalEngineers = getTotalEngineersByFilter(weekKey, isWeekendOrHoliday, group, site);
        const requiredEngineers = 0;
        const operatingRate = 0;

        if (!weeklyRates[weekKey]) weeklyRates[weekKey] = [];
        if (
            dayType === 'all' ||
            (dayType === 'workday' && !isWeekend && !isHoliday) ||
            (dayType === 'holiday' && (isWeekend || isHoliday))
        ) {
            weeklyRates[weekKey].push(operatingRate);
        }

        // 색상 스타일 (0% → surplus)
        dayDiv.classList.add('surplus');

        const taskCountElement = document.createElement('p');
        taskCountElement.classList.add('task-count');
        taskCountElement.innerText = `건 수: 0`;
        dayDiv.appendChild(taskCountElement);

        const requiredEngineersElement = document.createElement('p');
        requiredEngineersElement.classList.add('required-engineers');
        requiredEngineersElement.innerText = `필요 Eng'r 수: 0`;
        dayDiv.appendChild(requiredEngineersElement);

        const operatingRateElement = document.createElement('p');
        operatingRateElement.classList.add('operating-rate');
        operatingRateElement.innerText = `WTM: 0%`;
        dayDiv.appendChild(operatingRateElement);

        dayDiv.addEventListener('click', () => openModal(dateString, []));
        return dayDiv;
    }

    // 주말/공휴일 스타일
    if (isHoliday) {
        dayDiv.classList.add('holiday');
    }
    if (isWeekend) {
        dayDiv.classList.add('weekend');
    }

    const taskCount = dailyLogs.length;
    const totalMinutes = dailyLogs.reduce((acc, log) => {
        const workerCount = log.task_man.split(',').length;
        const [hours, minutes] = log.task_duration.split(':').map(Number);
        return acc + (hours * 60 + minutes) * workerCount;
    }, 0);

    const additionalTime = Array.from(new Set(dailyLogs.flatMap(log => log.task_man.split(',').map(worker => worker.trim().split('(')[0].trim()))))
        .reduce((acc, worker) => {
            const workerTaskCount = dailyLogs.filter(log => log.task_man.includes(worker)).length;
            return acc + (workerTaskCount === 1 ? 4 : 4.5);
        }, 0);

    const totalWorkHours = totalMinutes / 60 + additionalTime;
    const requiredEngineers = (totalWorkHours / 8).toFixed(1);
    const totalEngineers = getTotalEngineersByFilter(weekKey, isWeekendOrHoliday, group, site);
    const operatingRate = totalEngineers ? ((requiredEngineers / totalEngineers) * 100).toFixed(1) : 0;

    if (!weeklyRates[weekKey]) weeklyRates[weekKey] = [];

    if (
        dayType === 'all' ||
        (dayType === 'workday' && !isWeekend && !isHoliday) ||
        (dayType === 'holiday' && (isWeekend || isHoliday))
    ) {
        weeklyRates[weekKey].push(parseFloat(operatingRate));
    }

    // 색상 스타일 적용
    if (operatingRate >= 100) {
        dayDiv.classList.add('lack');
    } else if (operatingRate >= 70 && operatingRate < 100) {
        dayDiv.classList.add('optimal');
    } else if (operatingRate > 0 && operatingRate < 70) {
        dayDiv.classList.add('surplus');
    }

    // 작업 건수, 필요 Engr 수, 가동률 표시
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
    operatingRateElement.innerText = `WTM: ${operatingRate}%`;
    dayDiv.appendChild(operatingRateElement);

    dayDiv.addEventListener('click', () => openModal(dateString, dailyLogs));
    return dayDiv;
}

    
    
    
    
    
    
    
    
    
    
    
    

    function formatWeekLabel(weekKey) {
        const [year, month, day] = weekKey.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        const weekNumber = getWeekNumber(date);
        const monthName = date.toLocaleString('en', { month: 'short' });
        return `${year}Y-${monthName}-${weekNumber}W`;
    }
    

    function getWeekNumber(date) {
        const startOfYear = new Date(date.getFullYear(), 0, 1);
        const dayOfYear = ((date - startOfYear + 86400000) / 86400000);
        return Math.ceil((dayOfYear + startOfYear.getDay() + 1) / 7);
    }
    
    function renderWeeklyOperatingRateChart(weeklyAverageRates) {
        const ctx = document.getElementById('weeklyOperatingRateChart').getContext('2d');
        const recentWeeklyRates = weeklyAverageRates
        .sort((a, b) => {
            const weekA = parseInt(a.week.match(/(\d+)W/)[1], 10);
            const weekB = parseInt(b.week.match(/(\d+)W/)[1], 10);
            return weekA - weekB; // 주차를 기준으로 오름차순 정렬
        })
        .slice(-15); // 마지막 10개 데이터만 가져옴
        const labels = recentWeeklyRates.map(item => item.week); // 최근 10개 주차 라벨
        const data = recentWeeklyRates.map(item => item.averageRate); // 최근 10개 가동률 데이터
    
        
        // 가동률을 시간으로 변환한 값을 보조 축 데이터로 사용합니다 (8시간 기준 가동률)
        const timeData = data.map(rate => (rate / 100) * 8); // 근무 시간 계산 (가동률의 8시간 기준)
        const maxTimeValue = Math.max(...timeData) * 1.1;
        const maxRateValue = Math.max(...data) * 1.6; // 여유 공간 포함
    
        if (weeklyOperatingRateChart) {
            weeklyOperatingRateChart.destroy();
        }
    
        weeklyOperatingRateChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [
                    {
                        label: 'Weekly Operating Rate (%)',
                        data,
                        backgroundColor: 'rgba(54, 162, 235, 0.2)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 1,
                        yAxisID: 'y',
                    },
                    {
                        label: 'Working Time (hours)',
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
                maintainAspectRatio: false,
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                if (context.dataset.label === 'Weekly Operating Rate (%)') {
                                    return `${context.raw.toFixed(2)}%`; // 소수점 둘째 자리까지 표시
                                } else if (context.dataset.label === 'Working Time (hours)') {
                                    const hours = Math.floor(context.raw);
                                    const minutes = Math.round((context.raw - hours) * 60);
                                    return `${hours}h ${minutes}m`; // 시간과 분 형식으로 표시
                                }
                                return context.raw;
                            }
                        }
                    },
                    datalabels: {
                        display: true,
                        formatter: (value, context) => {
                            if (context.dataset.label === 'Weekly Operating Rate (%)') {
                                return `${value.toFixed(2)}%`; // 소수점 둘째 자리까지 표시
                            } else if (context.dataset.label === 'Working Time (hours)') {
                                const hours = Math.floor(value);
                                const minutes = Math.round((value - hours) * 60);
                                return `${hours}h ${minutes}m`; // 시간과 분 형식으로 표시
                            }
                            return value;
                        },
                        color: '#000',
                        anchor: 'end',
                        align: 'top',
                        font: {
                            size: 13 // 데이터 레이블 폰트 크기 조정
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            font: {
                                size: 13 // x축 폰트 크기 조정
                            }
                        }
                    },
                    y: {
                        beginAtZero: true,
                        max: 200, // 가동율 최대값 설정
                        ticks: {
                            callback: (value) => `${value.toFixed(2)}%` // y축 레이블 소수점 둘째 자리까지 표시
                        }
                    },
                    y1: {
                        beginAtZero: true,
                        max: maxTimeValue, // 동적 최대값 설정
                        position: 'right',
                        ticks: {
                            callback: (value) => {
                                const hours = Math.floor(value);
                                const minutes = Math.round((value - hours) * 60);
                                return `${hours}h ${minutes}m`; // y1축 레이블을 시간 형식으로 표시
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
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">WTM</td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">
                        <div>(필요 Eng'r 수 / 주간 가용 Eng'r 수) x 100</div>
                        <div>(${requiredEngineers} / ${totalEngineers}) x 100 = <strong>${operatingRate}%</strong></div>
                    </td>
                </tr>
            </table>
            <div style="margin-top: 20px; font-size: 14px; line-height: 1.5; color: #555;">
                <strong>TAT TIME ( 4시간, 4.5시간 ) 에 대한 근거</strong><br>
                -. TAT(Turn Around Time) : FAB 내에서 작업하는 시간 및 식사시간을 제외한 시간<br>
                -. 1건 작업 시 TAT(4시간) : TBM(0.5시간) + 작업 분배 및 준비(1시간) + 이력 작성(0.5시간) + 이동시간(2시간)<br>
                -. 2건 작업 시 TAT(4.5시간) : TBM(0.5시간) + 작업 분배 및 준비(1시간) + 이력 작성(0.5시간) + 이동시간(2.5시간)<br>
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
function renderMonthlyWorktimeChart(logs) {
    if (monthlyWorktimeChartInstance) {
        monthlyWorktimeChartInstance.destroy();
    }
    const monthlyWorktime = {};

    logs.forEach(log => {
        const date = new Date(log.task_date);
        const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const [hours, minutes] = log.task_duration.split(':').map(Number);
        const taskDurationMinutes = (hours * 60) + minutes;
        const numWorkers = log.task_man.split(',').length;
        
        if (!monthlyWorktime[month]) {
            monthlyWorktime[month] = 0;
        }
        monthlyWorktime[month] += taskDurationMinutes * numWorkers;
    });

    const labels = Object.keys(monthlyWorktime).sort();
    const data = labels.map(month => monthlyWorktime[month] / 60);

    const ctx = document.getElementById('monthlyWorktimeChart').getContext('2d');
    monthlyWorktimeChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Monthly Worktime (hours)',
                data: data,
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 2,
                fill: true,
                backgroundColor: 'rgba(75, 192, 192, 0.2)'
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Month'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Worktime (hours)'
                    },
                    beginAtZero: true
                }
            },
            plugins: {
                datalabels: {
                    display: true,
                    anchor: 'end',
                    align: 'top',
                    formatter: Math.round,
                    font: {
                        weight: 'bold'
                    }
                }
            }
        }
    });
}

function renderLineWorkStatsChart(logs) {
    if (lineWorkStatsChartInstance) {
        lineWorkStatsChartInstance.destroy();
    }

    const siteOrder = {
        "PT": ["P1F", "P1D", "P2F", "P2D", "P2-S5", "P3F", "P3D", "P3-S5", "P4F", "P4D", "P4-S5"],
        "HS": ["12L", "13L", "15L", "16L", "17L", "S1", "S3", "S4", "S3V", "NRD", "NRD-V", "U4", "M1", "5L"],
        "IC": ["M14", "M16"],
        "CJ": ["M11", "M12", "M15"],
        "PSKH": ["PSKH"]
    };

    const siteColors = {
        "PT": 'rgba(153, 102, 255, 0.2)',
        "HS": 'rgba(255, 99, 132, 0.2)',
        "IC": 'rgba(54, 162, 235, 0.2)',
        "CJ": 'rgba(255, 206, 86, 0.2)',
        "PSKH": 'rgba(153, 102, 255, 0.2)'
    };

    const siteBorderColors = {
        "PT": 'rgba(153, 102, 255, 1)',
        "HS": 'rgba(255, 99, 132, 1)',
        "IC": 'rgba(54, 162, 235, 1)',
        "CJ": 'rgba(255, 206, 86, 1)',
        "PSKH": 'rgba(153, 102, 255, 1)'
    };

    const siteLineWorkData = {};

    logs.forEach(log => {
        const { site, line, task_duration } = log;
        const durationParts = task_duration.split(':');
        const hours = parseInt(durationParts[0], 10);
        const minutes = parseInt(durationParts[1], 10);
        const taskDurationMinutes = (hours * 60) + minutes;
        const numWorkers = log.task_man.split(',').length;
        const totalDuration = taskDurationMinutes * numWorkers;

        if (!siteLineWorkData[site]) {
            siteLineWorkData[site] = {};
        }

        if (!siteLineWorkData[site][line]) {
            siteLineWorkData[site][line] = {
                worktime: 0,
                taskCount: 0
            };
        }

        siteLineWorkData[site][line].worktime += totalDuration;
        siteLineWorkData[site][line].taskCount += 1;
    });

    const labels = [];
    const worktimeValues = [];
    const taskCountValues = [];
    const backgroundColors = [];
    const borderColors = [];

    for (const [site, lines] of Object.entries(siteLineWorkData)) {
        const sortedLines = Object.entries(lines).sort((a, b) => b[1].worktime - a[1].worktime);

        sortedLines.forEach(([line, data]) => {
            labels.push(`${site}-${line}`);
            worktimeValues.push(data.worktime / 60); // hours
            taskCountValues.push(data.taskCount);
            backgroundColors.push(siteColors[site]);
            borderColors.push(siteBorderColors[site]);
        });
    }

    const ctx = document.getElementById('lineWorkStatsChart').getContext('2d');
    lineWorkStatsChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Total Worktime (hours)',
                    data: worktimeValues,
                    backgroundColor: backgroundColors,
                    borderColor: borderColors,
                    borderWidth: 1
                },
                {
                    label: 'Task Count',
                    data: taskCountValues,
                    type: 'line',
                    borderColor: 'rgba(75, 192, 193, 10)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderWidth: 2,
                    yAxisID: 'y-axis-taskCount'
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Line'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Total Worktime (hours)'
                    },
                    beginAtZero: true
                },
                'y-axis-taskCount': {
                    title: {
                        display: true,
                        text: 'Task Count'
                    },
                    beginAtZero: true,
                    position: 'right',
                    grid: {
                        drawOnChartArea: false
                    }
                }
            }
        }
    });
}

function renderWorkTypeStatsChart(logs) {
    if (workTypeStatsChartInstance) {
        workTypeStatsChartInstance.destroy();
    }

    const workTypeData = {
        'SET UP': 0,
        'MAINT': 0,
        'RELOCATION': 0
    };

    logs.forEach(log => {
        const { work_type } = log;
        if (workTypeData[work_type] !== undefined) {
            workTypeData[work_type] += 1; // 작업 건수만 증가
        }
    });

    const labels = Object.keys(workTypeData);
    const workCountValues = labels.map(type => workTypeData[type]);
    const totalTasks = workCountValues.reduce((a, b) => a + b, 0);

    const ctx = document.getElementById('workTypeStatsChart').getContext('2d');
    workTypeStatsChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: workCountValues,
                backgroundColor: ['rgba(255, 99, 132, 0.6)', 'rgba(91, 223, 105, 0.61)', 'rgba(255, 206, 86, 0.6)'],
                borderColor: ['rgba(255, 99, 132, 1)', 'rgba(91, 223, 105, 1)', 'rgba(255, 206, 86, 1)'],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 1.5, // 정사각형 비율 유지
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#333',
                        font: {
                            size: 11
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const percentage = ((value / totalTasks) * 100).toFixed(2);
                            return `${label}: ${value} tasks (${percentage}%)`;
                        }
                    }
                },
                datalabels: { // ✅ 데이터 레이블 항상 표시 설정
                    color: '#000',
                    font: {
                        weight: 'bold',
                        size: 12
                    },
                    formatter: (value, context) => {
                        const percentage = ((value / totalTasks) * 100).toFixed(2);
                        return `${value} (${percentage}%)`; // 예: "12 (30.00%)"
                    },
                    anchor: 'center', // 위치 조정 (start, center, end 가능)
                    align: 'center'
                }
            }
        },
        plugins: [ChartDataLabels] // ✅ Chart.js 플러그인 추가
    });
}


function renderEquipmentTypeStatsChart(logs) {
    if (equipmentTypeStatsChartInstance) {
        equipmentTypeStatsChartInstance.destroy();
    }

    const equipmentTypeData = {};

    logs.forEach(log => {
        const { equipment_type } = log;

        if (!equipmentTypeData[equipment_type]) {
            equipmentTypeData[equipment_type] = 0;
        }

        equipmentTypeData[equipment_type] += 1; // 작업 건수만 증가
    });

    const labels = Object.keys(equipmentTypeData);
    const workCountValues = labels.map(type => equipmentTypeData[type]);
    const totalTasks = workCountValues.reduce((a, b) => a + b, 0);

    const ctx = document.getElementById('equipmentTypeStatsChart').getContext('2d');
    equipmentTypeStatsChartInstance = new Chart(ctx, {
        type: 'bar', // 그래프 유형을 막대형(bar)으로 변경
        data: {
            labels: labels,
            datasets: [{
                data: workCountValues,
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 1.5,
            plugins: {
                legend: {
                    display: false // 범례 비활성화
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const percentage = ((value / totalTasks) * 100).toFixed(2);
                            return `${label}: ${value} tasks (${percentage}%)`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Equipment Type'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Number of Tasks'
                    },
                    beginAtZero: true
                }
            }
        }
    });
}




function renderAmPmStatsChart(logs) {
    if (amPmStatsChartInstance) {
        amPmStatsChartInstance.destroy();
    }

    const amPmData = {
        'AM': 0,
        'PM': 0
    };

    logs.forEach(log => {
        const { start_time } = log;
        const startTimeParts = start_time.split(':');
        const startHour = parseInt(startTimeParts[0], 10);

        const period = startHour < 12 ? 'AM' : 'PM';

        amPmData[period] += 1; // 작업 건수만 증가
    });

    const labels = Object.keys(amPmData);
    const workCountValues = labels.map(period => amPmData[period]);
    const totalTasks = workCountValues.reduce((a, b) => a + b, 0);

    const ctx = document.getElementById('amPmStatsChart').getContext('2d');
    amPmStatsChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: workCountValues,
                backgroundColor: ['rgba(255, 166, 197, 0.61)', 'rgba(3, 14, 33, 0.2)'],
                borderColor: ['rgba(255, 166, 197, 1)', 'rgba(3, 14, 33, 0.3)'],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 1.5, // 정사각형 비율 유지
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#333',
                        font: {
                            size: 11
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const percentage = ((value / totalTasks) * 100).toFixed(2);
                            return `${label}: ${value} tasks (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}




function renderOvertimeChart(logs) {
    if (overtimeChartInstance) {
        overtimeChartInstance.destroy();
    }

    const overtimeData = {
        'Overtime': 0,
        'Regular': 0
    };

    logs.forEach(log => {
        const { end_time } = log;
        const endTimeParts = end_time.split(':');
        const endHour = parseInt(endTimeParts[0], 10);
        const endMinutes = parseInt(endTimeParts[1], 10);

        if ((endHour >= 18 || endHour < 8) || (endHour === 8 && endMinutes <= 30)) {
            overtimeData['Overtime'] += 1; // 작업 건수만 증가
        } else {
            overtimeData['Regular'] += 1;
        }
    });

    const labels = Object.keys(overtimeData);
    const workCountValues = labels.map(type => overtimeData[type]);
    const totalTasks = workCountValues.reduce((a, b) => a + b, 0);

    const ctx = document.getElementById('overtimeChart').getContext('2d');
    overtimeChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                data: workCountValues,
                backgroundColor: ['rgba(255, 99, 132, 0.6)', 'rgba(54, 162, 235, 0.6)'],
                borderColor: ['rgba(255, 99, 132, 1)', 'rgba(54, 162, 235, 1)'],
                borderWidth: 2
            }]
        },
        options: {
            indexAxis: 'y', // 수평 막대 그래프
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 1.5,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const percentage = ((value / totalTasks) * 100).toFixed(2);
                            return `${label}: ${value} tasks (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}


function renderTimeRangeChart(logs) {
    if (timeRangeChartInstance) {
        timeRangeChartInstance.destroy();
    }

    const timeRangeData = {
        '0-1 hours': 0,
        '1-2 hours': 0,
        '2-3 hours': 0,
        '3-4 hours': 0,
        '4+ hours': 0
    };

    logs.forEach(log => {
        const { task_duration } = log;
        const durationParts = task_duration.split(':');
        const hours = parseInt(durationParts[0], 10);
        const minutes = parseInt(durationParts[1], 10);
        const taskDurationMinutes = (hours * 60) + minutes;

        if (taskDurationMinutes <= 60) {
            timeRangeData['0-1 hours'] += 1; // 작업 건수 증가
        } else if (taskDurationMinutes <= 120) {
            timeRangeData['1-2 hours'] += 1;
        } else if (taskDurationMinutes <= 180) {
            timeRangeData['2-3 hours'] += 1;
        } else if (taskDurationMinutes <= 240) {
            timeRangeData['3-4 hours'] += 1;
        } else {
            timeRangeData['4+ hours'] += 1;
        }
    });

    const labels = Object.keys(timeRangeData);
    const worktimeValues = labels.map(type => timeRangeData[type]); // 작업 건수
    const totalWorktime = worktimeValues.reduce((a, b) => a + b, 0);
    const percentages = worktimeValues.map(value => (value / totalWorktime * 100).toFixed(2));

    const ctx = document.getElementById('timeRangeChart').getContext('2d');
    timeRangeChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                data: worktimeValues,
                backgroundColor: ['rgba(255, 99, 132, 0.6)', 'rgba(54, 162, 235, 0.6)', 'rgba(255, 206, 86, 0.6)', 'rgba(75, 192, 192, 0.6)', 'rgba(153, 102, 255, 0.6)'],
                borderColor: ['rgba(255, 99, 132, 1)', 'rgba(54, 162, 235, 1)', 'rgba(255, 206, 86, 1)', 'rgba(75, 192, 192, 1)', 'rgba(153, 102, 255, 1)'],
                borderWidth: 2
            }]
        },
        options: {
            indexAxis: 'y', // 수평 막대 그래프
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 1.5,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const percentage = percentages[context.dataIndex];
                            return `${label}: ${value} tasks (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}




function renderWarrantyChart(logs) {
    if (warrantyChartInstance) {
        warrantyChartInstance.destroy();
    }

    const warrantyData = {
        'WI': 0,
        'WO': 0
    };

    logs.forEach(log => {
        const { warranty } = log;

        if (warranty === 'WI' || warranty === 'WO') {
            warrantyData[warranty] += 1; // 작업 건수만 증가
        }
    });

    const labels = Object.keys(warrantyData);
    const workCountValues = labels.map(type => warrantyData[type]);
    const totalTasks = workCountValues.reduce((a, b) => a + b, 0);

    const ctx = document.getElementById('warrantyChart').getContext('2d');
    warrantyChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                data: workCountValues,
                backgroundColor: ['rgba(153, 102, 255, 0.6)', 'rgba(255, 159, 64, 0.6)'],
                borderColor: ['rgba(153, 102, 255, 1)', 'rgba(255, 159, 64, 1)'],
                borderWidth: 2
            }]
        },
        options: {
            indexAxis: 'y', // 수평 막대 그래프
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 1.5,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const percentage = ((value / totalTasks) * 100).toFixed(2);
                            return `${label}: ${value} tasks (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

function renderGroupSiteAverageChart(logs) {
    const ctx = document.getElementById('groupSiteOperatingRateChart').getContext('2d');

    const groupSiteRates = {};

    logs.forEach(log => {
        const groupSiteKey = `${log.group} - ${log.site}`;
        const { task_duration, task_man } = log;
        const [hours, minutes] = task_duration.split(':').map(Number);
        const taskDurationMinutes = (hours * 60) + minutes;
        const numWorkers = task_man.split(',').length;
        const workHours = (taskDurationMinutes * numWorkers) / 60;

        if (!groupSiteRates[groupSiteKey]) {
            groupSiteRates[groupSiteKey] = { totalWorkHours: 0, totalEngineers: 0 };
        }
        groupSiteRates[groupSiteKey].totalWorkHours += workHours;
        groupSiteRates[groupSiteKey].totalEngineers += numWorkers;
    });

    Object.keys(groupSiteRates).forEach(label => {
        const { totalWorkHours, totalEngineers } = groupSiteRates[label];
        const operatingRate = totalEngineers > 0 ? ((totalWorkHours / (totalEngineers * 8)) * 100).toFixed(1) : 0;
    });

    const labels = Object.keys(groupSiteRates);
    const data = labels.map(label => {
        const { totalWorkHours, totalEngineers } = groupSiteRates[label];
        return totalEngineers > 0 ? ((totalWorkHours / (totalEngineers * 8)) * 100).toFixed(1) : 0;
    });

    if (groupSiteOperatingRateChartInstance) {
        groupSiteOperatingRateChartInstance.destroy();
    }

    groupSiteOperatingRateChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Operating Rate (%)',
                data: data,
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            indexAxis: 'y',
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Operating Rate (%)'
                    },
                    beginAtZero: true,
                    max: 100
                },
                y: {
                    title: {
                        display: true,
                        text: 'Group - Site'
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.label}: ${context.raw}%`;
                        }
                    }
                }
            }
        }
    });
}
