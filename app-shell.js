(function(){
  var menuToggle = document.getElementById('menuToggle');
  var mobileDrawer = document.getElementById('mobileDrawer');
  if(menuToggle && mobileDrawer){
    menuToggle.addEventListener('click', function(){
      var open = mobileDrawer.classList.toggle('open');
      menuToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  function readJson(key, fallback){
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  }

  var sub = readJson('qm_subscription_v1', null);
  var planBadge = document.getElementById('planBadge');
  var marginBadge = document.getElementById('marginBadge');

  var plan = 'Basic';
  var margin = localStorage.getItem('qm_store_margin_pct') || '15';

  if(sub && typeof sub === 'object'){
    var t = String(sub.tier || sub.plan || '').toLowerCase();
    if(t === 'pro') plan = 'Pro';
    if(t === 'elite') plan = 'Elite';
    if(t === 'basic') plan = 'Basic';
  }
  if(planBadge) planBadge.textContent = plan;
  if(marginBadge) marginBadge.textContent = String(margin).replace('%','') + '%';
})();