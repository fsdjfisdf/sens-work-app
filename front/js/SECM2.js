document.addEventListener('DOMContentLoaded', async () => {
    // Leaflet.js 지도 초기화
    const map = L.map('koreaMapContainer', {
        center: [36.9921, 127.1128], // 평택 중심 좌표
        zoom: 8.5, // 초기 줌 레벨
    });

    // OSM 타일 추가
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors'
    }).addTo(map);

    // 지역 좌표 정의
    const locations = {
        '평택': { lat: 36.9921, lng: 127.1128 },
        '화성': { lat: 37.1995, lng: 126.8315 },
        '이천': { lat: 37.2728, lng: 127.4348 },
        '청주': { lat: 36.6424, lng: 127.4891 },
        '천안': { lat: 36.8151, lng: 127.1139 }
    };

    // 설비 매핑 정의
    const capaMapping = {
        'PEE1 PT': ['SUPRA N SET UP', 'SUPRA N MAINT', 'SUPRA XP SET UP', 'SUPRA XP MAINT'],
        'PEE2 PT': ['INTEGER SET UP', 'INTEGER MAINT', 'PRECIA SET UP'],
        'PEE1 HS': ['SUPRA N SET UP', 'SUPRA N MAINT', 'SUPRA XP SET UP', 'SUPRA XP MAINT'],
        'PEE2 HS': ['INTEGER SET UP', 'INTEGER MAINT', 'PRECIA SET UP'],
        'PEE1 IC': ['SUPRA N SET UP', 'SUPRA N MAINT', 'SUPRA XP SET UP', 'SUPRA XP MAINT', 'PRECIA SET UP'],
        'PEE1 CJ': ['SUPRA N SET UP', 'SUPRA N MAINT', 'SUPRA XP SET UP', 'SUPRA XP MAINT', 'PRECIA SET UP'],
        'PSKH PSKH': ['ECOLITE SET UP', 'GENEVA SET UP', 'SUPRA N SET UP', 'SUPRA XP SET UP']
    };

    // 데이터 가져오기
    async function fetchData() {
        try {
            const response = await fetch('http://3.37.73.151:3001/api/secm'); // 엔지니어 데이터 API
            return await response.json();
        } catch (error) {
            console.error('Error fetching data:', error);
            return [];
        }
    }

    // 설비별 평균 CAPA 계산
    function calculateAverageCapas(data) {
        const results = {};
        Object.keys(capaMapping).forEach(group => {
            results[group] = {};
            capaMapping[group].forEach(capa => {
                const filtered = data.filter(row => `${row.GROUP} ${row.SITE}` === group);
                const total = filtered.reduce((sum, row) => sum + (row[capa] || 0), 0);
                results[group][capa] = filtered.length ? ((total / filtered.length) * 100).toFixed(1) + '%' : 'N/A';
            });
        });
        return results;
    }

    // 지역별 엔지니어 수 계산
    function calculateEngineersByLocation(data) {
        const engineerCounts = {
            '평택': { 'PEE1 PT': { count: 0, totalLevel: 0 }, 'PEE2 PT': { count: 0, totalLevel: 0 } },
            '화성': { 'PEE1 HS': { count: 0, totalLevel: 0 }, 'PEE2 HS': { count: 0, totalLevel: 0 } },
            '이천': { 'PEE1 IC': { count: 0, totalLevel: 0 } },
            '청주': { 'PEE1 CJ': { count: 0, totalLevel: 0 } },
            '천안': { 'PSKH PSKH': { count: 0, totalLevel: 0 } }
        };

        const siteMapping = {
            'PT': '평택',
            'HS': '화성',
            'IC': '이천',
            'CJ': '청주',
            'PSKH': '천안'
        };

        data.forEach(row => {
            const siteName = siteMapping[row.SITE];
            if (siteName && engineerCounts[siteName]) {
                const groupKey = `${row.GROUP} ${row.SITE}`;
                if (engineerCounts[siteName][groupKey] !== undefined) {
                    engineerCounts[siteName][groupKey].count++;
                    engineerCounts[siteName][groupKey].totalLevel += row.LEVEL || 0; // LEVEL 값이 없으면 0으로 처리
                }
            }
        });

        Object.values(engineerCounts).forEach(groups => {
            Object.values(groups).forEach(groupData => {
                groupData.avgLevel = groupData.count > 0 ? (groupData.totalLevel / groupData.count).toFixed(1) : 'N/A';
            });
        });

        return engineerCounts;
    }

    // 마커 추가
