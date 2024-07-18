// loading.js

function showLoading() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    loadingOverlay.style.display = 'flex';
    updateLoadingPercentage(0); // 초기 로딩 퍼센트 설정
}

function hideLoading() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    loadingOverlay.style.display = 'none';
}

function updateLoadingPercentage(percentage) {
    const loadingPercentage = document.getElementById('loadingPercentage');
    loadingPercentage.textContent = `${percentage}%`;
}

// 로딩 퍼센트를 100%로 설정하고 로딩 애니메이션 숨김
function completeLoading() {
    updateLoadingPercentage(100);
    setTimeout(hideLoading, 500); // 0.5초 후에 로딩 애니메이션 숨김
}
