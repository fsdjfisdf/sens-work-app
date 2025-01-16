document.addEventListener("DOMContentLoaded", async () => {
    const equipmentList = document.getElementById("equipment-list");
    const equipmentModal = document.getElementById("equipment-modal");
    const modalTitle = document.getElementById("modal-title");
    const modalBody = document.getElementById("modal-body");
    const closeModalBtn = document.getElementById("close-modal");
    const API_BASE_URL = "http://3.37.73.151:3001/api/setupeq";

    // 설비 목록 가져오기
    async function fetchEquipment() {
        try {
            const response = await axios.get(API_BASE_URL);
            const equipment = response.data;

            equipmentList.innerHTML = equipment
                .map(e => {
                    // 평균값 계산
                    const percentKeys = [
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

                    const sum = percentKeys.reduce((total, key) => {
                        const value = parseFloat(e[key]) || 0;
                        console.log(`[${e.EQNAME}] ${key}: ${value}`); // 작업별 퍼센트 값 출력
                        return total + value;
                    }, 0);

                    const averageProgress = Math.round((sum / percentKeys.length) * 100);
                    console.log(`[${e.EQNAME}] Average Progress: ${averageProgress}%`); // 평균값 출력

                    return `
                        <li class="equipment-item" data-id="${e.id}">
                            <div class="equipment-header">
                                <h3>${e.EQNAME}</h3>
                            </div>
                            <div class="equipment-progress">
                                <div class="progress-bar">
                                    <div class="progress" style="width: ${averageProgress}%"></div>
                                </div>
                                <span class="progress-percent">${averageProgress}%</span>
                            </div>
                        </li>`;
                })
                .join("");
        } catch (error) {
            console.error("Error fetching equipment:", error);
        }
    }

    // 설비 상세 상태 가져오기
    async function fetchEquipmentDetails(id) {
        try {
            const response = await axios.get(`${API_BASE_URL}/${id}`);
            const status = response.data;

            modalTitle.textContent = status.EQNAME;

            const steps = [
                { key: "INSTALLATION_PREPARATION", label: "Installation Preparation" },
                { key: "FAB_IN", label: "Fab In" },
                { key: "DOCKING", label: "Docking" },
                { key: "CABLE_HOOK_UP", label: "Cable Hook Up" },
                { key: "POWER_TURN_ON", label: "Power Turn On" },
                { key: "UTILITY_TURN_ON", label: "Utility Turn On" },
                { key: "GAS_TURN_ON", label: "Gas Turn On" },
                { key: "TEACHING", label: "Teaching" },
                { key: "PART_INSTALLATION", label: "Part Installation" },
                { key: "LEAK_CHECK", label: "Leak Check" },
                { key: "TTTM", label: "TTTM" },
                { key: "CUSTOMER_CERTIFICATION", label: "Customer Certification" }
            ];

            modalBody.innerHTML = steps
                .map(({ key, label }) => {
                    const percentKey = `${key}_PERCENT`;
                    const companyKey = `${key}_COMPANY`;
                    const percentage = Math.round(status[percentKey] * 100);
                    const company = status[companyKey] || "N/A";

                    console.log(`[${status.EQNAME}] ${label} - Company: ${company}, Percent: ${percentage}%`); // 디버깅 출력

                    return `
                        <div class="status-item">
                            <div class="status-header">
                                <span>${label}</span>
                                <span>${company}</span>
                            </div>
                            <div class="progress-bar">
                                <div class="progress" style="width: ${percentage}%"></div>
                            </div>
                            <span class="progress-percent">${percentage}%</span>
                        </div>`;
                })
                .join("");

            equipmentModal.classList.add("open");
        } catch (error) {
            console.error("Error fetching equipment details:", error);
        }
    }

    // 설비 목록 클릭 이벤트
    equipmentList.addEventListener("click", (e) => {
        const item = e.target.closest(".equipment-item");
        if (item) {
            const equipmentId = item.getAttribute("data-id");
            fetchEquipmentDetails(equipmentId);
        }
    });

    // 모달 닫기 이벤트
    closeModalBtn.addEventListener("click", () => {
        equipmentModal.classList.remove("open");
    });

    // 초기 데이터 로드
    await fetchEquipment();
});
