// js/hurtownie.js — FIX: zapewnia window.processCSV() dla hurtownie.html
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

  function mapProduct(row) {
    const name = pick(row, ["name","nazwa","produkt","product","title","opis"]) || "produkt";

    const priceRaw = pick(row, [
      "price_net","cena_netto","netto","net_price",
      "price","cena","unit_price","buy_price","cena_zakupu"
    ]);

    const stockRaw = pick(row, ["stock","stan","qty","ilosc","quantity"]);

    return {
      name: String(name).trim(),
      price_net: toNumber(priceRaw),
      stock: Math.max(0, Math.floor(toNumber(stockRaw))),
      ean: String(pick(row, ["ean","gtin","barcode","kod_ean"]) || "").trim(),
      sku: String(pick(row, ["sku","symbol","kod","index"]) || "").trim(),
    };
  }

  function saveSupplier(supplierName, products) {
    const db = JSON.parse(localStorage.getItem(LS_PRODUCTS_BY_SUPPLIER) || "{}");
    db[supplierName] = products;
    localStorage.setItem(LS_PRODUCTS_BY_SUPPLIER, JSON.stringify(db));
  }

  // ---------- PUBLIC API: processCSV() ----------
  // hurtownie.html woła to onclickiem — MUSI być globalnie.
  window.processCSV = async function processCSV() {
    try {
      const fileInput =
        $("#csvFile") ||
        $('input[type="file"]');

      if (!fileInput || !fileInput.files || !fileInput.files[0]) {
        alert("Wybierz plik CSV.");
        return;
      }

      const supplier =
        ($("#supplierName")?.value || "GastroPRO").trim() || "GastroPRO";

      const text = await fileInput.files[0].text();
      const { rows } = parseCSV(text);

      const products = rows
        .map(mapProduct)
        .filter(p => p.name && p.name !== "produkt");

      const withPrice = products.filter(p => p.price_net > 0).length;

      saveSupplier(supplier, products);

      alert(`Zaimportowano ${products.length} produktów (${withPrice} z ceną > 0).`);

      // opcjonalnie: odśwież ranking tabel, jeśli istnieją elementy
      // (nie wymagane do działania sklepu)
      console.log("Import OK. Teraz wejdź na sklep i zrób CTRL+F5.");

    } catch (e) {
      console.error(e);
      alert("Błąd importu CSV. Otwórz konsolę i podeślij błąd.");
    }
  };

})();
