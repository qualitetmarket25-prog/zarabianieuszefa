// js/catalog.js — QualitetMarket
// Buduje katalog sklepu z marżą detal + hurt (B2B)

(() => {
  "use strict";

  const suppliers = JSON.parse(localStorage.getItem("qm_products_by_supplier_v1") || "{}");

  // ==== Twoje marże (zmieniasz tylko tu) ====
  const DEFAULT_MARGIN_RETAIL_PCT = 120;    // detal: +120% (x2.20)
  const DEFAULT_MARGIN_WHOLESALE_PCT = 60;  // hurt: +60% (x1.60)

  const MIN_ADD_RETAIL = 3.00;     // minimalny narzut detal +3 zł
  const MIN_ADD_WHOLESALE = 1.50;  // minimalny narzut hurt +1.5 zł

  const PSYCHO_PRICING = true;     // 19.99 itp.
  // =========================================

  const catalog = [];

  Object.keys(suppliers).forEach((supplier) => {
    const arr = Array.isArray(suppliers[supplier]) ? suppliers[supplier] : [];
    arr.forEach((p) => {
      const name = String(p?.name || p?.title || "produkt").trim();

      // Cena bazowa (najczęściej NETTO z hurtowni)
      const base = toNumber(
        p?.price_net ?? p?.price_wholesale ?? p?.price_buy ?? p?.price ?? p?.amount ?? p?.price_sell
      );

      // Marża per produkt (opcjonalnie w CSV):
      // margin (detal), margin_retail_pct, margin_wholesale_pct
      const marginRetailPct = pickPct(
        p?.margin_retail_pct ?? p?.margin ?? DEFAULT_MARGIN_RETAIL_PCT,
        DEFAULT_MARGIN_RETAIL_PCT
      );
      const marginWholesalePct = pickPct(
        p?.margin_wholesale_pct ?? DEFAULT_MARGIN_WHOLESALE_PCT,
        DEFAULT_MARGIN_WHOLESALE_PCT
      );

      const retail = calcSellPrice(base, marginRetailPct, MIN_ADD_RETAIL, PSYCHO_PRICING);
      const wholesale = calcSellPrice(base, marginWholesalePct, MIN_ADD_WHOLESALE, PSYCHO_PRICING);

      catalog.push({
        id: stableId(supplier, name, p?.ean || p?.sku || p?.id),
        name,
        supplier,
        category: autoCategory(name),

        // ceny
        price_base: round2(base),
        price_retail: retail,
        price_wholesale: wholesale,

        // meta
        ean: String(p?.ean || "").trim(),
        sku: String(p?.sku || "").trim(),
        stock: toInt(p?.stock ?? p?.qty ?? 0),
        moq: toInt(p?.moq ?? 1),
        unit: String(p?.unit || "").trim(),
        pack: toInt(p?.pack ?? p?.pack_qty ?? 1),

        // marże
        margin_retail_pct: marginRetailPct,
        margin_wholesale_pct: marginWholesalePct
      });
    });
  });

  localStorage.setItem("qm_catalog_v1", JSON.stringify(catalog));

  // ===== helpers =====
  function toNumber(v) {
    if (v === null || v === undefined) return 0;
    if (typeof v === "number") return isFinite(v) ? v : 0;
    const s = String(v).replace(",", ".").replace(/[^\d.]/g, "");
    const n = parseFloat(s);
    return isFinite(n) ? n : 0;
  }

  function toInt(v) {
    const n = Math.floor(toNumber(v));
    return isFinite(n) ? n : 0;
  }

  function round2(n) {
    return Math.round((toNumber(n) + Number.EPSILON) * 100) / 100;
  }

  function pickPct(v, fallback) {
    const n = toNumber(v);
    if (!isFinite(n) || n < 0) return fallback;
    // jeśli ktoś poda 2.2 zamiast 120 — traktujemy jako mnożnik
    if (n > 0 && n < 10) return Math.round((n - 1) * 100);
    return n;
  }

  function calcSellPrice(base, marginPct, minAdd, psycho) {
    base = toNumber(base);
    if (base <= 0) return 0;

    let price = base * (1 + (marginPct / 100)); // base + %
    const minPrice = base + toNumber(minAdd);   // base + min kwota

    if (price < minPrice) price = minPrice;
    price = round2(price);

    if (!psycho) return price;

    if (price >= 10) {
      const whole = Math.floor(price);
      return round2(whole + 0.99);
    }
    return price;
  }

  function stableId(supplier, name, extra) {
    const raw = `${supplier}__${name}__${extra || ""}`.toLowerCase();
    let h = 0;
    for (let i = 0; i < raw.length; i++) h = (h * 31 + raw.charCodeAt(i)) >>> 0;
    return "p_" + h.toString(36);
  }

  function autoCategory(name) {
    const n = String(name || "").toLowerCase();

    if (n.includes("work") || n.includes("folia") || n.includes("próżni") || n.includes("zgrzew")) return "pakowanie";
    if (n.includes("kubek") || n.includes("tack") || n.includes("pojemn") || n.includes("papier") || n.includes("torb")) return "opakowania";
    if (n.includes("nóż") || n.includes("tasak") || n.includes("stal") || n.includes("ostr")) return "noże i narzędzia";
    if (n.includes("maszyn") || n.includes("młynek") || n.includes("nadziew") || n.includes("wilki")) return "maszyny";
    if (n.includes("rękaw") || n.includes("bhp") || n.includes("fartuch") || n.includes("czepek")) return "bhp";
    if (n.includes("przypraw") || n.includes("pekl") || n.includes("jelit") || n.includes("osłonk")) return "masarnia";

    return "inne";
  }
})();
