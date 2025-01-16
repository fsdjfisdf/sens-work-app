document.addEventListener("DOMContentLoaded", async () => {
    const equipmentList = document.getElementById("equipment-list");
    const statusSection = document.getElementById("status-section");
    const equipmentSection = document.getElementById("equipment-section");
    const equipmentName = document.getElementById("equipment-name");
    const statusList = document.getElementById("status-list");
    const backToListBtn = document.getElementById("back-to-list");

    const API_BASE_URL = "http://3.37.73.151:3001/api/setupeq";

    // 설비 목록 가져오기
    async function fetchEquipment() {
        try {
            const response = await axios.get(API_BASE_URL);
            const equipment = response.data;
            equipmentList.innerHTML = equipment
                .map(e => `<li class="equipment-item" data-id="${e.id}">${e.EQNAME}</li>`)
                .join("");
        } catch (error) {
            console.error("Error fetching equipment:", error);
        }
    }

    // 특정 설비 상태 가져오기
    async function fetchEquipmentStatus(id) {
        try {
            const response = await axios.get(`${API_BASE_URL}/${id}`);
            const status = response.data;

            equipmentName.textContent = status.EQNAME;
            const steps = [
                "INSTALLATION_PREPARATION_PERCENT",
                "FAB_IN_PERCENT",
                "DOCKING_PERCENT",
                "CABLE_HOOK_UP_PERCENT",
                "POWER_TURN_ON_PERCENT",
                "UTILITY_TURN_ON_PERCENT",
                "GAS_TURN_ON_PERCENT",
                "TEACHING_PERCENT",
                "PART_INSTALLATION_PERCENT",
                "LEAK_CHECK_PERCENT",
                "TTTM_PERCENT",
                "CUSTOMER_CERTIFICATION_PERCENT"
            ];
            statusList.innerHTML = steps
                .map(step => `
                    <li>
                        <span>${step.replace(/_/g, " ")}</span>
                        <span>${status[step]}%</span>
                    </li>`)
                .join("");

            equipmentSection.classList.add("hidden");
            statusSection.classList.remove("hidden");
        } catch (error) {
            console.error("Error fetching equipment status:", error);
        }
    }

    // 설비 목록 클릭 이벤트
    equipmentList.addEventListener("click", (e) => {
        const item = e.target.closest(".equipment-item");
        if (item) {
            const equipmentId = item.getAttribute("data-id");
            fetchEquipmentStatus(equipmentId);
        }
    });

    // 돌아가기 버튼 이벤트
    backToListBtn.addEventListener("click", () => {
        equipmentSection.classList.remove("hidden");
        statusSection.classList.add("hidden");
    });

    // 초기 데이터 로드
    await fetchEquipment();
});
