(() => {
  "use strict";

  const LS_ORDERS = "qm_orders_v1";
  const LS_ACTIVE = "qm_active_store_v1";

  // statusy panelu (spójne z UI)
  const STATUSES = ["NEW","CONFIRMED","SENT","DONE","CANCELLED"];

  const $ = (s, r=document) => r.querySelector(s);

  const money = (n) => {
    const v = Number(n || 0);
    return v.toLocaleString("pl-PL", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " zł";
  };

  const readOrdersRaw = () => {
    try {
      const arr = JSON.parse(localStorage.getItem(LS_ORDERS) || "[]");
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  };

  const writeOrdersRaw = (arr) => {
    localStorage.setItem(LS_ORDERS, JSON.stringify(Array.isArray(arr) ? arr : []));
    window.dispatchEvent(new CustomEvent("qm:orders"));
  };

  const storeFromUrlOrActive = () => {
    try {
      const u = new URL(location.href);
      const s = (u.searchParams.get("store") || "").trim();
      if (s) return s;
    } catch {}
    return String(localStorage.getItem(LS_ACTIVE) || "default").trim() || "default";
  };

  const getOrderIdFromUrl = () => {
    try {
      const u = new URL(location.href);
      return (u.searchParams.get("order") || "").trim();
    } catch { return ""; }
  };

  const setLinks = () => {
    const store = storeFromUrlOrActive();
    $("#activeStoreBadge").textContent = `store: ${store}`;
    $("#goShop").href = `./sklep.html?store=${encodeURIComponent(store)}`;
    $("#goCart").href = `./koszyk.html?store=${encodeURIComponent(store)}`;
    const f = $("#storeFilter");
    if (f && !f.value) f.value = store;
  };

  const escapeHtml = (s) =>
    String(s).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");

  // --- NORMALIZACJA: obsłuż i stare i nowe zamówienia (z Cart.checkoutCreateOrder)
  const normalizeSuppliers = (itemsOrBreakdown) => {
    // nowy format: order.items[] ma supplier w itemie
    if (Array.isArray(itemsOrBreakdown)) {
      const by = new Map();
      for (const it of itemsOrBreakdown) {
        const sup = String(it?.supplier || "brak").trim() || "brak";
        const qty = Number(it?.qty || 0) || 0;
        const priceRetail = Number(it?.priceRetail || 0) || 0;
        const priceB2B = Number(it?.priceB2B || 0) || 0;

        // nie wiemy trybu tutaj, więc brutto liczymy z retail jako MVP
        const gross = qty * (priceRetail || priceB2B || 0);

        if (!by.has(sup)) by.set(sup, { supplier: sup, gross: 0, items: 0 });
        const row = by.get(sup);
        row.gross += gross;
        row.items += qty;
      }
      return Array.from(by.values()).sort((a,b)=> b.gross - a.gross);
    }

    // stary format: supplierBreakdown jako obiekt
    if (itemsOrBreakdown && typeof itemsOrBreakdown === "object") {
      const out = [];
      for (const [supplier, v] of Object.entries(itemsOrBreakdown)) {
        out.push({
          supplier,
          items: Number(v?.items||0),
          gross: Number(v?.gross||0)
        });
      }
      out.sort((a,b)=> (b.gross - a.gross));
      return out;
    }

    return [];
  };

  const normOne = (o) => {
    if (!o || typeof o !== "object") return null;

    // nowe zamówienie z shopCart.js:
    // { id, orderNo, storeSlug, status, createdAt, totals:{items,gross}, mode, items:[...] }

    const id = String(o.id || o.order_id || o.orderNo || "").trim() || "—";
    const createdAtISO = o.createdAt || o.created_at || "";
    const ts = createdAtISO ? Date.parse(createdAtISO) : (o.ts || Date.now());

    const storeSlug = String(o.storeSlug || o.store_slug || "default").trim() || "default";

    const statusRaw = String(o.status || "NEW").toUpperCase().trim();
    const status = STATUSES.includes(statusRaw) ? statusRaw : "NEW";

    const mode = String(o.mode || o.totals?.mode || "").trim() || "—";

    const totals = o.totals || {};
    const gross = Number(totals.gross ?? o.gross ?? 0) || 0;
    const itemsCount = Number(totals.items ?? o.itemsCount ?? 0) || 0;

    // MVP fee/margin: jeśli nie ma, liczymy prowizję 2% i marżę sprzedawcy 0 (na razie)
    const platformFee = Number(o.fees?.platformFee ?? (gross * 0.02)) || 0;
    const sellerMargin = Number(o.fees?.sellerMargin ?? 0) || 0;

    const sups = normalizeSuppliers(o.items || o.supplierBreakdown || o.supplier_breakdown || null);

    const email =
      (o.customer && (o.customer.email || "")) ||
      (o.b2bProfile && o.b2bProfile.contact) ||
      "";

    const hay = JSON.stringify({
      id, storeSlug, status, mode,
      suppliers: sups.map(x=>x.supplier),
      email,
      note: o.note || ""
    }).toLowerCase();

    return {
      __raw: o,
      id,
      createdAtISO,
      ts,
      storeSlug,
      status,
      mode: String(mode).toUpperCase(),
      itemsCount,
      gross,
      platformFee,
      sellerMargin,
      suppliers: sups,
      hay
    };
  };

  const normalizeAll = (rawList) => {
    const out = [];
    for (const o of (rawList || [])) {
      const n = normOne(o);
      if (n) out.push(n);
    }
    return out;
  };

  const applyFilters = (normList) => {
    const store = ($("#storeFilter").value || "").trim().toLowerCase();
    const status = ($("#statusFilter").value || "").trim().toUpperCase();
    const q = ($("#q").value || "").trim().toLowerCase();

    return (normList || []).filter(o => {
      if (!o) return false;
      if (store && String(o.storeSlug).toLowerCase() !== store) return false;
      if (status && String(o.status) !== status) return false;
      if (q && !o.hay.includes(q)) return false;
      return true;
    });
  };

  const exportJSON = (list) => {
    const payload = (list || []).map(o => ({
      order_id: o.id,
      created_at: o.createdAtISO || new Date(o.ts||Date.now()).toISOString(),
      store_slug: o.storeSlug,
      status: o.status,
      mode: o.mode,
      totals: { items: o.itemsCount, gross: o.gross },
      fees: { platformFee: o.platformFee, sellerMargin: o.sellerMargin },
      suppliers: o.suppliers
    }));

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type:"application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `qm_orders_export.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const exportCSV = (list) => {
    const head = [
      "created_at","order_id","store_slug","status","mode",
      "items","gross","platform_fee","seller_margin","suppliers"
    ];

    const rows = (list || []).map(o => {
      const sups = (o.suppliers || [])
        .map(s => `${s.supplier}:${Number(s.gross||0).toFixed(2)}`)
        .join("|");

      return [
        o.createdAtISO || new Date(o.ts||Date.now()).toISOString(),
        o.id,
        o.storeSlug,
        o.status,
        o.mode,
        Number(o.itemsCount||0),
        Number(o.gross||0).toFixed(2),
        Number(o.platformFee||0).toFixed(2),
        Number(o.sellerMargin||0).toFixed(2),
        sups
      ].map(v => `"${String(v).replaceAll('"','""')}"`).join(",");
    });

    const csv = [head.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type:"text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `qm_orders_export.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const updateOrderStatus = (orderId, nextStatus) => {
    const status = String(nextStatus||"").toUpperCase().trim();
    if (!STATUSES.includes(status)) return;

    const raw = readOrdersRaw();
    let changed = false;

    const updated = raw.map(o => {
      if (!o || typeof o !== "object") return o;
      const id = String(o.id || o.order_id || o.orderNo || "").trim();
      if (id !== orderId) return o;

      o.status = status;
      o.updatedAt = new Date().toISOString();
      changed = true;
      return o;
    });

    if (changed) writeOrdersRaw(updated);
  };

  const deleteOrder = (orderId) => {
    const raw = readOrdersRaw();
    const filtered = raw.filter(o => {
      const id = String(o?.id || o?.order_id || o?.orderNo || "").trim();
      return id !== orderId;
    });
    writeOrdersRaw(filtered);
  };

  const nextStatus = (cur) => {
    const c = String(cur||"NEW").toUpperCase().trim();
    const i = Math.max(0, STATUSES.indexOf(c));
    return STATUSES[Math.min(STATUSES.length-1, i+1)];
  };

  const render = () => {
    const raw = readOrdersRaw();
    const normAll = normalizeAll(raw);
    const list = applyFilters(normAll);

    const sumGross = list.reduce((a,o)=>a + (Number(o?.gross)||0), 0);
    const sumFee = list.reduce((a,o)=>a + (Number(o?.platformFee)||0), 0);
    const sumMargin = list.reduce((a,o)=>a + (Number(o?.sellerMargin)||0), 0);

    $("#kpiOrders").textContent = String(list.length);
    $("#kpiGross").textContent = money(sumGross);
    $("#kpiFee").textContent = money(sumFee);
    $("#kpiMargin").textContent = money(sumMargin);

    const tbody = $("#rows");
    tbody.innerHTML = "";

    const highlightId = getOrderIdFromUrl();

    if (!list.length) {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td colspan="10" style="opacity:.7">Brak zamówień.</td>`;
      tbody.appendChild(tr);
      $("#exportJson").onclick = () => exportJSON(list);
      $("#exportCsv").onclick = () => exportCSV(list);
      return;
    }

    const sorted = list.slice().sort((a,b)=> (Number(b.ts||0) - Number(a.ts||0)));

    for (const o of sorted) {
      const dt = o.createdAtISO ? new Date(o.createdAtISO) : new Date(o.ts || Date.now());
      const dts = dt.toLocaleString("pl-PL");

      const sups = o.suppliers || [];
      const supsHtml =
        (sups.slice(0,3).map(x => `${escapeHtml(x.supplier)}: ${money(x.gross)}`).join("<br>")) +
        (sups.length>3 ? `<br><span style="opacity:.7">+${sups.length-3} więcej</span>` : "");

      const tr = document.createElement("tr");
      if (highlightId && String(o.id) === String(highlightId)) tr.classList.add("hl");

      tr.innerHTML = `
        <td>${dts}</td>
        <td class="mono">${escapeHtml(o.id)}</td>
        <td>${escapeHtml(o.storeSlug)}</td>
        <td><span class="badge">${escapeHtml(o.status)}</span></td>
        <td>${escapeHtml(o.mode)}</td>
        <td class="right">${Number(o.itemsCount || 0)}</td>
        <td class="right"><strong>${money(o.gross || 0)}</strong></td>
        <td class="right">${money(o.platformFee || 0)}</td>
        <td>${supsHtml || "—"}</td>
        <td class="right">
          <div class="row-actions" style="justify-content:flex-end;align-items:center">
            <select class="select" data-status="${escapeHtml(o.id)}" title="Zmień status">
              ${STATUSES.map(s => `<option value="${s}" ${s===o.status?"selected":""}>${s}</option>`).join("")}
            </select>
            <button class="btn btn-sm btn-xs" data-next="${escapeHtml(o.id)}" title="Następny status">➡️</button>
            <button class="btn btn-sm btn-xs" data-json="${escapeHtml(o.id)}">JSON</button>
            <button class="btn btn-danger btn-sm btn-xs" data-del="${escapeHtml(o.id)}">Usuń</button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    }

    tbody.querySelectorAll("select[data-status]").forEach(sel => {
      sel.addEventListener("change", () => {
        const id = sel.getAttribute("data-status");
        updateOrderStatus(id, sel.value);
      });
    });

    tbody.querySelectorAll("[data-next]").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-next");
        const raw = readOrdersRaw();
        const found = normOne(raw.find(x => String(x?.id || x?.order_id || x?.orderNo || "").trim() === id));
        updateOrderStatus(id, nextStatus(found?.status || "NEW"));
      });
    });

    tbody.querySelectorAll("[data-del]").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-del");
        deleteOrder(id);
      });
    });

    tbody.querySelectorAll("[data-json]").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-json");
        const raw = readOrdersRaw();
        const o = raw.find(x => String(x?.id || x?.order_id || x?.orderNo || "").trim() === id);
        if (!o) return;
        const blob = new Blob([JSON.stringify(o, null, 2)], { type:"application/json" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `${id}.json`;
        a.click();
        URL.revokeObjectURL(a.href);
      });
    });

    $("#exportJson").onclick = () => exportJSON(list);
    $("#exportCsv").onclick = () => exportCSV(list);
  };

  $("#refresh").addEventListener("click", render);
  $("#storeFilter").addEventListener("input", render);
  $("#statusFilter").addEventListener("change", render);
  $("#q").addEventListener("input", render);

  $("#clearOrders").addEventListener("click", () => {
    writeOrdersRaw([]);
  });

  setLinks();
  render();

  window.addEventListener("qm:orders", render);
})();
