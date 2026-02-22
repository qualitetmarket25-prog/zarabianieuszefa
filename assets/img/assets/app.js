// assets/app.js
(function () {
  const DEFAULT_PLAN = "BASIC"; // BASIC / PRO / ELITE

  function getPlan() {
    return (localStorage.getItem("qm_plan") || DEFAULT_PLAN).toUpperCase();
  }
  function setPlan(plan) {
    localStorage.setItem("qm_plan", String(plan).toUpperCase());
    renderPlanBadge();
  }
  function isPro() {
    const p = getPlan();
    return p === "PRO" || p === "ELITE";
  }
  function isLogged() {
    return !!localStorage.getItem("qm_user");
  }

  function renderPlanBadge() {
    const el = document.querySelector("[data-qm-plan]");
    if (!el) return;
    const p = getPlan();
    if (p === "BASIC") {
      el.textContent = "Brak dostępu PRO";
      el.classList.remove("ok");
      el.classList.add("warn");
    } else {
      el.textContent = `Aktywne: ${p}`;
      el.classList.remove("warn");
      el.classList.add("ok");
    }
  }

  window.QM = {
    getPlan,
    setPlan,
    isPro,
    isLogged,
    logout() {
      localStorage.removeItem("qm_user");
      window.location.href = "login.html";
    },
    requireLogin() {
      if (!isLogged()) window.location.href = "login.html";
    },
    requirePro(returnTo) {
      if (!isPro()) {
        const back = encodeURIComponent(returnTo || location.pathname.split("/").pop() || "index.html");
        window.location.href = `cennik.html?back=${back}`;
      }
    }
  };

  document.addEventListener("DOMContentLoaded", () => {
    renderPlanBadge();

    const req = document.body.getAttribute("data-require");
    if (req === "login") window.QM.requireLogin();
    if (req === "pro") window.QM.requirePro(document.body.getAttribute("data-back") || null);

    document.querySelectorAll("[data-qm-logout]").forEach(btn => {
      btn.addEventListener("click", (e) => { e.preventDefault(); window.QM.logout(); });
    });
  });
})();
