function activatePro() {
  localStorage.setItem("pro_user", "true");
  window.location.href = "dashboard.html";
}

function checkPro() {
  const isPro = localStorage.getItem("pro_user");
  if (isPro !== "true") {
    window.location.href = "cennik.html";
  }
}
