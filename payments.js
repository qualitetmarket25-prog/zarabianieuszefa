(function () {
  var PLAN_KEY = 'qm_plan_v1';
  var MARGIN_KEY = 'qm_store_margin_pct';
  var SUBSCRIPTION_KEY = 'qm_subscription_v1';
  var STORES_KEY = 'qm_stores_v1';
  var ACTIVE_STORE_KEY = 'qm_active_store_v1';

  var PLAN_CONFIG = {
    basic: { price: 79, margin: 18, billing: 'miesięcznie' },
    pro: { price: 149, margin: 28, billing: 'miesięcznie' },
    elite: { price: 299, margin: 38, billing: 'miesięcznie' }
  };

  function safeParse(value, fallback) {
    try { return JSON.parse(value); } catch (e) { return fallback; }
  }

  function getSelectedPlan() {
    return localStorage.getItem(PLAN_KEY) || 'basic';
  }

  function getPlanConfig(plan) {
    return PLAN_CONFIG[plan] || PLAN_CONFIG.basic;
  }

  function savePlan(plan) {
    var config = getPlanConfig(plan);
    localStorage.setItem(PLAN_KEY, plan);
    localStorage.setItem(MARGIN_KEY, String(config.margin));
    localStorage.setItem(SUBSCRIPTION_KEY, JSON.stringify({
      plan: plan,
      price: config.price,
      billing: config.billing,
      margin: config.margin,
      active: true,
      activatedAt: new Date().toISOString()
    }));
    syncStoreMargin(config.margin);
  }

  function syncStoreMargin(margin) {
    var stores = safeParse(localStorage.getItem(STORES_KEY), []);
    var activeStore = localStorage.getItem(ACTIVE_STORE_KEY);
    if (Array.isArray(stores) && stores.length) {
      stores = stores.map(function (store) {
        if (!activeStore || store.slug === activeStore || store.id === activeStore || store.name === activeStore) {
          store.marginPct = Number(margin);
        }
        return store;
      });
      localStorage.setItem(STORES_KEY, JSON.stringify(stores));
    }
  }

  function fillSelectedPlanBox() {
    var box = document.getElementById('selectedPlanBox');
    if (!box) return;
    var plan = getSelectedPlan();
    var config = getPlanConfig(plan);
    box.innerHTML = ''
      + '<div><strong>Plan:</strong> ' + plan.toUpperCase() + '</div>'
      + '<div><strong>Cena:</strong> ' + config.price + ' PLN / ' + config.billing + '</div>'
      + '<div><strong>Automatyczna marża:</strong> ' + config.margin + '%</div>';
  }

  function bindPlanButtons() {
    document.querySelectorAll('[data-select-plan]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var plan = btn.getAttribute('data-select-plan');
        savePlan(plan);
        window.location.href = 'aktywuj-pro.html';
      });
    });
  }

  function bindActivationForm() {
    var form = document.getElementById('activationForm');
    if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var plan = getSelectedPlan();
      var config = getPlanConfig(plan);
      var fd = new FormData(form);
      var payload = {
        plan: plan,
        price: config.price,
        margin: config.margin,
        fullName: fd.get('fullName') || '',
        email: fd.get('email') || '',
        storeName: fd.get('storeName') || '',
        paymentMode: fd.get('paymentMode') || 'demo',
        activatedAt: new Date().toISOString()
      };
      localStorage.setItem(SUBSCRIPTION_KEY, JSON.stringify(payload));
      savePlan(plan);
      localStorage.setItem('qm_user_profile_v1', JSON.stringify({
        fullName: payload.fullName,
        email: payload.email,
        storeName: payload.storeName
      }));
      if (window.QMPayments && payload.paymentMode === 'checkout_link') {
        window.QMPayments.redirectToCheckout(plan);
        return;
      }
      window.location.href = 'success.html';
    });
  }

  function ensureDefaultPlan() {
    var plan = localStorage.getItem(PLAN_KEY);
    if (!plan) savePlan('basic');
  }

  window.QMSubscriptions = {
    getSelectedPlan: getSelectedPlan,
    savePlan: savePlan,
    getPlanConfig: getPlanConfig
  };

  document.addEventListener('DOMContentLoaded', function () {
    ensureDefaultPlan();
    bindPlanButtons();
    bindActivationForm();
    fillSelectedPlanBox();
  });
})();
