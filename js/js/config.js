(function () {
  "use strict";

  window.QM_CONFIG = {
    appName: "QualitetMarket",
    version: "1.0.0",
    storageKeys: {
      productsBySupplier: "qm_products_by_supplier_v1",
      intelPrefill: "qm_intel_prefill_v1",
      listingPrefill: "qm_listing_prefill_v1",
      crm: "qm_crm_v1",
      stores: "qm_stores_v1",
      activeStore: "qm_active_store_v1",
      storeMarginPct: "qm_store_margin_pct"
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