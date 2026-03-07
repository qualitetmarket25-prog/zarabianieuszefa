// ===== STORAGE KEYS =====

const KEY_PLAN = "qm_user_plan_v1";
const KEY_STATUS = "qm_subscription_status_v1";
const KEY_MARGIN = "qm_store_margin_pct";
const KEY_PRODUCTS = "qm_products_by_supplier_v1";
const KEY_ACTIVE_STORE = "qm_active_store_v1";

function getPlan() {
  return localStorage.getItem(KEY_PLAN) || "BASIC";
}

function isPro() {
  return getPlan() === "PRO" || getPlan() === "ELITE";
}

function isElite() {
  return getPlan() === "ELITE";
}

function getMargin() {
  const m = localStorage.getItem(KEY_MARGIN);
  return m ? parseFloat(m) : 30;
}

function setMargin(v) {
  localStorage.setItem(KEY_MARGIN, v);
}

function getProducts() {
  const raw = localStorage.getItem(KEY_PRODUCTS);
  return raw ? JSON.parse(raw) : {};
}

function saveProducts(obj) {
  localStorage.setItem(KEY_PRODUCTS, JSON.stringify(obj));
}

function addSupplierProducts(name, products) {
  const all = getProducts();
  all[name] = products;
  saveProducts(all);
}

function applyMargin(price) {
  const margin = getMargin();
  const finalPrice = price + (price * margin / 100);
  return Math.round(finalPrice * 100) / 100;
}
