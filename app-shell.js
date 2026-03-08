(function(){
  const body = document.body;
  const toggle = document.querySelector('[data-menu-toggle]');
  const overlay = document.querySelector('[data-menu-overlay]');
  const activePage = body.getAttribute('data-page') || '';
  const links = document.querySelectorAll('[data-nav]');
  links.forEach(link => {
    if(link.getAttribute('href') === activePage){
      link.classList.add('active');
    }
  });
  function closeMenu(){ body.classList.remove('menu-open'); }
  function openMenu(){ body.classList.add('menu-open'); }
  if(toggle){ toggle.addEventListener('click', () => body.classList.contains('menu-open') ? closeMenu() : openMenu()); }
  if(overlay){ overlay.addEventListener('click', closeMenu); }
  document.querySelectorAll('[data-nav]').forEach(link => link.addEventListener('click', closeMenu));

  const storageKeys = [
    'qm_products_by_supplier_v1',
    'qm_orders_v1',
    'qm_stores_v1',
    'qm_active_store_v1',
    'qm_store_margin_pct'
  ];

  function safeJson(key, fallback){
    try{
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    }catch(e){
      return fallback;
    }
  }

  const products = safeJson('qm_products_by_supplier_v1', []);
  const orders = safeJson('qm_orders_v1', []);
  const stores = safeJson('qm_stores_v1', []);
  const activeStore = localStorage.getItem('qm_active_store_v1') || (stores[0] && (stores[0].slug || stores[0].name)) || 'Brak aktywnego sklepu';
  const margin = localStorage.getItem('qm_store_margin_pct') || '20';

  const map = {
    '[data-bind="products-count"]': Array.isArray(products) ? products.length : 0,
    '[data-bind="orders-count"]': Array.isArray(orders) ? orders.length : 0,
    '[data-bind="stores-count"]': Array.isArray(stores) ? stores.length : 0,
    '[data-bind="active-store"]': activeStore,
    '[data-bind="margin"]': margin + '%'
  };

  Object.keys(map).forEach(selector => {
    document.querySelectorAll(selector).forEach(el => { el.textContent = map[selector]; });
  });

  const year = new Date().getFullYear();
  document.querySelectorAll('[data-bind="year"]').forEach(el => el.textContent = year);
})();