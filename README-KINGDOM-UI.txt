<!doctype html>
<html lang="pl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Platforma | QualitetMarket</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <header class="topbar">
    <div class="container topbar-inner">
      <a class="brand" href="platforma.html">
        <span class="brand-badge">QM</span>
        <span>QualitetMarket Kingdom</span>
      </a>
      <nav class="nav">
        <a class="active" href="platforma.html">Platforma</a>
        <a href="dashboard.html">Dashboard</a>
        <a href="sklep.html">Sklep</a>
        <a href="hurtownie.html" data-require="pro">Hurtownie</a>
        <a href="cennik.html">Cennik</a>
      </nav>
      <div class="top-actions">
        <span class="plan-pill">Plan: <strong data-current-plan>BASIC</strong></span>
        <a class="btn mobile-menu-btn" href="dashboard.html">Menu</a>
      </div>
    </div>
  </header>

  <main class="kingdom-bg">
    <section class="hero">
      <div class="container hero-grid">
        <div class="card pad">
          <span class="badge">Królestwo sprzedaży • mobile first • GitHub Pages safe</span>
          <h1 class="hero-title">Twoja <span class="gradient-text">platforma</span> ma wyglądać jak wizytówka premium, nie jak zwykła strona.</h1>
          <p class="hero-text">To jest nowy ekran wejścia do QualitetMarket. Dużo kolorów, mocny styl, czytelność na telefonie i szybki dostęp do sklepu, panelu, hurtowni i zamówień.</p>
          <div class="btns" style="margin-top:18px">
            <a class="btn primary" href="sklep.html">Wejdź do sklepu</a>
            <a class="btn secondary" href="dashboard.html">Otwórz dashboard</a>
            <a class="btn pink" href="cennik.html">Ustaw plan</a>
          </div>
          <div class="grid cols-3 section" style="padding-bottom:0">
            <div class="kpi color-card-green"><span class="label">Produkty</span><span class="value" id="hero-products">0</span></div>
            <div class="kpi color-card-violet"><span class="label">Zamówienia</span><span class="value" id="hero-orders">0</span></div>
            <div class="kpi color-card-pink"><span class="label">Sklepy</span><span class="value" id="hero-stores">0</span></div>
          </div>
        </div>

        <div class="card pad hero-visual">
          <h3>Centrum dowodzenia</h3>
          <div class="orb-grid">
            <div class="orb green"><span class="muted">Sklep</span><strong>Premium</strong><div class="muted">Mocna wizytówka sprzedażowa</div></div>
            <div class="orb violet"><span class="muted">Panel</span><strong>Mobile</strong><div class="muted">Wygodny na telefonie</div></div>
            <div class="orb pink"><span class="muted">Kolory</span><strong>Więcej życia</strong><div class="muted">Gradienty i kontrast</div></div>
            <div class="orb amber"><span class="muted">GitHub Pages</span><strong>Stabilność</strong><div class="muted">Bez rozwalonego builda</div></div>
          </div>
          <div class="notice success">To jest ekran wejściowy po wejściu do projektu. Możesz go traktować jak główną wizytówkę systemu.</div>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container grid cols-3">
        <a class="card pad" href="sklep.html">
          <h3>Sklep premium</h3>
          <p class="muted">Kolorowy, czytelny, szybki i gotowy na telefon. To ma być wizytówka Twojej marki.</p>
        </a>
        <a class="card pad" href="dashboard.html">
          <h3>Dashboard operatora</h3>
          <p class="muted">Jedno miejsce do sterowania sklepem, marżą, produktami i zamówieniami.</p>
        </a>
        <a class="card pad" href="hurtownie.html" data-require="pro">
          <h3>Hurtownie i import</h3>
          <p class="muted">Import produktów do qm_products_by_supplier_v1 i szybkie wejście do sprzedaży.</p>
        </a>
      </div>
    </section>

    <section class="section">
      <div class="container grid cols-2">
        <div class="card pad">
          <h2>Dlaczego to wygląda lepiej</h2>
          <div class="list">
            <div class="list-item"><span>Więcej kolorów i gradientów</span><strong>Tak</strong></div>
            <div class="list-item"><span>Lepszy wygląd na telefonie</span><strong>Tak</strong></div>
            <div class="list-item"><span>Większe CTA i lepsza nawigacja</span><strong>Tak</strong></div>
            <div class="list-item"><span>Styl premium pod sklep / SaaS</span><strong>Tak</strong></div>
          </div>
        </div>
        <div class="card pad">
          <h2>Linki wejścia</h2>
          <div class="btns">
            <a class="btn primary" href="dashboard.html">Dashboard</a>
            <a class="btn" href="sklep.html">Sklep</a>
            <a class="btn" href="zamowienia.html">Zamówienia</a>
            <a class="btn" href="panel-sklepu.html">Panel sklepu</a>
          </div>
        </div>
      </div>
    </section>
  </main>

  <footer class="footer">
    <div class="container">QualitetMarket Kingdom • nowy ekran platformy • mobile first</div>
  </footer>

  <script src="js/config.js"></script>
  <script src="js/planGuard.js"></script>
  <script>
    document.addEventListener('DOMContentLoaded',()=>{
      document.getElementById('hero-products').textContent = (window.QM?.getProducts()||[]).length;
      document.getElementById('hero-orders').textContent = (window.QM?.getOrders()||[]).length;
      document.getElementById('hero-stores').textContent = (window.QM?.getStores()||[]).length;
    });
  </script>
</body>
</html>
