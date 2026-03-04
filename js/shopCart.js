(() => {
  "use strict";

  const LS_CART = "qm_shop_cart_v1";
  const LS_MODE = "qm_shop_mode_v1"; // retail | b2b
  const LS_B2B_DISCOUNT = "qm_shop_b2b_discount_v1";
  const LS_ORDER_NOTE = "qm_shop_order_note_v1";
  const LS_B2B_PROFILE = "qm_shop_b2b_profile_v1";

  const money = (n) => {
    const v = Number(n || 0);
    return v.toLocaleString("pl-PL", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " zł";
  };

  const clampInt = (v, min, max) => {
    const x = Math.floor(Number(v));
    if (!Number.isFinite(x)) return min;
    return Math.max(min, Math.min(max, x));
  };

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
      const base = {
        id,
        name: product.name || "Produkt",
        sku: product.sku || id,
        unit: product.unit || "szt",
        supplier: product.supplier || "",
        category: product.category || "",
        image: product.image || "",
        moq: Number(product.moq || 1) || 1,

        // ceny już “z marżą” — przyjmujemy, że product.priceRetail / priceB2B są finalne
        priceRetail: Number(product.priceRetail || product.price || 0) || 0,
        priceB2B: Number(product.priceB2B || product.priceB2BNet || product.priceWholesale || 0) || 0
      };

      if (idx === -1) {
        cart.items.push({ ...base, qty: qty });
      } else {
        cart.items[idx] = { ...cart.items[idx], ...base, qty: clampInt((cart.items[idx].qty || 0) + qty, 1, 999999) };
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

    // sumy
    totals() {
      const mode = this.getMode();
      const cart = this.read();

      const discountPct = Number(localStorage.getItem(LS_B2B_DISCOUNT) || 0) || 0;
      const discount = (mode === "b2b") ? Math.max(0, Math.min(50, discountPct)) / 100 : 0;

      let items = 0;
      let net = 0;
      let moqOk = true;

      for (const it of cart.items) {
        const qty = Number(it.qty || 0) || 0;
        items += qty;

        const moq = Number(it.moq || 1) || 1;
        if (mode === "b2b" && qty < moq) moqOk = false;

        const price = (mode === "b2b" ? (Number(it.priceB2B || 0) || 0) : (Number(it.priceRetail || 0) || 0));
        net += qty * price;
      }

      if (discount > 0) net = net * (1 - discount);

      const vat = net * 0.23;      // orientacyjnie
      const gross = net + vat;

      return { mode, items, net, vat, gross, moqOk, discountPct: (discount * 100) };
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

    getDiscount() { return Number(localStorage.getItem(LS_B2B_DISCOUNT) || 0) || 0; },
    setDiscount(v) { localStorage.setItem(LS_B2B_DISCOUNT, String(Number(v||0) || 0)); }
  };

  window.QM_SHOP = { Cart, money };
})();
