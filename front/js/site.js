document.addEventListener('DOMContentLoaded', function() {
  const siteSelect = document.getElementById('site');
  const lineSelect = document.getElementById('line');

  siteSelect.addEventListener('change', function() {
      const siteSelection = this.value;

      const lineOptions = {
          "PT": ["P1F", "P1D", "P2F", "P2D", "P2-S5", "P3F", "P3D", "P3-S5", "P4F", "P4D", "P4-S5", "Training"],
          "HS": ["12L", "13L", "15L", "16L", "17L", "S1", "S3", "S4", "S3V", "NRD", "NRDK", "NRD-V", "U4", "M1", "5L", "G1L", "Training"],
          "IC": ["M10", "M14", "M16", "R3", "Training"],
          "CJ": ["M11", "M12", "M15", "Training"],
          "PSKH": ["PSKH", "C1", "C2", "C3", "C5", "Training"],
          "USA-Portland": ["INTEL", "Training"],
          "USA-Arizona": ["INTEL", "Training"],
          "USA-Texas": ["TEXAS INSTRUMENT", "Training"],
          "Ireland": ["INTEL", "Training"],
          "Japan-Hiroshima": ["MICRON", "Training"],
          "China-Wuxi": ["HYNIX", "Training"],
          "China-Xian": ["HYNIX", "SAMSUNG", "Training"],
          "China-Shanghai": ["GTX", "Training"],
          "China-Beijing": ["JIDIAN", "Training"],
          "Taiwan-Taichoung": ["MICRON", "Training"],
          "SINGAPORE": ["MICRON", "Training"],
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