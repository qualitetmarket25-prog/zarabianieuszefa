(() => {
  "use strict";

  const VAT_RATE = 0.23;

  const LS_ORDERS = "qm_orders_v1";
  const LS_STORES = "qm_stores_v1";
  const LS_ACTIVE = "qm_active_store_v1";
  const LS_STORE_MARGIN = "qm_store_margin_pct";
  const LS_PLATFORM_PCT = "qm_platform_fee_pct";
  const LS_CHECKOUT_DRAFT = "qm_checkout_draft_v1";

  const DEFAULT_PLATFORM_FEE_PCT = 0.02;
  const DEFAULT_MIN_FEE = 2.0; // ✅ minimalna prowizja (MVP)

  const $ = (id) => document.getElementById(id);

  const readJSON = (k, fallback) => { try { return JSON.parse(localStorage.getItem(k) || ""); } catch { return fallback; } };
  const writeJSON = (k, v) => localStorage.setItem(k, JSON.stringify(v));

  const money = (n) => {
    const v = Number(n || 0);
    return v.toLocaleString("pl-PL", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " zł";
  };

  const getQueryStore = () => {
    const u = new URL(location.href);
    return (u.searchParams.get("store") || "").trim();
  };

  const resolveActiveStoreSlug = () => {
    const fromUrl = getQueryStore();
    if (fromUrl) {
      localStorage.setItem(LS_ACTIVE, fromUrl);
      return fromUrl;
    }
    const active = String(localStorage.getItem(LS_ACTIVE) || "").trim();
    return active || "default";
  };

  const syncStoreMarginFromStoresMap = (storeSlug) => {
    const stores = readJSON(LS_STORES, {});
    const st = stores?.[storeSlug];
    const marginPct = st?.marginPct;
    if (marginPct === undefined || marginPct === null) return;

    let n = Number(String(marginPct).replace("%","").replace(",", "."));
    if (!isFinite(n) || n < 0) return;
    if (n > 1) n = n / 100;
    localStorage.setItem(LS_STORE_MARGIN, String(Math.max(0, Math.min(0.8, n))));
  };

  const getPlatformPct = () => {
    const raw = String(localStorage.getItem(LS_PLATFORM_PCT) || "").trim().replace(",", ".");
    let n = Number(raw);
    if (!isFinite(n) || n < 0) n = DEFAULT_PLATFORM_FEE_PCT;
    if (n > 1) n = n / 100;
    return Math.max(0, Math.min(0.25, n));
  };

  const getStoreMarginPct = () => {
    const raw = String(localStorage.getItem(LS_STORE_MARGIN) || "").trim().replace(",", ".");
    let n = Number(raw);
    if (!isFinite(n) || n < 0) n = 0;
    if (n > 1) n = n / 100;
    return Math.max(0, Math.min(0.8, n));
  };

  const groupBySupplier = (items) => {
    const map = new Map();
    for (const it of items) {
      const sup = String(it.supplier || "BRAK_HURTOWNI").trim() || "BRAK_HURTOWNI";
      if (!map.has(sup)) map.set(sup, []);
      map.get(sup).push(it);
    }
    return map;
  };

  const priceForMode = (it, mode) => (
    mode === "b2b"
      ? (Number(it.priceB2B||0) || Number(it.priceRetail||0) || 0)
      : (Number(it.priceRetail||0) || 0)
  );

  const computeSupplierBreakdown = (items, mode) => {
    const out = [];
    const bySupplier = groupBySupplier(items);
    for (const [supplier, arr] of bySupplier.entries()) {
      let net = 0;
      let qty = 0;
      for (const it of arr) {
        const q = Number(it.qty||0) || 0;
        const p = priceForMode(it, mode);
        qty += q;
        net += q * p;
      }
      const gross = (mode === "b2b") ? net * (1 + VAT_RATE) : net;
      out.push({ supplier, items: qty, net, gross });
    }
    out.sort((a,b)=>String(a.supplier).localeCompare(String(b.supplier),"pl"));
    return out;
  };

  const renderSummary = () => {
    const { Cart } = window.QM_SHOP || {};
    if (!Cart) return;

    const t = Cart.totals();

    $("sumItems").textContent = String(t.items || 0);
    $("sumNet").textContent = money(t.net || 0);
    $("sumVat").textContent = money(t.vat || 0);
    $("sumGross").textContent = money(t.gross || 0);

    const storeSlug = resolveActiveStoreSlug();
    $("storeLabel").textContent = `Sklep: ${storeSlug}`;
    $("modeLabel").textContent = (t.mode === "b2b") ? "HURT (B2B)" : "DETAL";

    const cart = Cart.read();
    const split = computeSupplierBreakdown(cart.items || [], t.mode);

    $("splitMeta").textContent = split.length ? `Hurtownie: ${split.map(x=>x.supplier).join(", ")}` : "Brak hurtowni w koszyku.";

    $("splitTableWrap").innerHTML = split.length ? `
      <table class="miniTable">
        <thead>
          <tr><th>Hurtownia</th><th>Ilość</th><th>Netto</th><th>Brutto</th></tr>
        </thead>
        <tbody>
          ${split.map(x => `
            <tr>
              <td><strong>${x.supplier}</strong></td>
              <td>${x.items}</td>
              <td>${money(x.net)}</td>
              <td>${money(x.gross)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    ` : "";
  };

  const hydrateFromDraft = () => {
    const { Cart } = window.QM_SHOP || {};
    if (!Cart) return;

    const draft = readJSON(LS_CHECKOUT_DRAFT, null) || {};
    if (draft.note !== undefined) $("note").value = String(draft.note || "");

    const t = Cart.totals();
    const p = (draft.b2bProfile && typeof draft.b2bProfile === "object") ? draft.b2bProfile : (Cart.getB2BProfile ? Cart.getB2BProfile() : {});

    // B2B pola (można poprawić)
    $("b2bCompany").value = String(p.companyName || "");
    $("b2bNip").value = String(p.nip || "");
    $("b2bAddr").value = String(p.addr || "");
    $("b2bContact").value = String(p.contact || "");

    // jeśli detal — zostaw, ale nie przeszkadza
    if (t.mode !== "b2b") {
      // nic nie blokujemy, ale użytkownik widzi, że B2B jest opcjonalne
    }
  };

  const readShip = () => ({
    name: String($("shipName").value || "").trim(),
    phone: String($("shipPhone").value || "").trim(),
    email: String($("shipEmail").value || "").trim(),
    street: String($("shipStreet").value || "").trim(),
    city: String($("shipCity").value || "").trim(),
    zip: String($("shipZip").value || "").trim(),
    msg: String($("shipMsg").value || "").trim(),
  });

  const readB2B = () => ({
    companyName: String($("b2bCompany").value || "").trim(),
    nip: String($("b2bNip").value || "").trim(),
    addr: String($("b2bAddr").value || "").trim(),
    contact: String($("b2bContact").value || "").trim(),
  });

  const validateShip = (ship) => {
    if (!ship.name || !ship.phone || !ship.street || !ship.city || !ship.zip) return false;
    return true;
  };

  const genOrderId = () => {
    const d = new Date();
    const pad = (n) => String(n).padStart(2,"0");
    const y = d.getFullYear();
    const m = pad(d.getMonth()+1);
    const day = pad(d.getDate());
    const hh = pad(d.getHours());
    const mm = pad(d.getMinutes());
    const ss = pad(d.getSeconds());
    const rnd = Math.random().toString(16).slice(2,6).toUpperCase();
    return `QM-${y}${m}${day}-${hh}${mm}${ss}-${rnd}`;
  };

  const calcFees = (grossTotal, mode) => {
    const platformPct = getPlatformPct();
    const storePct = getStoreMarginPct();

    // ✅ prowizja platformy: max(% * suma, minFee)
    const pctFee = (Number(grossTotal)||0) * platformPct;
    const platformFee = Math.max(DEFAULT_MIN_FEE, pctFee);

    const sellerMargin = (Number(grossTotal)||0) * storePct;

    return {
      platformPct,
      storeMarginPct: storePct,
      platformFee,
      platformFeeMin: DEFAULT_MIN_FEE,
      sellerMargin
    };
  };

  const saveDraft = () => {
    const storeSlug = resolveActiveStoreSlug();
    const { Cart } = window.QM_SHOP || {};
    if (!Cart) return;

    const t = Cart.totals();
    const draft = {
      ts: Date.now(),
      storeSlug,
      mode: t.mode,
      note: String($("note").value || ""),
      ship: readShip(),
      b2bProfile: readB2B()
    };
    writeJSON(LS_CHECKOUT_DRAFT, draft);

    $("msg").textContent = "✅ Szkic zapisany.";
    $("msg").style.color = "rgba(34,197,94,.95)";
  };

  const placeOrderFinal = () => {
    const { Cart } = window.QM_SHOP || {};
    if (!Cart) return;

    const cart = Cart.read();
    const t = Cart.totals();

    if (!cart.items?.length) {
      $("msg").textContent = "Koszyk pusty.";
      $("msg").style.color = "rgba(245,158,11,.95)";
      return;
    }
    if (t.mode === "b2b" && !t.moqOk) {
      $("msg").textContent = "B2B: są pozycje poniżej MOQ — popraw ilości w koszyku.";
      $("msg").style.color = "rgba(245,158,11,.95)";
      return;
    }

    const storeSlug = resolveActiveStoreSlug();
    syncStoreMarginFromStoresMap(storeSlug);

    const ship = readShip();
    if (!validateShip(ship)) {
      $("msg").textContent = "Uzupełnij dane dostawy: imię, telefon, ulica, miasto, kod.";
      $("msg").style.color = "rgba(245,158,11,.95)";
      return;
    }

    const note = String($("note").value || "").trim();
    const b2bProfile = readB2B();

    const order_id = genOrderId();
    const created_at = new Date().toISOString();

    const supplierSplit = computeSupplierBreakdown(cart.items || [], t.mode);

    // suborders (split per hurtownia) — MVP
    const bySup = groupBySupplier(cart.items || []);
    const suborders = [];
    for (const [supplier, items] of bySup.entries()) {
      suborders.push({
        supplier,
        status: "NEW",
        items: items.map(it => ({
          id: it.id,
          sku: it.sku,
          name: it.name,
          supplier: it.supplier,
          qty: Number(it.qty||0)||0,
          unit: it.unit,
          moq: it.moq,
          priceRetail: Number(it.priceRetail||0)||0,
          priceB2B: Number(it.priceB2B||0)||0,
          image: it.image
        }))
      });
    }

    const fees = calcFees(Number(t.gross||0)||0, t.mode);

    const order = {
      // v2 fields
      order_id,
      created_at,
      store_slug: storeSlug,
      status: "NEW",

      mode: t.mode,

      customer: {
        shipping: ship,
        email: ship.email || "",
        phone: ship.phone || ""
      },

      note,
      b2bProfile,

      items: cart.items.map(it => ({
        id: it.id,
        sku: it.sku,
        name: it.name,
        supplier: it.supplier,
        qty: Number(it.qty||0)||0,
        unit: it.unit,
        moq: it.moq,
        priceRetail: Number(it.priceRetail||0)||0,
        priceB2B: Number(it.priceB2B||0)||0,
        image: it.image
      })),

      totals: {
        items: Number(t.items||0)||0,
        net: Number(t.net||0)||0,
        vat: Number(t.vat||0)||0,
        gross: Number(t.gross||0)||0,
        moqOk: !!t.moqOk
      },

      fees,
      supplierBreakdown: supplierSplit,
      suborders
    };

    const arr = readJSON(LS_ORDERS, []);
    const list = Array.isArray(arr) ? arr : [];
    list.push(order);
    writeJSON(LS_ORDERS, list);

    // zapis draftu (dla pewności)
    writeJSON(LS_CHECKOUT_DRAFT, { ts: Date.now(), storeSlug, mode: t.mode, note, ship, b2bProfile });

    $("msg").textContent = `✅ Zamówienie zapisane: ${order_id}. Przenoszę do panelu zamówień…`;
    $("msg").style.color = "rgba(34,197,94,.95)";

    try { Cart.clear(); } catch {}

    setTimeout(() => {
      window.location.href = `./zamowienia.html?order=${encodeURIComponent(order_id)}`;
    }, 450);
  };

  const wireAutoDraft = () => {
    const ids = [
      "note","shipName","shipPhone","shipEmail","shipStreet","shipCity","shipZip","shipMsg",
      "b2bCompany","b2bNip","b2bAddr","b2bContact"
    ];
    ids.forEach(id => {
      const el = $(id);
      if (!el) return;
      el.addEventListener("change", saveDraft);
      el.addEventListener("blur", saveDraft);
    });
  };

  const init = () => {
    const storeSlug = resolveActiveStoreSlug();
    syncStoreMarginFromStoresMap(storeSlug);

    renderSummary();
    hydrateFromDraft();
    wireAutoDraft();

    $("saveDraft")?.addEventListener("click", saveDraft);
    $("placeOrderFinal")?.addEventListener("click", placeOrderFinal);

    // aktualizacja podsumowania przy zmianie koszyka
    window.addEventListener("qm:cart", renderSummary);
  };

  init();
})();
