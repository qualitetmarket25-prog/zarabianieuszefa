// hurtownie.js — import CSV hurtowni

(function(){

const LS_PRODUCTS_BY_SUPPLIER = "qm_products_by_supplier_v1";

function parseCSV(text){

const rows = text.split("\n").map(r => r.split(","));

const headers = rows[0].map(h => h.trim().toLowerCase());

let products = [];

for(let i=1;i<rows.length;i++){

let row = rows[i];

let p = {};

headers.forEach((h,index)=>{

p[h] = row[index];

});

products.push(mapProduct(p));

}

return products;

}

function mapProduct(p){

return {

name: p.name || p.nazwa || p.product || "produkt",

price_net: toNumber(
p.price ||
p.cena ||
p.netto ||
p.price_net ||
p.cenanetto ||
p.net_price
),

stock: toNumber(
p.stock ||
p.stan ||
p.qty ||
p.ilosc
),

ean: p.ean || "",
sku: p.sku || ""

};

}

function toNumber(v){

if(!v) return 0;

return parseFloat(
String(v)
.replace(",",".")
.replace(/[^\d.]/g,"")
);

}

window.importCSV = function(text,supplier){

let products = parseCSV(text);

let db = JSON.parse(localStorage.getItem(LS_PRODUCTS_BY_SUPPLIER) || "{}");

db[supplier] = products;

localStorage.setItem(LS_PRODUCTS_BY_SUPPLIER, JSON.stringify(db));

alert("Zaimportowano "+products.length+" produktów");

};

})();
