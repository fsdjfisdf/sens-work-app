document.addEventListener('DOMContentLoaded', async () => {
    let equipments = [];

    // Fetch equipment data from the server
    async function loadEquipment() {
        try {
            const response = await axios.get('http://3.37.165.84/equipment');
            equipments = response.data;
            displayEquipments(equipments);
        } catch (error) {
            console.error('Error loading equipment data:', error);
        }
    }

    function displayEquipments(equipments) {
        const equipmentCards = document.getElementById('equipment-cards');
        equipmentCards.innerHTML = '';

        equipments.forEach(equipment => {
            const card = document.createElement('div');
            card.className = 'equipment-card';
            card.innerHTML = `
                <p><strong>EQ Name:</strong> ${equipment.EQNAME}</p>
                <p><strong>BAY:</strong> ${equipment.BAY}</p>
                <p><strong>Group:</strong> ${equipment.GROUP}</p>
                <p><strong>Site:</strong> ${equipment.SITE}</p>
                <p><strong>Type:</strong> ${equipment.TYPE}</p>
                <p><strong>Line:</strong> ${equipment.LINE}</p>
                <p><strong>Start Date:</strong> ${equipment.START_DATE}</p>
                <p><strong>End Date:</strong> ${equipment.END_DATE}</p>
                <p><strong>Warranty Status:</strong> ${equipment.WARRANTY_STATUS}</p>
            `;
            equipmentCards.appendChild(card);
        });
    }

    document.getElementById('searchButton').addEventListener('click', () => {
        const searchEqName = document.getElementById('searchEqName').value.toLowerCase();
        const searchGroup = document.getElementById('searchGroup').value.toLowerCase();
        const searchSite = document.getElementById('searchSite').value.toLowerCase();

        const filteredEquipments = equipments.filter(equipment => {
            return (
                (searchEqName === '' || equipment.EQNAME.toLowerCase().includes(searchEqName)) &&
                (searchGroup === '' || equipment.GROUP.toLowerCase().includes(searchGroup)) &&
                (searchSite === '' || equipment.SITE.toLowerCase().includes(searchSite))
            );
        });

        displayEquipments(filteredEquipments);
    });

    document.getElementById('resetButton').addEventListener('click', () => {
        document.getElementById('searchEqName').value = '';
        document.getElementById('searchGroup').value = '';
        document.getElementById('searchSite').value = '';
        displayEquipments(equipments);
    });

    loadEquipment();
});
