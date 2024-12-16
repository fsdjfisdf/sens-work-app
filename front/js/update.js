document.addEventListener("DOMContentLoaded", async () => {
    const updateList = document.getElementById("update-list");

    // 업데이트 데이터를 가져오기
    async function fetchUpdates() {
        try {
            const response = await axios.get("http://3.37.73.151:3001/api/updates");
            const updates = response.data;
            updateList.innerHTML = updates
                .map(update => `
                    <li class="update-item">
                        <h3>${update.title}</h3>
                        <p>${update.content}</p>
                        <span>${new Date(update.created_at).toLocaleString()}</span>
                    </li>
                `)
                .join("");
        } catch (error) {
            console.error("Error fetching updates:", error);
        }
    }

    await fetchUpdates();
});
