
(function(){
  const links = [
    ['start','🏠','Start','index.html'],
    ['platforma','🧭','Platforma','platforma.html'],
    ['sklep','🛒','Sklep','sklep.html'],
    ['hurtownie','📦','Hurtownie','hurtownie.html'],
    ['cennik','💎','Cennik','cennik.html'],
    ['dashboard','📊','Dashboard','dashboard.html'],
    ['koszyk','🧺','Koszyk','koszyk.html'],
    ['checkout','💳','Checkout','checkout.html'],
    ['zamowienia','📄','Zamówienia','zamowienia.html'],
    ['sklepy','🏪','Sklepy','sklepy.html'],
    ['kontakt','✉️','Kontakt','kontakt.html']
  ];
  const page = document.body.dataset.page || '';
  const activePlan = (localStorage.getItem('qm_plan_v1') || 'basic').toLowerCase();
  const badge = activePlan.toUpperCase();
  const totalCart = (() => {
    try{
      const cart = JSON.parse(localStorage.getItem('qm_cart_v1')||'[]');
      return cart.reduce((a,b)=>a+(Number(b.qty)||0),0);
    }catch(e){ return 0; }
  })();

  function navHtml(){
    return links.map(([key,icon,label,href]) =>
      `<a class="nav-link ${page===key?'active':''}" href="${href}"><span class="icon">${icon}</span><span>${label}</span></a>`
    ).join('');
  }
  const shellStart = document.getElementById('shell-start');
  if(shellStart){
    shellStart.insertAdjacentHTML('afterbegin', `
      <aside class="sidebar">
        <a href="index.html" class="brand">
          <img class="brand-logo" src="uszefaqualitet-logo.svg" alt="QualitetMarket">
          <div>
            <div class="brand-name">QualitetMarket</div>
            <div class="brand-sub">Aplikacja do zarabiania i dropshippingu</div>
          </div>
        </a>
        <div class="nav-group">
          <div class="nav-label">Główne menu</div>
          ${navHtml()}
        </div>
        <div class="nav-group">
          <div class="nav-label">Plan i marża</div>
          <div class="kpi">
            <div class="kpi-label">Aktywny plan</div>
            <div class="kpi-value">${badge}</div>
            <div class="small muted">Marża sklepu: <span id="sidebarMarginValue">0%</span></div>
          </div>
        </div>
      </aside>
    `);
  }

  const topbar = document.getElementById('topbar');
  if(topbar){
    topbar.innerHTML = `
      <div class="container topbar-inner">
        <div style="display:flex;align-items:center;gap:10px">
          <button class="burger" id="openDrawer" aria-label="Otwórz menu">☰</button>
          <a class="mobile-brand" href="index.html">
            <img src="uszefaqualitet-logo.svg" alt="QualitetMarket">
            <div>
              <div style="font-weight:800">QualitetMarket</div>
              <div class="small muted">Zarabiaj przez swój sklep</div>
            </div>
          </a>
        </div>
        <div class="top-actions">
          <span class="badge blue">Plan: ${badge}</span>
          <span class="badge">Koszyk: ${totalCart}</span>
          <a class="btn btn-primary hide-mobile" href="cennik.html">Uruchom PRO</a>
        </div>
      </div>
    `;
  }

  const drawer = document.getElementById('mobileDrawer');
  if(drawer){
    drawer.innerHTML = `
      <div class="mobile-drawer-panel">
        <a href="index.html" class="brand" style="margin-bottom:14px">
          <img class="brand-logo" src="uszefaqualitet-logo.svg" alt="QualitetMarket">
          <div>
            <div class="brand-name">QualitetMarket</div>
            <div class="brand-sub">Menu główne aplikacji</div>
          </div>
        </a>
        ${navHtml()}
      </div>
    `;
  }

  const bottom = document.getElementById('bottomNav');
  if(bottom){
    const subset = [
      ['start','🏠','Start','index.html'],
      ['sklep','🛒','Sklep','sklep.html'],
      ['hurtownie','📦','Hurt.','hurtownie.html'],
      ['koszyk','🧺','Koszyk','koszyk.html'],
      ['dashboard','📊','Panel','dashboard.html']
    ];
    bottom.innerHTML = subset.map(([key,icon,label,href]) =>
      `<a class="${page===key?'active':''}" href="${href}"><span>${icon}</span><span>${label}</span></a>`
    ).join('');
  }

  document.addEventListener('click', (e) => {
    if(e.target.closest('#openDrawer')){
      drawer?.classList.add('open');
      document.body.classList.add('drawer-open');
    }
    if(e.target === drawer){
      drawer.classList.remove('open');
      document.body.classList.remove('drawer-open');
    }
    const actionEl = e.target.closest('[data-go]');
    if(actionEl){
      const href = actionEl.getAttribute('data-go');
      if(href) location.href = href;
    }
  });

  const marginValue = document.getElementById('sidebarMarginValue');
  if(marginValue){
    marginValue.textContent = (localStorage.getItem('qm_store_margin_pct') || '15') + '%';
  }

  const yearEls = document.querySelectorAll('[data-year]');
  yearEls.forEach(el=>el.textContent = new Date().getFullYear());
})();
