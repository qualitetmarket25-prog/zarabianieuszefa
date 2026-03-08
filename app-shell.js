(function () {
  var PATH = location.pathname.split('/').pop() || 'index.html';
  var PLAN_KEY = 'qm_plan_v1';
  var CRM_KEY = 'qm_crm_v1';
  var STORES_KEY = 'qm_stores_v1';
  var ACTIVE_STORE_KEY = 'qm_active_store_v1';
  var PRODUCTS_KEY = 'qm_products_by_supplier_v1';
  var MARGIN_KEY = 'qm_store_margin_pct';
  var ORDERS_KEY = 'qm_orders_v1';

  var links = [
    ['Dashboard', 'dashboard.html'],
    ['Sklep', 'sklep.html'],
    ['Panel sklepu', 'panel-sklepu.html'],
    ['Galeria', 'gallery.html'],
    ['Media Pack', 'media-pack.html'],
    ['Hurtownie', 'hurtownie.html'],
    ['Koszyk', 'koszyk.html'],
    ['Zamówienia', 'zamowienia.html'],
    ['Cennik', 'cennik.html']
  ];

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function money(value) {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
      maximumFractionDigits: 0
    }).format(Number(value) || 0);
  }

  function dateTime(value) {
    if (!value) return '—';
    var date = new Date(value);
    if (String(date) === 'Invalid Date') return value;
    return new Intl.DateTimeFormat('pl-PL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  function safeRead(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      if (raw === null) return fallback;
      var parsed = JSON.parse(raw);
      return parsed == null ? fallback : parsed;
    } catch (err) {
      return fallback;
    }
  }

  function safeWrite(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
    return value;
  }

  function slugify(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'moj-sklep';
  }

  function readProducts() {
    var products = safeRead(PRODUCTS_KEY, []);
    return Array.isArray(products) ? products : [];
  }

  function writeProducts(next) {
    return safeWrite(PRODUCTS_KEY, Array.isArray(next) ? next : []);
  }

  function normalizeStore(store) {
    store = store && typeof store === 'object' ? store : {};
    return {
      id: store.id || uid(),
      slug: store.slug || slugify(store.name || 'moj-sklep'),
      name: store.name || 'Mój sklep',
      niche: store.niche || 'Sklep online',
      description: store.description || 'Nowoczesny sklep gotowy do sprzedaży.',
      logo: store.logo || '',
      heroImage: store.heroImage || '',
      websiteUrl: store.websiteUrl || '',
      contactEmail: store.contactEmail || '',
      contactPhone: store.contactPhone || '',
      accent: store.accent || '#22c55e',
      gallery: Array.isArray(store.gallery) ? store.gallery : [],
      mediaPack: Array.isArray(store.mediaPack) ? store.mediaPack : [],
      sections: Array.isArray(store.sections) ? store.sections : [
        { id: uid(), title: 'Sprzedaż od razu', text: 'Gotowy sklep, galeria i materiały do wysyłki klientom.' },
        { id: uid(), title: 'Start od 0 zł', text: 'Budujesz ofertę, zbierasz leady i sprzedajesz bez kosztów na start.' },
        { id: uid(), title: 'Skalowanie', text: 'Potem dochodzi CRM, pipeline, wyceny i multi-store.' }
      ],
      createdAt: store.createdAt || nowIso(),
      updatedAt: store.updatedAt || nowIso()
    };
  }

  function readStores() {
    var stores = safeRead(STORES_KEY, []);
    return Array.isArray(stores) ? stores.map(normalizeStore) : [];
  }

  function writeStores(next) {
    return safeWrite(STORES_KEY, (Array.isArray(next) ? next : []).map(normalizeStore));
  }

  function ensureSeedStore() {
    var stores = readStores();
    if (stores.length) return stores;
    var seed = normalizeStore({
      id: 'store-demo-1',
      slug: 'qualitet-demo',
      name: 'Qualitet Demo Store',
      niche: 'Marketplace / dropshipping',
      description: 'Sklep startowy do budowy sprzedaży od 0 zł do milionów.',
      contactEmail: 'kontakt@qualitet.local',
      contactPhone: '+48 500 600 700',
      websiteUrl: 'https://qualitetmarket.example/store/qualitet-demo',
      gallery: [
        { id: uid(), type: 'image', title: 'Hero sklepu', url: 'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1200&q=80', note: 'Baner główny sklepu' },
        { id: uid(), type: 'image', title: 'Produkt premium', url: 'https://images.unsplash.com/photo-1511556820780-d912e42b4980?auto=format&fit=crop&w=1200&q=80', note: 'Zdjęcie produktowe do sprzedaży' }
      ],
      mediaPack: [
        { id: uid(), type: 'asset', title: 'Opis oferty', url: '', note: 'Nowoczesny sklep do sprzedaży usług i produktów.' },
        { id: uid(), type: 'copy', title: 'Tekst sprzedażowy', url: '', note: 'Start od 0 zł. Budujesz, publikujesz i zarabiasz.' }
      ]
    });
    stores = [seed];
    writeStores(stores);
    if (!localStorage.getItem(ACTIVE_STORE_KEY)) {
      localStorage.setItem(ACTIVE_STORE_KEY, seed.slug);
    }
    return stores;
  }

  function getActiveStoreId() {
    var urlStore = new URLSearchParams(location.search).get('store');
    if (urlStore) {
      localStorage.setItem(ACTIVE_STORE_KEY, urlStore);
      return urlStore;
    }
    return localStorage.getItem(ACTIVE_STORE_KEY) || '';
  }

  function getActiveStore() {
    var stores = ensureSeedStore();
    var activeId = getActiveStoreId();
    var store = stores.find(function (item) {
      return item.id === activeId || item.slug === activeId;
    });
    if (!store) {
      store = stores[0];
      localStorage.setItem(ACTIVE_STORE_KEY, store.slug);
    }
    return normalizeStore(store);
  }

  function saveStore(nextStore) {
    var stores = ensureSeedStore();
    var normalized = normalizeStore(nextStore);
    var index = stores.findIndex(function (item) {
      return item.id === normalized.id || item.slug === normalized.slug;
    });
    if (index === -1) stores.push(normalized);
    else stores[index] = normalized;
    writeStores(stores);
    localStorage.setItem(ACTIVE_STORE_KEY, normalized.slug);
    return normalized;
  }

  function updateActiveStore(mutator) {
    var current = getActiveStore();
    var next = typeof mutator === 'function' ? (mutator(normalizeStore(current)) || current) : current;
    next.updatedAt = nowIso();
    return saveStore(next);
  }

  function plan() {
    return localStorage.getItem(PLAN_KEY) || 'basic';
  }

  function setPlan(next) {
    localStorage.setItem(PLAN_KEY, next || 'basic');
    return next || 'basic';
  }

  function requirePlans(plans, redirectHref) {
    if (plans.indexOf(plan()) !== -1) return true;
    alert('Ta sekcja wymaga planu: ' + plans.join(' / ').toUpperCase());
    location.href = redirectHref || 'aktywuj-pro.html';
    return false;
  }

  function ensureGlobalStyles() {
    if (document.getElementById('qu-shell-styles')) return;
    var style = document.createElement('style');
    style.id = 'qu-shell-styles';
    style.textContent = ''
      + ':root{--bg:#07111f;--panel:#0f172a;--panel2:#111827;--line:rgba(255,255,255,.08);--text:#f8fafc;--muted:#94a3b8;--accent:#22c55e;--blue:#38bdf8;--danger:#ef4444;--radius:18px;--shadow:0 10px 30px rgba(0,0,0,.25)}'
      + '*{box-sizing:border-box}html,body{margin:0;padding:0;background:linear-gradient(180deg,#08111f 0%,#0b1220 100%);color:var(--text);font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif}'
      + 'a{text-decoration:none;color:inherit}.app-body{min-height:100vh}.qu-shell{display:grid;grid-template-columns:280px minmax(0,1fr);min-height:100vh}'
      + '.qu-sidebar{position:sticky;top:0;height:100vh;padding:22px;border-right:1px solid var(--line);background:rgba(8,17,31,.88);backdrop-filter:blur(12px)}'
      + '.qu-brand{display:flex;flex-direction:column;gap:6px;padding:14px;border:1px solid var(--line);border-radius:20px;background:rgba(255,255,255,.03);margin-bottom:18px}'
      + '.qu-brand strong{font-size:18px}.qu-brand span{font-size:13px;color:var(--muted)}.qu-nav{display:flex;flex-direction:column;gap:8px}'
      + '.qu-nav a{padding:12px 14px;border:1px solid transparent;border-radius:14px;color:#dbe4f0;background:transparent}'
      + '.qu-nav a.active,.qu-nav a:hover{background:rgba(255,255,255,.05);border-color:var(--line)}'
      + '.qu-plan{margin-top:18px;padding:16px;border:1px solid var(--line);border-radius:20px;background:rgba(255,255,255,.03)}'
      + '.qu-plan strong{display:block;margin-bottom:8px}.qu-badge{display:inline-flex;align-items:center;gap:6px;padding:6px 10px;border-radius:999px;background:rgba(34,197,94,.15);border:1px solid rgba(34,197,94,.25);font-size:12px;font-weight:700;color:#bbf7d0}'
      + '.qu-layout{min-width:0}.qu-mobilebar{display:none;position:sticky;top:0;z-index:25;padding:12px 16px;border-bottom:1px solid var(--line);background:rgba(8,17,31,.88);backdrop-filter:blur(12px)}'
      + '.qu-mobilebar button{border:1px solid var(--line);background:#111827;color:#fff;padding:10px 12px;border-radius:12px;font-weight:700}'
      + '.qu-mobilebar .title{font-size:14px;color:var(--muted)}.qu-main{padding:24px}.qu-top{display:flex;justify-content:space-between;gap:16px;align-items:center;margin-bottom:20px}'
      + '.qu-page-title{font-size:30px;font-weight:800;letter-spacing:-.02em;margin:0}.qu-page-sub{color:var(--muted);margin-top:6px}.qu-actions{display:flex;gap:10px;flex-wrap:wrap}'
      + '.qu-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:11px 16px;border-radius:14px;border:1px solid var(--line);background:#111827;color:#fff;font-weight:700;cursor:pointer}'
      + '.qu-btn.primary{background:linear-gradient(135deg,#22c55e,#16a34a);border-color:transparent;color:#052e16}.qu-card{background:rgba(15,23,42,.9);border:1px solid var(--line);border-radius:20px;box-shadow:var(--shadow)}'
      + '.qu-grid{display:grid;gap:16px}.qu-kpis{grid-template-columns:repeat(4,minmax(0,1fr))}.qu-kpi{padding:18px}.qu-kpi small{display:block;color:var(--muted);margin-bottom:10px}.qu-kpi strong{font-size:28px}'
      + '.qu-footer-note{margin-top:18px;color:var(--muted);font-size:13px}'
      + '@media (max-width: 980px){.qu-shell{grid-template-columns:1fr}.qu-sidebar{position:fixed;left:-100%;width:min(86vw,320px);z-index:40;transition:left .25s ease}.qu-sidebar.open{left:0}.qu-mobilebar{display:flex;align-items:center;justify-content:space-between;gap:12px}.qu-main{padding:18px}.qu-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}.qu-page-title{font-size:24px}}'
      + '@media (max-width: 640px){.qu-kpis{grid-template-columns:1fr}.qu-top{flex-direction:column;align-items:flex-start}.qu-actions{width:100%}.qu-btn{width:100%}}';
    document.head.appendChild(style);
  }

  function buildShell(title, subtitle) {
    var isPublic = ['index.html', 'login.html'].indexOf(PATH) !== -1;
    if (isPublic) return;
    ensureGlobalStyles();
    document.body.classList.add('app-body');

    var root = document.querySelector('[data-page-root]');
    if (!root) return;

    var nav = links.map(function (item) {
      var active = item[1] === PATH ? 'active' : '';
      return '<a class="' + active + '" href="' + item[1] + '">' + item[0] + '</a>';
    }).join('');

    var store = getActiveStore();
    var currentPlan = plan().toUpperCase();
    var content = root.innerHTML;

    root.outerHTML = ''
      + '<div class="qu-shell">'
      + '  <aside class="qu-sidebar" id="quSidebar">'
      + '    <div class="qu-brand">'
      + '      <strong>QualitetMarket</strong>'
      + '      <span>Królestwo zarabiania od 0 zł do milionów</span>'
      + '    </div>'
      + '    <nav class="qu-nav">' + nav + '</nav>'
      + '    <div class="qu-plan">'
      + '      <strong>Aktywny plan</strong>'
      + '      <div class="qu-badge">' + currentPlan + '</div>'
      + '      <div style="margin-top:10px;color:var(--muted);font-size:13px;">Aktywny sklep: ' + escapeHtml(store.name) + '</div>'
      + '      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px;">'
      + '        <button class="qu-btn" type="button" data-set-plan="basic">Basic</button>'
      + '        <button class="qu-btn" type="button" data-set-plan="pro">PRO</button>'
      + '        <button class="qu-btn" type="button" data-set-plan="elite">ELITE</button>'
      + '        <a class="qu-btn primary" href="cennik.html">Cennik</a>'
      + '      </div>'
      + '    </div>'
      + '  </aside>'
      + '  <div class="qu-layout">'
      + '    <div class="qu-mobilebar">'
      + '      <button id="quMenuBtn" type="button">☰ Menu</button>'
      + '      <div>'
      + '        <div class="title">' + escapeHtml(subtitle || 'panel premium') + '</div>'
      + '        <div style="font-weight:800;">' + escapeHtml(title || document.title) + '</div>'
      + '      </div>'
      + '    </div>'
      + '    <main class="qu-main">'
      + '      <div class="qu-top">'
      + '        <div><h1 class="qu-page-title">' + escapeHtml(title || document.title) + '</h1><div class="qu-page-sub">' + escapeHtml(subtitle || 'Gotowy moduł pod rozwój projektu') + '</div></div>'
      + '        <div class="qu-actions"><a class="qu-btn" href="gallery.html">Galeria</a><a class="qu-btn" href="media-pack.html">Media Pack</a><a class="qu-btn primary" href="panel-sklepu.html">Edytuj sklep</a></div>'
      + '      </div>'
      +          content
      + '    </main>'
      + '  </div>'
      + '</div>';

    var menuBtn = document.getElementById('quMenuBtn');
    var sidebar = document.getElementById('quSidebar');
    if (menuBtn && sidebar) {
      menuBtn.addEventListener('click', function () {
        sidebar.classList.toggle('open');
      });
    }
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function download(filename, content, mime) {
    var blob = new Blob([content], { type: mime || 'application/octet-stream' });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1200);
  }

  function toCsv(rows) {
    return rows.map(function (row) {
      return row.map(function (value) {
        return '"' + String(value == null ? '' : value).replace(/"/g, '""') + '"';
      }).join(';');
    }).join('\n');
  }

  function readOrders() {
    var value = safeRead(ORDERS_KEY, []);
    return Array.isArray(value) ? value : [];
  }

  document.addEventListener('click', function (event) {
    var trigger = event.target.closest('[data-set-plan]');
    if (!trigger) return;
    var nextPlan = trigger.getAttribute('data-set-plan') || 'basic';
    setPlan(nextPlan);
    alert('Plan ustawiony: ' + nextPlan.toUpperCase());
    location.reload();
  });

  window.QU = {
    uid: uid,
    nowIso: nowIso,
    money: money,
    dateTime: dateTime,
    read: safeRead,
    write: safeWrite,
    plan: plan,
    setPlan: setPlan,
    requirePlans: requirePlans,
    readProducts: readProducts,
    writeProducts: writeProducts,
    readStores: readStores,
    writeStores: writeStores,
    ensureSeedStore: ensureSeedStore,
    getActiveStore: getActiveStore,
    saveStore: saveStore,
    updateActiveStore: updateActiveStore,
    slugify: slugify,
    shell: buildShell,
    escapeHtml: escapeHtml,
    download: download,
    toCsv: toCsv,
    readOrders: readOrders,
    keys: {
      CRM_KEY: CRM_KEY,
      STORES_KEY: STORES_KEY,
      ACTIVE_STORE_KEY: ACTIVE_STORE_KEY,
      PRODUCTS_KEY: PRODUCTS_KEY,
      MARGIN_KEY: MARGIN_KEY,
      ORDERS_KEY: ORDERS_KEY,
      PLAN_KEY: PLAN_KEY
    }
  };
})();