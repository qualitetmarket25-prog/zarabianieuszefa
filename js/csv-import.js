// CSV IMPORT MVP

function parseCSV(text) {

  const rows = text.split("\n");

  const result = [];

  for (let i = 1; i < rows.length; i++) {

    const cols = rows[i].split(",");

    if (cols.length < 2) continue;

    const name = cols[0];
    const price = parseFloat(cols[1]);

    if (!name || !price) continue;

    result.push({
      name,
      price
    });

  }

  return result;
}


function importCSVFile(file, supplierName) {

  const reader = new FileReader();

  reader.onload = function (e) {

    const text = e.target.result;

    const products = parseCSV(text);

    addSupplierProducts(supplierName, products);

    alert("Zaimportowano: " + products.length);

  };

  reader.readAsText(file);

}
