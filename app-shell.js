
(function(){
  function readJson(key, fallback){ try { var raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch(e){ return fallback; } }
  function writeJson(key, val){ localStorage.setItem(key, JSON.stringify(val)); }
  window.qm = {
    readJson: readJson, writeJson: writeJson,
    getPlan: function(){ var sub = readJson('qm_subscription_v1', null); return (sub && (sub.tier||sub.plan)) ? String(sub.tier||sub.plan).toLowerCase() : 'basic'; },
    getMargin: function(){ return Number(localStorage.getItem('qm_store_margin_pct') || 15); },
    setPlan: function(plan){
      var margin = plan==='elite' ? 35 : plan==='pro' ? 25 : 15;
      writeJson('qm_subscription_v1', {tier:plan, updatedAt:Date.now()});
      localStorage.setItem('qm_store_margin_pct', String(margin));
      return margin;
    },
    getProducts: function(){
      var items = readJson('qm_products_by_supplier_v1', []);
      return Array.isArray(items) ? items : [];
    },
    saveProducts: function(items){ writeJson('qm_products_by_supplier_v1', items); },
    getCart: function(){ return readJson('qm_cart_v1', []); },
    saveCart: function(items){ writeJson('qm_cart_v1', items); },
    getOrders: function(){ return readJson('qm_orders_v1', []); },
    saveOrders: function(items){ writeJson('qm_orders_v1', items); },
    money: function(v){ return (Number(v)||0).toFixed(2).replace('.', ',')+' zł'; }
  };

  document.addEventListener('DOMContentLoaded', function(){
    var menuToggle = document.getElementById('menuToggle');
    var mobileDrawer = document.getElementById('mobileDrawer');
    if(menuToggle && mobileDrawer){
      menuToggle.addEventListener('click', function(){
        var open = mobileDrawer.classList.toggle('open');
        menuToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    }
    var planBadge = document.getElementById('planBadge');
    var marginBadge = document.getElementById('marginBadge');
    var p = qm.getPlan(), m = qm.getMargin();
    if(planBadge) planBadge.textContent = p.toUpperCase();
    if(marginBadge) marginBadge.textContent = m + '%';
  });
})();
