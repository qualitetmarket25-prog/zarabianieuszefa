(function () {
  "use strict";

  function safeParse(v, d) {
    try {
      return JSON.parse(v);
    } catch (e) {
      return d;
    }
  }

  function getConfig() {
    return window.QM_CONFIG || {};
  }

  function getPage() {
    var p = location.pathname.split("/").pop();
    return p || "index.html";
  }

  function read(key, def) {
    try {
      var v = localStorage.getItem(key);
      if (v === null) return def;
      return v;
    } catch (e) {
      return def;
    }
  }

  function getPlan() {
    var c = getConfig();

    var keys = c.storageKeys || {};

    var p =
      read(keys.plan, "") ||
      (safeParse(read(keys.auth, "{}"), {}).plan) ||
      (safeParse(read(keys.user, "{}"), {}).plan) ||
      (safeParse(read(keys.subscription, "{}"), {}).plan);

    if (!p) return "basic";

    return String(p).toLowerCase();
  }

  function hasAccess(plan, need) {
    var c = getConfig();

    var map = c.plans || {
      basic: 1,
      pro: 2,
      elite: 3,
    };

    var a = map[plan] || 1;
    var b = map[need] || 1;

    return a >= b;
  }

  function getStores() {
    var c = getConfig();
    var k = c.storageKeys.stores;

    return safeParse(read(k, "[]"), []);
  }

  function getActiveStore() {
    var c = getConfig();
    var k = c.storageKeys.activeStore;

    return safeParse(read(k, "null"), null);
  }

  function needsStore(page) {
    var list = [
      "sklep.html",
      "koszyk.html",
      "checkout.html",
      "zamowienia.html",
      "panel-sklepu.html",
    ];

    return list.indexOf(page) !== -1;
  }

  function needsLogin(page) {
    var list = [
      "dashboard.html",
      "hurtownie.html",
      "intelligence.html",
      "generator-sklepu.html",
      "sklep.html",
      "koszyk.html",
      "checkout.html",
      "zamowienia.html",
      "panel-sklepu.html",
      "sklepy.html",
    ];

    return list.indexOf(page) !== -1;
  }

  function isLogged() {
    var c = getConfig();
    var k = c.storageKeys;

    var t = read(k.token, "");
    var a = safeParse(read(k.auth, "{}"), {});
    var u = safeParse(read(k.user, "{}"), {});

    if (t) return true;
    if (a.email) return true;
    if (u.email) return true;

    return false;
  }

  function go(url) {
    if (!url) return;
    if (location.pathname.indexOf(url) !== -1) return;
    location.href = url;
  }

  function run() {
    var c = getConfig();

    var page = getPage();

    var access =
      (c.pageAccess && c.pageAccess[page]) || "basic";

    var plan = getPlan();

    if (needsLogin(page) && !isLogged()) {
      go(c.redirects.noLogin);
      return;
    }

    if (!hasAccess(plan, access)) {
      go(c.redirects.noAccess);
      return;
    }

    if (needsStore(page)) {
      var s = getStores();
      var a = getActiveStore();

      if (!s.length || !a) {
        go(c.redirects.noStore);
        return;
      }
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }

})();