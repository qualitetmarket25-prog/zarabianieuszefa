(function(){
  var PATH = location.pathname.split('/').pop() || 'index.html';
  var PLAN_KEY = 'qm_plan_v1';
  var CRM_KEY = 'qm_crm_v1';
  var links = [
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

  function uid(){
    return Date.now().toString(36) + Math.random().toString(36).slice(2,8);
  }

  function nowIso(){
    return new Date().toISOString();
  }

  function money(value){
    return new Intl.NumberFormat('pl-PL',{
      style:'currency',
      currency:'PLN',
      maximumFractionDigits:0
    }).format(Number(value) || 0);
  }

  function dateTime(value){
    if(!value) return '—';
    var date = new Date(value);
    if(String(date) === 'Invalid Date') return value;
    return new Intl.DateTimeFormat('pl-PL',{
      year:'numeric',
      month:'2-digit',
      day:'2-digit',
      hour:'2-digit',
      minute:'2-digit'
    }).format(date);
  }

  function safeRead(key, fallback){
    try{
      var raw = localStorage.getItem(key);
      if(raw === null) return fallback;
      var parsed = JSON.parse(raw);
      return parsed == null ? fallback : parsed;
    }catch(err){
      return fallback;
    }
  }

  function safeWrite(key, value){
    localStorage.setItem(key, JSON.stringify(value));
    return value;
  }

  function normalizeOffer(item){
    item = item && typeof item === 'object' ? item : {};
    var gallery = Array.isArray(item.gallery)
      ? item.gallery.filter(Boolean)
      : String(item.gallery || item.image || '')
          .split(/[\n,]/)
          .map(function(v){ return v.trim(); })
          .filter(Boolean);

    return {
      id: item.id || uid(),
      title: item.title || '',
      city: item.city || '',
      district: item.district || '',
      type: item.type || 'sprzedaż',
      price: Number(item.price) || 0,
      area: item.area || '',
      rooms: item.rooms || '',
      image: item.image || gallery[0] || '',
      gallery: gallery,
      description: item.description || '',
      status: item.status || 'aktywna',
      featured: !!item.featured,
      owner: item.owner || '',
      source: item.source || 'panel',
      slug: item.slug || '',
      createdAt: item.createdAt || nowIso(),
      updatedAt: item.updatedAt || item.createdAt || nowIso()
    };
  }

  function normalizeLead(item){
    item = item && typeof item === 'object' ? item : {};
    return {
      id: item.id || uid(),
      clientName: item.clientName || '',
      phone: item.phone || '',
      email: item.email || '',
      interest: item.interest || '',
      offerId: item.offerId || '',
      offerTitle: item.offerTitle || '',
      city: item.city || '',
      budget: item.budget || '',
      source: item.source || 'listing',
      status: item.status || 'nowy',
      note: item.note || '',
      createdAt: item.createdAt || nowIso(),
      updatedAt: item.updatedAt || item.createdAt || nowIso()
    };
  }

  function normalizeCrm(value){
    var crm = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    if(!Array.isArray(crm.leads)) crm.leads = [];
    if(!Array.isArray(crm.realEstateOffers)) crm.realEstateOffers = [];
    if(!Array.isArray(crm.realEstateLeads)) crm.realEstateLeads = [];
    crm.realEstateOffers = crm.realEstateOffers.map(normalizeOffer);
    crm.realEstateLeads = crm.realEstateLeads.map(normalizeLead);
    return crm;
  }

  function readCrm(){
    return normalizeCrm(safeRead(CRM_KEY, {}));
  }

  function writeCrm(next){
    return safeWrite(CRM_KEY, normalizeCrm(next));
  }

  function updateCrm(mutator){
    var crm = readCrm();
    var result = typeof mutator === 'function' ? mutator(crm) || crm : crm;
    return writeCrm(result);
  }

  function readOffers(){
    return readCrm().realEstateOffers.slice().sort(function(a,b){
      return String(b.updatedAt || b.createdAt || '').localeCompare(String(a.updatedAt || a.createdAt || ''));
    });
  }

  function readLeads(){
    return readCrm().realEstateLeads.slice().sort(function(a,b){
      return String(b.updatedAt || b.createdAt || '').localeCompare(String(a.updatedAt || a.createdAt || ''));
    });
  }

  function plan(){
    return localStorage.getItem(PLAN_KEY) || 'basic';
  }

  function setPlan(next){
    localStorage.setItem(PLAN_KEY, next);
    return next;
  }

  function statusBadgeClass(status){
    status = String(status || '').toLowerCase();
    if(status.indexOf('zamk') !== -1 || status.indexOf('sprzed') !== -1) return 'elite';
    if(status.indexOf('rezerw') !== -1 || status.indexOf('kontakt') !== -1 || status.indexOf('spot') !== -1) return 'boss';
    return 'pro';
  }

  function buildShell(title, subtitle){
    var isPublic = ['index.html','login.html'].indexOf(PATH) !== -1;
    if(isPublic) return;
    document.body.classList.add('app-body');
    var root = document.querySelector('[data-page-root]');
    if(!root) return;

    var planName = plan().toUpperCase();
    var nav = links.map(function(item){
      var name = item[0];
      var href = item[1];
      return '<a class="nav-link ' + (href === PATH ? 'active' : '') + '" href="' + href + '"><span class="dot"></span><span>' + name + '</span></a>';
    }).join('');

    var content = root.innerHTML;
    root.outerHTML =
      '<div class="app-shell">' +
        '<aside class="sidebar" id="sidebar">' +
          '<a class="brand" href="dashboard.html">' +
            '<img src="uszefaqualitet-logo.svg" alt="UszefaQualitet">' +
            '<div><strong>UszefaQualitet</strong><span>super app do zarabiania</span></div>' +
          '</a>' +
          '<div class="nav-group"><div class="nav-title">Menu</div>' + nav + '</div>' +
          '<div class="card mini-card">' +
            '<div class="small">Twój plan</div>' +
            '<div class="plan-name">' + planName + '</div>' +
            '<div class="small">PRO, ELITE i AGENTPRO odblokowują panel nieruchomości.</div>' +
            '<div class="actions-stack">' +
              '<a class="btn" href="agent-nieruchomosci-pro.html">Pakiet Agent PRO</a>' +
              '<a class="btn-ghost" href="cennik.html">Cennik</a>' +
            '</div>' +
          '</div>' +
        '</aside>' +
        '<main class="main">' +
          '<div class="topbar">' +
            '<div class="topbar-left">' +
              '<button class="menu-btn" id="menuBtn" type="button">☰</button>' +
              '<div><div class="small">' + (subtitle || 'panel premium') + '</div><div class="page-headline">' + (title || document.title) + '</div></div>' +
            '</div>' +
            '<div class="top-actions">' +
              '<a class="btn-ghost" href="reklama-ai.html">Reklama AI</a>' +
              '<a class="btn" href="stworz-aplikacje.html">Stwórz aplikację</a>' +
            '</div>' +
          '</div>' +
          '<section class="page">' + content + '</section>' +
        '</main>' +
      '</div>';

    var menuBtn = document.getElementById('menuBtn');
    var sidebar = document.getElementById('sidebar');
    if(menuBtn && sidebar){
      menuBtn.addEventListener('click', function(){
        sidebar.classList.toggle('open');
      });
    }
  }

  function requirePlans(plans, redirectHref){
    if(plans.indexOf(plan()) !== -1) return true;
    alert('Ta sekcja wymaga planu: ' + plans.join(' / ').toUpperCase());
    location.href = redirectHref || 'agent-nieruchomosci-pro.html';
    return false;
  }

  function download(filename, content, mime){
    var blob = new Blob([content], { type: mime || 'application/octet-stream' });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    setTimeout(function(){ URL.revokeObjectURL(url); }, 1000);
  }

  function leadsToCsv(leads){
    var rows = [['Klient','Telefon','Email','Oferta','Miasto','Budżet','Status','Źródło','Data','Notatka']];
    leads.forEach(function(lead){
      rows.push([
        lead.clientName,
        lead.phone,
        lead.email,
        lead.offerTitle || lead.interest,
        lead.city,
        lead.budget,
        lead.status,
        lead.source,
        dateTime(lead.createdAt),
        (lead.note || '').replace(/\s+/g,' ').trim()
      ]);
    });
    return rows.map(function(row){
      return row.map(function(value){
        return '"' + String(value == null ? '' : value).replace(/"/g, '""') + '"';
      }).join(';');
    }).join('\n');
  }

  window.QU = {
    uid: uid,
    nowIso: nowIso,
    money: money,
    dateTime: dateTime,
    plan: plan,
    setPlan: setPlan,
    read: safeRead,
    write: safeWrite,
    readCrm: readCrm,
    writeCrm: writeCrm,
    updateCrm: updateCrm,
    readOffers: readOffers,
    readLeads: readLeads,
    normalizeOffer: normalizeOffer,
    normalizeLead: normalizeLead,
    shell: buildShell,
    requirePlans: requirePlans,
    statusBadgeClass: statusBadgeClass,
    download: download,
    leadsToCsv: leadsToCsv
  };

  document.addEventListener('click', function(event){
    var trigger = event.target.closest('[data-set-plan]');
    if(!trigger) return;
    var nextPlan = trigger.getAttribute('data-set-plan') || 'basic';
    setPlan(nextPlan);
    alert('Plan ustawiony: ' + nextPlan.toUpperCase());
    location.href = trigger.getAttribute('data-redirect') || 'dashboard.html';
  });
})();