(function () {
  const MENU = [
    { group: 'Start', items: [
      { href: 'index.html', label: 'Strona główna', tag: 'start' },
      { href: 'platforma.html', label: 'Platforma', tag: 'hub' },
      { href: 'dashboard.html', label: 'Dashboard', tag: 'panel' },
      { href: 'login.html', label: 'Logowanie', tag: 'konto' },
      { href: 'onboarding.html', label: 'Onboarding', tag: 'start' }
    ]},
    { group: 'Sprzedaż', items: [
      { href: 'sklep.html', label: 'Sklep', tag: 'sprzedaż' },
      { href: 'koszyk.html', label: 'Koszyk', tag: 'zakup' },
      { href: 'checkout.html', label: 'Checkout', tag: 'finalizacja' },
      { href: 'zamowienia.html', label: 'Zamówienia', tag: 'orders' },
      { href: 'panel-zamowien-sklepu.html', label: 'Panel zamówień sklepu', tag: 'obsługa' },
      { href: 'sklepy.html', label: 'Sklepy', tag: 'multi-store' }
    ]},
    { group: 'Sklep i produkty', items: [
      { href: 'panel-sklepu.html', label: 'Panel sklepu', tag: 'ustawienia' },
      { href: 'generator-sklepu.html', label: 'Generator sklepu', tag: 'builder' },
      { href: 'hurtownie.html', label: 'Hurtownie', tag: 'pro' },
      { href: 'suppliers.html', label: 'Suppliers', tag: 'import' },
      { href: 'qualitetmarket.html', label: 'QualitetMarket', tag: 'pro' },
      { href: 'blueprints.html', label: 'Blueprints', tag: 'szablony' }
    ]},
    { group: 'AI i aplikacje', items: [
      { href: 'ai.html', label: 'AI', tag: 'narzędzia' },
      { href: 'intelligence.html', label: 'Intelligence', tag: 'elite' },
      { href: 'reklama-ai.html', label: 'Reklama AI', tag: 'ads' },
      { href: 'reklama.html', label: 'Reklama', tag: 'promo' },
      { href: 'aplikacje.html', label: 'Aplikacje', tag: 'apps' },
      { href: 'stworz-aplikacje.html', label: 'Stwórz aplikację', tag: 'builder' },
      { href: 'pobierz-aplikacje.html', label: 'Pobierz aplikacje', tag: 'download' }
    ]},
    { group: 'Branże', items: [
      { href: 'nieruchomosci.html', label: 'Nieruchomości', tag: 'branża' },
      { href: 'agenci-nieruchomosci.html', label: 'Agenci nieruchomości', tag: 'pro' },
      { href: 'firmy-nieruchomosci.html', label: 'Firmy nieruchomości', tag: 'biznes' },
      { href: 'agent-nieruchomosci-pro.html', label: 'Agent Nieruchomości PRO', tag: 'premium' },
      { href: 'auta.html', label: 'Auta', tag: 'branża' },
      { href: 'komis-auto.html', label: 'Komis auto', tag: 'sprzedaż' },
      { href: 'uzywane.html', label: 'Używane', tag: 'ogłoszenia' },
      { href: 'ogloszenia.html', label: 'Ogłoszenia', tag: 'marketplace' },
      { href: 'dodaj-ogloszenie.html', label: 'Dodaj ogłoszenie', tag: 'publish' }
    ]},
    { group: 'Plan i oferta', items: [
      { href: 'cennik.html', label: 'Cennik', tag: 'plan' },
      { href: 'aktywuj-pro.html', label: 'Aktywuj PRO', tag: 'upgrade' },
      { href: 'success.html', label: 'Success', tag: 'status' },
      { href: 'zarabianie.html', label: 'Zarabianie', tag: 'income' }
    ]}
  ];

  const BOTTOM = [
    { href: 'index.html', label: 'Start', icon: '⌂' },
    { href: 'platforma.html', label: 'Menu', icon: '☰' },
    { href: 'dashboard.html', label: 'Panel', icon: '◫' },
    { href: 'sklep.html', label: 'Sklep', icon: '🛒' },
    { href: 'hurtownie.html', label: 'Import', icon: '⬇' }
  ];

  function getPlan() {
    return localStorage.getItem('qm_plan') || localStorage.getItem('qm_user_plan') || 'basic';
  }

  function activePath() {
    const path = location.pathname.split('/').pop() || 'index.html';
    return path.toLowerCase();
  }

  function groupMarkup(group) {
    const current = activePath();
    const links = group.items.map(function (item) {
      const isActive = current === item.href.toLowerCase();
      return '<a class="nav-link ' + (isActive ? 'active' : '') + '" href="' + item.href + '">' +
        '<span>' + item.label + '</span><span>' + item.tag + '</span></a>';
    }).join('');
    return '<div class="nav-group"><div class="nav-title">' + group.group + '</div>' + links + '</div>';
  }

  function shellMarkup() {
    const plan = getPlan().toUpperCase();
    const current = activePath();
    const bottom = BOTTOM.map(function(item){
      const isActive = current === item.href.toLowerCase();
      return '<a class="' + (isActive ? 'active' : '') + '" href="' + item.href + '"><span>' + item.icon + '</span><span>' + item.label + '</span></a>';
    }).join('');
    return '' +
      '<div class="app-topbar">' +
        '<div class="brand">' +
          '<button class="menu-toggle" id="menuToggle" aria-label="Otwórz menu">☰ Menu</button>' +
          '<a href="index.html" style="display:flex;align-items:center;gap:12px">' +
            '<img src="uszefaqualitet-logo.svg" alt="Qualitet logo">' +
            '<div><div>QualitetMarket</div><small>Aplikacja do zarabiania i sprzedaży</small></div>' +
          '</a>' +
        '</div>' +
        '<div class="top-actions">' +
          '<div class="plan-pill">Plan: ' + plan + '</div>' +
          '<a class="btn btn-primary desktop-only" href="platforma.html">Główne menu</a>' +
        '</div>' +
      '</div>' +
      '<aside class="app-sidebar" id="appSidebar">' +
        '<div class="sidebar-head">' +
          '<div class="sidebar-brand"><img src="uszefaqualitet-logo.svg" alt="Logo"><div><strong>QualitetMarket</strong><div class="muted">Wszystko w jednym miejscu</div></div></div>' +
          '<button class="close-sidebar" id="closeSidebar" aria-label="Zamknij menu">✕</button>' +
        '</div>' +
        MENU.map(groupMarkup).join('') +
      '</aside>' +
      '<div class="sidebar-overlay" id="sidebarOverlay"></div>' +
      '<nav class="bottom-nav">' + bottom + '</nav>';
  }

  function initShell() {
    document.body.classList.add('has-app-shell');
    var root = document.querySelector('[data-app-shell]');
    if (!root) return;
    root.insertAdjacentHTML('afterbegin', shellMarkup());

    var menuToggle = document.getElementById('menuToggle');
    var closeSidebar = document.getElementById('closeSidebar');
    var sidebar = document.getElementById('appSidebar');
    var overlay = document.getElementById('sidebarOverlay');

    function openSidebar() {
      sidebar.classList.add('open');
      overlay.classList.add('show');
      document.body.style.overflow = 'hidden';
    }
    function closeIt() {
      sidebar.classList.remove('open');
      overlay.classList.remove('show');
      document.body.style.overflow = '';
    }
    if (menuToggle) menuToggle.addEventListener('click', openSidebar);
    if (closeSidebar) closeSidebar.addEventListener('click', closeIt);
    if (overlay) overlay.addEventListener('click', closeIt);

    var searchInput = document.querySelector('[data-module-search]');
    if (searchInput) {
      searchInput.addEventListener('input', function () {
        var term = (searchInput.value || '').toLowerCase().trim();
        var cards = document.querySelectorAll('[data-module-card]');
        var visible = 0;
        cards.forEach(function(card){
          var hay = (card.getAttribute('data-search') || '').toLowerCase();
          var match = !term || hay.indexOf(term) !== -1;
          card.style.display = match ? '' : 'none';
          if (match) visible += 1;
        });
        var empty = document.querySelector('[data-empty-state]');
        if (empty) empty.style.display = visible ? 'none' : '';
      });
    }
  }

  document.addEventListener('DOMContentLoaded', initShell);
})();