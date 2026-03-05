// js/pricing.js (ESM)
// Silnik cen: marża platformy + marża sklepu (multi-store)

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

export function formatPLN(x) {
  const n = round2(x);
  try {
    return new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN" }).format(n);
  } catch {
    return `${n.toFixed(2)} zł`;
  }
}

/**
 * Marża sklepu (multi-store)
 * localStorage:
 *  - qm_store_margin_pct : np. "0.12" albo "12" (oba zadziałają)
 */
export function getStoreMarginPct() {
  let raw = "";
  try { raw = String(localStorage.getItem("qm_store_margin_pct") || "").trim(); } catch {}
  if (!raw) return 0;

  const n = Number(raw.replace(",", "."));
  if (!isFinite(n) || n <= 0) return 0;

  // jeśli ktoś wpisze 12 zamiast 0.12 -> traktujemy jako procent
  return n > 1 ? (n / 100) : n;
}

/**
 * buyNet - cena zakupu netto
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
  const platformPct = (mode === "hurt")
    ? Number(r.wholesalePct ?? 0.05)
    : Number(r.retailPct ?? 0.08);

  const storePct = getStoreMarginPct(); // ✅ multi-store
  const pct = platformPct + storePct;

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

// ✅ wygodne globalne API dla istniejących skryptów (shop.js, itp.)
try {
  window.QM_PRICE = { priceFromBuy, formatPLN, round2, roundTo99, getStoreMarginPct };
} catch {}
