document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("x-access-token");
  if (!token) return; // HTML에서도 가드하지만 혹시 몰라 방어

  // ====== 설정 ======
  const EQUIPMENTS = ["SUPRA N", "SUPRA XP", "INTEGER", "PRECIA", "ECOLITE", "GENEVA", "HDW"];

  const urlMapping = {
    "SUPRA N": { "SET UP": "pci_supran_setup.html", "MAINT": "pci_supran.html" },
    "SUPRA XP": { "SET UP": "pci_supraxp_setup.html", "MAINT": "pci_supraxp.html" },
    "INTEGER": { "SET UP": "pci_integer_setup.html", "MAINT": "pci_integer.html" },
    "PRECIA": { "SET UP": "pci_precia_setup.html", "MAINT": "pci_precia.html" },
    "ECOLITE": { "SET UP": "pci_ecolite_setup.html", "MAINT": "pci_ecolite.html" },
    "GENEVA": { "SET UP": "pci_geneva_setup.html", "MAINT": "pci_geneva.html" },
    "HDW": { "SET UP": "pci_hdw_setup.html", "MAINT": "pci_hdw.html" },
  };

  // ====== DOM ======
  const equipGrid = document.getElementById("equipGrid");
  const selectedEquipText = document.getElementById("selectedEquipText");
  const taskBlock = document.getElementById("taskBlock");
  const btnSetup = document.getElementById("btnSetup");
  const btnMaint = document.getElementById("btnMaint");
  const resetBtn = document.getElementById("resetBtn");

  let selectedEquip = "";

  // ====== 유틸 ======
  function setSelectedEquip(eq) {
    selectedEquip = eq;
    selectedEquipText.textContent = eq || "없음";

    // 버튼 active 토글
    const buttons = equipGrid.querySelectorAll(".equip-btn");
    buttons.forEach((b) => {
      const isActive = b.dataset.eq === eq;
      b.classList.toggle("active", isActive);
      b.setAttribute("aria-pressed", isActive ? "true" : "false");
    });

    // Task block 표시/숨김
if (eq) {
  taskBlock.classList.remove("hidden");
  requestAnimationFrame(() => taskBlock.classList.add("show"));
} else {
  taskBlock.classList.remove("show");
  taskBlock.classList.add("hidden");
}

  }

function go(taskType) {
  if (!selectedEquip) return;

  const map = urlMapping[selectedEquip];
  const target = map && map[taskType];
  if (!target) {
    alert("이동할 페이지 매핑이 없습니다. (urlMapping 확인 필요)");
    return;
  }

  // ✅ 짧은 피드백(은행 페이지 느낌: 누르고 바로 반응)
  const activeBtn = taskType === "SET UP" ? btnSetup : btnMaint;
  activeBtn.classList.add("is-loading");

  // 너무 길면 답답하니 120ms 정도가 딱 좋아요
  setTimeout(() => {
    window.location.href = target;
  }, 120);
}


  function renderEquipButtons() {
    equipGrid.innerHTML = "";

    EQUIPMENTS.forEach((eq) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "equip-btn";
      btn.dataset.eq = eq;
      btn.setAttribute("role", "listitem");
      btn.setAttribute("aria-pressed", "false");
      btn.textContent = eq;

      btn.addEventListener("click", () => setSelectedEquip(eq));
      equipGrid.appendChild(btn);
    });
  }

  // ====== 이벤트 ======
  btnSetup.addEventListener("click", () => go("SET UP"));
  btnMaint.addEventListener("click", () => go("MAINT"));

  // 키보드 접근성(Enter/Space)
  equipGrid.addEventListener("keydown", (e) => {
    const el = e.target;
    if (!el.classList || !el.classList.contains("equip-btn")) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      el.click();
    }
  });

  resetBtn.addEventListener("click", () => setSelectedEquip(""));

  // ====== init ======
  renderEquipButtons();
  setSelectedEquip(""); // 초기 상태
});
