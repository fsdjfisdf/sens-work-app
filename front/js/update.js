// update.js — clean-frame UI: overlay+modal, robust hamburger toggle, admin guard
document.addEventListener('DOMContentLoaded', async () => {
  /* -------------------- 로그인/권한 -------------------- */
  const token = localStorage.getItem('x-access-token');
  const role  = localStorage.getItem('user-role');

  if (!token) {
    alert('로그인이 필요합니다.');
    window.location.replace('./signin.html');
    return;
  }

  // 로그인/권한별 표시
  if (!token) {
    document.querySelector('.unsigned')?.classList.remove('hidden');
    document.querySelector('.signed')?.classList.add('hidden');
  } else {
    document.querySelector('.unsigned')?.classList.add('hidden');
    document.querySelector('.signed')?.classList.remove('hidden');
  }
  if (!token || role !== 'admin') {
    document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'none');
    document.getElementById('open-add-modal')?.classList.add('hidden');
  }

  // 로그아웃
  document.getElementById('sign-out')?.addEventListener('click', () => {
    localStorage.removeItem('x-access-token');
    localStorage.removeItem('user-role');
    alert('로그아웃 되었습니다.');
    window.location.replace('./signin.html');
  });

  /* -------------------- 햄버거 토글 (충돌 방지) -------------------- */
  (function fixMenuToggle(){
    const menuBtn = document.querySelector('nav .menu-btn');
    const menuBar = document.querySelector('nav .menu-bar');
    if (!menuBtn || !menuBar) return;

    const setOpen = (open) => {
      if (open) {
        menuBar.classList.add('open');
        menuBar.style.overflow = 'hidden';
        menuBar.style.maxHeight = menuBar.scrollHeight + 'px';
        menuBtn.setAttribute('aria-expanded','true');
      } else {
        menuBar.style.maxHeight = '0px';
        menuBar.classList.remove('open');
        menuBtn.setAttribute('aria-expanded','false');
      }
    };
    setOpen(false);

    menuBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      setOpen(!menuBar.classList.contains('open'));
    }, true);

    document.addEventListener('click', (e) => {
      if (!menuBar.contains(e.target) && !menuBtn.contains(e.target)) setOpen(false);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') setOpen(false);
    });
    window.addEventListener('resize', () => {
      if (menuBar.classList.contains('open')) {
        menuBar.style.maxHeight = menuBar.scrollHeight + 'px';
      }
    });
  })();

  /* -------------------- 엘리먼트 -------------------- */
  const overlay           = document.getElementById('modal-overlay');

  const updateList        = document.getElementById('update-list');

  const updateModal       = document.getElementById('update-modal');
  const closeUpdateModal  = document.getElementById('close-update-modal');
  const modalTitle        = document.getElementById('modal-title');
  const modalContent      = document.getElementById('modal-content');
  const modalDate         = document.getElementById('modal-date');

  const addModal          = document.getElementById('add-modal');
  const closeAddModal     = document.getElementById('close-add-modal');
  const openAddModalBtn   = document.getElementById('open-add-modal');
  const cancelAddBtn      = document.getElementById('cancel-add');
  const newUpdateTitle    = document.getElementById('new-update-title');
  const newUpdateContent  = document.getElementById('new-update-content');
  const addUpdateBtn      = document.getElementById('add-update-btn');

  const editModal         = document.getElementById('edit-modal');
  const closeEditModal    = document.getElementById('close-edit-modal');
  const cancelEditBtn     = document.getElementById('cancel-edit');
  const editUpdateTitle   = document.getElementById('edit-update-title');
  const editUpdateContent = document.getElementById('edit-update-content');
  const saveUpdateBtn     = document.getElementById('save-update-btn');

  let currentEditId = null;

  /* -------------------- 공통 모달 열고 닫기 -------------------- */
  function openModal(modal){
    overlay?.classList.add('show');
    modal?.classList.add('show');
    // 첫 입력에 포커스
    const focusable = modal.querySelector('input, textarea, button');
    focusable && requestAnimationFrame(() => focusable.focus());
  }
  function closeModal(modal){
    modal?.classList.remove('show');
    // 모든 모달이 닫혔는지 체크 후 오버레이 닫기
    const anyOpen = document.querySelector('.modal.show');
    if (!anyOpen) overlay?.classList.remove('show');
  }
  overlay?.addEventListener('click', () => {
    document.querySelectorAll('.modal.show').forEach(m => m.classList.remove('show'));
    overlay.classList.remove('show');
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal.show').forEach(m => m.classList.remove('show'));
      overlay?.classList.remove('show');
    }
  });

  /* -------------------- API -------------------- */
  async function fetchUpdates(){
    try{
      const { data } = await axios.get('http://3.37.73.151:3001/api/updates');
      updateList.innerHTML = data.map(update => `
        <li class="update-item" data-id="${update.id}">
          <div class="item-content">
            <h3>${escapeHtml(update.title)}</h3>
            <span>${new Date(update.created_at).toLocaleString()}</span>
          </div>
          ${role === 'admin' ? `<button class="edit-btn" data-id="${update.id}" type="button">Edit</button>` : ''}
        </li>
      `).join('');
    }catch(err){
      console.error('Error fetching updates:', err);
    }
  }

  async function showUpdateDetails(id){
    try{
      const { data } = await axios.get(`http://3.37.73.151:3001/api/updates/${id}`);
      modalTitle.textContent   = data.title;
      modalContent.innerHTML = escapeHtml(data.content).replace(/\r?\n/g, '<br>');
      modalDate.textContent    = new Date(data.created_at).toLocaleString();
      openModal(updateModal);
    }catch(err){
      console.error('Error fetching update details:', err);
    }
  }

  async function addUpdate(){
    const title   = newUpdateTitle.value.trim();
    const content = newUpdateContent.value.trim();
    if (!title || !content){
      alert('Title and content are required.');
      return;
    }
    try{
      await axios.post('http://3.37.73.151:3001/api/updates', { title, content });
      newUpdateTitle.value = ''; newUpdateContent.value = '';
      closeModal(addModal);
      await fetchUpdates();
    }catch(err){
      console.error('Error adding update:', err);
    }
  }

  async function showEditModal(id){
    try{
      const { data } = await axios.get(`http://3.37.73.151:3001/api/updates/${id}`);
      editUpdateTitle.value   = data.title;
      editUpdateContent.value = data.content;
      currentEditId = id;
      openModal(editModal);
    }catch(err){
      console.error('Error fetching update details:', err);
    }
  }

  async function editUpdate(){
    const title   = editUpdateTitle.value.trim();
    const content = editUpdateContent.value.trim();
    if (!title || !content){
      alert('Title and content are required.');
      return;
    }
    try{
      await axios.put(`http://3.37.73.151:3001/api/updates/${currentEditId}`, { title, content });
      closeModal(editModal);
      await fetchUpdates();
    }catch(err){
      console.error('Error editing update:', err);
    }
  }

  /* -------------------- 이벤트 -------------------- */
  updateList.addEventListener('click', (e) => {
    const editBtn = e.target.closest('.edit-btn');
    if (editBtn){
      e.stopPropagation();
      showEditModal(editBtn.dataset.id);
      return;
    }
    const item = e.target.closest('.update-item');
    if (item){
      showUpdateDetails(item.dataset.id);
    }
  });

  document.getElementById('add-update-btn')?.addEventListener('click', addUpdate);
  document.getElementById('save-update-btn')?.addEventListener('click', editUpdate);

  openAddModalBtn?.addEventListener('click', () => openModal(addModal));
  closeUpdateModal?.addEventListener('click', () => closeModal(updateModal));
  closeAddModal?.addEventListener('click', () => closeModal(addModal));
  closeEditModal?.addEventListener('click', () => closeModal(editModal));
  cancelAddBtn?.addEventListener('click', () => closeModal(addModal));
  cancelEditBtn?.addEventListener('click', () => closeModal(editModal));

  /* -------------------- 초기 로드 -------------------- */
  await fetchUpdates();

  /* -------------------- 유틸 -------------------- */
  function escapeHtml(str=''){
    return str
      .replaceAll('&','&amp;')
      .replaceAll('<','&lt;')
      .replaceAll('>','&gt;')
      .replaceAll('"','&quot;')
      .replaceAll("'",'&#039;');
  }
});
