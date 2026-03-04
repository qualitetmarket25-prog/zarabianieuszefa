// js/hurtownie.js — PANCERNY IMPORT CSV + obsługa przycisku "Analizuj hurtownię"
(() => {
  "use strict";

  const LS_PRODUCTS_BY_SUPPLIER = "qm_products_by_supplier_v1";

  // ---------- UTIL ----------
  const $ = (sel, root = document) => root.querySelector(sel);

  function toast(msg) {
    alert(msg);
  }

  function toNumber(v) {
    if (v === null || v === undefined) return 0;
    if (typeof v === "number") return isFinite(v) ? v : 0;
    return parseFloat(String(v).replace(",", ".").replace(/[^\d.]/g, "")) || 0;
  }

  // Prosty CSV parser: obsługuje przecinki i średniki + cudzysłowy
  function parseCSV(text) {
    const lines = text.replace(/\r/g, "").split("\n").filter(Boolean);
    if (!lines.length) return { headers: [], rows: [] };

    const delim = detectDelimiter(lines[0]);
    const headers = splitLine(lines[0], delim).map(h => norm(h));

    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = splitLine(lines[i], delim);
      if (!cols.length) continue;

      const obj = {};
      headers.forEach((h, idx) => (obj[h] = (cols[idx] ?? "").trim()));
      rows.push(obj);
    }
    return { headers, rows };
  }

  function detectDelimiter(headerLine) {
    const comma = (headerLine.match(/,/g) || []).length;
    const semi = (headerLine.match(/;/g) || []).length;
    return semi > comma ? ";" : ",";
  }

  function splitLine(line, delim) {
    const out = [];
    let cur = "";
    let inQ = false;

    for (let i = 0; i < line.length; i++) {
      const ch = line[i];

      if (ch === '"') {
        inQ = !inQ;
        continue;
      }

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

  function norm(s) {
    return String(s || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[ąćęłńóśźż]/g, (m) => ({
        "ą":"a","ć":"c","ę":"e","ł":"l","ń":"n","ó":"o","ś":"s","ź":"z","ż":"z"
      }[m] || m));
  }

  function pick(obj, keys) {
    for (const k of keys) {
      if (obj[k] !== undefined && obj[k] !== null && String(obj[k]).trim() !== "") return obj[k];
    }
    return "";
  }

  function mapProduct(row) {
    // Najczęstsze nazwy kolumn w PL/EN
    const name = pick(row, ["name","nazwa","product","produkt","title","opis"]) || "produkt";

    // cena: łapiemy różne warianty
    const priceNetRaw = pick(row, [
      "price_net","cena_netto","netto","net_price","cena",
      "price","unit_price","cena_zakupu","buy_price"
    ]);
    const price_net = toNumber(priceNetRaw);

    const stockRaw = pick(row, ["stock","stan","qty","ilosc","ilosc_szt","quantity"]);
    const stock = Math.max(0, Math.floor(toNumber(stockRaw)));

    const ean = pick(row, ["ean","gtin","barcode","kod_ean"]);
    const sku = pick(row, ["sku","symbol","kod","index"]);

    return { name: String(name).trim(), price_net, stock, ean: String(ean||"").trim(), sku: String(sku||"").trim() };
  }

  function saveSupplierProducts(supplierName, products) {
    const db = JSON.parse(localStorage.getItem(LS_PRODUCTS_BY_SUPPLIER) || "{}");
    db[supplierName] = products;
    localStorage.setItem(LS_PRODUCTS_BY_SUPPLIER, JSON.stringify(db));
  }

  // ---------- GŁÓWNY HANDLER ----------
  async function analyzeFromUI() {
    const fileInput = $("#csvFile") || $('input[type="file"]');
    if (!fileInput || !fileInput.files || !fileInput.files[0]) {
      toast("Wybierz plik CSV.");
      return;
    }

    const supplierNameInput = $("#supplierName");
    const supplier = (supplierNameInput?.value || "GastroPRO").trim() || "GastroPRO";

    const file = fileInput.files[0];
    const text = await file.text();

    const { rows } = parseCSV(text);
    const products = rows.map(mapProduct).filter(p => p.name && p.name !== "produkt");

    // JEŚLI CENY SĄ 0 — to znaczy, że CSV ma inną kolumnę z ceną.
    const nonZero = products.filter(p => p.price_net > 0).length;

    saveSupplierProducts(supplier, products);

    toast(`Zaimportowano ${products.length} produktów (${nonZero} z ceną > 0).`);

    // od razu budujemy katalog sklepu, jeśli istnieje
    try {
      // odpalenie catalog.js przez przejście na sklep nie jest konieczne,
      // ale zostawiamy hint
      console.log("Import OK. Otwórz sklep i zrób CTRL+F5.");
    } catch {}
  }

  // ---------- PODPINANIE PRZYCISKU (NAPRAWA) ----------
  function bindAnalyzeButton() {
    // 1) preferowany ID
    const btn = $("#qmAnalyzeBtn");
    if (btn) {
      btn.addEventListener("click", (e) => { e.preventDefault(); analyzeFromUI(); });
      return true;
    }

    // 2) fallback: szukamy przycisku po tekście
    const buttons = Array.from(document.querySelectorAll("button, a"));
    const match = buttons.find(b => (b.textContent || "").toLowerCase().includes("analizuj hurtown"));
    if (match) {
      match.addEventListener("click", (e) => { e.preventDefault(); analyzeFromUI(); });
      return true;
    }

    return false;
  }

  // Start
  document.addEventListener("DOMContentLoaded", () => {
    const ok = bindAnalyzeButton();
    if (!ok) {
      console.warn("Nie znaleziono przycisku 'Analizuj hurtownię' — sprawdź ID na stronie hurtownie.html");
    }
  });

})();
