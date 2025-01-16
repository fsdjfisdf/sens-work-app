document.addEventListener("DOMContentLoaded", async () => {
    const equipmentList = document.getElementById("equipment-list");
    const equipmentModal = document.getElementById("equipment-modal");
    const modalTitle = document.getElementById("modal-title");
    const modalBody = document.getElementById("modal-body");
    const closeModalBtn = document.getElementById("close-modal");
    const saveChangesBtn = document.getElementById("save-changes");
    const API_BASE_URL = "http://3.37.73.151:3001/api/setupeq";

    // 장비 목록 가져오기
    async function fetchEquipment() {
        try {
            const response = await axios.get(API_BASE_URL);
            const equipment = response.data;

            const sortedEquipment = equipment
                .map(e => {
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
                    const total = percentKeys.reduce((sum, key) => sum + (parseFloat(e[key]) || 0), 0);
                    const averageProgress = Math.round((total / percentKeys.length) * 100);
                    return { ...e, averageProgress };
                })
                .sort((a, b) => a.averageProgress - b.averageProgress);

            equipmentList.innerHTML = sortedEquipment
                .map(e => `
                    <li class="equipment-item" data-id="${e.id}">
                        <div class="equipment-info">
                            <h3>${e.EQNAME}</h3>
                            <div class="progress-bar">
                                <div class="progress" style="width: ${e.averageProgress}%"></div>
                            </div>
                            <span class="progress-percent">${e.averageProgress}%</span>
                        </div>
                    </li>
                `)
                .join("");

            if (sortedEquipment.length === 0) {
                document.getElementById("no-equipment").classList.remove("hidden");
            }
        } catch (error) {
            console.error("Error fetching equipment:", error);
        }
    }

    // 특정 설비 정보 가져오기
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
                    const percentage = Math.round((status[percentKey] || 0) * 100);
                    const company = status[companyKey] || "비어있음";

                    return `
                        <div class="status-item">
                            <div class="status-header">
                                <span>${label}</span>
                                <select class="company-select" data-key="${companyKey}">
                                    <option value="비어있음" ${company === "비어있음" ? "selected" : ""}>비어있음</option>
                                    <option value="SEnS" ${company === "SEnS" ? "selected" : ""}>SEnS</option>
                                    <option value="PSK" ${company === "PSK" ? "selected" : ""}>PSK</option>
                                    <option value="BP" ${company === "BP" ? "selected" : ""}>BP</option>
                                </select>
                            </div>
                            <div class="progress-bar">
                                <input type="number" class="percent-input" data-key="${percentKey}" value="${percentage}" min="0" max="100" />
                            </div>
                        </div>`;
                })
                .join("");

            equipmentModal.classList.add("open");
        } catch (error) {
            console.error("Error fetching equipment details:", error);
        }
    }

    // 저장 버튼 클릭 이벤트
    saveChangesBtn.addEventListener("click", async () => {
        const selects = document.querySelectorAll(".company-select");
        const inputs = document.querySelectorAll(".percent-input");
    
        const updates = Array.from(selects).map(select => ({
            key: select.dataset.key,
            value: select.value
        }));
    
        Array.from(inputs).forEach(input => {
            updates.push({
                key: input.dataset.key,
                value: parseFloat(input.value) / 100 // 백분율을 소수로 변환
            });
        });
    
        const equipmentId = modalTitle.dataset.id; // 모달에 ID 저장되어 있다고 가정
    
        try {
            const response = await axios.patch(`${API_BASE_URL}/${equipmentId}`, updates);
            if (response.status === 200) {
                alert("Changes saved successfully.");
                equipmentModal.classList.remove("open");
                await fetchEquipment(); // 업데이트된 데이터 반영
            } else {
                alert("Failed to save changes.");
            }
        } catch (error) {
            console.error("Error saving changes:", error);
            alert("Error saving changes.");
        }
    });

    // 모달 닫기
    closeModalBtn.addEventListener("click", () => {
        equipmentModal.classList.remove("open");
    });

    // 설비 리스트 클릭 이벤트
    equipmentList.addEventListener("click", (e) => {
        const item = e.target.closest(".equipment-item");
        if (item) {
            const equipmentId = item.getAttribute("data-id");
            fetchEquipmentDetails(equipmentId);
        }
    });

    await fetchEquipment();
});
