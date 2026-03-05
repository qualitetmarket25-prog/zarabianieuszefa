(() => {
  "use strict";

  const LS_CART = "qm_shop_cart_v1";
  const LS_MODE = "qm_shop_mode_v1"; // retail | b2b
  const LS_B2B_DISCOUNT = "qm_shop_b2b_discount_v1";
  const LS_ORDER_NOTE = "qm_shop_order_note_v1";
  const LS_B2B_PROFILE = "qm_shop_b2b_profile_v1";

  const VAT_RATE = 0.23;

  const money = (n) => {
    const v = Number(n || 0);
    return v.toLocaleString("pl-PL", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " zł";
  };

  const clampInt = (v, min, max) => {
    const x = Math.floor(Number(v));
    if (!Number.isFinite(x)) return min;
    return Math.max(min, Math.min(max, x));
  };

  const num = (v) => {
    const n = Number(String(v ?? "").replace(",", "."));
    return Number.isFinite(n) ? n : 0;
  };

  const round2 = (x) => Math.round((Number(x || 0) + Number.EPSILON) * 100) / 100;

  const readJSON = (k, fallback) => {
    try { return JSON.parse(localStorage.getItem(k) || ""); } catch { return fallback; }
  };

  const writeJSON = (k, v) => localStorage.setItem(k, JSON.stringify(v));

  const Cart = {
    getMode() {
      return (localStorage.getItem(LS_MODE) || "retail").toLowerCase() === "b2b" ? "b2b" : "retail";
    },
    setMode(mode) {
      localStorage.setItem(LS_MODE, (mode === "b2b" ? "b2b" : "retail"));
      window.dispatchEvent(new CustomEvent("qm:cart"));
    },

    read() {
      const x = readJSON(LS_CART, { items: [] });
      if (!x || !Array.isArray(x.items)) return { items: [] };
      return x;
    },
    write(cart) {
      writeJSON(LS_CART, cart);
      window.dispatchEvent(new CustomEvent("qm:cart"));
    },

    count() {
      const c = this.read();
      return c.items.reduce((a, it) => a + (Number(it.qty) || 0), 0);
    },

    upsert(product, qtyAdd = 1) {
      const qty = clampInt(qtyAdd, 1, 999999);
      const cart = this.read();

      const id = String(product.id || product.sku || product.name || "").trim();
      if (!id) return;

      const idx = cart.items.findIndex(x => String(x.id) === id);

      // ✅ Trzymamy buyNet (przyda się do zamówień do hurtowni)
      const base = {
        id,
        name: product.name || "Produkt",
        sku: product.sku || id,
        unit: product.unit || "szt",
        supplier: product.supplier || "",
        category: product.category || "",
        image: product.image || "",
        moq: Number(product.moq || 1) || 1,

        buyNet: num(product.buyNet || product.costNet || product.netto || 0),

        // ✅ ceny finalne (sprzedażowe) już policzone w shop.js
        // DETAL: brutto
        priceRetail: num(product.priceRetail || product.price || 0),

        // B2B: netto
        priceB2B: num(product.priceB2B || product.priceB2BNet || product.priceWholesale || 0)
      };

      if (idx === -1) {
        cart.items.push({ ...base, qty: qty });
      } else {
        cart.items[idx] = {
          ...cart.items[idx],
          ...base,
          qty: clampInt((cart.items[idx].qty || 0) + qty, 1, 999999)
        };
      }
      this.write(cart);
    },

    setQty(id, qty) {
      const cart = this.read();
      const idx = cart.items.findIndex(x => String(x.id) === String(id));
      if (idx === -1) return;

      const q = clampInt(qty, 0, 999999);
      if (q <= 0) cart.items.splice(idx, 1);
      else cart.items[idx].qty = q;

      this.write(cart);
    },

    clear() {
      this.write({ items: [] });
    },

    // ===== SUMY (spójne z trybem) =====
    // B2B: ceny = NETTO
    // DETAL: ceny = BRUTTO (liczymy netto i VAT z brutto)
    totals() {
      const mode = this.getMode();
      const cart = this.read();

      const discountPct = num(localStorage.getItem(LS_B2B_DISCOUNT) || 0);
      const discount = (mode === "b2b") ? Math.max(0, Math.min(50, discountPct)) / 100 : 0;

      let items = 0;
      let net = 0;
      let vat = 0;
      let gross = 0;
      let moqOk = true;

      for (const it of cart.items) {
        const qty = num(it.qty || 0);
        items += qty;

        const moq = num(it.moq || 1) || 1;
        if (mode === "b2b" && qty < moq) moqOk = false;

        if (mode === "b2b") {
          // B2B: priceB2B to NETTO
          const priceNet = num(it.priceB2B || 0);
          const lineNet = qty * priceNet;
          const lineVat = lineNet * VAT_RATE;
          const lineGross = lineNet + lineVat;

          net += lineNet;
          vat += lineVat;
          gross += lineGross;
        } else {
          // DETAL: priceRetail to BRUTTO
          const priceGross = num(it.priceRetail || 0);
          const lineGross = qty * priceGross;
          const lineNet = lineGross / (1 + VAT_RATE);
          const lineVat = lineGross - lineNet;

          gross += lineGross;
          net += lineNet;
          vat += lineVat;
        }
      }

      // rabat tylko w B2B (netto + vat/gross przeliczone po rabacie)
      if (discount > 0 && mode === "b2b") {
        net = net * (1 - discount);
        vat = net * VAT_RATE;
        gross = net + vat;
      }

      return {
        mode,
        items,
        net: round2(net),
        vat: round2(vat),
        gross: round2(gross),
        moqOk,
        discountPct: round2(discount * 100)
      };
    },

    // B2B profil
    getB2BProfile() {
      return readJSON(LS_B2B_PROFILE, { companyName:"", nip:"", addr:"", contact:"" });
    },
    setB2BProfile(p) {
      writeJSON(LS_B2B_PROFILE, p || {});
    },

    getNote() { return localStorage.getItem(LS_ORDER_NOTE) || ""; },
    setNote(v) { localStorage.setItem(LS_ORDER_NOTE, String(v || "")); },

    getDiscount() { return num(localStorage.getItem(LS_B2B_DISCOUNT) || 0); },
    setDiscount(v) { localStorage.setItem(LS_B2B_DISCOUNT, String(num(v || 0))); }
  };

  window.QM_SHOP = { Cart, money };
})();
