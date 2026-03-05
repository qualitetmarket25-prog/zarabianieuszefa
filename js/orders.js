/* orders.js — QualitetMarket (MVP)
   Zapis zamówień do localStorage: qm_orders_v1
   KPI dla zamowienia.html

   Format (1 rekord):
   {
     id, createdAt, storeSlug,
     totals: { mode, items, net, vat, gross },
     fees: { platformFeePct, platformFeeGross, sellerMarginPct, sellerMarginGross, sellerRevenueGross },
     supplierBreakdown: [{ supplier, lines, items, gross }],
     cartSnapshot: [{ id, name, sku, supplier, qty, unit, buyNet, priceRetail, priceB2B }]
   }
*/

(() => {
  "use strict";

  const LS_ORDERS = "qm_orders_v1";
  const PLATFORM_FEE_PCT = 0.02; // 2% brutto (MVP)

  const readJSON = (k, fallback) => {
    try { return JSON.parse(localStorage.getItem(k) || ""); }
    catch { return fallback; }
  };
  const writeJSON = (k, v) => localStorage.setItem(k, JSON.stringify(v));

  const uid = () => `ord_${Date.now()}_${Math.random().toString(16).slice(2)}`;

  const getStoreSlugSafe = () => {
    try {
      if (window.QM_SHOP?.Cart?.getStore) return window.QM_SHOP.Cart.getStore();
    } catch {}
    // fallback: próbuj z active store
    const s = String(localStorage.getItem("qm_active_store_v1") || "").trim();
    return s || "default";
  };

  const getSellerMarginPct = (storeSlug) => {
    // 1) per-store (jeśli kiedyś stosujesz)
    const k1 = `qm_store_margin_pct__${storeSlug}`;
    const v1 = Number(localStorage.getItem(k1));
    if (Number.isFinite(v1) && v1 > 0) return v1;

    // 2) global (jak opisałeś)
    const v2 = Number(localStorage.getItem("qm_store_margin_pct"));
    if (Number.isFinite(v2) && v2 > 0) return v2;

    // 3) fallback
    return 0.08;
  };

  const money = (n) => {
    const v = Number(n || 0);
    return v.toLocaleString("pl-PL", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " zł";
  };

  const computeSupplierBreakdown = (items, mode) => {
    const map = new Map();

    for (const it of items) {
      const supplier = String(it.supplier || "Brak hurtowni").trim() || "Brak hurtowni";
      const qty = Number(it.qty || 0) || 0;
      const unitPrice = (mode === "b2b")
        ? (Number(it.priceB2B || 0) || 0)
        : (Number(it.priceRetail || 0) || 0);

      const grossLine = qty * unitPrice * 1.23; // VAT orientacyjnie jak w Cart.totals()
      const key = supplier;

      if (!map.has(key)) map.set(key, { supplier: key, lines: 0, items: 0, gross: 0 });
      const row = map.get(key);
      row.lines += 1;
      row.items += qty;
      row.gross += grossLine;
    }

    return Array.from(map.values())
      .sort((a, b) => (b.gross - a.gross));
  };

  const Orders = {
    list() {
      const arr = readJSON(LS_ORDERS, []);
      return Array.isArray(arr) ? arr : [];
    },

    clear() {
      writeJSON(LS_ORDERS, []);
      window.dispatchEvent(new CustomEvent("qm:orders"));
    },

    remove(id) {
      const arr = this.list().filter(o => o && o.id !== id);
      writeJSON(LS_ORDERS, arr);
      window.dispatchEvent(new CustomEvent("qm:orders"));
    },

    saveFromCurrentCart(meta = {}) {
      const Cart = window.QM_SHOP?.Cart;
      if (!Cart) return { ok: false, reason: "QM_SHOP.Cart missing" };

      const storeSlug = getStoreSlugSafe();
      const sellerMarginPct = getSellerMarginPct(storeSlug);

      const cart = Cart.read();
      const totals = Cart.totals(); // { mode, items, net, vat, gross, ... }

      const items = (cart?.items || []).map(it => ({
        id: String(it.id || ""),
        name: String(it.name || ""),
        sku: String(it.sku || ""),
        supplier: String(it.supplier || ""),
        qty: Number(it.qty || 0) || 0,
        unit: String(it.unit || "szt"),
        buyNet: Number(it.buyNet || 0) || 0,
        priceRetail: Number(it.priceRetail || 0) || 0,
        priceB2B: Number(it.priceB2B || 0) || 0
      }));

      const platformFeeGross = totals.gross * PLATFORM_FEE_PCT;
      const sellerMarginGross = totals.gross * sellerMarginPct;

      // “sellerRevenueGross” = obrót sklepu po prowizji platformy (do KPI),
      // a “sellerMarginGross” traktujemy jako marżę (MVP, uproszczone).
      const sellerRevenueGross = totals.gross - platformFeeGross;

      const order = {
        id: uid(),
        createdAt: new Date().toISOString(),
        storeSlug,
        totals: {
          mode: totals.mode,
          items: totals.items,
          net: totals.net,
          vat: totals.vat,
          gross: totals.gross
        },
        fees: {
          platformFeePct: PLATFORM_FEE_PCT,
          platformFeeGross,
          sellerMarginPct,
          sellerMarginGross,
          sellerRevenueGross
        },
        supplierBreakdown: computeSupplierBreakdown(items, totals.mode),
        cartSnapshot: items,
        meta: meta || {}
      };

      const arr = this.list();
      arr.unshift(order);
      // ogranicz rozmiar (MVP)
      if (arr.length > 500) arr.length = 500;

      writeJSON(LS_ORDERS, arr);
      window.dispatchEvent(new CustomEvent("qm:orders"));

      return { ok: true, order };
    },

    fmtMoney: money
  };

  window.QM_ORDERS = Orders;
})();
