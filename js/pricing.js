// js/pricing.js
// Silnik cen: marża DETAL / HURT + zaokrąglenia

export function round2(x) {
  const n = Number(x);
  if (!isFinite(n)) return 0;
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

// detal -> końcówka .99
export function roundTo99(x) {
  const n = Number(x);
  if (!isFinite(n) || n <= 0) return 0;
  const zl = Math.floor(n);
  return zl + 0.99;
}

/**
 * buyNet: cena zakupu netto (liczba)
 * mode: "detal" | "hurt"
 * rules:
 *  {
 *    retailPct: 0.08,
 *    wholesalePct: 0.05,
 *    minProfit: 1.5,
 *    retailEnds99: true
 *  }
 */
export function priceFromBuy(buyNet, mode, rules) {
  const buy = Number(buyNet || 0);
  if (!isFinite(buy) || buy <= 0) return 0;

  const r = rules || {};
  const pct = mode === "hurt" ? Number(r.wholesalePct ?? 0.05) : Number(r.retailPct ?? 0.08);

  let sell = buy * (1 + pct);

  // minimalna marża kwotowa
  const minProfit = Number(r.minProfit ?? 0);
  const minSell = buy + (isFinite(minProfit) ? minProfit : 0);
  if (sell < minSell) sell = minSell;

  // detal końcówka .99
  if (mode !== "hurt" && r.retailEnds99) {
    sell = roundTo99(sell);
  } else {
    sell = round2(sell);
  }
  return sell;
}

// helper: format PL
export function formatPLN(x) {
  const n = round2(x);
  try {
    return new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN" }).format(n);
  } catch {
    return `${n.toFixed(2)} zł`;
  }
}
