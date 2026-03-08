
(function(){
  var KEY_PLAN = 'qm_plan_v1';
  var KEY_PRODUCTS = 'qm_products_by_supplier_v1';
  var KEY_ORDERS = 'qm_orders_v1';
  var KEY_STORES = 'qm_stores_v1';
  var KEY_ACTIVE_STORE = 'qm_active_store_v1';
  var KEY_MARGIN = 'qm_store_margin_pct';
  var KEY_ADS = 'qm_ads_v1';
  var KEY_CAMPAIGNS = 'qm_ads_campaigns_v1';
  var KEY_CART = 'qm_cart_v1';

  function safeRead(key, fallback){
    try{
      var raw = localStorage.getItem(key);
      if(!raw){ return fallback; }
      return JSON.parse(raw);
    }catch(e){ return fallback; }
  }
  function safeWrite(key, value){ localStorage.setItem(key, JSON.stringify(value)); }

  function ensureDefaults(){
    if(!localStorage.getItem(KEY_PLAN)){ safeWrite(KEY_PLAN, { plan:'pro' }); }
    if(!localStorage.getItem(KEY_PRODUCTS)){ safeWrite(KEY_PRODUCTS, [
      { id:'p1', name:'Smart Watch Pro', price:199, img:'', supplier:'CJ Dropshipping', category:'Elektronika' },
      { id:'p2', name:'Lampka LED RGB', price:79, img:'', supplier:'AliExpress', category:'Dom' },
      { id:'p3', name:'Organizer biurkowy', price:49, img:'', supplier:'VidaXL', category:'Biuro' },
      { id:'p4', name:'Krzesło gamingowe', price:599, img:'', supplier:'Banggood', category:'Meble' }
    ]); }
    if(!localStorage.getItem(KEY_ORDERS)){ safeWrite(KEY_ORDERS, [
      { id:'QM-1001', customer:'Anna Nowak', total:249, status:'Nowe', channel:'Sklep' },
      { id:'QM-1002', customer:'Marek Krawczyk', total:399, status:'Opłacone', channel:'Marketplace' }
    ]); }
    if(!localStorage.getItem(KEY_STORES)){ safeWrite(KEY_STORES, [
      { slug:'main-store', name:'Uszefa Store', status:'active' },
      { slug:'ogloszenia-plus', name:'Ogłoszenia Plus', status:'draft' }
    ]); }
    if(!localStorage.getItem(KEY_ACTIVE_STORE)){ safeWrite(KEY_ACTIVE_STORE, { slug:'main-store', name:'Uszefa Store' }); }
    if(!localStorage.getItem(KEY_MARGIN)){ safeWrite(KEY_MARGIN, 25); }
    if(!localStorage.getItem(KEY_ADS)){ safeWrite(KEY_ADS, [
      { id:'AD-1001', title:'Wynajmę mieszkanie 2 pokoje', category:'Nieruchomości', price:2400, city:'Warszawa', condition:'Używane', premium:true, description:'Gotowe ogłoszenie demo do startu modułu.' },
      { id:'AD-1002', title:'Sprzedam auto miejskie', category:'Motoryzacja', price:21900, city:'Kraków', condition:'Używane', premium:false, description:'Oszczędny samochód do miasta.' },
      { id:'AD-1003', title:'Korepetycje z angielskiego', category:'Usługi', price:80, city:'Online', condition:'Nowe', premium:false, description:'Lekcje online i stacjonarnie.' }
    ]); }
    if(!localStorage.getItem(KEY_CAMPAIGNS)){ safeWrite(KEY_CAMPAIGNS, [
      { id:'CMP-101', name:'Boost sklepu start', budget:99, target:'Sklep', status:'Aktywna' },
      { id:'CMP-102', name:'Promocja ogłoszenia premium', budget:39, target:'Ogłoszenia', status:'Szkic' }
    ]); }
    if(!localStorage.getItem(KEY_CART)){ safeWrite(KEY_CART, []); }
  }

  function getPlan(){
    var data = safeRead(KEY_PLAN, { plan:'basic' });
    return typeof data === 'string' ? data : (data && data.plan ? data.plan : 'basic');
  }

  function planRank(plan){
    return {basic:1, pro:2, elite:3, boss:4}[plan] || 1;
  }

  function applyGuards(){
    var plan = getPlan();
    document.querySelectorAll('[data-plan-badge]').forEach(function(el){ el.textContent = plan.toUpperCase(); });
    document.querySelectorAll('[data-require]').forEach(function(el){
      var need = el.getAttribute('data-require');
      if(planRank(plan) < planRank(need)){
        el.classList.add('is-locked');
        if(el.tagName === 'A'){
          el.addEventListener('click', function(ev){
            ev.preventDefault();
            alert('Ta sekcja wymaga planu ' + need.toUpperCase() + '.');
            location.href = 'cennik.html';
          });
        }else{
          el.disabled = true;
          el.title = 'Wymaga planu ' + need.toUpperCase();
        }
      }
    });
  }

  function bindPlanButtons(){
    document.querySelectorAll('[data-set-plan]').forEach(function(btn){
      btn.addEventListener('click', function(){
        var p = btn.getAttribute('data-set-plan');
        safeWrite(KEY_PLAN, { plan:p });
        location.reload();
      });
    });
  }

  function bindMobileMenu(){
    var btn = document.getElementById('mobileMenuBtn');
    var sidebar = document.querySelector('.sidebar');
    if(btn && sidebar){
      btn.addEventListener('click', function(){ sidebar.classList.toggle('open'); });
    }
  }

  function renderDashboardStats(){
    var products = safeRead(KEY_PRODUCTS, []);
    var orders = safeRead(KEY_ORDERS, []);
    var stores = safeRead(KEY_STORES, []);
    var ads = safeRead(KEY_ADS, []);
    var activeStore = safeRead(KEY_ACTIVE_STORE, { name:'Brak sklepu' });
    var margin = safeRead(KEY_MARGIN, 0);
    document.querySelectorAll('[data-stat-products]').forEach(function(el){ el.textContent = products.length; });
    document.querySelectorAll('[data-stat-orders]').forEach(function(el){ el.textContent = orders.length; });
    document.querySelectorAll('[data-stat-stores]').forEach(function(el){ el.textContent = stores.length; });
    document.querySelectorAll('[data-stat-ads]').forEach(function(el){ el.textContent = ads.length; });
    document.querySelectorAll('[data-stat-margin]').forEach(function(el){ el.textContent = String(margin) + '%'; });
    document.querySelectorAll('[data-active-store-name]').forEach(function(el){ el.textContent = activeStore && activeStore.name ? activeStore.name : 'Brak sklepu'; });

    var productsTable = document.getElementById('productsTableBody');
    if(productsTable){
      productsTable.innerHTML = products.map(function(it){
        return '<tr><td>'+it.name+'</td><td>'+it.supplier+'</td><td>'+it.category+'</td><td>'+Number(it.price).toFixed(2)+' zł</td></tr>';
      }).join('');
    }
    var ordersTable = document.getElementById('ordersTableBody');
    if(ordersTable){
      ordersTable.innerHTML = orders.map(function(it){
        return '<tr><td>'+it.id+'</td><td>'+it.customer+'</td><td>'+it.channel+'</td><td>'+Number(it.total).toFixed(2)+' zł</td><td>'+it.status+'</td></tr>';
      }).join('');
    }
    var adsBox = document.getElementById('adsList');
    if(adsBox){
      adsBox.innerHTML = ads.map(function(it){
        return '<div class="ad-card"><div class="badge '+(it.premium?'ok':'')+'">'+it.category+'</div><strong>'+it.title+'</strong><div class="muted">'+it.city+' • '+it.condition+'</div><div class="price">'+Number(it.price).toFixed(0)+' zł</div><div class="muted">'+it.description+'</div></div>';
      }).join('');
    }
  }

  function renderAds(){
    var ads = safeRead(KEY_ADS, []);
    var list = document.getElementById('adsFeed');
    if(list){
      list.innerHTML = ads.map(function(it){
        return '<div class="card"><div class="badge '+(it.premium?'ok':'')+'">'+it.category+'</div><h3>'+it.title+'</h3><div class="metric">'+Number(it.price).toFixed(0)+' zł</div><div class="muted">'+it.city+' • '+it.condition+'</div><p>'+it.description+'</p><div class="btn-row"><button class="btn btn-secondary" data-boost-ad="'+it.id+'">Wyróżnij</button><button class="btn btn-primary" data-copy-ad="'+it.id+'">Skopiuj opis</button></div></div>';
      }).join('');
    }
    document.querySelectorAll('[data-copy-ad]').forEach(function(btn){
      btn.addEventListener('click', function(){
        var id = btn.getAttribute('data-copy-ad');
        var ad = ads.find(function(a){ return a.id === id; });
        navigator.clipboard && navigator.clipboard.writeText(ad ? (ad.title + '\n' + ad.description) : '');
        alert('Opis ogłoszenia skopiowany.');
      });
    });
    document.querySelectorAll('[data-boost-ad]').forEach(function(btn){
      btn.addEventListener('click', function(){
        location.href = 'reklama.html';
      });
    });
  }

  function bindAdForm(){
    var form = document.getElementById('adForm');
    if(!form) return;
    form.addEventListener('submit', function(ev){
      ev.preventDefault();
      var ads = safeRead(KEY_ADS, []);
      var data = {
        id:'AD-' + Date.now(),
        title: form.title.value.trim(),
        category: form.category.value,
        price: Number(form.price.value || 0),
        city: form.city.value.trim() || 'Online',
        condition: form.condition.value,
        premium: !!form.premium.checked,
        description: form.description.value.trim()
      };
      ads.unshift(data);
      safeWrite(KEY_ADS, ads);
      form.reset();
      alert('Ogłoszenie zapisane.');
      renderAds();
      renderDashboardStats();
    });
  }

  function renderCampaigns(){
    var campaigns = safeRead(KEY_CAMPAIGNS, []);
    var wrap = document.getElementById('campaignsList');
    if(wrap){
      wrap.innerHTML = campaigns.map(function(it){
        return '<div class="list-item"><div><strong>'+it.name+'</strong><div class="muted">'+it.target+'</div></div><div><strong>'+Number(it.budget).toFixed(0)+' zł</strong><div class="muted">'+it.status+'</div></div></div>';
      }).join('');
    }
  }

  function bindCampaignForm(){
    var form = document.getElementById('campaignForm');
    if(!form) return;
    form.addEventListener('submit', function(ev){
      ev.preventDefault();
      var rows = safeRead(KEY_CAMPAIGNS, []);
      rows.unshift({
        id:'CMP-' + Date.now(),
        name: form.name.value.trim(),
        budget: Number(form.budget.value || 0),
        target: form.target.value,
        status:'Aktywna'
      });
      safeWrite(KEY_CAMPAIGNS, rows);
      form.reset();
      renderCampaigns();
      alert('Kampania reklamowa została dodana.');
    });
  }

  function bindAIButtons(){
    document.querySelectorAll('[data-ai-fill]').forEach(function(btn){
      btn.addEventListener('click', function(){
        var target = document.getElementById(btn.getAttribute('data-ai-fill'));
        if(target){
          target.value = 'AI wygenerowało opis premium: nowoczesna oferta, wyższa konwersja, szybkie wdrożenie i mocny przekaz sprzedażowy pod użytkownika końcowego.';
        }
      });
    });
  }

  function bindCart(){
    document.querySelectorAll('[data-add-demo-cart]').forEach(function(btn){
      btn.addEventListener('click', function(){
        var products = safeRead(KEY_PRODUCTS, []);
        var cart = safeRead(KEY_CART, []);
        if(products[0]) cart.push(products[0]);
        safeWrite(KEY_CART, cart);
        alert('Dodano demo produkt do koszyka.');
      });
    });
    var cartWrap = document.getElementById('cartItems');
    if(cartWrap){
      var cart = safeRead(KEY_CART, []);
      cartWrap.innerHTML = cart.length ? cart.map(function(it){
        return '<div class="list-item"><div><strong>'+it.name+'</strong><div class="muted">'+(it.supplier||'Sklep')+'</div></div><div><strong>'+Number(it.price).toFixed(2)+' zł</strong></div></div>';
      }).join('') : '<div class="card center">Koszyk jest pusty.</div>';
      var total = cart.reduce(function(sum,it){ return sum + Number(it.price||0); }, 0);
      var totalEl = document.getElementById('cartTotal');
      if(totalEl) totalEl.textContent = total.toFixed(2) + ' zł';
    }
    var checkout = document.getElementById('checkoutForm');
    if(checkout){
      checkout.addEventListener('submit', function(ev){
        ev.preventDefault();
        var orders = safeRead(KEY_ORDERS, []);
        var cart = safeRead(KEY_CART, []);
        var total = cart.reduce(function(sum,it){ return sum + Number(it.price||0); }, 0);
        orders.unshift({
          id:'QM-' + Date.now(),
          customer: checkout.fullname.value.trim() || 'Klient',
          total: total || 0,
          status:'Nowe',
          channel:'Checkout'
        });
        safeWrite(KEY_ORDERS, orders);
        safeWrite(KEY_CART, []);
        location.href = 'success.html';
      });
    }
  }

  function bindStoreBuilder(){
    var form = document.getElementById('storeBuilderForm');
    if(!form) return;
    form.addEventListener('submit', function(ev){
      ev.preventDefault();
      var stores = safeRead(KEY_STORES, []);
      var store = {
        slug: form.slug.value.trim() || ('store-' + Date.now()),
        name: form.name.value.trim() || 'Nowy sklep',
        status:'active'
      };
      stores.unshift(store);
      safeWrite(KEY_STORES, stores);
      safeWrite(KEY_ACTIVE_STORE, store);
      alert('Sklep zapisany i ustawiony jako aktywny.');
      location.href='panel-sklepu.html';
    });
  }

  document.addEventListener('DOMContentLoaded', function(){
    ensureDefaults();
    bindMobileMenu();
    bindPlanButtons();
    applyGuards();
    renderDashboardStats();
    renderAds();
    renderCampaigns();
    bindAdForm();
    bindCampaignForm();
    bindAIButtons();
    bindCart();
    bindStoreBuilder();
  });
})();
