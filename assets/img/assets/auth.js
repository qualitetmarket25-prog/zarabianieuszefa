// assets/auth.js
(function () {
  function login(email) {
    const e = (email || "").trim();
    if (!e || !e.includes("@")) return false;
    localStorage.setItem("qm_user", e);
    if (!localStorage.getItem("qm_plan")) localStorage.setItem("qm_plan", "BASIC");
    return true;
  }

  document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("[data-login-form]");
    if (!form) return;

    form.addEventListener("submit", (ev) => {
      ev.preventDefault();
      const email = form.querySelector("input[name='email']")?.value || "";
      const ok = login(email);
      if (!ok) {
        alert("Wpisz poprawny email.");
        return;
      }
      const back = new URLSearchParams(location.search).get("back");
      location.href = back ? decodeURIComponent(back) : "dashboard.html";
    });
  });
})();
