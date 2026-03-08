
(function(){
  const shellData = {
    menu: [
      {href:'index.html', title:'Start', desc:'główne wejście'},
      {href:'platforma.html', title:'Platforma', desc:'centrum aplikacji'},
      {href:'dashboard.html', title:'Dashboard', desc:'wyniki i szybkie akcje'},
      {href:'sklep.html', title:'Sklep', desc:'produkty i sprzedaż'},
      {href:'hurtownie.html', title:'Hurtownie', desc:'import i dostawcy'},
      {href:'koszyk.html', title:'Koszyk', desc:'produkty do zamówienia'},
      {href:'checkout.html', title:'Checkout', desc:'finalizacja zamówień'},
      {href:'zamowienia.html', title:'Zamówienia', desc:'lista sprzedaży'},
      {href:'sklepy.html', title:'Sklepy', desc:'multi-store i marża'},
      {href:'panel-sklepu.html', title:'Panel sklepu', desc:'ustawienia sklepu'},
      {href:'generator-sklepu.html', title:'Generator', desc:'tworzenie sklepu'},
      {href:'ai.html', title:'AI', desc:'narzędzia AI'},
      {href:'reklama-ai.html', title:'Reklama AI', desc:'materiały sprzedażowe'},
      {href:'aplikacje.html', title:'Aplikacje', desc:'katalog aplikacji'},
      {href:'stworz-aplikacje.html', title:'Stwórz aplikację', desc:'generator aplikacji'},
      {href:'intelligence.html', title:'Intelligence', desc:'analiza i listing'},
      {href:'qualitetmarket.html', title:'QualitetMarket', desc:'marketplace i sprzedaż'},
      {href:'suppliers.html', title:'Suppliers', desc:'partnerzy i dostawcy'},
      {href:'blueprints.html', title:'Blueprints', desc:'gotowe schematy'},
      {href:'cennik.html', title:'Cennik', desc:'plany i aktywacja'},
      {href:'login.html', title:'Login', desc:'wejście do aplikacji'}
    ],
    bottom: [
      {href:'index.html', label:'Start', icon:'⌂'},
      {href:'platforma.html', label:'Panel', icon:'▣'},
      {href:'sklep.html', label:'Sklep', icon:'🛒'},
      {href:'hurtownie.html', label:'Import', icon:'⬇'},
      {href:'zamowienia.html', label:'Zamów.', icon:'✓'},
      {href:'sklepy.html', label:'Sklepy', icon:'◫'}
    ]
  };

  function currentPage(){
    const path = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    return path || 'index.html';
  }

  function renderShell(){
    const root = document.querySelector('[data-shell]');
    if(!root) return;

    const page = currentPage();
    const title = root.getAttribute('data-title') || 'QualitetMarket';
    const subtitle = root.getAttribute('data-subtitle') || 'Aplikacja do zarabiania';
    const hero = root.querySelector('[data-page-content]');

    root.innerHTML = `
      <div class="app-shell">
        <header class="topbar">
          <div class="brand">
            <img src="uszefaqualitet-logo.svg" alt="QualitetMarket logo">
            <div class="brand-text">
              <strong>${title}</strong>
              <span>${subtitle}</span>
            </div>
          </div>
          <div class="top-actions">
            <a class="secondary-btn" href="index.html">Start</a>
            <button class="icon-btn" type="button" data-open-menu aria-label="Otwórz menu">☰</button>
          </div>
        </header>

        <div class="drawer" data-drawer>
          <div class="drawer-backdrop" data-close-menu></div>
          <aside class="drawer-panel">
            <div class="section-title">
              <div>
                <h2>Główne menu</h2>
                <p>Wszystko w jednym miejscu</p>
              </div>
              <button class="icon-btn" type="button" data-close-menu aria-label="Zamknij menu">×</button>
            </div>
            <div class="drawer-grid">
              ${shellData.menu.map(item => `
                <a class="drawer-link" href="${item.href}">
                  ${item.title}
                  <small>${item.desc}</small>
                </a>
              `).join('')}
            </div>
          </aside>
        </div>

        ${hero ? hero.outerHTML : ''}

        <nav class="bottom-nav">
          <div class="bottom-nav-grid">
            ${shellData.bottom.map(item => `
              <a href="${item.href}" class="${page === item.href.toLowerCase() ? 'active' : ''}">
                <span>${item.icon}</span>
                <span>${item.label}</span>
              </a>
            `).join('')}
          </div>
        </nav>
      </div>
    `;

    root.querySelector('[data-open-menu]').addEventListener('click', ()=> root.querySelector('[data-drawer]').classList.add('open'));
    root.querySelectorAll('[data-close-menu]').forEach(el=> el.addEventListener('click', ()=> root.querySelector('[data-drawer]').classList.remove('open')));
  }

  function applyAutolinks(){
    document.addEventListener('click', function(e){
      const btn = e.target.closest('[data-go]');
      if(btn){
        const href = btn.getAttribute('data-go');
        if(href) location.href = href;
      }
      const action = e.target.closest('[data-action]');
      if(!action) return;
      const name = action.getAttribute('data-action');
      if(name === 'load-demo-products'){
        const demo = [
          {name:'Smartwatch Sport', price:79, img:'https://via.placeholder.com/300x200?text=Smartwatch'},
          {name:'Lampa LED Biurko', price:49, img:'https://via.placeholder.com/300x200?text=Lampa+LED'},
          {name:'Kamera Auto', price:129, img:'https://via.placeholder.com/300x200?text=Kamera+Auto'}
        ];
        localStorage.setItem('qm_products_by_supplier_v1', JSON.stringify(demo));
        alert('Załadowano demo produkty do qm_products_by_supplier_v1');
      }
      if(name === 'activate-pro'){
        localStorage.setItem('qm_user_plan_v1', 'pro');
        localStorage.setItem('qm_store_margin_pct', '25');
        alert('Aktywowano plan PRO i marżę 25%');
      }
      if(name === 'activate-elite'){
        localStorage.setItem('qm_user_plan_v1', 'elite');
        localStorage.setItem('qm_store_margin_pct', '35');
        alert('Aktywowano plan ELITE i marżę 35%');
      }
    });
  }

  function filterCards(){
    const input = document.querySelector('[data-filter-input]');
    const cards = Array.from(document.querySelectorAll('[data-filter-card]'));
    const select = document.querySelector('[data-filter-group]');
    if(!input && !select) return;
    function run(){
      const q = (input?.value || '').trim().toLowerCase();
      const g = (select?.value || '').trim().toLowerCase();
      cards.forEach(card=>{
        const text = card.innerText.toLowerCase();
        const group = (card.getAttribute('data-group') || '').toLowerCase();
        const okQ = !q || text.includes(q);
        const okG = !g || group === g;
        card.classList.toggle('hidden', !(okQ && okG));
      });
    }
    input && input.addEventListener('input', run);
    select && select.addEventListener('change', run);
  }

  document.addEventListener('DOMContentLoaded', function(){
    renderShell();
    applyAutolinks();
    filterCards();
  });
})();
