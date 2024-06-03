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

    function formatDate(dateString) {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function displayLogs(logs) {
        const worklogCards = document.getElementById('worklog-cards');
        worklogCards.innerHTML = '';

        logs.forEach(log => {
            const card = document.createElement('div');
            card.className = 'worklog-card';
            card.dataset.id = log.id;
            card.innerHTML = `
                <p><strong>Date:</strong> ${formatDate(log.task_date)}</p>
                <p><strong>Title:</strong> ${log.task_name}</p>
                <p><strong>Worker:</strong> ${log.task_man}</p>
                <p><strong>EQ Name:</strong> ${log.equipment_name}</p>
                <p><strong>Group:</strong> ${log.group}</p>
                <p><strong>Site:</strong> ${log.site}</p>
                <div class="actions">
                    <button class="edit-log" data-id="${log.id}">Edit</button>
                    <button class="delete-log" data-id="${log.id}">X</button>
                </div>
            `;
            worklogCards.appendChild(card);
        });

        document.querySelectorAll('.edit-log').forEach(button => {
            button.addEventListener('click', event => {
                event.stopPropagation();
                const id = button.dataset.id;
                const log = logs.find(log => log.id == id);
                openEditModal(log);
            });
        });

        document.querySelectorAll('.delete-log').forEach(button => {
            button.addEventListener('click', async event => {
                event.stopPropagation();
                const id = button.dataset.id;
                if (confirm('정말 삭제하시겠습니까?')) {
                    await deleteLog(id);
                    loadWorkLogs();
                }
            });
        });
    }

    function showLogDetails(log) {
        const logModal = document.getElementById('logModal');
        const logDetails = document.getElementById('logDetails');
        logDetails.innerHTML = `
            <p><strong>Date :</strong> ${formatDate(log.task_date)}</p>
            <p><strong>Group :</strong> ${log.group}</p>
            <p><strong>Site :</strong> ${log.site}</p>
            <p><strong>Line :</strong> ${log.line}</p>
            <p><strong>Warranty :</strong> ${log.warranty}</p>
            <p><strong>EQ Type :</strong> ${log.equipment_type}</p>
            <p><strong>EQ Name :</strong> ${log.equipment_name}</p>
            <p><strong>Title :</strong> ${log.task_name}</p>
            <p><strong>Status :</strong> ${log.status}</p>
            <p><strong>Action :</strong> ${log.task_description}</p>
            <p><strong>Cause :</strong> ${log.task_cause}</p>
            <p><strong>Result :</strong> ${log.task_result}</p>
            <p><strong>Worker :</strong> ${log.task_man}</p>
            <p><strong>SOP :</strong> ${log.SOP}</p>
            <p><strong>TS Guide :</strong> ${log.tsguide}</p>
            <p><strong>Work Type :</strong> ${log.work_type}</p>
            <p><strong>Setup Item :</strong> ${log.setup_item}</p>
            <p><strong>Maint Item :</strong> ${log.maint_item}</p>
        `;
        logModal.style.display = 'block';
    }

    function openEditModal(log) {
        const editModal = document.getElementById('editModal');
        document.getElementById('editDate').value = formatDate(log.task_date);
        document.getElementById('editTaskName').value = log.task_name;
        document.getElementById('editWorker').value = log.task_man;
        document.getElementById('editEqName').value = log.equipment_name;
        document.getElementById('editGroup').value = log.group;
        document.getElementById('editSite').value = log.site;
        // Add more fields as necessary
        editModal.style.display = 'block';

        document.getElementById('editForm').onsubmit = async function (event) {
            event.preventDefault();
            const updatedLog = {
                id: log.id,
                task_date: document.getElementById('editDate').value,
                task_name: document.getElementById('editTaskName').value,
                task_man: document.getElementById('editWorker').value,
                equipment_name: document.getElementById('editEqName').value,
                group: document.getElementById('editGroup').value,
                site: document.getElementById('editSite').value,
                // Add more fields as necessary
            };
            await updateLog(updatedLog);
            editModal.style.display = 'none';
            loadWorkLogs();
        };
    }

    document.querySelector('.close').addEventListener('click', () => {
        document.getElementById('logModal').style.display = 'none';
    });

    document.querySelector('.close-edit').addEventListener('click', () => {
        document.getElementById('editModal').style.display = 'none';
    });

    window.onclick = event => {
        if (event.target == document.getElementById('logModal')) {
            document.getElementById('logModal').style.display = 'none';
        }
        if (event.target == document.getElementById('editModal')) {
            document.getElementById('editModal').style.display = 'none';
        }
    };

    async function deleteLog(id) {
        try {
            await axios.delete(`http://3.37.165.84:3001/logs/${id}`);
        } catch (error) {
            console.error('Error deleting log:', error);
        }
    }

    async function updateLog(log) {
        try {
            await axios.put(`http://3.37.165.84:3001/logs/${log.id}`, log);
        } catch (error) {
            console.error('Error updating log:', error);
        }
    }

    document.getElementById('searchButton').addEventListener('click', () => {
        const searchWorker = document.getElementById('searchWorker').value.toLowerCase();
        const searchStartDate = document.getElementById('searchStartDate').value;
        const searchEndDate = document.getElementById('searchEndDate').value;
        const searchEqName = document.getElementById('searchEqName').value.toLowerCase();
        const searchGroup = document.getElementById('searchGroup').value.toLowerCase();
        const searchSite = document.getElementById('searchSite').value.toLowerCase();

        const filteredLogs = logs.filter(log => {
            const logDate = formatDate(log.task_date);
            return (
                (searchWorker === '' || log.task_man.toLowerCase().includes(searchWorker)) &&
                (searchStartDate === '' || logDate >= searchStartDate) &&
                (searchEndDate === '' || logDate <= searchEndDate) &&
                (searchEqName === '' || log.equipment_name.toLowerCase().includes(searchEqName)) &&
                (searchGroup === '' || log.group.toLowerCase().includes(searchGroup)) &&
                (searchSite === '' || log.site.toLowerCase().includes(searchSite))
            );
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

    const signOutButton = document.querySelector("#sign-out");

    if (signOutButton) {
        signOutButton.addEventListener("click", function() {
            localStorage.removeItem("x-access-token"); // JWT 토큰 삭제
            alert("로그아웃 되었습니다.");
            window.location.replace("./signin.html"); // 로그인 페이지로 리디렉션
        });
    }
});
