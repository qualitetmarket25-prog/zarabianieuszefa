(function () {
  "use strict";

  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  function getSubs() {
    return window.QM_SUBS || null;
  }

  function normalizePlan(planId) {
    const raw = String(planId || "basic").toLowerCase().trim();
    return ["basic", "pro", "elite"].includes(raw) ? raw : "basic";
  }

  function goToPricing(requiredPlan) {
    const target = "./cennik.html?required=" + encodeURIComponent(normalizePlan(requiredPlan || "pro"));
    window.location.href = target;
  }

  function decorateLockedNode(node, requiredPlan) {
    if (!node || node.dataset.guardReady === "1") return;

    node.dataset.guardReady = "1";
    node.classList.add("qm-guard-ready");

    if (!node.hasAttribute("title")) {
      node.setAttribute("title", "Wymagany plan: " + String(requiredPlan || "PRO").toUpperCase());
    }

    const tag = node.tagName.toLowerCase();
    const clickable = tag === "a" || tag === "button" || node.hasAttribute("data-click-guard");

    if (clickable) {
      node.addEventListener("click", function (e) {
        const subs = getSubs();
        const req = normalizePlan(node.getAttribute("data-require") || requiredPlan || "pro");
        const ok = subs && typeof subs.hasAccess === "function" ? subs.hasAccess(req) : false;

        if (ok) return;

        e.preventDefault();
        e.stopPropagation();
        goToPricing(req);
      });
    }
  }

  function renderTopNotice(planId) {
    const notice = document.querySelector("[data-plan-notice]");
    if (!notice) return;

    if (planId === "basic") {
      notice.innerHTML = 'Masz plan <strong>BASIC</strong>. Odblokuj <strong>PRO</strong> dla hurtowni premium i panelu sprzedawcy.';
      notice.hidden = false;
      return;
    }

    if (planId === "pro") {
      notice.innerHTML = 'Masz plan <strong>PRO</strong>. Wejdź w <strong>ELITE</strong>, żeby odblokować AI pomocnika i najmocniejszy pakiet.';
      notice.hidden = false;
      return;
    }

    notice.hidden = true;
  }

  ready(function () {
    const subs = getSubs();
    const planId = subs && typeof subs.getPlanId === "function" ? subs.getPlanId() : "basic";

    if (subs && typeof subs.applyPlanToDom === "function") {
      subs.applyPlanToDom();
    }

    document.querySelectorAll("[data-require]").forEach((node) => {
      const req = normalizePlan(node.getAttribute("data-require") || "basic");
      const ok = subs && typeof subs.hasAccess === "function" ? subs.hasAccess(req) : false;

      if (!ok) {
        node.classList.add("is-locked");
        decorateLockedNode(node, req);
      } else {
        node.classList.remove("is-locked");
      }
    });

    document.querySelectorAll("[data-plan-label]").forEach((node) => {
      node.textContent = String(planId || "basic").toUpperCase();
    });

    renderTopNotice(planId);
  });
})();
