
(function(){
  const STORE_KEYS = {
    products: 'qm_products_by_supplier_v1',
    intel: 'qm_intel_prefill_v1',
    listing: 'qm_listing_prefill_v1',
    crm: 'qm_crm_v1',
    orders: 'qm_orders_v1',
    stores: 'qm_stores_v1',
    activeStore: 'qm_active_store_v1',
    margin: 'qm_store_margin_pct',
    cart: 'qm_cart_v1',
    ads: 'qm_ads_v1',
    campaigns: 'qm_ads_campaigns_v1',
    apps: 'qm_apps_v1',
    plan: 'qm_plan_v1'
  };
  function get(key, fallback){
    try{ const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; }catch(e){ return fallback; }
  }
  function set(key, value){ localStorage.setItem(key, JSON.stringify(value)); }
  function money(v){ return new Intl.NumberFormat('pl-PL',{style:'currency',currency:'PLN',maximumFractionDigits:0}).format(Number(v||0)); }

  window.UszefaApp = {
    keys: STORE_KEYS,
    get, set, money,
    seed(){
      if(!get(STORE_KEYS.products,null)){
        set(STORE_KEYS.products,[
          {name:'Smartwatch Pro',price:149,img:'',category:'elektronika'},
          {name:'Lampa LED Home',price:89,img:'',category:'dom'},
          {name:'Krzesło Velvet',price:239,img:'',category:'dom'},
          {name:'Używany iPhone 13',price:1899,img:'',category:'uzywane'}
        ]);
      }
      if(!get(STORE_KEYS.orders,null)){
        set(STORE_KEYS.orders,[
          {id:'UZS-1001',customer:'Anna',total:249,status:'Nowe'},
          {id:'UZS-1002',customer:'Marek',total:399,status:'Opłacone'}
        ]);
      }
      if(!get(STORE_KEYS.stores,null)){
        set(STORE_KEYS.stores,[
          {name:'Mój Sklep Start',slug:'moj-sklep-start',plan:'pro'},
          {name:'Sklep Premium',slug:'sklep-premium',plan:'elite'}
        ]);
      }
      if(!get(STORE_KEYS.activeStore,null)){ localStorage.setItem(STORE_KEYS.activeStore, 'moj-sklep-start'); }
      if(!get(STORE_KEYS.ads,null)){
        set(STORE_KEYS.ads,[
          {title:'Wynajmę mieszkanie 2 pokoje',category:'nieruchomosci',price:2600,city:'Warszawa'},
          {title:'Sprzedam auto Toyota Corolla',category:'motoryzacja',price:28900,city:'Kraków'}
        ]);
      }
      if(!get(STORE_KEYS.campaigns,null)){
        set(STORE_KEYS.campaigns,[
          {name:'Promocja sklepu start',budget:99,target:'Sklep',status:'Aktywna'}
        ]);
      }
      if(!get(STORE_KEYS.apps,null)){
        set(STORE_KEYS.apps,[
          {name:'Aplikacja Mój Sklep',type:'Sklep',status:'Wersja demo',plan:'pro'}
        ]);
      }
      if(!localStorage.getItem(STORE_KEYS.plan)){ localStorage.setItem(STORE_KEYS.plan, 'pro'); }
      if(!localStorage.getItem(STORE_KEYS.margin)){ localStorage.setItem(STORE_KEYS.margin, '25'); }
    },
    plan(){ return localStorage.getItem(STORE_KEYS.plan) || 'basic'; },
    setPlan(plan){ localStorage.setItem(STORE_KEYS.plan, plan); },
    applyPlanGuards(){
      const plan = this.plan();
      document.querySelectorAll('[data-require]').forEach(el=>{
        const req = (el.getAttribute('data-require')||'').toLowerCase();
        const ok = req === 'pro' ? ['pro','elite','boss'].includes(plan) : ['elite','boss'].includes(plan);
        if(!ok){
          el.style.opacity = '.55';
          el.style.pointerEvents = 'none';
          el.setAttribute('title', 'Dostępne w wyższym planie');
        }
      });
      const holder = document.querySelector('[data-plan-badge]');
      if(holder) holder.textContent = plan.toUpperCase();
    },
    bindNav(){
      const btn=document.querySelector('[data-menu-toggle]');
      const sidebar=document.querySelector('.sidebar');
      if(btn && sidebar){ btn.addEventListener('click',()=>sidebar.classList.toggle('open')); }
      document.querySelectorAll('[data-set-plan]').forEach(btn=>{
        btn.addEventListener('click',()=>{
          this.setPlan(btn.dataset.setPlan);
          alert('Plan ustawiony: ' + btn.dataset.setPlan.toUpperCase());
          location.reload();
        });
      });
    },
    renderStats(){
      const statEls = document.querySelectorAll('[data-stat]');
      const products = get(STORE_KEYS.products,[]).length;
      const orders = get(STORE_KEYS.orders,[]).length;
      const stores = get(STORE_KEYS.stores,[]).length;
      const ads = get(STORE_KEYS.ads,[]).length;
      const apps = get(STORE_KEYS.apps,[]).length;
      const map = {products,orders,stores,ads,apps};
      statEls.forEach(el=>{ const key=el.dataset.stat; if(key in map) el.textContent = map[key]; });
    },
    renderList(targetKey, key, renderer){
      const root=document.querySelector(targetKey);
      if(!root) return;
      const items=get(key,[]);
      root.innerHTML = items.length ? items.map(renderer).join('') : '<div class="list-item">Brak danych</div>';
    },
    saveAd(form){
      const data=new FormData(form);
      const ads=get(STORE_KEYS.ads,[]);
      ads.unshift({
        title:data.get('title'),
        category:data.get('category'),
        price:Number(data.get('price')||0),
        city:data.get('city')||'Polska'
      });
      set(STORE_KEYS.ads,ads); return ads;
    },
    saveCampaign(form){
      const data=new FormData(form);
      const list=get(STORE_KEYS.campaigns,[]);
      list.unshift({
        name:data.get('name'),
        budget:Number(data.get('budget')||0),
        target:data.get('target'),
        status:'Aktywna'
      });
      set(STORE_KEYS.campaigns,list); return list;
    },
    saveApp(form){
      const data=new FormData(form);
      const list=get(STORE_KEYS.apps,[]);
      list.unshift({
        name:data.get('name'),
        type:data.get('type'),
        status:'Nowa wersja',
        plan:data.get('plan')
      });
      set(STORE_KEYS.apps,list); return list;
    },
    initForms(){
      const adForm=document.querySelector('[data-ad-form]');
      if(adForm){
        adForm.addEventListener('submit',(e)=>{
          e.preventDefault(); this.saveAd(adForm); alert('Ogłoszenie dodane'); adForm.reset(); location.reload();
        });
      }
      const campForm=document.querySelector('[data-campaign-form]');
      if(campForm){
        campForm.addEventListener('submit',(e)=>{
          e.preventDefault(); this.saveCampaign(campForm); alert('Kampania utworzona'); campForm.reset(); location.reload();
        });
      }
      const appForm=document.querySelector('[data-app-form]');
      if(appForm){
        appForm.addEventListener('submit',(e)=>{
          e.preventDefault(); this.saveApp(appForm); alert('Aplikacja zapisana'); appForm.reset(); location.reload();
        });
      }
      const login=document.querySelector('[data-login-form]');
      if(login){
        login.addEventListener('submit',e=>{ e.preventDefault(); location.href='dashboard.html'; });
      }
      const checkout=document.querySelector('[data-checkout-form]');
      if(checkout){
        checkout.addEventListener('submit',e=>{
          e.preventDefault();
          const orders=get(STORE_KEYS.orders,[]);
          orders.unshift({id:'UZS-'+Math.floor(Math.random()*9000+1000),customer:'Nowy klient',total:199,status:'Nowe'});
          set(STORE_KEYS.orders,orders);
          location.href='success.html';
        });
      }
    }
  };
  document.addEventListener('DOMContentLoaded', function(){
    window.UszefaApp.seed();
    window.UszefaApp.bindNav();
    window.UszefaApp.applyPlanGuards();
    window.UszefaApp.renderStats();
    window.UszefaApp.initForms();
    window.UszefaApp.renderList('[data-products-list]', STORE_KEYS.products, function(item){
      return `<div class="list-item"><strong>${item.name}</strong><div class="footer-note">${item.category||'produkt'}</div><div class="price" style="font-size:24px">${money(item.price)}</div></div>`;
    });
    window.UszefaApp.renderList('[data-orders-list]', STORE_KEYS.orders, function(item){
      return `<div class="list-item"><strong>${item.id}</strong><div class="footer-note">${item.customer} • ${item.status}</div><div>${money(item.total)}</div></div>`;
    });
    window.UszefaApp.renderList('[data-ads-list]', STORE_KEYS.ads, function(item){
      return `<div class="list-item"><strong>${item.title}</strong><div class="footer-note">${item.category} • ${item.city||'Polska'}</div><div>${money(item.price)}</div></div>`;
    });
    window.UszefaApp.renderList('[data-campaigns-list]', STORE_KEYS.campaigns, function(item){
      return `<div class="list-item"><strong>${item.name}</strong><div class="footer-note">${item.target} • ${item.status}</div><div>Budżet: ${money(item.budget)}</div></div>`;
    });
    window.UszefaApp.renderList('[data-apps-list]', STORE_KEYS.apps, function(item){
      return `<div class="list-item"><strong>${item.name}</strong><div class="footer-note">${item.type} • ${item.status}</div><div>Plan: ${String(item.plan||'pro').toUpperCase()}</div></div>`;
    });
  });
})();
