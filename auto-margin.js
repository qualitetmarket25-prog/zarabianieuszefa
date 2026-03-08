
(function(){
  const PLAN_MARGIN = { basic:15, pro:25, elite:35 };
  const plan = (localStorage.getItem('qm_plan_v1') || 'basic').toLowerCase();
  const pct = PLAN_MARGIN[plan] || 20;
  localStorage.setItem('qm_store_margin_pct', String(pct));
  try{
    const products = JSON.parse(localStorage.getItem('qm_products_by_supplier_v1') || '[]');
    const updated = Array.isArray(products) ? products.map(p=>{
      const base = Number(p.basePrice ?? p.cost ?? p.price ?? 0) || 0;
      return {...p, basePrice: base, price: +(base * (1 + pct/100)).toFixed(2)};
    }) : [];
    localStorage.setItem('qm_products_by_supplier_v1', JSON.stringify(updated));
  }catch(e){}
})();
