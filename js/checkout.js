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

    return { name, phone, email, address, city, zip, country: "PL" };
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

  // ===== split per hurtownia =====
  const buildSplit = () => {
    const cart = Cart.read();
    const items = cart.items || [];
    const mode = Cart.getMode();

    const bySup = new Map(); // supplier -> agg

    for (const it of items) {
      const sup = String(it.supplier || "brak").trim() || "brak";
      const qty = Number(it.qty || 0) || 0;
      const price = (mode === "b2b" ? (Number(it.priceB2B || 0) || 0) : (Number(it.priceRetail || 0) || 0));
      const line = qty * price;
      const buy = (Number(it.buyNet || 0) || 0) * qty;

      if (!bySup.has(sup)) bySup.set(sup, { supplier: sup, lines: 0, net: 0, buyNet: 0, count: 0 });
      const row = bySup.get(sup);
      row.lines += 1;
      row.net += line;
      row.buyNet += buy;
      row.count += qty;
    }

    const arr = Array.from(bySup.values()).sort((a,b)=> b.net - a.net);

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
            <th>Wartość (net)</th>
            <th>Zakup (net)</th>
          </tr>
        </thead>
        <tbody>
          ${arr.map(r => `
            <tr>
              <td>${escapeHtml(r.supplier)}</td>
              <td>${r.lines}</td>
              <td>${r.count}</td>
              <td><strong>${money(r.net)}</strong></td>
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

  // ===== place order =====
  const placeOrder = () => {
    setMsg("");

    const cart = Cart.read();
    if (!cart.items || !cart.items.length) {
      setMsg("Koszyk jest pusty. Wróć do koszyka i dodaj produkty.");
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

    const customer = getCustomerFromForm();

    // ✅ tworzymy zamówienie i zapisujemy do qm_orders_v1 (z storeSlug)
    const order = Cart.checkoutCreateOrder(customer);

    if (!order) {
      setMsg("Nie udało się utworzyć zamówienia.");
      return;
    }

    // zapisz "ostatnie zamówienie"
    try {
      localStorage.setItem("qm_last_order_id", String(order.id));
      localStorage.setItem("qm_last_order_no", String(order.orderNo));
      localStorage.setItem("qm_last_order_store", String(order.storeSlug));
    } catch {}

    // draft już niepotrzebny
    try { localStorage.removeItem(LS_DRAFT); } catch {}

    // redirect do panelu zamówień
    const url = withStore(`./zamowienia.html?order=${encodeURIComponent(order.id)}`);
    window.location.href = url;
  };

  const boot = () => {
    syncLinks();

    fillB2BFromCart();
    fillNote();
    loadDraft();
    fillTotals();
    buildSplit();

    $("#saveDraft")?.addEventListener("click", saveDraft);
    $("#placeOrderFinal")?.addEventListener("click", placeOrder);

    // update split/totals gdy koszyk się zmieni
    window.addEventListener("qm:cart", () => {
      fillB2BFromCart();
      fillTotals();
      buildSplit();
    });

    setMsg("");
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
