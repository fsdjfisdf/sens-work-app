// 로딩 애니메이션을 시작하는 함수
function showLoading() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    loadingOverlay.style.display = 'flex';  // 로딩 오버레이 보이기
    let progress = 0;

    // 애니메이션을 더 천천히 보이도록 하기 위해 딜레이 추가
    const interval = setInterval(() => {
        if (progress < 100) {
            progress += 2;  // 2씩 증가하여 천천히 진행
            document.getElementById('loadingPercentage').textContent = `${progress}%`;
        } else {
            clearInterval(interval);  // 100%가 되면 종료
            completeLoading();  // 로딩 완료 처리
        }
    }, 50);  // 50ms마다 실행, 총 5초 동안 애니메이션 진행
}

// 로딩 애니메이션을 종료하는 함수
function completeLoading() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    setTimeout(() => {
        loadingOverlay.style.display = 'none';  // 로딩 오버레이 숨기기
    }, 500);  // 0.5초 후에 로딩 오버레이 숨김 (추가 딜레이)
}

// 로딩 퍼센티지를 업데이트하는 함수
function updateLoadingPercentage(percentage) {
    const loadingPercentageElement = document.getElementById('loadingPercentage');
    loadingPercentageElement.textContent = `${percentage}%`;
}
