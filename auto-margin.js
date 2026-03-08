
(function(){
  const $ = (s,p=document)=>p.querySelector(s);
  const $$ = (s,p=document)=>Array.from(p.querySelectorAll(s));
  const KEYS = {
    products:'qm_products_by_supplier_v1',
    plan:'qm_plan_v1',
    stores:'qm_stores_v1',
    activeStore:'qm_active_store_v1',
    margin:'qm_store_margin_pct',
    orders:'qm_orders_v1',
    cart:'qm_cart_v1'
  };
  const PLAN_META = {
    basic:{label:'Basic', price:79, margin:18},
    pro:{label:'Pro', price:149, margin:28},
    elite:{label:'Elite', price:299, margin:38}
  };
  function read(key, fallback){
    try{ const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; }catch(e){ return fallback; }
  }
  function readStr(key, fallback){
    try{ const raw = localStorage.getItem(key); return raw===null?fallback:raw; }catch(e){ return fallback; }
  }
  function write(key, value){
    localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
  }
  function plan(){ const p=String(readStr(KEYS.plan,'basic')).toLowerCase(); return PLAN_META[p] ? p : 'basic'; }
  function margin(){ const stored = Number(readStr(KEYS.margin, '0')); return stored || PLAN_META[plan()].margin; }
  function setPlan(p){
    p = PLAN_META[p] ? p : 'basic';
    localStorage.setItem(KEYS.plan, p);
    localStorage.setItem(KEYS.margin, String(PLAN_META[p].margin));
    write('qm_subscription_v1',{plan:p,price:PLAN_META[p].price,status:'active',interval:'monthly',updatedAt:new Date().toISOString()});
    applyMarginToProducts();
    updateBadges();
  }
  function round99(v){ const flo = Math.floor(Number(v)||0); return Number((Math.max(0.99,flo+0.99)).toFixed(2)); }
  function smartMargin(base){
    const m = margin();
    if(base <= 20) return m + 16;
    if(base <= 50) return m + 10;
    if(base <= 120) return m + 6;
    if(base <= 250) return m + 2;
    if(base <= 500) return m;
    return Math.max(12, m - 5);
  }
  function applyMarginToProducts(){
    const items = read(KEYS.products, []);
    if(!Array.isArray(items)) return [];
    const next = items.map((p,idx)=>{
      const base = Number(p.basePrice ?? p.cost ?? p.price ?? 0);
      const pct = smartMargin(base);
      const price = round99(base * (1+pct/100));
      return {...p,id:p.id||('prod_'+(idx+1)), basePrice:Number(base.toFixed(2)), marginPct:pct, price};
    });
    write(KEYS.products, next);
    return next;
  }
  function ensureDefaults(){
    if(!localStorage.getItem(KEYS.plan)) localStorage.setItem(KEYS.plan,'basic');
    if(!localStorage.getItem(KEYS.margin)) localStorage.setItem(KEYS.margin,String(PLAN_META[plan()].margin));
    let stores = read(KEYS.stores, []);
    if(!Array.isArray(stores) || !stores.length){
      stores = [
        {slug:'moj-sklep',name:'Mój sklep',marginPct:margin(),createdAt:new Date().toISOString()},
        {slug:'dropshipping-pro',name:'Dropshipping Pro',marginPct:margin(),createdAt:new Date().toISOString()}
      ];
      write(KEYS.stores, stores);
    }
    if(!localStorage.getItem(KEYS.activeStore)) localStorage.setItem(KEYS.activeStore, stores[0].slug);
    if(!Array.isArray(read(KEYS.cart, []))) write(KEYS.cart, []);
    if(!Array.isArray(read(KEYS.orders, []))) write(KEYS.orders, []);
  }
  function demoProducts(){
    return [
      {id:'p1', name:'Powerbank 20000 mAh', supplier:'AliExpress', img:'', basePrice:39.00, moq:1},
      {id:'p2', name:'Lampka LED biurkowa', supplier:'CJ Dropshipping', img:'', basePrice:24.50, moq:1},
      {id:'p3', name:'Organizer do auta', supplier:'Banggood', img:'', basePrice:18.90, moq:2},
      {id:'p4', name:'Kamera WiFi mini', supplier:'VidaXL', img:'', basePrice:79.00, moq:1},
      {id:'p5', name:'Torba sportowa premium', supplier:'EPROLO', img:'', basePrice:59.00, moq:1},
      {id:'p6', name:'Biurko składane', supplier:'Costway', img:'', basePrice:210.00, moq:1}
    ];
  }
  function loadDemoProducts(){
    write(KEYS.products, demoProducts());
    applyMarginToProducts();
  }
  function addToCart(productId){
    const items = read(KEYS.products, []);
    const cart = read(KEYS.cart, []);
    const p = items.find(x=>x.id===productId);
    if(!p) return;
    const idx = cart.findIndex(x=>x.id===productId);
    if(idx>-1) cart[idx].qty += 1;
    else cart.push({id:p.id,name:p.name,price:p.price,basePrice:p.basePrice,marginPct:p.marginPct,qty:1,moq:p.moq||1});
    write(KEYS.cart, cart);
    updateBadges();
    alert('Dodano do koszyka');
  }
  function updateCartQty(id, delta){
    const cart = read(KEYS.cart, []);
    const idx = cart.findIndex(x=>x.id===id);
    if(idx<0) return;
    cart[idx].qty = Math.max(1, Number(cart[idx].qty||1) + delta);
    write(KEYS.cart, cart); 
    renderCartPage();
    updateBadges();
  }
  function removeFromCart(id){
    const cart = read(KEYS.cart, []).filter(x=>x.id!==id);
    write(KEYS.cart, cart);
    renderCartPage(); updateBadges();
  }
  function clearCart(){ write(KEYS.cart, []); renderCartPage(); updateBadges(); }
  function totals(){
    const cart = read(KEYS.cart, []);
    const net = cart.reduce((s,x)=>s+(Number(x.price)||0)*(Number(x.qty)||0),0);
    const vat = Number((net*0.23).toFixed(2));
    const brutto = Number((net+vat).toFixed(2));
    const cost = cart.reduce((s,x)=>s+(Number(x.basePrice)||0)*(Number(x.qty)||0),0);
    const profit = Number((net-cost).toFixed(2));
    return {count:cart.reduce((s,x)=>s+(Number(x.qty)||0),0), net:Number(net.toFixed(2)), vat, brutto, profit};
  }
  function placeOrder(formData){
    const cart = read(KEYS.cart, []);
    if(!cart.length) return {ok:false, msg:'Koszyk jest pusty'};
    const orders = read(KEYS.orders, []);
    const activeStore = readStr(KEYS.activeStore, 'moj-sklep');
    const t = totals();
    const order = {
      id:'ORD-'+Date.now().toString().slice(-8),
      createdAt:new Date().toISOString(),
      store:activeStore,
      plan:plan(),
      customer:formData,
      items:cart,
      totals:t,
      status:'nowe'
    };
    orders.unshift(order);
    write(KEYS.orders, orders);
    write(KEYS.cart, []);
    return {ok:true, order};
  }
  function updateBadges(){
    const planName = PLAN_META[plan()].label;
    $$('#planBadge').forEach(el=>el.textContent = planName);
    $$('#marginBadge').forEach(el=>el.textContent = String(margin())+'%');
    const t = totals();
    $$('#cartCount').forEach(el=>el.textContent = String(t.count));
    const orders = read(KEYS.orders, []);
    $$('#ordersCount').forEach(el=>el.textContent = String(orders.length));
    const products = read(KEYS.products, []);
    $$('#productsCount').forEach(el=>el.textContent = String(products.length));
    const stores = read(KEYS.stores, []);
    $$('#storesCount').forEach(el=>el.textContent = String(stores.length));
    const active = readStr(KEYS.activeStore, stores[0]?.slug || '—');
    $$('#activeStoreLabel').forEach(el=>el.textContent = active || '—');
  }
  function bindLayout(){
    const btn = $('#menuToggle'); const drawer = $('#mobileDrawer');
    if(btn && drawer){
      btn.addEventListener('click', ()=>drawer.classList.toggle('open'));
    }
    $$('[data-plan-set]').forEach(btn=>btn.addEventListener('click', ()=>{
      setPlan(btn.getAttribute('data-plan-set'));
      alert('Plan aktywny: '+PLAN_META[plan()].label);
    }));
  }
  function renderStoreSelect(){
    const wrap = $('#storeList'); if(!wrap) return;
    const stores = read(KEYS.stores, []);
    const active = readStr(KEYS.activeStore, '');
    wrap.innerHTML = stores.map(s=>`
      <div class="store">
        <div class="row"><div><strong>${s.name}</strong><div class="small">${s.slug}</div></div><span class="tag">${s.marginPct || margin()}%</span></div>
        <div class="actions" style="margin-top:12px">
          <button class="btn btn-secondary" data-store-activate="${s.slug}">Ustaw aktywny</button>
        </div>
      </div>`).join('');
    $$('[data-store-activate]').forEach(b=>b.addEventListener('click', ()=>{
      localStorage.setItem(KEYS.activeStore, b.getAttribute('data-store-activate'));
      updateBadges(); renderStoreSelect();
    }));
    const activeLabel = $('#activeStoreCurrent');
    if(activeLabel) activeLabel.textContent = active || '—';
  }
  function bindStoreForm(){
    const form = $('#storeForm'); if(!form) return;
    form.addEventListener('submit', e=>{
      e.preventDefault();
      const name = $('#storeName').value.trim();
      if(!name) return;
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
      const stores = read(KEYS.stores, []);
      stores.push({slug,name,marginPct:margin(),createdAt:new Date().toISOString()});
      write(KEYS.stores, stores);
      if(!localStorage.getItem(KEYS.activeStore)) localStorage.setItem(KEYS.activeStore, slug);
      form.reset(); renderStoreSelect(); updateBadges();
    });
  }
  function renderProductsPage(){
    const wrap = $('#productsGrid'); if(!wrap) return;
    let items = applyMarginToProducts();
    if(!items.length){
      wrap.innerHTML = `<div class="empty">Brak produktów. Wejdź do hurtowni i kliknij „Załaduj demo produkty”.</div>`;
      return;
    }
    wrap.innerHTML = items.map(p=>`
      <div class="product">
        <div class="row"><strong>${p.name}</strong><span class="tag">${p.supplier||'Supplier'}</span></div>
        <div class="small">Cena bazowa: ${Number(p.basePrice).toFixed(2)} zł · marża ${p.marginPct}% · MOQ ${p.moq||1}</div>
        <div class="row" style="margin-top:12px"><div class="price">${Number(p.price).toFixed(2)} zł</div><button class="btn btn-primary" data-add="${p.id}">Dodaj</button></div>
      </div>`).join('');
    $$('[data-add]').forEach(b=>b.addEventListener('click',()=>addToCart(b.getAttribute('data-add'))));
  }
  function renderCartPage(){
    const wrap = $('#cartList'); if(!wrap) return;
    const cart = read(KEYS.cart, []);
    if(!cart.length){ wrap.innerHTML = `<div class="empty">Koszyk jest pusty. Wróć do sklepu i dodaj produkty.</div>`; }
    else{
      wrap.innerHTML = cart.map(i=>`
        <div class="cart-item">
          <div class="row"><strong>${i.name}</strong><span class="tag">MOQ ${i.moq||1}</span></div>
          <div class="small">Cena ${Number(i.price).toFixed(2)} zł · bazowa ${Number(i.basePrice).toFixed(2)} zł · marża ${i.marginPct}%</div>
          <div class="row" style="margin-top:12px">
            <div class="actions">
              <button class="btn btn-secondary" data-qty="${i.id}" data-delta="-1">−</button>
              <span class="badge">Ilość: ${i.qty}</span>
              <button class="btn btn-secondary" data-qty="${i.id}" data-delta="1">+</button>
            </div>
            <div class="actions"><span class="price">${(i.price*i.qty).toFixed(2)} zł</span><button class="btn btn-danger" data-remove="${i.id}">Usuń</button></div>
          </div>
        </div>`).join('');
    }
    $$('[data-qty]').forEach(b=>b.addEventListener('click',()=>updateCartQty(b.getAttribute('data-qty'), Number(b.getAttribute('data-delta')))));
    $$('[data-remove]').forEach(b=>b.addEventListener('click',()=>removeFromCart(b.getAttribute('data-remove'))));
    const t = totals();
    const sum = $('#cartSummary');
    if(sum) sum.innerHTML = `
      <div class="row"><span>Pozycje</span><strong>${t.count}</strong></div>
      <div class="row"><span>Suma netto</span><strong>${t.net.toFixed(2)} zł</strong></div>
      <div class="row"><span>VAT 23%</span><strong>${t.vat.toFixed(2)} zł</strong></div>
      <div class="row"><span>Twoja marża</span><strong>${t.profit.toFixed(2)} zł</strong></div>
      <div class="row"><span>Razem brutto</span><strong>${t.brutto.toFixed(2)} zł</strong></div>`;
  }
  function renderOrdersPage(){
    const wrap = $('#ordersList'); if(!wrap) return;
    const orders = read(KEYS.orders, []);
    if(!orders.length){ wrap.innerHTML = `<div class="empty">Nie ma jeszcze zamówień.</div>`; return; }
    wrap.innerHTML = orders.map(o=>`
      <div class="order">
        <div class="row"><strong>${o.id}</strong><span class="tag">${o.status}</span></div>
        <div class="small">${new Date(o.createdAt).toLocaleString('pl-PL')} · sklep ${o.store} · plan ${o.plan}</div>
        <div class="row" style="margin-top:10px"><span>${o.customer.name || 'Klient'}</span><strong>${Number(o.totals.brutto).toFixed(2)} zł</strong></div>
      </div>`).join('');
  }
  function bindCheckoutForm(){
    const form = $('#checkoutForm'); if(!form) return;
    form.addEventListener('submit', e=>{
      e.preventDefault();
      const data = {
        name: $('#c_name').value.trim(),
        email: $('#c_email').value.trim(),
        phone: $('#c_phone').value.trim(),
        address: $('#c_address').value.trim(),
        postal: $('#c_postal').value.trim(),
        city: $('#c_city').value.trim(),
        note: $('#c_note').value.trim()
      };
      if(!data.name || !data.email){ alert('Uzupełnij imię i email'); return; }
      const res = placeOrder(data);
      if(!res.ok){ alert(res.msg); return; }
      alert('Zamówienie zapisane: '+res.order.id);
      location.href = 'zamowienia.html';
    });
    const t = totals();
    const sum = $('#checkoutSummary');
    if(sum) sum.innerHTML = `<div class="row"><span>Suma netto</span><strong>${t.net.toFixed(2)} zł</strong></div><div class="row"><span>VAT 23%</span><strong>${t.vat.toFixed(2)} zł</strong></div><div class="row"><span>Razem brutto</span><strong>${t.brutto.toFixed(2)} zł</strong></div>`;
  }
  function bindSuppliers(){
    const demo = $('#loadDemoProducts');
    if(demo) demo.addEventListener('click', ()=>{ loadDemoProducts(); updateBadges(); alert('Produkty demo załadowane'); });
    const csv = $('#csvInput');
    if(csv) csv.addEventListener('change', (e)=>{
      const f = e.target.files && e.target.files[0]; if(!f) return;
      const reader = new FileReader();
      reader.onload = ()=>{
        const text = String(reader.result||'').trim();
        const rows = text.split(/\r?\n/).filter(Boolean);
        const parsed = rows.slice(1).map((line,idx)=>{
          const cols = line.split(',');
          return {id:'csv_'+idx,name:(cols[0]||'Produkt').trim(), supplier:(cols[1]||'CSV').trim(), basePrice:Number((cols[2]||0).replace(',','.')), moq:Number(cols[3]||1)};
        }).filter(x=>x.name);
        write(KEYS.products, parsed); applyMarginToProducts(); updateBadges();
        alert('Zaimportowano '+parsed.length+' produktów');
      };
      reader.readAsText(f,'utf-8');
    });
  }
  function boot(){
    ensureDefaults();
    bindLayout();
    bindStoreForm();
    renderStoreSelect();
    renderProductsPage();
    renderCartPage();
    renderOrdersPage();
    bindCheckoutForm();
    bindSuppliers();
    updateBadges();
    const clear = $('#clearCart');
    if(clear) clear.addEventListener('click', clearCart);
  }
  window.QM = {read,write,plan,margin,setPlan,applyMarginToProducts,loadDemoProducts,addToCart};
  document.addEventListener('DOMContentLoaded', boot);
})();
