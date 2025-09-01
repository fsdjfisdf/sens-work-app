// src/pci/integer_setup/pciUtils.js
const { workerAliases } = require("./pciConfig");

/** "홍길동(main), 김철수(support)" → [{name, weight}] */
exports.parseTaskMen = (taskManRaw) => {
  if (!taskManRaw) return [];
  const tokens = taskManRaw
    .split(/[,;/|·]+/)
    .map((t) => t.trim())
    .filter(Boolean);
  return tokens.map((t) => {
    const isSupport = /\(support\)/i.test(t);
    const name = workerAliases(t.replace(/\(.*?\)/g, "").trim());
    return { name, weight: isSupport ? 0.1 : 1.0, raw: t };
  });
};

exports.round1 = (x) => Math.round((Number(x) || 0) * 10) / 10;
exports.clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
