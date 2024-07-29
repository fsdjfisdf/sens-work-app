document.addEventListener('DOMContentLoaded', async () => {
    const equipmentTbody = document.getElementById('equipment-tbody');
    const searchButton = document.getElementById('searchButton');
    const resetButton = document.getElementById('resetButton');
    const searchEqName = document.getElementById('searchEqName');
    const searchGroup = document.getElementById('searchGroup');
    const searchSite = document.getElementById('searchSite');
    const searchType = document.getElementById('searchType');
    const searchLine = document.getElementById('searchLine');
    const searchWarrantyStatus = document.getElementById('searchWarrantyStatus');
    const equipmentCount = document.getElementById('equipment-count');
    const prevPage = document.getElementById('prevPage');
    const nextPage = document.getElementById('nextPage');
    const currentPage = document.getElementById('currentPage');
    const equipmentChart = document.getElementById('equipmentChart');

    let equipments = [];
    let filteredEquipments = [];
    let page = 1;
    const itemsPerPage = 10;

    function formatDate(dateString) {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    async function loadEquipment(filters = {}) {
        try {
            console.log('Loading equipment data...');
            const response = await axios.get('http://3.37.165.84:3001/api/equipment');
            console.log('Equipment data loaded:', response.data);
            equipments = response.data.sort((a, b) => new Date(a.START_DATE) - new Date(b.START_DATE));
            filterAndDisplayEquipments(filters);
        } catch (error) {
            console.error('Error loading equipment data:', error);
            equipmentTbody.innerHTML = '<tr><td colspan="9">Error loading equipment data.</td></tr>';
        }
    }
    
    function filterAndDisplayEquipments(filters) {
        filteredEquipments = equipments.filter(equipment => {
            return (!filters.EQNAME || equipment.EQNAME.toLowerCase().includes(filters.EQNAME.toLowerCase())) &&
                   (!filters.GROUP || equipment.GROUP === filters.GROUP) &&
                   (!filters.SITE || equipment.SITE === filters.SITE) &&
                   (!filters.TYPE || equipment.TYPE.toLowerCase().includes(filters.TYPE.toLowerCase())) &&
                   (!filters.LINE || equipment.LINE.toLowerCase().includes(filters.LINE.toLowerCase())) &&
                   (!filters.WARRANTY_STATUS || equipment.WARRANTY_STATUS === filters.WARRANTY_STATUS);
        });
        displayEquipments();
        updateChart();
    }

    function displayEquipments() {
        equipmentTbody.innerHTML = '';
        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const pageEquipments = filteredEquipments.slice(startIndex, endIndex);
        equipmentCount.textContent = `Total Equipment: ${filteredEquipments.length}`;

        pageEquipments.forEach(equipment => {
            const equipmentRow = document.createElement('tr');
            equipmentRow.innerHTML = `
                <td>${equipment.EQNAME}</td>
                <td>${equipment.BAY}</td>
                <td>${equipment.GROUP}</td>
                <td>${equipment.SITE}</td>
                <td>${equipment.TYPE}</td>
                <td>${equipment.LINE}</td>
                <td>${formatDate(equipment.START_DATE)}</td>
                <td>${formatDate(equipment.END_DATE)}</td>
                <td>${equipment.WARRANTY_STATUS}</td>
            `;
            equipmentTbody.appendChild(equipmentRow);
        });
    }

    function updateChart() {
        const groups = filteredEquipments.reduce((acc, equipment) => {
            acc[equipment.GROUP] = (acc[equipment.GROUP] || 0) + 1;
            return acc;
        }, {});

        const data = {
            labels: Object.keys(groups),
            datasets: [{
                label: 'Equipment Count by Group',
                data: Object.values(groups),
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        };

        new Chart(equipmentChart, {
            type: 'bar',
            data: data,
            options: {
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    searchButton.addEventListener('click', () => {
        const filters = {
            EQNAME: searchEqName.value,
            GROUP: searchGroup.value,
            SITE: searchSite.value,
            TYPE: searchType.value,
            LINE: searchLine.value,
            WARRANTY_STATUS: searchWarrantyStatus.value
        };
        page = 1;
        filterAndDisplayEquipments(filters);
    });

    resetButton.addEventListener('click', () => {
        searchEqName.value = '';
        searchGroup.value = '';
        searchSite.value = '';
        searchType.value = '';
        searchLine.value = '';
        searchWarrantyStatus.value = '';
        page = 1;
        loadEquipment();
    });

    prevPage.addEventListener('click', () => {
        if (page > 1) {
            page--;
            displayEquipments();
            currentPage.textContent = page;
        }
    });

    nextPage.addEventListener('click', () => {
        if (page * itemsPerPage < filteredEquipments.length) {
            page++;
            displayEquipments();
            currentPage.textContent = page;
        }
    });

    loadEquipment();
});
