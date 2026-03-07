// QUALITET LOADER SAFE

(function () {

  const files = [

    "js/utils-storage.js",
    "js/csv-import.js",
    "js/products-engine.js",
    "js/panel-store.js"

  ];

  files.forEach(src => {

    const s = document.createElement("script");

    s.src = src;
    s.defer = true;

    document.body.appendChild(s);

  });

})();
