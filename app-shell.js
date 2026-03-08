
:root{
  --bg:#07111f;
  --panel:#0f172a;
  --panel-2:#111827;
  --muted:#94a3b8;
  --text:#e5eefb;
  --line:rgba(148,163,184,.18);
  --brand:#22c55e;
  --brand-2:#38bdf8;
  --danger:#ef4444;
  --warning:#f59e0b;
  --radius:18px;
  --shadow:0 10px 30px rgba(0,0,0,.25);
}
*{box-sizing:border-box}
html,body{margin:0;padding:0;background:linear-gradient(180deg,#06101d,#0a1324 28%,#0a1320);color:var(--text);font-family:Inter,system-ui,Arial,sans-serif}
a{color:inherit;text-decoration:none}
img{max-width:100%;display:block}
button,input,select,textarea{font:inherit}
body.menu-open{overflow:hidden}
.app-shell{min-height:100vh;display:flex;flex-direction:column}
.topbar{
  position:sticky;top:0;z-index:50;
  backdrop-filter: blur(12px);
  background:rgba(6,16,29,.82);
  border-bottom:1px solid var(--line);
}
.topbar-inner{max-width:1180px;margin:0 auto;padding:14px 16px;display:flex;align-items:center;gap:12px;justify-content:space-between}
.brand{display:flex;align-items:center;gap:12px;font-weight:800;letter-spacing:.2px}
.brand img{width:42px;height:42px;border-radius:12px;box-shadow:var(--shadow)}
.brand small{display:block;color:var(--muted);font-weight:600;font-size:12px}
.top-actions{display:flex;align-items:center;gap:10px}
.btn,.chip,.tab{
  appearance:none;border:1px solid var(--line);background:var(--panel);color:var(--text);
  padding:12px 16px;border-radius:14px;cursor:pointer;transition:.18s ease;min-height:46px
}
.btn:hover,.chip:hover,.tab:hover{transform:translateY(-1px);border-color:rgba(56,189,248,.45)}
.btn-primary{background:linear-gradient(135deg,var(--brand),#16a34a);border:none;color:#02110a;font-weight:800}
.btn-secondary{background:linear-gradient(135deg,#0b2237,#12243a);border-color:rgba(56,189,248,.35)}
.btn-danger{background:rgba(239,68,68,.12);border-color:rgba(239,68,68,.28)}
.icon-btn{width:46px;height:46px;border-radius:14px;display:inline-flex;align-items:center;justify-content:center;font-size:20px}
.layout{max-width:1180px;margin:0 auto;padding:18px 16px 110px;width:100%}
.hero{
  padding:24px;border:1px solid var(--line);border-radius:28px;background:
  radial-gradient(circle at top right, rgba(34,197,94,.15), transparent 26%),
  radial-gradient(circle at left bottom, rgba(56,189,248,.12), transparent 26%),
  linear-gradient(180deg, rgba(17,24,39,.9), rgba(15,23,42,.92));
  box-shadow:var(--shadow)
}
.hero h1{margin:0 0 10px;font-size:34px;line-height:1.05}
.hero p{margin:0;color:var(--muted);font-size:16px;max-width:760px}
.hero-actions{display:flex;gap:12px;flex-wrap:wrap;margin-top:18px}
.grid{display:grid;gap:16px}
.grid.cards{grid-template-columns:repeat(12,1fr);margin-top:18px}
.card{
  grid-column:span 12;background:linear-gradient(180deg,rgba(15,23,42,.92),rgba(17,24,39,.96));
  border:1px solid var(--line);border-radius:24px;padding:18px;box-shadow:var(--shadow)
}
.card h2,.card h3{margin:0 0 8px}
.card p{margin:0;color:var(--muted)}
.kpi{display:flex;flex-direction:column;gap:6px}
.kpi strong{font-size:28px}
.section-title{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:26px 0 10px}
.section-title h2{margin:0;font-size:22px}
.muted{color:var(--muted)}
.module-grid{display:grid;grid-template-columns:repeat(12,1fr);gap:16px}
.module{
  grid-column:span 12;padding:18px;border-radius:22px;border:1px solid var(--line);
  background:linear-gradient(180deg,rgba(15,23,42,.94),rgba(9,17,31,.98));display:flex;flex-direction:column;gap:12px
}
.module .emoji{font-size:26px}
.module .actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:auto}
.badge{display:inline-flex;align-items:center;gap:8px;border:1px solid var(--line);padding:8px 10px;border-radius:999px;color:var(--muted);font-size:13px}
.row{display:flex;gap:12px;flex-wrap:wrap}
.input,.select,.textarea{
  width:100%;background:#08111e;color:var(--text);border:1px solid var(--line);border-radius:16px;
  padding:13px 14px;outline:none
}
.input:focus,.select:focus,.textarea:focus{border-color:rgba(56,189,248,.45);box-shadow:0 0 0 3px rgba(56,189,248,.12)}
.form-grid{display:grid;grid-template-columns:repeat(12,1fr);gap:14px}
.col-12{grid-column:span 12}.col-6{grid-column:span 12}.col-4{grid-column:span 12}
.table-wrap{overflow:auto;border:1px solid var(--line);border-radius:18px}
table{width:100%;border-collapse:collapse;min-width:720px;background:rgba(6,16,29,.45)}
th,td{padding:14px;border-bottom:1px solid var(--line);text-align:left}
th{color:#c8d6ea;font-size:14px;background:rgba(255,255,255,.03)}
.empty{padding:22px;border:1px dashed var(--line);border-radius:18px;text-align:center;color:var(--muted)}
.list{display:grid;gap:12px}
.list-item{display:flex;gap:12px;align-items:center;justify-content:space-between;padding:14px;border:1px solid var(--line);border-radius:18px;background:rgba(255,255,255,.02)}
.list-item .meta{display:flex;gap:12px;align-items:center}
.thumb{width:72px;height:72px;border-radius:16px;object-fit:cover;background:#0b1220}
.price{font-size:22px;font-weight:800}
.footer{margin-top:auto;border-top:1px solid var(--line);background:rgba(6,16,29,.8)}
.footer-inner{max-width:1180px;margin:0 auto;padding:28px 16px 110px}
.footer-grid{display:grid;grid-template-columns:repeat(12,1fr);gap:18px}
.footer-col{grid-column:span 12}
.footer a{color:var(--muted)}
.drawer-backdrop{position:fixed;inset:0;background:rgba(2,6,23,.56);z-index:60;opacity:0;pointer-events:none;transition:.2s}
.drawer{position:fixed;top:0;right:0;height:100vh;width:min(360px,92vw);background:#07111f;border-left:1px solid var(--line);z-index:61;transform:translateX(100%);transition:.22s;padding:18px;display:flex;flex-direction:column;gap:12px}
body.menu-open .drawer-backdrop{opacity:1;pointer-events:auto}
body.menu-open .drawer{transform:none}
.drawer .nav-link{padding:14px 16px;border-radius:16px;border:1px solid var(--line);background:rgba(255,255,255,.02)}
.drawer .nav-link.active{background:rgba(34,197,94,.12);border-color:rgba(34,197,94,.35)}
.mobile-nav{
  position:fixed;left:12px;right:12px;bottom:12px;z-index:55;
  border:1px solid var(--line);background:rgba(6,16,29,.9);backdrop-filter:blur(10px);
  border-radius:22px;padding:10px;display:grid;grid-template-columns:repeat(4,1fr);gap:8px;box-shadow:var(--shadow)
}
.mobile-nav a{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;padding:10px 8px;border-radius:16px;color:var(--muted);font-size:12px}
.mobile-nav a.active{background:rgba(56,189,248,.12);color:#fff}
.pricing{display:grid;grid-template-columns:repeat(12,1fr);gap:16px}
.price-card{grid-column:span 12;padding:22px;border-radius:24px;border:1px solid var(--line);background:linear-gradient(180deg,rgba(15,23,42,.94),rgba(9,17,31,.98))}
.price-card.featured{outline:2px solid rgba(34,197,94,.45)}
.price-card .amount{font-size:42px;font-weight:900}
.note{padding:14px 16px;border-radius:16px;background:rgba(56,189,248,.1);border:1px solid rgba(56,189,248,.2);color:#dceeff}
.searchbar{display:flex;gap:10px;flex-wrap:wrap}
.searchbar .input{flex:1;min-width:180px}
.center{text-align:center}
.hidden{display:none !important}
@media(min-width:720px){
  .col-6{grid-column:span 6}
  .col-4{grid-column:span 4}
  .module{grid-column:span 6}
  .footer-col{grid-column:span 4}
  .price-card{grid-column:span 4}
}
@media(min-width:980px){
  .hero h1{font-size:46px}
  .module{grid-column:span 4}
  .card.span-3{grid-column:span 3}
  .card.span-4{grid-column:span 4}
  .card.span-6{grid-column:span 6}
  .card.span-8{grid-column:span 8}
}
