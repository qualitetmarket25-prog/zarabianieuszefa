// AUTO LOADER QUALITET MARKET

const scripts = [

  "js/utils-storage.js",
  "js/planGuard.js",
  "js/hurtownie.js",
  "js/sklep.js",
  "js/stripeLinks.js",
  "js/subskrypcje.js"

];

function loadScripts(list) {

  list.forEach(src => {

    const s = document.createElement("script");

    s.src = src;
    s.defer = true;

    document.head.appendChild(s);

  });

}

loadScripts(scripts);
