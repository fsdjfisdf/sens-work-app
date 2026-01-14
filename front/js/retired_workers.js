/* ==========================================================================
  retired_workers.js
  - PCI 화면에서 "퇴사자" 이름을 숨기고 평균/집계에서도 제외하기 위한 목록 파일
  - 사용법:
    1) 이 파일에 퇴사자 이름을 배열로 추가
    2) pci_integer.html 에서 pci_integer.js 보다 먼저 로드
    3) pci_integer.js 에서는 window.RETIRED_WORKERS 를 참고해 필터링
  ========================================================================== */

(function (global) {
  "use strict";

  // ✅ 여기에 퇴사자 이름을 정확히 추가하세요 (표시/계산 모두 제외됨)
  const RETIRED = [
     "김동현", "손상일", "김시우", "민동찬", "정서후", "이승우", "홍준기", "장진호", "강승현", //INTEGER 퇴사자
     "김기명", "정지혁", "김희수", "홍정욱", "강원준", //SUPRA 퇴사자
     "에상민", "장재웅", "최종현" //PSKH 퇴사자
  ];

  // 공백/중복 정리 + Set으로 보관
  const set = new Set(
    RETIRED
      .map(n => String(n || "").trim())
      .filter(Boolean)
  );

  // 전역으로 노출
  global.RETIRED_WORKERS = set;

  // 이름이 퇴사자인지 체크
  global.isRetiredWorker = function (name) {
    const n = String(name || "").trim();
    return n ? set.has(n) : false;
  };

  // 리스트에서 퇴사자 제거
  global.filterActiveWorkers = function (names) {
    const arr = Array.isArray(names) ? names : [];
    return arr.filter(n => !global.isRetiredWorker(n));
  };

})(window);
