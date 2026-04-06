document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem('x-access-token');

    if (!token) {
        alert('로그인이 필요합니다.');
        window.location.replace('./signin.html');
        return;
    }
    const equipmentMatrix = document.getElementById("equipment-matrix"); // 매트릭스 컨테이너
    const equipmentModal = document.getElementById("equipment-modal");
    const modalTitle = document.getElementById("modal-title");
    const modalBody = document.getElementById("modal-body");
    const closeModalBtn = document.getElementById("close-modal");
    const saveChangesBtn = document.getElementById("save-changes");
    const API_BASE_URL = "http://13.125.122.202:3001/api/setupeq";

    // 📌 탭 요소 가져오기
    const editTab = document.getElementById("edit-tab");
    const analysisTab = document.getElementById("analysis-tab");
    const editSection = document.getElementById("edit-section");
    const analysisSection = document.getElementById("analysis-section");
    


    // 📌 탭 전환 이벤트
    editTab.addEventListener("click", () => {
        editTab.classList.add("active");
        analysisTab.classList.remove("active");
        editSection.classList.remove("hidden");
        analysisSection.classList.add("hidden");
    });

    analysisTab.addEventListener("click", () => {
        analysisTab.classList.add("active");
        editTab.classList.remove("active");
        analysisSection.classList.remove("hidden");
        editSection.classList.add("hidden");

        // 📌 분석 데이터 생성
        generateAnalysisData();
    });

        // 📌 기존 차트 인스턴스를 추적하는 객체
    const chartInstances = {};

    // 📌 Chart.js 그래프 생성 전에 기존 차트 제거 함수
    function destroyExistingChart(chartKey) {
        if (chartInstances[chartKey]) {
            chartInstances[chartKey].destroy();
            chartInstances[chartKey] = null;
        }
    }


    async function generateAnalysisData() {
        destroyExistingChart("avgTaskDelayChart");
        destroyExistingChart("companyChart");
        const avgTaskDelayChartCanvas = document.getElementById("avg-task-delay-chart").getContext("2d");
        const companyChartCanvas = document.getElementById("company-distribution-chart").getContext("2d");
    
        try {
            const response = await axios.get("http://13.125.122.202:3001/api/setupeq");
            let equipmentData = response.data;
    
            // 📌 필터 값 가져오기
            const selectedGroup = document.getElementById("group-select").value;
            const selectedSite = document.getElementById("site-select").value;
            const selectedLine = document.getElementById("line-select").value;
            const selectedComplete = document.getElementById("complete-select").value;
            const eqNameSearch = document.getElementById("eqname-input").value.toLowerCase();
            const startDate = document.getElementById("start-date").value;
            const endDate = document.getElementById("end-date").value;
            const selectedType = document.getElementById("eqtype-select").value;
    
            // 📌 진행률 계산을 위한 averageProgress 계산
            equipmentData = equipmentData.map(e => {
                const sections = [
                    (e.INSTALLATION_PREPARATION_PERCENT + e.FAB_IN_PERCENT + e.DOCKING_PERCENT + e.CABLE_HOOK_UP_PERCENT) / 4,
                    (e.POWER_TURN_ON_PERCENT + e.UTILITY_TURN_ON_PERCENT + e.GAS_TURN_ON_PERCENT) / 3,
                    e.TEACHING_PERCENT,
                    (e.PART_INSTALLATION_PERCENT + e.LEAK_CHECK_PERCENT + e.TTTM_PERCENT) / 3,
                    e.CUSTOMER_CERTIFICATION_PERCENT
                ];
                const averageProgress = Math.round(sections.reduce((a, b) => a + b, 0) / 5 * 100);
                return { ...e, averageProgress };
            });
    
            // 📌 필터링
            equipmentData = equipmentData.filter(e =>
                (selectedGroup === "" || e.GROUP === selectedGroup) &&
                (selectedSite === "" || e.SITE === selectedSite) &&
                (selectedLine === "" || e.LINE === selectedLine) &&
                (selectedType === "SELECT" || e.TYPE === selectedType) &&
                (selectedComplete === "" || 
                    (selectedComplete === "complete" && e.averageProgress === 100) ||
                    (selectedComplete === "ing" && e.averageProgress < 100)
                ) &&
                (eqNameSearch === "" || e.EQNAME.toLowerCase().includes(eqNameSearch)) &&
                (startDate === "" || endDate === "" || (
                    e.FAB_IN_DATE && new Date(e.FAB_IN_DATE) >= new Date(startDate) && new Date(e.FAB_IN_DATE) <= new Date(endDate)
                ))
            );
    
            // 📊 차트 생성용 데이터
            const taskCompanyCount = {};
            const taskDelay = {};
            const tasks = [
                "INSTALLATION_PREPARATION", "DOCKING", "CABLE_HOOK_UP",
                "POWER_TURN_ON", "UTILITY_TURN_ON", "GAS_TURN_ON", "TEACHING",
                "PART_INSTALLATION", "LEAK_CHECK", "TTTM", "CUSTOMER_CERTIFICATION"
            ];
    
            equipmentData.forEach(equip => {
                tasks.forEach(task => {
                    const companyKey = `${task}_COMPANY`;
                    const dateKey = `${task}_DATE`;
            
                    if (equip[companyKey] && equip[companyKey] !== "비어있음") {
                        if (!taskCompanyCount[task]) taskCompanyCount[task] = {};
                        taskCompanyCount[task][equip[companyKey]] = (taskCompanyCount[task][equip[companyKey]] || 0) + 1;
                    }
            
                    if (equip.FAB_IN_DATE && equip[dateKey]) {
                        const fabInDate = new Date(equip.FAB_IN_DATE);
                        const taskDate = new Date(equip[dateKey]);
                        const daysDiff = Math.floor((taskDate - fabInDate) / (1000 * 60 * 60 * 24));
            
                        if (!taskDelay[task]) taskDelay[task] = [];
                        taskDelay[task].push(daysDiff);
                    }
                });
            });
    
            destroyExistingChart("avgTaskDelayChart");
            destroyExistingChart("companyChart");
    
            const avgTaskDelays = Object.keys(taskDelay).map(task => {
                const values = taskDelay[task];
                return values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
            });
    
            chartInstances["avgTaskDelayChart"] = new Chart(avgTaskDelayChartCanvas, {
                type: "bar",
                data: {
                    labels: Object.keys(taskDelay).map(label => label.replace(/_/g, " ")),
                    datasets: [{
                        label: "평균 진행 소요일",
                        data: avgTaskDelays,
                        backgroundColor: "rgba(75, 192, 192, 0.6)"
                    }]
                },
                options: { responsive: true }
            });
    
            const taskLabels = Object.keys(taskCompanyCount);
            const companyNames = [...new Set(Object.values(taskCompanyCount).flatMap(company => Object.keys(company)))];
    
            const companyData = companyNames.map(company => {
                return {
                    label: company,
                    data: taskLabels.map(task => taskCompanyCount[task][company] || 0),
                    backgroundColor: `rgba(${Math.random()*255}, ${Math.random()*255}, ${Math.random()*255}, 0.6)`
                };
            });
    
            chartInstances["companyChart"] = new Chart(companyChartCanvas, {
                type: "bar",
                data: { labels: taskLabels, datasets: companyData },
                options: { responsive: true }
            });
    
        } catch (error) {
            console.error("Error generating analysis data:", error);
        }
    }
    
    
    

    // 📌 ANALYSIS SECTION 탭 클릭 시 데이터 로딩
    analysisTab.addEventListener("click", () => {
        generateAnalysisData();
    });
    

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
            const response = await axios.get("http://13.125.122.202:3001/api/setupeq");
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
                const startDate = document.getElementById("start-date").value; // 시작 날짜
                const endDate = document.getElementById("end-date").value; // 종료 날짜
                const selectedType = document.getElementById("eqtype-select").value; // <-- 추가된 부분
        
                // 📌 필터링 수행 (averageProgress가 계산된 후 적용)
                equipment = processedEquipment.filter(e => 
                    (selectedGroup === "" || e.GROUP === selectedGroup) &&
                    (selectedSite === "" || e.SITE === selectedSite) &&
                    (selectedLine === "" || e.LINE === selectedLine) &&
                    (selectedComplete === "" || 
                        (selectedComplete === "complete" && e.averageProgress === 100) || 
                        (selectedComplete === "ing" && e.averageProgress < 100)
                    ) &&
                    (selectedType === "SELECT" || e.TYPE === selectedType) && // <-- 추가된 조건
                    (eqNameSearch === "" || e.EQNAME.toLowerCase().includes(eqNameSearch)) &&
                    (startDate === "" || endDate === "" || 
                        (e.FAB_IN_DATE && new Date(e.FAB_IN_DATE) >= new Date(startDate) && new Date(e.FAB_IN_DATE) <= new Date(endDate))
                    ) // 📌 날짜 필터 추가
                );
        
                // 📌 진행률 순으로 정렬
                const sortedEquipment = equipment.sort((a, b) => b.averageProgress - a.averageProgress);
        
            

            
    
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
            document.getElementById("search-btn").addEventListener("click", () => {
                fetchEquipment();          // 설비 목록 새로고침
                generateAnalysisData();    // 📌 분석 차트도 새로고침
            });
            

            // 📌 초기화 버튼 이벤트 추가
            document.getElementById("reset-btn").addEventListener("click", () => {
                document.getElementById("group-select").value = "";
                document.getElementById("site-select").value = "";
                document.getElementById("line-select").value = "";
                document.getElementById("complete-select").value = "";
                document.getElementById("eqname-input").value = "";
                document.getElementById("start-date").value = "";
                document.getElementById("end-date").value = "";
                document.getElementById("eqtype-select").value = "SELECT"; // <-- 추가
                fetchEquipment();
                generateAnalysisData(); // 📌 reset 시에도 차트 초기화
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
            modalTitle.dataset.id = id;
    
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
                    const dateKey = `${key}_DATE`; // 날짜 필드 추가
    
                    const statusValue = status[percentKey] || 0;
                    const company = status[companyKey] || "비어있음";
                    const dateValue = status[dateKey] ? status[dateKey].split("T")[0] : ""; // 날짜 값 처리
    
                    let statusClass = "not-started";
                    if (statusValue > 0 && statusValue < 1) {
                        statusClass = "in-progress";
                    } else if (statusValue === 1) {
                        statusClass = "completed";
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
                                <input type="date" class="date-input" data-key="${dateKey}" value="${dateValue}">
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
        const selects = document.querySelectorAll(".company-select, .status-select, .date-input");
        const updates = {};
    
        selects.forEach(select => {
            if (select.type === "date") {
                updates[select.dataset.key] = select.value ? select.value : null; // 빈 값이면 NULL
            } else {
                updates[select.dataset.key] = parseFloat(select.value) || select.value;
            }
        });
    
        const equipmentId = modalTitle.dataset.id;
    
        if (!equipmentId) {
            alert("Equipment ID is missing.");
            return;
        }
    
        try {
            const response = await axios.patch(`${API_BASE_URL}/${equipmentId}`, updates);
            if (response.status === 200) {
                alert("Changes saved successfully.");
                equipmentModal.classList.remove("open");
                await fetchEquipment();
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

document.addEventListener("DOMContentLoaded", () => {
    const API_BASE_URL = "http://13.125.122.202:3001/api/setup_equipment";

    // 📌 모달 관련 요소 가져오기
    const addEquipmentModal = document.getElementById("equipment-add-modal");
    const addEquipmentBtn = document.getElementById("add-equipment-modal-btn");
    const confirmAddBtn = document.getElementById("confirm-equipment-add");
    const cancelAddBtn = document.getElementById("cancel-equipment-add");
    const closeAddModalBtn = document.getElementById("equipment-add-close");

    const groupSelect = document.getElementById("new_group");
    const siteSelect = document.getElementById("new_site");
    const lineSelect = document.getElementById("new_line");
    const eqTypeSelect = document.getElementById("new_type");

    if (!addEquipmentBtn || !addEquipmentModal) {
        console.error("❌ 모달 또는 버튼 요소를 찾을 수 없습니다. HTML을 확인해주세요.");
        return;
    }

    console.log("📌 addEquipmentBtn 찾음:", addEquipmentBtn);
    console.log("📌 addEquipmentModal 찾음:", addEquipmentModal);

    // 📌 GROUP 옵션 추가
    const groupOptions = ["PEE1", "PEE2", "PSKH"];
    groupSelect.innerHTML = `<option value="">SELECT</option>` + 
        groupOptions.map(group => `<option value="${group}">${group}</option>`).join("");

    // 📌 SITE 옵션 추가
    const siteOptions = [
        "PT", "HS", "IC", "CJ", "PSKH", "USA-Portland", "USA-Arizona", "Ireland",
        "Japan-Hiroshima", "China-Wuxi", "China-Xian", "China-Shanghai", 
        "China-Beijing", "Taiwan-Taichoung", "Singapore"
    ];
    siteSelect.innerHTML = `<option value="">SELECT</option>` + 
        siteOptions.map(site => `<option value="${site}">${site}</option>`).join("");

    // 📌 LINE 옵션 맵
    const lineOptions = {
        "PT": ["P1F", "P1D", "P2F", "P2D", "P2-S5", "P3F", "P3D", "P3-S5", "P4F", "P4D", "P4-S5"],
        "HS": ["12L", "13L", "15L", "16L", "17L", "S1", "S3", "S4", "S3V", "NRD", "NRDK", "NRD-V", "U4", "M1", "5L"],
        "IC": ["M10", "M14", "M16", "R3"],
        "CJ": ["M11", "M12", "M15"],
        "PSKH": ["PSKH", "C1", "C2", "C3", "C5"],
        "USA-Portland": ["INTEL"],
        "USA-Arizona": ["INTEL"],
        "Ireland": ["INTEL"],
        "Japan-Hiroshima": ["MICRON"],
        "China-Wuxi": ["HYNIX"],
        "China-Xian": ["HYNIX", "SAMSUNG"],
        "China-Shanghai": ["GTX"],
        "China-Beijing": ["JIDIAN"],
        "Taiwan-Taichoung": ["MICRON"],
        "Singapore": ["MICRON"]
    };

    // 📌 SITE 선택 시, LINE 옵션 업데이트
    siteSelect.addEventListener("change", () => {
        const selectedSite = siteSelect.value;
        lineSelect.innerHTML = `<option value="">SELECT</option>`;
        if (lineOptions[selectedSite]) {
            lineOptions[selectedSite].forEach(line => {
                const option = document.createElement("option");
                option.value = line;
                option.textContent = line;
                lineSelect.appendChild(option);
            });
        }
    });

    // 📌 EQ TYPE 옵션 추가
    const eqTypes = [
        "SELECT", "SUPRA N", "SUPRA NM", "SUPRA III", "SUPRA IV", "SUPRA V", 
        "SUPRA Vplus", "SUPRA VM", "SUPRA XP", "SUPRA Q", "TERA21",
        "INTEGER IVr", "INTEGER Plus", "INTEGER XP", "PRECIA",
        "ECOLITE 300", "ECOLITE 400", "ECOLITE 3000", "ECOLITE XP", "GENEVA"
    ];
    eqTypeSelect.innerHTML = eqTypes.map(type => `<option value="${type}">${type}</option>`).join("");

    // 📌 모달 열기
    addEquipmentBtn.addEventListener("click", () => {
        console.log("🟢 '설비 추가' 버튼 클릭됨!");
        addEquipmentModal.classList.add("active");

        // 📌 입력값 초기화
        document.getElementById("new_eqname").value = "";
        groupSelect.value = "";
        siteSelect.value = "";
        lineSelect.innerHTML = `<option value="">SELECT</option>`;
        eqTypeSelect.value = "SELECT";
    });

    // 📌 모달 닫기
    const closeModal = () => {
        console.log("🔴 '모달 닫기' 버튼 클릭됨!");
        addEquipmentModal.classList.remove("active");
    };

    [cancelAddBtn, closeAddModalBtn].forEach(btn => btn.addEventListener("click", closeModal));

    // 📌 ESC 키로 모달 닫기 (애니메이션 적용)
    window.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeModal();
        }
    });

    // 📌 설비 추가 기능
    confirmAddBtn.addEventListener("click", async () => {
        console.log("🔄 '설비 추가' 요청 중...");

        const eqName = document.getElementById("new_eqname").value.trim();
        const group = groupSelect.value;
        const site = siteSelect.value;
        const line = lineSelect.value;
        const eqType = eqTypeSelect.value;

        if (!eqName || !group || !site || !line || eqType === "SELECT") {
            alert("⚠️ 모든 필드를 입력해주세요.");
            return;
        }

        try {
            const response = await axios.post(`${API_BASE_URL}/add`, {
                EQNAME: eqName,
                GROUP: group,
                SITE: site,
                LINE: line,
                TYPE: eqType
            });

            if (response.status === 201) {
                alert("✅ 설비가 추가되었습니다.");
                closeModal();
                location.reload();
            } else {
                alert("❌ 설비 추가 실패.");
            }
        } catch (error) {
            console.error("❌ 설비 추가 오류:", error);
            alert("🚨 설비 추가 중 오류가 발생했습니다.");
        }
    });
});
