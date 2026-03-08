(function(){
  const NAV = [
    { href:'index.html', label:'Start', desc:'Główne wejście do aplikacji', icon:'🏠', key:'index.html' },
    { href:'platforma.html', label:'Platforma', desc:'Mapa modułów i zarabiania', icon:'🧭', key:'platforma.html' },
    { href:'dashboard.html', label:'Dashboard', desc:'Panel główny użytkownika', icon:'📊', key:'dashboard.html' },
    { href:'sklep.html', label:'Sklep', desc:'Produkty i sprzedaż', icon:'🛒', key:'sklep.html' },
    { href:'hurtownie.html', label:'Hurtownie', desc:'Import produktów i CSV', icon:'📦', key:'hurtownie.html' },
    { href:'zamowienia.html', label:'Zamówienia', desc:'Obsługa zamówień', icon:'📋', key:'zamowienia.html' },
    { href:'panel-sklepu.html', label:'Panel sklepu', desc:'Ustawienia sklepu', icon:'🏪', key:'panel-sklepu.html' },
    { href:'generator-sklepu.html', label:'Generator', desc:'Budowa własnego sklepu', icon:'⚙️', key:'generator-sklepu.html' },
    { href:'ai.html', label:'AI', desc:'Narzędzia AI do pracy', icon:'🤖', key:'ai.html' },
    { href:'reklama-ai.html', label:'Reklama AI', desc:'Promocja i kreacje', icon:'📣', key:'reklama-ai.html' },
    { href:'aplikacje.html', label:'Aplikacje', desc:'Aplikacje do zarabiania', icon:'📱', key:'aplikacje.html' },
    { href:'nieruchomosci.html', label:'Nieruchomości', desc:'Moduł nieruchomości', icon:'🏘️', key:'nieruchomosci.html' },
    { href:'auta.html', label:'Auta', desc:'Moduł aut i komisów', icon:'🚗', key:'auta.html' },
    { href:'ogloszenia.html', label:'Ogłoszenia', desc:'Dodawanie i publikacja ofert', icon:'📢', key:'ogloszenia.html' },
    { href:'cennik.html', label:'Cennik', desc:'Basic / Pro / Elite', icon:'💳', key:'cennik.html' },
    { href:'qualitetmarket.html', label:'QualitetMarket', desc:'Marketplace i sprzedaż', icon:'🌐', key:'qualitetmarket.html' },
    { href:'suppliers.html', label:'Suppliers', desc:'Dostawcy i partnerzy', icon:'🤝', key:'suppliers.html' },
    { href:'blueprints.html', label:'Blueprints', desc:'Gotowe szablony', icon:'🧩', key:'blueprints.html' }
  ];

  function activeKey(){
    const file = location.pathname.split('/').pop() || 'index.html';
    return file;
  }

  function navLink(item){
    const active = activeKey() === item.key ? ' active' : '';
    return `<a class="nav-link${active}" href="${item.href}">
      <span class="nav-emoji">${item.icon}</span>
      <span class="nav-meta">
        <span class="nav-title">${item.label}</span>
        <span class="nav-desc">${item.desc}</span>
      </span>
    </a>`;
  }

  function bottomLink(item){
    const active = activeKey() === item.key ? ' active' : '';
    return `<a class="bottom-link${active}" href="${item.href}"><span class="icon">${item.icon}</span><span>${item.label}</span></a>`;
  }

  function buildShell(opts){
    const root = document.getElementById('qm-shell');
    if(!root) return;
    const current = NAV.find(n => n.key === activeKey()) || NAV[0];
    const quick = (opts.quickLinks || ['sklep.html','hurtownie.html','ai.html']).map(h => NAV.find(n => n.href===h)).filter(Boolean);
    const bottom = ['index.html','platforma.html','sklep.html','hurtownie.html','dashboard.html'].map(h => NAV.find(n=>n.href===h)).filter(Boolean);

    root.innerHTML = `
      <div class="app-shell">
        <header class="app-topbar">
          <div class="brand">
            <button id="qm-open-menu" class="icon-btn mobile-only" aria-label="Otwórz menu">☰</button>
            <a href="index.html" class="brand">
              <img src="uszefaqualitet-logo.svg" alt="Qualitet logo">
              <div class="brand-text">
                <div class="brand-title">QualitetMarket</div>
                <div class="brand-sub">${opts.topSubtitle || 'Aplikacja do zarabiania online i sprzedaży'}</div>
              </div>
            </a>
          </div>
          <div class="topbar-actions">
            <a class="ghost-btn desktop-only" href="platforma.html">Mapa modułów</a>
            <a class="primary-btn" href="${opts.primaryHref || 'platforma.html'}">${opts.primaryLabel || 'Wejdź do platformy'}</a>
          </div>
        </header>

        <div class="layout">
          <aside id="qm-sidebar" class="sidebar">
            <div class="brand" style="margin-bottom:10px">
              <img src="uszefaqualitet-logo.svg" alt="Qualitet logo">
              <div class="brand-text">
                <div class="brand-title">Menu główne</div>
                <div class="brand-sub">Wszystkie moduły aplikacji</div>
              </div>
            </div>

            <div class="section-label">Start</div>
            <div class="nav-list">${NAV.slice(0,3).map(navLink).join('')}</div>

            <div class="section-label">Sprzedaż i sklep</div>
            <div class="nav-list">${NAV.slice(3,8).map(navLink).join('')}</div>

            <div class="section-label">AI i rozwój</div>
            <div class="nav-list">${NAV.slice(8,11).map(navLink).join('')}</div>

            <div class="section-label">Branże</div>
            <div class="nav-list">${NAV.slice(11,14).map(navLink).join('')}</div>

            <div class="section-label">System</div>
            <div class="nav-list">${NAV.slice(14).map(navLink).join('')}</div>
          </aside>

          <div id="qm-overlay" class="sidebar-overlay"></div>

          <main class="content">
            <section class="hero">
              <span class="pill">📱 Mobile-first • GitHub Pages • zarabianie online</span>
              <h1>${opts.heroTitle || current.label}</h1>
              <p>${opts.heroText || current.desc}</p>
              <div class="hero-actions">
                ${quick.map(item => `<a class="primary-btn" href="${item.href}">${item.label}</a>`).join('')}
              </div>
              ${opts.notice ? `<div class="notice">${opts.notice}</div>` : ''}
            </section>

            ${opts.body || ''}

            <div class="footer-space"></div>
          </main>
        </div>

        <nav class="bottom-nav">${bottom.map(bottomLink).join('')}</nav>
      </div>
    `;

    const sidebar = document.getElementById('qm-sidebar');
    const overlay = document.getElementById('qm-overlay');
    const openBtn = document.getElementById('qm-open-menu');
    function close(){ sidebar.classList.remove('open'); overlay.classList.remove('show'); }
    function open(){ sidebar.classList.add('open'); overlay.classList.add('show'); }
    if(openBtn) openBtn.addEventListener('click', open);
    if(overlay) overlay.addEventListener('click', close);

    document.querySelectorAll('[data-module-search]').forEach(input => {
      input.addEventListener('input', () => {
        const q = input.value.trim().toLowerCase();
        document.querySelectorAll('[data-module-card]').forEach(card => {
          const hay = (card.getAttribute('data-search') || '').toLowerCase();
          card.style.display = !q || hay.includes(q) ? '' : 'none';
        });
      });
    });
  }

  window.QualitetShell = { buildShell, NAV };
})();