const API_BASE_URL = "http://3.37.73.151:3001";
const token = localStorage.getItem("x-access-token");

function decodeJwtPayload(jwtToken) {
  try {
    const base64 = jwtToken.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(decodeURIComponent(escape(atob(base64))));
  } catch (error) {
    return null;
  }
}

const tokenPayload = token ? decodeJwtPayload(token) : null;
const currentUserRole = tokenPayload?.role || localStorage.getItem("user-role");
const currentUserIdx = Number(tokenPayload?.userIdx || 0);
const currentUserName = tokenPayload?.nickname || "";

if (!token) {
  alert("로그인이 필요합니다.");
  window.location.replace("./signin.html");
}

if (currentUserRole !== "admin") {
  alert("관리자만 접근할 수 있습니다.");
  window.location.replace("./SECM_myself.html");
}

const authHeaders = { "x-access-token": token };

const state = {
  users: [],
  filteredUsers: [],
  selectedUser: null,
};

const STATUS_META = {
  A: { label: "사용중", className: "active" },
  I: { label: "비활성화", className: "inactive" },
  D: { label: "삭제 처리", className: "deleted" },
};

const dom = {
  searchInput: document.getElementById("search-input"),
  roleFilter: document.getElementById("role-filter"),
  statusFilter: document.getElementById("status-filter"),
  userTableBody: document.getElementById("user-table-body"),
  visibleCountPill: document.getElementById("visible-count-pill"),
  stats: {
    total: document.getElementById("stat-total"),
    active: document.getElementById("stat-active"),
    inactive: document.getElementById("stat-inactive"),
    admin: document.getElementById("stat-admin"),
  },
buttons: {
  heroCreate: document.getElementById("hero-create-btn"),
  heroRefresh: document.getElementById("hero-refresh-btn"),
},
  modals: {
    create: document.getElementById("create-user-modal"),
    detail: document.getElementById("user-detail-modal"),
    status: document.getElementById("status-modal"),
    reset: document.getElementById("reset-password-modal"),
  },
  forms: {
    create: document.getElementById("create-user-form"),
    status: document.getElementById("status-form"),
    reset: document.getElementById("reset-password-form"),
  },
  detailGrid: document.getElementById("user-detail-grid"),
  statusUserName: document.getElementById("status-user-name"),
  statusSelect: document.getElementById("status-select"),
  statusTargetText: document.getElementById("status-target-text"),
  resetUserName: document.getElementById("reset-user-name"),
  resetTargetText: document.getElementById("reset-target-text"),
  toastRoot: document.getElementById("toast-root"),
};

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function showToast(message, type = "default") {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  dom.toastRoot.appendChild(toast);
  setTimeout(() => {
    toast.classList.add("hide");
    setTimeout(() => toast.remove(), 250);
  }, 2600);
}

function getStatusBadge(status) {
  const meta = STATUS_META[status] || { label: status || "-", className: "" };
  return `<span class="status-badge ${meta.className}">${escapeHtml(status)} · ${escapeHtml(meta.label)}</span>`;
}

function getRoleBadge(role) {
  return `<span class="role-pill">${escapeHtml(role || "-")}</span>`;
}

function openModal(modal) {
  if (!modal) return;
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
}

function closeModal(modal) {
  if (!modal) return;
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  if (![...document.querySelectorAll(".modal")].some((item) => item.classList.contains("open"))) {
    document.body.classList.remove("modal-open");
  }
}

function closeAllModals() {
  Object.values(dom.modals).forEach(closeModal);
}

function formatDate(value) {
  if (!value) return "-";
  return String(value).slice(0, 10);
}

function setSelectedUser(user) {
  state.selectedUser = user || null;
}

function renderStats() {
  const total = state.users.length;
  const active = state.users.filter((user) => user.status === "A").length;
  const inactive = state.users.filter((user) => user.status === "I").length;
  const admins = state.users.filter((user) => user.role === "admin").length;

  dom.stats.total.textContent = total;
  dom.stats.active.textContent = active;
  dom.stats.inactive.textContent = inactive;
  dom.stats.admin.textContent = admins;
}

function getSearchBase(user) {
  return [
    user.nickname,
    user.userID,
    user.group,
    user.site,
    user.role,
    user.status,
    user.userIdx,
    formatDate(user.hire_date),
  ]
    .map((item) => String(item ?? "").toLowerCase())
    .join(" ");
}

function applyFilters() {
  const keyword = dom.searchInput.value.trim().toLowerCase();
  const role = dom.roleFilter.value;
  const status = dom.statusFilter.value;

  state.filteredUsers = state.users.filter((user) => {
    const matchesKeyword = !keyword || getSearchBase(user).includes(keyword);
    const matchesRole = !role || user.role === role;
    const matchesStatus = !status || user.status === status;
    return matchesKeyword && matchesRole && matchesStatus;
  });

  renderTable();
}

