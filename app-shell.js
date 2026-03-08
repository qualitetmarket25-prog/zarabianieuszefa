(function(){
  const DEFAULT_PLAN = localStorage.getItem('qm_plan_v1') || 'basic';
  const path = location.pathname.split('/').pop() || 'index.html';
  const links = [
    ['Dashboard','dashboard.html'],
    ['Firmy nieruchomości','firmy-nieruchomosci.html'],
    ['Nieruchomości','nieruchomosci.html'],
    ['Sklep','sklep.html'],
    ['Ogłoszenia','ogloszenia.html'],
    ['Auta','auta.html'],
    ['Reklama AI','reklama-ai.html'],
    ['Aplikacje','aplikacje.html'],
    ['Stwórz aplikację','stworz-aplikacje.html'],
    ['Agent PRO','agent-nieruchomosci-pro.html'],
    ['Cennik','cennik.html']
  ];

  function money(v){
    return new Intl.NumberFormat('pl-PL',{
      style:'currency',
      currency:'PLN',
      maximumFractionDigits:0
    }).format(Number(v) || 0);
  }

  function safeRead(key, fallback){
    try{
      const raw = localStorage.getItem(key);
      if(raw === null) return fallback;
      const parsed = JSON.parse(raw);
      return parsed ?? fallback;
    }catch(e){
      return fallback;
    }
  }

  function ensureCrmShape(){
    const crm = safeRead('qm_crm_v1', {});
    if(!crm || typeof crm !== 'object' || Array.isArray(crm)) return { leads: [], realEstateOffers: [], realEstateLeads: [] };
    if(!Array.isArray(crm.leads)) crm.leads = [];
    if(!Array.isArray(crm.realEstateOffers)) crm.realEstateOffers = [];
    if(!Array.isArray(crm.realEstateLeads)) crm.realEstateLeads = [];
    return crm;
  }

  window.QU = {
    plan(){ return localStorage.getItem('qm_plan_v1') || DEFAULT_PLAN; },
    setPlan(v){ localStorage.setItem('qm_plan_v1', v); },
    read: safeRead,
    write(key, value){ localStorage.setItem(key, JSON.stringify(value)); },
    uid(){ return Date.now().toString(36) + Math.random().toString(36).slice(2,7); },
    money,
    readCrm(){ return ensureCrmShape(); },
    writeCrm(value){
      const next = value && typeof value === 'object' ? value : {};
      if(!Array.isArray(next.leads)) next.leads = [];
      if(!Array.isArray(next.realEstateOffers)) next.realEstateOffers = [];
      if(!Array.isArray(next.realEstateLeads)) next.realEstateLeads = [];
      localStorage.setItem('qm_crm_v1', JSON.stringify(next));
      return next;
    },
    shell(title, subtitle){
      const isPublic = ['index.html','login.html'].includes(path);
      if(isPublic) return;
      document.body.classList.add('app-body');
      const page = document.querySelector('[data-page-root]');
      if(!page) return;
      const content = page.innerHTML;
      const nav = links.map(function(item){
        const name=item[0], href=item[1];
        return '<a class="nav-link '+(href===path?'active':'')+'" href="'+href+'"><span class="dot"></span><span>'+name+'</span></a>';
      }).join('');
      page.outerHTML = '<div class="app-shell"><aside class="sidebar" id="sidebar"><a class="brand" href="dashboard.html"><img src="uszefaqualitet-logo.svg" alt="UszefaQualitet"><div><strong>UszefaQualitet</strong><span>super app do zarabiania</span></div></a><div class="nav-group"><div class="nav-title">Menu</div>'+nav+'</div><div class="card" style="margin-top:16px;padding:16px"><div class="small">Twój plan</div><div style="font-size:26px;font-weight:800;text-transform:uppercase">'+this.plan()+'</div><div class="small">PRO i AGENTPRO odblokowują panel nieruchomości i leady.</div><a class="btn" href="cennik.html" style="margin-top:10px">Zobacz pakiety</a></div></aside><main class="main"><div class="topbar"><div class="topbar-left"><button class="menu-btn" id="menuBtn">☰</button><div><div class="small">'+(subtitle || 'panel premium')+'</div><div style="font-size:22px;font-weight:800">'+(title || document.title)+'</div></div></div><div class="top-actions"><a class="btn-ghost" href="reklama-ai.html">Zrób reklamę AI</a><a class="btn" href="stworz-aplikacje.html">Stwórz swoją aplikację</a></div></div><section class="page">'+content+'</section></main></div>';
      var btn=document.getElementById('menuBtn');
      var sb=document.getElementById('sidebar');
      if(btn && sb){
        btn.addEventListener('click',function(){ sb.classList.toggle('open'); });
      }
    },
    requirePlans(plans, redirectHref){
      var current = this.plan();
      if(plans.indexOf(current) !== -1) return true;
      alert('Ta sekcja wymaga planu: ' + plans.join(' / ').toUpperCase());
      location.href = redirectHref || 'agent-nieruchomosci-pro.html';
      return false;
    }
  };

  document.addEventListener('click', function(e){
    var trigger = e.target.closest('[data-set-plan]');
    if(trigger){
      QU.setPlan(trigger.getAttribute('data-set-plan'));
      alert('Plan ustawiony: ' + QU.plan().toUpperCase());
      location.href = 'dashboard.html';
    }
  });
})();