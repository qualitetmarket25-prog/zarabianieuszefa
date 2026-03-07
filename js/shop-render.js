(function () {
  const path = window.location.pathname.toLowerCase();
  if (!path.includes("sklep")) return;

  function readProducts() {
    try {
      if (typeof getProductsForShop === "function") {
        return getProductsForShop();
      }

      const raw = localStorage.getItem("qm_products_by_supplier_v1");
      const map = raw ? JSON.parse(raw) : {};
      const out = [];
      const marginRaw = parseFloat(localStorage.getItem("qm_store_margin_pct") || "0.12");
      const margin = Number.isFinite(marginRaw) ? marginRaw : 0.12;

      Object.keys(map).forEach(function (supplier) {
        const arr = Array.isArray(map[supplier]) ? map[supplier] : [];

        arr.forEach(function (item, index) {
          const base = parseFloat(item.price);
          if (!item || !item.name || !Number.isFinite(base)) return;

          out.push({
            id: item.id || supplier + "_" + index,
            supplier: supplier,
            name: item.name,
            price: Math.round(base * (1 + margin) * 100) / 100,
            basePrice: base,
            image: item.image || "",
            description: item.description || ""
          });
        });
      });

      return out;
    } catch (e) {
      return [];
    }
  }

  function formatPrice(value) {
    const num = parseFloat(value);
    if (!Number.isFinite(num)) return "0,00 zł";
    return num.toFixed(2).replace(".", ",") + " zł";
  }

  function escapeHtml(value) {
    return String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function injectStyles() {
    if (document.getElementById("qm-shop-render-styles")) return;

    const style = document.createElement("style");
    style.id = "qm-shop-render-styles";
    style.textContent = `
      .qm-shop-section{
        max-width:1180px;
        margin:24px auto;
        padding:16px;
      }
      .qm-shop-head{
        display:flex;
        align-items:end;
        justify-content:space-between;
        gap:12px;
        margin-bottom:16px;
        flex-wrap:wrap;
      }
      .qm-shop-title{
        margin:0;
        font-size:30px;
        line-height:1.05;
        font-weight:800;
        color:#eef2ff;
      }
      .qm-shop-sub{
        margin:6px 0 0;
        color:#93a6c7;
        font-size:14px;
      }
      .qm-shop-badge{
        display:inline-flex;
        align-items:center;
        padding:10px 14px;
        border-radius:999px;
        background:rgba(103,240,202,0.10);
        color:#67f0ca;
        font-weight:700;
        font-size:13px;
        border:1px solid rgba(103,240,202,0.15);
      }
      .qm-shop-grid{
        display:grid;
        grid-template-columns:repeat(3, minmax(0, 1fr));
        gap:16px;
      }
      .qm-shop-card{
        background:linear-gradient(180deg, rgba(10,17,32,0.96), rgba(5,10,20,0.98));
        border:1px solid rgba(110,145,255,0.16);
        border-radius:22px;
        overflow:hidden;
        box-shadow:0 12px 40px rgba(0,0,0,0.28);
      }
      .qm-shop-image{
        width:100%;
        aspect-ratio: 4 / 3;
        object-fit:cover;
        display:block;
        background:linear-gradient(135deg, #0c1830, #132548);
      }
      .qm-shop-noimage{
        width:100%;
        aspect-ratio: 4 / 3;
        display:flex;
        align-items:center;
        justify-content:center;
        background:linear-gradient(135deg, #0c1830, #132548);
        color:#8ea2c8;
        font-weight:700;
        letter-spacing:0.04em;
      }
      .qm-shop-body{
        padding:16px;
      }
      .qm-shop-name{
        margin:0 0 8px;
        color:#f3f6ff;
        font-size:20px;
        font-weight:800;
        line-height:1.2;
      }
      .qm-shop-desc{
        margin:0 0 12px;
        color:#93a6c7;
        font-size:14px;
        min-height:38px;
      }
      .qm-shop-meta{
        display:flex;
        justify-content:space-between;
        gap:10px;
        margin-bottom:14px;
        color:#8ea2c8;
        font-size:13px;
      }
      .qm-shop-price{
        display:flex;
        align-items:end;
        justify-content:space-between;
        gap:12px;
      }
      .qm-shop-price-main{
        color:#ffffff;
        font-size:26px;
        font-weight:800;
      }
      .qm-shop-price-old{
        color:#7e90b1;
        font-size:13px;
        text-decoration:line-through;
      }
      .qm-shop-btn{
        border:none;
        border-radius:14px;
        padding:12px 14px;
        font-weight:800;
        cursor:pointer;
        background:linear-gradient(90deg, #67f0ca, #70d6ff);
        color:#05121f;
      }
      .qm-shop-empty{
        background:linear-gradient(180deg, rgba(10,17,32,0.96), rgba(5,10,20,0.98));
        border:1px solid rgba(110,145,255,0.16);
        border-radius:22px;
        padding:18px;
        color:#8ea2c8;
      }
      @media (max-width: 980px){
        .qm-shop-grid{
          grid-template-columns:repeat(2, minmax(0, 1fr));
        }
      }
      @media (max-width: 640px){
        .qm-shop-grid{
          grid-template-columns:1fr;
        }
        .qm-shop-title{
          font-size:24px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function getTargetContainer() {
    return (
      document.querySelector("[data-qm-products]") ||
      document.querySelector("#qm-products") ||
      document.querySelector(".shop-products") ||
      document.querySelector("main") ||
      document.body
    );
  }

  function buildCard(product) {
    const imagePart = product.image
      ? `<img class="qm-shop-image" src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}">`
      : `<div class="qm-shop-noimage">BRAK ZDJĘCIA</div>`;

    return `
      <article class="qm-shop-card">
        ${imagePart}
        <div class="qm-shop-body">
          <h3 class="qm-shop-name">${escapeHtml(product.name)}</h3>
          <p class="qm-shop-desc">${escapeHtml(product.description || "Produkt gotowy do sprzedaży w Twoim sklepie.")}</p>
          <div class="qm-shop-meta">
            <span>${escapeHtml(product.supplier || "Hurtownia")}</span>
            <span>ID: ${escapeHtml(product.id || "-")}</span>
          </div>
          <div class="qm-shop-price">
            <div>
              <div class="qm-shop-price-old">${formatPrice(product.basePrice || product.price)}</div>
              <div class="qm-shop-price-main">${formatPrice(product.price)}</div>
            </div>
            <button class="qm-shop-btn" type="button">Kup teraz</button>
          </div>
        </div>
      </article>
    `;
  }

  function renderShop() {
    injectStyles();

    const products = readProducts();
    const target = getTargetContainer();
    if (!target) return;

    const existing = document.getElementById("qm-shop-products-section");
    if (existing) existing.remove();

    const section = document.createElement("section");
    section.className = "qm-shop-section";
    section.id = "qm-shop-products-section";

    if (!products.length) {
      section.innerHTML = `
        <div class="qm-shop-head">
          <div>
            <h2 class="qm-shop-title">Twoje produkty w sklepie</h2>
            <p class="qm-shop-sub">Po imporcie CSV produkty pojawią się tutaj automatycznie.</p>
          </div>
          <div class="qm-shop-badge">0 produktów</div>
        </div>
        <div class="qm-shop-empty">Brak produktów do wyświetlenia. Wejdź do panelu sprzedawcy, ustaw marżę i zaimportuj plik CSV.</div>
      `;
      target.appendChild(section);
      return;
    }

    section.innerHTML = `
      <div class="qm-shop-head">
        <div>
          <h2 class="qm-shop-title">Twoje produkty w sklepie</h2>
          <p class="qm-shop-sub">Ceny zostały przeliczone automatycznie według aktualnej marży sklepu.</p>
        </div>
        <div class="qm-shop-badge">${products.length} produktów</div>
      </div>
      <div class="qm-shop-grid">
        ${products.map(buildCard).join("")}
      </div>
    `;

    target.appendChild(section);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", renderShop);
  } else {
    renderShop();
  }
})();