function renderEmpty(message) {
  dom.userTableBody.innerHTML = `
    <tr>
      <td colspan="10">
        <div class="empty-state">${escapeHtml(message)}</div>
      </td>
    </tr>
  `;
  dom.visibleCountPill.textContent = "0명 표시중";
}

function renderTable() {
  const users = state.filteredUsers;
  dom.visibleCountPill.textContent = `${users.length}명 표시중`;

  if (!users.length) {
    renderEmpty("조건에 맞는 사용자가 없습니다.");
    return;
  }

  dom.userTableBody.innerHTML = users
    .map((user) => {
      const isSelf = Number(user.userIdx) === currentUserIdx;
      const disableStatusButton = isSelf && user.role === "admin";
      const selfLabel = isSelf ? `<span class="self-tag">내 계정</span>` : "";

      return `
        <tr>
          <td>${escapeHtml(user.userIdx)}</td>
          <td>
            <div class="name-cell">
              <strong>${escapeHtml(user.nickname)}</strong>
              ${selfLabel}
            </div>
          </td>
          <td>${escapeHtml(user.userID)}</td>
          <td>${escapeHtml(user.group)}</td>
          <td>${escapeHtml(user.site)}</td>
          <td>${escapeHtml(user.level)}</td>
          <td>${getRoleBadge(user.role)}</td>
          <td>${getStatusBadge(user.status)}</td>
          <td>${escapeHtml(formatDate(user.hire_date))}</td>
          <td>
            <div class="action-stack">
              <button type="button" class="btn btn-chip" data-action="detail" data-user-idx="${escapeHtml(user.userIdx)}">상세</button>
              <button type="button" class="btn btn-chip" data-action="status" data-user-idx="${escapeHtml(user.userIdx)}" ${disableStatusButton ? "disabled" : ""}>상태 변경</button>
              <button type="button" class="btn btn-chip" data-action="reset-password" data-user-idx="${escapeHtml(user.userIdx)}">비밀번호 초기화</button>
            </div>
          </td>
        </tr>
      `;
    })
    .join("");
}

function findUserByIdx(userIdx) {
  return state.users.find((user) => Number(user.userIdx) === Number(userIdx)) || null;
}

function renderDetailModal(user) {
  dom.detailGrid.innerHTML = `
    <div class="detail-item"><span>이름</span><strong>${escapeHtml(user.nickname)}</strong></div>
    <div class="detail-item"><span>아이디</span><strong>${escapeHtml(user.userID)}</strong></div>
    <div class="detail-item"><span>userIdx</span><strong>${escapeHtml(user.userIdx)}</strong></div>
    <div class="detail-item"><span>권한</span><strong>${escapeHtml(user.role)}</strong></div>
    <div class="detail-item"><span>상태</span><strong>${escapeHtml(user.status)} · ${escapeHtml(STATUS_META[user.status]?.label || user.status)}</strong></div>
    <div class="detail-item"><span>GROUP</span><strong>${escapeHtml(user.group)}</strong></div>
    <div class="detail-item"><span>SITE</span><strong>${escapeHtml(user.site)}</strong></div>
    <div class="detail-item"><span>LEVEL</span><strong>${escapeHtml(user.level)}</strong></div>
    <div class="detail-item"><span>입사일</span><strong>${escapeHtml(formatDate(user.hire_date))}</strong></div>
    <div class="detail-item"><span>생성일</span><strong>${escapeHtml(formatDate(user.created_at))}</strong></div>
  `;
}

async function loadUsers() {
  try {
    dom.userTableBody.innerHTML = `
      <tr>
        <td colspan="10"><div class="empty-state">사용자 목록을 불러오는 중입니다.</div></td>
      </tr>
    `;

    const response = await axios.get(`${API_BASE_URL}/users`, { headers: authHeaders });
    state.users = Array.isArray(response.data.result) ? response.data.result : [];
    renderStats();
    applyFilters();
  } catch (error) {
    console.error("사용자 목록 조회 오류:", error);
    renderEmpty(error.response?.data?.message || "사용자 목록을 불러오지 못했습니다.");
    showToast(error.response?.data?.message || "사용자 목록 조회 실패", "danger");
  }
}

async function submitCreateUser(event) {
  event.preventDefault();

  const payload = {
    userID: document.getElementById("userID").value.trim(),
    nickname: document.getElementById("nickname").value.trim(),
    password: document.getElementById("password").value,
    group: document.getElementById("group").value,
    site: document.getElementById("site").value,
    level: Number(document.getElementById("level").value),
    hireDate: document.getElementById("hireDate").value,
    role: document.getElementById("role").value,
    status: document.getElementById("status").value,
  };
  const confirmPassword = document.getElementById("confirmPassword").value;

  if (payload.password !== confirmPassword) {
    showToast("비밀번호 확인이 일치하지 않습니다.", "danger");
    return;
  }

  try {
    const response = await axios.post(`${API_BASE_URL}/admin/users`, payload, { headers: authHeaders });
    showToast(response.data.message || "계정이 생성되었습니다.", "success");
    dom.forms.create.reset();
    document.getElementById("role").value = "worker";
    document.getElementById("status").value = "A";
    closeModal(dom.modals.create);
    await loadUsers();
  } catch (error) {
    console.error("계정 생성 오류:", error);
    showToast(error.response?.data?.message || "계정 생성 중 오류가 발생했습니다.", "danger");
  }
}

