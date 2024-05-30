document.addEventListener('DOMContentLoaded', function() {
    const workTypeSelect = document.getElementById('workType');
    const equipmentTypeSelect = document.getElementById('equipment_type');
    const maintOptionContainer = document.getElementById('maintOption');
    const maintOptionSelect = $('#maintOptionSelect');

    const maintOptions = {
        "SUPRA N": ["SELECT", "EFEM ROBOT REP", "TM ROBOT REP", "SLIT DOOR", "FCIP"],
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
            maintOptionSelect.empty(); // 기존 옵션 초기화
            options.forEach(option => {
                const opt = new Option(option, option);
                maintOptionSelect.append(opt);
            });
            maintOptionSelect.trigger('change'); // Select2 업데이트
        } else {
            maintOptionContainer.style.display = 'none';
            maintOptionSelect.empty(); // 기존 옵션 초기화
            maintOptionSelect.append(new Option('SELECT', 'SELECT'));
            maintOptionSelect.trigger('change'); // Select2 업데이트
        }
    }

    $(document).ready(function() {
        // Select2 초기화
        maintOptionSelect.select2({
            width: '100%',
            placeholder: 'Select an option',
            allowClear: true
        });

        workTypeSelect.addEventListener('change', updateMaintOptions);
        equipmentTypeSelect.addEventListener('change', updateMaintOptions);
    });
});
