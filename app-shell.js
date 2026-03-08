
:root{
  --bg:#07111f;
  --panel:#0f172a;
  --panel-2:#111827;
  --soft:#1f2937;
  --line:rgba(255,255,255,.09);
  --text:#eef2ff;
  --muted:#94a3b8;
  --brand:#22c55e;
  --brand-2:#38bdf8;
  --warn:#f59e0b;
  --danger:#ef4444;
  --radius:18px;
  --shadow:0 10px 30px rgba(0,0,0,.28);
}
*{box-sizing:border-box}
html,body{margin:0;padding:0;font-family:Inter,system-ui,Arial,sans-serif;background:linear-gradient(180deg,#08101d,#0b1220);color:var(--text)}
img{max-width:100%;display:block}
a{color:inherit;text-decoration:none}
button,input,select,textarea{font:inherit}
.container{width:min(1180px,92vw);margin:0 auto}
.topbar{position:sticky;top:0;z-index:50;background:rgba(7,17,31,.84);backdrop-filter:blur(14px);border-bottom:1px solid var(--line)}
.topbar-inner{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 0}
.brand{display:flex;align-items:center;gap:12px;font-weight:800}
.brand img{width:42px;height:42px}
.brand small{display:block;color:var(--muted);font-weight:600}
.header-actions{display:flex;gap:10px;align-items:center}
.btn,.nav-btn{
  min-height:48px;padding:12px 16px;border-radius:14px;border:1px solid transparent;
  display:inline-flex;align-items:center;justify-content:center;gap:10px;cursor:pointer;
  transition:.2s transform,.2s background,.2s border-color,.2s opacity;
}
.btn:active,.nav-btn:active{transform:scale(.98)}
.btn-primary{background:linear-gradient(135deg,var(--brand),#16a34a);color:#04110a;font-weight:800}
.btn-secondary{background:rgba(255,255,255,.05);border-color:var(--line);color:var(--text)}
.btn-ghost{background:transparent;border-color:var(--line);color:var(--text)}
.btn-danger{background:rgba(239,68,68,.12);border-color:rgba(239,68,68,.3);color:#fecaca}
.hero{padding:28px 0 18px}
.hero-grid{display:grid;grid-template-columns:1.15fr .85fr;gap:18px}
.card{
  background:linear-gradient(180deg,rgba(255,255,255,.03),rgba(255,255,255,.015));
  border:1px solid var(--line);border-radius:var(--radius);box-shadow:var(--shadow)
}
.card.pad{padding:18px}
.kpi-grid,.grid-2,.grid-3,.grid-4{display:grid;gap:14px}
.kpi-grid{grid-template-columns:repeat(4,1fr)}
.grid-2{grid-template-columns:repeat(2,1fr)}
.grid-3{grid-template-columns:repeat(3,1fr)}
.grid-4{grid-template-columns:repeat(4,1fr)}
.kpi .label{color:var(--muted);font-size:.92rem}
.kpi .value{font-size:1.7rem;font-weight:900;margin-top:6px}
.section{padding:8px 0 22px}
.h1{font-size:clamp(1.9rem,4vw,3.1rem);line-height:1.04;margin:0 0 10px;font-weight:900}
.h2{font-size:clamp(1.25rem,2.4vw,1.8rem);line-height:1.1;margin:0 0 10px;font-weight:900}
.lead{color:#d6e2ff;opacity:.92;font-size:1.02rem;line-height:1.6}
.muted{color:var(--muted)}
.tag{display:inline-flex;align-items:center;gap:8px;padding:9px 12px;border-radius:999px;background:rgba(56,189,248,.08);border:1px solid rgba(56,189,248,.22);color:#d9f3ff;font-size:.9rem}
.list{display:grid;gap:10px;margin:12px 0 0;padding:0;list-style:none}
.list li{display:flex;gap:10px;align-items:flex-start}
.list li::before{content:"✓";display:inline-flex;align-items:center;justify-content:center;min-width:24px;height:24px;border-radius:999px;background:rgba(34,197,94,.12);color:#86efac;font-weight:900}
.plan{position:relative;overflow:hidden}
.plan.popular{border-color:rgba(34,197,94,.55);box-shadow:0 14px 38px rgba(34,197,94,.14)}
.ribbon{position:absolute;top:12px;right:12px;background:linear-gradient(135deg,#22c55e,#16a34a);color:#03120b;padding:8px 12px;border-radius:999px;font-size:.82rem;font-weight:900}
.price{display:flex;align-items:flex-end;gap:7px;margin:10px 0 6px}
.price strong{font-size:2.5rem;line-height:1;font-weight:900}
.price span{color:var(--muted)}
.badge-row{display:flex;flex-wrap:wrap;gap:8px}
.badge{padding:8px 10px;border-radius:999px;border:1px solid var(--line);background:rgba(255,255,255,.03);font-size:.88rem;color:#e5eefb}
.footer{border-top:1px solid var(--line);margin-top:20px;padding:26px 0 90px;color:var(--muted)}
.footer-grid{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:18px}
.footer a{color:#dbeafe}
.mobile-nav{
  position:fixed;left:0;right:0;bottom:0;z-index:60;background:rgba(7,17,31,.94);
  backdrop-filter:blur(14px);border-top:1px solid var(--line);display:none
}
.mobile-nav-inner{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;padding:10px 10px calc(10px + env(safe-area-inset-bottom))}
.mobile-nav a{display:grid;gap:5px;place-items:center;padding:8px 4px;border-radius:14px;color:#dce7ff;font-size:.78rem}
.mobile-nav a.active,.mobile-nav a:hover{background:rgba(255,255,255,.06)}
.icon{
  width:22px;height:22px;border-radius:8px;background:linear-gradient(135deg,rgba(34,197,94,.22),rgba(56,189,248,.22));
  display:grid;place-items:center;border:1px solid rgba(255,255,255,.08)
}
.table{width:100%;border-collapse:collapse}
.table th,.table td{padding:12px 10px;border-bottom:1px solid var(--line);text-align:left}
.table th{color:#cfe2ff;font-size:.92rem}
.form-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:14px}
.field{display:grid;gap:8px}
.field input,.field select,.field textarea{
  min-height:48px;width:100%;background:rgba(255,255,255,.04);border:1px solid var(--line);border-radius:14px;
  color:var(--text);padding:12px 14px
}
.cta-row,.actions{display:flex;flex-wrap:wrap;gap:12px}
.notice{padding:12px 14px;border-radius:14px;border:1px solid rgba(56,189,248,.25);background:rgba(56,189,248,.08);color:#dff4ff}
.success{border-color:rgba(34,197,94,.3);background:rgba(34,197,94,.08);color:#dcfce7}
.warning{border-color:rgba(245,158,11,.3);background:rgba(245,158,11,.08);color:#fef3c7}
.product-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
.product-card{display:grid;gap:12px}
.product-hero{aspect-ratio:1/1;border-radius:16px;background:linear-gradient(135deg,#0b172a,#0f2740);border:1px solid var(--line);display:grid;place-items:center;font-size:2rem}
.price-row{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.price-old{text-decoration:line-through;color:var(--muted)}
.price-new{font-size:1.35rem;font-weight:900}
.right{margin-left:auto}
.empty{padding:20px;border:1px dashed var(--line);border-radius:16px;color:var(--muted)}
.locked{opacity:.55;pointer-events:none;filter:grayscale(.15)}
hr.sep{border:none;border-top:1px solid var(--line);margin:16px 0}
@media (max-width:960px){
  .hero-grid,.kpi-grid,.grid-4,.grid-3,.product-grid,.footer-grid,.form-grid{grid-template-columns:1fr 1fr}
}
@media (max-width:720px){
  .hero-grid,.grid-2,.grid-3,.grid-4,.kpi-grid,.product-grid,.footer-grid,.form-grid{grid-template-columns:1fr}
  .mobile-nav{display:block}
  .footer{padding-bottom:110px}
  .topbar-inner{padding:10px 0}
  .header-actions .btn-secondary{display:none}
  .btn,.nav-btn{width:100%}
  .cta-row .btn,.actions .btn{flex:1 1 100%}
}
