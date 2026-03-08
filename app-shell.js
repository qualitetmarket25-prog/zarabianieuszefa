(function(){
  const pageKey = (document.body.dataset.page || '').trim();
  const routes = [
    {href:'index.html', label:'Start', icon:'🏠', desc:'Główne menu aplikacji'},
    {href:'platforma.html', label:'Platforma', icon:'🧭', desc:'Moduły do zarabiania'},
    {href:'dashboard.html', label:'Panel', icon:'📊', desc:'Statystyki i skróty'},
    {href:'sklep.html', label:'Sklep', icon:'🛍️', desc:'Produkty i sprzedaż'},
    {href:'hurtownie.html', label:'Hurtownie', icon:'📦', desc:'Import i dostawcy'},
    {href:'cennik.html', label:'Cennik', icon:'💎', desc:'Plany Basic / Pro / Elite'},
    {href:'aplikacje.html', label:'Aplikacje', icon:'📱', desc:'Gotowe aplikacje'},
    {href:'ai.html', label:'AI', icon:'🤖', desc:'Narzędzia AI'},
    {href:'qualitetmarket.html', label:'Marketplace', icon:'🚀', desc:'Centrum sprzedaży'},
    {href:'suppliers.html', label:'Suppliers', icon:'🌍', desc:'Partnerzy i sourcing'}
  ];

  function initTopbar(){
    const shell = document.querySelector('.app-shell');
    if(!shell) return;
    const topbar = document.createElement('header');
    topbar.className = 'topbar';
    topbar.innerHTML = `
      <div class="topbar-inner">
        <a class="brand" href="index.html" aria-label="QualitetMarket start">
          <img src="uszefaqualitet-logo.svg" alt="QualitetMarket logo">
        </a>
        <div class="top-actions">
          <a class="ghost-btn" href="cennik.html">Cennik</a>
          <a class="cta-btn" href="platforma.html">Zarabiaj teraz</a>
          <button class="icon-btn" id="menuToggle" aria-label="Otwórz menu">☰</button>
        </div>
      </div>
    `;
    shell.prepend(topbar);

    const drawer = document.createElement('div');
    drawer.className = 'drawer';
    drawer.innerHTML = `
      <div class="drawer-panel">
        <div class="drawer-head">
          <img src="uszefaqualitet-logo.svg" alt="QualitetMarket" style="width:170px">
          <button class="icon-btn" id="menuClose" aria-label="Zamknij menu">✕</button>
        </div>
        <div class="drawer-grid">
          ${routes.map(r=>`
            <a class="drawer-link" href="${r.href}">
              <div style="font-size:28px">${r.icon}</div>
              <div><b>${r.label}</b><div class="muted">${r.desc}</div></div>
            </a>
          `).join('')}
        </div>
      </div>
    `;
    document.body.appendChild(drawer);
    document.getElementById('menuToggle')?.addEventListener('click', ()=>drawer.classList.add('open'));
    drawer.addEventListener('click', (e)=>{
      if(e.target === drawer || e.target.id === 'menuClose') drawer.classList.remove('open');
    });
  }

  function initMobileNav(){
    const shell = document.querySelector('.app-shell');
    if(!shell) return;
    const nav = document.createElement('nav');
    nav.className = 'mobile-nav';
    nav.innerHTML = `<div class="mobile-nav-inner">
      <a href="index.html" class="${pageKey==='home'?'active':''}"><span>🏠</span>Start</a>
      <a href="platforma.html" class="${pageKey==='platforma'?'active':''}"><span>🧭</span>Moduły</a>
      <a href="sklep.html" class="${pageKey==='sklep'?'active':''}"><span>🛍️</span>Sklep</a>
      <a href="cennik.html" class="${pageKey==='cennik'?'active':''}"><span>💎</span>Cennik</a>
    </div>`;
    document.body.appendChild(nav);
  }

  function wireButtons(){
    document.querySelectorAll('[data-link]').forEach(el=>{
      const href = el.getAttribute('data-link');
      if(!href) return;
      if(el.tagName !== 'A') el.setAttribute('role', 'link');
      const go = ()=> window.location.href = href;
      el.addEventListener('click', go);
      el.addEventListener('keydown', e=>{
        if(e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); }
      });
      el.style.cursor = 'pointer';
    });

    document.querySelectorAll('[data-copy-link]').forEach(el=>{
      el.addEventListener('click', async ()=>{
        const value = el.getAttribute('data-copy-link');
        try{
          await navigator.clipboard.writeText(value);
          el.textContent = 'Skopiowano link';
          setTimeout(()=>{ el.textContent = 'Kopiuj link'; }, 1500);
        }catch(err){}
      });
    });

    document.querySelectorAll('[data-plan]').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const plan = btn.getAttribute('data-plan');
        const planLower = (plan || 'basic').toLowerCase();
        localStorage.setItem('qm_plan', planLower);
        const margin = planLower === 'elite' ? 35 : planLower === 'pro' ? 25 : 15;
        localStorage.setItem('qm_store_margin_pct', String(margin));
        window.location.href = 'success.html';
      });
    });
  }

  function highlightCurrentLinks(){
    const file = location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll(`a[href="${file}"]`).forEach(a=>a.classList.add('active'));
  }

  document.addEventListener('DOMContentLoaded', ()=>{
    initTopbar();
    initMobileNav();
    wireButtons();
    highlightCurrentLinks();
  });
})();