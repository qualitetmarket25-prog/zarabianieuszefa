
(function(){
  const KEY = 'qm_subscription_v1';
  const PLAN_KEY = 'qm_plan_v1';
  const MARGIN_KEY = 'qm_store_margin_pct';
  const STORES_KEY = 'qm_stores_v1';
  const ACTIVE_STORE_KEY = 'qm_active_store_v1';

  const PLANS = {
    basic: {
      id: 'basic',
      name: 'Basic',
      price: 79,
      currency: 'PLN',
      cycle: 'mies.',
      marginPct: 18,
      features: ['Start sprzedaży', '1 sklep', 'Automatyczna marża', 'Import produktów']
    },
    pro: {
      id: 'pro',
      name: 'Pro',
      price: 149,
      currency: 'PLN',
      cycle: 'mies.',
      marginPct: 28,
      features: ['Większa marża', 'Hurtownie PRO', 'Lepszy wynik na produkcie', 'Panel sprzedaży']
    },
    elite: {
      id: 'elite',
      name: 'Elite',
      price: 299,
      currency: 'PLN',
      cycle: 'mies.',
      marginPct: 38,
      features: ['Maksymalna marża', 'AI / Intelligence', 'Więcej modułów', 'Plan premium']
    }
  };

  function read(key, fallback){
    try{ return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch(e){ return fallback; }
  }

  function write(key, value){
    localStorage.setItem(key, JSON.stringify(value));
  }

  function getSubscription(){
    return read(KEY, {
      plan: 'basic',
      price: PLANS.basic.price,
      currency: PLANS.basic.currency,
      cycle: PLANS.basic.cycle,
      marginPct: PLANS.basic.marginPct,
      startedAt: new Date().toISOString(),
      active: true
    });
  }

  function roundPrice(v){
    const floored = Math.max(1, Math.floor(v));
    return Number((floored + 0.99).toFixed(2));
  }

  function setStoreMargin(marginPct){
    localStorage.setItem(MARGIN_KEY, JSON.stringify(marginPct));
    const stores = read(STORES_KEY, []);
    const active = read(ACTIVE_STORE_KEY, null);
    if (Array.isArray(stores) && active) {
      const next = stores.map(store => {
        const slug = store.slug || store.id || store.name;
        if (slug === active || store.id === active) {
          return { ...store, marginPct };
        }
        return store;
      });
      write(STORES_KEY, next);
    }
  }

  function applyPlan(planId){
    const p = PLANS[planId] || PLANS.basic;
    const payload = {
      plan: p.id,
      price: p.price,
      currency: p.currency,
      cycle: p.cycle,
      marginPct: p.marginPct,
      startedAt: new Date().toISOString(),
      active: true
    };
    write(KEY, payload);
    localStorage.setItem(PLAN_KEY, p.id);
    setStoreMargin(p.marginPct);
    if (window.QMAutoMargin && typeof window.QMAutoMargin.applyToCatalog === 'function') {
      window.QMAutoMargin.applyToCatalog();
    }
    return payload;
  }

  function getPlanMeta(planId){
    return PLANS[planId] || PLANS.basic;
  }

  document.addEventListener('DOMContentLoaded',()=>{
    document.querySelectorAll('[data-select-plan]').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const planId = btn.getAttribute('data-select-plan');
        const payload = applyPlan(planId);
        localStorage.setItem('qm_last_checkout_v1', JSON.stringify(payload));
        location.href = 'aktywuj-pro.html?plan=' + encodeURIComponent(planId);
      });
    });

    document.querySelectorAll('[data-buy-plan]').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const planId = btn.getAttribute('data-buy-plan');
        const payload = applyPlan(planId);
        localStorage.setItem('qm_last_checkout_v1', JSON.stringify(payload));
        location.href = 'success.html?plan=' + encodeURIComponent(planId);
      });
    });

    document.querySelectorAll('[data-current-plan]').forEach(node=>{
      const plan = getSubscription();
      const meta = getPlanMeta(plan.plan);
      node.textContent = `${meta.name} • ${meta.price} ${meta.currency}/${meta.cycle}`;
    });
  });

  window.QMSubscriptions = { PLANS, getSubscription, applyPlan, getPlanMeta, roundPrice };
})();
