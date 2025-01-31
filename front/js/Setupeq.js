document.addEventListener("DOMContentLoaded", async () => {
    const equipmentMatrix = document.getElementById("equipment-matrix"); // 매트릭스 컨테이너
    const equipmentModal = document.getElementById("equipment-modal");
    const modalTitle = document.getElementById("modal-title");
    const modalBody = document.getElementById("modal-body");
    const closeModalBtn = document.getElementById("close-modal");
    const saveChangesBtn = document.getElementById("save-changes");
    const API_BASE_URL = "http://3.37.73.151:3001/api/setupeq";
    

    function getPolygonPoints(cx, cy, radius, sides) {
        const points = [];
        for (let i = 0; i < sides; i++) {
            const angle = (Math.PI * 2 * i) / sides - Math.PI / 2;
            const x = cx + radius * Math.cos(angle);
            const y = cy + radius * Math.sin(angle);
            points.push({ x, y });
        }
        return points;
    }
    
    function createSectionPolygon(cx, cy, radius, progress, index) {
        const allPoints = getPolygonPoints(cx, cy, radius, 5);
        const p1 = allPoints[index];
        const p2 = allPoints[(index + 1) % 5];
    
        const p1Progress = {
            x: cx + progress[index] * (p1.x - cx),
            y: cy + progress[index] * (p1.y - cy),
        };
        const p2Progress = {
            x: cx + progress[index] * (p2.x - cx),
            y: cy + progress[index] * (p2.y - cy),
        };
    
        return `${cx},${cy} ${p1Progress.x},${p1Progress.y} ${p2Progress.x},${p2Progress.y}`;
    }
    
    async function fetchEquipment() {
        try {
            const response = await axios.get("http://3.37.73.151:3001/api/setupeq");
            let equipment = response.data;
    
            // 📌 먼저 averageProgress 계산
            const processedEquipment = equipment.map(e => {
                const sections = [
                    {
                        name: "Install",
                        progress: (e.INSTALLATION_PREPARATION_PERCENT +
                            e.FAB_IN_PERCENT +
                            e.DOCKING_PERCENT +
                            e.CABLE_HOOK_UP_PERCENT) / 4,
                        details: [
                            `Installation Preparation: ${Math.round(e.INSTALLATION_PREPARATION_PERCENT * 100)}%`,
                            `Fab In: ${Math.round(e.FAB_IN_PERCENT * 100)}%`,
                            `Docking: ${Math.round(e.DOCKING_PERCENT * 100)}%`,
                            `Cable Hook Up: ${Math.round(e.CABLE_HOOK_UP_PERCENT * 100)}%`,
                        ],
                    },
                    {
                        name: "Turn On",
                        progress: (e.POWER_TURN_ON_PERCENT +
                            e.UTILITY_TURN_ON_PERCENT +
                            e.GAS_TURN_ON_PERCENT) / 3,
                        details: [
                            `Power Turn On: ${Math.round(e.POWER_TURN_ON_PERCENT * 100)}%`,
                            `Utility Turn On: ${Math.round(e.UTILITY_TURN_ON_PERCENT * 100)}%`,
                            `Gas Turn On: ${Math.round(e.GAS_TURN_ON_PERCENT * 100)}%`,
                        ],
                    },
                    {
                        name: "Tuning",
                        progress: e.TEACHING_PERCENT,
                        details: [`Teaching: ${Math.round(e.TEACHING_PERCENT * 100)}%`],
                    },
                    {
                        name: "TTTM",
                        progress: (e.PART_INSTALLATION_PERCENT +
                            e.LEAK_CHECK_PERCENT +
                            e.TTTM_PERCENT) / 3,
                        details: [
                            `Part Installation: ${Math.round(e.PART_INSTALLATION_PERCENT * 100)}%`,
                            `Leak Check: ${Math.round(e.LEAK_CHECK_PERCENT * 100)}%`,
                            `TTTM: ${Math.round(e.TTTM_PERCENT * 100)}%`,
                        ],
                    },
                    {
                        name: "Customer Certification",
                        progress: e.CUSTOMER_CERTIFICATION_PERCENT,
                        details: [`Customer Certification: ${Math.round(e.CUSTOMER_CERTIFICATION_PERCENT * 100)}%`],
                    },
                ];
    
            // 📌 진행률 평균 계산
            const averageProgress = Math.round(
                (sections.reduce((sum, section) => sum + section.progress, 0) / 5) * 100
            );

            return { ...e, sections, averageProgress };
        });

                // 📌 필터 값 가져오기
                const selectedGroup = document.getElementById("group-select").value;
                const selectedSite = document.getElementById("site-select").value;
                const selectedLine = document.getElementById("line-select").value;
                const selectedComplete = document.getElementById("complete-select").value; // "ing" 또는 "complete"
                const eqNameSearch = document.getElementById("eqname-input").value.toLowerCase();
        
                // 📌 필터링 수행 (averageProgress가 계산된 후 적용)
                const filteredEquipment = processedEquipment.filter(e =>
                    (selectedGroup === "" || e.GROUP === selectedGroup) &&
                    (selectedSite === "" || e.SITE === selectedSite) &&
                    (selectedLine === "" || e.LINE === selectedLine) &&
                    (selectedComplete === "" ||
                        (selectedComplete === "complete" && e.averageProgress === 100) || 
                        (selectedComplete === "ing" && e.averageProgress < 100)
                    ) &&
                    (eqNameSearch === "" || e.EQNAME.toLowerCase().includes(eqNameSearch))
                );
        
                // 📌 진행률 순으로 정렬
                const sortedEquipment = filteredEquipment.sort((a, b) => b.averageProgress - a.averageProgress);
        
            

            
    
            const equipmentMatrix = document.getElementById("equipment-matrix");
            equipmentMatrix.innerHTML = sortedEquipment
                .map(e => {
                    const cx = 100,
                        cy = 100,
                        radius = 90;
                        const colors = [
                            "#1700C0", // Dark Blue for Install
                            "#2D00C3", // Slightly lighter Blue for Turn On
                            "#4200C6", // Light Blue for Tuning
                            "#6100CA", // Purple for TTTM
                            "#9500D0", // Light Purple for Customer Certification
                        ];
                        
                        
    
                    const polygons = e.sections
                        .map((section, i) => {
                            const points = createSectionPolygon(cx, cy, radius, e.sections.map(s => s.progress), i);
                            return `
                                <polygon
                                    class="section"
                                    points="${points}"
                                    fill="${colors[i]}"
                                    data-info="${section.name}: ${Math.round(section.progress * 100)}%"
                                    data-details="${section.details.join(", ")}"
                                ></polygon>
                            `;
                        })
                        .join("");
    
                    return `
                        <div class="equipment-box" data-id="${e.id}">
                            <svg viewBox="0 0 200 200" class="polygon-chart">
                                <!-- 중심에서 꼭지점으로의 점선 -->
                                ${getPolygonPoints(cx, cy, radius, 5)
                                    .map(
                                        p => `<line x1="${cx}" y1="${cy}" x2="${p.x}" y2="${p.y}" class="divider"></line>`
                                    )
                                    .join("")}
                                <!-- 전체 오각형 경계 -->
                                <polygon class="base" points="${getPolygonPoints(cx, cy, radius, 5)
                                    .map(p => `${p.x},${p.y}`)
                                    .join(" ")}"></polygon>
                                <!-- 진행된 영역 -->
                                ${polygons}
                            </svg>
                            <div class="equipment-info">
                                <div class="equipment-name">${e.EQNAME}</div>
                                <div class="equipment-percent">${e.averageProgress}%</div>
                            </div>
                        </div>
                    `;
                })
                .join("");

            // 📌 검색 버튼 이벤트 추가
            document.getElementById("search-btn").addEventListener("click", fetchEquipment);

            // 📌 초기화 버튼 이벤트 추가
            document.getElementById("reset-btn").addEventListener("click", () => {
                document.getElementById("group-select").value = "";
                document.getElementById("site-select").value = "";
                document.getElementById("line-select").value = "";
                document.getElementById("complete-select").value = "";
                document.getElementById("eqname-input").value = "";
                fetchEquipment();
            });
    
            // 호버 이벤트 추가
            document.querySelectorAll(".section").forEach(section => {
                section.addEventListener("mouseenter", function (event) {
                    const info = this.getAttribute("data-info");
                    const detailsArray = this.getAttribute("data-details").split(", ");
                    
                    // 각 하위 항목의 상태를 계산
                    const formattedDetails = detailsArray.map(detail => {
                        const [name, percentage] = detail.split(": ");
                        const numericPercentage = parseFloat(percentage.replace("%", ""));
                        
                        let status;
                        if (numericPercentage === 100) {
                            status = "작업 완료";
                        } else if (numericPercentage > 0 && numericPercentage < 100) {
                            status = "작업 중";
                        } else {
                            status = "미작업";
                        }
                        
                        return `${name}: ${status}`;
                    }).join("<br>");
            
                    // 툴팁 생성
                    const tooltip = document.createElement("div");
                    tooltip.classList.add("polygon-tooltip");
                    tooltip.innerHTML = `<strong class="tooltip-highlight">${info}</strong><br>${formattedDetails}`;
                    document.body.appendChild(tooltip);
            
                    // 툴팁 위치 계산
                    const rect = event.target.getBoundingClientRect();
                    const tooltipWidth = tooltip.offsetWidth;
                    const tooltipHeight = tooltip.offsetHeight;
            
                    tooltip.style.top = `${rect.top + window.scrollY - tooltipHeight - 15}px`;
                    tooltip.style.left = `${rect.left + window.scrollX + rect.width / 2 - tooltipWidth / 2}px`;
                });
            
                section.addEventListener("mouseleave", function () {
                    const tooltip = document.querySelector(".polygon-tooltip");
                    if (tooltip) tooltip.remove();
                });
            });
        } catch (error) {
            console.error("Error fetching equipment:", error);
        }
    }
    
    document.addEventListener("DOMContentLoaded", fetchEquipment);
    
    
    
    
    
    

    // 특정 설비 정보 가져오기
    async function fetchEquipmentDetails(id) {
        try {
            const response = await axios.get(`${API_BASE_URL}/${id}`);
            const status = response.data;

            modalTitle.textContent = status.EQNAME;
            modalTitle.dataset.id = id; // ID 저장

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
                const statusValue = status[percentKey] || 0; // 작업 상태 값
                const company = status[companyKey] || "비어있음";
        
                // 작업 상태에 따른 클래스
                let statusClass = "not-started"; // 기본: 미작업
                if (statusValue > 0 && statusValue < 1) {
                    statusClass = "in-progress"; // 작업 중
                } else if (statusValue === 1) {
                    statusClass = "completed"; // 작업 완료
                }
        
                return `
                    <div class="status-item ${statusClass}">
                        <span class="status-label">${label}</span>
                        <div class="status-actions">
                            <select class="company-select" data-key="${companyKey}">
                                <option value="비어있음" ${company === "비어있음" ? "selected" : ""}>비어있음</option>
                                <option value="SEnS" ${company === "SEnS" ? "selected" : ""}>SEnS</option>
                                <option value="PSK" ${company === "PSK" ? "selected" : ""}>PSK</option>
                                <option value="BP" ${company === "BP" ? "selected" : ""}>BP</option>
                            </select>
                            <select class="status-select" data-key="${percentKey}">
                                <option value="0" ${statusValue === 0 ? "selected" : ""}>미작업</option>
                                <option value="0.5" ${statusValue === 0.5 ? "selected" : ""}>작업중</option>
                                <option value="1" ${statusValue === 1 ? "selected" : ""}>작업완료</option>
                            </select>
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
        const selects = document.querySelectorAll(".company-select, .status-select");
        const updates = {};
        selects.forEach(select => {
            updates[select.dataset.key] = parseFloat(select.value) || select.value; // 값 변환
        });

        const equipmentId = modalTitle.dataset.id; // 모달에 저장된 ID 가져오기

        if (!equipmentId) {
            alert("Equipment ID is missing.");
            return;
        }

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
    equipmentMatrix.addEventListener("click", (e) => {
        const box = e.target.closest(".equipment-box");
        if (box) {
            const equipmentId = box.getAttribute("data-id");
            fetchEquipmentDetails(equipmentId); // 설비 상세 정보 가져오기 함수 호출
        }
    });

    await fetchEquipment();
});
