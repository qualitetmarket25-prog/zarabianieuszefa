(() => {
  "use strict";

  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

  const { Cart, money } = window.QM_SHOP;

  // ===== produkty: z importu CSV (LS) + fallback products.json =====
  const LS_PRODUCTS_BY_SUPPLIER = "qm_products_by_supplier_v1"; // u Ciebie już jest
  const FALLBACK_JSON = "/products.json";

  const readLS = (k, fallback) => {
    try { return JSON.parse(localStorage.getItem(k) || ""); } catch { return fallback; }
  };

  const safeStr = (v) => String(v ?? "").trim();

  const hashPick = (s) => {
    const x = safeStr(s);
    let h = 0;
    for (let i=0;i<x.length;i++) h = ((h<<5)-h) + x.charCodeAt(i);
    const n = Math.abs(h) % 4;
    // masz w repo: produkt_1.png, produkt_3.png, produkt_4.png, produkt_5.png
    return ["/produkt_1.png","/produkt_3.png","/produkt_4.png","/produkt_5.png"][n];
  };

  const normalizeProduct = (p) => {
    const name = p.name || p.nazwa || p.title || "Produkt";
    const id = p.id || p.sku || p.ean || name;
    const category = p.category || p.kategoria || p.cat || "";
    const supplier = p.supplier || p.hurtownia || p.vendor || "";

    // ceny: zakładamy że już masz “z marżą”
    const priceRetail = Number(p.priceRetail ?? p.price ?? p.cena ?? p.brutto ?? 0) || 0;
    const priceB2B = Number(p.priceB2B ?? p.priceWholesale ?? p.hurt ?? p.netto ?? 0) || 0;

    const unit = p.unit || p.jm || p.jednostka || "szt";
    const moq = Number(p.moq ?? p.min ?? p.minimum ?? 1) || 1;

    const image = p.image || p.img || p.photo || hashPick(name);

    const rank = Number(p.rank ?? p.score ?? p.rating ?? 0) || 0;

    return {
      id: String(id),
      sku: String(p.sku || id),
      name: String(name),
      category: String(category),
      supplier: String(supplier),
      unit: String(unit),
      moq,
      image,
      rank,
      priceRetail,
      priceB2B
    };
  };

  const loadProducts = async () => {
    // 1) LS z hurtowni (Twoje importy)
    const bySupplier = readLS(LS_PRODUCTS_BY_SUPPLIER, null);
    let out = [];

    if (bySupplier && typeof bySupplier === "object") {
      for (const supName of Object.keys(bySupplier)) {
        const arr = Array.isArray(bySupplier[supName]) ? bySupplier[supName] : [];
        for (const p of arr) out.push(normalizeProduct({ ...p, supplier: p.supplier || supName }));
      }
    }

    // 2) fallback z /products.json
    if (!out.length) {
      try {
        const res = await fetch(FALLBACK_JSON, { cache:"no-store" });
        const json = await res.json();
        const arr = Array.isArray(json) ? json : (Array.isArray(json.products) ? json.products : []);
        out = arr.map(normalizeProduct);
      } catch {
        out = [];
      }
    }

    // deduplikacja po id
    const map = new Map();
    for (const p of out) map.set(String(p.id), p);
    return Array.from(map.values());
  };

  const setActive = (btnOn, btnOff) => {
    btnOn?.classList.add("active");
    btnOff?.classList.remove("active");
  };

  const bindModeButtons = () => {
    const bRetail = $("#modeRetail");
    const bB2B = $("#modeB2B");

    const sync = () => {
      const mode = Cart.getMode();
      if (mode === "b2b") setActive(bB2B, bRetail);
      else setActive(bRetail, bB2B);

      const kpiMode = $("#kpiMode");
      if (kpiMode) kpiMode.textContent = (mode === "b2b" ? "HURT (B2B)" : "DETAL");
    };

    bRetail?.addEventListener("click", () => { Cart.setMode("retail"); sync(); renderAll(); });
    bB2B?.addEventListener("click", () => { Cart.setMode("b2b"); sync(); renderAll(); });

    window.addEventListener("qm:cart", sync);
    sync();
  };

  const updateCartCount = () => {
    const el = $("#cartCount");
    if (el) el.textContent = String(Cart.count());
  };

  // ===== sklep view =====
  let ALL = [];

  const buildCats = () => {
    const sel = $("#cat");
    if (!sel) return;
    const cats = Array.from(new Set(ALL.map(p => p.category).filter(Boolean))).sort((a,b)=>a.localeCompare(b,"pl"));
    sel.innerHTML = `<option value="">Wszystkie</option>` + cats.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("");
    const k = $("#kpiCats");
    if (k) k.textContent = String(cats.length);
  };

  const escapeHtml = (s) =>
    String(s).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");

  const priceForMode = (p) => (Cart.getMode() === "b2b" ? (p.priceB2B || p.priceRetail) : p.priceRetail);

  const renderGrid = () => {
    const grid = $("#grid");
    const empty = $("#empty");
    if (!grid) return;

    const q = safeStr($("#q")?.value).toLowerCase();
    const cat = safeStr($("#cat")?.value);
    const sort = safeStr($("#sort")?.value);

    let list = ALL.slice();

    if (q) {
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.category||"").toLowerCase().includes(q) ||
        (p.supplier||"").toLowerCase().includes(q)
      );
    }
    if (cat) list = list.filter(p => p.category === cat);

    const mode = Cart.getMode();
    if (sort === "rank_desc") list.sort((a,b)=> (b.rank||0)-(a.rank||0));
    if (sort === "price_asc") list.sort((a,b)=> priceForMode(a)-priceForMode(b));
    if (sort === "price_desc") list.sort((a,b)=> priceForMode(b)-priceForMode(a));
    if (sort === "name_asc") list.sort((a,b)=> a.name.localeCompare(b.name,"pl"));

    $("#kpiProducts") && ($("#kpiProducts").textContent = String(list.length));

    if (!list.length) {
      grid.innerHTML = "";
      if (empty) empty.style.display = "";
      return;
    }
    if (empty) empty.style.display = "none";

    grid.innerHTML = list.map(p => {
      const price = priceForMode(p);
      const moq = Number(p.moq || 1) || 1;
      const moqTxt = (mode === "b2b") ? `MOQ: ${moq} ${escapeHtml(p.unit)}` : `Jedn.: ${escapeHtml(p.unit)}`;

      const sub = [
        p.category ? escapeHtml(p.category) : null,
        p.supplier ? `Hurt.: ${escapeHtml(p.supplier)}` : null,
        moqTxt
      ].filter(Boolean).join(" • ");

      return `
        <div class="p-card">
          <img class="p-img" src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}" loading="lazy"
               onerror="this.onerror=null;this.src='${hashPick(p.name)}';" />
          <div class="p-body">
            <p class="p-title">${escapeHtml(p.name)}</p>
            <div class="p-meta">${sub}</div>
            <div class="p-price">
              <strong>${money(price)}</strong>
              <span>${mode === "b2b" ? "netto (B2B)" : "brutto (detal)"}</span>
            </div>
            <div class="p-actions">
              <button class="btn btn-sm btn-primary" data-add="${escapeHtml(p.id)}">Dodaj</button>
              <a class="btn btn-sm" href="./koszyk.html">Koszyk</a>
            </div>
          </div>
        </div>
      `;
    }).join("");

    $$("[data-add]", grid).forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-add");
        const p = ALL.find(x => String(x.id) === String(id));
        if (!p) return;
        Cart.upsert(p, 1);
        updateCartCount();
      });
    });
  };

  // ===== koszyk view =====
  const renderCart = () => {
    const list = $("#cartList");
    const empty = $("#cartEmpty");
    if (!list) return;

    const cart = Cart.read();
    if (!cart.items.length) {
      list.innerHTML = "";
      if (empty) empty.style.display = "";
    } else {
      if (empty) empty.style.display = "none";
      const mode = Cart.getMode();

      list.innerHTML = cart.items.map(it => {
        const price = (mode === "b2b" ? (Number(it.priceB2B||0) || Number(it.priceRetail||0) || 0) : (Number(it.priceRetail||0) || 0));
        const line = price * (Number(it.qty||0)||0);
        const moq = Number(it.moq||1)||1;
        const moqWarn = (mode === "b2b" && (Number(it.qty||0)||0) < moq)
          ? `<div class="muted-xs" style="color:rgba(245,158,11,.95); font-weight:900; margin-top:6px;">Za mało: MOQ ${moq} ${escapeHtml(it.unit||"szt")}</div>`
          : "";

        return `
          <div class="card">
            <div class="cart-row">
              <img class="cart-thumb" src="${escapeHtml(it.image||hashPick(it.name))}" alt="" loading="lazy"
                   onerror="this.onerror=null;this.src='${hashPick(it.name)}';" />
              <div>
                <div style="font-weight:900">${escapeHtml(it.name||"Produkt")}</div>
                <div class="muted-xs">${escapeHtml(it.category||"")} ${it.supplier ? "• Hurt.: "+escapeHtml(it.supplier) : ""}</div>
                ${moqWarn}
              </div>
              <div style="text-align:right">
                <div class="muted-xs">Cena</div>
                <div style="font-weight:900">${money(price)}</div>
                <div class="muted-xs">Suma: <span style="font-weight:900">${money(line)}</span></div>
              </div>
              <div class="qty">
                <button class="btn btn-sm" data-dec="${escapeHtml(it.id)}">−</button>
                <input data-qty="${escapeHtml(it.id)}" value="${escapeHtml(it.qty)}" inputmode="numeric" />
                <button class="btn btn-sm" data-inc="${escapeHtml(it.id)}">+</button>
              </div>
            </div>
          </div>
        `;
      }).join("");

      $$("[data-inc]", list).forEach(b => b.addEventListener("click", () => {
        const id = b.getAttribute("data-inc");
        const it = Cart.read().items.find(x => String(x.id)===String(id));
        if (!it) return;
        Cart.setQty(id, (Number(it.qty||0)||0) + 1);
      }));
      $$("[data-dec]", list).forEach(b => b.addEventListener("click", () => {
        const id = b.getAttribute("data-dec");
        const it = Cart.read().items.find(x => String(x.id)===String(id));
        if (!it) return;
        Cart.setQty(id, (Number(it.qty||0)||0) - 1);
      }));
      $$("[data-qty]", list).forEach(inp => inp.addEventListener("change", () => {
        const id = inp.getAttribute("data-qty");
        Cart.setQty(id, inp.value);
      }));
    }

    // podsumowanie
    const t = Cart.totals();
    $("#sumItems") && ($("#sumItems").textContent = String(t.items));
    $("#sumNet") && ($("#sumNet").textContent = money(t.net));
    $("#sumVat") && ($("#sumVat").textContent = money(t.vat));
    $("#sumGross") && ($("#sumGross").textContent = money(t.gross));
    const mw = $("#moqWarn");
    if (mw) mw.style.display = (t.mode === "b2b" && !t.moqOk) ? "" : "none";
  };

  const bindCartPage = () => {
    $("#clearCart")?.addEventListener("click", () => Cart.clear());

    // rabat/notatka
    const disc = $("#b2bDiscount");
    if (disc) {
      disc.value = String(Cart.getDiscount() || "");
      disc.addEventListener("input", () => {
        Cart.setDiscount(disc.value);
        renderCart();
      });
    }
    const note = $("#orderNote");
    if (note) {
      note.value = Cart.getNote();
      note.addEventListener("input", () => Cart.setNote(note.value));
    }

    // profil B2B
    const prof = Cart.getB2BProfile();
    $("#companyName") && ($("#companyName").value = prof.companyName || "");
    $("#companyNip") && ($("#companyNip").value = prof.nip || "");
    $("#companyAddr") && ($("#companyAddr").value = prof.addr || "");
    $("#companyContact") && ($("#companyContact").value = prof.contact || "");

    const persistProfile = () => {
      Cart.setB2BProfile({
        companyName: $("#companyName")?.value || "",
        nip: $("#companyNip")?.value || "",
        addr: $("#companyAddr")?.value || "",
        contact: $("#companyContact")?.value || ""
      });
    };
    ["companyName","companyNip","companyAddr","companyContact"].forEach(id => {
      $("#"+id)?.addEventListener("input", persistProfile);
    });

    // generowanie zamówienia
    const gen = $("#generateOrder");
    const copy = $("#copyOrder");
    const out = $("#orderOut");

    const buildOrderText = () => {
      const t = Cart.totals();
      const cart = Cart.read();
      const p = Cart.getB2BProfile();
      const noteText = Cart.getNote();

      const lines = [];
      lines.push(`ZAMÓWIENIE – QualitetMarket (${t.mode === "b2b" ? "B2B" : "DETAL"})`);
      lines.push(`Data: ${new Date().toLocaleString("pl-PL")}`);
      lines.push(``);
      if (t.mode === "b2b") {
        lines.push(`DANE FIRMY:`);
        lines.push(`- Firma: ${p.companyName || "-"}`);
        lines.push(`- NIP: ${p.nip || "-"}`);
        lines.push(`- Adres: ${p.addr || "-"}`);
        lines.push(`- Kontakt: ${p.contact || "-"}`);
        lines.push(``);
      }

      if (noteText) {
        lines.push(`NOTATKA: ${noteText}`);
        lines.push(``);
      }

      lines.push(`POZYCJE:`);
      for (const it of cart.items) {
        const price = (t.mode === "b2b" ? (Number(it.priceB2B||0) || Number(it.priceRetail||0) || 0) : (Number(it.priceRetail||0) || 0));
        lines.push(`- ${it.name} | SKU: ${it.sku || it.id} | Ilość: ${it.qty} ${it.unit || "szt"} | Cena: ${price.toFixed(2)} | Hurt.: ${it.supplier || "-"}`);
      }

      lines.push(``);
      lines.push(`PODSUMOWANIE:`);
      lines.push(`- Pozycje: ${t.items}`);
      lines.push(`- Netto: ${t.net.toFixed(2)}`);
      lines.push(`- VAT(23%): ${t.vat.toFixed(2)}`);
      lines.push(`- Brutto: ${t.gross.toFixed(2)}`);

      if (t.mode === "b2b" && !t.moqOk) {
        lines.push(``);
        lines.push(`UWAGA: Są pozycje poniżej MOQ – popraw ilości przed wysłaniem.`);
      }

      return lines.join("\n");
    };

    gen?.addEventListener("click", () => { if (out) out.value = buildOrderText(); });
    copy?.addEventListener("click", async () => {
      if (!out) return;
      if (!out.value) out.value = buildOrderText();
      try { await navigator.clipboard.writeText(out.value); } catch {}
    });
  };

  const renderAll = () => {
    updateCartCount();
    renderGrid();
    renderCart();
  };

  const boot = async () => {
    bindModeButtons();
    updateCartCount();

    // jeśli jesteśmy na stronie koszyka, podpinamy funkcje
    if ($("#cartList")) bindCartPage();

    // sklep: ładuj produkty i renderuj
    if ($("#grid")) {
      ALL = await loadProducts();
      buildCats();

      $("#q")?.addEventListener("input", renderGrid);
      $("#cat")?.addEventListener("change", renderGrid);
      $("#sort")?.addEventListener("change", renderGrid);

      renderGrid();
    }

    window.addEventListener("qm:cart", () => {
      updateCartCount();
      renderGrid();
      renderCart();
    });

    // odśwież karty po starcie
    renderAll();
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
