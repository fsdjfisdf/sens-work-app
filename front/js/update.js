document.addEventListener("DOMContentLoaded", async () => {
    // HTML 요소 정의
    const updateList = document.getElementById("update-list");
    const updateModal = document.getElementById("update-modal");
    const addModal = document.getElementById("add-modal");
    const editModal = document.getElementById("edit-modal");

    const modalTitle = document.getElementById("modal-title");
    const modalContent = document.getElementById("modal-content");
    const modalDate = document.getElementById("modal-date");

    const closeUpdateModal = document.getElementById("close-update-modal");
    const closeAddModal = document.getElementById("close-add-modal");
    const closeEditModal = document.getElementById("close-edit-modal");

    const addUpdateBtn = document.getElementById("add-update-btn");
    const saveUpdateBtn = document.getElementById("save-update-btn");

    const newUpdateTitle = document.getElementById("new-update-title");
    const newUpdateContent = document.getElementById("new-update-content");

    const editUpdateTitle = document.getElementById("edit-update-title");
    const editUpdateContent = document.getElementById("edit-update-content");

    let currentEditId = null;

    // 모달 열기 및 닫기 함수
    function openModal(modal) {
        modal.classList.remove("hidden");
        modal.style.display = "flex";
    }

    function closeModal(modal) {
        modal.classList.add("hidden");
        modal.style.display = "none";
    }

    // 업데이트 데이터 가져오기
    async function fetchUpdates() {
        try {
            const response = await axios.get("http://3.37.73.151:3001/api/updates");
            const updates = response.data;
            updateList.innerHTML = updates
                .map(update => `
                    <li class="update-item" data-id="${update.id}">
                        <h3>${update.title}</h3>
                        <span>${new Date(update.created_at).toLocaleString()}</span>
                        <button class="edit-btn" data-id="${update.id}">Edit</button>
                    </li>
                `)
                .join("");
        } catch (error) {
            console.error("Error fetching updates:", error);
        }
    }

    // 공지 추가
    async function addUpdate() {
        const title = newUpdateTitle.value.trim();
        const content = newUpdateContent.value.trim();
        if (!title || !content) {
            alert("Title and content are required.");
            return;
        }
        try {
            await axios.post("http://3.37.73.151:3001/api/updates", { title, content });
            newUpdateTitle.value = "";
            newUpdateContent.value = "";
            closeModal(addModal);
            await fetchUpdates();
        } catch (error) {
            console.error("Error adding update:", error);
        }
    }

    // 공지 수정
    async function editUpdate() {
        const title = editUpdateTitle.value.trim();
        const content = editUpdateContent.value.trim();
        if (!title || !content) {
            alert("Title and content are required.");
            return;
        }
        try {
            await axios.put(`http://3.37.73.151:3001/api/updates/${currentEditId}`, { title, content });
            closeModal(editModal);
            await fetchUpdates();
        } catch (error) {
            console.error("Error editing update:", error);
        }
    }

    // 공지 수정 모달 열기
    async function showEditModal(id) {
        try {
            const response = await axios.get(`http://3.37.73.151:3001/api/updates/${id}`);
            const update = response.data;
            editUpdateTitle.value = update.title;
            editUpdateContent.value = update.content;
            currentEditId = id;
            openModal(editModal);
        } catch (error) {
            console.error("Error fetching update details:", error);
        }
    }

    // 이벤트 리스너
    updateList.addEventListener("click", (e) => {
        const editBtn = e.target.closest(".edit-btn");
        if (editBtn) {
            const updateId = editBtn.getAttribute("data-id");
            showEditModal(updateId);
        }
    });

    closeUpdateModal.addEventListener("click", () => closeModal(updateModal));
    closeAddModal.addEventListener("click", () => closeModal(addModal));
    closeEditModal.addEventListener("click", () => closeModal(editModal));

    addUpdateBtn.addEventListener("click", addUpdate);
    saveUpdateBtn.addEventListener("click", editUpdate);

    // 초기 데이터 가져오기
    await fetchUpdates();
});
