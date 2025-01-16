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

            // 평균값 계산 및 정렬
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

                    const sum = percentKeys.reduce((total, key) => total + (parseFloat(e[key]) || 0), 0);
                    const averageProgress = Math.round((sum / percentKeys.length) * 100);
                    return { ...e, averageProgress };
                })
                .sort((a, b) => a.averageProgress - b.averageProgress); // 낮은 값부터 정렬

            // HTML 업데이트
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
        } catch (error) {
            console.error("Error fetching equipment:", error);
        }
    }

    // 특정 설비 상세 상태 가져오기
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
                    const company = status[companyKey] || "";
    
                    return `
                        <div class="status-item">
                            <div class="status-header">
                                <span>${label}</span>
                                <input type="number" class="percent-input" data-key="${percentKey}" value="${percentage}" min="0" max="100">%
                                <select class="company-select" data-key="${companyKey}">
                                    <option value="BP" ${company === "BP" ? "selected" : ""}>BP</option>
                                    <option value="SEnS" ${company === "SEnS" ? "selected" : ""}>SEnS</option>
                                    <option value="PSK" ${company === "PSK" ? "selected" : ""}>PSK</option>
                                </select>
                            </div>
                        </div>`;
                })
                .join("");
    
            modalBody.insertAdjacentHTML(
                "beforeend",
                `<button id="save-status" class="save-btn">Save</button>`
            );
    
            document.getElementById("save-status").addEventListener("click", () => saveEquipmentDetails(id));
    
            equipmentModal.classList.add("open");
        } catch (error) {
            console.error("Error fetching equipment details:", error);
        }
    }
    
    // 설비 상태 업데이트
    async function saveEquipmentDetails(id) {
        const inputs = document.querySelectorAll(".percent-input");
        const selects = document.querySelectorAll(".company-select");
    
        const updates = {};
    
        inputs.forEach(input => {
            const key = input.dataset.key;
            updates[key] = parseFloat(input.value) / 100; // 0~1 범위로 변환
        });
    
        selects.forEach(select => {
            const key = select.dataset.key;
            updates[key] = select.value;
        });
    
        try {
            const response = await axios.put(`${API_BASE_URL}/${id}`, updates);
            alert(response.data.message);
            equipmentModal.classList.remove("open");
            fetchEquipment(); // 리스트 재로드
        } catch (error) {
            console.error("Error saving equipment details:", error);
            alert("Failed to save changes.");
        }
    }

    // 설비 리스트 클릭 이벤트
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
