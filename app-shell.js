(function(){
  const DEFAULT_PLAN = localStorage.getItem('qm_plan_v1') || 'basic';
  const path = location.pathname.split('/').pop() || 'index.html';
  const links = [
    ['Dashboard','dashboard.html'],
    ['Sklep','sklep.html'],
    ['Ogłoszenia','ogloszenia.html'],
    ['Nieruchomości','nieruchomosci.html'],
    ['Auta','auta.html'],
    ['Reklama AI','reklama-ai.html'],
    ['Aplikacje','aplikacje.html'],
    ['Stwórz aplikację','stworz-aplikacje.html'],
    ['Agent PRO','agent-nieruchomosci-pro.html'],
    ['Cennik','cennik.html']
  ];

  function money(v){
    return new Intl.NumberFormat('pl-PL',{style:'currency',currency:'PLN',maximumFractionDigits:0}).format(v||0);
  }

  window.QU = {
    plan(){ return localStorage.getItem('qm_plan_v1') || DEFAULT_PLAN; },
    setPlan(v){ localStorage.setItem('qm_plan_v1', v); },
    read(key, fallback){
      try{ return JSON.parse(localStorage.getItem(key)) ?? fallback; }catch(e){ return fallback; }
    },
    write(key, value){ localStorage.setItem(key, JSON.stringify(value)); },
    uid(){ return Date.now().toString(36) + Math.random().toString(36).slice(2,7); },
    money,
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
      page.outerHTML = '<div class="app-shell"><aside class="sidebar" id="sidebar"><a class="brand" href="dashboard.html"><img src="uszefaqualitet-logo.svg" alt="UszefaQualitet"><div><strong>UszefaQualitet</strong><span>super app do zarabiania</span></div></a><div class="nav-group"><div class="nav-title">Menu</div>'+nav+'</div><div class="card" style="margin-top:16px;padding:16px"><div class="small">Twój plan</div><div style="font-size:26px;font-weight:800;text-transform:uppercase">'+this.plan()+'</div><div class="small">Płać co miesiąc i odblokuj reklamy, AI, aplikacje i Agent PRO.</div><a class="btn" href="cennik.html" style="margin-top:10px">Zobacz pakiety</a></div></aside><main class="main"><div class="topbar"><div class="topbar-left"><button class="menu-btn" id="menuBtn">☰</button><div><div class="small">'+(subtitle || 'panel premium')+'</div><div style="font-size:22px;font-weight:800">'+(title || document.title)+'</div></div></div><div class="top-actions"><a class="btn-ghost" href="reklama-ai.html">Zrób reklamę AI</a><a class="btn" href="stworz-aplikacje.html">Stwórz swoją aplikację</a></div></div><section class="page">'+content+'</section></main></div>';
      var btn=document.getElementById('menuBtn');
      var sb=document.getElementById('sidebar');
      if(btn && sb){ btn.addEventListener('click',function(){ sb.classList.toggle('open'); }); }
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
