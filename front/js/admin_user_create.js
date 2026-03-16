const API_BASE_URL = "http://3.37.73.151:3001";
const token = localStorage.getItem("x-access-token");
const role = localStorage.getItem("user-role");
const myNickname = localStorage.getItem("user-nickname");

if (!token) {
  alert("로그인이 필요합니다.");
  window.location.replace("./signin.html");
}

if (role !== "admin") {
  alert("관리자만 접근할 수 있습니다.");
  window.location.replace("./SECM_myself.html");
}

const authHeaders = {
  "x-access-token": token,
};

const STATUS_META = {
  A: { text: "사용중", className: "active" },
  I: { text: "비활성화", className: "inactive" },
  D: { text: "삭제", className: "deleted" },
};

const createForm = document.getElementById("create-user-form");
const resetForm = document.getElementById("reset-password-form");
const userTableBody = document.getElementById("user-table-body");
const createResult = document.getElementById("create-result");
const resetResult = document.getElementById("reset-result");
const refreshUsersBtn = document.getElementById("refresh-users");

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatStatus(status) {
  const meta = STATUS_META[status] || { text: status || "-", className: "" };
  return `<span class="status-badge ${meta.className}">${escapeHtml(status)} - ${escapeHtml(meta.text)}</span>`;
}

function getActionButtons(user) {
  const userIdx = Number(user.userIdx);
  const currentStatus = user.status;
  const isSelf = (user.nickname || "") === myNickname && user.role === "admin";

  const buttons = [];

  if (currentStatus === "A") {
    buttons.push(`<button class="table-btn warn-btn" data-action="deactivate" data-user-idx="${userIdx}" ${isSelf ? "disabled" : ""}>퇴사/비활성화</button>`);
  }

  if (currentStatus === "I") {
    buttons.push(`<button class="table-btn primary-btn small" data-action="activate" data-user-idx="${userIdx}">재활성화</button>`);
  }

  if (!buttons.length) {
    return `<span class="muted-text">관리 불가</span>`;
  }

  return `<div class="action-stack">${buttons.join("")}</div>`;
}

async function loadUsers() {
  try {
    const response = await axios.get(`${API_BASE_URL}/users`, {
      headers: authHeaders,
    });

    const users = response.data.result || [];

    if (!users.length) {
      userTableBody.innerHTML = `<tr><td colspan="10">표시할 사용자가 없습니다.</td></tr>`;
      return;
    }

    userTableBody.innerHTML = users
      .map((user) => {
        return `
          <tr>
            <td>${escapeHtml(user.userIdx)}</td>
            <td>${escapeHtml(user.userID)}</td>
            <td>${escapeHtml(user.nickname)}</td>
            <td>${escapeHtml(user.group)}</td>
            <td>${escapeHtml(user.site)}</td>
            <td>${escapeHtml(user.level)}</td>
            <td>${escapeHtml(user.role)}</td>
            <td>${formatStatus(user.status)}</td>
            <td>${escapeHtml((user.hire_date || "").toString().slice(0, 10))}</td>
            <td>${getActionButtons(user)}</td>
          </tr>
        `;
      })
      .join("");
  } catch (error) {
    console.error("사용자 목록 조회 오류:", error);
    userTableBody.innerHTML = `<tr><td colspan="10">${escapeHtml(error.response?.data?.message || "사용자 목록을 불러오지 못했습니다.")}</td></tr>`;
  }
}

async function updateUserStatus(userIdx, status) {
  const actionText = status === "I" ? "비활성화" : "재활성화";

  const confirmed = window.confirm(`정말 해당 계정을 ${actionText}하시겠습니까?`);
  if (!confirmed) {
    return;
  }

  try {
    const response = await axios.patch(
      `${API_BASE_URL}/admin/users/${userIdx}/status`,
      { status },
      { headers: authHeaders }
    );

    createResult.textContent = response.data.message;
    await loadUsers();
  } catch (error) {
    console.error("상태 변경 오류:", error);
    createResult.textContent =
      error.response?.data?.message || "상태 변경 중 오류가 발생했습니다.";
  }
}

createForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const userID = document.getElementById("userID").value.trim();
  const nickname = document.getElementById("nickname").value.trim();
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;
  const group = document.getElementById("group").value;
  const site = document.getElementById("site").value;
  const level = Number(document.getElementById("level").value);
  const hireDate = document.getElementById("hireDate").value;
  const role = document.getElementById("role").value;
  const status = document.getElementById("status").value;

  if (password !== confirmPassword) {
    createResult.textContent = "비밀번호가 일치하지 않습니다.";
    return;
  }

  try {
    const response = await axios.post(
      `${API_BASE_URL}/admin/users`,
      {
        userID,
        password,
        nickname,
        group,
        site,
        level,
        hireDate,
        role,
        status,
      },
      { headers: authHeaders }
    );

    createResult.textContent = response.data.message;
    createForm.reset();
    document.getElementById("role").value = "worker";
    document.getElementById("status").value = "A";
    await loadUsers();
  } catch (error) {
    console.error("계정 생성 오류:", error);
    createResult.textContent =
      error.response?.data?.message || "계정 생성 중 오류가 발생했습니다.";
  }
});

resetForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const userIdx = Number(document.getElementById("resetUserIdx").value);
  const newPassword = document.getElementById("resetPassword").value;
  const resetPasswordConfirm = document.getElementById("resetPasswordConfirm").value;

  if (newPassword !== resetPasswordConfirm) {
    resetResult.textContent = "새 비밀번호가 일치하지 않습니다.";
    return;
  }

  try {
    const response = await axios.post(
      `${API_BASE_URL}/admin/reset-password`,
      { userIdx, newPassword },
      { headers: authHeaders }
    );

    resetResult.textContent = response.data.message;
    resetForm.reset();
  } catch (error) {
    console.error("비밀번호 초기화 오류:", error);
    resetResult.textContent =
      error.response?.data?.message || "비밀번호 초기화 중 오류가 발생했습니다.";
  }
});

userTableBody.addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) {
    return;
  }

  const userIdx = Number(button.dataset.userIdx);
  const action = button.dataset.action;

  if (!userIdx) {
    return;
  }

  if (action === "deactivate") {
    await updateUserStatus(userIdx, "I");
  }

  if (action === "activate") {
    await updateUserStatus(userIdx, "A");
  }
});

refreshUsersBtn.addEventListener("click", loadUsers);

loadUsers();
