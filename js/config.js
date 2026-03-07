// js/config.js
// GLOBAL CONFIG — QUALITET

const QM_CONFIG = {
  STORAGE_KEYS: {
    PLAN: "qm_plan_v1",
    PRODUCTS: "qm_products_by_supplier_v1",
    STORES: "qm_stores_v1",
    ACTIVE_STORE: "qm_active_store_v1",
    ORDERS: "qm_orders_v1",
    MARGIN: "qm_store_margin_pct"
  },

  PLANS: {
    basic: 0,
    pro: 1,
    elite: 2
  },

  PAGE_REQUIREMENTS: {
    "hurtownie.html": "pro",
    "qualitetmarket.html": "pro",
    "intelligence.html": "elite"
  }
};



function qmGetPlan() {
  const p = localStorage.getItem(QM_CONFIG.STORAGE_KEYS.PLAN);
  return p || "basic";
}


function qmSetPlan(plan) {
  localStorage.setItem(
    QM_CONFIG.STORAGE_KEYS.PLAN,
    plan
  );
}


function qmHasAccess(required) {

  if (!required) return true;

  const current = qmGetPlan();

  return (
    QM_CONFIG.PLANS[current] >=
    QM_CONFIG.PLANS[required]
  );
}



function qmCheckPageAccess() {

  const file = location.pathname.split("/").pop();

  const required =
    QM_CONFIG.PAGE_REQUIREMENTS[file];

  if (!required) return;

  if (!qmHasAccess(required)) {

    alert(
      "Ta strona wymaga planu: " +
        required.toUpperCase()
    );

    location.href = "cennik.html";
  }
}


document.addEventListener(
  "DOMContentLoaded",
  qmCheckPageAccess
);