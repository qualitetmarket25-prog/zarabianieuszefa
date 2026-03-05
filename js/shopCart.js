(() => {
  "use strict";

  // ===== store context (multi-store) =====
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
    // 1) aktywny sklep ustawiony przez shop.js
    const active = slugify(localStorage.getItem("qm_active_store_v1") || "");
    if (active) return active;

    // 2) parametr URL (działa też na koszyku, jeśli link ma ?store=...)
    try {
      const u = new URL(window.location.href);
      const s = slugify(u.searchParams.get("store") || "");
      if (s) return s;
    } catch {}

    // 3) panel fallback
    const panel = slugify(localStorage.getItem("qm_store_slug") || "");
    if (panel) return panel;

    // 4) domyślny sklep
    return "default";
  };

  const STORE = getStoreSlug();

  // ===== per-store keys =====
  // Koszyk / rabat / notatka / profil B2B są per sklep.
  const LS_CART_BASE        = "qm_shop_cart_v1";
  const LS_B2B_DISCOUNT_BASE= "qm_shop_b2b_discount_v1";
  const LS_ORDER_NOTE_BASE  = "qm_shop_order_note_v1";
  const LS_B2B_PROFILE_BASE = "qm_shop_b2b_profile_v1";

  // Tryb cen zostawiamy globalnie (preferencja UI)
  const LS_MODE = "qm_shop_mode_v1"; // retail | b2b

  const K = (base) => `${base}__${STORE}`;

  const LS_CART         = K(LS_CART_BASE);
  const LS_B2B_DISCOUNT = K(LS_B2B_DISCOUNT_BASE);
  const LS_ORDER_NOTE   = K(LS_ORDER_NOTE_BASE);
  const LS_B2B_PROFILE  = K(LS_B2B_PROFILE_BASE);

  // ===== migration (bezpieczne) =====
  // Jeśli ktoś miał stary koszyk globalny, to przenosimy go do "default" (tylko raz).
  const migrateOnce = () => {
    try {
      // migrujemy tylko dla default, żeby nie mieszać innych sklepów
      if (STORE !== "default") return;

      const hasNew = !!localStorage.getItem(LS_CART);
      const hasOld = !!localStorage.getItem(LS_CART_BASE);
      if (!hasNew && hasOld) {
        localStorage.setItem(LS_CART, localStorage.getItem(LS_CART_BASE));
      }

      const hasNewDisc = !!localStorage.getItem(LS_B2B_DISCOUNT);
      const hasOldDisc = !!localStorage.getItem(LS_B2B_DISCOUNT_BASE);
      if (!hasNewDisc && hasOldDisc) {
        localStorage.setItem(LS_B2B_DISCOUNT, localStorage.getItem(LS_B2B_DISCOUNT_BASE));
      }

      const hasNewNote = !!localStorage.getItem(LS_ORDER_NOTE);
      const hasOldNote = !!localStorage.getItem(LS_ORDER_NOTE_BASE);
      if (!hasNewNote && hasOldNote) {
        localStorage.setItem(LS_ORDER_NOTE, localStorage.getItem(LS_ORDER_NOTE_BASE));
      }

      const hasNewProf = !!localStorage.getItem(LS_B2B_PROFILE);
      const hasOldProf = !!localStorage.getItem(LS_B2B_PROFILE_BASE);
      if (!hasNewProf && hasOldProf) {
        localStorage.setItem(LS_B2B_PROFILE, localStorage.getItem(LS_B2B_PROFILE_BASE));
      }
    } catch {}
  };
  migrateOnce();

  // ===== helpers =====
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

  // ===== Cart API =====
  const Cart = {
    // store info (przydaje się w UI / debug)
    getStore() { return STORE; },

    // tryb globalny
    getMode() {
      return (localStorage.getItem(LS_MODE) || "retail").toLowerCase() === "b2b" ? "b2b" : "retail";
    },
    setMode(mode) {
      localStorage.setItem(LS_MODE, (mode === "b2b" ? "b2b" : "retail"));
      window.dispatchEvent(new CustomEvent("qm:cart"));
    },

    // koszyk per sklep
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

        // ✅ przydaje się do dropship split / raportów
        buyNet: Number(product.buyNet || 0) || 0,

        // ceny już policzone (albo fallback)
        priceRetail: Number(product.priceRetail || product.price || 0) || 0,
        priceB2B: Number(product.priceB2B || product.priceB2BNet || product.priceWholesale || 0) || 0
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

      const vat = net * 0.23; // orientacyjnie
      const gross = net + vat;

      return { mode, items, net, vat, gross, moqOk, discountPct: (discount * 100) };
    },

    // B2B profil per sklep
    getB2BProfile() {
      return readJSON(LS_B2B_PROFILE, { companyName:"", nip:"", addr:"", contact:"" });
    },
    setB2BProfile(p) {
      writeJSON(LS_B2B_PROFILE, p || {});
    },

    // notatka per sklep
    getNote() { return localStorage.getItem(LS_ORDER_NOTE) || ""; },
    setNote(v) { localStorage.setItem(LS_ORDER_NOTE, String(v || "")); },

    // rabat per sklep
    getDiscount() { return Number(localStorage.getItem(LS_B2B_DISCOUNT) || 0) || 0; },
    setDiscount(v) { localStorage.setItem(LS_B2B_DISCOUNT, String(Number(v||0) || 0)); }
  };

  window.QM_SHOP = { Cart, money };
})();