function openStatusModal(user) {
  setSelectedUser(user);
  dom.statusUserName.value = `${user.nickname} (${user.userID})`;
  dom.statusSelect.value = user.status || "A";
  dom.statusTargetText.textContent = `${user.nickname} 계정의 현재 상태는 ${user.status}입니다.`;
  openModal(dom.modals.status);
}

async function submitStatusChange(event) {
  event.preventDefault();

  const user = state.selectedUser;
  if (!user) {
    showToast("대상 사용자를 찾을 수 없습니다.", "danger");
    return;
  }

  const nextStatus = dom.statusSelect.value;

  try {
    const response = await axios.patch(
      `${API_BASE_URL}/admin/users/${user.userIdx}/status`,
      { status: nextStatus },
      { headers: authHeaders }
    );

    showToast(response.data.message || "상태가 변경되었습니다.", "success");
    closeModal(dom.modals.status);
    await loadUsers();
  } catch (error) {
    console.error("상태 변경 오류:", error);
    showToast(error.response?.data?.message || "상태 변경 중 오류가 발생했습니다.", "danger");
  }
}

function openResetModal(user) {
  setSelectedUser(user);
  dom.resetUserName.value = `${user.nickname} (${user.userID})`;
  dom.resetTargetText.textContent = `${user.nickname} 계정의 비밀번호를 초기화합니다.`;
  dom.forms.reset.reset();
  dom.resetUserName.value = `${user.nickname} (${user.userID})`;
  openModal(dom.modals.reset);
}

async function submitPasswordReset(event) {
  event.preventDefault();

  const user = state.selectedUser;
  if (!user) {
    showToast("대상 사용자를 찾을 수 없습니다.", "danger");
    return;
  }

  const newPassword = document.getElementById("resetPassword").value;
  const confirmPassword = document.getElementById("resetPasswordConfirm").value;

  if (newPassword !== confirmPassword) {
    showToast("새 비밀번호가 일치하지 않습니다.", "danger");
    return;
  }

  try {
    const response = await axios.post(
      `${API_BASE_URL}/admin/reset-password`,
      { userIdx: Number(user.userIdx), newPassword },
      { headers: authHeaders }
    );

    showToast(response.data.message || "비밀번호가 초기화되었습니다.", "success");
    closeModal(dom.modals.reset);
  } catch (error) {
    console.error("비밀번호 초기화 오류:", error);
    showToast(error.response?.data?.message || "비밀번호 초기화 중 오류가 발생했습니다.", "danger");
  }
}

function resetFilters() {
  dom.searchInput.value = "";
  dom.roleFilter.value = "";
  dom.statusFilter.value = "";
  applyFilters();
}

function handleTableAction(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const userIdx = Number(button.dataset.userIdx);
  const action = button.dataset.action;
  const user = findUserByIdx(userIdx);

  if (!user) {
    showToast("대상 사용자를 찾을 수 없습니다.", "danger");
    return;
  }

  if (action === "detail") {
    renderDetailModal(user);
    openModal(dom.modals.detail);
    return;
  }

  if (action === "status") {
    openStatusModal(user);
    return;
  }

  if (action === "reset-password") {
    openResetModal(user);
  }
}

function bindEvents() {
  if (dom.buttons.heroCreate) {
    dom.buttons.heroCreate.addEventListener("click", () => openModal(dom.modals.create));
  }

  if (dom.buttons.heroRefresh) {
    dom.buttons.heroRefresh.addEventListener("click", loadUsers);
  }

  if (dom.searchInput) dom.searchInput.addEventListener("input", applyFilters);
  if (dom.roleFilter) dom.roleFilter.addEventListener("change", applyFilters);
  if (dom.statusFilter) dom.statusFilter.addEventListener("change", applyFilters);

  if (dom.forms.create) dom.forms.create.addEventListener("submit", submitCreateUser);
  if (dom.forms.status) dom.forms.status.addEventListener("submit", submitStatusChange);
  if (dom.forms.reset) dom.forms.reset.addEventListener("submit", submitPasswordReset);
  if (dom.userTableBody) dom.userTableBody.addEventListener("click", handleTableAction);

  document.querySelectorAll("[data-close-modal]").forEach((button) => {
    button.addEventListener("click", () => closeAllModals());
  });

  document.querySelectorAll(".modal").forEach((modal) => {
    modal.addEventListener("click", (event) => {
      if (event.target === modal) closeModal(modal);
    });
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeAllModals();
  });
}

bindEvents();
loadUsers();
