// js/shop.js
// Sklep + koszyk (UI) + multi-store sync + produkty z LS/JSON + ceny z pricing.js + motywy sklepu
// upgrade: bestsellery, badge HIT/NOWOŚĆ/PROMOCJA, premium hurtownie, mobile UX, mechanizmy sprzedażowe

(() => {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  if (!window.QM_SHOP || !window.QM_SHOP.Cart || !window.QM_SHOP.money) {
    console.error("QM_SHOP / Cart / money not found");
    return;
  }

  const { Cart, money } = window.QM_SHOP;

  const LS_STORES = "qm_stores_v1";
  const LS_ACTIVE = "qm_active_store_v1";
  const LS_STORE_MARGIN = "qm_store_margin_pct";
  const LS_PRODUCTS_BY_SUPPLIER = "qm_products_by_supplier_v1";
  const LS_TAGLINE = "qm_store_tagline_v1";

  const FALLBACK_JSON = "./products.json";
  const FALLBACK_IMAGES = ["./produkt_1.png", "./produkt_3.png", "./produkt_4.png", "./produkt_5.png"];
  const DEFAULT_LOGO = "./produkt_1.png";
  const DEFAULT_THEME = "default";
  const DEFAULT_ACCENT = "#6ee7ff";
  const DEFAULT_STORE_TITLE = "Sklep dropshipping – Gastronomia / Masarnie";
  const DEFAULT_TAGLINE = "Hurt i detal bez magazynu";
  const FREE_SHIPPING_RETAIL = 299;
  const FREE_SHIPPING_B2B = 999;

  const safeStr = (v) => String(v ?? "").trim();
  const slugify = (s) => String(s || "").trim().toLowerCase().replace(/[ąćęłńóśźż]/g, (m) => ({ "ą":"a","ć":"c","ę":"e","ł":"l","ń":"n","ó":"o","ś":"s","ź":"z","ż":"z" }[m] || m)).replace(/[^a-z0-9]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  const readJSON = (k, fallback) => { try { const raw = localStorage.getItem(k); return raw ? JSON.parse(raw) : fallback; } catch { return fallback; } };
  const writeJSON = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { console.warn("writeJSON failed:", k, e); } };
  const clampMargin = (n) => { let x = Number(String(n ?? "").replace(",", ".")); if (!isFinite(x) || x < 0) x = 0; if (x > 1) x = x / 100; return Math.max(0, Math.min(1, x)); };
  const num = (v) => { if (v === null || v === undefined || v === "") return 0; const cleaned = String(v).replace(/\s/g, "").replace(/zł|pln/gi, "").replace(",", "."); const n = Number(cleaned); return isFinite(n) ? n : 0; };
  const hashPick = (s) => { const x = safeStr(s); let h = 0; for (let i = 0; i < x.length; i++) h = (h << 5) - h + x.charCodeAt(i); return FALLBACK_IMAGES[Math.abs(h) % FALLBACK_IMAGES.length]; };
  const escapeHtml = (s) => String(s ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
  const pickFirstString = (...vals) => { for (const v of vals) { const x = safeStr(v); if (x) return x; } return ""; };
  const pickFirstPositive = (...vals) => { for (const v of vals) { const x = num(v); if (x > 0) return x; } return 0; };

  const svgToDataUri = (svg) => `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  const makeLogoSvg = (label, bg, fg) => `
    <svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
      <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${bg}"/><stop offset="100%" stop-color="#0b1220"/></linearGradient></defs>
      <rect width="512" height="512" rx="120" fill="url(#g)"/>
      <rect x="64" y="96" width="384" height="320" rx="86" fill="rgba(255,255,255,.08)" stroke="rgba(255,255,255,.18)" stroke-width="10"/>
      <path d="M176 196c0-44 36-80 80-80s80 36 80 80" fill="none" stroke="${fg}" stroke-width="24" stroke-linecap="round"/>
      <text x="256" y="322" text-anchor="middle" font-size="120" font-family="Arial, Helvetica, sans-serif" font-weight="900" fill="${fg}">${label}</text>
    </svg>`;

  const THEME_PRESETS = {
    default: { label: "default", accent: "#6ee7ff", hero: "linear-gradient(180deg,#101826,#0a101a)", logo: svgToDataUri(makeLogoSvg("QM", "#0f172a", "#6ee7ff")), vars: { "--store-surface":"rgba(15,23,42,.88)", "--store-surface-2":"rgba(255,255,255,.06)", "--store-line":"rgba(255,255,255,.12)", "--store-text":"#ecf3ff", "--store-muted":"rgba(236,243,255,.72)" } },
    dark: { label: "dark", accent: "#7dd3fc", hero: "linear-gradient(180deg,#0b1220,#050814)", logo: svgToDataUri(makeLogoSvg("DK", "#020617", "#cbd5e1")), vars: { "--store-surface":"rgba(3,7,18,.9)", "--store-surface-2":"rgba(148,163,184,.06)", "--store-line":"rgba(148,163,184,.16)", "--store-text":"#f8fafc", "--store-muted":"rgba(226,232,240,.74)" } },
    light: { label: "light", accent: "#2563eb", hero: "linear-gradient(180deg,#f8fafc,#e2e8f0)", logo: svgToDataUri(makeLogoSvg("LT", "#ffffff", "#2563eb")), vars: { "--store-surface":"rgba(255,255,255,.9)", "--store-surface-2":"rgba(37,99,235,.04)", "--store-line":"rgba(15,23,42,.08)", "--store-text":"#0f172a", "--store-muted":"rgba(15,23,42,.62)" } },
    neon: { label: "neon", accent: "#22d3ee", hero: "radial-gradient(circle at 20% 20%, rgba(110,231,255,.35), transparent 30%), linear-gradient(180deg,#12051d,#050816)", logo: svgToDataUri(makeLogoSvg("NX", "#12051d", "#67e8f9")), vars: { "--store-surface":"rgba(12,10,24,.9)", "--store-surface-2":"rgba(34,211,238,.08)", "--store-line":"rgba(34,211,238,.18)", "--store-text":"#ecfeff", "--store-muted":"rgba(207,250,254,.76)" } },
    gastro: { label: "gastro", accent: "#fb923c", hero: "linear-gradient(180deg,#2a1707,#120b06)", logo: svgToDataUri(makeLogoSvg("GS", "#3b1d0b", "#fdba74")), vars: { "--store-surface":"rgba(40,22,10,.92)", "--store-surface-2":"rgba(251,146,60,.08)", "--store-line":"rgba(251,146,60,.16)", "--store-text":"#fff7ed", "--store-muted":"rgba(255,237,213,.72)" } },
    premium: { label: "premium", accent: "#a78bfa", hero: "linear-gradient(180deg,#1a2030,#0a0f19)", logo: svgToDataUri(makeLogoSvg("PR", "#111827", "#c4b5fd")), vars: { "--store-surface":"rgba(17,24,39,.92)", "--store-surface-2":"rgba(167,139,250,.08)", "--store-line":"rgba(167,139,250,.18)", "--store-text":"#f5f3ff", "--store-muted":"rgba(221,214,254,.76)" } },
    gold: { label: "gold", accent: "#fbbf24", hero: "linear-gradient(180deg,#332300,#120d04)", logo: svgToDataUri(makeLogoSvg("GD", "#3b2a05", "#fde68a")), vars: { "--store-surface":"rgba(42,29,7,.92)", "--store-surface-2":"rgba(251,191,36,.08)", "--store-line":"rgba(251,191,36,.18)", "--store-text":"#fffbeb", "--store-muted":"rgba(254,243,199,.78)" } }
  };
  const getThemePreset = (theme) => THEME_PRESETS[String(theme || DEFAULT_THEME)] || THEME_PRESETS[DEFAULT_THEME];

  const getStoreFromPanelFallback = () => ({ slug: slugify(localStorage.getItem("qm_store_slug") || ""), marginPct: clampMargin(localStorage.getItem("qm_store_margin_pct") || "") });
  const getTagline = (slug) => safeStr(readJSON(LS_TAGLINE, {})[slug]) || DEFAULT_TAGLINE;

  const ensureStoreRegistry = () => {
    const reg = readJSON(LS_STORES, {});
    const { slug, marginPct } = getStoreFromPanelFallback();
    if (slug && !reg[slug]) {
      reg[slug] = { marginPct, title: slug.replaceAll("-", " "), theme: DEFAULT_THEME, accent: DEFAULT_ACCENT, logo: "", hero: "" };
      writeJSON(LS_STORES, reg);
    }
  };

  const getActiveStoreSlug = () => {
    try {
      const u = new URL(window.location.href);
      const fromUrl = slugify(u.searchParams.get("store") || "");
      if (fromUrl) return fromUrl;
    } catch {}
    return slugify(localStorage.getItem(LS_ACTIVE) || "") || slugify(localStorage.getItem("qm_store_slug") || "") || "";
  };

  const getStoreConfig = (slug) => {
    const s = slugify(slug || getActiveStoreSlug());
    const reg = readJSON(LS_STORES, {});
    const raw = (s && reg && reg[s]) ? reg[s] : {};
    return {
      slug: s,
      title: safeStr(raw.title) || DEFAULT_STORE_TITLE,
      theme: safeStr(raw.theme) || DEFAULT_THEME,
      accent: safeStr(raw.accent) || getThemePreset(raw.theme).accent || DEFAULT_ACCENT,
      logo: safeStr(raw.logo) || getThemePreset(raw.theme).logo || "",
      hero: safeStr(raw.hero) || getThemePreset(raw.theme).hero || "",
      email: safeStr(raw.email) || "",
      marginPct: clampMargin(raw.marginPct || 0),
      tagline: getTagline(s)
    };
  };

  const setActiveStore = (slug) => {
    const s = slugify(slug);
    if (!s) return;
    ensureStoreRegistry();
    const reg = readJSON(LS_STORES, {});
    if (!reg[s]) {
      reg[s] = { marginPct: 0, title: s.replaceAll("-", " "), theme: DEFAULT_THEME, accent: DEFAULT_ACCENT, logo: "", hero: "" };
      writeJSON(LS_STORES, reg);
    }
    localStorage.setItem(LS_ACTIVE, s);
    const entry = (readJSON(LS_STORES, {})[s] || {});
    const margin = clampMargin(entry.marginPct || 0);
    localStorage.setItem(LS_STORE_MARGIN, String(margin));
    localStorage.setItem("qm_store_slug", s);
    window.dispatchEvent(new CustomEvent("qm:store", { detail: { slug: s, marginPct: margin, store: getStoreConfig(s) } }));
  };

  const applyStoreFromUrl = () => {
    try {
      const u = new URL(window.location.href);
      const store = slugify(u.searchParams.get("store") || "");
      if (store) {
        setActiveStore(store);
        return;
      }
    } catch {}
    ensureStoreRegistry();
    const active = slugify(localStorage.getItem(LS_ACTIVE) || "");
    if (active) {
      const reg = readJSON(LS_STORES, {});
      localStorage.setItem(LS_STORE_MARGIN, String(clampMargin(reg[active]?.marginPct || 0)));
      localStorage.setItem("qm_store_slug", active);
    }
  };
  applyStoreFromUrl();

  const withStore = (href) => {
    const s = getActiveStoreSlug();
    if (!href || !s) return href;
    const val = String(href);
    if (val.startsWith("http://") || val.startsWith("https://") || val.startsWith("mailto:") || val.startsWith("tel:") || val.startsWith("#") || val.includes("store=")) return href;
    return `${val}${val.includes("?") ? "&" : "?"}store=${encodeURIComponent(s)}`;
  };

  const syncStoreLinks = () => {
    const s = getActiveStoreSlug();
    const badge = $("#activeStoreBadge");
    if (badge) badge.textContent = s ? `store: ${s}` : "store";
    document.querySelectorAll("a[href]").forEach((a) => {
      const href = a.getAttribute("href") || "";
      if (href.includes("koszyk.html") || href.includes("zamowienia.html") || href.includes("panel-sklepu.html") || href.includes("sklep.html") || href.includes("checkout.html")) {
        a.setAttribute("href", withStore(href));
      }
    });
  };

  const setRootVar = (name, value) => { if (value) document.documentElement.style.setProperty(name, value); };
  const themeHeroFallback = (theme) => getThemePreset(theme).hero || THEME_PRESETS.default.hero;

  const applyStoreVisuals = () => {
    const store = getStoreConfig();
    Array.from(document.body.classList).forEach((cls) => { if (cls.startsWith("theme-")) document.body.classList.remove(cls); });
    document.body.classList.add(`theme-${store.theme || DEFAULT_THEME}`);

    const preset = getThemePreset(store.theme);
    Object.entries(preset.vars || {}).forEach(([name, value]) => setRootVar(name, value));
    setRootVar("--store-accent", store.accent || preset.accent || DEFAULT_ACCENT);

    const titleEl = $("#storeTitle");
    if (titleEl) titleEl.textContent = store.title || DEFAULT_STORE_TITLE;
    const subtitleEl = $("#storeTagline");
    if (subtitleEl) subtitleEl.textContent = store.tagline || DEFAULT_TAGLINE;
    document.title = `${store.title || DEFAULT_STORE_TITLE} – QualitetMarket`;

    const badgeEl = $("#activeStoreBadge");
    if (badgeEl) badgeEl.textContent = store.slug ? `store: ${store.slug}` : "store";
    const themeBadgeEl = $("#storeThemeBadge");
    if (themeBadgeEl) themeBadgeEl.textContent = `theme: ${store.theme || DEFAULT_THEME}`;

    const logoEl = $("#storeLogo");
    if (logoEl) {
      logoEl.src = store.logo || preset.logo || DEFAULT_LOGO;
      logoEl.onerror = function(){ this.onerror = null; this.src = preset.logo || DEFAULT_LOGO; };
    }

    const heroEl = $("#storeHero");
    if (heroEl) {
      heroEl.style.backgroundImage = store.hero ? `url("${String(store.hero).replace(/"/g, '\\"')}")` : themeHeroFallback(store.theme);
    }

    $$(".accent-chip,.accent-dot").forEach((el) => {
      el.style.background = store.accent || preset.accent || DEFAULT_ACCENT;
      el.style.borderColor = store.accent || preset.accent || DEFAULT_ACCENT;
    });

    window.QM_STORE_VIEW = { slug: store.slug, title: store.title, theme: store.theme, accent: store.accent, hero: store.hero, logo: store.logo, tagline: store.tagline };
  };

  const PR = window.QM_PRICE && (window.QM_PRICE.priceFromProduct || window.QM_PRICE.priceFromBuy) ? window.QM_PRICE : null;
  const CFG = window.QM_CONFIG && window.QM_CONFIG.pricing ? window.QM_CONFIG : null;
  const getPricingRules = () => CFG && CFG.pricing ? CFG.pricing : { retailPct: 0.08, wholesalePct: 0.05, minProfit: 1.5, retailEnds99: true };

  const pickBuyNet = (p) => pickFirstPositive(p.buyNet, p.buy, p.costNet, p.cost, p.purchaseNet, p.purchase, p.netto, p.cenaNetto, p.priceNet, p.net, p.wholesaleNet, p.price_net, p.cena_netto, p.net_price, p.wholesale_net);
  const pickFallbackRetail = (p) => pickFirstPositive(p.priceRetail, p.price, p.cena, p.brutto, p.priceGross, p.gross);
  const pickFallbackB2B = (p) => pickFirstPositive(p.priceB2B, p.priceWholesale, p.hurt, p.wholesale, p.b2b, p.b2bPrice, p.netto, p.net, p.price_net);
  const pickCompareAt = (p) => pickFirstPositive(p.compareAt, p.compare_at, p.oldPrice, p.old_price, p.cenaStara, p.priceOld, p.msrp, p.regularPrice, p.regular_price);

  const computePrices = (rawProduct, buyNet, fallbackRetail, fallbackB2B) => {
    const rules = getPricingRules();
    if (buyNet > 0 && PR && typeof PR.priceFromProduct === "function") return { priceRetail: Number(PR.priceFromProduct(rawProduct, "detal", rules)) || 0, priceB2B: Number(PR.priceFromProduct(rawProduct, "hurt", rules)) || 0, buyNet };
    if (buyNet > 0 && PR && typeof PR.priceFromBuy === "function") return { priceRetail: Number(PR.priceFromBuy(buyNet, "detal", rules)) || 0, priceB2B: Number(PR.priceFromBuy(buyNet, "hurt", rules)) || 0, buyNet };
    const pr = fallbackRetail > 0 ? fallbackRetail : 0;
    const pb = fallbackB2B > 0 ? fallbackB2B : pr;
    return { priceRetail: pr, priceB2B: pb, buyNet: buyNet || 0 };
  };

  const hasKeyword = (obj, words) => {
    const text = [obj?.name, obj?.nazwa, obj?.title, obj?.tag, obj?.badge, obj?.label, obj?.status, obj?.flags, obj?.promo, obj?.promoLabel].map((x) => safeStr(x).toLowerCase()).join(" ");
    return words.some((w) => text.includes(w));
  };

  const normalizeProduct = (p) => {
    const name = pickFirstString(p.name, p.nazwa, p.title) || "Produkt";
    const id = pickFirstString(p.id, p.sku, p.ean, name);
    const prices = computePrices(p, pickBuyNet(p), pickFallbackRetail(p), pickFallbackB2B(p));
    const compareAt = pickCompareAt(p);
    const isPromoExplicit = hasKeyword(p, ["promo", "promocja", "sale", "okazja", "deal"]);
    const isNewExplicit = hasKeyword(p, ["new", "nowosc", "nowość", "fresh", "najnowsze"]);
    const isHitExplicit = hasKeyword(p, ["hit", "top", "best", "bestseller", "polecane"]);
    const discountPct = compareAt > prices.priceRetail && prices.priceRetail > 0 ? Math.max(0, Math.round((1 - (prices.priceRetail / compareAt)) * 100)) : 0;

    return {
      raw: p,
      id: String(id),
      sku: String(p.sku || id),
      name: String(name),
      category: String(pickFirstString(p.category, p.kategoria, p.cat)),
      supplier: String(pickFirstString(p.supplier, p.hurtownia, p.vendor, p.dostawca)),
      unit: String(pickFirstString(p.unit, p.jm, p.jednostka) || "szt"),
      moq: (Number(p.moq ?? p.min ?? p.minimum ?? 1) > 0 ? Number(p.moq ?? p.min ?? p.minimum ?? 1) : 1),
      image: pickFirstString(p.image, p.img, p.photo, p.zdjecie, p.imageUrl, p.image_url) || hashPick(name),
      rank: Number(p.rank ?? p.score ?? p.rating ?? 0) || 0,
      buyNet: prices.buyNet,
      priceRetail: prices.priceRetail,
      priceB2B: prices.priceB2B,
      compareAt,
      discountPct,
      explicitPromo: isPromoExplicit,
      explicitNew: isNewExplicit,
      explicitHit: isHitExplicit,
      badges: []
    };
  };

  const enrichProducts = (products) => {
    const sorted = products.slice().sort((a, b) => (b.rank || 0) - (a.rank || 0) || (b.discountPct || 0) - (a.discountPct || 0) || a.name.localeCompare(b.name, "pl"));
    const hitIds = new Set(sorted.slice(0, Math.max(3, Math.ceil(sorted.length * 0.12))).map((p) => p.id));
    const newIds = new Set(sorted.filter((p) => p.explicitNew).map((p) => p.id));
    const fallbackNew = sorted.slice().sort((a, b) => b.id.localeCompare(a.id, "pl")).slice(0, Math.max(2, Math.ceil(sorted.length * 0.08))).map((p) => p.id);
    fallbackNew.forEach((id) => newIds.add(id));

    return products.map((p) => {
      const badges = [];
      const isPromo = p.explicitPromo || p.discountPct >= 5 || (p.compareAt > p.priceRetail && p.priceRetail > 0);
      const isHit = p.explicitHit || hitIds.has(p.id) || p.rank >= 80;
      const isNew = p.explicitNew || newIds.has(p.id);
      if (isHit) badges.push({ type: "hit", label: "HIT" });
      if (isNew) badges.push({ type: "new", label: "NOWOŚĆ" });
      if (isPromo) badges.push({ type: "promo", label: p.discountPct >= 5 ? `PROMOCJA -${p.discountPct}%` : "PROMOCJA" });
      return { ...p, badges: badges.slice(0, 3), isPromo, isHit, isNew };
    });
  };

  const loadProducts = async () => {
    const bySupplier = readJSON(LS_PRODUCTS_BY_SUPPLIER, null);
    let out = [];
    if (bySupplier && typeof bySupplier === "object") {
      Object.keys(bySupplier).forEach((supName) => {
        (Array.isArray(bySupplier[supName]) ? bySupplier[supName] : []).forEach((p) => out.push(normalizeProduct({ ...p, supplier: p.supplier || supName })));
      });
    }
    if (!out.length) {
      try {
        const res = await fetch(FALLBACK_JSON, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const arr = Array.isArray(json) ? json : Array.isArray(json.products) ? json.products : [];
        out = arr.map(normalizeProduct);
      } catch (e) {
        console.warn("Fallback products.json load failed:", e);
        out = [];
      }
    }
    const map = new Map();
    out.forEach((p) => {
      const key = `${String(p.id)}__${String(p.supplier || "")}`;
      if (!map.has(key)) map.set(key, p);
    });
    return enrichProducts(Array.from(map.values()));
  };

  const setActive = (btnOn, btnOff) => { btnOn?.classList.add("active"); btnOff?.classList.remove("active"); };
  const normalizeMode = (mode) => { const m = String(mode || "").toLowerCase(); return m === "b2b" || m === "hurt" ? "b2b" : "retail"; };
  const priceForMode = (p) => { const mode = normalizeMode(Cart.getMode()); const v = mode === "b2b" ? (p.priceB2B || p.priceRetail) : p.priceRetail; return isFinite(Number(v)) ? Number(v) : 0; };
  const thresholdForMode = () => normalizeMode(Cart.getMode()) === "b2b" ? FREE_SHIPPING_B2B : FREE_SHIPPING_RETAIL;

  const bindModeButtons = () => {
    const bRetail = $("#modeRetail");
    const bB2B = $("#modeB2B");
    const sync = () => {
      const mode = normalizeMode(Cart.getMode());
      if (mode === "b2b") setActive(bB2B, bRetail); else setActive(bRetail, bB2B);
      const kpiMode = $("#kpiMode");
      if (kpiMode) kpiMode.textContent = mode === "b2b" ? "HURT (B2B)" : "DETAL";
    };
    bRetail?.addEventListener("click", () => { Cart.setMode("retail"); sync(); renderAll(); });
    bB2B?.addEventListener("click", () => { Cart.setMode("b2b"); sync(); renderAll(); });
    window.addEventListener("qm:cart", sync);
    sync();
  };

  const updateCartCount = () => {
    const count = String(Cart.count());
    const el1 = $("#cartCount");
    if (el1) el1.textContent = count;
    const el2 = $("#cartCountTop");
    if (el2) el2.textContent = count;
  };

  let ALL = [];

  const buildCats = () => {
    const sel = $("#cat");
    if (!sel) return;
    const cats = Array.from(new Set(ALL.map((p) => p.category).filter(Boolean))).sort((a, b) => a.localeCompare(b, "pl"));
    sel.innerHTML = `<option value="">Wszystkie</option>` + cats.map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("");
    const k = $("#kpiCats");
    if (k) k.textContent = String(cats.length);
  };

  const ensureDynamicSections = () => {
    if (!$("#grid") || $("#qmUpsellStack")) return;
    const grid = $("#grid");
    const host = grid.parentElement || grid;
    host.insertAdjacentHTML("beforebegin", `
      <div id="qmUpsellStack" class="qm-stack">
        <section id="salesBoostSection" class="card soft qm-sales"></section>
        <section id="bestsellersSection" class="card soft qm-section"></section>
        <section id="premiumSuppliersSection" class="card soft qm-section"></section>
      </div>
    `);

    if (!$("#qmStickyCart")) {
      document.body.insertAdjacentHTML("beforeend", `
        <div id="qmStickyCart" class="qm-sticky-cart">
          <div class="qm-sticky-cart__meta">
            <strong id="qmStickyCartCount">0 produktów</strong>
            <span id="qmStickyCartTotal">0,00 zł</span>
          </div>
          <a id="qmStickyCartLink" class="btn btn-primary" href="${escapeHtml(withStore("./koszyk.html"))}">Przejdź do koszyka</a>
        </div>
      `);
    }
  };

  const badgesHtml = (badges) => {
    if (!badges || !badges.length) return "";
    return `<div class="p-badges">${badges.map((b) => `<span class="p-badge p-badge--${escapeHtml(b.type)}">${escapeHtml(b.label)}</span>`).join("")}</div>`;
  };

  const oldPriceHtml = (p, currentPrice) => {
    if (!(p.compareAt > currentPrice && currentPrice > 0)) return "";
    return `<span class="p-old-price">${money(p.compareAt)}</span>`;
  };

  const createCardHtml = (p, opts = {}) => {
    const mode = normalizeMode(Cart.getMode());
    const price = priceForMode(p);
    const moq = Number(p.moq || 1) || 1;
    const sub = [
      p.category ? escapeHtml(p.category) : null,
      p.supplier ? `Hurt.: ${escapeHtml(p.supplier)}` : null,
      mode === "b2b" ? `MOQ: ${moq} ${escapeHtml(p.unit)}` : `Jedn.: ${escapeHtml(p.unit)}`
    ].filter(Boolean).join(" • ");
    const compactClass = opts.compact ? " p-card--compact" : "";
    const ctaText = opts.ctaText || "Dodaj";
    const note = p.isPromo ? `<div class="p-note">Tania oferta do szybkiego obrotu</div>` : p.isHit ? `<div class="p-note">Produkt z potencjałem na szybkie zamówienia</div>` : p.isNew ? `<div class="p-note">Świeży produkt do testów sprzedaży</div>` : "";

    return `
      <article class="p-card${compactClass}">
        <div class="p-media">
          ${badgesHtml(p.badges)}
          <img class="p-img" src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}" loading="lazy" onerror="this.onerror=null;this.src='${hashPick(p.name)}';"/>
        </div>
        <div class="p-body">
          <p class="p-title">${escapeHtml(p.name)}</p>
          <div class="p-meta">${sub}</div>
          <div class="p-price">
            <div>
              <strong>${money(price)}</strong>
              ${oldPriceHtml(p, price)}
            </div>
            <span>${mode === "b2b" ? "netto (B2B)" : "brutto (detal)"}</span>
          </div>
          ${note}
          <div class="p-actions">
            <button class="btn btn-sm btn-primary" data-add="${escapeHtml(p.id)}">${escapeHtml(ctaText)}</button>
            <a class="btn btn-sm" href="${escapeHtml(withStore("./koszyk.html"))}">Koszyk</a>
          </div>
        </div>
      </article>
    `;
  };

  const bindAddButtons = (root = document) => {
    $$('[data-add]', root).forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-add');
        const p = ALL.find((x) => String(x.id) === String(id));
        if (!p) return;
        Cart.upsert(p, 1);
        updateCartCount();
        syncStoreLinks();
      });
    });
  };

  const getFilteredList = () => {
    const q = safeStr($("#q")?.value).toLowerCase();
    const cat = safeStr($("#cat")?.value);
    const sort = safeStr($("#sort")?.value);
    let list = ALL.slice();
    if (q) list = list.filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || (p.category || "").toLowerCase().includes(q) || (p.supplier || "").toLowerCase().includes(q));
    if (cat) list = list.filter((p) => p.category === cat);
    if (sort === "rank_desc") list.sort((a, b) => (b.rank || 0) - (a.rank || 0));
    if (sort === "price_asc") list.sort((a, b) => priceForMode(a) - priceForMode(b));
    if (sort === "price_desc") list.sort((a, b) => priceForMode(b) - priceForMode(a));
    if (sort === "name_asc") list.sort((a, b) => a.name.localeCompare(b.name, "pl"));
    return list;
  };

  const renderGrid = () => {
    const grid = $("#grid");
    const empty = $("#empty");
    if (!grid) return;
    const list = getFilteredList();
    const kpiProducts = $("#kpiProducts");
    if (kpiProducts) kpiProducts.textContent = String(list.length);
    if (!list.length) {
      grid.innerHTML = "";
      if (empty) empty.style.display = "";
      return;
    }
    if (empty) empty.style.display = "none";
    grid.innerHTML = list.map((p) => createCardHtml(p)).join("");
    bindAddButtons(grid);
  };

  const getTopProducts = () => {
    return ALL.slice().sort((a, b) => {
      const aScore = (a.rank || 0) + (a.isHit ? 20 : 0) + (a.discountPct || 0) + ((a.priceRetail > 0 && a.priceRetail < 50) ? 6 : 0);
      const bScore = (b.rank || 0) + (b.isHit ? 20 : 0) + (b.discountPct || 0) + ((b.priceRetail > 0 && b.priceRetail < 50) ? 6 : 0);
      return bScore - aScore;
    }).slice(0, 8);
  };

  const renderTopProducts = () => {
    const box = $("#bestsellersSection");
    if (!box) return;
    const top = getTopProducts();
    if (!top.length) {
      box.style.display = "none";
      return;
    }
    box.style.display = "";
    box.innerHTML = `
      <div class="qm-section__head">
        <div>
          <div class="qm-section__eyebrow">TOP PRODUKTY</div>
          <h2 class="qm-section__title">Bestsellery do szybkiego obrotu</h2>
          <p class="qm-section__text">Produkty z największym potencjałem klików i szybszym wejściem w sprzedaż.</p>
        </div>
      </div>
      <div class="qm-top-grid">${top.map((p) => createCardHtml(p, { compact: true, ctaText: "Dodaj" })).join("")}</div>
    `;
    bindAddButtons(box);
  };

  const getSupplierStats = () => {
    const map = new Map();
    ALL.forEach((p) => {
      const key = safeStr(p.supplier) || "Bez nazwy";
      if (!map.has(key)) map.set(key, { name: key, products: 0, cats: new Set(), hits: 0, promos: 0, avgRankSum: 0, minPrice: Infinity });
      const item = map.get(key);
      item.products += 1;
      if (p.category) item.cats.add(p.category);
      if (p.isHit) item.hits += 1;
      if (p.isPromo) item.promos += 1;
      item.avgRankSum += Number(p.rank || 0);
      const pr = priceForMode(p);
      if (pr > 0) item.minPrice = Math.min(item.minPrice, pr);
    });
    return Array.from(map.values()).map((s) => ({
      ...s,
      avgRank: s.products ? s.avgRankSum / s.products : 0,
      score: (s.hits * 8) + (s.promos * 5) + (s.products * 2) + (s.cats.size * 3) + (s.avgRank * 0.3)
    })).sort((a, b) => b.score - a.score).slice(0, 6);
  };

  const renderPremiumSuppliers = () => {
    const box = $("#premiumSuppliersSection");
    if (!box) return;
    const stats = getSupplierStats();
    if (!stats.length) {
      box.style.display = "none";
      return;
    }
    box.style.display = "";
    box.innerHTML = `
      <div class="qm-section__head">
        <div>
          <div class="qm-section__eyebrow">HURTOWNIE PREMIUM</div>
          <h2 class="qm-section__title">Najmocniejsi dostawcy w tym sklepie</h2>
          <p class="qm-section__text">Wyróżnieni dostawcy z największą liczbą produktów, kategorii i ofert do szybkiego testu.</p>
        </div>
      </div>
      <div class="qm-supplier-grid">
        ${stats.map((s) => `
          <article class="qm-supplier-card">
            <div class="qm-supplier-card__top">
              <span class="qm-supplier-card__badge">PREMIUM</span>
              <strong>${escapeHtml(s.name)}</strong>
            </div>
            <div class="qm-supplier-card__meta">
              <span>${s.products} produktów</span>
              <span>${s.cats.size} kategorii</span>
              <span>${s.hits} hitów</span>
            </div>
            <div class="qm-supplier-card__footer">
              <span>Od ${isFinite(s.minPrice) ? money(s.minPrice) : "—"}</span>
              <span>Score ${Math.round(s.score)}</span>
            </div>
          </article>
        `).join("")}
      </div>
    `;
  };

  const renderSalesBoosters = () => {
    const box = $("#salesBoostSection");
    if (!box) return;
    const mode = normalizeMode(Cart.getMode());
    const totals = typeof Cart.totals === "function" ? Cart.totals() : { gross: 0, items: 0 };
    const threshold = thresholdForMode();
    const value = Number(totals.gross || 0) || 0;
    const left = Math.max(0, threshold - value);
    const progress = Math.max(0, Math.min(100, threshold ? Math.round((value / threshold) * 100) : 0));
    const top = getTopProducts().slice(0, 3);
    const premiumCount = getSupplierStats().length;

    box.innerHTML = `
      <div class="qm-sales__head">
        <div>
          <div class="qm-section__eyebrow">MECHANIZMY SPRZEDAŻY</div>
          <h2 class="qm-section__title">Bloki, które podnoszą konwersję</h2>
        </div>
        <div class="qm-chip-row">
          <span class="qm-chip">${mode === "b2b" ? "Tryb hurtowy" : "Tryb detaliczny"}</span>
          <span class="qm-chip">${premiumCount} hurtowni premium</span>
          <span class="qm-chip">${ALL.filter((p) => p.isPromo).length} promocji</span>
        </div>
      </div>
      <div class="qm-sales-grid">
        <div class="qm-sales-card">
          <strong>Darmowa dostawa / większy koszyk</strong>
          <p>${left > 0 ? `Brakuje ${money(left)} do progu ${money(threshold)}.` : `Próg ${money(threshold)} został osiągnięty.`}</p>
          <div class="qm-progress"><span style="width:${progress}%"></span></div>
        </div>
        <div class="qm-sales-card">
          <strong>Najlepsze sztuki do startu</strong>
          <p>${top.map((p) => escapeHtml(p.name)).join(" • ") || "Dodaj produkty z rankiem, żeby sekcja się wypełniła."}</p>
        </div>
        <div class="qm-sales-card">
          <strong>Strategia szybkiego obrotu</strong>
          <p>Promuj najpierw HIT + PROMOCJA, a NOWOŚCI testuj małym ruchem z telefonu i z reklam bez dużego budżetu.</p>
        </div>
      </div>
    `;
  };

  const renderStickyCart = () => {
    const bar = $("#qmStickyCart");
    if (!bar) return;
    const totals = typeof Cart.totals === "function" ? Cart.totals() : { gross: 0 };
    const count = Number(Cart.count() || 0);
    const countEl = $("#qmStickyCartCount");
    const totalEl = $("#qmStickyCartTotal");
    const linkEl = $("#qmStickyCartLink");
    if (countEl) countEl.textContent = `${count} ${count === 1 ? "produkt" : (count >= 2 && count <= 4 ? "produkty" : "produktów")}`;
    if (totalEl) totalEl.textContent = money(Number(totals.gross || 0) || 0);
    if (linkEl) linkEl.setAttribute("href", withStore("./koszyk.html"));
    bar.classList.toggle("is-visible", count > 0);
  };

  const renderCart = () => {
    const list = $("#cartList");
    const empty = $("#cartEmpty");
    if (!list) return;
    const cart = Cart.read();
    if (!cart.items.length) {
      list.innerHTML = "";
      if (empty) empty.style.display = "";
    } else {
      if (empty) empty.style.display = "none";
      const mode = normalizeMode(Cart.getMode());
      list.innerHTML = cart.items.map((it) => {
        const price = mode === "b2b" ? Number(it.priceB2B || 0) || Number(it.priceRetail || 0) || 0 : Number(it.priceRetail || 0) || 0;
        const qty = Number(it.qty || 0) || 0;
        const line = price * qty;
        const moq = Number(it.moq || 1) || 1;
        const moqWarn = mode === "b2b" && qty < moq ? `<div class="muted-xs" style="color:rgba(245,158,11,.95);font-weight:900;margin-top:6px;">Za mało: MOQ ${moq} ${escapeHtml(it.unit || "szt")}</div>` : "";
        return `<div class="card"><div class="cart-row"><img class="cart-thumb" src="${escapeHtml(it.image || hashPick(it.name))}" alt="" loading="lazy" onerror="this.onerror=null;this.src='${hashPick(it.name)}';"/><div><div style="font-weight:900">${escapeHtml(it.name || "Produkt")}</div><div class="muted-xs">${escapeHtml(it.category || "")}${it.supplier ? " • Hurt.: " + escapeHtml(it.supplier) : ""}</div>${moqWarn}</div><div style="text-align:right"><div class="muted-xs">Cena</div><div style="font-weight:900">${money(price)}</div><div class="muted-xs">Suma: <span style="font-weight:900">${money(line)}</span></div></div><div class="qty"><button class="btn btn-sm" data-dec="${escapeHtml(it.id)}">−</button><input data-qty="${escapeHtml(it.id)}" value="${escapeHtml(qty)}" inputmode="numeric" /><button class="btn btn-sm" data-inc="${escapeHtml(it.id)}">+</button></div></div></div>`;
      }).join("");
      $$('[data-inc]', list).forEach((b) => b.addEventListener('click', () => { const id = b.getAttribute('data-inc'); const it = Cart.read().items.find((x) => String(x.id) === String(id)); if (!it) return; Cart.setQty(id, (Number(it.qty || 0) || 0) + 1); }));
      $$('[data-dec]', list).forEach((b) => b.addEventListener('click', () => { const id = b.getAttribute('data-dec'); const it = Cart.read().items.find((x) => String(x.id) === String(id)); if (!it) return; Cart.setQty(id, (Number(it.qty || 0) || 0) - 1); }));
      $$('[data-qty]', list).forEach((inp) => inp.addEventListener('change', () => Cart.setQty(inp.getAttribute('data-qty'), inp.value)));
    }
    const t = Cart.totals();
    const sumItems = $("#sumItems"), sumNet = $("#sumNet"), sumVat = $("#sumVat"), sumGross = $("#sumGross"), mw = $("#moqWarn");
    if (sumItems) sumItems.textContent = String(t.items);
    if (sumNet) sumNet.textContent = money(t.net);
    if (sumVat) sumVat.textContent = money(t.vat);
    if (sumGross) sumGross.textContent = money(t.gross);
    if (mw) mw.style.display = t.mode === "b2b" && !t.moqOk ? "" : "none";
  };

  const bindCartPage = () => {
    $("#clearCart")?.addEventListener("click", () => Cart.clear());
    const disc = $("#b2bDiscount");
    if (disc) {
      disc.value = String(Cart.getDiscount() || "");
      disc.addEventListener("input", () => { Cart.setDiscount(disc.value); renderCart(); });
    }
    const note = $("#orderNote");
    if (note) {
      note.value = Cart.getNote();
      note.addEventListener("input", () => Cart.setNote(note.value));
    }
    const prof = Cart.getB2BProfile();
    if ($("#companyName")) $("#companyName").value = prof.companyName || "";
    if ($("#companyNip")) $("#companyNip").value = prof.nip || "";
    if ($("#companyAddr")) $("#companyAddr").value = prof.addr || "";
    if ($("#companyContact")) $("#companyContact").value = prof.contact || "";
    const persistProfile = () => Cart.setB2BProfile({ companyName: $("#companyName")?.value || "", nip: $("#companyNip")?.value || "", addr: $("#companyAddr")?.value || "", contact: $("#companyContact")?.value || "" });
    ["companyName", "companyNip", "companyAddr", "companyContact"].forEach((id) => $("#" + id)?.addEventListener("input", persistProfile));
  };

  const renderAll = () => {
    applyStoreVisuals();
    updateCartCount();
    renderGrid();
    renderTopProducts();
    renderPremiumSuppliers();
    renderSalesBoosters();
    renderStickyCart();
    renderCart();
    syncStoreLinks();
  };

  const boot = async () => {
    applyStoreVisuals();
    bindModeButtons();
    updateCartCount();
    syncStoreLinks();
    if ($("#cartList")) bindCartPage();
    if ($("#grid")) {
      ensureDynamicSections();
      ALL = await loadProducts();
      buildCats();
      $("#q")?.addEventListener("input", () => { renderGrid(); syncStoreLinks(); });
      $("#cat")?.addEventListener("change", () => { renderGrid(); syncStoreLinks(); });
      $("#sort")?.addEventListener("change", () => { renderGrid(); syncStoreLinks(); });
      renderGrid();
      renderTopProducts();
      renderPremiumSuppliers();
      renderSalesBoosters();
      renderStickyCart();
      syncStoreLinks();
    }
    window.addEventListener("qm:cart", () => {
      updateCartCount();
      renderGrid();
      renderTopProducts();
      renderPremiumSuppliers();
      renderSalesBoosters();
      renderStickyCart();
      renderCart();
      syncStoreLinks();
    });
    window.addEventListener("qm:store", async () => {
      applyStoreVisuals();
      syncStoreLinks();
      if ($("#grid")) {
        ALL = await loadProducts();
        buildCats();
        renderGrid();
        renderTopProducts();
        renderPremiumSuppliers();
        renderSalesBoosters();
        renderStickyCart();
      }
      renderCart();
      updateCartCount();
      syncStoreLinks();
    });
    renderAll();
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
