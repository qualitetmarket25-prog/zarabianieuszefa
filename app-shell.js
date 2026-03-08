(function(){
  const links = [
    ['index.html','Start'],
    ['platforma.html','Platforma'],
    ['dashboard.html','Dashboard'],
    ['sklep.html','Sklep'],
    ['hurtownie.html','Hurtownie'],
    ['koszyk.html','Koszyk'],
    ['checkout.html','Checkout'],
    ['zamowienia.html','Zamówienia'],
    ['sklepy.html','Sklepy'],
    ['panel-sklepu.html','Panel sklepu'],
    ['generator-sklepu.html','Generator sklepu'],
    ['ai.html','AI'],
    ['aplikacje.html','Aplikacje'],
    ['suppliers.html','Suppliers'],
    ['blueprints.html','Blueprints'],
    ['cennik.html','Cennik']
  ];

  function renderNav(active){
    return links.map(([href,label]) => {
      const cls = href === active ? 'nav-link active' : 'nav-link';
      return `<a class="${cls}" href="${href}"><span>${label}</span><small>→</small></a>`;
    }).join('');
  }

  function renderDock(active){
    const dock = [
      ['index.html','🏠','Start'],
      ['sklep.html','🛍️','Sklep'],
      ['hurtownie.html','📦','Dostawy'],
      ['sklepy.html','🏪','Sklepy'],
      ['dashboard.html','📊','Panel']
    ];
    return dock.map(([href,icon,label]) => {
      const cls = href === active ? 'active' : '';
      return `<a class="${cls}" href="${href}"><span>${icon}</span><span>${label}</span></a>`;
    }).join('');
  }

  window.QMLayout = {
    mount: function(opts){
      const active = opts.active || location.pathname.split('/').pop() || 'index.html';
      const nav = document.querySelector('[data-qm-nav]');
      if(nav) nav.innerHTML = renderNav(active);
      const dock = document.querySelector('[data-qm-dock]');
      if(dock) dock.innerHTML = renderDock(active);

      const y = document.querySelector('[data-qm-year]');
      if(y) y.textContent = new Date().getFullYear();

      document.querySelectorAll('[data-menu-open]').forEach(btn => {
        btn.addEventListener('click', () => document.body.classList.add('nav-open'));
      });
      document.querySelectorAll('[data-menu-close]').forEach(btn => {
        btn.addEventListener('click', () => document.body.classList.remove('nav-open'));
      });
    }
  };
})();
