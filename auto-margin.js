
(function(){
  function getPlan(){
    return localStorage.getItem('qm_user_plan_v1') || 'basic';
  }
  function marginForPlan(plan){
    if(plan === 'elite') return 35;
    if(plan === 'pro') return 25;
    return 15;
  }
  function normalizeNum(v){
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }
  function applyAutoMargin(){
    const current = normalizeNum(localStorage.getItem('qm_store_margin_pct'));
    const wanted = marginForPlan(getPlan());
    if(current !== wanted) localStorage.setItem('qm_store_margin_pct', String(wanted));

    try{
      const raw = JSON.parse(localStorage.getItem('qm_products_by_supplier_v1') || '[]');
      if(Array.isArray(raw)){
        const pct = wanted / 100;
        const updated = raw.map(item => {
          const base = normalizeNum(item.basePrice || item.originalPrice || item.price);
          const price = base ? +(base * (1 + pct)).toFixed(2) : normalizeNum(item.price);
          return Object.assign({}, item, {
            basePrice: base || normalizeNum(item.price),
            originalPrice: base || normalizeNum(item.price),
            price,
            marginPct: wanted
          });
        });
        localStorage.setItem('qm_products_by_supplier_v1', JSON.stringify(updated));
      }
    }catch(e){}
    try{
      const stores = JSON.parse(localStorage.getItem('qm_stores_v1') || '[]');
      if(Array.isArray(stores)){
        const active = localStorage.getItem('qm_active_store_v1') || '';
        const next = stores.map(store => {
          if(!active || store.slug === active || store.id === active || store.name === active){
            return Object.assign({}, store, {marginPct:wanted});
          }
          return store;
        });
        localStorage.setItem('qm_stores_v1', JSON.stringify(next));
      }
    }catch(e){}
  }
  document.addEventListener('DOMContentLoaded', applyAutoMargin);
})();
