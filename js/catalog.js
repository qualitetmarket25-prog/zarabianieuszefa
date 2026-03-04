// catalog.js

const suppliers = JSON.parse(localStorage.getItem("qm_products_by_supplier_v1") || "{}");

let catalog = [];

Object.keys(suppliers).forEach(supplier => {

  suppliers[supplier].forEach(product => {

    catalog.push({
      id: "p_" + Math.random().toString(36).substring(2,9),
      name: product.name || "produkt",
      price: product.price_sell || product.price_net || 0,
      supplier: supplier,
      stock: product.stock || 0
    });

  });

});

localStorage.setItem("qm_catalog_v1", JSON.stringify(catalog));
