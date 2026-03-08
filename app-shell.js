(function(){
  'use strict';

  var PATH = location.pathname.split('/').pop() || 'index.html';
  var PLAN_KEYS = ['qm_user_plan_v1', 'qm_plan_v1'];
  var CRM_KEY = 'qm_crm_v1';

  var links = [
    ['Dashboard','dashboard.html'],
    ['Platforma','platforma.html'],
    ['Hurtownie','hurtownie.html'],
    ['Sklep','sklep.html'],
    ['Ogłoszenia','ogloszenia.html'],
    ['Auta','auta.html'],
    ['Używane','uzywane.html'],
    ['Nieruchomości','nieruchomosci.html'],
    ['Firmy nieruchomości','firmy-nieruchomosci.html'],
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
    try {
      return new Intl.NumberFormat('pl-PL', {
        style:'currency',
        currency:'PLN',
        maximumFractionDigits:0
      }).format(Number(value) || 0);
    } catch(err){
      return (Number(value) || 0).toFixed(0) + ' zł';
    }
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

  function safeReadRaw(key){
    try { return localStorage.getItem(key); } catch(err){ return null; }
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

  function normalizePlan(value){
    var plan = String(value || '').toLowerCase().trim();
    if(['elite','elita'].indexOf(plan) !== -1) return 'elite';
    if(['pro','boss','zawodowiec'].indexOf(plan) !== -1) return 'pro';
    if(['agentpro','agent pro','agent-pro'].indexOf(plan) !== -1) return 'agentpro';
    return 'basic';
  }

  function plan(){
    for(var i=0;i<PLAN_KEYS.length;i++){
      var raw = safeReadRaw(PLAN_KEYS[i]);
      if(raw){
        return normalizePlan(raw.replace(/^"|"$/g,''));
      }
    }
    return 'basic';
  }

  function setPlan(next){
    var normalized = normalizePlan(next);
    PLAN_KEYS.forEach(function(key){ localStorage.setItem(key, normalized); });
    return normalized;
  }

  function hasPlan(required){
    var map = { basic:1, pro:2, elite:3, agentpro:4 };
    return (map[plan()] || 1) >= (map[normalizePlan(required)] || 1);
  }

  function normalizeOffer(item){
    item = item && typeof item === 'object' ? item : {};
    var gallery = Array.isArray(item.gallery) ? item.gallery.filter(Boolean) : String(item.gallery || item.image || '')
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

  function normalizeApp(item){
    item = item && typeof item === 'object' ? item : {};
    return {
      id: item.id || uid(),
      name: item.name || '',
      type: item.type || 'Sklep',
      city: item.city || '',
      plan: normalizePlan(item.plan || 'basic'),
      description: item.description || '',
      status: item.status || 'draft',
      target: item.target || 'B2C',
      monthlyPrice: Number(item.monthlyPrice) || 0,
      createdAt: item.createdAt || nowIso(),
      updatedAt: item.updatedAt || item.createdAt || nowIso()
    };
  }

  function normalizeCampaign(item){
    item = item && typeof item === 'object' ? item : {};
    return {
      id: item.id || uid(),
      title: item.title || '',
      channel: item.channel || 'Meta Ads',
      targetType: item.targetType || 'Sklep',
      budget: Number(item.budget) || 0,
      city: item.city || '',
      description: item.description || '',
      cta: item.cta || '',
      status: item.status || 'robocza',
      createdAt: item.createdAt || nowIso(),
      updatedAt: item.updatedAt || item.createdAt || nowIso()
    };
  }

  function normalizeListing(item){
    item = item && typeof item === 'object' ? item : {};
    return {
      id: item.id || uid(),
      title: item.title || '',
      category: item.category || 'Usługi',
      city: item.city || '',
      price: Number(item.price) || 0,
      contact: item.contact || '',
      description: item.description || '',
      status: item.status || 'aktywne',
      createdAt: item.createdAt || nowIso(),
      updatedAt: item.updatedAt || item.createdAt || nowIso()
    };
  }

  function normalizeCar(item){
    item = item && typeof item === 'object' ? item : {};
    return {
      id: item.id || uid(),
      brand: item.brand || '',
      model: item.model || '',
      year: item.year || '',
      fuel: item.fuel || 'benzyna',
      price: Number(item.price) || 0,
      city: item.city || '',
      status: item.status || 'aktywne',
      createdAt: item.createdAt || nowIso(),
      updatedAt: item.updatedAt || item.createdAt || nowIso()
    };
  }

  function normalizeCrm(value){
    var crm = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    if(!Array.isArray(crm.leads)) crm.leads = [];
    if(!Array.isArray(crm.realEstateOffers)) crm.realEstateOffers = [];
    if(!Array.isArray(crm.realEstateLeads)) crm.realEstateLeads = [];
    if(!Array.isArray(crm.generatedApps)) crm.generatedApps = [];
    if(!Array.isArray(crm.aiCampaigns)) crm.aiCampaigns = [];
    if(!Array.isArray(crm.classifiedAds)) crm.classifiedAds = [];
    if(!Array.isArray(crm.usedItems)) crm.usedItems = [];
    if(!Array.isArray(crm.vehicleOffers)) crm.vehicleOffers = [];
    if(!Array.isArray(crm.vehicleLeads)) crm.vehicleLeads = [];

    crm.realEstateOffers = crm.realEstateOffers.map(normalizeOffer);
    crm.realEstateLeads = crm.realEstateLeads.map(normalizeLead);
    crm.generatedApps = crm.generatedApps.map(normalizeApp);
    crm.aiCampaigns = crm.aiCampaigns.map(normalizeCampaign);
    crm.classifiedAds = crm.classifiedAds.map(normalizeListing);
    crm.usedItems = crm.usedItems.map(normalizeListing);
    crm.vehicleOffers = crm.vehicleOffers.map(normalizeCar);
    crm.vehicleLeads = crm.vehicleLeads.map(normalizeLead);

    return crm;
  }

  function readCrm(){ return normalizeCrm(safeRead(CRM_KEY, {})); }
  function writeCrm(next){ return safeWrite(CRM_KEY, normalizeCrm(next)); }
  function updateCrm(mutator){
    var crm = readCrm();
    var result = typeof mutator === 'function' ? mutator(crm) || crm : crm;
    return writeCrm(result);
  }

  function statusBadgeClass(status){
    status = String(status || '').toLowerCase();
    if(status.indexOf('zamk') !== -1 || status.indexOf('sprzed') !== -1) return 'elite';
    if(status.indexOf('rezerw') !== -1 || status.indexOf('kontakt') !== -1 || status.indexOf('spot') !== -1) return 'boss';
    return 'pro';
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
    var rows = [['Klient','Telefon','Email','Oferta / temat','Miasto','Budżet','Status','Źródło','Data','Notatka']];
    leads.forEach(function(lead){
      rows.push([
        lead.clientName, lead.phone, lead.email, lead.offerTitle || lead.interest,
        lead.city, lead.budget, lead.status, lead.source, dateTime(lead.createdAt),
        (lead.note || '').replace(/\s+/g,' ').trim()
      ]);
    });
    return rows.map(function(row){
      return row.map(function(value){
        return '"' + String(value == null ? '' : value).replace(/"/g, '""') + '"';
      }).join(';');
    }).join('\n');
  }

  function shell(title, subtitle){
    var root = document.querySelector('[data-page-root]');
    if(!root || document.body.hasAttribute('data-noShell')) return;
    document.body.classList.add('app-body');
    var planName = plan().toUpperCase();

    var nav = links.map(function(item){
      var active = PATH === item[1] ? ' active' : '';
      return '<a class="nav-link'+active+'" href="'+item[1]+'">'+item[0]+'</a>';
    }).join('');

    var content = root.innerHTML;
    root.outerHTML =
      '<div class="app-shell">' +
        '<aside class="sidebar" id="sidebar">' +
          '<div class="brand">UszefaQualitet</div>' +
          '<div class="brand-sub">super app do zarabiania</div>' +
          '<nav class="nav-list">' + nav + '</nav>' +
          '<div class="plan-box">' +
            '<div class="muted-label">Twój plan</div>' +
            '<div class="plan-pill">'+ planName +'</div>' +
            '<p class="muted-copy">PRO, ELITE i AGENTPRO odblokowują mocniejsze moduły sprzedażowe.</p>' +
            '<div class="plan-actions">' +
              '<a class="btn btn-gold" href="agent-nieruchomosci-pro.html">Agent PRO</a>' +
              '<a class="btn btn-ghost" href="cennik.html">Cennik</a>' +
            '</div>' +
          '</div>' +
        '</aside>' +
        '<div class="app-main">' +
          '<header class="topbar">' +
            '<button class="icon-btn" id="menuBtn" type="button">☰</button>' +
            '<div>' +
              '<div class="topbar-sub">'+ (subtitle || 'panel premium') +'</div>' +
              '<h1 class="topbar-title">'+ (title || document.title) +'</h1>' +
            '</div>' +
            '<div class="topbar-actions">' +
              '<a class="btn btn-ghost" href="reklama-ai.html">Reklama AI</a>' +
              '<a class="btn btn-primary" href="stworz-aplikacje.html">Stwórz aplikację</a>' +
            '</div>' +
          '</header>' +
          '<main class="page-content">' + content + '</main>' +
        '</div>' +
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
    plans = Array.isArray(plans) ? plans.map(normalizePlan) : [];
    if(plans.indexOf(plan()) !== -1) return true;
    alert('Ta sekcja wymaga planu: ' + plans.join(' / ').toUpperCase());
    location.href = redirectHref || 'agent-nieruchomosci-pro.html';
    return false;
  }

  document.addEventListener('click', function(event){
    var trigger = event.target.closest('[data-set-plan]');
    if(!trigger) return;
    var nextPlan = trigger.getAttribute('data-set-plan') || 'basic';
    setPlan(nextPlan);
    alert('Plan ustawiony: ' + normalizePlan(nextPlan).toUpperCase());
    location.href = trigger.getAttribute('data-redirect') || 'dashboard.html';
  });

  window.QU = {
    uid: uid,
    nowIso: nowIso,
    money: money,
    dateTime: dateTime,
    plan: plan,
    setPlan: setPlan,
    hasPlan: hasPlan,
    read: safeRead,
    write: safeWrite,
    readCrm: readCrm,
    writeCrm: writeCrm,
    updateCrm: updateCrm,
    normalizeOffer: normalizeOffer,
    normalizeLead: normalizeLead,
    normalizeApp: normalizeApp,
    normalizeCampaign: normalizeCampaign,
    normalizeListing: normalizeListing,
    normalizeCar: normalizeCar,
    shell: shell,
    requirePlans: requirePlans,
    statusBadgeClass: statusBadgeClass,
    download: download,
    leadsToCsv: leadsToCsv
  };
})();