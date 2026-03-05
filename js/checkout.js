(() => {
  "use strict";

  const LS_ORDERS = "qm_orders_v1";
  const LS_ACTIVE_STORE = "qm_active_store_v1";
  const LS_STORES = "qm_stores_v1";
  const LS_MARGIN = "qm_store_margin_pct";
  const LS_COMMISSION_RULES = "qm_commission_rules_v1";

  const $ = (s, r=document) => r.querySelector(s);

  const uid = () =>
    "ord_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);

  const money = (n) => {
    const x = Number(n || 0);
    return x.toLocaleString("pl-PL", { style: "currency", currency: "PLN" });
  };

  const readJSON = (k, fallback) => {
    try { return JSON.parse(localStorage.getItem(k) || ""); } catch { return fallback; }
  };
  const writeJSON = (k, v) => localStorage.setItem(k, JSON.stringify(v));

  // ===== prowizje platformy: per supplier / per category + minimalna =====
  // format:
  // { defaultPct: 0.02, minFee: 2, bySupplier: { "Hurtownia A": 0.03 }, byCategory: { "mięso": 0.025 }, bySupplierCategory: { "Hurtownia A||mięso": 0.035 } }
  const getCommissionRules = () => {
    return readJSON(LS_COMMISSION_RULES, {
      defaultPct: 0.02,
      minFee: 2,
      bySupplier: {},
      byCategory: {},
      bySupplierCategory: {}
    });
  };

  const commissionPctFor = (supplierName, category) => {
    const r = getCommissionRules();
    const key = `${supplierName || ""}||${category || ""}`;
    if (r.bySupplierCategory && r.bySupplierCategory[key] != null) return Number(r.bySupplierCategory[key]);
    if (r.bySupplier && r.bySupplier[supplierName] != null) return Number(r.bySupplier[supplierName]);
    if (r.byCategory && r.byCategory[category] != null) return Number(r.byCategory[category]);
    return Number(r.defaultPct || 0.02);
  };

  const computeCommissionFee = (grossTotal, pct) => {
    const r = getCommissionRules();
    const fee = Number(grossTotal) * Number(pct || 0);
    const minFee = Number(r.minFee || 0);
    return Math.max(fee, minFee);
  };

  // ===== koszyk (z twojego QM_SHOP Cart jeśli istnieje) =====
  const getCart = () => {
    if (window.QM_SHOP && window.QM_SHOP.Cart) return window.QM_SHOP.Cart.get();
    // fallback: jeśli masz inny klucz, dopasuj tu:
    return readJSON("qm_cart_v1", { items: [] });
  };

  const getStoreSlug = () => {
    const url = new URL(location.href);
    return url.searchParams.get("store") || readJSON(LS_ACTIVE_STORE, null);
  };

  const getStore = (slug) => {
    const stores = readJSON(LS_STORES, []);
    return stores.find(s => s.slug === slug) || null;
  };

  const groupItemsBySupplier = (items) => {
    const map = {};
    for (const it of items || []) {
      const supplier = it.supplier || it.supplierName || it.hurtownia || "Nieznana hurtownia";
      if (!map[supplier]) map[supplier] = [];
      map[supplier].push(it);
    }
    return map;
  };

  const calcLineGross = (it) => Number(it.price || 0) * Number(it.qty || 0);

  const calcItemsGross = (items) => (items || []).reduce((s, it) => s + calcLineGross(it), 0);

  const renderSummary = () => {
    const slug = getStoreSlug();
    const store = getStore(slug);
    const badge = $("#storeBadge");
    badge.textContent = store ? `Sklep: ${store.name} (${store.slug})` : `Sklep: ${slug || "?"}`;

    const cart = getCart();
    const items = cart.items || [];

    if (!items.length) {
      $("#summaryBox").innerHTML = `<div>Brak produktów w koszyku.</div><div class="muted">Wróć i dodaj produkty.</div>`;
      return;
    }

    const groups = groupItemsBySupplier(items);

    let html = "";
    let grandGross = 0;
    let grandPlatformFee = 0;

    for (const [supplier, arr] of Object.entries(groups)) {
      const gross = calcItemsGross(arr);
      grandGross += gross;

      // pct wyliczamy per pozycja (supplier/category), ale dla podsumowania pokazujemy “od…”
      // fee liczona po sumie brutto tej hurtowni — to prostsze i stabilne.
      // Jeśli chcesz fee per linia: zrobimy później.
      const anyCat = (arr[0] && (arr[0].category || arr[0].kategoria)) || "";
      const pct = commissionPctFor(supplier, anyCat);
      const fee = computeCommissionFee(gross, pct);
      grandPlatformFee += fee;

      html += `
        <div style="margin:10px 0 6px; font-weight:900;">${supplier}</div>
        <div class="kpi"><span>Wartość brutto</span><b>${money(gross)}</b></div>
        <div class="kpi"><span>Prowizja platformy</span><b>${money(fee)}</b></div>
      `;
    }

    const marginPct = Number(localStorage.getItem(LS_MARGIN) || "0") / 100; // sprzedawcy
    const sellerMargin = grandGross * marginPct;

    html += `<hr style="border:0;border-top:1px solid rgba(0,0,0,.12); margin:12px 0;">`;
    html += `<div class="kpi"><span>Razem brutto</span><b>${money(grandGross)}</b></div>`;
    html += `<div class="kpi"><span>Prowizja platformy (razem)</span><b>${money(grandPlatformFee)}</b></div>`;
    html += `<div class="kpi"><span>Marża sprzedawcy (szac.)</span><b>${money(sellerMargin)}</b></div>`;

    $("#summaryBox").innerHTML = html;
  };

  const buildOrder = (formData) => {
    const slug = getStoreSlug();
    const store = getStore(slug);
    const cart = getCart();
    const items = cart.items || [];
    const grouped = groupItemsBySupplier(items);

    const now = new Date().toISOString();

    // totals
    let grossTotal = 0;
    let platformFeeTotal = 0;

    const supplierSplits = Object.entries(grouped).map(([supplier, arr]) => {
      const gross = calcItemsGross(arr);
      grossTotal += gross;

      // prowizja per hurtownia (proste i czytelne)
      const anyCat = (arr[0] && (arr[0].category || arr[0].kategoria)) || "";
      const pct = commissionPctFor(supplier, anyCat);
      const fee = computeCommissionFee(gross, pct);
      platformFeeTotal += fee;

      return {
        supplier,
        gross,
        platformFee: fee,
        items: arr.map(it => ({
          id: it.id || it.sku || it.code || null,
          name: it.name || it.title || "",
          qty: Number(it.qty || 0),
          price: Number(it.price || 0),       // brutto (u Ciebie już w sklepie)
          category: it.category || it.kategoria || "",
          raw: it
        }))
      };
    });

    const marginPct = Number(localStorage.getItem(LS_MARGIN) || "0") / 100;
    const sellerMargin = grossTotal * marginPct;

    return {
      id: uid(),
      createdAt: now,
      updatedAt: now,
      status: "NEW",

      storeSlug: slug || (store && store.slug) || null,
      storeName: store ? store.name : null,

      buyer: {
        fullName: formData.fullName,
        phone: formData.phone,
        email: formData.email,
        address: {
          street: formData.street,
          zip: formData.zip,
          city: formData.city,
          country: formData.country
        },
        notes: formData.notes || ""
      },

      payment: {
        method: formData.paymentMethod || "PAY_LATER",
        paid: false
      },

      totals: {
        gross: grossTotal,
        platformFee: platformFeeTotal,
        sellerMargin
      },

      splits: supplierSplits
    };
  };

  const clearCart = () => {
    if (window.QM_SHOP && window.QM_SHOP.Cart) {
      window.QM_SHOP.Cart.clear();
      return;
    }
    writeJSON("qm_cart_v1", { items: [] });
  };

  const saveOrder = (order) => {
    const orders = readJSON(LS_ORDERS, []);
    orders.unshift(order);
    writeJSON(LS_ORDERS, orders);
  };

  const downloadJSON = (obj, filename) => {
    const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  const init = () => {
    renderSummary();

    const form = $("#checkoutForm");
    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const fd = Object.fromEntries(new FormData(form).entries());
      const cart = getCart();
      if (!cart.items || !cart.items.length) {
        alert("Koszyk jest pusty.");
        return;
      }

      const order = buildOrder(fd);
      saveOrder(order);

      // czyścimy koszyk
      clearCart();

      // przekieruj na zamówienia klienta (może być twoja strona “dziękujemy”)
      // Na teraz: pokaż szybki JSON
      downloadJSON(order, `${order.id}.json`);
      alert(`Zamówienie złożone! Status: ${order.status}\nID: ${order.id}`);

      // jeśli masz stronę “dziekujemy.html”, ustaw:
      // location.href = `./dziekujemy.html?order=${encodeURIComponent(order.id)}&store=${encodeURIComponent(order.storeSlug||"")}`;
      location.href = `./zamowienia.html?store=${encodeURIComponent(order.storeSlug||"")}`;
    });

    $("#btnExportDraft").addEventListener("click", () => {
      const fd = Object.fromEntries(new FormData(form).entries());
      const cart = getCart();
      const draft = { buyer: fd, cart };
      downloadJSON(draft, `checkout-draft.json`);
    });
  };

  document.addEventListener("DOMContentLoaded", init);
})();
