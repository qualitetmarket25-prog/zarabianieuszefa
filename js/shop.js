// js/shop.js
// Sklep + koszyk (UI) + multi-store sync + produkty z LS/JSON + ceny z pricing.js + motywy sklepu

(() => {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  if (!window.QM_SHOP || !window.QM_SHOP.Cart || !window.QM_SHOP.money) {
    console.error("QM_SHOP / Cart / money not found");
    return;
  }

  const { Cart, money } = window.QM_SHOP;

  // ===== localStorage =====
  const LS_STORES = "qm_stores_v1";
  const LS_ACTIVE = "qm_active_store_v1";
  const LS_STORE_MARGIN = "qm_store_margin_pct";
  const LS_PRODUCTS_BY_SUPPLIER = "qm_products_by_supplier_v1";

  const FALLBACK_JSON = "./products.json";
  const FALLBACK_IMAGES = [
    "./produkt_1.png",
    "./produkt_3.png",
    "./produkt_4.png",
    "./produkt_5.png"
  ];
  const DEFAULT_LOGO = "./produkt_1.png";
  const DEFAULT_THEME = "default";
  const DEFAULT_ACCENT = "#6ee7ff";
  const DEFAULT_STORE_TITLE = "Sklep dropshipping – Gastronomia / Masarnie";

  // ===== helpers =====
  const safeStr = (v) => String(v ?? "").trim();

  const slugify = (s) =>
    String(s || "")
      .trim()
      .toLowerCase()
      .replace(/[ąćęłńóśźż]/g, (m) => ({
        "ą": "a",
        "ć": "c",
        "ę": "e",
        "ł": "l",
        "ń": "n",
        "ó": "o",
        "ś": "s",
        "ź": "z",
        "ż": "z"
      }[m] || m))
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

  const readJSON = (k, fallback) => {
    try {
      const raw = localStorage.getItem(k);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  };

  const writeJSON = (k, v) => {
    try {
      localStorage.setItem(k, JSON.stringify(v));
    } catch (e) {
      console.warn("writeJSON failed:", k, e);
    }
  };

  const clampMargin = (n) => {
    let x = Number(String(n ?? "").replace(",", "."));
    if (!isFinite(x) || x < 0) x = 0;
    if (x > 1) x = x / 100;
    return Math.max(0, Math.min(1, x));
  };

  const num = (v) => {
    if (v === null || v === undefined || v === "") return 0;

    const cleaned = String(v)
      .replace(/\s/g, "")
      .replace(/zł|pln/gi, "")
      .replace(",", ".");

    const n = Number(cleaned);
    return isFinite(n) ? n : 0;
  };

  const hashPick = (s) => {
    const x = safeStr(s);
    let h = 0;
    for (let i = 0; i < x.length; i++) h = (h << 5) - h + x.charCodeAt(i);
    return FALLBACK_IMAGES[Math.abs(h) % FALLBACK_IMAGES.length];
  };

  const escapeHtml = (s) =>
    String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");

  const pickFirstString = (...vals) => {
    for (const v of vals) {
      const x = safeStr(v);
      if (x) return x;
    }
    return "";
  };

  const pickFirstPositive = (...vals) => {
    for (const v of vals) {
      const x = num(v);
      if (x > 0) return x;
    }
    return 0;
  };

  // ===== store registry =====
  const getStoreFromPanelFallback = () => {
    const slug = slugify(localStorage.getItem("qm_store_slug") || "");
    const marginPct = clampMargin(localStorage.getItem("qm_store_margin_pct") || "");
    return { slug, marginPct };
  };

  const ensureStoreRegistry = () => {
    const reg = readJSON(LS_STORES, {});
    const { slug, marginPct } = getStoreFromPanelFallback();

    if (slug && !reg[slug]) {
      reg[slug] = {
        marginPct,
        title: slug.replaceAll("-", " "),
        theme: DEFAULT_THEME,
        accent: DEFAULT_ACCENT,
        logo: "",
        hero: ""
      };
      writeJSON(LS_STORES, reg);
    }
  };

  const getActiveStoreSlug = () => {
    try {
      const u = new URL(window.location.href);
      const fromUrl = slugify(u.searchParams.get("store") || "");
      if (fromUrl) return fromUrl;
    } catch {}

    const fromLS =
      slugify(localStorage.getItem(LS_ACTIVE) || "") ||
      slugify(localStorage.getItem("qm_store_slug") || "");

    return fromLS || "";
  };

  const getStoreConfig = (slug) => {
    const s = slugify(slug || getActiveStoreSlug());
    const reg = readJSON(LS_STORES, {});
    const raw = (s && reg && reg[s]) ? reg[s] : {};

    return {
      slug: s,
      title: safeStr(raw.title) || DEFAULT_STORE_TITLE,
      theme: safeStr(raw.theme) || DEFAULT_THEME,
      accent: safeStr(raw.accent) || DEFAULT_ACCENT,
      logo: safeStr(raw.logo) || "",
      hero: safeStr(raw.hero) || "",
      email: safeStr(raw.email) || "",
      marginPct: clampMargin(raw.marginPct || 0)
    };
  };

  const setActiveStore = (slug) => {
    const s = slugify(slug);
    if (!s) return;

    ensureStoreRegistry();

    const reg = readJSON(LS_STORES, {});
    if (!reg[s]) {
      reg[s] = {
        marginPct: 0,
        title: s.replaceAll("-", " "),
        theme: DEFAULT_THEME,
        accent: DEFAULT_ACCENT,
        logo: "",
        hero: ""
      };
      writeJSON(LS_STORES, reg);
    }

    localStorage.setItem(LS_ACTIVE, s);

    const finalReg = readJSON(LS_STORES, {});
    const entry = finalReg[s] || {};
    const margin = clampMargin(entry.marginPct || 0);
    localStorage.setItem(LS_STORE_MARGIN, String(margin));
    localStorage.setItem("qm_store_slug", s);

    window.dispatchEvent(
      new CustomEvent("qm:store", {
        detail: {
          slug: s,
          marginPct: margin,
          store: getStoreConfig(s)
        }
      })
    );
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
      const margin = clampMargin(reg[active]?.marginPct || 0);
      localStorage.setItem(LS_STORE_MARGIN, String(margin));
      localStorage.setItem("qm_store_slug", active);
    }
  };

  applyStoreFromUrl();

  const withStore = (href) => {
    const s = getActiveStoreSlug();
    if (!href || !s) return href;

    const val = String(href);

    if (
      val.startsWith("http://") ||
      val.startsWith("https://") ||
      val.startsWith("mailto:") ||
      val.startsWith("tel:") ||
      val.startsWith("#")
    ) {
      return href;
    }

    if (val.includes("store=")) return href;

    const sep = val.includes("?") ? "&" : "?";
    return `${val}${sep}store=${encodeURIComponent(s)}`;
  };

  const syncStoreLinks = () => {
    const s = getActiveStoreSlug();

    const badge = $("#activeStoreBadge");
    if (badge) badge.textContent = s ? `store: ${s}` : "store";

    document.querySelectorAll("a[href]").forEach((a) => {
      const href = a.getAttribute("href") || "";

      if (
        href.includes("koszyk.html") ||
        href.includes("zamowienia.html") ||
        href.includes("panel-sklepu.html") ||
        href.includes("sklep.html") ||
        href.includes("checkout.html")
      ) {
        a.setAttribute("href", withStore(href));
      }
    });
  };

  // ===== visual store apply =====
  const setRootVar = (name, value) => {
    if (!value) return;
    document.documentElement.style.setProperty(name, value);
  };

  const themeHeroFallback = (theme) => {
    switch (String(theme || DEFAULT_THEME)) {
      case "dark":
        return "linear-gradient(180deg,#0b1220,#050814)";
      case "light":
        return "linear-gradient(180deg,#f8fafc,#e2e8f0)";
      case "neon":
        return "radial-gradient(circle at 20% 20%, rgba(110,231,255,.35), transparent 30%), linear-gradient(180deg,#12051d,#050816)";
      case "gastro":
        return "linear-gradient(180deg,#2a1707,#120b06)";
      case "premium":
        return "linear-gradient(180deg,#1a2030,#0a0f19)";
      case "gold":
        return "linear-gradient(180deg,#332300,#120d04)";
      default:
        return "linear-gradient(180deg,#101826,#0a101a)";
    }
  };

  const applyStoreVisuals = () => {
    const store = getStoreConfig();

    // body theme class
    Array.from(document.body.classList).forEach((cls) => {
      if (cls.startsWith("theme-")) document.body.classList.remove(cls);
    });
    document.body.classList.add(`theme-${store.theme || DEFAULT_THEME}`);

    // css variables
    setRootVar("--store-accent", store.accent || DEFAULT_ACCENT);

    // title
    const titleEl = $("#storeTitle");
    if (titleEl) titleEl.textContent = store.title || DEFAULT_STORE_TITLE;
    document.title = `${store.title || DEFAULT_STORE_TITLE} – QualitetMarket`;

    // badges
    const badgeEl = $("#activeStoreBadge");
    if (badgeEl) badgeEl.textContent = store.slug ? `store: ${store.slug}` : "store";

    const themeBadgeEl = $("#storeThemeBadge");
    if (themeBadgeEl) themeBadgeEl.textContent = `theme: ${store.theme || DEFAULT_THEME}`;

    // logo
    const logoEl = $("#storeLogo");
    if (logoEl) {
      logoEl.src = store.logo || DEFAULT_LOGO;
      logoEl.onerror = function () {
        this.onerror = null;
        this.src = DEFAULT_LOGO;
      };
    }

    // hero
    const heroEl = $("#storeHero");
    if (heroEl) {
      if (store.hero) {
        heroEl.style.backgroundImage = `url("${String(store.hero).replace(/"/g, '\\"')}")`;
      } else {
        heroEl.style.backgroundImage = themeHeroFallback(store.theme);
      }
    }

    // store view cache
    window.QM_STORE_VIEW = {
      slug: store.slug,
      title: store.title,
      theme: store.theme,
      accent: store.accent,
      hero: store.hero,
      logo: store.logo
    };
  };

  // ===== pricing =====
  const PR =
    window.QM_PRICE &&
    (window.QM_PRICE.priceFromProduct || window.QM_PRICE.priceFromBuy)
      ? window.QM_PRICE
      : null;

  const CFG =
    window.QM_CONFIG && window.QM_CONFIG.pricing ? window.QM_CONFIG : null;

  const getPricingRules = () => {
    return CFG && CFG.pricing
      ? CFG.pricing
      : {
          retailPct: 0.08,
          wholesalePct: 0.05,
          minProfit: 1.5,
          retailEnds99: true
        };
  };

  const pickBuyNet = (p) =>
    pickFirstPositive(
      p.buyNet,
      p.buy,
      p.costNet,
      p.cost,
      p.purchaseNet,
      p.purchase,
      p.netto,
      p.cenaNetto,
      p.priceNet,
      p.net,
      p.wholesaleNet,
      p.price_net,
      p.cena_netto,
      p.net_price,
      p.wholesale_net
    );

  const pickFallbackRetail = (p) =>
    pickFirstPositive(
      p.priceRetail,
      p.price,
      p.cena,
      p.brutto,
      p.priceGross,
      p.gross
    );

  const pickFallbackB2B = (p) =>
    pickFirstPositive(
      p.priceB2B,
      p.priceWholesale,
      p.hurt,
      p.wholesale,
      p.b2b,
      p.b2bPrice,
      p.netto,
      p.net,
      p.price_net
    );

  const computePrices = (rawProduct, buyNet, fallbackRetail, fallbackB2B) => {
    const rules = getPricingRules();

    if (buyNet > 0 && PR && typeof PR.priceFromProduct === "function") {
      const retail = Number(PR.priceFromProduct(rawProduct, "detal", rules)) || 0;
      const b2b = Number(PR.priceFromProduct(rawProduct, "hurt", rules)) || 0;
      return { priceRetail: retail, priceB2B: b2b, buyNet };
    }

    if (buyNet > 0 && PR && typeof PR.priceFromBuy === "function") {
      const retail = Number(PR.priceFromBuy(buyNet, "detal", rules)) || 0;
      const b2b = Number(PR.priceFromBuy(buyNet, "hurt", rules)) || 0;
      return { priceRetail: retail, priceB2B: b2b, buyNet };
    }

    const pr = fallbackRetail > 0 ? fallbackRetail : 0;
    const pb = fallbackB2B > 0 ? fallbackB2B : pr;
    return { priceRetail: pr, priceB2B: pb, buyNet: buyNet || 0 };
  };

  // ===== products =====
  const normalizeProduct = (p) => {
    const name = pickFirstString(p.name, p.nazwa, p.title) || "Produkt";
    const id = pickFirstString(p.id, p.sku, p.ean, name);
    const category = pickFirstString(p.category, p.kategoria, p.cat);
    const supplier = pickFirstString(p.supplier, p.hurtownia, p.vendor, p.dostawca);
    const unit = pickFirstString(p.unit, p.jm, p.jednostka) || "szt";

    const moqRaw = Number(p.moq ?? p.min ?? p.minimum ?? 1);
    const moq = isFinite(moqRaw) && moqRaw > 0 ? moqRaw : 1;

    const image =
      pickFirstString(p.image, p.img, p.photo, p.zdjecie, p.imageUrl, p.image_url) ||
      hashPick(name);

    const rank = Number(p.rank ?? p.score ?? p.rating ?? 0) || 0;

    const buyNet = pickBuyNet(p);
    const fallbackRetail = pickFallbackRetail(p);
    const fallbackB2B = pickFallbackB2B(p);
    const prices = computePrices(p, buyNet, fallbackRetail, fallbackB2B);

    return {
      id: String(id),
      sku: String(p.sku || id),
      name: String(name),
      category: String(category),
      supplier: String(supplier),
      unit: String(unit),
      moq,
      image,
      rank,
      buyNet: prices.buyNet,
      priceRetail: prices.priceRetail,
      priceB2B: prices.priceB2B
    };
  };

  const loadProducts = async () => {
    const bySupplier = readJSON(LS_PRODUCTS_BY_SUPPLIER, null);
    let out = [];

    if (bySupplier && typeof bySupplier === "object") {
      for (const supName of Object.keys(bySupplier)) {
        const arr = Array.isArray(bySupplier[supName]) ? bySupplier[supName] : [];
        for (const p of arr) {
          out.push(normalizeProduct({ ...p, supplier: p.supplier || supName }));
        }
      }
    }

    if (!out.length) {
      try {
        const res = await fetch(FALLBACK_JSON, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const arr = Array.isArray(json)
          ? json
          : Array.isArray(json.products)
          ? json.products
          : [];
        out = arr.map(normalizeProduct);
      } catch (e) {
        console.warn("Fallback products.json load failed:", e);
        out = [];
      }
    }

    const map = new Map();
    for (const p of out) {
      const key = `${String(p.id)}__${String(p.supplier || "")}`;
      if (!map.has(key)) map.set(key, p);
    }

    return Array.from(map.values());
  };

  // ===== mode =====
  const setActive = (btnOn, btnOff) => {
    btnOn?.classList.add("active");
    btnOff?.classList.remove("active");
  };

  const normalizeMode = (mode) => {
    const m = String(mode || "").toLowerCase();
    return m === "b2b" || m === "hurt" ? "b2b" : "retail";
  };

  const bindModeButtons = () => {
    const bRetail = $("#modeRetail");
    const bB2B = $("#modeB2B");

    const sync = () => {
      const mode = normalizeMode(Cart.getMode());
      if (mode === "b2b") setActive(bB2B, bRetail);
      else setActive(bRetail, bB2B);

      const kpiMode = $("#kpiMode");
      if (kpiMode) kpiMode.textContent = mode === "b2b" ? "HURT (B2B)" : "DETAL";
    };

    bRetail?.addEventListener("click", () => {
      Cart.setMode("retail");
      sync();
      renderAll();
    });

    bB2B?.addEventListener("click", () => {
      Cart.setMode("b2b");
      sync();
      renderAll();
    });

    window.addEventListener("qm:cart", sync);
    sync();
  };

  // ===== cart count =====
  const updateCartCount = () => {
    const count = String(Cart.count());

    const el1 = $("#cartCount");
    if (el1) el1.textContent = count;

    const el2 = $("#cartCountTop");
    if (el2) el2.textContent = count;
  };

  // ===== shop =====
  let ALL = [];

  const buildCats = () => {
    const sel = $("#cat");
    if (!sel) return;

    const cats = Array.from(new Set(ALL.map((p) => p.category).filter(Boolean))).sort((a, b) =>
      a.localeCompare(b, "pl")
    );

    sel.innerHTML =
      `<option value="">Wszystkie</option>` +
      cats.map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("");

    const k = $("#kpiCats");
    if (k) k.textContent = String(cats.length);
  };

  const priceForMode = (p) => {
    const mode = normalizeMode(Cart.getMode());
    const v = mode === "b2b" ? p.priceB2B || p.priceRetail : p.priceRetail;
    return isFinite(Number(v)) ? Number(v) : 0;
  };

  const renderGrid = () => {
    const grid = $("#grid");
    const empty = $("#empty");
    if (!grid) return;

    const q = safeStr($("#q")?.value).toLowerCase();
    const cat = safeStr($("#cat")?.value);
    const sort = safeStr($("#sort")?.value);

    let list = ALL.slice();

    if (q) {
      list = list.filter((p) =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.category || "").toLowerCase().includes(q) ||
        (p.supplier || "").toLowerCase().includes(q)
      );
    }

    if (cat) list = list.filter((p) => p.category === cat);

    if (sort === "rank_desc") list.sort((a, b) => (b.rank || 0) - (a.rank || 0));
    if (sort === "price_asc") list.sort((a, b) => priceForMode(a) - priceForMode(b));
    if (sort === "price_desc") list.sort((a, b) => priceForMode(b) - priceForMode(a));
    if (sort === "name_asc") list.sort((a, b) => a.name.localeCompare(b.name, "pl"));

    const kpiProducts = $("#kpiProducts");
    if (kpiProducts) kpiProducts.textContent = String(list.length);

    if (!list.length) {
      grid.innerHTML = "";
      if (empty) empty.style.display = "";
      return;
    }

    if (empty) empty.style.display = "none";

    const mode = normalizeMode(Cart.getMode());

    grid.innerHTML = list.map((p) => {
      const price = priceForMode(p);
      const moq = Number(p.moq || 1) || 1;
      const moqTxt =
        mode === "b2b"
          ? `MOQ: ${moq} ${escapeHtml(p.unit)}`
          : `Jedn.: ${escapeHtml(p.unit)}`;

      const sub = [
        p.category ? escapeHtml(p.category) : null,
        p.supplier ? `Hurt.: ${escapeHtml(p.supplier)}` : null,
        moqTxt
      ].filter(Boolean).join(" • ");

      return `
        <div class="p-card">
          <img
            class="p-img"
            src="${escapeHtml(p.image)}"
            alt="${escapeHtml(p.name)}"
            loading="lazy"
            onerror="this.onerror=null;this.src='${hashPick(p.name)}';"
          />
          <div class="p-body">
            <p class="p-title">${escapeHtml(p.name)}</p>
            <div class="p-meta">${sub}</div>
            <div class="p-price">
              <strong>${money(price)}</strong>
              <span>${mode === "b2b" ? "netto (B2B)" : "brutto (detal)"}</span>
            </div>
            <div class="p-actions">
              <button class="btn btn-sm btn-primary" data-add="${escapeHtml(p.id)}">Dodaj</button>
              <a class="btn btn-sm" href="${withStore("./koszyk.html")}">Koszyk</a>
            </div>
          </div>
        </div>
      `;
    }).join("");

    $$("[data-add]", grid).forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-add");
        const p = ALL.find((x) => String(x.id) === String(id));
        if (!p) return;
        Cart.upsert(p, 1);
        updateCartCount();
        syncStoreLinks();
      });
    });
  };

  // ===== cart =====
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
        const price =
          mode === "b2b"
            ? Number(it.priceB2B || 0) || Number(it.priceRetail || 0) || 0
            : Number(it.priceRetail || 0) || 0;

        const qty = Number(it.qty || 0) || 0;
        const line = price * qty;
        const moq = Number(it.moq || 1) || 1;

        const moqWarn =
          mode === "b2b" && qty < moq
            ? `<div class="muted-xs" style="color:rgba(245,158,11,.95);font-weight:900;margin-top:6px;">Za mało: MOQ ${moq} ${escapeHtml(it.unit || "szt")}</div>`
            : "";

        return `
          <div class="card">
            <div class="cart-row">
              <img
                class="cart-thumb"
                src="${escapeHtml(it.image || hashPick(it.name))}"
                alt=""
                loading="lazy"
                onerror="this.onerror=null;this.src='${hashPick(it.name)}';"
              />
              <div>
                <div style="font-weight:900">${escapeHtml(it.name || "Produkt")}</div>
                <div class="muted-xs">${escapeHtml(it.category || "")}${it.supplier ? " • Hurt.: " + escapeHtml(it.supplier) : ""}</div>
                ${moqWarn}
              </div>
              <div style="text-align:right">
                <div class="muted-xs">Cena</div>
                <div style="font-weight:900">${money(price)}</div>
                <div class="muted-xs">Suma: <span style="font-weight:900">${money(line)}</span></div>
              </div>
              <div class="qty">
                <button class="btn btn-sm" data-dec="${escapeHtml(it.id)}">−</button>
                <input data-qty="${escapeHtml(it.id)}" value="${escapeHtml(qty)}" inputmode="numeric" />
                <button class="btn btn-sm" data-inc="${escapeHtml(it.id)}">+</button>
              </div>
            </div>
          </div>
        `;
      }).join("");

      $$("[data-inc]", list).forEach((b) =>
        b.addEventListener("click", () => {
          const id = b.getAttribute("data-inc");
          const it = Cart.read().items.find((x) => String(x.id) === String(id));
          if (!it) return;
          Cart.setQty(id, (Number(it.qty || 0) || 0) + 1);
        })
      );

      $$("[data-dec]", list).forEach((b) =>
        b.addEventListener("click", () => {
          const id = b.getAttribute("data-dec");
          const it = Cart.read().items.find((x) => String(x.id) === String(id));
          if (!it) return;
          Cart.setQty(id, (Number(it.qty || 0) || 0) - 1);
        })
      );

      $$("[data-qty]", list).forEach((inp) =>
        inp.addEventListener("change", () => {
          const id = inp.getAttribute("data-qty");
          Cart.setQty(id, inp.value);
        })
      );
    }

    const t = Cart.totals();

    const sumItems = $("#sumItems");
    const sumNet = $("#sumNet");
    const sumVat = $("#sumVat");
    const sumGross = $("#sumGross");
    const mw = $("#moqWarn");

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
      disc.addEventListener("input", () => {
        Cart.setDiscount(disc.value);
        renderCart();
      });
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

    const persistProfile = () => {
      Cart.setB2BProfile({
        companyName: $("#companyName")?.value || "",
        nip: $("#companyNip")?.value || "",
        addr: $("#companyAddr")?.value || "",
        contact: $("#companyContact")?.value || ""
      });
    };

    ["companyName", "companyNip", "companyAddr", "companyContact"].forEach((id) => {
      $("#" + id)?.addEventListener("input", persistProfile);
    });
  };

  // ===== render all =====
  const renderAll = () => {
    applyStoreVisuals();
    updateCartCount();
    renderGrid();
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
      ALL = await loadProducts();
      buildCats();

      $("#q")?.addEventListener("input", () => {
        renderGrid();
        syncStoreLinks();
      });

      $("#cat")?.addEventListener("change", () => {
        renderGrid();
        syncStoreLinks();
      });

      $("#sort")?.addEventListener("change", () => {
        renderGrid();
        syncStoreLinks();
      });

      renderGrid();
      syncStoreLinks();
    }

    window.addEventListener("qm:cart", () => {
      updateCartCount();
      renderGrid();
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
      }

      renderCart();
      updateCartCount();
      syncStoreLinks();
    });

    renderAll();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
