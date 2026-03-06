// js/pricing.js
// Silnik cen: marża platformy + marża sklepu + opcjonalny override per produkt + fallback do planu

export function round2(x) {
  const n = Number(x);
  if (!isFinite(n)) return 0;
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function roundTo99(x) {
  const n = Number(x);
  if (!isFinite(n) || n <= 0) return 0;
  const zl = Math.floor(n);
  return zl + 0.99;
}

export function formatPLN(x) {
  const n = round2(x);
  try {
    return new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(n);
  } catch {
    return `${n.toFixed(2)} zł`;
  }
}

const safeStr = (v) => String(v ?? '').trim();

function parsePct(raw) {
  const s = safeStr(raw).replace(',', '.');
  if (!s) return 0;
  const n = Number(s);
  if (!isFinite(n) || n <= 0) return 0;
  return n > 1 ? n / 100 : n;
}

function readJSONLS(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function getQueryParam(name) {
  try {
    const url = new URL(window.location.href);
    return safeStr(url.searchParams.get(name));
  } catch {
    return '';
  }
}

export function getActiveStoreSlug() {
  const fromUrl = getQueryParam('store');
  if (fromUrl) return fromUrl;
  try {
    return safeStr(localStorage.getItem('qm_active_store_v1'));
  } catch {
    return '';
  }
}

function getPlanFallbackMarginPct() {
  try {
    const planId = safeStr(localStorage.getItem('qm_user_plan_v1')) || 'basic';
    const map = { basic: 0.08, pro: 0.12, elite: 0.18 };
    return map[planId] ?? 0.08;
  } catch {
    return 0.08;
  }
}

export function getStoreMarginPct(opts = {}) {
  const slug = safeStr(opts.slug) || getActiveStoreSlug();
  const stores = readJSONLS('qm_stores_v1', {});

  if (slug && stores && stores[slug] && stores[slug].marginPct != null) {
    const pct = parsePct(stores[slug].marginPct);
    if (pct > 0) return pct;
  }

  try {
    const raw = localStorage.getItem('qm_store_margin_pct');
    const pct = parsePct(raw);
    if (pct > 0) return pct;
  } catch {}

  return getPlanFallbackMarginPct();
}

export function resolveMode(mode) {
  const m = safeStr(mode).toLowerCase();
  if (m === 'hurt' || m === 'detal') return m;
  if (m === 'b2b') return 'hurt';
  if (m === 'b2c') return 'detal';
  try {
    const ls = safeStr(localStorage.getItem('qm_mode_v1')).toLowerCase();
    if (ls === 'hurt' || ls === 'detal') return ls;
  } catch {}
  return 'detal';
}

function clampMargins(marginPct, mode) {
  const pct = parsePct(marginPct);
  if (mode === 'hurt') return Math.max(0.03, Math.min(pct, 0.30));
  return Math.max(0.05, Math.min(pct, 0.80));
}

export function priceFromBuy(buyNet, mode, rules, opts = {}) {
  const buy = Number(buyNet || 0);
  if (!isFinite(buy) || buy <= 0) return 0;

  const r = rules || {};
  const m = resolveMode(mode);
  const platformPct = m === 'hurt' ? Number(r.wholesalePct ?? 0.05) : Number(r.retailPct ?? 0.08);
  const baseStorePct = opts.storeMarginPct != null ? parsePct(opts.storeMarginPct) : getStoreMarginPct({ slug: opts.slug });

  const productPctRaw = opts.productMarginPct;
  const productPct = productPctRaw != null ? parsePct(productPctRaw) : 0;
  const productMode = safeStr(opts.productMarginMode).toLowerCase() || 'override';

  let storePct = baseStorePct;
  if (productPct > 0) {
    storePct = productMode === 'add' ? (baseStorePct + productPct) : productPct;
  }

  storePct = clampMargins(storePct, m);
  const pct = platformPct + storePct;
  let sell = buy * (1 + pct);

  const minProfit = Number(r.minProfit ?? 1.5);
  const minSell = buy + (isFinite(minProfit) ? minProfit : 1.5);
  if (sell < minSell) sell = minSell;

  if (m !== 'hurt' && r.retailEnds99 !== false) {
    sell = roundTo99(sell);
  } else {
    sell = round2(sell);
  }

  return sell;
}

export function priceFromProduct(product, mode, rules, opts = {}) {
  const p = product || {};
  const buy = Number(
    p.buyNet ?? p.buy_net ?? p.cena_zakupu ?? p.price_buy ?? p.cost_net ?? p.net ?? p.cost ?? 0
  );

  const marginOverride = p.marginPct ?? p.storeMarginPct ?? p.margin ?? p.store_margin_pct ?? null;
  const nextOpts = { ...opts };
  if (marginOverride != null && safeStr(marginOverride) !== '') {
    nextOpts.productMarginPct = marginOverride;
    if (!nextOpts.productMarginMode) nextOpts.productMarginMode = 'override';
  }

  return priceFromBuy(buy, mode, rules, nextOpts);
}

try {
  window.QM_PRICE = {
    priceFromBuy,
    priceFromProduct,
    formatPLN,
    round2,
    roundTo99,
    getStoreMarginPct,
    getActiveStoreSlug,
    resolveMode,
  };
} catch {}