// 마커 추가
function addMarkers(engineerCounts, averageCapas) {
    Object.entries(locations).forEach(([site, coords]) => {
        const siteCounts = engineerCounts[site];
        const tableRows = Object.entries(siteCounts)
            .map(([group, data]) => {
                const capaCells = [
                    capaMapping[group]?.includes('SUPRA N SET UP') ? averageCapas[group]?.['SUPRA N SET UP'] || '-' : '-',
                    capaMapping[group]?.includes('SUPRA N MAINT') ? averageCapas[group]?.['SUPRA N MAINT'] || '-' : '-',
                    capaMapping[group]?.includes('SUPRA XP SET UP') ? averageCapas[group]?.['SUPRA XP SET UP'] || '-' : '-',
                    capaMapping[group]?.includes('SUPRA XP MAINT') ? averageCapas[group]?.['SUPRA XP MAINT'] || '-' : '-',
                    capaMapping[group]?.includes('INTEGER SET UP') ? averageCapas[group]?.['INTEGER SET UP'] || '-' : '-',
                    capaMapping[group]?.includes('INTEGER MAINT') ? averageCapas[group]?.['INTEGER MAINT'] || '-' : '-',
                    capaMapping[group]?.includes('PRECIA SET UP') ? averageCapas[group]?.['PRECIA SET UP'] || '-' : '-',
                    capaMapping[group]?.includes('ECOLITE SET UP') ? averageCapas[group]?.['ECOLITE SET UP'] || '-' : '-',
                    capaMapping[group]?.includes('GENEVA SET UP') ? averageCapas[group]?.['GENEVA SET UP'] || '-' : '-'
                ];

                return `
                    <tr>
                        <td>${group}</td>
                        <td>${site}</td>
                        <td>${data.count}명</td>
                        <td>${data.avgLevel}</td>
                        ${capaCells.map(value => `<td>${value}</td>`).join('')}
                    </tr>
                `;
            })
            .join('');

        const popupContent = `
            <div class="custom-popup">
                <div class="custom-popup-content">
                    <h4 style="text-align: center; margin-bottom: 10px;">${site}</h4>
                    <table>
                        <thead>
                            <tr>
                                <th rowspan="2">GROUP</th>
                                <th rowspan="2">SITE</th>
                                <th rowspan="2">인원 수</th>
                                <th rowspan="2">Level</th>
                                <th colspan="2">SUPRA</th>
                                <th colspan="2">SUPRA XP</th>
                                <th colspan="2">INTEGER</th>
                                <th>PRECIA</th>
                                <th>ECOLITE</th>
                                <th>GENEVA</th>
                            </tr>
                            <tr>
                                <th>SET UP</th>
                                <th>MAINT</th>
                                <th>SET UP</th>
                                <th>MAINT</th>
                                <th>SET UP</th>
                                <th>MAINT</th>
                                <th>SET UP</th>
                                <th>SET UP</th>
                                <th>SET UP</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tableRows}
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        const marker = L.marker([coords.lat, coords.lng]).addTo(map);
        marker.bindPopup(popupContent);
    });
}


// 지도 초기화
async function initializeMap() {
    const data = await fetchData();
    const engineerCounts = calculateEngineersByLocation(data);
    const averageCapas = calculateAverageCapas(data);
    addMarkers(engineerCounts, averageCapas);
}

initializeMap();



});