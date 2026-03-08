(function(){
  const path = location.pathname.split('/').pop() || 'index.html';
  const titles = {
    'index.html':'Start',
    'platforma.html':'Platforma',
    'dashboard.html':'Dashboard',
    'hurtownie.html':'Hurtownie',
    'sklep.html':'Sklep',
    'cennik.html':'Cennik',
    'login.html':'Logowanie',
    'onboarding.html':'Onboarding',
    'pobierz-aplikacje.html':'Aplikacje',
    'success.html':'Sukces',
    'aktywuj-pro.html':'Aktywuj PRO'
  };
  const links = [
    ['index.html','Start'],
    ['platforma.html','Platforma'],
    ['dashboard.html','Panel'],
    ['sklep.html','Sklep'],
    ['hurtownie.html','Hurtownie'],
    ['cennik.html','Cennik'],
    ['login.html','Login'],
    ['onboarding.html','Start PRO'],
    ['pobierz-aplikacje.html','Aplikacje'],
    ['success.html','Sukces'],
    ['aktywuj-pro.html','PRO']
  ];

  const topbar = document.querySelector('[data-topbar]');
  if(topbar){
    topbar.innerHTML = `
      <div class="topbar">
        <div class="container topbar-inner">
          <a class="brand" href="index.html" aria-label="QualitetMarket - start">
            <img src="uszefaqualitet-logo.svg" alt="QualitetMarket logo">
            <div>
              <div>QualitetMarket</div>
              <small>${titles[path] || 'Moduł aplikacji'}</small>
            </div>
          </a>
          <div class="top-actions">
            <a class="btn" href="platforma.html">Menu główne</a>
            <a class="btn btn-primary" href="aktywuj-pro.html">Aktywuj PRO</a>
          </div>
        </div>
      </div>`;
  }

  const bottom = document.querySelector('[data-bottom-nav]');
  if(bottom){
    bottom.innerHTML = `
      <nav class="bottom-nav" aria-label="Dolne menu mobilne">
        <a class="${path==='index.html'?'active':''}" href="index.html"><span>🏠</span><span>Start</span></a>
        <a class="${path==='platforma.html'?'active':''}" href="platforma.html"><span>📱</span><span>Menu</span></a>
        <a class="${path==='dashboard.html'?'active':''}" href="dashboard.html"><span>📊</span><span>Panel</span></a>
        <a class="${path==='sklep.html'?'active':''}" href="sklep.html"><span>🛒</span><span>Sklep</span></a>
        <a class="${path==='hurtownie.html'?'active':''}" href="hurtownie.html"><span>📦</span><span>Dostawcy</span></a>
      </nav>`;
  }
})();