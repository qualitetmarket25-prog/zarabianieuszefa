(() => {
  "use strict";

  const $ = (s, r=document) => r.querySelector(s);

  const LS = "qm_suppliers_registry_v1";

  const read = () => {
    try {
      const x = JSON.parse(localStorage.getItem(LS) || "");
      return Array.isArray(x) ? x : [];
    } catch { return []; }
  };

  const write = (arr) => localStorage.setItem(LS, JSON.stringify(arr));

  const esc = (s) => String(s||"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");

  const render = () => {
    const list = $("#supList");
    if (!list) return;
    const arr = read();

    if (!arr.length) {
      list.innerHTML = `<div class="muted">Brak hurtowni. Dodaj pierwszą po lewej.</div>`;
      return;
    }

    list.innerHTML = arr.map((s, i) => `
      <div class="card soft" style="margin-bottom:10px;">
        <div style="display:flex; justify-content:space-between; gap:10px; align-items:flex-start; flex-wrap:wrap;">
          <div>
            <div style="font-weight:900">${esc(s.name)}</div>
            <div class="muted-xs">${esc(s.contact || "")}</div>
            <div class="muted-xs">CSV separator: <strong>${esc(s.sep || ",")}</strong></div>
            ${s.notes ? `<div class="muted-xs">${esc(s.notes)}</div>` : ""}
          </div>
          <button class="btn btn-danger btn-sm" data-del="${i}" type="button">Usuń</button>
        </div>
      </div>
    `).join("");

    list.querySelectorAll("[data-del]").forEach(btn => {
      btn.addEventListener("click", () => {
        const idx = Number(btn.getAttribute("data-del"));
        const x = read();
        x.splice(idx, 1);
        write(x);
        render();
      });
    });
  };

  const boot = () => {
    $("#addSupplier")?.addEventListener("click", () => {
      const name = $("#sName")?.value?.trim();
      if (!name) return;

      const arr = read();
      arr.push({
        name,
        contact: $("#sContact")?.value?.trim() || "",
        sep: $("#sSep")?.value || ",",
        notes: $("#sNotes")?.value?.trim() || "",
        createdAt: Date.now()
      });
      write(arr);

      $("#sName").value = "";
      $("#sContact").value = "";
      $("#sNotes").value = "";

      render();
    });

    $("#resetSuppliers")?.addEventListener("click", () => {
      write([]);
      render();
    });

    render();
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
