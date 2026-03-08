
(function(){
  const $ = (s, p=document) => p.querySelector(s);
  const $$ = (s, p=document) => Array.from(p.querySelectorAll(s));
  const STORE_KEYS = {
    products:"qm_products_by_supplier_v1",
    intel:"qm_intel_prefill_v1",
    listing:"qm_listing_prefill_v1",
    crm:"qm_crm_v1",
    orders:"qm_orders_v1",
    stores:"qm_stores_v1",
    activeStore:"qm_active_store_v1",
    margin:"qm_store_margin_pct",
    plan:"qm_plan_v1",
    ads:"qm_ads_v1",
    campaigns:"qm_ads_campaigns_v1",
    cart:"qm_cart_v1",
    apps:"qm_apps_v1"
  };
  function getJson(k,fallback){ try{return JSON.parse(localStorage.getItem(k)) ?? fallback;}catch(e){return fallback;} }
  function setJson(k,v){ localStorage.setItem(k, JSON.stringify(v)); }
  function currentPlan(){ return localStorage.getItem(STORE_KEYS.plan) || "basic"; }
  function setPlan(plan){ localStorage.setItem(STORE_KEYS.plan, plan); applyGuards(); const planEl=$("#plan-pill"); if(planEl) planEl.textContent=plan.toUpperCase(); }
  function applyGuards(){
    const plan = currentPlan();
    const rank = {basic:1, pro:2, elite:3, boss:4};
    $$("[data-require]").forEach(el=>{
      const need = el.getAttribute("data-require");
      const ok = (rank[plan]||1) >= (rank[need]||9);
      el.classList.toggle("locked", !ok);
      if(!ok){
        el.setAttribute("aria-disabled","true");
        if(el.dataset.guardProcessed) return;
        el.dataset.guardProcessed = "1";
        const badge = document.createElement("span");
        badge.className = "nav-mini";
        badge.textContent = need.toUpperCase();
        if(el.classList.contains("nav-link")) el.appendChild(badge);
      }
    });
    const planEl=$("#plan-pill"); if(planEl) planEl.textContent=plan.toUpperCase();
  }
  function toggleMenu(){ $(".sidebar")?.classList.toggle("open"); }
  function seed(){
    if(!localStorage.getItem(STORE_KEYS.products)){
      setJson(STORE_KEYS.products, [
        {name:"SmartWatch Pro", price:199, img:"", supplier:"CJ"},
        {name:"Lampa LED Home", price:89, img:"", supplier:"AliExpress"},
        {name:"Organizer Premium", price:49, img:"", supplier:"VidaXL"}
      ]);
    }
    if(!localStorage.getItem(STORE_KEYS.orders)){
      setJson(STORE_KEYS.orders, [
        {id:"#1001", customer:"Anna Kowalska", total:249, status:"Opłacone"},
        {id:"#1002", customer:"Piotr Nowak", total:89, status:"W realizacji"}
      ]);
    }
    if(!localStorage.getItem(STORE_KEYS.stores)){
      setJson(STORE_KEYS.stores, [
        {name:"Uszefa Home", slug:"uszefa-home", niche:"Dom"},
        {name:"Auto Market", slug:"auto-market", niche:"Motoryzacja"}
      ]);
      localStorage.setItem(STORE_KEYS.activeStore, "uszefa-home");
    }
    if(!localStorage.getItem(STORE_KEYS.ads)){
      setJson(STORE_KEYS.ads, [
        {title:"Sprzedam BMW 320d 2018", category:"Auta", price:"69 900 zł", city:"Warszawa"},
        {title:"Wynajmę mieszkanie 2 pokoje", category:"Nieruchomości", price:"2 900 zł / mies.", city:"Kraków"}
      ]);
    }
    if(!localStorage.getItem(STORE_KEYS.apps)){
      setJson(STORE_KEYS.apps, [
        {name:"Sklep Fashion App", type:"Sklep", model:"PWA", status:"Gotowa"},
        {name:"Nieruchomości Premium", type:"Ogłoszenia", model:"PWA", status:"W budowie"}
      ]);
    }
    if(!localStorage.getItem(STORE_KEYS.campaigns)){
      setJson(STORE_KEYS.campaigns, [
        {name:"Promocja sklepu maj", budget:300, result:"12 zamówień"},
        {name:"Auto premium boost", budget:150, result:"34 leady"}
      ]);
    }
    if(!localStorage.getItem(STORE_KEYS.margin)){ localStorage.setItem(STORE_KEYS.margin, "25"); }
    if(!localStorage.getItem(STORE_KEYS.plan)){ localStorage.setItem(STORE_KEYS.plan, "pro"); }
  }
  function fillStats(){
    const products = getJson(STORE_KEYS.products, []);
    const orders = getJson(STORE_KEYS.orders, []);
    const ads = getJson(STORE_KEYS.ads, []);
    const apps = getJson(STORE_KEYS.apps, []);
    $("#stat-products") && ($("#stat-products").textContent = products.length);
    $("#stat-orders") && ($("#stat-orders").textContent = orders.length);
    $("#stat-ads") && ($("#stat-ads").textContent = ads.length);
    $("#stat-apps") && ($("#stat-apps").textContent = apps.length);
  }
  function renderList(id, items, map){
    const el = document.getElementById(id); if(!el) return;
    el.innerHTML = items.map(map).join("");
  }
  function bindPlanButtons(){
    $$("[data-set-plan]").forEach(btn=>btn.addEventListener("click", ()=>setPlan(btn.dataset.setPlan)));
  }
  function bindForms(){
    $("#ad-form")?.addEventListener("submit", e=>{
      e.preventDefault();
      const fd = new FormData(e.target);
      const ads = getJson(STORE_KEYS.ads, []);
      ads.unshift({
        title:fd.get("title")||"",
        category:fd.get("category")||"",
        price:fd.get("price")||"",
        city:fd.get("city")||"Online"
      });
      setJson(STORE_KEYS.ads, ads);
      location.href="ogloszenia.html";
    });
    $("#campaign-form")?.addEventListener("submit", e=>{
      e.preventDefault();
      const fd = new FormData(e.target);
      const campaigns = getJson(STORE_KEYS.campaigns, []);
      campaigns.unshift({
        name:fd.get("name"),
        budget:fd.get("budget"),
        result:"Nowa kampania"
      });
      setJson(STORE_KEYS.campaigns, campaigns);
      location.href="reklama.html";
    });
    $("#app-form")?.addEventListener("submit", e=>{
      e.preventDefault();
      const fd = new FormData(e.target);
      const apps = getJson(STORE_KEYS.apps, []);
      apps.unshift({
        name:fd.get("name"),
        type:fd.get("type"),
        model:fd.get("model"),
        status:"Nowa"
      });
      setJson(STORE_KEYS.apps, apps);
      location.href="aplikacje.html";
    });
    $("#checkout-form")?.addEventListener("submit", e=>{
      e.preventDefault();
      const orders = getJson(STORE_KEYS.orders, []);
      orders.unshift({id:"#"+Math.floor(Math.random()*9000+1000), customer:($("#client-name")||{}).value||"Nowy klient", total:($("#client-total")||{}).value||99, status:"Opłacone"});
      setJson(STORE_KEYS.orders, orders);
      localStorage.removeItem(STORE_KEYS.cart);
      location.href="success.html";
    });
  }
  function render(){
    renderList("orders-list", getJson(STORE_KEYS.orders, []), o=>`<tr><td>${o.id}</td><td>${o.customer}</td><td>${o.total} zł</td><td><span class="tag ${o.status==='Opłacone'?'green':'blue'}">${o.status}</span></td></tr>`);
    renderList("products-list", getJson(STORE_KEYS.products, []), p=>`<div class="list-item"><div><strong>${p.name}</strong><div class="muted">${p.supplier||'Supplier'}</div></div><div><strong>${p.price} zł</strong></div></div>`);
    renderList("ads-list", getJson(STORE_KEYS.ads, []), a=>`<div class="list-item"><div><strong>${a.title}</strong><div class="muted">${a.category} · ${a.city}</div></div><div><strong>${a.price}</strong></div></div>`);
    renderList("apps-list", getJson(STORE_KEYS.apps, []), a=>`<div class="list-item"><div><strong>${a.name}</strong><div class="muted">${a.type} · ${a.model}</div></div><div><span class="tag blue">${a.status}</span></div></div>`);
    renderList("campaigns-list", getJson(STORE_KEYS.campaigns, []), c=>`<div class="list-item"><div><strong>${c.name}</strong><div class="muted">Budżet: ${c.budget} zł</div></div><div><span class="tag amber">${c.result}</span></div></div>`);
  }
  document.addEventListener("DOMContentLoaded", ()=>{
    seed();
    applyGuards();
    fillStats();
    render();
    bindPlanButtons();
    bindForms();
    $(".menu-toggle")?.addEventListener("click", toggleMenu);
    document.addEventListener("click", e=>{
      if(e.target.matches(".sidebar.open a")) $(".sidebar")?.classList.remove("open");
    });
  });
})();
