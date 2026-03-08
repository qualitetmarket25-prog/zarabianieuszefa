
(function(){
  const PLANS = {
    basic:{price:79, billing:'mies.', margin:18},
    pro:{price:149, billing:'mies.', margin:28},
    elite:{price:299, billing:'mies.', margin:38}
  };

  window.qmSubscriptions = {
    plans: PLANS,
    activate(plan){
      const meta = PLANS[plan] || PLANS.basic;
      localStorage.setItem('qm_plan_v1', plan);
      localStorage.setItem('qm_store_margin_pct', String(meta.margin));
      localStorage.setItem('qm_subscription_v1', JSON.stringify({
        plan, price: meta.price, billing: meta.billing, margin: meta.margin, activeAt: new Date().toISOString()
      }));
      return meta;
    },
    current(){
      try { return JSON.parse(localStorage.getItem('qm_subscription_v1')) || null; }
      catch(e){ return null; }
    }
  };
})();
