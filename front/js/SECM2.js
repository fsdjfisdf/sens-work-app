document.addEventListener('DOMContentLoaded', async () => {
    // Kakao Maps SDK가 로드되었는지 확인
    if (typeof kakao === 'undefined') {
        console.error('Kakao Maps SDK is not loaded. Check the script inclusion and appkey.');
        return;
    }

    const mapContainer = document.getElementById('koreaMapContainer');
    if (!mapContainer) {
        console.error('Map container not found.');
        return;
    }

    let originalData = [];

    // 지도 초기화
    const map = new kakao.maps.Map(mapContainer, {
        center: new kakao.maps.LatLng(36.2683, 127.6358), // 대한민국 중심 좌표
        level: 10 // 확대 수준
    });

    // 지역 좌표 정의
    const locations = {
        '평택': { lat: 36.9921, lng: 127.1128 },
        '화성': { lat: 37.1995, lng: 126.8315 },
        '이천': { lat: 37.2728, lng: 127.4348 },
        '청주': { lat: 36.6424, lng: 127.4891 },
        '천안': { lat: 36.8151, lng: 127.1139 }
    };

    async function fetchData() {
        try {
            const response = await fetch('http://3.37.73.151:3001/api/secm');
            const data = await response.json();
            originalData = data;
            return data;
        } catch (error) {
            console.error('Error fetching or processing data:', error);
            return [];
        }
    }

    function calculateEngineersByLocation(data) {
        const engineerCounts = {
            '평택': 0,
            '화성': 0,
            '이천': 0,
            '청주': 0,
            '천안': 0
        };

        data.forEach(row => {
            if (engineerCounts[row.SITE]) {
                engineerCounts[row.SITE]++;
            }
        });

        return engineerCounts;
    }

    function addMarkers(engineerCounts) {
        Object.entries(locations).forEach(([site, coords]) => {
            const markerPosition = new kakao.maps.LatLng(coords.lat, coords.lng);

            const marker = new kakao.maps.Marker({
                position: markerPosition,
                map: map
            });

            const infoWindow = new kakao.maps.InfoWindow({
                content: `<div style="padding:5px; font-size:14px;">${site}: ${engineerCounts[site] || 0}명</div>`
            });

            kakao.maps.event.addListener(marker, 'mouseover', () => {
                infoWindow.open(map, marker);
            });

            kakao.maps.event.addListener(marker, 'mouseout', () => {
                infoWindow.close();
            });
        });
    }

    async function initializeMap() {
        const data = await fetchData();
        const engineerCounts = calculateEngineersByLocation(data);
        addMarkers(engineerCounts);
    }

    initializeMap();
});
