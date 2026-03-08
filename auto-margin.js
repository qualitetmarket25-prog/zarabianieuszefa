
(function(){
  const links = [
    ['index.html','Start','🏠'],
    ['platforma.html','Platforma','🧭'],
    ['hurtownie.html','Hurtownie','🏭'],
    ['sklep.html','Sklep','🛍️'],
    ['koszyk.html','Koszyk','🛒'],
    ['checkout.html','Checkout','💳'],
    ['zamowienia.html','Zamówienia','📦'],
    ['sklepy.html','Sklepy','🏪'],
    ['cennik.html','Cennik','💸'],
    ['kontakt.html','Kontakt','✉️']
  ];

  function currentFile(){
    const p = location.pathname.split('/').pop() || 'index.html';
    return p;
  }

  window.qmState = {
    getPlan(){
      return localStorage.getItem('qm_plan_v1') || 'basic';
    },
    getMargin(){
      return Number(localStorage.getItem('qm_store_margin_pct') || 15);
    },
    setPlan(plan){
      localStorage.setItem('qm_plan_v1', plan);
      const pct = {basic:18, pro:28, elite:38}[plan] || 18;
      localStorage.setItem('qm_store_margin_pct', String(pct));
      return pct;
    }
  };

  window.toggleMenu = function(force){
    const open = typeof force === 'boolean' ? force : !document.body.classList.contains('menu-open');
    document.body.classList.toggle('menu-open', open);
  }

  window.renderShell = function(opts){
    const page = currentFile();
    const title = opts?.title || 'QualitetMarket';
    const subtitle = opts?.subtitle || 'Platforma zarabiania, sklepu i dropshippingu.';
    const content = opts?.content || '';
    const active = (href)=> page === href ? 'active' : '';
    document.body.innerHTML = `
      <div class="app-shell">
        <header class="topbar">
          <div class="topbar-inner">
            <a class="brand" href="index.html">
              <img src="uszefaqualitet-logo.svg" alt="QualitetMarket logo">
              <div>
                <div>QualitetMarket</div>
                <small>${subtitle}</small>
              </div>
            </a>
            <div class="top-actions">
              <a class="btn btn-secondary" href="cennik.html">Plan: ${qmState.getPlan().toUpperCase()}</a>
              <button class="btn icon-btn" type="button" aria-label="Otwórz menu" onclick="toggleMenu()">☰</button>
            </div>
          </div>
        </header>

        <div class="drawer-backdrop" onclick="toggleMenu(false)"></div>
        <aside class="drawer">
          <div class="badge">Marża aktywna: ${qmState.getMargin()}%</div>
          ${links.map(([href,label])=>`<a class="nav-link ${active(href)}" href="${href}" onclick="toggleMenu(false)">${label}</a>`).join('')}
        </aside>

        <main class="layout">
          ${content}
        </main>

        <footer class="footer">
          <div class="footer-inner">
            <div class="footer-grid">
              <div class="footer-col">
                <h3>QualitetMarket</h3>
                <p class="muted">Aplikacja do zarabiania przez sklep, dropshipping, hurtownie i subskrypcje.</p>
              </div>
              <div class="footer-col">
                <h3>Nawigacja</h3>
                <div class="list">
                  <a href="platforma.html">Platforma</a>
                  <a href="hurtownie.html">Hurtownie</a>
                  <a href="sklep.html">Sklep</a>
                  <a href="cennik.html">Cennik</a>
                </div>
              </div>
              <div class="footer-col">
                <h3>Prawne</h3>
                <div class="list">
                  <a href="polityka-prywatnosci.html">Polityka prywatności</a>
                  <a href="regulamin.html">Regulamin</a>
                  <a href="polityka-cookies.html">Polityka cookies</a>
                  <a href="rodo.html">RODO</a>
                  <a href="kontakt.html">Kontakt</a>
                </div>
              </div>
            </div>
          </div>
        </footer>

        <nav class="mobile-nav">
          ${[
            ['index.html','Start','🏠'],
            ['platforma.html','Panel','🧭'],
            ['sklep.html','Sklep','🛍️'],
            ['koszyk.html','Koszyk','🛒']
          ].map(([href,label,icon])=>`<a href="${href}" class="${active(href)}"><span>${icon}</span><span>${label}</span></a>`).join('')}
        </nav>
      </div>
    `;
    document.title = title;
  }

  window.qmUtils = {
    read(key, fallback){
      try{ return JSON.parse(localStorage.getItem(key)) ?? fallback }catch(e){ return fallback }
    },
    write(key, value){ localStorage.setItem(key, JSON.stringify(value)); },
    money(v){ return `${Number(v || 0).toFixed(2)} zł`; },
    uid(prefix='id'){ return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2,8)}`; }
  };
})();
