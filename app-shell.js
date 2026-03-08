
(function(){
  const KEYS = {
    products:'qm_products_by_supplier_v1',
    intel:'qm_intel_prefill_v1',
    listing:'qm_listing_prefill_v1',
    crm:'qm_crm_v1',
    orders:'qm_orders_v1',
    stores:'qm_stores_v1',
    activeStore:'qm_active_store_v1',
    margin:'qm_store_margin_pct',
    ads:'qm_ads_v1',
    campaigns:'qm_ads_campaigns_v1',
    cart:'qm_cart_v1',
    apps:'qm_apps_v1',
    plan:'qm_plan_v1'
  };

  function read(key, fallback){
    try{ const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }catch(e){ return fallback; }
  }
  function write(key, value){
    localStorage.setItem(key, JSON.stringify(value));
  }
  function ensureSeed(){
    if(!localStorage.getItem(KEYS.plan)) localStorage.setItem(KEYS.plan, JSON.stringify('pro'));
    if(!localStorage.getItem(KEYS.margin)) localStorage.setItem(KEYS.margin, JSON.stringify(22));
    if(!localStorage.getItem(KEYS.products)) write(KEYS.products, [
      {name:'Kurtka premium', price:199, img:'https://placehold.co/300x220/png?text=Produkt+1'},
      {name:'Lampa loft', price:149, img:'https://placehold.co/300x220/png?text=Produkt+2'},
      {name:'Krzesło biurowe', price:349, img:'https://placehold.co/300x220/png?text=Produkt+3'}
    ]);
    if(!localStorage.getItem(KEYS.orders)) write(KEYS.orders, [
      {id:'UZ-1001', customer:'Anna Nowak', total:249, status:'Nowe'},
      {id:'UZ-1002', customer:'Michał Lis', total:589, status:'Wysłane'}
    ]);
    if(!localStorage.getItem(KEYS.stores)) write(KEYS.stores, [
      {name:'Mój sklep premium', slug:'moj-sklep', niche:'home'},
      {name:'Auto Profit', slug:'auto-profit', niche:'motoryzacja'}
    ]);
    if(!localStorage.getItem(KEYS.activeStore)) write(KEYS.activeStore, 'moj-sklep');
    if(!localStorage.getItem(KEYS.ads)) write(KEYS.ads, [
      {title:'Sprzedam auto miejskie', category:'Auta', price:'24900 zł', city:'Warszawa'},
      {title:'Wynajmę mieszkanie 2 pokoje', category:'Nieruchomości', price:'2800 zł', city:'Gdańsk'}
    ]);
    if(!localStorage.getItem(KEYS.campaigns)) write(KEYS.campaigns, [
      {name:'Reklama sklepu', budget:300, status:'Aktywna'},
      {name:'Promocja ogłoszenia', budget:90, status:'Szkic'}
    ]);
    if(!localStorage.getItem(KEYS.apps)) write(KEYS.apps, [
      {name:'App Mojego Sklepu', type:'Sklep', plan:'Pro', status:'Gotowa'},
      {name:'Auta Express', type:'Ogłoszenia', plan:'Boss', status:'Budowa'}
    ]);
    if(!localStorage.getItem(KEYS.cart)) write(KEYS.cart, [{name:'Kurtka premium', price:199, qty:1}]);
  }

  function shellTitle(page){
    return document.body.dataset.title || 'UszefaQualitet';
  }

  function plan(){
    return (read(KEYS.plan, 'pro') || 'pro').toLowerCase();
  }

  function navItems(){
    return [
      ['dashboard.html','Dashboard',''],
      ['platforma.html','Platforma',''],
      ['sklep.html','Sklep',''],
      ['ogloszenia.html','Ogłoszenia','HOT'],
      ['uzywane.html','Używane',''],
      ['nieruchomosci.html','Nieruchomości',''],
      ['auta.html','Auta',''],
      ['reklama.html','Reklama','PRO'],
      ['ai.html','AI','ELITE'],
      ['zarabianie.html','Zarabianie',''],
      ['aplikacje.html','Aplikacje','NOWE'],
      ['stworz-aplikacje.html','Stwórz appkę','BOSS'],
      ['hurtownie.html','Hurtownie','PRO'],
      ['generator-sklepu.html','Generator sklepu',''],
      ['zamowienia.html','Zamówienia',''],
      ['cennik.html','Pakiety','']
    ];
  }

  function buildShell(){
    if(!document.body.classList.contains('app-page')) return;
    const current = location.pathname.split('/').pop() || 'dashboard.html';
    const app = document.createElement('div');
    app.className = 'app-shell';
    const side = document.createElement('aside');
    side.className = 'sidebar';
    side.innerHTML = `
      <a href="dashboard.html" class="brand">
        <img src="uszefaqualitet-logo.svg" alt="logo">
        <div>
          <div class="title">UszefaQualitet</div>
          <div class="sub">aplikacja do zarabiania</div>
        </div>
      </a>
      <div class="plan-badge">Plan: <strong style="text-transform:uppercase">${plan()}</strong></div>
      <div class="nav-group">
        <div class="nav-label">Menu</div>
        ${navItems().map(([href,label,pill]) => `<a class="nav-link ${current===href?'active':''}" href="${href}"><span>${label}</span>${pill?`<span class="pill">${pill}</span>`:''}</a>`).join('')}
      </div>
      <div class="nav-group">
        <div class="nav-label">Szybkie akcje</div>
        <a class="nav-link" href="dodaj-ogloszenie.html"><span>Dodaj ogłoszenie</span></a>
        <a class="nav-link" href="stworz-aplikacje.html"><span>Stwórz swoją aplikację</span></a>
        <a class="nav-link" href="pobierz-aplikacje.html"><span>Pobierz aplikację</span></a>
      </div>
    `;
    const wrap = document.createElement('div');
    wrap.className='content-wrap';
    const top = document.createElement('header');
    top.className='topbar';
    top.innerHTML = `
      <div class="topbar-left">
        <button class="menu-btn" id="menuToggle">☰</button>
        <div>
          <div style="font-weight:800;font-size:1.05rem">${shellTitle()}</div>
          <div class="muted">Buduj sklep, ogłoszenia, reklamę i własną aplikację</div>
        </div>
      </div>
      <div class="search">🔎 Szukaj: sklep, reklama, auta, mieszkania, AI</div>
      <div class="top-actions">
        <a class="btn secondary" href="stworz-aplikacje.html">Stwórz swoją aplikację</a>
        <a class="btn-ghost" href="dodaj-ogloszenie.html">Dodaj ogłoszenie</a>
        <a class="btn" href="reklama.html">Zrób reklamę</a>
      </div>
    `;
    const page = document.createElement('main');
    page.className='page';
    while(document.body.firstChild) page.appendChild(document.body.firstChild);
    wrap.appendChild(top); wrap.appendChild(page);
    app.appendChild(side); app.appendChild(wrap);
    document.body.appendChild(app);
    const t = document.getElementById('menuToggle');
    if(t) t.addEventListener('click', ()=> side.classList.toggle('open'));
  }

  function fillStats(){
    const map = {
      products: read(KEYS.products, []).length,
      orders: read(KEYS.orders, []).length,
      ads: read(KEYS.ads, []).length,
      apps: read(KEYS.apps, []).length,
      campaigns: read(KEYS.campaigns, []).length,
      stores: read(KEYS.stores, []).length,
      plan: plan().toUpperCase(),
      margin: `${read(KEYS.margin, 22)}%`
    };
    document.querySelectorAll('[data-stat]').forEach(el=>{
      const k = el.getAttribute('data-stat');
      if(map[k] !== undefined) el.textContent = map[k];
    });
  }

  function renderList(key, targetId, tpl){
    const list = read(key, []);
    const box = document.getElementById(targetId);
    if(!box) return;
    box.innerHTML = list.map(tpl).join('') || `<div class="notice">Brak danych jeszcze.</div>`;
  }

  function bindPlanButtons(){
    document.querySelectorAll('[data-set-plan]').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        localStorage.setItem(KEYS.plan, JSON.stringify(btn.dataset.setPlan));
        location.href = 'success.html?type=plan';
      });
    });
  }

  function requirePlans(){
    const p = plan();
    document.querySelectorAll('[data-require]').forEach(el=>{
      const need = el.getAttribute('data-require');
      const hide = (need==='elite' && p!=='elite' && p!=='boss') || (need==='pro' && !['pro','elite','boss'].includes(p));
      if(hide){
        el.style.opacity = '.55';
        const msg = document.createElement('div');
        msg.className = 'notice';
        msg.textContent = `Dostęp wymaga planu ${need.toUpperCase()}.`;
        el.appendChild(msg);
      }
    });
  }

  function bindForms(){
    const adForm = document.getElementById('addAdForm');
    if(adForm){
      adForm.addEventListener('submit', e=>{
        e.preventDefault();
        const data = new FormData(adForm);
        const item = {
          title:data.get('title'),
          category:data.get('category'),
          price:data.get('price'),
          city:data.get('city')
        };
        const ads = read(KEYS.ads, []);
        ads.unshift(item); write(KEYS.ads, ads);
        location.href = 'ogloszenia.html';
      });
    }
    const appForm = document.getElementById('createAppForm');
    if(appForm){
      appForm.addEventListener('submit', e=>{
        e.preventDefault();
        const data = new FormData(appForm);
        const apps = read(KEYS.apps, []);
        apps.unshift({
          name:data.get('name'),
          type:data.get('type'),
          plan:data.get('plan'),
          status:'Budowa'
        });
        write(KEYS.apps, apps);
        location.href = 'aplikacje.html';
      });
    }
    const checkout = document.getElementById('checkoutForm');
    if(checkout){
      checkout.addEventListener('submit', e=>{
        e.preventDefault();
        const data = new FormData(checkout);
        const orders = read(KEYS.orders, []);
        orders.unshift({
          id:'UZ-'+Math.floor(Math.random()*9000+1000),
          customer:data.get('name'),
          total: read(KEYS.cart, []).reduce((s,i)=>s + Number(i.price||0) * Number(i.qty||1), 0),
          status:'Nowe'
        });
        write(KEYS.orders, orders);
        write(KEYS.cart, []);
        location.href = 'success.html?type=order';
      });
    }
    const login = document.getElementById('loginForm');
    if(login){
      login.addEventListener('submit', e=>{ e.preventDefault(); location.href='dashboard.html'; });
    }
  }

  function renderAll(){
    renderList(KEYS.orders,'ordersList', x => `<div class="list-item"><strong>${x.id}</strong><span>${x.customer}</span><span>${x.total} zł</span><span class="tag">${x.status}</span></div>`);
    renderList(KEYS.ads,'adsList', x => `<div class="list-item"><div><strong>${x.title}</strong><div class="muted">${x.category} • ${x.city||''}</div></div><div><strong>${x.price||''}</strong></div></div>`);
    renderList(KEYS.apps,'appsList', x => `<div class="list-item"><div><strong>${x.name}</strong><div class="muted">${x.type} • plan ${x.plan}</div></div><span class="tag">${x.status}</span></div>`);
    renderList(KEYS.campaigns,'campaignsList', x => `<div class="list-item"><div><strong>${x.name}</strong><div class="muted">Budżet ${x.budget} zł</div></div><span class="tag">${x.status}</span></div>`);
    renderList(KEYS.products,'productsList', x => `<div class="list-item"><div><strong>${x.name}</strong><div class="muted">Sklep / Produkt</div></div><strong>${x.price} zł</strong></div>`);
    const cart = read(KEYS.cart, []);
    const cartBox = document.getElementById('cartList');
    const cartTotal = cart.reduce((s,i)=>s + Number(i.price||0)*Number(i.qty||1),0);
    if(cartBox) cartBox.innerHTML = cart.map(x => `<div class="list-item"><div><strong>${x.name}</strong><div class="muted">Ilość ${x.qty}</div></div><strong>${x.price} zł</strong></div>`).join('') || `<div class="notice">Koszyk jest pusty.</div>`;
    document.querySelectorAll('[data-cart-total]').forEach(el=> el.textContent = cartTotal + ' zł');
  }

  document.addEventListener('DOMContentLoaded', ()=>{
    ensureSeed();
    buildShell();
    fillStats();
    renderAll();
    bindPlanButtons();
    bindForms();
    requirePlans();
  });
})();
