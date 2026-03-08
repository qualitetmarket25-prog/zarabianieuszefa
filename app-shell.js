(function(){
  const pages = [
    {href:'index.html', label:'Start'},
    {href:'platforma.html', label:'Platforma'},
    {href:'sklep.html', label:'Sklep'},
    {href:'cennik.html', label:'Cennik'},
    {href:'kontakt.html', label:'Kontakt'}
  ];
  function icon(name){
    const map = {Start:'🏠',Platforma:'📱',Sklep:'🛒',Cennik:'💎',Kontakt:'✉️'};
    return map[name] || '•';
  }
  function bottomNav(){
    const current = location.pathname.split('/').pop() || 'index.html';
    return '<nav class="bottom-nav"><div class="container">'+pages.map(p=>
      '<a class="bottom-link '+(current===p.href?'active':'')+'" href="'+p.href+'"><div>'+icon(p.label)+'</div><div>'+p.label+'</div></a>'
    ).join('')+'</div></nav>';
  }
  function footer(){
    return `
      <footer class="legal-footer">
        <div class="container legal-grid">
          <div>
            <div class="brand"><img src="uszefaqualitet-logo.svg" alt="QualitetMarket logo"><span>QualitetMarket</span></div>
            <p class="copy">Platforma do budowy sklepu, sprzedaży, importu produktów i automatyzacji działań, która pomaga użytkownikom zarabiać online szybciej i prościej.</p>
            <p class="copy">© ${new Date().getFullYear()} QualitetMarket. Wszelkie prawa zastrzeżone.</p>
          </div>
          <div class="legal-links">
            <strong>Firma i pomoc</strong>
            <a href="kontakt.html">Kontakt</a>
            <a href="cennik.html">Cennik</a>
            <a href="platforma.html">Platforma</a>
            <a href="index.html">Strona główna</a>
          </div>
          <div class="legal-links">
            <strong>Dokumenty</strong>
            <a href="polityka-prywatnosci.html">Polityka prywatności</a>
            <a href="regulamin.html">Regulamin</a>
            <a href="polityka-cookies.html">Polityka cookies</a>
            <a href="rodo.html">RODO</a>
          </div>
        </div>
      </footer>
    `;
  }
  document.addEventListener('DOMContentLoaded', function(){
    const target = document.querySelector('[data-site-footer]');
    if(target) target.innerHTML = footer();
    document.body.insertAdjacentHTML('beforeend', bottomNav());
  });
})();