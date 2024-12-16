document.addEventListener("DOMContentLoaded", async () => {
    const updateList = document.getElementById("update-list");
    const updateDetails = document.getElementById("update-details");
    const detailTitle = document.getElementById("detail-title");
    const detailContent = document.getElementById("detail-content");
    const detailDate = document.getElementById("detail-date");
    const backToList = document.getElementById("back-to-list");
    const addUpdateBtn = document.getElementById("add-update-btn");
    const updateTitleInput = document.getElementById("update-title");
    const updateContentInput = document.getElementById("update-content");

    // 업데이트 데이터를 가져오기
    async function fetchUpdates() {
        try {
            const response = await axios.get("http://3.37.73.151:3001/api/updates");
            const updates = response.data;
            updateList.innerHTML = updates
                .map(update => `
                    <li class="update-item" data-id="${update.id}">
                        <h3>${update.title}</h3>
                        <span>${new Date(update.created_at).toLocaleString()}</span>
                    </li>
                `)
                .join("");
        } catch (error) {
            console.error("Error fetching updates:", error);
        }
    }

    // 공지 추가
    async function addUpdate() {
        const title = updateTitleInput.value.trim();
        const content = updateContentInput.value.trim();
        if (!title || !content) {
            alert("Title and content are required.");
            return;
        }
        try {
            await axios.post("http://3.37.73.151:3001/api/updates", { title, content });
            updateTitleInput.value = "";
            updateContentInput.value = "";
            alert("Update added successfully!");
            await fetchUpdates();
        } catch (error) {
            console.error("Error adding update:", error);
        }
    }

async function showUpdateDetails(id) {
    try {
        console.log(`Fetching details for update ID: ${id}`); // 디버깅용 로그 추가
        const response = await axios.get(`http://3.37.73.151:3001/api/updates/${id}`);
        const update = response.data;
        detailTitle.textContent = update.title;
        detailContent.textContent = update.content;
        detailDate.textContent = new Date(update.created_at).toLocaleString();
        updateDetails.classList.remove("hidden");
        updateList.classList.add("hidden");
    } catch (error) {
        console.error("Error fetching update details:", error);
    }
}


    // 목록으로 돌아가기
    function backToListView() {
        updateDetails.classList.add("hidden");
        updateList.classList.remove("hidden");
    }

    // 이벤트 리스너
    updateList.addEventListener("click", (e) => {
        const item = e.target.closest(".update-item");
        if (item) {
            const updateId = item.getAttribute("data-id");
            showUpdateDetails(updateId);
        }
    });

    backToList.addEventListener("click", backToListView);
    addUpdateBtn.addEventListener("click", addUpdate);

    // 초기 데이터 가져오기
    await fetchUpdates();
});
