const API = {
  listUsers: '/api/admin/users',
  createUser: '/api/admin/users',
  updateUserStatus: (userId) => `/api/admin/users/${encodeURIComponent(userId)}/status`
};

const state = {
  users: [],
  filteredUsers: []
};

const form = document.getElementById('adminUserForm');
const resetBtn = document.getElementById('resetBtn');
const refreshBtn = document.getElementById('refreshBtn');
const searchInput = document.getElementById('searchInput');
const statusFilter = document.getElementById('statusFilter');
const userTableBody = document.getElementById('userTableBody');
const toast = document.getElementById('toast');
const roleCards = document.getElementById('roleCards');

document.addEventListener('DOMContentLoaded', () => {
  bindEvents();
  loadUsers();
});

function bindEvents() {
  form.addEventListener('submit', handleCreateUser);
  resetBtn.addEventListener('click', () => {
    form.reset();
    setSelectedRoleCard();
  });
  refreshBtn.addEventListener('click', loadUsers);
  searchInput.addEventListener('input', applyFilters);
  statusFilter.addEventListener('change', applyFilters);

  roleCards.addEventListener('change', () => {
    setSelectedRoleCard();
  });

  userTableBody.addEventListener('click', async (event) => {
    const button = event.target.closest('button[data-action]');
    if (!button) return;

    const action = button.dataset.action;
    const userId = button.dataset.userid;

    if (!userId) return;

    if (action === 'deactivate') {
      await updateUserStatus(userId, 0);
    } else if (action === 'activate') {
      await updateUserStatus(userId, 1);
    }
  });
}

function setSelectedRoleCard() {
  const selectedRole = document.querySelector('input[name="role"]:checked')?.value;
  document.querySelectorAll('.role-card').forEach(card => {
    const radio = card.querySelector('input[type="radio"]');
    card.classList.toggle('selected', radio?.value === selectedRole);
  });
}

async function loadUsers() {
  try {
    userTableBody.innerHTML = `<tr><td colspan="5" class="empty-row">사용자 목록을 불러오는 중입니다.</td></tr>`;

    const response = await fetch(API.listUsers, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      throw new Error('사용자 목록 조회 실패');
    }

    const data = await response.json();
    state.users = Array.isArray(data) ? data : (data.users || []);
    applyFilters();
  } catch (error) {
    console.error(error);
    state.users = [];
    userTableBody.innerHTML = `<tr><td colspan="5" class="empty-row">사용자 목록을 불러오지 못했습니다.</td></tr>`;
    showToast('사용자 목록을 불러오지 못했습니다.', true);
  }
}

function applyFilters() {
  const keyword = searchInput.value.trim().toLowerCase();
  const filterStatus = statusFilter.value;

  state.filteredUsers = state.users.filter(user => {
    const id = String(user.userId ?? user.id ?? '').toLowerCase();
    const name = String(user.name ?? user.nickname ?? '').toLowerCase();
    const status = normalizeStatus(user.isActive ?? user.active ?? user.status);

    const matchesKeyword = !keyword || id.includes(keyword) || name.includes(keyword);
    const matchesStatus = filterStatus === 'all' || status === filterStatus;

    return matchesKeyword && matchesStatus;
  });

  renderUsers();
}

function renderUsers() {
  if (!state.filteredUsers.length) {
    userTableBody.innerHTML = `<tr><td colspan="5" class="empty-row">표시할 사용자가 없습니다.</td></tr>`;
    return;
  }

  userTableBody.innerHTML = state.filteredUsers.map(user => {
    const userId = escapeHtml(String(user.userId ?? user.id ?? ''));
    const name = escapeHtml(String(user.name ?? user.nickname ?? ''));
    const role = String(user.role ?? user.auth ?? '').toUpperCase();
    const status = normalizeStatus(user.isActive ?? user.active ?? user.status);
    const statusText = status === '1' ? '활성' : '비활성';
    const roleText = getRoleText(role);

    const actionButton = status === '1'
      ? `<button class="danger-btn small-btn" data-action="deactivate" data-userid="${userId}">비활성화</button>`
      : `<button class="primary-btn small-btn" data-action="activate" data-userid="${userId}">활성화</button>`;

    return `
      <tr>
        <td>${userId}</td>
        <td>${name}</td>
        <td><span class="role-pill role-${role || 'none'}">${roleText}</span></td>
        <td><span class="status-pill ${status === '1' ? 'status-on' : 'status-off'}">${statusText}</span></td>
        <td>${actionButton}</td>
      </tr>
    `;
  }).join('');
}

async function handleCreateUser(event) {
  event.preventDefault();

  const formData = new FormData(form);
  const payload = {
    userId: formData.get('userId')?.trim(),
    password: formData.get('password')?.trim(),
    name: formData.get('name')?.trim(),
    role: formData.get('role'),
    isActive: Number(formData.get('status'))
  };

  if (!payload.userId || !payload.password || !payload.name || !payload.role) {
    showToast('필수 항목을 입력하세요.', true);
    return;
  }

  try {
    const response = await fetch(API.createUser, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await safeJson(response);

    if (!response.ok) {
      throw new Error(result.message || '사용자 생성 실패');
    }

    showToast(result.message || '사용자가 저장되었습니다.');
    form.reset();
    setSelectedRoleCard();
    loadUsers();
  } catch (error) {
    console.error(error);
    showToast(error.message || '사용자 저장 중 오류가 발생했습니다.', true);
  }
}

async function updateUserStatus(userId, isActive) {
  const actionText = isActive === 1 ? '활성화' : '비활성화';

  try {
    const response = await fetch(API.updateUserStatus(userId), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive })
    });

    const result = await safeJson(response);

    if (!response.ok) {
      throw new Error(result.message || `${actionText} 실패`);
    }

    showToast(result.message || `${actionText}되었습니다.`);
    loadUsers();
  } catch (error) {
    console.error(error);
    showToast(error.message || `${actionText} 중 오류가 발생했습니다.`, true);
  }
}

function getRoleText(role) {
  switch (role) {
    case 'A': return 'A · 관리자';
    case 'I': return 'I · 일반 사용자';
    case 'D': return 'D · 조회 전용';
    default: return '-';
  }
}

function normalizeStatus(value) {
  if (value === 0 || value === '0' || value === false || value === 'inactive') return '0';
  return '1';
}

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

async function safeJson(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

function showToast(message, isError = false) {
  toast.textContent = message;
  toast.className = `toast show ${isError ? 'error' : 'success'}`;

  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => {
    toast.className = 'toast';
  }, 2500);
}
