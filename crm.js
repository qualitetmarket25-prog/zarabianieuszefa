:root{
  --qm-green:#22c55e;
  --qm-blue:#38bdf8;
  --qm-orange:#f97316;
  --qm-red:#ef4444;
  --qm-line:rgba(148,163,184,.18);
}
.hero{display:grid;grid-template-columns:1.4fr .9fr;gap:22px}
.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}
.stat-card{padding:18px 20px;border-radius:18px;background:rgba(15,23,42,.82);border:1px solid var(--qm-line);box-shadow:0 12px 40px rgba(0,0,0,.18)}
.stat-card strong{display:block;font-size:28px;margin-top:8px}
.chip{display:inline-flex;align-items:center;gap:8px;background:rgba(34,197,94,.12);border:1px solid rgba(34,197,94,.22);color:#dcfce7;padding:8px 12px;border-radius:999px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.08em}
.lead{color:#cbd5e1;line-height:1.7}
.qm-form{display:flex;flex-direction:column;gap:14px}
.form-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:14px}
.qm-form label{display:flex;flex-direction:column;gap:8px}
.qm-form span{font-size:13px;color:#94a3b8}
.qm-form input,.qm-form select,.qm-form textarea,.table-search{
  width:100%;background:rgba(15,23,42,.75);border:1px solid rgba(148,163,184,.18);border-radius:14px;
  padding:13px 14px;color:#e5eefb;outline:none
}
.qm-form textarea{resize:vertical;min-height:110px}
.pipeline-board{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
.pipeline-col{background:rgba(8,16,30,.52);border:1px solid var(--qm-line);border-radius:18px;padding:14px;min-height:220px}
.pipeline-col h3{margin:0 0 12px;font-size:15px}
.pipeline-count{font-size:12px;color:#94a3b8;margin-left:8px}
.pipeline-item,.task-item{
  border:1px solid rgba(148,163,184,.16);background:rgba(15,23,42,.78);border-radius:16px;padding:14px;margin-bottom:12px
}
.pipeline-item strong,.task-item strong{display:block;font-size:15px;margin-bottom:8px}
.meta{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0}
.badge{
  display:inline-flex;align-items:center;gap:6px;padding:6px 10px;border-radius:999px;
  font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;border:1px solid transparent
}
.badge.new{background:rgba(56,189,248,.12);color:#bae6fd;border-color:rgba(56,189,248,.2)}
.badge.contacted,.badge.processing{background:rgba(251,191,36,.12);color:#fde68a;border-color:rgba(251,191,36,.2)}
.badge.qualified,.badge.offer{background:rgba(34,197,94,.12);color:#dcfce7;border-color:rgba(34,197,94,.2)}
.badge.won,.badge.completed,.badge.delivered{background:rgba(16,185,129,.12);color:#a7f3d0;border-color:rgba(16,185,129,.2)}
.badge.lost,.badge.cancelled{background:rgba(239,68,68,.12);color:#fecaca;border-color:rgba(239,68,68,.2)}
.stack-list{display:flex;flex-direction:column;gap:12px}
.task-item p,.pipeline-item p{margin:8px 0 0;color:#cbd5e1;line-height:1.6}
.actions-row{display:flex;gap:10px;flex-wrap:wrap}
.actions-row.compact{gap:8px}
.btn,.btn-gold,.btn-ghost{
  appearance:none;border:none;border-radius:14px;padding:12px 16px;cursor:pointer;font-weight:700;text-decoration:none;display:inline-flex;align-items:center;justify-content:center
}
.btn{background:linear-gradient(180deg,#22c55e,#16a34a);color:#04110a}
.btn-gold{background:linear-gradient(180deg,#fbbf24,#f59e0b);color:#1f1301}
.btn-ghost{background:rgba(15,23,42,.75);color:#e5eefb;border:1px solid rgba(148,163,184,.18)}
.btn-ghost.danger{border-color:rgba(239,68,68,.26);color:#fecaca}
.table-wrap{overflow:auto}
.crm-table{width:100%;border-collapse:collapse;min-width:880px}
.crm-table th,.crm-table td{padding:14px 12px;border-bottom:1px solid rgba(148,163,184,.12);text-align:left;vertical-align:top}
.crm-table th{font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#94a3b8}
.row-actions{display:flex;gap:8px;flex-wrap:wrap}
.small-muted{font-size:12px;color:#94a3b8}
.empty-box{padding:24px;border:1px dashed rgba(148,163,184,.2);border-radius:16px;color:#94a3b8;text-align:center}
.section-title{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:16px}
.section-title h2{margin:0}
.card{background:rgba(10,16,30,.82);border:1px solid rgba(148,163,184,.14);border-radius:24px;padding:22px;box-shadow:0 14px 44px rgba(0,0,0,.18)}
@media (max-width: 1100px){
  .hero,.grid.grid-2,.stats,.pipeline-board,.form-grid{grid-template-columns:1fr!important}
}
@media (max-width: 700px){
  .card{padding:16px;border-radius:18px}
  .crm-table{min-width:720px}
  .btn,.btn-gold,.btn-ghost{width:100%}
}
