(function(){
  const KEY_PLAN = 'qm_user_plan_v1';
  const KEY_PRODUCTS = 'qm_products_by_supplier_v1';
  const KEY_MARGIN = 'qm_store_margin_pct';
  const KEY_STORES = 'qm_stores_v1';
  const KEY_ACTIVE_STORE = 'qm_active_store_v1';

  const PLAN_MARGINS = { basic: 15, pro: 25, elite: 35 };

  function parseJSON(v, fallback){
    try { return JSON.parse(v); } catch(e){ return fallback; }
  }

  function getPlan(){
    const raw = (localStorage.getItem(KEY_PLAN) || localStorage.getItem('qm_plan') || 'pro').toLowerCase();
    return PLAN_MARGINS[raw] ? raw : 'pro';
  }

  function getMargin(){
    const custom = parseFloat(localStorage.getItem(KEY_MARGIN));
    if(Number.isFinite(custom) && custom >= 0) return custom;
    const plan = getPlan();
    const pct = PLAN_MARGINS[plan] || 25;
    localStorage.setItem(KEY_MARGIN, String(pct));
    return pct;
  }

  function normalizePrice(value){
    if(typeof value === 'number' && Number.isFinite(value)) return value;
    const cleaned = String(value || '')
      .replace(/\s/g,'')
      .replace(/,/g,'.')
      .replace(/[^\d.]/g,'');
    const num = parseFloat(cleaned);
    return Number.isFinite(num) ? num : 0;
  }

  function toMoney(value){
    return new Intl.NumberFormat('pl-PL',{style:'currency',currency:'PLN'}).format(value || 0);
  }

  function applyMarginToProducts(){
    const products = parseJSON(localStorage.getItem(KEY_PRODUCTS), []);
    if(!Array.isArray(products) || !products.length) return {count:0, margin:getMargin()};
    const margin = getMargin();
    let touched = 0;
    const next = products.map((p) => {
      const base = normalizePrice(p.basePrice ?? p.wholesalePrice ?? p.costPrice ?? p.price);
      if(!base) return p;
      const finalPrice = +(base * (1 + margin/100)).toFixed(2);
      touched++;
      return {
        ...p,
        basePrice: +base.toFixed(2),
        marginPct: margin,
        price: finalPrice,
        displayPrice: toMoney(finalPrice)
      };
    });
    localStorage.setItem(KEY_PRODUCTS, JSON.stringify(next));
    return {count:touched, margin};
  }

  function applyMarginToStores(){
    const stores = parseJSON(localStorage.getItem(KEY_STORES), []);
    const active = localStorage.getItem(KEY_ACTIVE_STORE);
    const margin = getMargin();
    if(Array.isArray(stores) && stores.length){
      const next = stores.map((s, idx) => {
        const isActive = active ? (s.slug === active || s.id === active || String(idx)===active) : idx === 0;
        if(!isActive) return s;
        return {...s, marginPct: margin};
      });
      localStorage.setItem(KEY_STORES, JSON.stringify(next));
    }
  }

  function renderSummary(){
    const target = document.querySelector('[data-margin-summary]');
    if(!target) return;
    const result = applyMarginToProducts();
    applyMarginToStores();
    const plan = getPlan();
    target.innerHTML = `
      <div class="grid grid-3">
        <div class="stat"><strong>${plan.toUpperCase()}</strong><span>Aktualny plan</span></div>
        <div class="stat"><strong>${result.margin}%</strong><span>Automatyczna marża</span></div>
        <div class="stat"><strong>${result.count}</strong><span>Produktów zaktualizowanych</span></div>
      </div>`;
  }

  function bindActions(){
    document.querySelectorAll('[data-set-plan]').forEach(btn => {
      btn.addEventListener('click', () => {
        const plan = btn.getAttribute('data-set-plan');
        localStorage.setItem(KEY_PLAN, plan);
        localStorage.setItem(KEY_MARGIN, String(PLAN_MARGINS[plan] || 25));
        renderSummary();
        alert('Plan ustawiony: ' + plan.toUpperCase() + '. Marża została ustawiona automatycznie.');
      });
    });

    const customForm = document.querySelector('[data-custom-margin-form]');
    if(customForm){
      customForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = customForm.querySelector('input[name="marginPct"]');
        const pct = parseFloat(input.value);
        if(!Number.isFinite(pct) || pct < 0 || pct > 500){
          alert('Podaj poprawną marżę 0-500%.');
          return;
        }
        localStorage.setItem(KEY_MARGIN, String(pct));
        renderSummary();
        alert('Marża ustawiona na ' + pct + '%.');
      });
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    renderSummary();
    bindActions();
  });

  window.QMAutoMargin = { getPlan, getMargin, applyMarginToProducts, applyMarginToStores };
})();