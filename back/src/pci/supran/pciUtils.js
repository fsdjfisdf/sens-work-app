// src/pci/supran/pciUtils.js
const { workerAliases } = require("./pciConfig");

/** "정현우(main), 김동한(support)" → [{name, weight}] */
exports.parseTaskMen = (taskManRaw) => {
  if (!taskManRaw) return [];
  const tokens = taskManRaw.split(/[,;/|·]+/).map(t => t.trim()).filter(Boolean);
  return tokens.map(t => {
    const isSupport = /\(support\)/i.test(t);
    const name = workerAliases(t.replace(/\(.*?\)/g, "").trim());
    return { name, weight: isSupport ? 0.2 : 1.0, raw: t };
  });
};

exports.round1 = x => Math.round(x * 10) / 10;
exports.clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
