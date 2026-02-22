// ====== PRO SYSTEM (demo) ======
function activatePro() {
  localStorage.setItem("pro_user", "true");
  localStorage.setItem("pro_activated_at", new Date().toISOString());
  window.location.href = "dashboard.html";
}

function logout() {
  localStorage.removeItem("pro_user");
  localStorage.removeItem("pro_activated_at");
  window.location.href = "index.html";
}

function isPro() {
  return localStorage.getItem("pro_user") === "true";
}

function checkPro() {
  if (!isPro()) window.location.href = "cennik.html";
}

function setProBadge() {
  const el = document.querySelector("[data-pro-badge]");
  if (!el) return;
  el.innerHTML = isPro()
    ? `<span class="badge"><span class="dot"></span> Dostęp aktywny: PRO</span>`
    : `<span class="badge"><span class="dot" style="background:#ff5b7a; box-shadow:0 0 0 4px rgba(255,91,122,.12)"></span> Brak dostępu PRO</span>`;
}

// ====== UX: aktywny link w nav ======
function highlightNav() {
  const path = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  document.querySelectorAll("[data-nav] a").forEach(a => {
    const href = (a.getAttribute("href") || "").toLowerCase();
    if (href === path) a.style.background = "rgba(255,255,255,.08)";
  });
}

// ====== LEAD FORM: podstawowa walidacja (opcjonalnie) ======
function leadSubmit(e) {
  e.preventDefault();
  const email = (document.querySelector("#leadEmail")?.value || "").trim();
  if (!email || !email.includes("@")) {
    alert("Wpisz poprawny email.");
    return;
  }
  // Bez backendu: pokazujemy potwierdzenie.
  // Jeśli masz Google Forms — podmienisz link w index.html.
  alert("Zapisane (demo). Jeśli podłączymy Google Forms, będą wpadać leady automatycznie.");
  document.querySelector("#leadEmail").value = "";
}

// ====== INIT ======
document.addEventListener("DOMContentLoaded", () => {
  highlightNav();
  setProBadge();
});
