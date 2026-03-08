(function () {
  var toggle = document.getElementById('menuToggle');
  var closeBtn = document.getElementById('menuClose');
  var drawer = document.getElementById('mobileMenu');
  var search = document.getElementById('menuSearch');
  var cards = Array.prototype.slice.call(document.querySelectorAll('.module-card'));

  function openMenu() {
    if (!drawer) return;
    drawer.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
  }

  function closeMenu() {
    if (!drawer) return;
    drawer.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
  }

  function filterCards() {
    if (!search) return;
    var query = String(search.value || '').trim().toLowerCase();
    cards.forEach(function (card) {
      var text = (card.textContent + ' ' + (card.getAttribute('data-tags') || '')).toLowerCase();
      card.style.display = text.indexOf(query) !== -1 ? '' : 'none';
    });
  }

  if (toggle) toggle.addEventListener('click', openMenu);
  if (closeBtn) closeBtn.addEventListener('click', closeMenu);
  if (drawer) {
    drawer.addEventListener('click', function (event) {
      if (event.target === drawer) closeMenu();
    });
  }
  if (search) search.addEventListener('input', filterCards);

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') closeMenu();
  });
})();
