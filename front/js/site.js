document.addEventListener('DOMContentLoaded', function() {
  const siteSelect = document.getElementById('site');
  const lineSelect = document.getElementById('line');

  siteSelect.addEventListener('change', function() {
      const siteSelection = this.value;

      const lineOptions = {
          "PT": ["P1F", "P1D", "P2F", "P2D", "P2-S5", "P3F", "P3D", "P3-S5", "P4F", "P4D", "P4-S5"],
          "HS": ["12L", "13L", "15L", "16L", "17L", "S1", "S3", "S4", "S3V", "NRD", "NRDK", "NRD-V", "U4", "M1", "5L"],
          "IC": ["M10", "M14", "M16", "R3"],
          "CJ": ["M11", "M12", "M15"],
          "PSKH": ["PSKH", "C1", "C2", "C3", "C5"],
          "USA-Portland": ["INTEL"],
          "USA-Arizona": ["INTEL"],
          "Ireland": ["INTEL"],
          "Japan-Hiroshiama": ["MICRON"],
          "China-Wuxi": ["HYNIX"],
          "China-Xian": ["HYNIX"],
          "China-Shanghai": ["GTX"],
          "China-Beijing": ["JIDIAN"],
          "Taiwan-Taichoung": ["MICRON"],
          "SINGAPORE": ["MICRON"],

      };

      lineSelect.innerHTML = '<option value="SELECT">SELECT</option>';
      if (lineOptions[siteSelection]) {
          lineOptions[siteSelection].forEach(function(line) {
              const option = document.createElement('option');
              option.value = option.textContent = line;
              lineSelect.appendChild(option);
          });
      }
  });
});