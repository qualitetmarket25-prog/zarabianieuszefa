
(function(){
  "use strict";
  const slugify = (s) => String(s || "")
    .trim().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-z0-9]+/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'');
  const storeFromUrl = () => {
    try{
      const u = new URL(window.location.href);
      return slugify(u.searchParams.get('store') || '');
    }catch(e){ return ''; }
  };
  const activeStore = () => slugify(localStorage.getItem('qm_active_store_v1') || '') || storeFromUrl() || 'default';
  const withStore = (href) => {
    if(!href) return href;
    if(/^https?:/i.test(href) && !href.includes(location.host)) return href;
    if(href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return href;
    const store = activeStore();
    if(!store || store === 'default') return href;
    try{
      const u = new URL(href, window.location.href);
      if(!u.searchParams.get('store')) u.searchParams.set('store', store);
      const base = u.pathname.split('/').pop() + (u.search ? u.search : '') + (u.hash ? u.hash : '');
      return base;
    }catch(e){
      return href;
    }
  };
  const links = [
    ['index.html','Start','⌂'],
    ['platforma.html','Platforma','⬢'],
    ['dashboard.html','Panel','⚙'],
    ['sklep.html','Sklep','🛒'],
    ['koszyk.html','Koszyk','＋'],
    ['checkout.html','Checkout','✓'],
    ['zamowienia.html','Zamówienia','☰'],
    ['sklepy.html','Sklepy','🏪'],
    ['hurtownie.html','Hurtownie','📦'],
    ['aplikacje.html','Aplikacje','📱'],
    ['ai.html','AI','✦'],
    ['cennik.html','Cennik','💳']
  ];
  const current = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  function shell(title, subtitle){
    const header = `
      <header class="topbar">
        <div class="container topbar-inner">
          <div class="brand">
            <img src="uszefaqualitet-logo.svg" alt="QualitetMarket logo">
            <div>
              <div class="brand-title">${title || 'QualitetMarket'}</div>
              <div class="brand-sub">${subtitle || 'Mobile-first • GitHub Pages • Zarabianie u Szefa'}</div>
            </div>
          </div>
          <div class="top-actions">
            <a class="chip desktop-only" href="${withStore('sklepy.html')}">Aktywny sklep: <strong id="topbarStoreName">default</strong></a>
            <button class="menu-toggle mobile-only" id="openMenuBtn" aria-label="Otwórz menu">☰</button>
          </div>
        </div>
      </header>`;
    const sidebar = `
      <aside class="sidebar desktop-only">
        <h3>Start</h3>
        <div class="nav-list">
          ${links.slice(0,3).map(([href,label,icon])=>`<a class="nav-link ${current===href?'active':''}" href="${withStore(href)}"><span>${icon} ${label}</span><span>→</span></a>`).join('')}
        </div>
        <h3>Sprzedaż</h3>
        <div class="nav-list">
          ${links.slice(3,7).map(([href,label,icon])=>`<a class="nav-link ${current===href?'active':''}" href="${withStore(href)}"><span>${icon} ${label}</span><span>→</span></a>`).join('')}
        </div>
        <h3>Rozwój</h3>
        <div class="nav-list">
          ${links.slice(7).map(([href,label,icon])=>`<a class="nav-link ${current===href?'active':''}" href="${withStore(href)}"><span>${icon} ${label}</span><span>→</span></a>`).join('')}
        </div>
      </aside>`;
    const drawer = `
      <div class="drawer" id="appDrawer">
        <div class="drawer-panel">
          <div class="drawer-head">
            <div class="brand">
              <img src="uszefaqualitet-logo.svg" alt="logo">
              <div>
                <div class="brand-title">Menu główne</div>
                <div class="brand-sub">Wszystkie moduły aplikacji</div>
              </div>
            </div>
            <button class="menu-toggle" id="closeMenuBtn">✕</button>
          </div>
          <div class="nav-list">
            ${links.map(([href,label,icon])=>`<a class="nav-link ${current===href?'active':''}" href="${withStore(href)}"><span>${icon} ${label}</span><span>→</span></a>`).join('')}
          </div>
        </div>
      </div>`;
    const bottom = `
      <nav class="bottom-nav mobile-only">
        <div class="bottom-nav-inner">
          ${[
            ['index.html','Start','⌂'],
            ['sklep.html','Sklep','🛒'],
            ['koszyk.html','Koszyk','＋'],
            ['zamowienia.html','Zam.','☰'],
            ['sklepy.html','Sklepy','🏪'],
          ].map(([href,label,icon])=>`<a class="bottom-link ${current===href?'active':''}" href="${withStore(href)}"><div>${icon}</div><div>${label}</div></a>`).join('')}
        </div>
      </nav>`;
    return {header, sidebar, drawer, bottom};
  }
  function mount(opts){
    const slot = document.getElementById('appShell');
    if(!slot) return;
    const parts = shell(opts?.title, opts?.subtitle);
    slot.innerHTML = parts.header + `<div class="container layout">${parts.sidebar}<main class="main" id="pageContent"></main></div>` + parts.drawer + parts.bottom;
    const content = document.getElementById('pageContent');
    const page = document.getElementById('pageBody');
    if(page && content){ content.append(...Array.from(page.childNodes)); }
    document.getElementById('openMenuBtn')?.addEventListener('click', ()=>document.getElementById('appDrawer')?.classList.add('open'));
    document.getElementById('closeMenuBtn')?.addEventListener('click', ()=>document.getElementById('appDrawer')?.classList.remove('open'));
    document.getElementById('appDrawer')?.addEventListener('click', (e)=>{ if(e.target.id==='appDrawer') e.currentTarget.classList.remove('open'); });
    document.getElementById('topbarStoreName')?.replaceChildren(document.createTextNode(activeStore()));
    document.querySelectorAll('a[href]').forEach(a=>{
      const raw = a.getAttribute('href') || '';
      if(raw && /\.html(\?|$)|\/$/.test(raw)) a.setAttribute('href', withStore(raw));
    });
  }
  function readJSON(key, fallback){ try { const x = JSON.parse(localStorage.getItem(key) || ''); return x ?? fallback; } catch { return fallback; } }
  function writeJSON(key, val){ localStorage.setItem(key, JSON.stringify(val)); }
  function money(n){ return (Number(n||0)).toLocaleString('pl-PL',{minimumFractionDigits:2, maximumFractionDigits:2}) + ' zł'; }
  function getStoreRecord(){
    const slug = activeStore();
    const stores = readJSON('qm_stores_v1', []);
    if(Array.isArray(stores)){
      const hit = stores.find(s => slugify(s.slug || s.name || s.id || '') === slug);
      if(hit) return hit;
    }
    return { slug, name: slug, marginPct: Number(localStorage.getItem('qm_store_margin_pct') || 20) || 20 };
  }
  window.QM_APP = { slugify, activeStore, withStore, mount, readJSON, writeJSON, money, getStoreRecord };
})();
