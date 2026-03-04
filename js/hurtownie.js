// IMPORT CSV HURTOWNI

(function(){

const STORAGE = "qm_products_by_supplier_v1";

function parseCSV(text){

const lines = text.split("\n");

const headers = lines[0].split(",").map(h=>h.trim().toLowerCase());

let products = [];

for(let i=1;i<lines.length;i++){

let row = lines[i].split(",");

let p={};

headers.forEach((h,index)=>{
p[h]=row[index];
});

products.push({

name:
p.name ||
p.nazwa ||
p.product ||
"produkt",

price_net: getPrice(p),

stock:
parseFloat(
p.stock ||
p.stan ||
p.qty ||
p.ilosc ||
0
),

ean: p.ean || "",
sku: p.sku || ""

});

}

return products;

}

function getPrice(p){

return parseFloat(

String(
p.price ||
p.cena ||
p.netto ||
p.price_net ||
p.net_price ||
0
)

.replace(",",".")
.replace(/[^\d.]/g,"")

);

}

window.importCSV = function(text,supplier){

let products=parseCSV(text);

let db=JSON.parse(localStorage.getItem(STORAGE)||"{}");

db[supplier]=products;

localStorage.setItem(STORAGE,JSON.stringify(db));

alert("Zaimportowano "+products.length+" produktów");

};

})();
