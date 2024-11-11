// Excel 다운로드 버튼 클릭 이벤트
document.getElementById('download-excel-button').addEventListener('click', () => {
    // Combined Data 테이블에서 데이터를 가져와 Excel 형식으로 변환
    const tableData = [];
    const table = document.getElementById('combined-table');
    const sheetData = [];

    // 첫 번째 행의 헤더 정의
    const headers = ["대분류", "중분류", ...Array.from(table.querySelectorAll('thead tr th')).slice(1).map(th => th.textContent.trim())];
    sheetData.push(headers);

    // 작업자별 평균 계산을 위한 배열 초기화
    const workerAverages = new Array(headers.length - 3).fill(0); // 작업자별 평균을 계산할 배열 (대분류, 중분류, 평균 제외)

    // 대분류를 기억하기 위한 변수
    let currentCategory = "";
    let totalRows = 0;

    // 각 행의 데이터를 추출하여 배열에 추가
    Array.from(table.querySelectorAll('tbody tr')).forEach(row => {
        const cells = Array.from(row.querySelectorAll('td'));

        // 대분류 행인지 확인하고 처리
        if (cells[0].getAttribute('rowspan')) {
            currentCategory = cells[0].textContent.trim();  // 대분류 업데이트
            const rowData = [currentCategory, cells[1].textContent.trim()]; // 대분류와 첫 번째 중분류 항목 추가

            // 작업자별 퍼센트 값 가져오기
            const percentages = cells.slice(2).map(td => parseFloat(td.textContent.trim()) / 100 || 0); // 소수점으로 변환
            
            // 평균값 계산
            const average = percentages.length > 0 ? (percentages.reduce((a, b) => a + b, 0) / percentages.length) : 0;
            rowData.push(average); // 평균 값을 추가
            
            // 작업자별 퍼센트 값 추가 (소수점 값으로 저장)
            rowData.push(...percentages);
            
            // 작업자별 평균 계산을 위한 값 누적
            percentages.forEach((value, index) => {
                workerAverages[index] += value;
            });
            totalRows++;
            
            sheetData.push(rowData);
        } else {
            // 대분류 셀이 없는 경우 중분류만 표시
            const rowData = ["", cells[0].textContent.trim()]; // 대분류는 빈 문자열로 두고 중분류 추가

            // 작업자별 퍼센트 값 가져오기
            const percentages = cells.slice(1).map(td => parseFloat(td.textContent.trim()) / 100 || 0); // 소수점으로 변환
            
            // 평균값 계산
            const average = percentages.length > 0 ? (percentages.reduce((a, b) => a + b, 0) / percentages.length) : 0;
            rowData.push(average); // 평균 값을 추가
            
            // 작업자별 퍼센트 값 추가 (소수점 값으로 저장)
            rowData.push(...percentages);
            
            // 작업자별 평균 계산을 위한 값 누적
            percentages.forEach((value, index) => {
                workerAverages[index] += value;
            });
            totalRows++;
            
            sheetData.push(rowData);
        }
    });

    // 각 작업자의 평균값을 계산하여 마지막에 추가
    const averageRow = ["", "작업자 평균"];
    const averagePercentages = workerAverages.map(value => totalRows > 0 ? ((value / totalRows) * 100).toFixed(2) + "%" : "0.00%");
    averageRow.push("", ...averagePercentages); // 평균 열 값 추가
    sheetData.push(averageRow); // 최하단에 평균 행 추가

    // Combined Data 테이블 데이터를 하나의 시트로 추가
    tableData.push({ sheetName: 'Combined Data', data: sheetData });

    // Excel 파일로 변환하여 다운로드
    exportToExcel(tableData);
});

// 엑셀 파일로 내보내는 함수
function exportToExcel(tableData) {
    const wb = XLSX.utils.book_new();

    tableData.forEach(({ sheetName, data }) => {
        const ws = XLSX.utils.aoa_to_sheet(data);
        
        // 퍼센트 값을 표시하기 위해 C열과 이후의 열을 퍼센트 서식으로 설정
        Object.keys(ws).forEach(cell => {
            if (cell.startsWith('C') && cell !== 'C1') {
                ws[cell].z = "0.00%"; // 퍼센트 서식
            }
        });

        XLSX.utils.book_append_sheet(wb, ws, sheetName);
    });

    XLSX.writeFile(wb, 'PCI DATA.xlsx');
}
