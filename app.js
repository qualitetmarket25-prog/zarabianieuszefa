// app.js — wspólna logika platformy (front-only demo)

const APP = {
  allowedPlans: ["PRO", "ELITE"],

  getPlan() {
    return (localStorage.getItem("status") || "BASIC").toUpperCase();
  },

  setPlan(plan) {
    localStorage.setItem("status", String(plan || "BASIC").toUpperCase());
    localStorage.setItem("paid_at", new Date().toISOString());
  },

  isAllowed() {
    return APP.allowedPlans.includes(APP.getPlan());
  },

  // prosta sesja demo
  isLoggedIn() {
    return localStorage.getItem("session") === "1";
  },

  login(email) {
    localStorage.setItem("session", "1");
    localStorage.setItem("user_email", email || "user@example.com");
  },

  logout(redirect = "index.html") {
    localStorage.removeItem("session");
    localStorage.removeItem("user_email");
    // NIE kasujemy planu przy logout (opcjonalnie)
    window.location.href = redirect;
  },

  hardLogout(redirect = "index.html") {
    localStorage.removeItem("session");
    localStorage.removeItem("user_email");
    localStorage.removeItem("status");
    localStorage.removeItem("paid_at");
    window.location.href = redirect;
  },

  requireLogin() {
    if (!APP.isLoggedIn()) {
      window.location.href = "login.html";
      return false;
    }
    return true;
  },

  requirePlan() {
    if (!APP.isAllowed()) {
      // zostawiamy usera zalogowanego, ale blokujemy moduł
      return false;
    }
    return true;
  },

  // UI helper
  setText(id, txt) {
    const el = document.getElementById(id);
    if (el) el.textContent = txt;
  }
};
