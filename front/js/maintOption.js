document.addEventListener('DOMContentLoaded', function() {
    // Initialize Select2 for maintOptionSelect
    $('#maintOptionSelect').select2();

    const workTypeSelect = document.getElementById('workType');
    const equipmentTypeSelect = document.getElementById('equipment_type');
    const maintOptionContainer = document.getElementById('maintOption');
    const maintOptionSelect = document.getElementById('maintOptionSelect');

    const maintOptions = {
        "SUPRA N": ["SELECT", "EFEM ROBOT REP", "TM ROBOT REP"],
        "SUPRA XP": ["SELECT"],
        "INTEGER": ["SELECT", "SWAP KIT", "SLIT DOOR"],
        "PRECIA": ["SELECT"],
        "ECOLITE": ["SELECT"],
        "JENEVA": ["SELECT"]
    };

    function updateMaintOptions() {
        if (workTypeSelect.value === 'MAINT') {
            maintOptionContainer.style.display = 'block';
            const options = maintOptions[equipmentTypeSelect.value] || ["SELECT"];
            maintOptionSelect.innerHTML = ""; // 기존 옵션 초기화
            options.forEach(option => {
                const opt = document.createElement('option');
                opt.value = option;
                opt.innerHTML = option;
                maintOptionSelect.appendChild(opt);
            });
            $('#maintOptionSelect').select2(); // re-initialize Select2 with new options
        } else {
            maintOptionContainer.style.display = 'none';
        }
    }

    workTypeSelect.addEventListener('change', updateMaintOptions);
    equipmentTypeSelect.addEventListener('change', updateMaintOptions);
});
