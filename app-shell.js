
(function(){
  var btn = document.querySelector('[data-menu-open]');
  var closeBtn = document.querySelector('[data-menu-close]');
  var overlay = document.querySelector('.sidebar-overlay');
  function openMenu(){ document.body.classList.add('shell-open'); }
  function closeMenu(){ document.body.classList.remove('shell-open'); }
  if(btn) btn.addEventListener('click', openMenu);
  if(closeBtn) closeBtn.addEventListener('click', closeMenu);
  if(overlay) overlay.addEventListener('click', closeMenu);
  document.querySelectorAll('.nav-link, .bottom-nav a').forEach(function(a){
    var href = a.getAttribute('href');
    if(!href) return;
    var current = location.pathname.split('/').pop() || 'index.html';
    if(href === current){
      a.classList.add('active');
    }
  });
})();
