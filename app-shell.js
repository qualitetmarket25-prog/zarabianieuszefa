
(function(){
  const pages = [
    {href:'index.html',label:'Start',icon:'🏠'},
    {href:'platforma.html',label:'Platforma',icon:'🧭'},
    {href:'cennik.html',label:'Cennik',icon:'💎'},
    {href:'hurtownie.html',label:'Hurtownie',icon:'📦'},
    {href:'suppliers.html',label:'Linki',icon:'🔗'},
    {href:'sklep.html',label:'Sklep',icon:'🛒'},
    {href:'dashboard.html',label:'Panel',icon:'📊'},
    {href:'kontakt.html',label:'Kontakt',icon:'✉️'},
    {href:'polityka-prywatnosci.html',label:'Prywatność',icon:'🔒'}
  ];
  const path = location.pathname.split('/').pop() || 'index.html';
  function navLink(p){
    const active = path === p.href ? 'active' : '';
    return `<a class="${active}" href="${p.href}">${p.label}</a>`;
  }
  function mobileLink(p){
    return `<a href="${p.href}"><span class="ico">${p.icon}</span><div><strong>${p.label}</strong><div class="small">${p.href}</div></div></a>`;
  }
  function bottomLink(p){
    const active = path === p.href ? 'active' : '';
    return `<a class="${active}" href="${p.href}"><span>${p.icon}</span><span>${p.label}</span></a>`;
  }
  function buildHeader(){
    const header = document.querySelector('[data-app-header]');
    if(!header) return;
    header.innerHTML = `
      <div class="topbar">
        <div class="container topbar-inner">
          <a href="index.html" class="brand">
            <img src="uszefaqualitet-logo.svg" alt="QualitetMarket">
            <span>QualitetMarket<small>Zarabianie u Szefa</small></span>
          </a>
          <nav class="desktop-nav">${pages.map(navLink).join('')}</nav>
          <button class="menu-toggle" id="menuToggle" aria-label="Otwórz menu">Menu</button>
        </div>
      </div>
      <aside class="mobile-drawer" id="mobileDrawer">
        <div class="mobile-grid">${pages.map(mobileLink).join('')}</div>
      </aside>
    `;
    const toggle = document.getElementById('menuToggle');
    const drawer = document.getElementById('mobileDrawer');
    if(toggle && drawer){
      toggle.addEventListener('click', ()=> drawer.classList.toggle('open'));
      drawer.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>drawer.classList.remove('open')));
    }
  }
  function buildBottom(){
    const bottom = document.querySelector('[data-app-bottomnav]');
    if(!bottom) return;
    const bottomPages = [pages[0], pages[3], pages[5], pages[6], pages[7]];
    bottom.innerHTML = `<div class="bottom-nav"><div class="inner container">${bottomPages.map(bottomLink).join('')}</div></div>`;
  }
  function buildFooter(){
    const footer = document.querySelector('[data-app-footer]');
    if(!footer) return;
    footer.innerHTML = `
      <footer class="footer">
        <div class="container footer-grid">
          <div>
            <div class="brand" style="margin-bottom:12px">
              <img src="uszefaqualitet-logo.svg" alt="QualitetMarket">
              <span>QualitetMarket<small>Prosty start do sprzedaży online</small></span>
            </div>
            <p>Platforma do budowy sprzedaży, importu produktów z hurtowni, ustawiania marży i prowadzenia sklepu w modelu mobile-first.</p>
            <div class="notice">Wstaw swoje dane firmowe w plikach prawnych i w kontakcie przed startem produkcyjnym.</div>
          </div>
          <div>
            <h3>Menu główne</h3>
            <div class="links">
              <a href="platforma.html">Platforma</a>
              <a href="cennik.html">Cennik</a>
              <a href="hurtownie.html">Hurtownie</a>
              <a href="suppliers.html">Linki hurtowni</a>
              <a href="sklep.html">Sklep</a>
              <a href="dashboard.html">Panel</a>
            </div>
          </div>
          <div>
            <h3>Prawne</h3>
            <div class="links">
              <a href="polityka-prywatnosci.html">Polityka prywatności</a>
              <a href="regulamin.html">Regulamin</a>
              <a href="polityka-cookies.html">Polityka cookies</a>
              <a href="rodo.html">RODO</a>
              <a href="kontakt.html">Kontakt</a>
            </div>
            <p class="legal-note" style="margin-top:12px">© QualitetMarket. Wszystkie prawa zastrzeżone.</p>
          </div>
        </div>
      </footer>
    `;
  }
  function wireSearch(){
    const input = document.querySelector('[data-filter-input]');
    const cards = Array.from(document.querySelectorAll('[data-filter-card]'));
    if(!input || !cards.length) return;
    input.addEventListener('input', ()=>{
      const q = input.value.toLowerCase().trim();
      cards.forEach(card=>{
        const text = card.innerText.toLowerCase();
        card.style.display = !q || text.includes(q) ? '' : 'none';
      });
    });
  }
  function wireLinks(){
    document.querySelectorAll('[data-go]').forEach(btn=>{
      btn.addEventListener('click', ()=> {
        const href = btn.getAttribute('data-go');
        if(href) location.href = href;
      });
    });
  }
  document.addEventListener('DOMContentLoaded', ()=>{
    buildHeader();
    buildBottom();
    buildFooter();
    wireSearch();
    wireLinks();
  });
})();
