(() => {
  "use strict";

  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

  const { Cart, money } = window.QM_SHOP;

  // ===== multi-store (URL -> aktywny sklep -> marża) =====
  // Przechowujemy sklepy w localStorage jako mapa:
  // qm_stores_v1: { "bar-u-szefa": { marginPct: 0.12, title:"Bar u Szefa", theme:"default" }, ... }
  // aktywny: qm_active_store_v1 = "bar-u-szefa"
  // marża runtime dla pricing.js: qm_store_margin_pct = "0.12"
  const LS_STORES = "qm_stores_v1";
  const LS_ACTIVE = "qm_active_store_v1";
  const LS_STORE_MARGIN = "qm_store_margin_pct";

  const safeStr = (v) => String(v ?? "").trim();

  const slugify = (s) => String(s || "")
    .trim()
    .toLowerCase()
    .replace(/[ąćęłńóśźż]/g, (m) => ({ "ą":"a","ć":"c","ę":"e","ł":"l","ń":"n","ó":"o","ś":"s","ź":"z","ż":"z" }[m] || m))
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  const readJSON = (k, fallback) => {
    try { return JSON.parse(localStorage.getItem(k) || ""); } catch { return fallback; }
  };
  const writeJSON = (k, v) => localStorage.setItem(k, JSON.stringify(v));

  const getStoreFromPanelFallback = () => {
    // kompatybilność z panel-sklepu.html (jeśli zapisał qm_store_slug)
    const slug = slugify(localStorage.getItem("qm_store_slug") || "");
    let raw = String(localStorage.getItem("qm_store_margin_pct") || "").trim(); // może być "0.12"
    let n = Number(raw.replace(",", "."));
    if (!isFinite(n) || n < 0) n = 0;
    if (n > 1) n = n / 100;
    n = Math.max(0, Math.min(1, n));
    return { slug, marginPct: n };
  };

  const ensureStoreRegistry = () => {
    // jeśli user użył panelu i nie ma rejestru sklepów, tworzymy wpis
    const reg = readJSON(LS_STORES, {});
    const { slug, marginPct } = getStoreFromPanelFallback();
    if (slug && !reg[slug]) {
      reg[slug] = { marginPct, title: slug.replaceAll("-", " "), theme: "default" };
      writeJSON(LS_STORES, reg);
    }
  };

  const setActiveStore = (slug) => {
    const s = slugify(slug);
    if (!s) return;

    ensureStoreRegistry();
    const reg = readJSON(LS_STORES, {});
    const entry = reg[s];

    // jeśli nie znamy sklepu w rejestrze — tworzymy go “w locie” (MVP)
    if (!entry) {
      reg[s] = { marginPct: 0, title: s.replaceAll("-", " "), theme: "default" };
      writeJSON(LS_STORES, reg);
    }

    localStorage.setItem(LS_ACTIVE, s);

    const finalReg = readJSON(LS_STORES, {});
    const margin = Number(finalReg[s]?.marginPct || 0) || 0;
    localStorage.setItem(LS_STORE_MARGIN, String(Math.max(0, Math.min(1, margin))));

    // odśwież ceny (pricing.js czyta qm_store_margin_pct)
    window.dispatchEvent(new CustomEvent("qm:store", { detail: { slug: s, marginPct: margin } }));
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
    // brak parametru -> jeśli jest aktywny store, zostaje
    ensureStoreRegistry();
    const active = slugify(localStorage.getItem(LS_ACTIVE) || "");
    if (active) {
      const reg = readJSON(LS_STORES, {});
      const margin = Number(reg[active]?.marginPct || 0) || 0;
      localStorage.setItem(LS_STORE_MARGIN, String(Math.max(0, Math.min(1, margin))));
    }
  };

  applyStoreFromUrl();

  // ===== marża/config z window (wstrzyknięte w sklep.html) =====
  const PR = (window.QM_PRICE && window.QM_PRICE.priceFromBuy) ? window.QM_PRICE : null;
  const CFG = (window.QM_CONFIG && window.QM_CONFIG.pricing) ? window.QM_CONFIG : null;

  const getPricingRules = () => {
    return (CFG && CFG.pricing) ? CFG.pricing : {
      retailPct: 0.08,
      wholesalePct: 0.05,
      minProfit: 1.5,
      retailEnds99: true
    };
  };

  // ===== produkty: z importu CSV (LS) + fallback products.json =====
  const LS_PRODUCTS_BY_SUPPLIER = "qm_products_by_supplier_v1";
  const FALLBACK_JSON = "/products.json";

  const readLS = (k, fallback) => {
    try { return JSON.parse(localStorage.getItem(k) || ""); } catch { return fallback; }
  };

  const hashPick = (s) => {
    const x = safeStr(s);
    let h = 0;
    for (let i=0;i<x.length;i++) h = ((h<<5)-h) + x.charCodeAt(i);
    const n = Math.abs(h) % 4;
    return ["/produkt_1.png","/produkt_3.png","/produkt_4.png","/produkt_5.png"][n];
  };

  // ===== helpers ceny zakupu =====
  const num = (v) => {
    const n = Number(String(v ?? "").replace(",", "."));
    return isFinite(n) ? n : 0;
  };

  // ✅ FIX: Twoje dane z hurtowni mają "price_net" — wcześniej nie było w ogóle obsługiwane
  const pickBuyNet = (p) => {
    const candidates = [
      // koszt/zakup
      p.buyNet, p.buy, p.costNet, p.cost, p.purchaseNet, p.purchase,
      // popularne nazwy netto
      p.netto, p.cenaNetto, p.priceNet, p.net, p.wholesaleNet,
      // ✅ snake_case / exporty CSV
      p.price_net, p.cena_netto, p.net_price, p.wholesale_net
    ];
    for (const c of candidates) {
      const n = num(c);
      if (n > 0) return n;
    }
    return 0;
  };

  const pickFallbackRetail = (p) => {
    const candidates = [
      p.priceRetail, p.price, p.cena, p.brutto, p.priceGross, p.gross,
      // ✅ jeśli ktoś wrzuci tylko netto, niech retail też coś pokaże (awaryjnie)
      p.price_net, p.netto, p.net
    ];
    for (const c of candidates) {
      const n = num(c);
      if (n > 0) return n;
    }
    return 0;
  };

  const pickFallbackB2B = (p) => {
    const candidates = [
      p.priceB2B, p.priceWholesale, p.hurt, p.wholesale, p.b2b, p.b2bPrice,
      // ✅ typowo hurtownie dają tylko netto
      p.price_net, p.netto, p.net
    ];
    for (const c of candidates) {
      const n = num(c);
      if (n > 0) return n;
    }
    return 0;
  };

  const computePrices = (buyNet, fallbackRetail, fallbackB2B) => {
    const rules = getPricingRules();

    if (buyNet > 0 && PR && typeof PR.priceFromBuy === "function") {
      const retail = PR.priceFromBuy(buyNet, "detal", rules);
      const b2b = PR.priceFromBuy(buyNet, "hurt", rules);
      return { priceRetail: retail, priceB2B: b2b, buyNet };
    }

    const pr = fallbackRetail > 0 ? fallbackRetail : 0;
    const pb = fallbackB2B > 0 ? fallbackB2B : (pr > 0 ? pr : 0);
    return { priceRetail: pr, priceB2B: pb, buyNet: buyNet || 0 };
  };

  const normalizeProduct = (p) => {
    const name = p.name || p.nazwa || p.title || "Produkt";
    const id = p.id || p.sku || p.ean || name;
    const category = p.category || p.kategoria || p.cat || "";
    const supplier = p.supplier || p.hurtownia || p.vendor || "";

    const unit = p.unit || p.jm || p.jednostka || "szt";
    const moq = Number(p.moq ?? p.min ?? p.minimum ?? 1) || 1;

    const image = p.image || p.img || p.photo || hashPick(name);
    const rank = Number(p.rank ?? p.score ?? p.rating ?? 0) || 0;

    const buyNet = pickBuyNet(p);
    const fallbackRetail = pickFallbackRetail(p);
    const fallbackB2B = pickFallbackB2B(p);
    const prices = computePrices(buyNet, fallbackRetail, fallbackB2B);

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
    const bySupplier = readLS(LS_PRODUCTS_BY_SUPPLIER, null);
    let out = [];

    if (bySupplier && typeof bySupplier === "object") {
      for (const supName of Object.keys(bySupplier)) {
        const arr = Array.isArray(bySupplier[supName]) ? bySupplier[supName] : [];
        for (const p of arr) out.push(normalizeProduct({ ...p, supplier: p.supplier || supName }));
      }
    }

    if (!out.length) {
      try {
        const res = await fetch(FALLBACK_JSON, { cache:"no-store" });
        const json = await res.json();
        const arr = Array.isArray(json) ? json : (Array.isArray(json.products) ? json.products : []);
        out = arr.map(normalizeProduct);
      } catch {
        out = [];
      }
    }

    const map = new Map();
    for (const p of out) map.set(String(p.id), p);
    return Array.from(map.values());
  };

  const setActive = (btnOn, btnOff) => {
    btnOn?.classList.add("active");
    btnOff?.classList.remove("active");
  };

  const bindModeButtons = () => {
    const bRetail = $("#modeRetail");
    const bB2B = $("#modeB2B");

    const sync = () => {
      const mode = Cart.getMode();
      if (mode === "b2b") setActive(bB2B, bRetail);
      else setActive(bRetail, bB2B);

      const kpiMode = $("#kpiMode");
      if (kpiMode) kpiMode.textContent = (mode === "b2b" ? "HURT (B2B)" : "DETAL");
    };

    bRetail?.addEventListener("click", () => { Cart.setMode("retail"); sync(); renderAll(); });
    bB2B?.addEventListener("click", () => { Cart.setMode("b2b"); sync(); renderAll(); });

    window.addEventListener("qm:cart", sync);
    sync();
  };

  const updateCartCount = () => {
    const el = $("#cartCount");
    if (el) el.textContent = String(Cart.count());
  };

  // ===== sklep view =====
  let ALL = [];

  const escapeHtml = (s) =>
    String(s).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");

  const buildCats = () => {
    const sel = $("#cat");
    if (!sel) return;
    const cats = Array.from(new Set(ALL.map(p => p.category).filter(Boolean))).sort((a,b)=>a.localeCompare(b,"pl"));
    sel.innerHTML = `<option value="">Wszystkie</option>` + cats.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("");
    const k = $("#kpiCats");
    if (k) k.textContent = String(cats.length);
  };

  const priceForMode = (p) => (Cart.getMode() === "b2b" ? (p.priceB2B || p.priceRetail) : p.priceRetail);

  const renderGrid = () => {
    const grid = $("#grid");
    const empty = $("#empty");
    if (!grid) return;

    const q = safeStr($("#q")?.value).toLowerCase();
    const cat = safeStr($("#cat")?.value);
    const sort = safeStr($("#sort")?.value);

    let list = ALL.slice();

    if (q) {
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.category||"").toLowerCase().includes(q) ||
        (p.supplier||"").toLowerCase().includes(q)
      );
    }
    if (cat) list = list.filter(p => p.category === cat);

    const mode = Cart.getMode();
    if (sort === "rank_desc") list.sort((a,b)=> (b.rank||0)-(a.rank||0));
    if (sort === "price_asc") list.sort((a,b)=> priceForMode(a)-priceForMode(b));
    if (sort === "price_desc") list.sort((a,b)=> priceForMode(b)-priceForMode(a));
    if (sort === "name_asc") list.sort((a,b)=> a.name.localeCompare(b.name,"pl"));

    $("#kpiProducts") && ($("#kpiProducts").textContent = String(list.length));

    if (!list.length) {
      grid.innerHTML = "";
      if (empty) empty.style.display = "";
      return;
    }
    if (empty) empty.style.display = "none";

    grid.innerHTML = list.map(p => {
      const price = priceForMode(p);
      const moq = Number(p.moq || 1) || 1;
      const moqTxt = (mode === "b2b") ? `MOQ: ${moq} ${escapeHtml(p.unit)}` : `Jedn.: ${escapeHtml(p.unit)}`;

      const sub = [
        p.category ? escapeHtml(p.category) : null,
        p.supplier ? `Hurt.: ${escapeHtml(p.supplier)}` : null,
        moqTxt
      ].filter(Boolean).join(" • ");

      return `
        <div class="p-card">
          <img class="p-img" src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}" loading="lazy"
               onerror="this.onerror=null;this.src='${hashPick(p.name)}';" />
          <div class="p-body">
            <p class="p-title">${escapeHtml(p.name)}</p>
            <div class="p-meta">${sub}</div>
            <div class="p-price">
              <strong>${money(price)}</strong>
              <span>${mode === "b2b" ? "netto (B2B)" : "brutto (detal)"}</span>
            </div>
            <div class="p-actions">
              <button class="btn btn-sm btn-primary" data-add="${escapeHtml(p.id)}">Dodaj</button>
              <a class="btn btn-sm" href="./koszyk.html">Koszyk</a>
            </div>
          </div>
        </div>
      `;
    }).join("");

    $$("[data-add]", grid).forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-add");
        const p = ALL.find(x => String(x.id) === String(id));
        if (!p) return;
        Cart.upsert(p, 1);
        updateCartCount();
      });
    });
  };

  // ===== koszyk view =====
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
      const mode = Cart.getMode();

      list.innerHTML = cart.items.map(it => {
        const price = (mode === "b2b"
          ? (Number(it.priceB2B||0) || Number(it.priceRetail||0) || 0)
          : (Number(it.priceRetail||0) || 0)
        );

        const line = price * (Number(it.qty||0)||0);
        const moq = Number(it.moq||1)||1;
        const moqWarn = (mode === "b2b" && (Number(it.qty||0)||0) < moq)
          ? `<div class="muted-xs" style="color:rgba(245,158,11,.95); font-weight:900; margin-top:6px;">Za mało: MOQ ${moq} ${escapeHtml(it.unit||"szt")}</div>`
          : "";

        return `
          <div class="card">
            <div class="cart-row">
              <img class="cart-thumb" src="${escapeHtml(it.image||hashPick(it.name))}" alt="" loading="lazy"
                   onerror="this.onerror=null;this.src='${hashPick(it.name)}';" />
              <div>
                <div style="font-weight:900">${escapeHtml(it.name||"Produkt")}</div>
                <div class="muted-xs">${escapeHtml(it.category||"")} ${it.supplier ? "• Hurt.: "+escapeHtml(it.supplier) : ""}</div>
                ${moqWarn}
              </div>
              <div style="text-align:right">
                <div class="muted-xs">Cena</div>
                <div style="font-weight:900">${money(price)}</div>
                <div class="muted-xs">Suma: <span style="font-weight:900">${money(line)}</span></div>
              </div>
              <div class="qty">
                <button class="btn btn-sm" data-dec="${escapeHtml(it.id)}">−</button>
                <input data-qty="${escapeHtml(it.id)}" value="${escapeHtml(it.qty)}" inputmode="numeric" />
                <button class="btn btn-sm" data-inc="${escapeHtml(it.id)}">+</button>
              </div>
            </div>
          </div>
        `;
      }).join("");

      $$("[data-inc]", list).forEach(b => b.addEventListener("click", () => {
        const id = b.getAttribute("data-inc");
        const it = Cart.read().items.find(x => String(x.id)===String(id));
        if (!it) return;
        Cart.setQty(id, (Number(it.qty||0)||0) + 1);
      }));
      $$("[data-dec]", list).forEach(b => b.addEventListener("click", () => {
        const id = b.getAttribute("data-dec");
        const it = Cart.read().items.find(x => String(x.id)===String(id));
        if (!it) return;
        Cart.setQty(id, (Number(it.qty||0)||0) - 1);
      }));
      $$("[data-qty]", list).forEach(inp => inp.addEventListener("change", () => {
        const id = inp.getAttribute("data-qty");
        Cart.setQty(id, inp.value);
      }));
    }

    const t = Cart.totals();
    $("#sumItems") && ($("#sumItems").textContent = String(t.items));
    $("#sumNet") && ($("#sumNet").textContent = money(t.net));
    $("#sumVat") && ($("#sumVat").textContent = money(t.vat));
    $("#sumGross") && ($("#sumGross").textContent = money(t.gross));
    const mw = $("#moqWarn");
    if (mw) mw.style.display = (t.mode === "b2b" && !t.moqOk) ? "" : "none";
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
    $("#companyName") && ($("#companyName").value = prof.companyName || "");
    $("#companyNip") && ($("#companyNip").value = prof.nip || "");
    $("#companyAddr") && ($("#companyAddr").value = prof.addr || "");
    $("#companyContact") && ($("#companyContact").value = prof.contact || "");

    const persistProfile = () => {
      Cart.setB2BProfile({
        companyName: $("#companyName")?.value || "",
        nip: $("#companyNip")?.value || "",
        addr: $("#companyAddr")?.value || "",
        contact: $("#companyContact")?.value || ""
      });
    };
    ["companyName","companyNip","companyAddr","companyContact"].forEach(id => {
      $("#"+id)?.addEventListener("input", persistProfile);
    });

    const gen = $("#generateOrder");
    const copy = $("#copyOrder");
    const out = $("#orderOut");

    const buildOrderText = () => {
      const t = Cart.totals();
      const cart = Cart.read();
      const p = Cart.getB2BProfile();
      const noteText = Cart.getNote();

      const lines = [];
      lines.push(`ZAMÓWIENIE – QualitetMarket (${t.mode === "b2b" ? "B2B" : "DETAL"})`);
      lines.push(`Sklep: ${localStorage.getItem(LS_ACTIVE) || "-"}`);
      lines.push(`Data: ${new Date().toLocaleString("pl-PL")}`);
      lines.push(``);
      if (t.mode === "b2b") {
        lines.push(`DANE FIRMY:`);
        lines.push(`- Firma: ${p.companyName || "-"}`);
        lines.push(`- NIP: ${p.nip || "-"}`);
        lines.push(`- Adres: ${p.addr || "-"}`);
        lines.push(`- Kontakt: ${p.contact || "-"}`);
        lines.push(``);
      }

      if (noteText) {
        lines.push(`NOTATKA: ${noteText}`);
        lines.push(``);
      }

      lines.push(`POZYCJE:`);
      for (const it of cart.items) {
        const price = (t.mode === "b2b" ? (Number(it.priceB2B||0) || Number(it.priceRetail||0) || 0) : (Number(it.priceRetail||0) || 0));
        lines.push(`- ${it.name} | SKU: ${it.sku || it.id} | Ilość: ${it.qty} ${it.unit || "szt"} | Cena: ${price.toFixed(2)} | Hurt.: ${it.supplier || "-"}`);
      }

      lines.push(``);
      lines.push(`PODSUMOWANIE:`);
      lines.push(`- Pozycje: ${t.items}`);
      lines.push(`- Netto: ${t.net.toFixed(2)}`);
      lines.push(`- VAT(23%): ${t.vat.toFixed(2)}`);
      lines.push(`- Brutto: ${t.gross.toFixed(2)}`);

      if (t.mode === "b2b" && !t.moqOk) {
        lines.push(``);
        lines.push(`UWAGA: Są pozycje poniżej MOQ – popraw ilości przed wysłaniem.`);
      }

      return lines.join("\n");
    };

    gen?.addEventListener("click", () => { if (out) out.value = buildOrderText(); });
    copy?.addEventListener("click", async () => {
      if (!out) return;
      if (!out.value) out.value = buildOrderText();
      try { await navigator.clipboard.writeText(out.value); } catch {}
    });
  };

  const renderAll = () => {
    updateCartCount();
    renderGrid();
    renderCart();
  };

  const boot = async () => {
    bindModeButtons();
    updateCartCount();

    if ($("#cartList")) bindCartPage();

    if ($("#grid")) {
      ALL = await loadProducts();
      buildCats();

      $("#q")?.addEventListener("input", renderGrid);
      $("#cat")?.addEventListener("change", renderGrid);
      $("#sort")?.addEventListener("change", renderGrid);

      renderGrid();
    }

    window.addEventListener("qm:cart", () => {
      updateCartCount();
      renderGrid();
      renderCart();
    });

    // gdy zmieni się sklep (multi-store) — przelicz ceny i odśwież grid
    window.addEventListener("qm:store", async () => {
      if ($("#grid")) {
        ALL = await loadProducts();
        buildCats();
        renderGrid();
      }
    });

    renderAll();
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
