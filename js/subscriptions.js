(() => {
  'use strict';

  const KEY = 'qm_user_plan_v1';
  const plans = {
    basic: {
      id: 'basic',
      name: 'BASIC',
      priceMonthly: 49,
      priceYearly: 490,
      badge: 'Start',
      defaultStoreMarginPct: 0.08,
      canUseSellerPanel: false,
      canUsePremiumSuppliers: false,
      canUseAdvancedBoosts: false,
      maxStores: 1,
      maxImportsPerDay: 2,
      description: 'Start bez panelu sprzedawcy. Idealny na wejście i testy.',
      bullets: [
        '1 sklep',
        'import CSV',
        'sklep mobilny',
        'podstawowe statystyki',
        'bez panelu sprzedaży Webkul'
      ],
      cta: 'Wybieram BASIC'
    },
    pro: {
      id: 'pro',
      name: 'PRO',
      priceMonthly: 149,
      priceYearly: 1490,
      badge: 'Najczęściej wybierany',
      defaultStoreMarginPct: 0.12,
      canUseSellerPanel: true,
      canUsePremiumSuppliers: true,
      canUseAdvancedBoosts: true,
      maxStores: 3,
      maxImportsPerDay: 20,
      description: 'Plan do realnej sprzedaży. Daje panel sprzedawcy i pełny silnik sklepu.',
      bullets: [
        'panel sprzedaży Webkul',
        'do 3 sklepów',
        'hurtownie premium',
        'bestsellery i badge',
        'automatyczna marża sklepu'
      ],
      cta: 'Wybieram PRO'
    },
    elite: {
      id: 'elite',
      name: 'ELITE',
      priceMonthly: 299,
      priceYearly: 2990,
      badge: 'Skalowanie',
      defaultStoreMarginPct: 0.18,
      canUseSellerPanel: true,
      canUsePremiumSuppliers: true,
      canUseAdvancedBoosts: true,
      maxStores: 10,
      maxImportsPerDay: 999,
      description: 'Plan dla ludzi, którzy chcą szybko skalować i mieć najmocniejsze narzędzia.',
      bullets: [
        'panel sprzedaży Webkul',
        'do 10 sklepów',
        'premium suppliers + boosty',
        'priorytet i automatyzacje',
        'wyższa domyślna marża'
      ],
      cta: 'Wybieram ELITE'
    }
  };

  function safe(str) {
    return String(str ?? '').trim().toLowerCase();
  }

  function normalizePlan(raw) {
    const p = safe(raw);
    return plans[p] ? p : 'basic';
  }

  function getCurrentPlanId() {
    try {
      return normalizePlan(localStorage.getItem(KEY));
    } catch {
      return 'basic';
    }
  }

  function getCurrentPlan() {
    return plans[getCurrentPlanId()] || plans.basic;
  }

  function setCurrentPlan(planId) {
    const next = normalizePlan(planId);
    try {
      localStorage.setItem(KEY, next);
    } catch {}
    return plans[next];
  }

  function getPlan(planId) {
    return plans[normalizePlan(planId)];
  }

  function getAllPlans() {
    return Object.values(plans);
  }

  function applyPlanToStoreMargin(planId) {
    const plan = getPlan(planId);
    try {
      const stores = JSON.parse(localStorage.getItem('qm_stores_v1') || '{}');
      const active = localStorage.getItem('qm_active_store_v1') || '';
      if (active && stores[active]) {
        if (stores[active].marginPct == null || stores[active].marginPct === '') {
          stores[active].marginPct = plan.defaultStoreMarginPct;
        }
        localStorage.setItem('qm_stores_v1', JSON.stringify(stores));
      }
      localStorage.setItem('qm_store_margin_pct', String(plan.defaultStoreMarginPct));
    } catch {
      try { localStorage.setItem('qm_store_margin_pct', String(plan.defaultStoreMarginPct)); } catch {}
    }
  }

  window.QM_SUBS = {
    key: KEY,
    plans,
    getPlan,
    getAllPlans,
    getCurrentPlan,
    getCurrentPlanId,
    setCurrentPlan,
    applyPlanToStoreMargin,
  };
})();
