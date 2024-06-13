// exportToExcel.js
document.addEventListener('DOMContentLoaded', () => {
    const exportButton = document.getElementById('exportButton');
    
    exportButton.addEventListener('click', async () => {
        try {
            const response = await axios.get('http://3.37.165.84:3001/api/export-logs', {
                responseType: 'arraybuffer'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'work_logs.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Error exporting logs to Excel:', error);
        }
    });
});
