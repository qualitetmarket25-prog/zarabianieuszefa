// PRODUCTS ENGINE MVP

function getAllSupplierProducts() {
  const all = getProducts();
  const list = [];

  Object.keys(all).forEach(function (supplierName) {
    const supplierProducts = Array.isArray(all[supplierName]) ? all[supplierName] : [];

    supplierProducts.forEach(function (product, index) {
      const basePrice = parseFloat(product.price);

      if (!product.name || !Number.isFinite(basePrice)) return;

      list.push({
        id: supplierName + "_" + index,
        supplier: supplierName,
        name: String(product.name).trim(),
        basePrice: basePrice,
        finalPrice: applyMargin(basePrice)
      });
    });
  });

  return list;
}

function getProductsForShop() {
  return getAllSupplierProducts().map(function (product) {
    return {
      id: product.id,
      supplier: product.supplier,
      name: product.name,
      price: product.finalPrice,
      basePrice: product.basePrice,
      marginPercent: getMargin()
    };
  });
}

function formatPrice(value) {
  const num = parseFloat(value);

  if (!Number.isFinite(num)) return "0.00 zł";

  return num.toFixed(2).replace(".", ",") + " zł";
}
