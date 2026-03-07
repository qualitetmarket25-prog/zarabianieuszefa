(function () {
  "use strict";

  window.QM_CONFIG = {
    appName: "QualitetMarket",
    version: "1.0.0",

    pricing: {
      retailPct: 0.08,
      wholesalePct: 0.05,
      minProfit: 1.5,
      retailEnds99: true
    },

    currency: "PLN",

    modes: {
      retail: "detal",
      wholesale: "hurt"
    },

    storageKeys: {
      productsBySupplier: "qm_products_by_supplier_v1",
      intelPrefill: "qm_intel_prefill_v1",
      listingPrefill: "qm_listing_prefill_v1",
      crm: "qm_crm_v1",
      stores: "qm_stores_v1",
      activeStore: "qm_active_store_v1",
      storeMarginPct: "qm_store_margin_pct",
      orders: "qm_orders_v1",
      cart: "qm_cart_v1",
      plan: "qm_plan_v1",
      auth: "qm_auth_v1",
      user: "qm_user_v1",
      token: "qm_token_v1",
      subscription: "qm_subscription_v1"
    },

    plans: {
      basic: 1,
      pro: 2,
      elite: 3
    },

    pageAccess: {
      "index.html": "basic",
      "platforma.html": "basic",
      "login.html": "basic",
      "dashboard.html": "basic",
      "cennik.html": "basic",
      "aktywuj-pro.html": "basic",
      "qualitetmarket.html": "basic",
      "sklep.html": "basic",
      "koszyk.html": "basic",
      "checkout.html": "basic",
      "zamowienia.html": "basic",
      "success.html": "basic",

      "hurtownie.html": "pro",
      "intelligence.html": "pro",
      "generator-sklepu.html": "pro",
      "panel-sklepu.html": "pro",

      "sklepy.html": "elite",
      "panel-zamowien-sklepu.html": "elite",
      "suppliers.html": "elite",
      "blueprints.html": "elite"
    },

    redirects: {
      noAccess: "cennik.html",
      noStore: "generator-sklepu.html",
      noLogin: "login.html"
    }
  };
})();