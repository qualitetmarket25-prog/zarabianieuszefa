
(function(){
  "use strict";
  const readJSON = (k,f)=>{ try { return JSON.parse(localStorage.getItem(k)||''); } catch { return f; } };
  const writeJSON = (k,v)=> localStorage.setItem(k, JSON.stringify(v));
  const slugify = (s) => String(s || "")
    .trim().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-z0-9]+/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'');
  const activeStore = () => slugify(localStorage.getItem('qm_active_store_v1') || '') || 'default';
  function getMargin(){
    const stores = readJSON('qm_stores_v1', []);
    const slug = activeStore();
    const store = Array.isArray(stores) ? stores.find(s => slugify(s.slug || s.name || s.id || '') === slug) : null;
    const val = Number(store?.marginPct ?? localStorage.getItem('qm_store_margin_pct') ?? 20);
    return Number.isFinite(val) ? Math.max(0, Math.min(500, val)) : 20;
  }
  function applyPrice(raw){
    const base = Number(raw || 0) || 0;
    return +(base * (1 + getMargin()/100)).toFixed(2);
  }
  function normalizeProduct(p){
    const buyNet = Number(p.buyNet ?? p.cost ?? p.purchasePrice ?? p.basePrice ?? p.price ?? 0) || 0;
    const retail = applyPrice(buyNet || p.price || 0);
    const b2b = +(retail * 0.92).toFixed(2);
    return {
      ...p,
      buyNet,
      priceRetail: retail,
      priceB2B: b2b,
      price: retail,
      image: p.image || p.img || 'https://placehold.co/640x640/png?text=Qualitet',
      sku: p.sku || p.id || 'QM-' + Math.random().toString(36).slice(2,8).toUpperCase(),
      moq: Number(p.moq || 1) || 1
    };
  }
  function refreshProductsStore(){
    const list = readJSON('qm_products_by_supplier_v1', []);
    if(!Array.isArray(list)) return;
    const next = list.map(normalizeProduct);
    writeJSON('qm_products_by_supplier_v1', next);
  }
  function ensureStoreMargin(){
    const stores = readJSON('qm_stores_v1', []);
    const slug = activeStore();
    const margin = getMargin();
    if(Array.isArray(stores) && stores.length){
      let changed = false;
      const next = stores.map(s=>{
        const sslug = slugify(s.slug || s.name || s.id || '');
        if(sslug === slug && Number(s.marginPct) !== margin){
          changed = true;
          return { ...s, marginPct: margin };
        }
        return s;
      });
      if(changed) writeJSON('qm_stores_v1', next);
    }
    localStorage.setItem('qm_store_margin_pct', String(margin));
  }
  window.QM_MARGIN = { getMargin, applyPrice, normalizeProduct, refreshProductsStore, ensureStoreMargin };
  document.addEventListener('DOMContentLoaded', ()=>{
    ensureStoreMargin();
  });
})();
