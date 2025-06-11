document.addEventListener('DOMContentLoaded', () => {
    const totalButton = document.getElementById('total-button');
    const selfCheckButton = document.getElementById('self-check-button');
    const workCountButton = document.getElementById('work-count-button');
    
    const combinedTable = document.getElementById('combined-table');
    const supraxpMaintenanceTable = document.getElementById('supraxp-maintenance-table');
    const taskCountTable = document.getElementById('task-count-table');
  
    // 초기 상태에서 TOTAL 테이블만 표시
    combinedTable.style.display = 'table';
    
    function hideAllTables() {
      combinedTable.style.display = 'none';
      supraxpMaintenanceTable.style.display = 'none';
      taskCountTable.style.display = 'none';
    }
  
    function removeActiveClass() {
      totalButton.classList.remove('active-button');
      selfCheckButton.classList.remove('active-button');
      workCountButton.classList.remove('active-button');
    }
  
    totalButton.addEventListener('click', () => {
      hideAllTables();
      combinedTable.style.display = 'table';
      removeActiveClass();
      totalButton.classList.add('active-button');
    });
  
    selfCheckButton.addEventListener('click', () => {
      hideAllTables();
      supraxpMaintenanceTable.style.display = 'table';
      removeActiveClass();
      selfCheckButton.classList.add('active-button');
    });
  
    workCountButton.addEventListener('click', () => {
      hideAllTables();
      taskCountTable.style.display = 'table';
      removeActiveClass();
      workCountButton.classList.add('active-button');
    });
  });
  