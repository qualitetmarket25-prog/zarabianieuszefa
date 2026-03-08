
(function(){
  const KEYS = {
    products:'qm_products_by_supplier_v1',
    orders:'qm_orders_v1',
    stores:'qm_stores_v1',
    activeStore:'qm_active_store_v1',
    margin:'qm_store_margin_pct',
    plan:'qm_plan_v1',
    cart:'qm_cart_v1'
  };

  const PLAN_MARGIN = { basic:15, pro:25, elite:35 };

  function safeRead(key, fallback){
    try{
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    }catch(e){ return fallback; }
  }
  function safeWrite(key, value){
    localStorage.setItem(key, JSON.stringify(value));
  }
  function money(v){
    return new Intl.NumberFormat('pl-PL',{style:'currency',currency:'PLN'}).format(Number(v||0));
  }
  function parseNum(v, d=0){
    const n = Number(String(v).replace(',','.'));
    return Number.isFinite(n) ? n : d;
  }
  function getPlan(){
    return (localStorage.getItem(KEYS.plan) || 'basic').toLowerCase();
  }
  function currentMargin(){
    const manual = parseNum(localStorage.getItem(KEYS.margin), NaN);
    if(Number.isFinite(manual) && manual>0) return manual;
    const byPlan = PLAN_MARGIN[getPlan()] || 20;
    localStorage.setItem(KEYS.margin, String(byPlan));
    return byPlan;
  }
  function ensureMargins(){
    const pct = currentMargin();
    const stores = safeRead(KEYS.stores, []);
    const active = localStorage.getItem(KEYS.activeStore) || '';
    let changed=false;
    const updated = stores.map(s => {
      if(typeof s !== 'object' || !s) return s;
      const copy = {...s};
      if(!copy.marginPct || copy.slug===active || (!active && !copy.isDefault)){
        copy.marginPct = pct;
        changed=true;
      }
      return copy;
    });
    if(changed) safeWrite(KEYS.stores, updated);
  }
  function normalizeProduct(p, i){
    const base = parseNum(p.basePrice ?? p.price ?? p.cost ?? 0, 0);
    const pct = currentMargin();
    const sell = +(base * (1 + pct/100)).toFixed(2);
    return {
      id: p.id || `p-${i+1}`,
      name: p.name || p.title || `Produkt ${i+1}`,
      supplier: p.supplier || 'Hurtownia',
      img: p.img || '',
      moq: parseNum(p.moq, 1),
      basePrice: base,
      price: sell
    };
  }
  function products(){
    const arr = safeRead(KEYS.products, []);
    return Array.isArray(arr) ? arr.map(normalizeProduct) : [];
  }
  function cart(){
    const arr = safeRead(KEYS.cart, []);
    return Array.isArray(arr) ? arr.map((it, idx)=>({
      id: it.id || `c-${idx+1}`,
      name: it.name || `Produkt ${idx+1}`,
      supplier: it.supplier || 'Hurtownia',
      img: it.img || '',
      qty: parseNum(it.qty, 1),
      moq: parseNum(it.moq, 1),
      basePrice: parseNum(it.basePrice ?? it.price ?? 0),
      price: parseNum(it.price ?? it.basePrice ?? 0)
    })) : [];
  }
  function saveCart(items){ safeWrite(KEYS.cart, items); }
  function orders(){
    const arr = safeRead(KEYS.orders, []);
    return Array.isArray(arr) ? arr : [];
  }
  function saveOrders(items){ safeWrite(KEYS.orders, items); }
  function stores(){
    const arr = safeRead(KEYS.stores, []);
    return Array.isArray(arr) ? arr : [];
  }
  function activeStore(){
    return localStorage.getItem(KEYS.activeStore) || '';
  }
  function activeStoreName(){
    const slug = activeStore();
    const s = stores().find(x => x.slug===slug || x.id===slug || x.name===slug);
    return s ? (s.name || s.slug || slug) : (slug || 'Brak');
  }

  function initShell(){
    const page = document.body.dataset.page || '';
    document.querySelectorAll('[data-nav]').forEach(a=>{
      if(a.dataset.nav === page) a.classList.add('active');
    });
    const sb = document.querySelector('.sidebar');
    const bd = document.querySelector('.backdrop');
    const tg = document.querySelector('[data-menu-toggle]');
    const close = ()=>{ if(sb) sb.classList.remove('open'); if(bd) bd.classList.remove('show'); document.body.style.overflow=''; };
    const open = ()=>{ if(sb) sb.classList.add('open'); if(bd) bd.classList.add('show'); document.body.style.overflow='hidden'; };
    tg && tg.addEventListener('click', ()=> sb && sb.classList.contains('open') ? close() : open());
    bd && bd.addEventListener('click', close);
    document.querySelectorAll('[data-close-menu]').forEach(el=>el.addEventListener('click', close));

    const map = {
      products: products().length,
      orders: orders().length,
      stores: stores().length,
      margin: currentMargin() + '%',
      activeStore: activeStoreName()
    };
    document.querySelectorAll('[data-bind]').forEach(el=>{
      const key = el.dataset.bind;
      if(map[key] !== undefined) el.textContent = map[key];
    });
  }

  function seedDemoData(){
    if(!products().length){
      safeWrite(KEYS.products,[
        {id:'1',name:'Bluza Premium QM',supplier:'AliExpress',basePrice:79,img:'',moq:1},
        {id:'2',name:'Kubek Motywacja Biznes',supplier:'CJ Dropshipping',basePrice:19,img:'',moq:2},
        {id:'3',name:'Organizer biurowy',supplier:'VidaXL',basePrice:44,img:'',moq:1}
      ]);
    }
    if(!stores().length){
      safeWrite(KEYS.stores,[{slug:'qualitet-main',name:'Qualitet Main',marginPct:currentMargin(),isDefault:true}]);
      localStorage.setItem(KEYS.activeStore,'qualitet-main');
    }
    if(!cart().length){
      const p=products().slice(0,2);
      saveCart(p.map((x,i)=>({...x, qty:i===0?1:2})));
    }
    ensureMargins();
  }

  function renderCartPage(){
    const list = document.querySelector('[data-cart-list]');
    if(!list) return;
    seedDemoData();
    const items = cart();
    const marginPct = currentMargin();
    list.innerHTML = '';
    if(!items.length){
      list.innerHTML = '<div class="empty">Koszyk jest pusty. Dodaj produkty ze sklepu.</div>';
    }else{
      items.forEach((item, idx)=>{
        const line = item.price * item.qty;
        const el = document.createElement('article');
        el.className = 'item';
        el.innerHTML = `
          <div class="thumb">${item.img ? `<img src="${item.img}" alt="">` : '🛒'}</div>
          <div>
            <p class="item-title">${item.name}</p>
            <div class="badge">${item.supplier}</div>
            <div class="price-row">
              <span class="badge">Cena ${money(item.price)}</span>
              <span class="badge">MOQ ${item.moq}</span>
              <span class="badge">Marża ${marginPct}%</span>
            </div>
            <div class="qty-row">
              <button class="btn btn-secondary" data-cart-minus="${idx}">−</button>
              <input class="small-input" style="max-width:90px" type="number" min="1" value="${item.qty}" data-cart-qty="${idx}">
              <button class="btn btn-secondary" data-cart-plus="${idx}">+</button>
              <button class="btn btn-ghost" data-cart-remove="${idx}">Usuń</button>
            </div>
            <div class="line-row"><strong>Wartość pozycji: ${money(line)}</strong></div>
          </div>
        `;
        list.appendChild(el);
      });
    }
    function updateTotals(){
      const items = cart();
      const subtotal = items.reduce((a,b)=>a+(b.price*b.qty),0);
      const vat = subtotal*0.23;
      const total = subtotal+vat;
      const sellerMargin = items.reduce((a,b)=> a + ((b.price - b.basePrice) * b.qty), 0);
      const platformFee = subtotal * 0.05;
      const moqIssue = items.some(i=>i.qty < i.moq);
      document.querySelector('[data-subtotal]').textContent = money(subtotal);
      document.querySelector('[data-vat]').textContent = money(vat);
      document.querySelector('[data-total]').textContent = money(total);
      document.querySelector('[data-seller-margin]').textContent = money(sellerMargin);
      document.querySelector('[data-platform-fee]').textContent = money(platformFee);
      const warn = document.querySelector('[data-moq-warning]');
      if(warn) warn.style.display = moqIssue ? 'block' : 'none';
      const count = items.reduce((a,b)=>a+b.qty,0);
      const countEls = document.querySelectorAll('[data-cart-count]');
      countEls.forEach(el=>el.textContent = String(count));
    }
    updateTotals();

    list.addEventListener('click', (e)=>{
      let items = cart();
      const plus = e.target.closest('[data-cart-plus]');
      const minus = e.target.closest('[data-cart-minus]');
      const remove = e.target.closest('[data-cart-remove]');
      if(plus){ const i=+plus.dataset.cartPlus; items[i].qty += 1; saveCart(items); renderCartPage(); }
      if(minus){ const i=+minus.dataset.cartMinus; items[i].qty = Math.max(1, items[i].qty-1); saveCart(items); renderCartPage(); }
      if(remove){ const i=+remove.dataset.cartRemove; items.splice(i,1); saveCart(items); renderCartPage(); }
    });
    list.addEventListener('change',(e)=>{
      const input = e.target.closest('[data-cart-qty]');
      if(!input) return;
      const i = +input.dataset.cartQty;
      const items = cart();
      items[i].qty = Math.max(1, parseNum(input.value,1));
      saveCart(items);
      renderCartPage();
    });
    const clearBtn = document.querySelector('[data-clear-cart]');
    clearBtn && clearBtn.addEventListener('click', ()=>{
      saveCart([]);
      renderCartPage();
    });
  }

  function renderCheckoutPage(){
    const root = document.querySelector('[data-checkout-root]');
    if(!root) return;
    seedDemoData();
    const items = cart();
    const summary = document.querySelector('[data-checkout-summary]');
    if(!items.length){
      summary.innerHTML = '<div class="empty">Brak produktów w koszyku. Wróć do sklepu albo dodaj demo dane.</div>';
      return;
    }
    summary.innerHTML = items.map(it=>`
      <div class="total-line"><span>${it.name} × ${it.qty}</span><strong>${money(it.price * it.qty)}</strong></div>
    `).join('');
    const subtotal = items.reduce((a,b)=>a+b.price*b.qty,0);
    const vat = subtotal*0.23;
    const total = subtotal+vat;
    document.querySelector('[data-checkout-subtotal]').textContent = money(subtotal);
    document.querySelector('[data-checkout-vat]').textContent = money(vat);
    document.querySelector('[data-checkout-total]').textContent = money(total);

    const form = document.querySelector('[data-checkout-form]');
    form && form.addEventListener('submit',(e)=>{
      e.preventDefault();
      const fd = new FormData(form);
      const order = {
        id: 'QM-' + Date.now(),
        createdAt: new Date().toISOString(),
        customer: fd.get('customer'),
        email: fd.get('email'),
        phone: fd.get('phone'),
        address: fd.get('address'),
        city: fd.get('city'),
        zip: fd.get('zip'),
        note: fd.get('note'),
        items,
        subtotal,
        vat,
        total,
        store: activeStoreName(),
        status: 'Nowe'
      };
      const all = orders();
      all.unshift(order);
      saveOrders(all);
      saveCart([]);
      window.location.href = 'success.html';
    });
  }

  function renderOrdersPage(){
    const root = document.querySelector('[data-orders-root]');
    if(!root) return;
    seedDemoData();
    const data = orders();
    const tbody = document.querySelector('[data-orders-body]');
    const empty = document.querySelector('[data-orders-empty]');
    if(!data.length){
      empty.style.display = 'block';
      tbody.innerHTML = '';
      return;
    }
    empty.style.display = 'none';
    tbody.innerHTML = data.map(o=>`
      <tr>
        <td>${o.id}</td>
        <td>${new Date(o.createdAt).toLocaleDateString('pl-PL')}</td>
        <td>${o.customer || 'Klient'}</td>
        <td>${o.store || '-'}</td>
        <td>${o.status || 'Nowe'}</td>
        <td>${money(o.total)}</td>
      </tr>
    `).join('');
    const totalRev = data.reduce((a,b)=>a+parseNum(b.total,0),0);
    const totalCount = data.length;
    const avg = totalCount ? totalRev/totalCount : 0;
    const metricRev = document.querySelector('[data-orders-revenue]');
    const metricCount = document.querySelector('[data-orders-count]');
    const metricAvg = document.querySelector('[data-orders-avg]');
    metricRev && (metricRev.textContent = money(totalRev));
    metricCount && (metricCount.textContent = String(totalCount));
    metricAvg && (metricAvg.textContent = money(avg));
  }

  function renderStoreOrdersPage(){
    const root = document.querySelector('[data-store-orders-root]');
    if(!root) return;
    renderOrdersPage();
    const storeName = activeStoreName();
    const note = document.querySelector('[data-store-orders-note]');
    if(note) note.textContent = 'Aktywny sklep: ' + storeName;
  }

  function renderStoresPage(){
    const root = document.querySelector('[data-stores-root]');
    if(!root) return;
    seedDemoData();
    const list = document.querySelector('[data-stores-list]');
    const render = ()=>{
      const data = stores();
      const active = activeStore();
      list.innerHTML = data.map((s,idx)=>`
        <article class="card">
          <div class="total-line"><strong>${s.name || s.slug || ('Sklep '+(idx+1))}</strong><span class="badge">${s.slug || 'bez-sluga'}</span></div>
          <p class="meta">Marża sklepu: ${parseNum(s.marginPct,currentMargin())}% • ${active === (s.slug||s.id||s.name) ? 'aktywny' : 'nieaktywny'}</p>
          <div class="top-actions">
            <button class="btn btn-primary" data-set-active="${s.slug || s.id || s.name}">Ustaw aktywny</button>
            <button class="btn btn-secondary" data-store-margin="${idx}">Podbij marżę +5%</button>
          </div>
        </article>
      `).join('');
    };
    render();
    list.addEventListener('click',(e)=>{
      const set = e.target.closest('[data-set-active]');
      const mar = e.target.closest('[data-store-margin]');
      if(set){
        localStorage.setItem(KEYS.activeStore, set.dataset.setActive);
        render(); initShell();
      }
      if(mar){
        const data = stores();
        const i = +mar.dataset.storeMargin;
        data[i].marginPct = parseNum(data[i].marginPct,currentMargin()) + 5;
        safeWrite(KEYS.stores, data);
        localStorage.setItem(KEYS.margin, String(data[i].marginPct));
        render(); initShell();
      }
    });
    const form = document.querySelector('[data-store-form]');
    form && form.addEventListener('submit',(e)=>{
      e.preventDefault();
      const fd = new FormData(form);
      const name = String(fd.get('name')||'').trim();
      const slug = String(fd.get('slug')||'').trim() || name.toLowerCase().replace(/\s+/g,'-');
      if(!name) return;
      const data = stores();
      data.unshift({name, slug, marginPct: currentMargin()});
      safeWrite(KEYS.stores,data);
      form.reset();
      render(); initShell();
    });
  }

  window.QMApp = { initShell, renderCartPage, renderCheckoutPage, renderOrdersPage, renderStoreOrdersPage, renderStoresPage, seedDemoData };
  document.addEventListener('DOMContentLoaded', ()=>{
    initShell();
    renderCartPage();
    renderCheckoutPage();
    renderOrdersPage();
    renderStoreOrdersPage();
    renderStoresPage();
  });
})();
