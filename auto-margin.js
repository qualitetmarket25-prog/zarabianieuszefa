(function(){
  function getPlan(){
    return (localStorage.getItem('qm_plan') || 'basic').toLowerCase();
  }
  function marginForPlan(plan){
    if(plan === 'elite') return 35;
    if(plan === 'pro') return 25;
    return 15;
  }
  function applyMargin(){
    const plan = getPlan();
    const margin = marginForPlan(plan);
    localStorage.setItem('qm_store_margin_pct', String(margin));

    try{
      const stores = JSON.parse(localStorage.getItem('qm_stores_v1') || '[]');
      const active = localStorage.getItem('qm_active_store_v1');
      if(Array.isArray(stores) && active){
        const changed = stores.map(store=>{
          if((store.slug || store.id || store.name) == active){
            return Object.assign({}, store, { marginPct: margin });
          }
          return store;
        });
        localStorage.setItem('qm_stores_v1', JSON.stringify(changed));
      }
    }catch(e){}

    try{
      const raw = JSON.parse(localStorage.getItem('qm_products_by_supplier_v1') || '[]');
      if(Array.isArray(raw) && raw.length){
        const normalized = raw.map(item=>{
          const basePrice = Number(item.basePrice || item.cost || item.price || 0);
          const finalPrice = +(basePrice * (1 + margin/100)).toFixed(2);
          return Object.assign({}, item, {
            basePrice,
            marginPct: margin,
            price: finalPrice
          });
        });
        localStorage.setItem('qm_products_by_supplier_v1', JSON.stringify(normalized));
      }
    }catch(e){}
  }
  document.addEventListener('DOMContentLoaded', applyMargin);
})();