(function(){
  'use strict';

  const LS_ORDERS = 'qm_orders_v1';
  const LS_PLAN = 'qm_user_plan_v1';
  const names = ['Anna', 'Kamil', 'Marek', 'Julia', 'Paweł', 'Karolina', 'Tomek', 'Ola'];
  const productWords = ['opakowania', 'zgrzewarka', 'kubki', 'folia', 'rękawice', 'pojemniki', 'etykiety'];

  function getRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function readOrders() {
    try {
      const raw = JSON.parse(localStorage.getItem(LS_ORDERS) || '[]');
      return Array.isArray(raw) ? raw : [];
    } catch {
      return [];
    }
  }

  function buildMessage() {
    const orders = readOrders();
    const plan = String(localStorage.getItem(LS_PLAN) || 'basic').toUpperCase();
    const options = [];

    if (orders.length) {
      const order = orders[Math.floor(Math.random() * orders.length)];
      const item = Array.isArray(order.items) && order.items[0] ? order.items[0] : null;
      const itemName = item && (item.name || item.title || item.sku) ? (item.name || item.title || item.sku) : getRandom(productWords);
      options.push({ title: 'Sprzedane', text: `${getRandom(names)} właśnie kupił: ${itemName}` });
    }

    options.push({ title: 'Nowa subskrypcja', text: `${getRandom(names)} aktywował plan ${plan === 'BASIC' ? 'PRO' : plan}` });
    options.push({ title: 'HIT sprzedaży', text: `${getRandom(productWords)} zbiera teraz najwięcej kliknięć` });

    return getRandom(options);
  }

  function showLiveToast() {
    const data = buildMessage();
    const node = document.createElement('div');
    node.className = 'qm-live';
    node.innerHTML = `<div>🔔</div><div><strong>${data.title}</strong><span>${data.text}</span></div>`;
    document.body.appendChild(node);
    setTimeout(() => node.remove(), 4200);
  }

  function init() {
    if (!document.body) return;
    setTimeout(showLiveToast, 2500);
    setInterval(() => {
      if (document.hidden) return;
      showLiveToast();
    }, 18000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
