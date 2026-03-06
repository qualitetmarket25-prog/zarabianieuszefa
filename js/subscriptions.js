(function () {
  "use strict";

  const LS_PLAN = "qm_user_plan_v1";
  const LS_MARGIN = "qm_store_margin_pct";
  const LS_SUB_STATUS = "qm_subscription_status_v1";
  const LS_SUB_PLAN = "qm_subscription_plan_v1";
  const LS_SUB_SOURCE = "qm_subscription_source_v1";
  const LS_SUB_UPDATED = "qm_subscription_updated_at_v1";

  const plans = {
    basic: {
      id: "basic",
      label: "BASIC",
      price: 49,
      defaultMargin: 0.12,
      features: [
        "Wejście startowe do platformy",
        "Podgląd modułów i sklepu",
        "Niski próg wejścia",
        "Plan startowy"
      ]
    },
    pro: {
      id: "pro",
      label: "PRO",
      price: 149,
      defaultMargin: 0.18,
      features: [
        "Pełny panel sklepu i sprzedaży",
        "Dostęp do hurtowni premium",
        "Lepsza marża i większy potencjał",
        "Plan główny do sprzedaży"
      ]
    },
    elite: {
      id: "elite",
      label: "ELITE",
      price: 299,
      defaultMargin: 0.24,
      features: [
        "Wszystko z PRO",
        "Dostęp do AI pomocnika",
        "Najwyższa marża domyślna",
        "Najmocniejszy plan do skalowania"
      ]
    }
  };

  /*
    TU WKLEISZ PÓŹNIEJ PRAWDZIWE LINKI PŁATNOŚCI
    np.
    basic: "https://buy.stripe.com/....",
    pro:   "https://buy.stripe.com/....",
    elite: "https://buy.stripe.com/...."
  */
  const CHECKOUT_LINKS = {
    basic: "",
    pro: "",
    elite: ""
  };

  function safeGet(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      return value == null ? fallback : value;
    } catch (e) {
      return fallback;
    }
  }

  function safeSet(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (e) {}
  }

  function normalizePlanId(planId) {
    const raw = String(planId || "").toLowerCase().trim();
    return plans[raw] ? raw : "basic";
  }

  function getPlanConfig(planId) {
    return plans[normalizePlanId(planId)];
  }

  function getPlanId() {
    return normalizePlanId(safeGet(LS_PLAN, "basic"));
  }

  function getPlan() {
    return getPlanConfig(getPlanId());
  }

  function getCheckoutUrl(planId) {
    const id = normalizePlanId(planId);
    const url = String(CHECKOUT_LINKS[id] || "").trim();
    return /^https?:\/\//i.test(url) ? url : "";
  }

  function getDefaultMarginFromPlan(planId) {
    return getPlanConfig(planId).defaultMargin;
  }

  function activatePlan(planId, meta) {
    const plan = getPlanConfig(planId);
    const source = meta && meta.source ? String(meta.source) : "local";
    const status = meta && meta.status ? String(meta.status) : "active";

    safeSet(LS_PLAN, plan.id);
    safeSet(LS_MARGIN, String(plan.defaultMargin));
    safeSet(LS_SUB_STATUS, status);
    safeSet(LS_SUB_PLAN, plan.id);
    safeSet(LS_SUB_SOURCE, source);
    safeSet(LS_SUB_UPDATED, new Date().toISOString());

    try {
      document.documentElement.setAttribute("data-plan", plan.id);
      if (document.body) document.body.setAttribute("data-plan", plan.id);
    } catch (e) {}

    return plan;
  }

  function hasAccess(requiredPlan) {
    const order = { basic: 1, pro: 2, elite: 3 };
    return order[getPlanId()] >= order[normalizePlanId(requiredPlan)];
  }

  function getSubscriptionStatus() {
    return {
      planId: getPlanId(),
      plan: getPlan(),
      status: String(safeGet(LS_SUB_STATUS, "inactive") || "inactive"),
      source: String(safeGet(LS_SUB_SOURCE, "none") || "none"),
      updatedAt: String(safeGet(LS_SUB_UPDATED, "") || "")
    };
  }

  function applyPlanToDom() {
    const plan = getPlan();
    const margin = getDefaultMarginFromPlan(plan.id);

    try {
      document.documentElement.setAttribute("data-plan", plan.id);
      if (document.body) document.body.setAttribute("data-plan", plan.id);

      document.querySelectorAll("[data-plan-label]").forEach((node) => {
        node.textContent = plan.label;
      });

      document.querySelectorAll("[data-plan-margin]").forEach((node) => {
        node.textContent = Math.round(margin * 100) + "%";
      });

      document.querySelectorAll("[data-require]").forEach((node) => {
        const req = normalizePlanId(node.getAttribute("data-require") || "basic");
        const ok = hasAccess(req);
        node.classList.toggle("is-locked", !ok);
        if (!ok) node.setAttribute("aria-disabled", "true");
        else node.removeAttribute("aria-disabled");
      });

      document.querySelectorAll("[data-plan-only]").forEach((node) => {
        const only = normalizePlanId(node.getAttribute("data-plan-only") || "basic");
        node.hidden = plan.id !== only;
      });

      document.querySelectorAll("[data-plan-hide]").forEach((node) => {
        const hideFor = normalizePlanId(node.getAttribute("data-plan-hide") || "basic");
        node.hidden = plan.id === hideFor;
      });
    } catch (e) {}
  }

  function openCheckout(planId) {
    const plan = getPlanConfig(planId);
    const checkoutUrl = getCheckoutUrl(plan.id);

    if (checkoutUrl) {
      try {
        window.location.href = checkoutUrl;
        return { ok: true, mode: "checkout", plan };
      } catch (e) {
        return { ok: false, mode: "checkout", plan, error: e };
      }
    }

    activatePlan(plan.id, { source: "local", status: "active" });

    try {
      applyPlanToDom();
    } catch (e) {}

    return { ok: true, mode: "local", plan };
  }

  const api = {
    plans,
    getPlan,
    getPlanId,
    getPlanConfig,
    getDefaultMarginFromPlan,
    getCheckoutUrl,
    getSubscriptionStatus,
    hasAccess,
    activatePlan,
    applyPlanToDom,
    openCheckout
  };

  window.QM_SUBS = api;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", applyPlanToDom);
  } else {
    applyPlanToDom();
  }
})();
