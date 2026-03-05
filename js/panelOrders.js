(() => {
  "use strict";

  const LS_ORDERS = "qm_orders_v1";
  const LS_ACTIVE_STORE = "qm_active_store_v1";

  const $ = (s, r=document) => r.querySelector(s);

  const readJSON = (k, fallback) => {
    try { return JSON.parse(localStorage.getItem(k) || ""); } catch { return fallback; }
  };
  const writeJSON = (k, v) => localStorage.setItem(k, JSON.stringify(v));

  const money = (n) => Number(n||0).toLocaleString("pl-PL",{style:"currency",currency:"PLN"});

  const getStoreSlug = () => {
    const url = new URL(location.href);
    return url.searchParams.get("store") || localStorage.getItem(LS_ACTIVE_STORE) || "";
  };

  const setStatus = (orderId, newStatus) => {
    const orders = readJSON(LS_ORDERS, []);
    const o = orders.find(x => x.id === orderId);
    if (!o) return;
    o.status = newStatus;
    o.updatedAt = new Date().toISOString();
    writeJSON(LS_ORDERS, orders);
  };

  const download = (content, filename, mime) => {
    const blob = new Blob([content], { type: mime });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  const toCSV = (orders) => {
    const header = ["id","createdAt","updatedAt","status","storeSlug","buyerName","buyerEmail","buyerPhone","gross","platformFee"];
    const rows = orders.map(o => ([
      o.id,
      o.createdAt,
      o.updatedAt,
      o.status,
      o.storeSlug,
      (o.buyer && o.buyer.fullName) || "",
      (o.buyer && o.buyer.email) || "",
      (o.buyer && o.buyer.phone) || "",
      (o.totals && o.totals.gross) || 0,
      (o.totals && o.totals.platformFee) || 0,
    ]).map(v => `"${String(v).replaceAll('"','""')}"`).join(","));
    return [header.join(","), ...rows].join("\n");
  };

  const render = () => {
    const slug = getStoreSlug();
    $("#storeInfo").textContent = `Sklep: ${slug || "?"}`;

    const all = readJSON(LS_ORDERS, []);
    const byStore = all.filter(o => (o.storeSlug || "") === slug);

    const st = $("#statusFilter").value.trim();
    const q = ($("#q").value || "").trim().toLowerCase();

    let list = byStore.slice();
    if (st) list = list.filter(o => o.status === st);
    if (q) {
      list = list.filter(o => {
        const hay = [
          o.id,
          o.status,
          o.storeSlug,
          o.buyer?.fullName,
          o.buyer?.email,
          o.buyer?.phone
        ].filter(Boolean).join(" ").toLowerCase();
        return hay.includes(q);
      });
    }

    const grossSum = list.reduce((s,o)=>s+Number(o.totals?.gross||0),0);
    const feeSum = list.reduce((s,o)=>s+Number(o.totals?.platformFee||0),0);
    $("#kpi").textContent = `Zamówienia: ${list.length} | Obrót: ${money(grossSum)} | Prowizja: ${money(feeSum)}`;

    const tbody = $("#rows");
    tbody.innerHTML = "";

    for (const o of list) {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td class="muted">${(o.createdAt||"").slice(0,19).replace("T"," ")}</td>
        <td><b>${o.id}</b><div class="muted">${o.storeSlug||""}</div></td>
        <td>
          <div><b>${o.buyer?.fullName||""}</b></div>
          <div class="muted">${o.buyer?.email||""}</div>
          <div class="muted">${o.buyer?.phone||""}</div>
        </td>
        <td><b>${money(o.totals?.gross||0)}</b></td>
        <td>${money(o.totals?.platformFee||0)}</td>
        <td>
          <select data-id="${o.id}" class="statusSel">
            ${["NEW","CONFIRMED","SENT","DONE"].map(s => `<option ${o.status===s?"selected":""}>${s}</option>`).join("")}
          </select>
          <div class="muted" style="margin-top:6px;">upd: ${(o.updatedAt||"").slice(0,19).replace("T"," ")}</div>
        </td>
        <td>
          <button class="btn ghost" data-act="details" data-id="${o.id}">Szczegóły</button>
          <button class="btn ghost" data-act="json" data-id="${o.id}">JSON</button>
        </td>
      `;
      tbody.appendChild(tr);
    }

    // listeners
    tbody.querySelectorAll(".statusSel").forEach(sel => {
      sel.addEventListener("change", () => {
        const id = sel.getAttribute("data-id");
        setStatus(id, sel.value);
        render();
      });
    });

    tbody.querySelectorAll("button[data-act]").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        const act = btn.getAttribute("data-act");
        const orders = readJSON(LS_ORDERS, []);
        const o = orders.find(x=>x.id===id);
        if (!o) return;

        if (act === "json") {
          download(JSON.stringify(o,null,2), `${o.id}.json`, "application/json");
          return;
        }
        if (act === "details") {
          alert(
            `Zamówienie: ${o.id}\nStatus: ${o.status}\nKlient: ${o.buyer?.fullName||""}\nAdres: ${o.buyer?.address?.street||""}, ${o.buyer?.address?.zip||""} ${o.buyer?.address?.city||""}\n\nHurtownie: ${o.splits?.length||0}`
          );
        }
      });
    });
  };

  const init = () => {
    $("#statusFilter").addEventListener("change", render);
    $("#q").addEventListener("input", render);

    $("#btnExportJson").addEventListener("click", () => {
      const slug = getStoreSlug();
      const all = readJSON(LS_ORDERS, []);
      const list = all.filter(o => (o.storeSlug||"") === slug);
      download(JSON.stringify(list,null,2), `orders_${slug}.json`, "application/json");
    });

    $("#btnExportCsv").addEventListener("click", () => {
      const slug = getStoreSlug();
      const all = readJSON(LS_ORDERS, []);
      const list = all.filter(o => (o.storeSlug||"") === slug);
      download(toCSV(list), `orders_${slug}.csv`, "text/csv;charset=utf-8");
    });

    render();
  };

  document.addEventListener("DOMContentLoaded", init);
})();
