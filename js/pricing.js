(function(){
  'use strict';

  const LS_MARGIN = 'qm_store_margin_pct';
  const LS_PLAN = 'qm_user_plan_v1';

  function round2(value) {
    return Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
  }

  function formatPLN(value) {
    try {
      return new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(Number(value || 0));
    } catch {
      return `${round2(value).toFixed(2)} zł`;
    }
  }

  function safeNum(value, fallback = 0) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  function getPlanMarginFallback() {
    const plan = String((localStorage.getItem(LS_PLAN) || 'basic')).toLowerCase();
    if (plan === 'elite') return 0.24;
    if (plan === 'pro') return 0.18;
    return 0.12;
  }

  function getStoreMargin() {
    try {
      const raw = localStorage.getItem(LS_MARGIN);
      const margin = safeNum(raw, NaN);
      if (Number.isFinite(margin) && margin >= 0) return margin;
    } catch {}
    return getPlanMarginFallback();
  }

  function ends99(price) {
    if (!Number.isFinite(price) || price <= 1) return round2(price);
    const rounded = Math.max(1, Math.floor(price));
    return round2(rounded + 0.99);
  }

  function baseBuyNet(product) {
    return safeNum(
      product.buyNet ?? product.buy_net ?? product.cena_zakupu ?? product.price_buy ?? product.cost_net ?? product.net ?? product.cost,
      0
    );
  }

  function wholesaleBuyNet(product) {
    const v = safeNum(product.buyWholesale ?? product.buy_wholesale ?? product.hurt_net ?? product.wholesale_net, NaN);
    return Number.isFinite(v) && v > 0 ? v : baseBuyNet(product);
  }

  function getPricingRules(custom) {
    return {
      retailPct: safeNum(custom && custom.retailPct, getStoreMargin()),
      wholesalePct: safeNum(custom && custom.wholesalePct, Math.max(0.05, getStoreMargin() * 0.66)),
      minProfit: safeNum(custom && custom.minProfit, 1.5),
      retailEnds99: custom && custom.retailEnds99 !== undefined ? !!custom.retailEnds99 : true
    };
  }

  function priceFromBuy(buyNet, mode = 'detal', customRules) {
    const rules = getPricingRules(customRules);
    const pct = mode === 'hurt' ? rules.wholesalePct : rules.retailPct;
    const raw = safeNum(buyNet, 0) * (1 + pct) + rules.minProfit;
    const finalPrice = (mode === 'detal' && rules.retailEnds99) ? ends99(raw) : round2(raw);
    return Math.max(0, finalPrice);
  }

  function priceFromProduct(product, mode = 'detal', customRules) {
    const sourceBuy = mode === 'hurt' ? wholesaleBuyNet(product) : baseBuyNet(product);
    return priceFromBuy(sourceBuy, mode, customRules);
  }

  window.QM_PRICE = {
    round2,
    formatPLN,
    getStoreMargin,
    getPricingRules,
    priceFromBuy,
    priceFromProduct
  };
})();
