(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const LS_PRODUCTS_BY_SUPPLIER = 'qm_products_by_supplier_v1';
  const LS_ORDERS = 'qm_orders_v1';
  const LS_ACTIVE_STORE = 'qm_active_store_v1';
  const LS_CART = 'qm_cart_v1';
  const LS_STORES = 'qm_stores_v1';

  const FALLBACK_IMAGES = ['./produkt_1.png', './produkt_3.png', './produkt_4.png', './produkt_5.png'];

  function safe(v) { return String(v ?? '').trim(); }
  function money(n) {
    try { return new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(Number(n || 0)); }
    catch { return `${Number(n || 0).toFixed(2)} zł`; }
  }
  function slugify(s) {
    return safe(s).toLowerCase()
      .replace(/[ąćęłńóśźż]/g, (m) => ({ą:'a',ć:'c',ę:'e',ł:'l',ń:'n',ó:'o',ś:'s',ź:'z',ż:'z'}[m] || m))
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }
  function escapeHtml(str) {
    return safe(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
  function randomImage(idx) { return FALLBACK_IMAGES[idx % FALLBACK_IMAGES.length]; }

  function getPlanId() {
    try { return (localStorage.getItem('qm_user_plan_v1') || 'basic').toLowerCase(); }
    catch { return 'basic'; }
  }

  function getActiveStore() {
    try {
      const byUrl = new URL(window.location.href).searchParams.get('store');
      if (byUrl) {
        localStorage.setItem(LS_ACTIVE_STORE, byUrl);
        return byUrl;
      }
    } catch {}
    try { return localStorage.getItem(LS_ACTIVE_STORE) || ''; }
    catch { return ''; }
  }

  function getStoreMeta(slug) {
    try {
      const stores = JSON.parse(localStorage.getItem(LS_STORES) || '{}');
      if (slug && stores && typeof stores === 'object' && stores[slug]) return stores[slug];
      return null;
    } catch {
      return null;
    }
  }

  function getOrders() {
    try {
      const raw = JSON.parse(localStorage.getItem(LS_ORDERS) || '[]');
      return Array.isArray(raw) ? raw : [];
    } catch {
      return [];
    }
  }

  function normalizeProduct(p, supplierFallback = '', idx = 0) {
    const name = safe(p.name || p.title || p.product_name || `Produkt ${idx + 1}`);
    const supplier = safe(p.supplier || p.wholesaler || supplierFallback || 'Hurtownia');
    const category = safe(p.category || p.kategoria || 'Ogólne');
    const image = safe(p.image || p.img || p.image_url || p.photo || randomImage(idx));
    const unit = safe(p.unit || p.jm || 'szt.');
    const moq = Number(p.moq || p.minimum_order_qty || 1) || 1;
    const buyNet = Number(p.buyNet ?? p.buy_net ?? p.cena_zakupu ?? p.price_buy ?? p.cost_net ?? p.net ?? p.cost ?? 0) || 0;
    const retailPrice = window.QM_PRICE && typeof window.QM_PRICE.priceFromProduct === 'function'
      ? window.QM_PRICE.priceFromProduct(p, 'detal')
      : buyNet;
    const wholesalePrice = window.QM_PRICE && typeof window.QM_PRICE.priceFromProduct === 'function'
      ? window.QM_PRICE.priceFromProduct(p, 'hurt')
      : buyNet;
    const salesScore = Number(p.salesCount || p.sales || p.orders || p.rank || 0) || 0;
    const compareAt = Number(p.compareAt || p.compare_at || p.oldPrice || 0) || 0;
    const isNew = !!p.isNew || /new|nowo/i.test(safe(p.badge));
    const isPromo = !!p.isPromo || compareAt > retailPrice;
    const isHit = !!p.isHit || salesScore >= 5;

    return {
      ...p,
      id: safe(p.id || p.sku || slugify(`${supplier}-${name}-${idx}`)),
      name,
      supplier,
      category,
      image,
      unit,
      moq,
      buyNet,
      retailPrice,
      wholesalePrice,
      compareAt,
      salesScore,
      isNew,
      isPromo,
      isHit,
      searchBlob: `${name} ${supplier} ${category}`.toLowerCase()
    };
  }

  function flattenProducts() {
    try {
      const raw = JSON.parse(localStorage.getItem(LS_PRODUCTS_BY_SUPPLIER) || '{}');
      const list = [];
      Object.entries(raw || {}).forEach(([supplier, arr]) => {
        (Array.isArray(arr) ? arr : []).forEach((p, idx) => list.push(normalizeProduct(p, supplier, idx)));
      });
      return list;
    } catch {
      return [];
    }
  }

  function buildRanking(products) {
    const orders = getOrders();
    const soldMap = new Map();

    orders.forEach((order) => {
      const items = Array.isArray(order.items) ? order.items : [];
      items.forEach((item) => {
        const key = safe(item.id || item.sku || item.name);
        const qty = Number(item.qty || item.quantity || 1) || 1;
        soldMap.set(key, (soldMap.get(key) || 0) + qty);
      });
    });

    return products
      .map((p, i) => {
        const sold = soldMap.get(p.id) || soldMap.get(p.name) || p.salesScore || 0;
        const promoBoost = p.isPromo ? 4 : 0;
        const newBoost = p.isNew ? 2 : 0;
        const hitBoost = p.isHit ? 5 : 0;
        const priceBoost = Math.max(0, 20 - p.retailPrice / 10);
        const score = sold + promoBoost + newBoost + hitBoost + priceBoost;
        return { ...p, sold, score, rank: i + 1 };
      })
      .sort((a, b) => b.score - a.score);
  }

  function getBadges(product) {
    const badges = [];
    if (product.isHit || product.sold >= 3) badges.push({ key: 'hit', label: 'HIT' });
    if (product.isNew) badges.push({ key: 'new', label: 'NOWOŚĆ' });
    if (product.isPromo || product.compareAt > product.retailPrice) badges.push({ key: 'promo', label: 'PROMOCJA' });
    return badges.slice(0, 3);
  }

  function getPremiumSuppliers(products) {
    const grouped = {};
    products.forEach((p) => {
      if (!grouped[p.supplier]) grouped[p.supplier] = { supplier: p.supplier, count: 0, categories: new Set(), hits: 0, promos: 0 };
      grouped[p.supplier].count += 1;
      grouped[p.supplier].categories.add(p.category);
      if (p.isHit) grouped[p.supplier].hits += 1;
      if (p.isPromo) grouped[p.supplier].promos += 1;
    });

    return Object.values(grouped)
      .map((x) => ({
        supplier: x.supplier,
        count: x.count,
        categories: x.categories.size,
        score: x.count + x.categories.size * 2 + x.hits * 3 + x.promos * 2
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);
  }

  function cardHtml(p, mode = 'detal') {
    const displayPrice = mode === 'hurt' ? p.wholesalePrice : p.retailPrice;
    const badges = getBadges(p)
      .map((b) => `<span class="qm-badge qm-badge--${b.key}">${escapeHtml(b.label)}</span>`)
      .join('');
    const oldPrice = p.compareAt > displayPrice ? `<span class="qm-old">${money(p.compareAt)}</span>` : '';
    return `
      <article class="qm-product-card">
        <div class="qm-product-card__image"><img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}" loading="lazy"></div>
        <div class="qm-badges">${badges}</div>
        <div class="qm-meta">${escapeHtml(p.category)} • ${escapeHtml(p.supplier)}</div>
        <div class="qm-title">${escapeHtml(p.name)}</div>
        <div class="qm-sub">Produkt gotowy do wystawienia, promocji i wrzucenia do koszyka.</div>
        <div class="qm-price-row">${oldPrice}<span class="qm-price">${money(displayPrice)}</span></div>
        <div class="qm-moq">MOQ: ${p.moq} ${escapeHtml(p.unit)} ${mode === 'hurt' ? '• tryb B2B' : '• tryb detaliczny'}</div>
        <div class="qm-actions">
          <button class="qm-btn qm-btn--primary" data-add-product="${escapeHtml(p.id)}">Dodaj</button>
        </div>
      </article>
    `;
  }

  function ensureEnhancer() {
    if (!$('#qmEnhancer')) {
      const main = $('main') || document.body;
      const holder = document.createElement('section');
      holder.id = 'qmEnhancer';
      main.insertBefore(holder, main.firstChild);
    }
  }

  function renderTopProducts(ranking, mode) {
    ensureEnhancer();
    const host = $('#qmEnhancer');
    const top = ranking.slice(0, 8);
    host.insertAdjacentHTML('beforeend', `
      <section class="qm-card qm-section">
        <div class="qm-section__head">
          <div>
            <div class="shop-kicker">Sprzedaje najlepiej</div>
            <h2>TOP PRODUKTY / BESTSELLERY</h2>
          </div>
          <p>To promuj na start, bo daje najszybszy obrót i największą szansę na pierwsze zamówienia.</p>
        </div>
        <div class="qm-mini-grid">${top.map((p) => cardHtml(p, mode)).join('')}</div>
      </section>
    `);
  }

  function renderPremiumSuppliers(products) {
    ensureEnhancer();
    const host = $('#qmEnhancer');
    const premium = getPremiumSuppliers(products);
    const plan = getPlanId();
    host.insertAdjacentHTML('beforeend', `
      <section class="qm-card qm-section">
        <div class="qm-section__head">
          <div>
            <div class="shop-kicker">Mocne źródła towaru</div>
            <h2>HURTOWNIE PREMIUM</h2>
          </div>
          <p>${plan === 'basic' ? 'BASIC widzi tylko część listy. PRO i ELITE dostają pełniejszy dostęp.' : 'Masz aktywny dostęp do sekcji premium supplierów.'}</p>
        </div>
        <div class="qm-premium-grid">
          ${premium.map((s, idx) => `
            <article class="qm-premium-card">
              <strong>${escapeHtml(s.supplier)} PREMIUM</strong>
              <span>${s.count} produktów • ${s.categories} kategorii</span>
              <p>${plan === 'basic' && idx > 1 ? 'Dostęp od PRO' : 'Gotowe do wrzucenia do sklepu i promocji.'}</p>
            </article>
          `).join('')}
        </div>
      </section>
    `);
  }

  function renderBoosters(ranking) {
    ensureEnhancer();
    const host = $('#qmEnhancer');
    const best = ranking[0];
    const { total } = getCartTotals();
    const freeShippingThreshold = 199;
    const progress = Math.min(100, Math.round((total / freeShippingThreshold) * 100));
    const missing = Math.max(0, freeShippingThreshold - total);

    host.insertAdjacentHTML('beforeend', `
      <section class="qm-card qm-section">
        <div class="qm-section__head">
          <div>
            <div class="shop-kicker">Większy koszyk = większa marża</div>
            <h2>MECHANIZMY ZWIĘKSZAJĄCE SPRZEDAŻ</h2>
          </div>
          <p>Klient ma widzieć powód, żeby dodać jeszcze jeden produkt i przejść do checkout.</p>
        </div>
        <div class="qm-premium-grid">
          <article class="qm-booster-item">
            <strong>Próg darmowej dostawy</strong>
            <p>${missing > 0 ? `Dodaj jeszcze za ${money(missing)}, aby dobić próg ${money(freeShippingThreshold)}.` : 'Próg darmowej dostawy osiągnięty.'}</p>
            <div class="qm-progress"><i style="width:${progress}%"></i></div>
          </article>
          <article class="qm-booster-item">
            <strong>Produkt do dopięcia koszyka</strong>
            <p>Promuj na górze: ${best ? escapeHtml(best.name) : 'Top produkt'}.</p>
          </article>
          <article class="qm-booster-item">
            <strong>Szybki upsell</strong>
            <p>Badge, stary przekreślony cennik i hit tygodnia podnoszą CTR bez dużego budżetu.</p>
          </article>
          <article class="qm-booster-item">
            <strong>Social proof</strong>
            <p>Popupy live budują wrażenie ruchu i pomagają dopiąć decyzję zakupową.</p>
          </article>
        </div>
      </section>
    `);
  }

  function getCart() {
    try {
      const raw = JSON.parse(localStorage.getItem(LS_CART) || '[]');
      return Array.isArray(raw) ? raw : [];
    } catch {
      return [];
    }
  }

  function saveCart(cart) {
    try { localStorage.setItem(LS_CART, JSON.stringify(cart)); } catch {}
  }

  function addToCart(productId, products, mode) {
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    const cart = getCart();
    const existing = cart.find((x) => x.id === product.id);
    const price = mode === 'hurt' ? product.wholesalePrice : product.retailPrice;

    if (existing) existing.qty = Number(existing.qty || 1) + 1;
    else cart.push({ id: product.id, name: product.name, price, qty: 1, supplier: product.supplier, moq: product.moq, mode });

    saveCart(cart);
    updateStickyCart();
  }

  function getCartTotals() {
    const cart = getCart();
    let items = 0;
    let total = 0;
    cart.forEach((item) => {
      const qty = Number(item.qty || 1) || 1;
      items += qty;
      total += (Number(item.price || 0) || 0) * qty;
    });
    return { items, total };
  }

  function renderStickyCart() {
    if ($('#qmStickyCart')) return;
    document.body.insertAdjacentHTML('beforeend', `
      <aside class="qm-sticky-cart" id="qmStickyCart">
        <div class="qm-sticky-cart__meta">
          <strong id="qmStickyCartCount">0 produktów</strong>
          <span id="qmStickyCartTotal">0,00 zł</span>
        </div>
        <a class="qm-btn qm-btn--primary" href="./koszyk.html">Przejdź do koszyka</a>
      </aside>
    `);
  }

  function updateStickyCart() {
    renderStickyCart();
    const { items, total } = getCartTotals();
    const countNode = $('#qmStickyCartCount');
    const totalNode = $('#qmStickyCartTotal');
    if (countNode) countNode.textContent = `${items} ${items === 1 ? 'produkt' : 'produktów'}`;
    if (totalNode) totalNode.textContent = money(total);
  }

  function updateStats(products, mode) {
    const productsNode = $('#qmProductsCount');
    const categoriesNode = $('#qmCategoriesCount');
    const modeNode = $('#qmModeLabel');
    if (productsNode) productsNode.textContent = String(products.length);
    if (categoriesNode) categoriesNode.textContent = String(new Set(products.map((p) => p.category)).size);
    if (modeNode) modeNode.textContent = mode === 'hurt' ? 'HURT' : 'DETAL';
  }

  function fillCategories(products) {
    const node = $('#qmCategory');
    if (!node) return;
    const prev = node.value;
    const categories = [...new Set(products.map((p) => p.category).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pl'));
    node.innerHTML = '<option value="">Wszystkie</option>' + categories.map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
    node.value = prev;
  }

  function sortProducts(list, sortKey, mode) {
    const copy = [...list];
    if (sortKey === 'price-asc') return copy.sort((a, b) => (mode === 'hurt' ? a.wholesalePrice - b.wholesalePrice : a.retailPrice - b.retailPrice));
    if (sortKey === 'price-desc') return copy.sort((a, b) => (mode === 'hurt' ? b.wholesalePrice - a.wholesalePrice : b.retailPrice - a.retailPrice));
    if (sortKey === 'name') return copy.sort((a, b) => a.name.localeCompare(b.name, 'pl'));
    return copy.sort((a, b) => b.score - a.score);
  }

  function renderProductList(products, mode) {
    const search = safe($('#qmSearch') && $('#qmSearch').value).toLowerCase();
    const category = safe($('#qmCategory') && $('#qmCategory').value);
    const sortKey = safe($('#qmSort') && $('#qmSort').value) || 'ranking';
    const host = $('#qmProducts');
    const empty = $('#qmEmpty');
    if (!host || !empty) return;

    let list = [...products];
    if (search) list = list.filter((p) => p.searchBlob.includes(search));
    if (category) list = list.filter((p) => p.category === category);
    list = sortProducts(list, sortKey, mode);

    if (!list.length) {
      host.innerHTML = '';
      empty.hidden = false;
      return;
    }

    empty.hidden = true;
    host.innerHTML = list.map((p) => cardHtml(p, mode)).join('');
  }

  function bindEvents(products) {
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-add-product]');
      if (!btn) return;
      e.preventDefault();
      const mode = safe($('#qmMode') && $('#qmMode').value) || 'detal';
      addToCart(btn.getAttribute('data-add-product'), products, mode);
      btn.textContent = 'Dodano';
      setTimeout(() => { btn.textContent = 'Dodaj'; }, 900);
    });

    ['qmSearch', 'qmCategory', 'qmMode', 'qmSort'].forEach((id) => {
      const node = document.getElementById(id);
      if (!node) return;
      node.addEventListener('input', () => refresh(products));
      node.addEventListener('change', () => refresh(products));
    });
  }

  function applyStoreMeta() {
    const slug = getActiveStore();
    const meta = getStoreMeta(slug);
    const title = $('#qmStoreTitle');
    if (meta && title && meta.title) title.textContent = meta.title;
  }

  function refresh(products) {
    const mode = safe($('#qmMode') && $('#qmMode').value) || 'detal';
    const ranking = buildRanking(products);
    $('#qmEnhancer').innerHTML = '';
    renderTopProducts(ranking, mode);
    renderPremiumSuppliers(products);
    renderBoosters(ranking);
    renderProductList(ranking, mode);
    updateStats(products, mode);
    updateStickyCart();
  }

  function init() {
    applyStoreMeta();
    const products = flattenProducts();
    fillCategories(products);
    bindEvents(products);
    refresh(products);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
