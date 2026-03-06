(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const LS_PRODUCTS_BY_SUPPLIER = 'qm_products_by_supplier_v1';
  const LS_ORDERS = 'qm_orders_v1';
  const LS_ACTIVE_STORE = 'qm_active_store_v1';
  const LS_CART = 'qm_cart_v1';

  const money = (n) => {
    try {
      return new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(Number(n || 0));
    } catch {
      return `${Number(n || 0).toFixed(2)} zł`;
    }
  };

  const safe = (v) => String(v ?? '').trim();
  const slugify = (s) => safe(s)
    .toLowerCase()
    .replace(/[ąćęłńóśźż]/g, (m) => ({ ą:'a', ć:'c', ę:'e', ł:'l', ń:'n', ó:'o', ś:'s', ź:'z', ż:'z' }[m] || m))
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  function getPlanId() {
    try { return (localStorage.getItem('qm_user_plan_v1') || 'basic').toLowerCase(); } catch { return 'basic'; }
  }

  function getActiveStore() {
    try {
      const byUrl = new URL(window.location.href).searchParams.get('store');
      if (byUrl) {
        localStorage.setItem(LS_ACTIVE_STORE, byUrl);
        return byUrl;
      }
    } catch {}
    try { return localStorage.getItem(LS_ACTIVE_STORE) || ''; } catch { return ''; }
  }

  function flattenProducts() {
    try {
      const raw = JSON.parse(localStorage.getItem(LS_PRODUCTS_BY_SUPPLIER) || '{}');
      const list = [];
      Object.entries(raw || {}).forEach(([supplier, arr]) => {
        (Array.isArray(arr) ? arr : []).forEach((p, idx) => {
          list.push(normalizeProduct(p, supplier, idx));
        });
      });
      return list;
    } catch {
      return [];
    }
  }

  function normalizeProduct(p, supplierFallback = '', idx = 0) {
    const name = safe(p.name || p.title || p.product_name || `Produkt ${idx + 1}`);
    const supplier = safe(p.supplier || p.wholesaler || supplierFallback || 'Hurtownia');
    const category = safe(p.category || p.kategoria || 'Ogólne');
    const img = safe(p.image || p.img || p.image_url || p.photo || './produkt_1.png');
    const unit = safe(p.unit || p.jm || 'szt.');
    const moq = Number(p.moq || p.minimum_order_qty || 1) || 1;
    const buyNet = Number(p.buyNet ?? p.buy_net ?? p.cena_zakupu ?? p.price_buy ?? p.cost_net ?? p.net ?? p.cost ?? 0) || 0;

    let price = buyNet;
    try {
      if (window.QM_PRICE && typeof window.QM_PRICE.priceFromProduct === 'function') {
        price = window.QM_PRICE.priceFromProduct(p, 'detal', {
          retailPct: 0.08,
          wholesalePct: 0.05,
          minProfit: 1.5,
          retailEnds99: true
        });
      }
    } catch {}

    const salesScore = Number(p.salesCount || p.sales || p.orders || p.rank || 0) || 0;
    const compareAt = Number(p.compareAt || p.compare_at || p.oldPrice || 0) || 0;
    const isNew = !!p.isNew || /new|nowość/i.test(safe(p.badge));
    const isPromo = !!p.isPromo || compareAt > price;
    const isHit = !!p.isHit || salesScore >= 5;

    return {
      ...p,
      id: safe(p.id || p.sku || slugify(`${supplier}-${name}-${idx}`)),
      name,
      supplier,
      category,
      image: img,
      unit,
      moq,
      buyNet,
      price,
      compareAt,
      isNew,
      isPromo,
      isHit,
      salesScore,
    };
  }

  function getOrders() {
    try {
      const raw = JSON.parse(localStorage.getItem(LS_ORDERS) || '[]');
      return Array.isArray(raw) ? raw : [];
    } catch {
      return [];
    }
  }

  function buildRanking(products) {
    const orders = getOrders();
    const soldMap = new Map();

    orders.forEach(order => {
      const items = Array.isArray(order.items) ? order.items : [];
      items.forEach(item => {
        const key = safe(item.id || item.sku || item.name);
        const qty = Number(item.qty || item.quantity || 1) || 1;
        soldMap.set(key, (soldMap.get(key) || 0) + qty);
      });
    });

    return products
      .map((p, i) => {
        const sold = soldMap.get(p.id) || soldMap.get(p.name) || p.salesScore || 0;
        const promoBoost = p.isPromo ? 3 : 0;
        const newBoost = p.isNew ? 2 : 0;
        const hitBoost = p.isHit ? 4 : 0;
        const score = sold + promoBoost + newBoost + hitBoost + Math.max(0, 20 - p.price / 10);
        return { ...p, sold, score, rank: i + 1 };
      })
      .sort((a, b) => b.score - a.score);
  }

  function getBadges(product) {
    const badges = [];
    if (product.isHit || product.sold >= 3) badges.push({ key: 'hit', label: 'HIT' });
    if (product.isNew) badges.push({ key: 'new', label: 'NOWOŚĆ' });
    if (product.isPromo || product.compareAt > product.price) badges.push({ key: 'promo', label: 'PROMOCJA' });
    return badges.slice(0, 3);
  }

  function getPremiumSuppliers(products) {
    const grouped = {};
    products.forEach(p => {
      if (!grouped[p.supplier]) grouped[p.supplier] = { supplier: p.supplier, count: 0, categories: new Set(), hits: 0, promos: 0 };
      grouped[p.supplier].count += 1;
      grouped[p.supplier].categories.add(p.category);
      if (p.isHit) grouped[p.supplier].hits += 1;
      if (p.isPromo) grouped[p.supplier].promos += 1;
    });
    return Object.values(grouped)
      .map(x => ({
        supplier: x.supplier,
        count: x.count,
        categories: x.categories.size,
        score: x.count + x.categories.size * 2 + x.hits * 3 + x.promos * 2,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);
  }

  function escapeHtml(str) {
    return safe(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function cardHtml(p, compact = false) {
    const badges = getBadges(p).map(b => `<span class="qm-badge qm-badge--${b.key}">${escapeHtml(b.label)}</span>`).join('');
    const oldPrice = p.compareAt > p.price ? `<div class="qm-old-price">${money(p.compareAt)}</div>` : '';
    return `
      <article class="qm-card${compact ? ' qm-card--compact' : ''}">
        <div class="qm-card__media">
          <img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}" loading="lazy">
          <div class="qm-badges">${badges}</div>
        </div>
        <div class="qm-card__body">
          <div class="qm-card__meta">${escapeHtml(p.category)} • ${escapeHtml(p.supplier)}</div>
          <h3 class="qm-card__title">${escapeHtml(p.name)}</h3>
          <div class="qm-card__sub">MOQ: ${p.moq} ${escapeHtml(p.unit)}</div>
          <div class="qm-card__priceWrap">
            ${oldPrice}
            <div class="qm-price">${money(p.price)}</div>
          </div>
          <button class="qm-btn-add" data-add-product="${escapeHtml(p.id)}">Dodaj</button>
        </div>
      </article>
    `;
  }

  function ensureShell() {
    if (!$('#qmEnhancer')) {
      const anchor = $('main') || $('.wrap') || document.body;
      anchor.insertAdjacentHTML('afterbegin', `<section id="qmEnhancer" class="qm-enhancer"></section>`);
    }
  }

  function renderTopProducts(ranking) {
    ensureShell();
    const host = $('#qmEnhancer');
    const top = ranking.slice(0, 8);
    host.insertAdjacentHTML('beforeend', `
      <section class="qm-section">
        <div class="qm-head">
          <div>
            <div class="qm-kicker">Sprzedaje najlepiej</div>
            <h2>TOP PRODUKTY / BESTSELLERY</h2>
          </div>
          <div class="qm-note">To promuj na start, bo daje najszybszy obrót.</div>
        </div>
        <div class="qm-grid qm-grid--top">
          ${top.map(p => cardHtml(p, true)).join('')}
        </div>
      </section>
    `);
  }

  function renderPremiumSuppliers(products) {
    ensureShell();
    const host = $('#qmEnhancer');
    const premium = getPremiumSuppliers(products);
    const plan = getPlanId();
    host.insertAdjacentHTML('beforeend', `
      <section class="qm-section">
        <div class="qm-head">
          <div>
            <div class="qm-kicker">Mocne źródła towaru</div>
            <h2>HURTOWNIE PREMIUM</h2>
          </div>
          <div class="qm-note">${plan === 'basic' ? 'Odblokuj PRO, żeby mieć pełny dostęp do premium supplierów.' : 'Masz aktywny dostęp do premium supplierów.'}</div>
        </div>
        <div class="qm-suppliers">
          ${premium.map((s, idx) => `
            <article class="qm-supplier ${plan === 'basic' && idx > 1 ? 'qm-supplier--locked' : ''}">
              <div class="qm-supplier__top">
                <strong>${escapeHtml(s.supplier)}</strong>
                <span class="qm-pill">PREMIUM</span>
              </div>
              <div class="qm-supplier__stats">${s.count} produktów • ${s.categories} kategorii</div>
              ${plan === 'basic' && idx > 1 ? '<div class="qm-locked">Dostęp od PRO</div>' : '<div class="qm-open">Gotowe do wrzucenia do sklepu</div>'}
            </article>
          `).join('')}
        </div>
      </section>
    `);
  }

  function getCart() {
    try {
      const raw = JSON.parse(localStorage.getItem(LS_CART) || '[]');
      return Array.isArray(raw) ? raw : [];
    } catch { return []; }
  }

  function saveCart(cart) {
    try { localStorage.setItem(LS_CART, JSON.stringify(cart)); } catch {}
  }

  function addToCart(productId, products) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    const cart = getCart();
    const existing = cart.find(x => x.id === product.id);
    if (existing) existing.qty = Number(existing.qty || 1) + 1;
    else cart.push({ id: product.id, name: product.name, price: product.price, qty: 1, supplier: product.supplier });
    saveCart(cart);
    updateStickyCart();
  }

  function getCartTotals() {
    const cart = getCart();
    let items = 0;
    let total = 0;
    cart.forEach(item => {
      const qty = Number(item.qty || 1) || 1;
      items += qty;
      total += (Number(item.price || 0) || 0) * qty;
    });
    return { items, total };
  }

  function renderStickyCart() {
    if ($('#qmStickyCart')) return;
    document.body.insertAdjacentHTML('beforeend', `
      <div id="qmStickyCart" class="qm-sticky-cart">
        <div class="qm-sticky-cart__meta">
          <strong id="qmStickyCartCount">0 produktów</strong>
          <span id="qmStickyCartTotal">0,00 zł</span>
        </div>
        <a class="qm-sticky-cart__btn" href="./koszyk.html">Przejdź do koszyka</a>
      </div>
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

  function renderBoosters(products, ranking) {
    ensureShell();
    const host = $('#qmEnhancer');
    const best = ranking[0];
    const { total } = getCartTotals();
    const freeShippingThreshold = 199;
    const progress = Math.min(100, Math.round((total / freeShippingThreshold) * 100));
    const missing = Math.max(0, freeShippingThreshold - total);

    host.insertAdjacentHTML('beforeend', `
      <section class="qm-section">
        <div class="qm-head">
          <div>
            <div class="qm-kicker">Większy koszyk = większa marża</div>
            <h2>MECHANIZMY ZWIĘKSZAJĄCE SPRZEDAŻ</h2>
          </div>
          <div class="qm-note">Prosty system: klient widzi powód, żeby dodać jeszcze jeden produkt.</div>
        </div>
        <div class="qm-boosters">
          <article class="qm-booster">
            <div class="qm-booster__title">Próg darmowej dostawy</div>
            <div class="qm-progress"><span style="width:${progress}%"></span></div>
            <div class="qm-booster__desc">${missing > 0 ? `Dodaj jeszcze za ${money(missing)}, aby dobić próg ${money(freeShippingThreshold)}.` : 'Próg darmowej dostawy osiągnięty.'}</div>
          </article>
          <article class="qm-booster">
            <div class="qm-booster__title">Produkt do dopięcia koszyka</div>
            <div class="qm-booster__desc">Promuj na górze: <strong>${best ? escapeHtml(best.name) : 'Top produkt'}</strong></div>
          </article>
          <article class="qm-booster">
            <div class="qm-booster__title">Szybki upsell</div>
            <div class="qm-booster__desc">Dodaj badge, stary przekreślony cennik i hit tygodnia — to podnosi CTR bez reklamy.</div>
          </article>
        </div>
      </section>
    `);
  }

  function bindEvents(products) {
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-add-product]');
      if (!btn) return;
      e.preventDefault();
      addToCart(btn.getAttribute('data-add-product'), products);
      btn.textContent = 'Dodano';
      setTimeout(() => { btn.textContent = 'Dodaj'; }, 900);
    });
  }

  function applyBodyFlags() {
    document.body.classList.add('qm-mobile-first');
    if (window.innerWidth <= 768) document.body.classList.add('qm-phone');
  }

  function init() {
    applyBodyFlags();
    const activeStore = getActiveStore();
    if (activeStore) document.body.setAttribute('data-store', activeStore);

    const products = flattenProducts();
    const ranking = buildRanking(products);
    if (products.length) {
      renderTopProducts(ranking);
      renderPremiumSuppliers(products);
      renderBoosters(products, ranking);
      bindEvents(products);
    }
    updateStickyCart();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
