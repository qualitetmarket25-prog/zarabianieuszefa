(function(){
  var KEY_PLAN = 'qm_plan_v1';
  var KEY_PRODUCTS = 'qm_products_by_supplier_v1';
  var KEY_ORDERS = 'qm_orders_v1';
  var KEY_STORES = 'qm_stores_v1';
  var KEY_ACTIVE_STORE = 'qm_active_store_v1';
  var KEY_MARGIN = 'qm_store_margin_pct';

  function safeRead(key, fallback){
    try{
      var raw = localStorage.getItem(key);
      if(!raw){ return fallback; }
      return JSON.parse(raw);
    }catch(e){
      return fallback;
    }
  }

  function ensureDefaults(){
    if(!localStorage.getItem(KEY_PLAN)){ localStorage.setItem(KEY_PLAN, JSON.stringify({ plan:'pro' })); }
    if(!localStorage.getItem(KEY_PRODUCTS)){ localStorage.setItem(KEY_PRODUCTS, JSON.stringify([
      { name:'Smart Watch Pro', price:199, img:'', supplier:'CJ Dropshipping' },
      { name:'Lampka LED RGB', price:79, img:'', supplier:'AliExpress' },
      { name:'Organizer biurkowy', price:49, img:'', supplier:'VidaXL' }
    ])); }
    if(!localStorage.getItem(KEY_ORDERS)){ localStorage.setItem(KEY_ORDERS, JSON.stringify([
      { id:'QM-1001', customer:'Anna Nowak', total:249, status:'Nowe' },
      { id:'QM-1002', customer:'Marek Krawczyk', total:399, status:'Opłacone' }
    ])); }
    if(!localStorage.getItem(KEY_STORES)){ localStorage.setItem(KEY_STORES, JSON.stringify([
      { slug:'main-store', name:'Main Store', status:'active' }
    ])); }
    if(!localStorage.getItem(KEY_ACTIVE_STORE)){ localStorage.setItem(KEY_ACTIVE_STORE, JSON.stringify({ slug:'main-store', name:'Main Store' })); }
    if(!localStorage.getItem(KEY_MARGIN)){ localStorage.setItem(KEY_MARGIN, JSON.stringify(25)); }
  }

  function getPlan(){
    var data = safeRead(KEY_PLAN, { plan:'basic' });
    if(typeof data === 'string') return data;
    return data && data.plan ? data.plan : 'basic';
  }

  function updateStats(){
    var products = safeRead(KEY_PRODUCTS, []);
    var orders = safeRead(KEY_ORDERS, []);
    var stores = safeRead(KEY_STORES, []);
    var activeStore = safeRead(KEY_ACTIVE_STORE, { name:'Brak sklepu' });
    var margin = safeRead(KEY_MARGIN, 0);
    var plan = getPlan();

    document.querySelectorAll('[data-plan-badge]').forEach(function(el){ el.textContent = plan.toUpperCase(); });
    document.querySelectorAll('[data-stat-products]').forEach(function(el){ el.textContent = products.length; });
    document.querySelectorAll('[data-stat-orders]').forEach(function(el){ el.textContent = orders.length; });
    document.querySelectorAll('[data-stat-stores]').forEach(function(el){ el.textContent = stores.length; });
    document.querySelectorAll('[data-stat-margin]').forEach(function(el){ el.textContent = String(margin) + '%'; });
    document.querySelectorAll('[data-active-store-name]').forEach(function(el){ el.textContent = activeStore && activeStore.name ? activeStore.name : 'Brak sklepu'; });

    var productsTable = document.getElementById('productsTableBody');
    if(productsTable){
      productsTable.innerHTML = products.length ? products.slice(0,8).map(function(item, index){
        return '<tr><td>'+(index+1)+'</td><td>'+(item.name || 'Produkt')+'</td><td>'+(item.supplier || 'Supplier')+'</td><td>'+(item.price || 0)+' zł</td><td><span class="badge ok">Aktywny</span></td></tr>';
      }).join('') : '<tr><td colspan="5"><div class="empty">Brak produktów w localStorage</div></td></tr>';
    }

    var ordersTable = document.getElementById('ordersTableBody');
    if(ordersTable){
      ordersTable.innerHTML = orders.length ? orders.slice(0,8).map(function(item){
        return '<tr><td>'+(item.id || 'QM')+'</td><td>'+(item.customer || 'Klient')+'</td><td>'+(item.total || 0)+' zł</td><td><span class="badge pro">'+(item.status || 'Nowe')+'</span></td></tr>';
      }).join('') : '<tr><td colspan="4"><div class="empty">Brak zamówień w localStorage</div></td></tr>';
    }
  }

  function applyGuards(){
    var plan = getPlan();
    var order = { basic:1, pro:2, elite:3 };
    document.querySelectorAll('[data-require]').forEach(function(el){
      var req = el.getAttribute('data-require');
      if((order[plan] || 1) < (order[req] || 1)){
        el.classList.add('is-locked');
        if(el.tagName === 'A'){
          el.addEventListener('click', function(ev){
            ev.preventDefault();
            alert('Ta sekcja wymaga planu ' + req.toUpperCase());
          });
        }
      }
    });
  }

  function bindEvents(){
    var menuBtn = document.getElementById('mobileMenuBtn');
    if(menuBtn){
      menuBtn.addEventListener('click', function(){
        document.body.classList.toggle('sidebar-open');
      });
    }
    document.querySelectorAll('[data-set-plan]').forEach(function(btn){
      btn.addEventListener('click', function(){
        var plan = btn.getAttribute('data-set-plan');
        localStorage.setItem(KEY_PLAN, JSON.stringify({ plan: plan }));
        location.reload();
      });
    });
    document.querySelectorAll('[data-demo-import]').forEach(function(btn){
      btn.addEventListener('click', function(){
        var products = safeRead(KEY_PRODUCTS, []);
        products.unshift({
          name:'Nowy produkt ' + (products.length + 1),
          price: Math.floor(Math.random() * 200) + 40,
          img:'',
          supplier:'EPROLO'
        });
        localStorage.setItem(KEY_PRODUCTS, JSON.stringify(products));
        updateStats();
        alert('Dodano przykładowy produkt do qm_products_by_supplier_v1');
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function(){
    ensureDefaults();
    bindEvents();
    updateStats();
    applyGuards();
  });
})();
