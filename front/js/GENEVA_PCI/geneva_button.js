document.addEventListener("DOMContentLoaded", function() {
    const totalButton = document.getElementById("show-total-button");
    const countButton = document.getElementById("show-count-button");
    const selfButton = document.getElementById("show-self-button");

    const combinedTable = document.getElementById("combined-table");
    const taskCountTable = document.getElementById("task-count-table");
    const genevaMaintenanceTable = document.getElementById("geneva-maintenance-table");

    // 모든 테이블을 숨기기
    function hideAllTables() {
        combinedTable.classList.remove("active");
        taskCountTable.classList.remove("active");
        genevaMaintenanceTable.classList.remove("active");
    }

    // 버튼의 활성화 상태를 초기화
    function resetButtonStyles() {
        totalButton.classList.remove("active-button");
        countButton.classList.remove("active-button");
        selfButton.classList.remove("active-button");
    }

    // TOTAL 버튼 클릭 시
    totalButton.addEventListener("click", function() {
        hideAllTables();
        combinedTable.classList.add("active"); // TOTAL 테이블 표시
        resetButtonStyles();
        totalButton.classList.add("active-button"); // 버튼 활성화
    });

    // COUNT 버튼 클릭 시
    countButton.addEventListener("click", function() {
        hideAllTables();
        taskCountTable.classList.add("active"); // COUNT 테이블 표시
        resetButtonStyles();
        countButton.classList.add("active-button"); // 버튼 활성화
    });

    // SELF 버튼 클릭 시
    selfButton.addEventListener("click", function() {
        hideAllTables();
        genevaMaintenanceTable.classList.add("active"); // SELF 테이블 표시
        resetButtonStyles();
        selfButton.classList.add("active-button"); // 버튼 활성화
    });

    // 초기 상태에서 TOTAL 테이블만 표시
    hideAllTables();
    combinedTable.classList.add("active");
});
