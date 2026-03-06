(() => {
  "use strict";

  const LS_ORDERS = "qm_orders_v1";

  const slugify = (s) => String(s || "")
    .trim()
    .toLowerCase()
    .replace(/[ąćęłńóśźż]/g, (m) => ({
      "ą":"a","ć":"c","ę":"e","ł":"l","ń":"n","ó":"o","ś":"s","ź":"z","ż":"z"
    }[m] || m))
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  // ===== store slug =====
  const getStoreSlug = () => {

    const active = slugify(localStorage.getItem("qm_active_store_v1") || "");
    if (active) return active;

    try {
      const u = new URL(window.location.href);
      const s = slugify(u.searchParams.get("store") || "");
      if (s) return s;
    } catch {}

    const panel = slugify(localStorage.getItem("qm_store_slug") || "");
    if (panel) return panel;

    return "default";
  };

  const STORE = getStoreSlug();

  // ===== helpers =====

  const read = () => {
    try {
      const arr = JSON.parse(localStorage.getItem(LS_ORDERS) || "[]");
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  };

  const write = (arr) => {
    localStorage.setItem(LS_ORDERS, JSON.stringify(Array.isArray(arr) ? arr : []));
    window.dispatchEvent(new CustomEvent("qm:orders"));
  };

  // ===== CRUD =====

  const add = (order) => {
    const arr = read();
    arr.unshift(order);
    write(arr);
    return order;
  };

  const clear = () => write([]);

  const updateStatus = (id, status) => {
    const arr = read();
    const idx = arr.findIndex(o => String(o.id) === String(id));
    if (idx === -1) return false;

    arr[idx].status = status;
    arr[idx].updatedAt = new Date().toISOString();

    write(arr);
    return true;
  };

  const markPaid = (id) => updateStatus(id, "paid");
  const markShipped = (id) => updateStatus(id, "shipped");
  const cancel = (id) => updateStatus(id, "cancelled");

  // ===== filters =====

  const listAll = () => read();

  const listByStore = (slug) => {
    const s = slugify(slug || STORE);
    return read().filter(o => slugify(o.storeSlug) === s);
  };

  const get = (id) => {
    return read().find(o => String(o.id) === String(id));
  };

  // ===== helpers =====

  const getLastOrderId = () => {
    return localStorage.getItem("qm_last_order_id") || "";
  };

  const getLastOrderNo = () => {
    return localStorage.getItem("qm_last_order_no") || "";
  };

  // ===== expose =====

  window.QM_ORDERS = {
    read,
    write,
    add,
    clear,

    get,
    listAll,
    listByStore,

    updateStatus,
    markPaid,
    markShipped,
    cancel,

    getLastOrderId,
    getLastOrderNo,

    getStore: () => STORE
  };

})();
