(function () {
  const path = window.location.pathname.toLowerCase();
  if (!path.includes("panel-sklepu")) return;

  const KEY_PLAN = "qm_user_plan_v1";
  const KEY_MARGIN = "qm_store_margin_pct";
  const KEY_PRODUCTS = "qm_products_by_supplier_v1";

  function read(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      return value === null ? fallback : value;
    } catch (e) {
      return fallback;
    }
  }

  function write(key, value) {
    localStorage.setItem(key, value);
  }

  function getPlan() {
    const raw = String(read(KEY_PLAN, "basic") || "basic").toLowerCase();

    if (["elite", "elita"].includes(raw)) return "elite";
    if (["pro", "zawodowiec"].includes(raw)) return "pro";
    return "basic";
  }

  function getDefaultMarginByPlan(plan) {
    if (plan === "elite") return 0.24;
    if (plan === "pro") return 0.18;
    return 0.12;
  }

  function normalizeMarginValue(value) {
    const num = parseFloat(String(value).replace(",", "."));
    if (!Number.isFinite(num)) return null;

    if (num > 1) return num / 100;
    if (num < 0) return null;

    return num;
  }

  function getMargin() {
    const plan = getPlan();
    const saved = normalizeMarginValue(read(KEY_MARGIN, ""));
    return saved !== null ? saved : getDefaultMarginByPlan(plan);
  }

  function setMargin(value) {
    const normalized = normalizeMarginValue(value);
    if (normalized === null) return false;
    write(KEY_MARGIN, String(normalized));
    return true;
  }

  function getProductsMap() {
    try {
      const raw = read(KEY_PRODUCTS, "{}");
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch (e) {
      return {};
    }
  }

  function saveProductsMap(map) {
    write(KEY_PRODUCTS, JSON.stringify(map));
  }

  function applyMargin(basePrice) {
    const price = parseFloat(basePrice);
    const margin = getMargin();

    if (!Number.isFinite(price)) return 0;

    return Math.round(price * (1 + margin) * 100) / 100;
  }

  function formatPrice(value) {
    const num = parseFloat(value);
    if (!Number.isFinite(num)) return "0,00 zł";
    return num.toFixed(2).replace(".", ",") + " zł";
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function splitCsvLine(line, delimiter) {
    const result = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const next = line[i + 1];

      if (char === '"') {
        if (inQuotes && next === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
        continue;
      }

      if (char === delimiter && !inQuotes) {
        result.push(current.trim());
        current = "";
        continue;
      }

      current += char;
    }

    result.push(current.trim());
    return result;
  }

  function detectDelimiter(headerLine) {
    const semicolons = (headerLine.match(/;/g) || []).length;
    const commas = (headerLine.match(/,/g) || []).length;
    return semicolons >= commas ? ";" : ",";
  }

  function findColumnIndex(headers, candidates) {
    const normalized = headers.map(function (h) {
      return String(h).trim().toLowerCase();
    });

    for (let i = 0; i < candidates.length; i++) {
      const target = candidates[i];
      const exactIndex = normalized.indexOf(target);
      if (exactIndex !== -1) return exactIndex;
    }

    for (let i = 0; i < normalized.length; i++) {
      const value = normalized[i];
      for (let j = 0; j < candidates.length; j++) {
        if (value.includes(candidates[j])) return i;
      }
    }

    return -1;
  }

  function parsePrice(raw) {
    if (raw === null || raw === undefined) return NaN;

    const cleaned = String(raw)
      .replace(/\s/g, "")
      .replace(/zł/gi, "")
      .replace(/pln/gi, "")
      .replace(",", ".");

    const num = parseFloat(cleaned);
    return Number.isFinite(num) ? num : NaN;
  }

  function parseCsvText(text, supplierName) {
    const cleanText = String(text || "").replace(/\r/g, "").trim();
    if (!cleanText) return [];

    const lines = cleanText
      .split("\n")
      .map(function (line) { return line.trim(); })
      .filter(Boolean);

    if (!lines.length) return [];

    const delimiter = detectDelimiter(lines[0]);
    const headers = splitCsvLine(lines[0], delimiter);

    const nameIndex = findColumnIndex(headers, [
      "name", "nazwa", "produkt", "product", "title", "nazwa produktu"
    ]);

    const priceIndex = findColumnIndex(headers, [
      "price", "cena", "netto", "cena netto", "price_net", "price netto"
    ]);

    const imageIndex = findColumnIndex(headers, [
      "image", "img", "zdjecie", "zdjęcie", "photo", "image_url", "url"
    ]);

    const skuIndex = findColumnIndex(headers, [
      "sku", "kod", "ean", "id", "symbol"
    ]);

    const descIndex = findColumnIndex(headers, [
      "description", "opis", "desc"
    ]);

    if (nameIndex === -1 || priceIndex === -1) return [];

    const products = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = splitCsvLine(lines[i], delimiter);

      const name = cols[nameIndex] ? String(cols[nameIndex]).trim() : "";
      const basePrice = parsePrice(cols[priceIndex]);

      if (!name || !Number.isFinite(basePrice) || basePrice <= 0) continue;

      const product = {
        id: (cols[skuIndex] || (supplierName + "_" + i)).toString().trim(),
        supplier: supplierName,
        name: name,
        description: descIndex !== -1 ? String(cols[descIndex] || "").trim() : "",
        image: imageIndex !== -1 ? String(cols[imageIndex] || "").trim() : "",
        price: Math.round(basePrice * 100) / 100
      };

      products.push(product);
    }

    return products;
  }

  function getAllProductsFlat() {
    const map = getProductsMap();
    const result = [];

    Object.keys(map).forEach(function (supplier) {
      const list = Array.isArray(map[supplier]) ? map[supplier] : [];

      list.forEach(function (product, index) {
        const basePrice = parsePrice(product.price);
        if (!product || !product.name || !Number.isFinite(basePrice)) return;

        result.push({
          id: product.id || (supplier + "_" + index),
          supplier: supplier,
          name: product.name,
          description: product.description || "",
          image: product.image || "",
          basePrice: basePrice,
          finalPrice: applyMargin(basePrice)
        });
      });
    });

    return result;
  }

  function injectStyles() {
    if (document.getElementById("qm-panel-store-styles")) return;

    const style = document.createElement("style");
    style.id = "qm-panel-store-styles";
    style.textContent = `
      .qm-panel-wrap{
        max-width:1180px;
        margin:24px auto;
        padding:16px;
        color:#eef2ff;
      }
      .qm-panel-grid{
        display:grid;
        grid-template-columns:1.1fr 0.9fr;
        gap:18px;
      }
      .qm-card{
        background:linear-gradient(180deg, rgba(10,17,32,0.95), rgba(5,10,20,0.98));
        border:1px solid rgba(110,145,255,0.16);
        border-radius:22px;
        padding:18px;
        box-shadow:0 12px 40px rgba(0,0,0,0.28);
      }
      .qm-title{
        margin:0 0 8px;
        font-size:28px;
        line-height:1.1;
        font-weight:800;
      }
      .qm-sub{
        margin:0 0 18px;
        color:#9fb0d0;
        font-size:14px;
      }
      .qm-row{
        display:grid;
        grid-template-columns:repeat(3, 1fr);
        gap:12px;
        margin-bottom:14px;
      }
      .qm-stat{
        background:rgba(16,28,52,0.8);
        border:1px solid rgba(120,150,255,0.15);
        border-radius:18px;
        padding:14px;
      }
      .qm-label{
        color:#8ea2c8;
        font-size:12px;
        margin-bottom:6px;
      }
      .qm-value{
        font-size:22px;
        font-weight:800;
      }
      .qm-form{
        display:grid;
        gap:12px;
      }
      .qm-field{
        display:grid;
        gap:8px;
      }
      .qm-field label{
        font-size:13px;
        color:#b7c5e0;
      }
      .qm-input, .qm-button{
        width:100%;
        border-radius:16px;
        border:1px solid rgba(132,160,255,0.2);
        background:#0d1730;
        color:#fff;
        padding:14px 15px;
        font-size:15px;
        box-sizing:border-box;
      }
      .qm-input:focus{
        outline:none;
        border-color:#67f0ca;
        box-shadow:0 0 0 3px rgba(103,240,202,0.12);
      }
      .qm-actions{
        display:grid;
        grid-template-columns:1fr 1fr;
        gap:10px;
      }
      .qm-button{
        cursor:pointer;
        font-weight:700;
      }
      .qm-button.primary{
        background:linear-gradient(90deg, #67f0ca, #70d6ff);
        color:#04111f;
        border:none;
      }
      .qm-button.secondary{
        background:#111f3f;
      }
      .qm-note{
        margin-top:10px;
        font-size:13px;
        color:#8ea2c8;
      }
      .qm-status{
        margin-top:12px;
        min-height:22px;
        font-size:14px;
        color:#67f0ca;
      }
      .qm-products{
        display:grid;
        gap:10px;
        max-height:560px;
        overflow:auto;
        padding-right:4px;
      }
      .qm-product{
        display:grid;
        grid-template-columns:1fr auto;
        gap:10px;
        background:rgba(15,25,44,0.85);
        border:1px solid rgba(140,160,255,0.12);
        border-radius:18px;
        padding:14px;
      }
      .qm-product-name{
        font-weight:700;
        margin-bottom:6px;
      }
      .qm-product-meta{
        color:#8ea2c8;
        font-size:13px;
      }
      .qm-price-box{
        text-align:right;
        min-width:120px;
      }
      .qm-price-old{
        color:#7f8ead;
        font-size:13px;
      }
      .qm-price-new{
        font-weight:800;
        font-size:20px;
      }
      .qm-badge{
        display:inline-flex;
        align-items:center;
        gap:6px;
        padding:8px 12px;
        border-radius:999px;
        background:rgba(103,240,202,0.12);
        color:#67f0ca;
        font-weight:700;
        font-size:13px;
      }
      .qm-empty{
        color:#8ea2c8;
        padding:12px 4px;
      }
      @media (max-width: 920px){
        .qm-panel-grid{
          grid-template-columns:1fr;
        }
        .qm-row{
          grid-template-columns:1fr;
        }
        .qm-actions{
          grid-template-columns:1fr;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function buildPanelHtml() {
    const plan = getPlan();
    const margin = getMargin();
    const products = getAllProductsFlat();

    return `
      <section class="qm-panel-wrap" id="qm-panel-store-root">
        <div class="qm-panel-grid">
          <div class="qm-card">
            <div class="qm-badge">Panel sprzedawcy • ${plan.toUpperCase()}</div>
            <h1 class="qm-title">Import CSV + marża + produkty do sklepu</h1>
            <p class="qm-sub">Szybki panel MVP. Wrzuć plik CSV hurtowni, ustaw marżę i od razu zapisuj produkty do systemu.</p>

            <div class="qm-row">
              <div class="qm-stat">
                <div class="qm-label">Aktualny plan</div>
                <div class="qm-value" data-qm-plan>${plan.toUpperCase()}</div>
              </div>
              <div class="qm-stat">
                <div class="qm-label">Marża sklepu</div>
                <div class="qm-value" data-qm-margin>${Math.round(margin * 100)}%</div>
              </div>
              <div class="qm-stat">
                <div class="qm-label">Liczba produktów</div>
                <div class="qm-value" data-qm-count>${products.length}</div>
              </div>
            </div>

            <div class="qm-form">
              <div class="qm-field">
                <label for="qm-supplier-name">Nazwa hurtowni</label>
                <input id="qm-supplier-name" class="qm-input" type="text" placeholder="np. AB Cosmetics">
              </div>

              <div class="qm-field">
                <label for="qm-margin-input">Marża (%)</label>
                <input id="qm-margin-input" class="qm-input" type="number" min="0" step="1" value="${Math.round(margin * 100)}" placeholder="np. 18">
              </div>

              <div class="qm-field">
                <label for="qm-csv-file">Plik CSV</label>
                <input id="qm-csv-file" class="qm-input" type="file" accept=".csv,text/csv">
              </div>

              <div class="qm-actions">
                <button id="qm-save-margin" class="qm-button secondary" type="button">Zapisz marżę</button>
                <button id="qm-import-csv" class="qm-button primary" type="button">Importuj CSV</button>
              </div>

              <div class="qm-note">
                Obsługiwane kolumny: nazwa / name oraz cena / price / netto. Możliwe delimitery: średnik albo przecinek.
              </div>

              <div id="qm-status" class="qm-status"></div>
            </div>
          </div>

          <div class="qm-card">
            <h2 class="qm-title" style="font-size:24px;">Podgląd produktów</h2>
            <p class="qm-sub">Ceny końcowe są liczone automatycznie z aktualnej marży.</p>
            <div id="qm-products-list" class="qm-products"></div>
          </div>
        </div>
      </section>
    `;
  }

  function renderProducts() {
    const root = document.getElementById("qm-products-list");
    const countNode = document.querySelector("[data-qm-count]");
    const marginNode = document.querySelector("[data-qm-margin]");

    if (!root) return;

    const list = getAllProductsFlat();
    const margin = getMargin();

    if (countNode) countNode.textContent = list.length;
    if (marginNode) marginNode.textContent = Math.round(margin * 100) + "%";

    if (!list.length) {
      root.innerHTML = `<div class="qm-empty">Brak produktów. Zaimportuj pierwszy plik CSV.</div>`;
      return;
    }

    root.innerHTML = list
      .slice(0, 100)
      .map(function (product) {
        return `
          <article class="qm-product">
            <div>
              <div class="qm-product-name">${escapeHtml(product.name)}</div>
              <div class="qm-product-meta">
                Hurtownia: ${escapeHtml(product.supplier)}
              </div>
            </div>
            <div class="qm-price-box">
              <div class="qm-price-old">${formatPrice(product.basePrice)}</div>
              <div class="qm-price-new">${formatPrice(product.finalPrice)}</div>
            </div>
          </article>
        `;
      })
      .join("");
  }

  function setStatus(message, isError) {
    const node = document.getElementById("qm-status");
    if (!node) return;
    node.style.color = isError ? "#ff8f8f" : "#67f0ca";
    node.textContent = message;
  }

  function bindPanelEvents() {
    const saveMarginBtn = document.getElementById("qm-save-margin");
    const importBtn = document.getElementById("qm-import-csv");
    const marginInput = document.getElementById("qm-margin-input");
    const supplierInput = document.getElementById("qm-supplier-name");
    const fileInput = document.getElementById("qm-csv-file");

    if (saveMarginBtn) {
      saveMarginBtn.addEventListener("click", function () {
        const value = marginInput ? marginInput.value : "";

        if (!setMargin(value)) {
          setStatus("Nieprawidłowa marża. Podaj liczbę, np. 12 lub 18.", true);
          return;
        }

        renderProducts();
        setStatus("Marża została zapisana.");
      });
    }

    if (importBtn) {
      importBtn.addEventListener("click", function () {
        const supplierName = (supplierInput ? supplierInput.value : "").trim();
        const file = fileInput && fileInput.files ? fileInput.files[0] : null;

        if (!supplierName) {
          setStatus("Wpisz nazwę hurtowni.", true);
          return;
        }

        if (!file) {
          setStatus("Wybierz plik CSV.", true);
          return;
        }

        const reader = new FileReader();

        reader.onload = function (event) {
          try {
            const text = event.target.result || "";
            const products = parseCsvText(text, supplierName);

            if (!products.length) {
              setStatus("Nie udało się odczytać produktów z CSV.", true);
              return;
            }

            const all = getProductsMap();
            all[supplierName] = products;
            saveProductsMap(all);

            renderProducts();
            setStatus("Import OK. Dodano " + products.length + " produktów z hurtowni: " + supplierName + ".");
          } catch (err) {
            setStatus("Błąd importu CSV.", true);
          }
        };

        reader.onerror = function () {
          setStatus("Nie udało się odczytać pliku.", true);
        };

        reader.readAsText(file, "utf-8");
      });
    }
  }

  function mountPanel() {
    injectStyles();

    const existingRoot = document.getElementById("qm-panel-store-root");
    if (existingRoot) {
      renderProducts();
      bindPanelEvents();
      return;
    }

    const target =
      document.querySelector("main") ||
      document.querySelector(".container") ||
      document.body;

    const wrapper = document.createElement("div");
    wrapper.innerHTML = buildPanelHtml();
    target.appendChild(wrapper.firstElementChild);

    renderProducts();
    bindPanelEvents();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountPanel);
  } else {
    mountPanel();
  }
})();
