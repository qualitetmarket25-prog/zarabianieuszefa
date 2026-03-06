(() => {
  "use strict";

  const $ = (sel, root=document) => root.querySelector(sel);
  const { Cart, money } = window.QM_SHOP;

  // ===== store slug =====
  const slugify = (s) => String(s || "")
    .trim()
    .toLowerCase()
    .replace(/[ąćęłńóśźż]/g, (m) => ({
      "ą":"a","ć":"c","ę":"e","ł":"l","ń":"n","ó":"o","ś":"s","ź":"z","ż":"z"
    }[m] || m))
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  const getStoreSlug = () => {
    const active = slugify(localStorage.getItem("qm_active_store_v1") || "");
    if (active) return active;

    try {
      const u = new URL(window.location.href);
      const s = slugify(u.searchParams.get("store") || "");
      if (s) return s;
    } catch {}

    const panel = slugify(localStorage.getItem("qm_store_slug") || "");
    if (panel) return panel;

    return "default";
  };

  const STORE = getStoreSlug();

  const withStore = (href) => {
    if (!href) return href;
    if (String(href).includes("store=")) return href;
    const sep = String(href).includes("?") ? "&" : "?";
    return `${href}${sep}store=${encodeURIComponent(STORE)}`;
  };

  const syncLinks = () => {
    document.querySelectorAll("a[href]").forEach(a => {
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

  // ===== draft per store =====
  const LS_DRAFT = `qm_checkout_draft_v1__${STORE}`;
  const LS_ORDERS = "qm_orders_v1";

  const readJSON = (k, fallback) => {
    try { return JSON.parse(localStorage.getItem(k) || ""); } catch { return fallback; }
  };
  const writeJSON = (k, v) => localStorage.setItem(k, JSON.stringify(v));

  const setMsg = (txt) => {
    const el = $("#msg");
    if (el) el.textContent = String(txt || "");
  };

  const escapeHtml = (s) =>
    String(s).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");

  const getCustomerFromForm = () => {
    const name = $("#shipName")?.value || "";
    const phone = $("#shipPhone")?.value || "";
    const email = $("#shipEmail")?.value || "";

    const street = $("#shipStreet")?.value || "";
    const city = $("#shipCity")?.value || "";
    const zip = $("#shipZip")?.value || "";
    const msg = $("#shipMsg")?.value || "";

    const address = [street, zip && city ? `${zip} ${city}` : (city || zip), msg]
      .filter(Boolean)
      .join(" • ");

    return {
      name, phone, email,
      address, street, city, zip,
      country: "PL",
      msg
    };
  };

  const fillB2BFromCart = () => {
    const mode = Cart.getMode();
    const prof = Cart.getB2BProfile();

    $("#b2bCompany") && ($("#b2bCompany").value = prof.companyName || "");
    $("#b2bNip") && ($("#b2bNip").value = prof.nip || "");
    $("#b2bAddr") && ($("#b2bAddr").value = prof.addr || "");
    $("#b2bContact") && ($("#b2bContact").value = prof.contact || "");

    const modeLabel = $("#modeLabel");
    if (modeLabel) modeLabel.textContent = (mode === "b2b") ? "HURT (B2B)" : "DETAL";

    const storeLabel = $("#storeLabel");
    if (storeLabel) storeLabel.textContent = `Sklep: ${STORE}`;
  };

  const fillNote = () => {
    $("#note") && ($("#note").value = Cart.getNote() || "");
    $("#note")?.addEventListener("input", () => {
      Cart.setNote($("#note").value || "");
    });
  };

  const fillTotals = () => {
    const t = Cart.totals();
    $("#sumItems") && ($("#sumItems").textContent = String(t.items));
    $("#sumNet") && ($("#sumNet").textContent = money(t.net));
    $("#sumVat") && ($("#sumVat").textContent = money(t.vat));
    $("#sumGross") && ($("#sumGross").textContent = money(t.gross));
  };

  // ===== split per hurtownia (do UI + do ordera) =====
  const computeSplit = () => {
    const cart = Cart.read();
    const items = cart.items || [];
    const mode = Cart.getMode();

    const bySup = new Map(); // supplier -> agg

    for (const it of items) {
      const sup = String(it.supplier || "brak").trim() || "brak";
      const qty = Number(it.qty || 0) || 0;

      const price = (mode === "b2b"
        ? (Number(it.priceB2B || 0) || Number(it.priceRetail || 0) || 0)
        : (Number(it.priceRetail || 0) || 0)
      );

      const lineGross = qty * price;
      const buyNetLine = (Number(it.buyNet || 0) || 0) * qty;

      if (!bySup.has(sup)) bySup.set(sup, { supplier: sup, lines: 0, items: 0, gross: 0, buyNet: 0 });
      const row = bySup.get(sup);
      row.lines += 1;
      row.items += qty;
      row.gross += lineGross;
      row.buyNet += buyNetLine;
    }

    return Array.from(bySup.values()).sort((a,b)=> b.gross - a.gross);
  };

  const buildSplitUI = () => {
    const arr = computeSplit();

    const meta = $("#splitMeta");
    if (meta) meta.textContent = arr.length
      ? `Hurtownie: ${arr.length} • podział zamówienia wg dostawców`
      : "Brak pozycji w koszyku.";

    const wrap = $("#splitTableWrap");
    if (!wrap) return;

    if (!arr.length) { wrap.innerHTML = ""; return; }

    wrap.innerHTML = `
      <table class="miniTable">
        <thead>
          <tr>
            <th>Hurtownia</th>
            <th>Pozycje</th>
            <th>Szt.</th>
            <th>Wartość (brutto)</th>
            <th>Zakup (net)</th>
          </tr>
        </thead>
        <tbody>
          ${arr.map(r => `
            <tr>
              <td>${escapeHtml(r.supplier)}</td>
              <td>${r.lines}</td>
              <td>${r.items}</td>
              <td><strong>${money(r.gross)}</strong></td>
              <td>${money(r.buyNet)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;
  };

  // ===== draft =====
  const saveDraft = () => {
    const draft = {
      storeSlug: STORE,
      savedAt: new Date().toISOString(),
      ship: {
        name: $("#shipName")?.value || "",
        phone: $("#shipPhone")?.value || "",
        email: $("#shipEmail")?.value || "",
        street: $("#shipStreet")?.value || "",
        city: $("#shipCity")?.value || "",
        zip: $("#shipZip")?.value || "",
        msg: $("#shipMsg")?.value || ""
      },
      note: $("#note")?.value || "",
      b2b: {
        company: $("#b2bCompany")?.value || "",
        nip: $("#b2bNip")?.value || "",
        addr: $("#b2bAddr")?.value || "",
        contact: $("#b2bContact")?.value || ""
      }
    };
    writeJSON(LS_DRAFT, draft);
    setMsg("Szkic zapisany.");
  };

  const loadDraft = () => {
    const d = readJSON(LS_DRAFT, null);
    if (!d || d.storeSlug !== STORE) return;

    $("#shipName") && ($("#shipName").value = d.ship?.name || "");
    $("#shipPhone") && ($("#shipPhone").value = d.ship?.phone || "");
    $("#shipEmail") && ($("#shipEmail").value = d.ship?.email || "");
    $("#shipStreet") && ($("#shipStreet").value = d.ship?.street || "");
    $("#shipCity") && ($("#shipCity").value = d.ship?.city || "");
    $("#shipZip") && ($("#shipZip").value = d.ship?.zip || "");
    $("#shipMsg") && ($("#shipMsg").value = d.ship?.msg || "");

    $("#note") && ($("#note").value = d.note || "");

    $("#b2bCompany") && ($("#b2bCompany").value = d.b2b?.company || "");
    $("#b2bNip") && ($("#b2bNip").value = d.b2b?.nip || "");
    $("#b2bAddr") && ($("#b2bAddr").value = d.b2b?.addr || "");
    $("#b2bContact") && ($("#b2bContact").value = d.b2b?.contact || "");
  };

  // ===== helpers: order id/no =====
  const pad2 = (n) => String(n).padStart(2,"0");
  const genOrderId = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = pad2(d.getMonth()+1);
    const da = pad2(d.getDate());
    const rnd = Math.random().toString(16).slice(2,6).toUpperCase();
    return `QM-${y}${m}${da}-${rnd}`;
  };
  const genOrderNo = () => {
    const t = Date.now().toString(36).toUpperCase();
    const rnd = Math.random().toString(36).slice(2,6).toUpperCase();
    return `QM-${t}-${rnd}`;
  };

  // ===== write order (QM_ORDERS jeśli jest, fallback na LS) =====
  const addOrder = (order) => {
    try {
      if (window.QM_ORDERS && typeof window.QM_ORDERS.add === "function") {
        window.QM_ORDERS.add(order);
        return;
      }
    } catch {}

    const arr = readJSON(LS_ORDERS, []);
    const list = Array.isArray(arr) ? arr : [];
    list.unshift(order);
    writeJSON(LS_ORDERS, list);
    window.dispatchEvent(new CustomEvent("qm:orders"));
  };

  // ===== place order =====
  const placeOrder = () => {
    setMsg("");

    const cart = Cart.read();
    if (!cart.items || !cart.items.length) {
      setMsg("Koszyk jest pusty. Wróć do koszyka i dodaj produkty.");
      return;
    }

    // MOQ gate w B2B
    const t = Cart.totals();
    if (t.mode === "b2b" && !t.moqOk) {
      setMsg("B2B: nie spełniasz MOQ dla części pozycji. Wróć do koszyka i zwiększ ilości.");
      return;
    }

    // aktualizuj B2B profil jeśli user poprawił
    if (Cart.getMode() === "b2b") {
      Cart.setB2BProfile({
        companyName: $("#b2bCompany")?.value || "",
        nip: $("#b2bNip")?.value || "",
        addr: $("#b2bAddr")?.value || "",
        contact: $("#b2bContact")?.value || ""
      });
    }

    // notatka
    Cart.setNote($("#note")?.value || "");

    const shipping = getCustomerFromForm();
    const note = Cart.getNote() || "";
    const mode = Cart.getMode(); // retail | b2b
    const b2bProfile = (mode === "b2b") ? Cart.getB2BProfile() : null;

    const items = (cart.items || []).map(it => ({
      id: String(it.id || ""),
      sku: String(it.sku || it.id || ""),
      name: String(it.name || "Produkt"),
      supplier: String(it.supplier || ""),
      category: String(it.category || ""),
      unit: String(it.unit || "szt"),
      moq: Number(it.moq || 1) || 1,
      qty: Number(it.qty || 0) || 0,
      buyNet: Number(it.buyNet || 0) || 0,
      priceRetail: Number(it.priceRetail || 0) || 0,
      priceB2B: Number(it.priceB2B || 0) || 0,
      image: String(it.image || "")
    })).filter(x => x.qty > 0);

    const split = computeSplit();
    const buyNetTotal = split.reduce((a,r)=> a + (Number(r.buyNet||0)||0), 0);

    const gross = Number(t.gross || 0) || 0;
    const net = Number(t.net || 0) || 0;
    const vat = Number(t.vat || 0) || 0;

    // MVP: fee 2% brutto
    const platformFee = Math.round((gross * 0.02 + Number.EPSILON) * 100) / 100;

    // MVP marża sprzedawcy: (gross - fee - buyNetTotal) (orientacyjnie)
    const sellerMargin = Math.round(((gross - platformFee - buyNetTotal) + Number.EPSILON) * 100) / 100;

    const order = {
      id: genOrderId(),
      orderNo: genOrderNo(),
      createdAt: new Date().toISOString(),

      storeSlug: STORE,
      status: "NEW",
      mode: mode, // retail | b2b

      shipping,
      note,

      b2bProfile: b2bProfile ? {
        companyName: b2bProfile.companyName || "",
        nip: b2bProfile.nip || "",
        addr: b2bProfile.addr || "",
        contact: b2bProfile.contact || ""
      } : null,

      items,

      totals: {
        mode: mode,
        items: Number(t.items || 0) || 0,
        net, vat, gross,
        moqOk: !!t.moqOk,
        discountPct: Number(t.discountPct || 0) || 0
      },

      fees: {
        platformFee,
        sellerMargin: isFinite(sellerMargin) ? sellerMargin : 0,
        buyNetTotal
      },

      suppliers: split.map(r => ({
        supplier: r.supplier,
        lines: r.lines,
        items: r.items,
        gross: Math.round((Number(r.gross||0) + Number.EPSILON) * 100) / 100,
        buyNet: Math.round((Number(r.buyNet||0) + Number.EPSILON) * 100) / 100
      }))
    };

    addOrder(order);

    // zapisz "ostatnie zamówienie"
    try {
      localStorage.setItem("qm_last_order_id", String(order.id));
      localStorage.setItem("qm_last_order_no", String(order.orderNo));
      localStorage.setItem("qm_last_order_store", String(order.storeSlug));
    } catch {}

    // draft już niepotrzebny
    try { localStorage.removeItem(LS_DRAFT); } catch {}

    // ✅ czyść koszyk (per store) po złożeniu
    try { Cart.clear(); } catch {}

    // redirect do panelu zamówień + store + order
    const url = withStore(`./zamowienia.html?order=${encodeURIComponent(order.id)}`);
    window.location.href = url;
  };

  const boot = () => {
    syncLinks();

    fillB2BFromCart();
    fillNote();
    loadDraft();
    fillTotals();
    buildSplitUI();

    $("#saveDraft")?.addEventListener("click", saveDraft);
    $("#placeOrderFinal")?.addEventListener("click", placeOrder);

    // update split/totals gdy koszyk się zmieni
    window.addEventListener("qm:cart", () => {
      fillB2BFromCart();
      fillTotals();
      buildSplitUI();
    });

    setMsg("");
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
