// js/hurtownie.js — IMPORT CSV + auto-marża (buyNet -> priceRetail/priceB2B)
// Zapewnia window.processCSV() dla hurtownie.html
(() => {
  "use strict";

  const LS_PRODUCTS_BY_SUPPLIER = "qm_products_by_supplier_v1";

  // ---------- helpers ----------
  const $ = (sel, root = document) => root.querySelector(sel);

  function norm(s) {
    return String(s || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[ąćęłńóśźż]/g, (m) => ({
        "ą":"a","ć":"c","ę":"e","ł":"l","ń":"n","ó":"o","ś":"s","ź":"z","ż":"z"
      }[m] || m));
  }

  function toNumber(v) {
    if (v === null || v === undefined) return 0;
    if (typeof v === "number") return isFinite(v) ? v : 0;
    const s = String(v).replace(",", ".").replace(/[^\d.]/g, "");
    const n = parseFloat(s);
    return isFinite(n) ? n : 0;
  }

  function detectDelimiter(headerLine) {
    const comma = (headerLine.match(/,/g) || []).length;
    const semi  = (headerLine.match(/;/g) || []).length;
    return semi > comma ? ";" : ",";
  }

  // CSV split z obsługą cudzysłowów
  function splitLine(line, delim) {
    const out = [];
    let cur = "";
    let inQ = false;

    for (let i = 0; i < line.length; i++) {
      const ch = line[i];

      if (ch === '"') { inQ = !inQ; continue; }

      if (!inQ && ch === delim) {
        out.push(cur);
        cur = "";
      } else {
        cur += ch;
      }
    }
    out.push(cur);
    return out.map(s => s.trim());
  }

  function parseCSV(text) {
    const lines = String(text || "").replace(/\r/g, "").split("\n").filter(l => l.trim().length);
    if (!lines.length) return { headers: [], rows: [] };

    const delim = detectDelimiter(lines[0]);
    const headers = splitLine(lines[0], delim).map(h => norm(h));

    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = splitLine(lines[i], delim);
      if (!cols.length) continue;

      const obj = {};
      headers.forEach((h, idx) => obj[h] = (cols[idx] ?? "").trim());
      rows.push(obj);
    }
    return { headers, rows };
  }

  function pick(row, keys) {
    for (const k of keys) {
      const v = row[k];
      if (v !== undefined && v !== null && String(v).trim() !== "") return v;
    }
    return "";
  }

  // ===== marża: korzystamy z globali wpiętych przez sklep.html
  const getPricingRules = () => {
    const cfg = window.QM_CONFIG && window.QM_CONFIG.pricing ? window.QM_CONFIG.pricing : null;
    return cfg || {
      retailPct: 0.08,
      wholesalePct: 0.05,
      minProfit: 1.5,
      retailEnds99: true
    };
  };

  const priceFromBuySafe = (buyNet, mode) => {
    const buy = toNumber(buyNet);
    if (buy <= 0) return 0;

    // jeśli pricing.js jest dostępny (przez sklep.html) -> liczymy automatycznie
    if (window.QM_PRICE && typeof window.QM_PRICE.priceFromBuy === "function") {
      return window.QM_PRICE.priceFromBuy(buy, mode, getPricingRules());
    }

    // fallback prosto (jakby ktoś odpalił import zanim wejdzie w sklep)
    const r = getPricingRules();
    const pct = (mode === "hurt") ? (Number(r.wholesalePct ?? 0.05)) : (Number(r.retailPct ?? 0.08));
    const minProfit = Number(r.minProfit ?? 0);

    let sell = buy * (1 + pct);
    if (sell < buy + minProfit) sell = buy + minProfit;

    // detal końcówka .99
    if (mode !== "hurt" && r.retailEnds99) {
      const zl = Math.floor(sell);
      sell = zl + 0.99;
    } else {
      sell = Math.round((sell + Number.EPSILON) * 100) / 100;
    }
    return sell;
  };

  function mapProduct(row, supplierName) {
    const name = pick(row, ["name","nazwa","produkt","product","title","opis"]) || "produkt";

    // buyNet: próbujemy znaleźć pole typowo zakupowe/netto
    const buyRaw = pick(row, [
      "buy_net","buyNet","cena_zakupu_netto","cena_zakupu","zakup_netto","koszt_netto","cost_net","cost",
      "price_net","cena_netto","netto","net_price","net",
      "hurt_netto","wholesale_net","purchase_net"
    ]);

    // fallback: jeśli ktoś ma tylko jedną cenę w CSV, bierzemy ją jako buyNet (najbezpieczniej)
    const onePriceRaw = pick(row, ["price","cena","unit_price","unitprice"]);

    const buyNet = toNumber(buyRaw) || toNumber(onePriceRaw) || 0;

    const stockRaw = pick(row, ["stock","stan","qty","ilosc","quantity"]);
    const moqRaw = pick(row, ["moq","minimum","min","min_qty","min_ilosc"]);

    const category = pick(row, ["category","kategoria","cat","dzial","grupa"]) || "";
    const unit = pick(row, ["unit","jm","jednostka","uom"]) || "szt";

    const ean = String(pick(row, ["ean","gtin","barcode","kod_ean"]) || "").trim();
    const sku = String(pick(row, ["sku","symbol","kod","index"]) || "").trim();

    // ✅ liczymy ceny sprzedażowe automatycznie
    const priceRetail = buyNet > 0 ? priceFromBuySafe(buyNet, "detal") : 0;
    const priceB2B = buyNet > 0 ? priceFromBuySafe(buyNet, "hurt") : 0;

    return {
      name: String(name).trim(),
      supplier: String(supplierName || "").trim(),

      // źródłowe identyfikatory
      ean,
      sku,

      // metadane
      category,
      unit,
      moq: Math.max(1, Math.floor(toNumber(moqRaw) || 1)),
      stock: Math.max(0, Math.floor(toNumber(stockRaw))),

      // ✅ kluczowe pola pod marżę
      buyNet,

      // ✅ ceny finalne dla sklepu
      priceRetail,
      priceB2B
    };
  }

  function saveSupplier(supplierName, products) {
    const db = JSON.parse(localStorage.getItem(LS_PRODUCTS_BY_SUPPLIER) || "{}");
    db[supplierName] = products;
    localStorage.setItem(LS_PRODUCTS_BY_SUPPLIER, JSON.stringify(db));
  }

  // ---------- PUBLIC API: processCSV() ----------
  window.processCSV = async function processCSV() {
    try {
      const fileInput = $("#csvFile") || $('input[type="file"]');

      if (!fileInput || !fileInput.files || !fileInput.files[0]) {
        alert("Wybierz plik CSV.");
        return;
      }

      const supplier =
        ($("#supplierName")?.value || "GastroPRO").trim() || "GastroPRO";

      const text = await fileInput.files[0].text();
      const { rows } = parseCSV(text);

      const products = rows
        .map(r => mapProduct(r, supplier))
        .filter(p => p.name && p.name !== "produkt");

      const withBuy = products.filter(p => p.buyNet > 0).length;
      const withRetail = products.filter(p => p.priceRetail > 0).length;
      const withB2B = products.filter(p => p.priceB2B > 0).length;

      saveSupplier(supplier, products);

      alert(
        `Zaimportowano ${products.length} produktów.\n` +
        `buyNet>0: ${withBuy}\n` +
        `priceRetail>0: ${withRetail}\n` +
        `priceB2B>0: ${withB2B}\n\n` +
        `Wejdź na sklep i zrób CTRL+F5.`
      );

      console.log("Import OK:", { supplier, count: products.length, withBuy, withRetail, withB2B });

    } catch (e) {
      console.error(e);
      alert("Błąd importu CSV. Otwórz konsolę i podeślij błąd.");
    }
  };

})();
