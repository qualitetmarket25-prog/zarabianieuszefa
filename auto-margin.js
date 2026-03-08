
(function(){
  const path = location.pathname.split('/').pop() || 'index.html';
  const links = [
    { href:'index.html', label:'Start', icon:'⌂' },
    { href:'platforma.html', label:'Platforma', icon:'◫' },
    { href:'cennik.html', label:'Cennik', icon:'★' },
    { href:'hurtownie.html', label:'Hurtownie', icon:'▣' },
    { href:'sklep.html', label:'Sklep', icon:'🛒' }
  ];

  function footer(){
    return `
      <footer class="footer">
        <div class="container footer-grid">
          <div>
            <div class="brand" style="margin-bottom:10px">
              <img src="uszefaqualitet-logo.svg" alt="QualitetMarket">
              <div><div>QualitetMarket</div><small>Zarabianie u Szefa</small></div>
            </div>
            <div class="muted">Platforma do uruchamiania sprzedaży, dropshippingu, sklepów i hurtowni z automatyczną marżą.</div>
          </div>
          <div>
            <strong>Produkt</strong>
            <div class="list" style="margin-top:10px">
              <a href="platforma.html">Platforma</a>
              <a href="cennik.html">Cennik</a>
              <a href="hurtownie.html">Hurtownie</a>
              <a href="sklep.html">Sklep</a>
            </div>
          </div>
          <div>
            <strong>Pomoc</strong>
            <div class="list" style="margin-top:10px">
              <a href="kontakt.html">Kontakt</a>
              <a href="regulamin.html">Regulamin</a>
              <a href="polityka-prywatnosci.html">Prywatność</a>
              <a href="polityka-cookies.html">Cookies</a>
            </div>
          </div>
          <div>
            <strong>Konto</strong>
            <div class="list" style="margin-top:10px">
              <a href="login.html">Logowanie</a>
              <a href="onboarding.html">Onboarding</a>
              <a href="success.html">Success</a>
            </div>
          </div>
        </div>
      </footer>
    `;
  }

  function mobileNav(){
    return `
      <nav class="mobile-nav" aria-label="Nawigacja dolna">
        <div class="mobile-nav-inner">
          ${links.map(l=>`
            <a href="${l.href}" class="${path===l.href?'active':''}">
              <span class="icon">${l.icon}</span>
              <span>${l.label}</span>
            </a>
          `).join('')}
        </div>
      </nav>
    `;
  }

  function topbar(){
    const plan = JSON.parse(localStorage.getItem('qm_subscription_v1')||'null');
    const planName = plan?.plan ? plan.plan.toUpperCase() : 'BASIC';
    return `
      <header class="topbar">
        <div class="container topbar-inner">
          <a class="brand" href="index.html">
            <img src="uszefaqualitet-logo.svg" alt="QualitetMarket">
            <div><div>QualitetMarket</div><small>Plan: ${planName}</small></div>
          </a>
          <div class="header-actions">
            <a class="btn btn-secondary" href="platforma.html">Menu główne</a>
            <a class="btn btn-primary" href="cennik.html">Subskrypcje</a>
          </div>
        </div>
      </header>
    `;
  }

  document.addEventListener('DOMContentLoaded',()=>{
    document.body.insertAdjacentHTML('afterbegin', topbar());
    document.body.insertAdjacentHTML('beforeend', footer()+mobileNav());
    document.querySelectorAll('[data-link]').forEach(el=>{
      el.addEventListener('click', ()=> location.href = el.getAttribute('data-link'));
    });
  });
})();
