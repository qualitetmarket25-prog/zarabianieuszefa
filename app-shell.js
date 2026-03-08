
(function () {
  function byId(id){ return document.getElementById(id); }
  function readJson(key, fallback){
    try{
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    }catch(e){ return fallback; }
  }
  function readPlan(){
    var sub = readJson('qm_subscription_v1', null) || readJson('qm_plan_v1', null);
    var plan = 'Basic';
    if (typeof sub === 'string') {
      var s = sub.toLowerCase();
      if (s === 'pro') plan = 'Pro';
      if (s === 'elite') plan = 'Elite';
      return plan;
    }
    if (sub && typeof sub === 'object') {
      var t = String(sub.tier || sub.plan || sub.name || '').toLowerCase();
      if (t === 'pro') plan = 'Pro';
      if (t === 'elite') plan = 'Elite';
      if (t === 'basic') plan = 'Basic';
    }
    return plan;
  }

  var planBadge = byId('planBadge');
  var marginBadge = byId('marginBadge');
  if (planBadge) planBadge.textContent = readPlan();
  if (marginBadge) {
    var m = localStorage.getItem('qm_store_margin_pct') || '15';
    marginBadge.textContent = String(m).replace('%','') + '%';
  }

  var menuToggle = byId('menuToggle');
  var drawer = byId('mobileDrawer');
  var closers = document.querySelectorAll('[data-close-drawer]');
  function setDrawer(open){
    if(!drawer) return;
    drawer.hidden = !open;
    drawer.classList.toggle('open', open);
    document.body.style.overflow = open ? 'hidden' : '';
    if(menuToggle) menuToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  if(menuToggle && drawer){
    menuToggle.addEventListener('click', function(){ setDrawer(drawer.hidden); });
    closers.forEach(function(el){ el.addEventListener('click', function(){ setDrawer(false); }); });
    drawer.addEventListener('click', function(e){
      if(e.target === drawer) setDrawer(false);
    });
    document.addEventListener('keydown', function(e){
      if(e.key === 'Escape') setDrawer(false);
    });
  }
})();
