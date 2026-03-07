(function () {
  "use strict";

  function safeParse(value, fallback) {
    try {
      return JSON.parse(value);
    } catch (e) {
      return fallback;
    }
  }

  function getConfig() {
    return window.QM_CONFIG || {
      plans: { basic: 1, pro: 2, elite: 3 },
      pageAccess: {},
      redirects: {
        noAccess: "cennik.html",
        noStore: "generator-sklepu.html",
        noLogin: "login.html"
      }
    };
  }

  function getCurrentPage() {
    var path = window.location.pathname || "";
    var page = path.split("/").pop();
    return page || "index.html";
  }

  function readLocal(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      if (raw === null || raw === undefined || raw === "") return fallback;
      return raw;
    } catch (e) {
      return fallback;
    }
  }

  function getUserPlan() {
    var directPlan = readLocal("qm_plan_v1", "");
    if (directPlan && typeof directPlan === "string") {
      return directPlan.toLowerCase().trim();
    }

    var auth = safeParse(readLocal("qm_auth_v1", "{}"), {});
    if (auth && auth.plan) return String(auth.plan).toLowerCase().trim();

    var user = safeParse(readLocal("qm_user_v1", "{}"), {});
    if (user && user.plan) return String(user.plan).toLowerCase().trim();

    var sub = safeParse(readLocal("qm_subscription_v1", "{}"), {});
    if (sub && sub.plan) return String(sub.plan).toLowerCase().trim();

    return "basic";
  }

  function hasRequiredPlan(currentPlan, requiredPlan, plansMap) {
    var current = plansMap[currentPlan] || plansMap.basic || 1;
    var required = plansMap[requiredPlan] || plansMap.basic || 1;
    return current >= required;
  }

  function hasAnyLogin() {
    var auth = safeParse(readLocal("qm_auth_v1", "{}"), {});
    var user = safeParse(readLocal("qm_user_v1", "{}"), {});
    var token = readLocal("qm_token_v1", "");

    if (token) return true;
    if (auth && (auth.email || auth.id || auth.loggedIn)) return true;
    if (user && (user.email || user.id)) return true;

    return false;
  }

  function getStores() {
    var config = getConfig();
    return safeParse(readLocal(config.storageKeys ? config.storageKeys.stores : "qm_stores_v1", "[]"), []);
  }

  function getActiveStore() {
    var config = getConfig();
    return safeParse(readLocal(config.storageKeys ? config.storageKeys.activeStore : "qm_active_store_v1", "null"), null);
  }

  function pageNeedsStore(page) {
    return [
      "sklep.html",
      "koszyk.html",
      "checkout.html",
      "zamowienia.html",
      "panel-sklepu.html",
      "panel-zamowien-sklepu.html"
    ].indexOf(page) !== -1;
  }

  function pageNeedsLogin(page) {
    return [
      "dashboard.html",
      "hurtownie.html",
      "qualitetmarket.html",
      "intelligence.html",
      "sklep.html",
      "koszyk.html",
      "checkout.html",
      "zamowienia.html",
      "panel-sklepu.html",
      "generator-sklepu.html",
      "panel-zamowien-sklepu.html",
      "sklepy.html",
      "suppliers.html",
      "blueprints.html"
    ].indexOf(page) !== -1;
  }

  function buildUpgradeUrl(page) {
    var target = "cennik.html";
    try {
      return target + "?from=" + encodeURIComponent(page);
    } catch (e) {
      return target;
    }
  }

  function buildCreateStoreUrl(page) {
    var target = "generator-sklepu.html";
    try {
      return target + "?from=" + encodeURIComponent(page);
    } catch (e) {
      return target;
    }
  }

  function redirect(url) {
    if (!url) return;
    if (window.location.pathname.indexOf(url) !== -1) return;
    window.location.href = url;
  }

  function injectGuardBanner(message, buttonText, buttonHref) {
    if (!document.body) return;

    var old = document.getElementById("qm-guard-banner");
    if (old) old.remove();

    var wrap = document.createElement("div");
    wrap.id = "qm-guard-banner";
    wrap.style.position = "fixed";
    wrap.style.left = "12px";
    wrap.style.right = "12px";
    wrap.style.bottom = "12px";
    wrap.style.zIndex = "99999";
    wrap.style.background = "#111";
    wrap.style.color = "#fff";
    wrap.style.padding = "14px";
    wrap.style.borderRadius = "14px";
    wrap.style.boxShadow = "0 10px 30px rgba(0,0,0,0.25)";
    wrap.style.fontFamily = "Arial, sans-serif";

    var text = document.createElement("div");
    text.style.fontSize = "14px";
    text.style.lineHeight = "1.45";
    text.style.marginBottom = "10px";
    text.textContent = message;

    var btn = document.createElement("a");
    btn.href = buttonHref || "cennik.html";
    btn.textContent = buttonText || "Przejdź dalej";
    btn.style.display = "block";
    btn.style.textAlign = "center";
    btn.style.background = "#fff";
    btn.style.color = "#111";
    btn.style.textDecoration = "none";
    btn.style.padding = "12px 14px";
    btn.style.borderRadius = "10px";
    btn.style.fontWeight = "700";
    btn.style.fontSize = "14px";

    wrap.appendChild(text);
    wrap.appendChild(btn);
    document.body.appendChild(wrap);
  }

  function runGuard() {
    var config = getConfig();
    var page = getCurrentPage();
    var requiredPlan = (config.pageAccess && config.pageAccess[page]) || "basic";
    var currentPlan = getUserPlan();
    var loggedIn = hasAnyLogin();

    if (pageNeedsLogin(page) && !loggedIn) {
      redirect((config.redirects && config.redirects.noLogin) || "login.html");
      return;
    }

    if (!hasRequiredPlan(currentPlan, requiredPlan, config.plans || {})) {
      injectGuardBanner(
        "Ta strona wymaga planu " + requiredPlan.toUpperCase() + ". Twój aktualny plan: " + currentPlan.toUpperCase() + ".",
        "Odblokuj plan",
        buildUpgradeUrl(page)
      );
      redirect(buildUpgradeUrl(page));
      return;
    }

    if (pageNeedsStore(page)) {
      var stores = getStores();
      var activeStore = getActiveStore();

      var hasStores = Array.isArray(stores) && stores.length > 0;
      var hasActiveStore = !!activeStore;

      if (!hasStores || !hasActiveStore) {
        injectGuardBanner(
          "Najpierw utwórz i aktywuj sklep, żeby wejść na tę stronę.",
          "Utwórz sklep",
          buildCreateStoreUrl(page)
        );
        redirect(buildCreateStoreUrl(page));
        return;
      }
    }

    document.documentElement.setAttribute("data-qm-plan", currentPlan);
    document.documentElement.setAttribute("data-qm-page", page);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", runGuard);
  } else {
    runGuard();
  }

  window.QMGuard = {
    run: runGuard,
    getUserPlan: getUserPlan,
    getStores: getStores,
    getActiveStore: getActiveStore
  };
})();