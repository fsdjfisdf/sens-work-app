document.addEventListener('DOMContentLoaded', async () => {
    let logs = [];

    async function loadWorkLogs() {
        try {
            const response = await axios.get('http://3.37.165.84:3001/logs');
            logs = response.data.sort((a, b) => new Date(b.task_date) - new Date(a.task_date));
            displayLogs(logs);
        } catch (error) {
            console.error('Error loading work logs:', error);
        }
    }

    function displayLogs(logs) {
        const worklogCards = document.getElementById('worklog-cards');
        worklogCards.innerHTML = '';

        logs.forEach(log => {
            const card = document.createElement('div');
            card.className = 'worklog-card';
            card.innerHTML = `
                <p><strong>Date:</strong> ${log.task_date}</p>
                <p><strong>Title:</strong> ${log.task_name}</p>
                <p><strong>Worker:</strong> ${log.task_man}</p>
                <p><strong>EQ Name:</strong> ${log.equipment_name}</p>
                <p><strong>Group:</strong> ${log.group}</p>
                <p><strong>Site:</strong> ${log.site}</p>
                <div class="actions">
                    <button class="view-details" data-id="${log.id}">View</button>
                    <button class="delete-log" data-id="${log.id}">X</button>
                </div>
            `;
            worklogCards.appendChild(card);
        });

        document.querySelectorAll('.view-details').forEach(button => {
            button.addEventListener('click', event => {
                const id = event.target.getAttribute('data-id');
                const log = logs.find(log => log.id === id);
                showLogDetails(log);
            });
        });

        document.querySelectorAll('.delete-log').forEach(button => {
            button.addEventListener('click', async event => {
                if (confirm('정말 삭제하시겠습니까?')) {
                    const id = event.target.getAttribute('data-id');
                    try {
                        await axios.delete(`http://3.37.165.84:3001/logs/${id}`);
                        loadWorkLogs();
                    } catch (error) {
                        console.error('Error deleting work log:', error);
                    }
                }
            });
        });
    }

    function showLogDetails(log) {
        const modal = document.getElementById('logModal');
        const logDetails = document.getElementById('logDetails');
        logDetails.innerHTML = `
            <p><strong>Date:</strong> ${log.task_date}</p>
            <p><strong>Title:</strong> ${log.task_name}</p>
            <p><strong>Result:</strong> ${log.task_result}</p>
            <p><strong>Cause:</strong> ${log.task_cause}</p>
            <p><strong>Worker:</strong> ${log.task_man}</p>
            <p><strong>Action:</strong> ${log.task_description}</p>
            <p><strong>Start Time:</strong> ${log.start_time}</p>
            <p><strong>End Time:</strong> ${log.end_time}</p>
            <p><strong>Group:</strong> ${log.group}</p>
            <p><strong>Site:</strong> ${log.site}</p>
            <p><strong>Line:</strong> ${log.line}</p>
            <p><strong>Warranty:</strong> ${log.warranty}</p>
            <p><strong>SOP:</strong> ${log.SOP}</p>
            <p><strong>TS Guide:</strong> ${log.tsguide}</p>
            <p><strong>EQ Type:</strong> ${log.equipment_type}</p>
            <p><strong>EQ Name:</strong> ${log.equipment_name}</p>
            <p><strong>Work Type:</strong> ${log.work_type}</p>
            <p><strong>Setup Item:</strong> ${log.setup_item}</p>
            <p><strong>Maint Item:</strong> ${log.maint_item}</p>
            <p><strong>Status:</strong> ${log.status}</p>
        `;
        modal.style.display = 'block';
    }

    document.querySelector('.close').addEventListener('click', () => {
        document.getElementById('logModal').style.display = 'none';
    });

    window.onclick = event => {
        const modal = document.getElementById('logModal');
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };

    document.getElementById('searchButton').addEventListener('click', () => {
        const worker = document.getElementById('searchWorker').value.toLowerCase();
        const startDate = document.getElementById('searchStartDate').value;
        const endDate = document.getElementById('searchEndDate').value;
        const eqName = document.getElementById('searchEqName').value.toLowerCase();
        const group = document.getElementById('searchGroup').value.toLowerCase();
        const site = document.getElementById('searchSite').value.toLowerCase();

        const filteredLogs = logs.filter(log => {
            const matchesWorker = worker === '' || log.task_man.toLowerCase().includes(worker);
            const matchesStartDate = startDate === '' || new Date(log.task_date) >= new Date(startDate);
            const matchesEndDate = endDate === '' || new Date(log.task_date) <= new Date(endDate);
            const matchesEqName = eqName === '' || log.equipment_name.toLowerCase().includes(eqName);
            const matchesGroup = group === '' || log.group.toLowerCase().includes(group);
            const matchesSite = site === '' || log.site.toLowerCase().includes(site);
            return matchesWorker && matchesStartDate && matchesEndDate && matchesEqName && matchesGroup && matchesSite;
        });

        displayLogs(filteredLogs);
    });

    document.getElementById('resetButton').addEventListener('click', () => {
        document.getElementById('searchWorker').value = '';
        document.getElementById('searchStartDate').value = '';
        document.getElementById('searchEndDate').value = '';
        document.getElementById('searchEqName').value = '';
        document.getElementById('searchGroup').value = '';
        document.getElementById('searchSite').value = '';
        displayLogs(logs);
    });

    loadWorkLogs();
});
