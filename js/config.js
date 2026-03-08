// js/config.js
// GLOBAL CONFIG — QUALITET
// Wersja zgodna z:
// - starym kodem używającym QM_CONFIG.STORAGE_KEYS / PAGE_REQUIREMENTS
// - guardem używającym QM_CONFIG.storageKeys / pageAccess / redirects

(function () {
  "use strict";

  var STORAGE_KEYS = {
    PLAN: "qm_plan_v1",
    PRODUCTS: "qm_products_by_supplier_v1",
    INTEL_PREFILL: "qm_intel_prefill_v1",
    LISTING_PREFILL: "qm_listing_prefill_v1",
    CRM: "qm_crm_v1",
    STORES: "qm_stores_v1",
    ACTIVE_STORE: "qm_active_store_v1",
    ORDERS: "qm_orders_v1",
    MARGIN: "qm_store_margin_pct",

    // kompatybilność z planGuard.js
    plan: "qm_plan_v1",
    products: "qm_products_by_supplier_v1",
    intelPrefill: "qm_intel_prefill_v1",
    listingPrefill: "qm_listing_prefill_v1",
    crm: "qm_crm_v1",
    stores: "qm_stores_v1",
    activeStore: "qm_active_store_v1",
    orders: "qm_orders_v1",
    margin: "qm_store_margin_pct",

    // opcjonalne klucze auth — guard ich szuka, więc dajemy fallback
    token: "qm_token_v1",
    auth: "qm_auth_v1",
    user: "qm_user_v1",
    subscription: "qm_subscription_v1"
  };

  var PLANS = {
    basic: 1,
    pro: 2,
    elite: 3
  };

  var PAGE_REQUIREMENTS = {
    "hurtownie.html": "pro",
    "qualitetmarket.html": "pro",
    "intelligence.html": "elite"
  };

  var REDIRECTS = {
    noLogin: "login.html",
    noAccess: "cennik.html",
    noStore: "generator-sklepu.html"
  };

  function normalizePlan(plan) {
    var value = String(plan || "basic").toLowerCase().trim();

    if (!PLANS[value]) {
      return "basic";
    }

    return value;
  }

  function readStorage(key, fallback) {
    try {
      var value = localStorage.getItem(key);
      return value === null ? fallback : value;
    } catch (error) {
      return fallback;
    }
  }

  function writeStorage(key, value) {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      return false;
    }
  }

  function getCurrentPage() {
    var file = location.pathname.split("/").pop();
    return file || "index.html";
  }

  function qmGetPlan() {
    var raw =
      readStorage(STORAGE_KEYS.plan, "") ||
      readStorage(STORAGE_KEYS.PLAN, "");

    return normalizePlan(raw);
  }

  function qmSetPlan(plan) {
    var normalized = normalizePlan(plan);
    writeStorage(STORAGE_KEYS.plan, normalized);
    writeStorage(STORAGE_KEYS.PLAN, normalized);
    return normalized;
  }

  function qmHasAccess(requiredPlan) {
    if (!requiredPlan) return true;

    var current = qmGetPlan();
    var currentValue = PLANS[current] || PLANS.basic;
    var requiredValue = PLANS[normalizePlan(requiredPlan)] || PLANS.basic;

    return currentValue >= requiredValue;
  }

  function qmCheckPageAccess() {
    var file = getCurrentPage();
    var required = PAGE_REQUIREMENTS[file];

    if (!required) return true;
    if (qmHasAccess(required)) return true;

    alert("Ta strona wymaga planu: " + String(required).toUpperCase());
    location.href = REDIRECTS.noAccess;
    return false;
  }

  window.QM_CONFIG = {
    // NOWY FORMAT / guard
    storageKeys: STORAGE_KEYS,
    plans: PLANS,
    pageAccess: PAGE_REQUIREMENTS,
    redirects: REDIRECTS,

    // STARY FORMAT / kompatybilność
    STORAGE_KEYS: STORAGE_KEYS,
    PLANS: PLANS,
    PAGE_REQUIREMENTS: PAGE_REQUIREMENTS,
    REDIRECTS: REDIRECTS
  };

  // global helpery dla reszty projektu
  window.qmGetPlan = qmGetPlan;
  window.qmSetPlan = qmSetPlan;
  window.qmHasAccess = qmHasAccess;
  window.qmCheckPageAccess = qmCheckPageAccess;
})();