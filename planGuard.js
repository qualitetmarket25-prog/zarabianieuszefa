
(function(){
  const pricing = {
    basic:{price:79, margin:18, name:'Basic'},
    pro:{price:149, margin:28, name:'Pro'},
    elite:{price:299, margin:38, name:'Elite'}
  };
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-plan-select]');
    if(!btn) return;
    const plan = btn.getAttribute('data-plan-select');
    if(!pricing[plan]) return;
    window.QMAutoMargin?.setPlan(plan);
    location.href = 'aktywuj-pro.html?plan=' + encodeURIComponent(plan);
  });

  const summary = document.getElementById('subscriptionSummary');
  if(summary){
    const params = new URLSearchParams(location.search);
    const plan = (params.get('plan') || localStorage.getItem('qm_plan_v1') || 'pro').toLowerCase();
    const data = pricing[plan] || pricing.pro;
    summary.innerHTML = `
      <div class="list-row"><strong>Plan</strong><span>${data.name}</span></div>
      <div class="list-row"><strong>Cena</strong><span>${data.price} PLN / mies.</span></div>
      <div class="list-row"><strong>Marża</strong><span>${data.margin}%</span></div>
    `;
  }

  const form = document.getElementById('activatePlanForm');
  if(form){
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const plan = (fd.get('plan') || localStorage.getItem('qm_plan_v1') || 'pro').toString().toLowerCase();
      window.QMAutoMargin?.setPlan(plan);
      localStorage.setItem('qm_customer_v1', JSON.stringify(Object.fromEntries(fd.entries())));
      location.href = 'success.html?plan=' + encodeURIComponent(plan);
    });
  }
})();
