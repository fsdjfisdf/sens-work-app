document.addEventListener('DOMContentLoaded', async () => {
    const secmTable = document.getElementById('secmTable').getElementsByTagName('tbody')[0];

    try {
        const response = await fetch('http://3.37.165.84:3001/api/secm');
        const data = await response.json();

        data.forEach(row => {
            const newRow = secmTable.insertRow();

            Object.keys(row).forEach(key => {
                const newCell = newRow.insertCell();
                const newText = document.createTextNode(row[key]);
                newCell.appendChild(newText);
            });
        });
    } catch (error) {
        console.error('Error fetching data:', error);
    }
});
