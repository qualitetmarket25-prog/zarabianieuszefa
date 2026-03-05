// js/pricing.js (ESM)
// Silnik cen: marża platformy + marża sklepu (multi-store) + opcjonalny override per produkt

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

// ===== helpers =====
const safeStr = (v) => String(v ?? "").trim();

function parsePct(raw) {
  const s = safeStr(raw);
  if (!s) return 0;
  const n = Number(s.replace(",", "."));
  if (!isFinite(n) || n <= 0) return 0;
  // jeśli ktoś wpisze 12 zamiast 0.12 -> traktujemy jako procent
  return n > 1 ? (n / 100) : n;
}

function getQueryParam(name) {
  try {
    const u = new URL(window.location.href);
    return safeStr(u.searchParams.get(name));
  } catch {
    return "";
  }
}

function readJSONLS(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Aktywny sklep (slug) — najpierw z URL ?store=..., potem z localStorage qm_active_store_v1
 */
export function getActiveStoreSlug() {
  const fromUrl = getQueryParam("store");
  if (fromUrl) return fromUrl;

  try {
    const ls = safeStr(localStorage.getItem("qm_active_store_v1"));
    return ls || "";
  } catch {
    return "";
  }
}

/**
 * Marża sklepu (multi-store)
 * Źródła (w kolejności):
 *  1) qm_stores_v1[slug].marginPct (slug z ?store=... lub qm_active_store_v1)
 *  2) localStorage qm_store_margin_pct (np. "0.12" albo "12")
 */
export function getStoreMarginPct(opts = {}) {
  // opts.slug może nadpisać wykrywanie
  const slug = safeStr(opts.slug) || getActiveStoreSlug();

  // 1) store config
  const stores = readJSONLS("qm_stores_v1");
  if (stores && slug && stores[slug] && stores[slug].marginPct != null) {
    const pct = parsePct(stores[slug].marginPct);
    if (pct > 0) return pct;
  }

  // 2) fallback LS
  try {
    const raw = localStorage.getItem("qm_store_margin_pct");
    return parsePct(raw);
  } catch {
    return 0;
  }
}

/**
 * Ustal tryb cenowy:
 * - preferuj jawny arg
 * - fallback: localStorage qm_mode_v1 = "detal"|"hurt"
 * - fallback: "detal"
 */
export function resolveMode(mode) {
  const m = safeStr(mode).toLowerCase();
  if (m === "hurt" || m === "detal") return m;

  try {
    const ls = safeStr(localStorage.getItem("qm_mode_v1")).toLowerCase();
    if (ls === "hurt" || ls === "detal") return ls;
  } catch {}
  return "detal";
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
 * opts:
 *  {
 *    slug?: "masarnia24",
 *    storeMarginPct?: 0.12,          // wymuszenie marży sklepu
 *    productMarginPct?: 0.03         // override per produkt (dodatkowa lub pełna — patrz niżej)
 *    productMarginMode?: "add"|"override" // domyślnie "override"
 *  }
 */
export function priceFromBuy(buyNet, mode, rules, opts = {}) {
  const buy = Number(buyNet || 0);
  if (!isFinite(buy) || buy <= 0) return 0;

  const r = rules || {};
  const m = resolveMode(mode);

  const platformPct = (m === "hurt")
    ? Number(r.wholesalePct ?? 0.05)
    : Number(r.retailPct ?? 0.08);

  const baseStorePct = (opts.storeMarginPct != null)
    ? parsePct(opts.storeMarginPct)
    : getStoreMarginPct({ slug: opts.slug });

  // override per produkt
  const productPctRaw = opts.productMarginPct;
  const productPct = (productPctRaw != null) ? parsePct(productPctRaw) : 0;
  const productMode = safeStr(opts.productMarginMode).toLowerCase() || "override";

  let storePct = baseStorePct;
  if (productPct > 0) {
    storePct = (productMode === "add") ? (baseStorePct + productPct) : productPct;
  }

  const pct = platformPct + storePct;
  let sell = buy * (1 + pct);

  // minimalna marża kwotowa
  const minProfit = Number(r.minProfit ?? 0);
  const minSell = buy + (isFinite(minProfit) ? minProfit : 0);
  if (sell < minSell) sell = minSell;

  // detal końcówka .99
  if (m !== "hurt" && r.retailEnds99) {
    sell = roundTo99(sell);
  } else {
    sell = round2(sell);
  }

  return sell;
}

/**
 * Wygodna funkcja: licz cenę z obiektu produktu
 * Obsługuje różne nazwy pól spotykane w CSV:
 * - buyNet / buy_net / cena_zakupu / price_buy / cost_net / net
 * oraz override marży:
 * - product.marginPct / product.storeMarginPct / product.margin / product.store_margin_pct
 */
export function priceFromProduct(product, mode, rules, opts = {}) {
  const p = product || {};
  const buy =
    Number(p.buyNet ?? p.buy_net ?? p.cena_zakupu ?? p.price_buy ?? p.cost_net ?? p.net ?? 0);

  const marginOverride =
    (p.marginPct ?? p.storeMarginPct ?? p.margin ?? p.store_margin_pct);

  const nextOpts = { ...opts };
  if (marginOverride != null && safeStr(marginOverride) !== "") {
    nextOpts.productMarginPct = marginOverride;
    // domyślnie: jeśli produkt ma marginPct, traktuj to jako pełną marżę sklepu (override)
    if (!nextOpts.productMarginMode) nextOpts.productMarginMode = "override";
  }

  return priceFromBuy(buy, mode, rules, nextOpts);
}

// ✅ globalne API dla istniejących skryptów (shop.js, itp.)
try {
  window.QM_PRICE = {
    priceFromBuy,
    priceFromProduct,
    formatPLN,
    round2,
    roundTo99,
    getStoreMarginPct,
    getActiveStoreSlug,
    resolveMode
  };
} catch {}
