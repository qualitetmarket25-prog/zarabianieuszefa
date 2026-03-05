(() => {
  "use strict";
  const LS_ORDERS = "qm_orders_v1";

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

  const add = (order) => {
    const arr = read();
    arr.push(order);
    write(arr);
    return order;
  };

  const clear = () => write([]);

  window.QM_ORDERS = { read, write, add, clear };
})();
