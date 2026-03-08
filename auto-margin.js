(function(){
  const KEYS = {
    products: 'qm_products_by_supplier_v1',
    stores: 'qm_stores_v1',
    activeStore: 'qm_active_store_v1',
    margin: 'qm_store_margin_pct',
    plan: 'qm_plan_v1'
  };

  const DEFAULT_BY_PLAN = { basic: 15, pro: 25, elite: 35 };

  function read(key, fallback){
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function write(key, value){
    localStorage.setItem(key, JSON.stringify(value));
  }

  function getPlan(){
    const p = read(KEYS.plan, null);
    if (typeof p === 'string') return p.toLowerCase();
    return 'pro';
  }

  function getMarginPct(){
    const existing = read(KEYS.margin, null);
    if (typeof existing === 'number' && !Number.isNaN(existing)) return existing;
    const planPct = DEFAULT_BY_PLAN[getPlan()] || 25;
    write(KEYS.margin, planPct);
    return planPct;
  }

  function applyMarginValue(price, pct){
    const num = Number(price || 0);
    if (!Number.isFinite(num)) return 0;
    return +(num * (1 + pct / 100)).toFixed(2);
  }

  function normalizeProduct(product, pct){
    const base = Number(product.basePrice ?? product.costPrice ?? product.originalPrice ?? product.price ?? 0);
    const price = applyMarginValue(base, pct);
    return {
      ...product,
      basePrice: base,
      originalPrice: base,
      marginPct: pct,
      price
    };
  }

  function syncProducts(){
    const pct = getMarginPct();
    const products = read(KEYS.products, []);
    if (!Array.isArray(products)) return [];
    const updated = products.map(p => normalizeProduct(p, pct));
    write(KEYS.products, updated);
    return updated;
  }

  function syncStores(){
    const pct = getMarginPct();
    const stores = read(KEYS.stores, []);
    if (!Array.isArray(stores)) return stores;
    const active = read(KEYS.activeStore, null);
    const updated = stores.map(store => {
      const same = active && (store.slug === active || store.id === active || store.name === active);
      return same ? { ...store, marginPct: pct } : store;
    });
    write(KEYS.stores, updated);
    return updated;
  }

  function seedProducts(){
    const products = read(KEYS.products, null);
    if (Array.isArray(products) && products.length) return products;
    const sample = [
      { id:'p1', supplier:'AliExpress', name:'Mini drukarka etykiet Bluetooth', img:'assets/placeholder-printer.png', basePrice:59.9, category:'Narzędzia sprzedaży' },
      { id:'p2', supplier:'CJ Dropshipping', name:'Powerbank magnetyczny 10000 mAh', img:'assets/placeholder-powerbank.png', basePrice:89.9, category:'Elektronika' },
      { id:'p3', supplier:'EPROLO', name:'Organizer biurkowy premium', img:'assets/placeholder-organizer.png', basePrice:34.5, category:'Biuro' },
      { id:'p4', supplier:'VidaXL', name:'Lampa LED do nagrywania', img:'assets/placeholder-led.png', basePrice:74.0, category:'Content creator' },
      { id:'p5', supplier:'Banggood', name:'Kamera Wi‑Fi do domu', img:'assets/placeholder-camera.png', basePrice:129.0, category:'Smart home' },
      { id:'p6', supplier:'BigBuy', name:'Bidon termiczny sport', img:'assets/placeholder-bottle.png', basePrice:28.0, category:'Sport' }
    ];
    write(KEYS.products, sample);
    return sample;
  }

  window.QMMargin = {
    keys: KEYS,
    getMarginPct,
    setMarginPct: function(pct){
      const num = Number(pct);
      if (!Number.isFinite(num)) return getMarginPct();
      write(KEYS.margin, num);
      syncProducts();
      syncStores();
      return num;
    },
    getProducts: function(){
      seedProducts();
      return syncProducts();
    },
    applyMarginValue
  };

  seedProducts();
  syncProducts();
  syncStores();
})();
