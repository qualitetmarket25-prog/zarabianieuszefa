
:root{
  --bg:#07111f;
  --bg2:#0b172a;
  --panel:rgba(15,23,42,.82);
  --panel2:#0f172a;
  --line:rgba(148,163,184,.18);
  --text:#f8fafc;
  --muted:#94a3b8;
  --green:#22c55e;
  --green2:#4ade80;
  --blue:#38bdf8;
  --amber:#f59e0b;
  --danger:#ef4444;
  --shadow:0 20px 60px rgba(0,0,0,.35);
  --radius:24px;
  --max:1180px;
}
*{box-sizing:border-box}
html,body{margin:0;padding:0;background:
radial-gradient(circle at top right, rgba(56,189,248,.18), transparent 28%),
radial-gradient(circle at top left, rgba(34,197,94,.12), transparent 30%),
linear-gradient(180deg,#06101d,#091523 55%,#07111f);
color:var(--text);font-family:Inter,ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;min-height:100%}
a{color:inherit;text-decoration:none}
img{max-width:100%;display:block}
button,input,select,textarea{font:inherit}
.container{width:min(var(--max),calc(100% - 28px));margin:0 auto}
.shell{display:grid;grid-template-columns:280px minmax(0,1fr);min-height:100vh}
.sidebar{position:sticky;top:0;height:100vh;padding:18px 14px;border-right:1px solid var(--line);background:linear-gradient(180deg,rgba(15,23,42,.75),rgba(2,8,23,.88));backdrop-filter:blur(20px)}
.brand{display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:20px;background:rgba(255,255,255,.03);border:1px solid var(--line)}
.brand-logo{width:44px;height:44px;flex:0 0 44px}
.brand-name{font-size:1rem;font-weight:800;letter-spacing:.01em}
.brand-sub{font-size:.75rem;color:var(--muted)}
.nav-group{margin-top:18px}
.nav-label{font-size:.72rem;color:var(--muted);text-transform:uppercase;letter-spacing:.12em;padding:10px 12px}
.nav-link{display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:18px;color:#dbeafe;border:1px solid transparent;transition:.2s}
.nav-link:hover,.nav-link.active{background:rgba(56,189,248,.08);border-color:var(--line);transform:translateY(-1px)}
.nav-link .icon{width:22px;text-align:center}
.main{min-width:0}
.topbar{position:sticky;top:0;z-index:30;background:rgba(7,17,31,.72);backdrop-filter:blur(18px);border-bottom:1px solid var(--line)}
.topbar-inner{display:flex;align-items:center;gap:12px;justify-content:space-between;padding:12px 0}
.mobile-brand{display:none;align-items:center;gap:10px}
.mobile-brand img{width:38px;height:38px}
.burger{display:none;width:46px;height:46px;border:none;border-radius:14px;background:rgba(255,255,255,.05);color:#fff}
.top-actions{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.badge{display:inline-flex;align-items:center;gap:8px;padding:10px 14px;border-radius:999px;background:rgba(34,197,94,.12);color:#c7f9d4;border:1px solid rgba(34,197,94,.2);font-weight:700}
.badge.blue{background:rgba(56,189,248,.12);color:#d9f5ff;border-color:rgba(56,189,248,.2)}
.btn,.chip{display:inline-flex;align-items:center;justify-content:center;gap:10px;min-height:48px;padding:0 18px;border-radius:16px;border:1px solid var(--line);background:rgba(255,255,255,.04);color:#fff;font-weight:700;cursor:pointer;transition:.2s}
.btn:hover,.chip:hover{transform:translateY(-1px);border-color:rgba(255,255,255,.22)}
.btn-primary{background:linear-gradient(135deg,var(--green),var(--green2));color:#04110b;border:none}
.btn-blue{background:linear-gradient(135deg,#0ea5e9,#22d3ee);border:none}
.btn-dark{background:rgba(255,255,255,.06)}
.page{padding:26px 0 110px}
.hero{display:grid;grid-template-columns:1.25fr .85fr;gap:18px;align-items:stretch}
.card{background:linear-gradient(180deg,rgba(15,23,42,.88),rgba(15,23,42,.74));border:1px solid var(--line);border-radius:var(--radius);box-shadow:var(--shadow)}
.card-pad{padding:24px}
.eyebrow{display:inline-flex;align-items:center;gap:8px;padding:8px 12px;border-radius:999px;background:rgba(56,189,248,.12);color:#d9f5ff;font-size:.78rem;font-weight:800;border:1px solid rgba(56,189,248,.18)}
h1,h2,h3{margin:0 0 10px}
h1{font-size:clamp(2rem,5vw,3.9rem);line-height:1.02;letter-spacing:-.03em}
h2{font-size:clamp(1.2rem,2vw,1.7rem)}
p.lead{font-size:1.05rem;color:#d7e7f7;max-width:760px}
.muted{color:var(--muted)}
.grid{display:grid;gap:18px}
.grid-2{grid-template-columns:repeat(2,minmax(0,1fr))}
.grid-3{grid-template-columns:repeat(3,minmax(0,1fr))}
.grid-4{grid-template-columns:repeat(4,minmax(0,1fr))}
.kpi{padding:18px;border-radius:22px;border:1px solid var(--line);background:rgba(255,255,255,.03)}
.kpi-value{font-size:1.8rem;font-weight:900}
.kpi-label{color:var(--muted);font-size:.9rem}
.module-card,.product-card,.plan-card{display:flex;flex-direction:column;gap:14px;padding:18px;border-radius:24px;border:1px solid var(--line);background:rgba(255,255,255,.03)}
.module-card .icon-xl,.product-card .icon-xl,.plan-card .icon-xl{font-size:1.6rem}
.module-card h3,.product-card h3,.plan-card h3{font-size:1.15rem}
.module-card p,.product-card p,.plan-card p{margin:0;color:#d7e7f7}
.search{display:flex;align-items:center;gap:12px;padding:14px 16px;border-radius:18px;border:1px solid var(--line);background:rgba(255,255,255,.05)}
.search input{flex:1;background:transparent;border:none;color:#fff;outline:none}
.list{display:grid;gap:12px}
.list-row{display:flex;justify-content:space-between;gap:10px;align-items:center;padding:16px 18px;border-radius:20px;border:1px solid var(--line);background:rgba(255,255,255,.03)}
.price{font-weight:900;font-size:1.35rem}
.small{font-size:.86rem}
.table{width:100%;border-collapse:collapse}
.table th,.table td{padding:14px;border-bottom:1px solid var(--line);text-align:left}
.table th{color:var(--muted);font-weight:700}
.pill{display:inline-flex;padding:8px 10px;border-radius:999px;background:rgba(255,255,255,.06);font-size:.8rem;color:#e2e8f0}
.pill.green{background:rgba(34,197,94,.12);color:#d6ffe2}
.pill.blue{background:rgba(56,189,248,.12);color:#d7f5ff}
.footer{border-top:1px solid var(--line);padding:26px 0 96px;background:linear-gradient(180deg,transparent,rgba(2,8,23,.45))}
.footer-grid{display:grid;grid-template-columns:1.2fr repeat(3,minmax(0,1fr));gap:18px}
.footer h4{margin:0 0 10px}
.footer a{display:block;padding:7px 0;color:#dce7f4}
.bottom-nav{display:none;position:fixed;bottom:10px;left:10px;right:10px;z-index:40;background:rgba(15,23,42,.92);border:1px solid var(--line);border-radius:22px;backdrop-filter:blur(18px);padding:8px;grid-template-columns:repeat(5,1fr);gap:8px;box-shadow:var(--shadow)}
.bottom-nav a{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;padding:8px 6px;border-radius:16px;color:#e2e8f0;font-size:.73rem}
.bottom-nav a.active,.bottom-nav a:hover{background:rgba(56,189,248,.12)}
.mobile-drawer{display:none}
.hide-desktop{display:none}
.notice{padding:14px 16px;border-radius:18px;background:rgba(245,158,11,.12);border:1px solid rgba(245,158,11,.2);color:#ffe7ba}
.field{display:grid;gap:8px}
.field input,.field select,.field textarea{background:rgba(255,255,255,.05);border:1px solid var(--line);border-radius:16px;color:#fff;padding:14px 16px;outline:none;min-height:48px}
.field textarea{min-height:120px;resize:vertical}
.form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
.hr{height:1px;background:var(--line);margin:8px 0}
.empty{padding:26px;text-align:center;color:var(--muted)}
.hero-art{min-height:100%;background:
radial-gradient(circle at 30% 20%, rgba(34,197,94,.32), transparent 24%),
radial-gradient(circle at 70% 40%, rgba(56,189,248,.28), transparent 22%),
linear-gradient(135deg, rgba(255,255,255,.06), rgba(255,255,255,.02));
border-radius:var(--radius);padding:18px;display:grid;gap:12px}
.hero-chip{padding:12px 14px;border-radius:18px;background:rgba(255,255,255,.05);border:1px solid var(--line)}
@media (max-width:1024px){
  .shell{grid-template-columns:1fr}
  .sidebar{display:none}
  .burger,.mobile-brand{display:flex}
  .hero,.grid-4{grid-template-columns:1fr 1fr}
  .footer-grid{grid-template-columns:1fr 1fr}
  .mobile-drawer{display:block;position:fixed;inset:0;z-index:60;background:rgba(2,8,23,.6);opacity:0;pointer-events:none;transition:.2s}
  .mobile-drawer.open{opacity:1;pointer-events:auto}
  .mobile-drawer-panel{position:absolute;left:0;top:0;bottom:0;width:min(88vw,360px);background:#08111f;border-right:1px solid var(--line);padding:16px;transform:translateX(-100%);transition:.24s}
  .mobile-drawer.open .mobile-drawer-panel{transform:translateX(0)}
  body.drawer-open{overflow:hidden}
}
@media (max-width:780px){
  .grid-2,.grid-3,.grid-4,.hero,.form-grid,.footer-grid{grid-template-columns:1fr}
  h1{font-size:2.25rem}
  .page{padding-top:20px}
  .top-actions .badge{display:none}
  .bottom-nav{display:grid}
  .hide-mobile{display:none}
  .hide-desktop{display:block}
}
