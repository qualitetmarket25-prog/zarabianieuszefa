(function(){
  'use strict';

  const LS_PLAN = 'qm_user_plan_v1';
  const LS_MARGIN = 'qm_store_margin_pct';

  const plans = {
    basic: {
      id: 'basic',
      label: 'BASIC',
      price: 49,
      defaultMargin: 0.12,
      features: [
        'Wejście startowe do platformy',
        'Niski koszt wejścia',
        'Podgląd sklepu i podstawowych modułów',
        'Bez pełnego panelu premium'
      ]
    },
    pro: {
      id: 'pro',
      label: 'PRO',
      price: 149,
      defaultMargin: 0.18,
      features: [
        'Pełny panel sklepu i sprzedaży',
        'Dostęp do hurtowni premium',
        'Automatyczne bestsellery i badge',
        'Plan główny do realnej sprzedaży'
      ]
    },
    elite: {
      id: 'elite',
      label: 'ELITE',
      price: 299,
      defaultMargin: 0.24,
      features: [
        'Wszystko z PRO',
        'Wyższa domyślna marża',
        'Silniejszy status dla skalowania',
        'Priorytet pod dalsze automatyzacje'
      ]
    }
  };

  function safeGet(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      return value == null ? fallback : value;
    } catch {
      return fallback;
    }
  }

  function safeSet(key, value) {
    try { localStorage.setItem(key, value); } catch {}
  }

  function getPlanId() {
    const raw = String(safeGet(LS_PLAN, 'basic') || 'basic').toLowerCase();
    return plans[raw] ? raw : 'basic';
  }

  function getPlanConfig(id) {
    return plans[String(id || '').toLowerCase()] || plans.basic;
  }

  function getPlan() {
    return getPlanConfig(getPlanId());
  }

  function getDefaultMarginFromPlan(planId) {
    return getPlanConfig(planId).defaultMargin;
  }

  function activatePlan(planId) {
    const plan = getPlanConfig(planId);
    safeSet(LS_PLAN, plan.id);
    safeSet(LS_MARGIN, String(plan.defaultMargin));
    try {
      document.documentElement.setAttribute('data-plan', plan.id);
      document.body && document.body.setAttribute('data-plan', plan.id);
    } catch {}
    return plan;
  }

  function hasAccess(requiredPlan) {
    const order = { basic: 1, pro: 2, elite: 3 };
    return order[getPlanId()] >= order[getPlanConfig(requiredPlan).id];
  }

  function applyPlanToDom() {
    const plan = getPlan();
    try {
      document.documentElement.setAttribute('data-plan', plan.id);
      document.body && document.body.setAttribute('data-plan', plan.id);
      document.querySelectorAll('[data-require]').forEach((node) => {
        const req = node.getAttribute('data-require') || 'basic';
        const ok = hasAccess(req);
        node.classList.toggle('is-locked', !ok);
        if (!ok) node.setAttribute('aria-disabled', 'true');
      });
      document.querySelectorAll('[data-plan-label]').forEach((node) => {
        node.textContent = plan.label;
      });
    } catch {}
  }

  const api = {
    plans,
    getPlan,
    getPlanId,
    getPlanConfig,
    getDefaultMarginFromPlan,
    activatePlan,
    hasAccess,
    applyPlanToDom
  };

  window.QM_SUBS = api;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyPlanToDom);
  } else {
    applyPlanToDom();
  }
})();
