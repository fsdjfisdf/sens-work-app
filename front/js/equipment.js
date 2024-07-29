document.addEventListener('DOMContentLoaded', async () => {
    const equipmentContainer = document.getElementById('equipment-container');
    
    async function loadEquipment() {
        try {
            console.log('Loading equipment data...');
            const response = await axios.get('http://3.37.165.84:3001/api/equipment');
            console.log('Equipment data loaded:', response.data);
            const equipments = response.data;
            displayEquipments(equipments);
        } catch (error) {
            console.error('Error loading equipment data:', error);
            equipmentContainer.innerHTML = '<p>Error loading equipment data.</p>';
        }
    }
    
    function displayEquipments(equipments) {
        equipmentContainer.innerHTML = '';
        equipments.forEach(equipment => {
            const equipmentElement = document.createElement('div');
            equipmentElement.className = 'equipment-item';
            equipmentElement.innerHTML = `
                <p><strong>EQ Name:</strong> ${equipment.EQNAME}</p>
                <p><strong>Bay:</strong> ${equipment.BAY}</p>
                <p><strong>Group:</strong> ${equipment.GROUP}</p>
                <p><strong>Site:</strong> ${equipment.SITE}</p>
                <p><strong>Type:</strong> ${equipment.TYPE}</p>
                <p><strong>Line:</strong> ${equipment.LINE}</p>
                <p><strong>Start Date:</strong> ${equipment.START_DATE}</p>
                <p><strong>End Date:</strong> ${equipment.END_DATE}</p>
                <p><strong>Warranty Status:</strong> ${equipment.WARRANTY_STATUS}</p>
            `;
            equipmentContainer.appendChild(equipmentElement);
        });
    }

    loadEquipment();
});
