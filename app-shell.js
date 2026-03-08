
:root{
  --bg:#0b1220; --panel:#111827; --panel2:#0f172a; --line:#243041; --text:#eef2ff; --muted:#9ca3af;
  --brand:#22c55e; --brand2:#38bdf8; --danger:#ef4444; --warn:#f59e0b;
  --radius:18px; --shadow:0 10px 30px rgba(0,0,0,.22);
}
*{box-sizing:border-box}
html,body{margin:0;padding:0;background:linear-gradient(180deg,#08111f,#0b1220 40%,#0b1220);color:var(--text);font-family:Inter,Arial,sans-serif}
a{color:inherit;text-decoration:none}
img{max-width:100%;display:block}
button,input,select,textarea{font:inherit}
.container{width:min(1120px,calc(100% - 24px));margin:0 auto}
.topbar{position:sticky;top:0;z-index:50;backdrop-filter:blur(10px);background:rgba(8,17,31,.84);border-bottom:1px solid rgba(255,255,255,.06)}
.topbar-inner{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 0}
.brand{display:flex;align-items:center;gap:12px}
.brand img{width:40px;height:40px}
.brand .title{font-weight:800;letter-spacing:.2px}
.brand .sub{color:var(--muted);font-size:12px}
.nav{display:flex;gap:10px;align-items:center}
.nav a{padding:10px 14px;border-radius:999px;color:#dbeafe}
.nav a:hover,.nav a.active{background:#132036}
.menu-btn{display:none;border:1px solid var(--line);background:#132036;color:#fff;border-radius:12px;padding:10px 14px}
.drawer{display:none;border-top:1px solid rgba(255,255,255,.06);padding:10px 0 14px}
.drawer.open{display:block}
.drawer-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.drawer a{display:block;padding:12px 14px;background:#101a2d;border:1px solid var(--line);border-radius:14px}
.hero{padding:32px 0 16px}
.hero-grid{display:grid;grid-template-columns:1.2fr .8fr;gap:16px}
.card{background:linear-gradient(180deg,rgba(17,24,39,.95),rgba(13,22,36,.95));border:1px solid rgba(255,255,255,.08);border-radius:var(--radius);box-shadow:var(--shadow)}
.card.pad{padding:18px}
.kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
.kpi{padding:16px;border-radius:16px;background:#0d1729;border:1px solid var(--line)}
.kpi .v{font-size:28px;font-weight:800}
.kpi .l{color:var(--muted);font-size:13px}
h1,h2,h3{margin:0 0 12px}
p{margin:0 0 12px;color:#dbe4f1;line-height:1.55}
.grid{display:grid;gap:14px}
.grid-3{grid-template-columns:repeat(3,1fr)}
.grid-2{grid-template-columns:repeat(2,1fr)}
.cta-row,.actions{display:flex;gap:10px;flex-wrap:wrap}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;border:none;border-radius:14px;padding:13px 16px;font-weight:700;cursor:pointer;min-height:48px}
.btn-primary{background:linear-gradient(90deg,var(--brand),#34d399);color:#052e16}
.btn-secondary{background:#162235;color:#e5f3ff;border:1px solid var(--line)}
.btn-danger{background:#3b1116;color:#fecaca;border:1px solid #5a1c24}
.badge{display:inline-flex;gap:8px;align-items:center;border-radius:999px;background:#102033;border:1px solid var(--line);padding:8px 12px;color:#cce7ff;font-size:13px}
.section{padding:10px 0 22px}
.module{padding:16px;border-radius:18px;background:#0d1729;border:1px solid var(--line)}
.module h3{font-size:18px}
.module p{min-height:48px}
.footer{margin-top:28px;border-top:1px solid rgba(255,255,255,.08);padding:20px 0 90px;color:var(--muted)}
.footer-links{display:flex;flex-wrap:wrap;gap:12px}
.product-list,.cart-list,.order-list,.store-list{display:grid;gap:12px}
.product,.cart-item,.order,.store{padding:16px;border-radius:16px;background:#0d1729;border:1px solid var(--line)}
.row{display:flex;justify-content:space-between;gap:10px;align-items:center}
.meta{color:var(--muted);font-size:14px}
.price{font-size:24px;font-weight:800}
.tag{display:inline-block;padding:6px 10px;border-radius:999px;background:#112337;color:#bde1ff;font-size:12px}
.input,.select,textarea{width:100%;background:#0a1324;color:#fff;border:1px solid var(--line);border-radius:14px;padding:13px 14px;min-height:48px}
.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.notice{padding:14px;border-radius:14px;background:#12243a;border:1px solid #1e3550;color:#d9efff}
.small{font-size:13px;color:var(--muted)}
.empty{padding:18px;border:1px dashed var(--line);border-radius:14px;color:var(--muted);text-align:center}
.bottom-nav{display:none;position:fixed;left:12px;right:12px;bottom:12px;z-index:60;background:rgba(10,18,31,.95);border:1px solid var(--line);border-radius:18px;padding:8px;grid-template-columns:repeat(5,1fr);gap:8px;box-shadow:var(--shadow)}
.bottom-nav a{padding:10px 8px;border-radius:12px;text-align:center;font-size:12px;color:#dbeafe;background:#101a2d}
.bottom-nav a.active{background:#16304d}
@media (max-width: 900px){
  .nav{display:none}.menu-btn{display:inline-flex}
  .hero-grid,.grid-3,.grid-2,.kpis,.form-grid{grid-template-columns:1fr}
  .bottom-nav{display:grid}
  .container{width:min(100% - 16px,1120px)}
  .hero{padding:18px 0 8px}
  h1{font-size:28px}
}
