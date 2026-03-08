
(function(){
  const PLAN_KEY='qm_user_plan_v1';
  const MARGIN_KEY='qm_store_margin_pct';
  const STORES_KEY='qm_stores_v1';
  const ACTIVE_STORE_KEY='qm_active_store_v1';
  const PRODUCTS_KEY='qm_products_by_supplier_v1';

  const PLAN_MARGIN = { basic:15, pro:25, elite:35 };

  function safeParse(key, fallback){
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch(e){ return fallback; }
  }
  function safeSet(key, value){
    localStorage.setItem(key, JSON.stringify(value));
  }
  function getPlan(){
    return localStorage.getItem(PLAN_KEY) || 'pro';
  }
  function syncMargin(){
    const plan = getPlan();
    const margin = PLAN_MARGIN[plan] || 20;
    localStorage.setItem(MARGIN_KEY, String(margin));

    const stores = safeParse(STORES_KEY, []);
    const active = localStorage.getItem(ACTIVE_STORE_KEY);
    if(Array.isArray(stores) && active){
      const next = stores.map(s => s && (s.slug===active || s.id===active) ? {...s, marginPct: margin} : s);
      safeSet(STORES_KEY, next);
    }
    return margin;
  }
  function priceWithMargin(price, margin){
    const p = Number(price || 0);
    return Math.round((p * (1 + margin/100)) * 100) / 100;
  }
  function applyToProducts(){
    const margin = Number(localStorage.getItem(MARGIN_KEY) || syncMargin());
    const products = safeParse(PRODUCTS_KEY, []);
    if(Array.isArray(products) && products.length){
      const next = products.map(p => {
        const base = Number(p.basePrice ?? p.price ?? 0);
        return {
          ...p,
          basePrice: base,
          price: priceWithMargin(base, margin),
          marginPct: margin
        };
      });
      safeSet(PRODUCTS_KEY, next);
    }
  }
  document.addEventListener('DOMContentLoaded', ()=>{
    syncMargin();
    applyToProducts();
    const el = document.querySelector('[data-margin-badge]');
    if(el) el.textContent = `Auto marża: ${localStorage.getItem(MARGIN_KEY) || '25'}%`;
  });
})();
