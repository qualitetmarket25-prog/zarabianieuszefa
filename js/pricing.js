// js/pricing.js
// Silnik cen QualitetMarket (marża platformy + marża sklepu)

(function(){

function round2(v){
  return Math.round((Number(v) + Number.EPSILON) * 100) / 100;
}

function formatPLN(v){
  const n = Number(v || 0);
  return n.toLocaleString("pl-PL", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }) + " zł";
}

/*
buyNet = cena zakupu z hurtowni
mode = detal / hurt
*/
function priceFromBuy(buyNet, mode="detal"){

  const base = Number(buyNet || 0);

  // marża platformy
  const platformMargin =
    mode === "hurt"
      ? (window.QM_CONFIG?.pricing?.wholesalePct || 0.05)
      : (window.QM_CONFIG?.pricing?.retailPct || 0.08);

  // marża sklepu użytkownika
  const storeMargin =
    Number(localStorage.getItem("qm_store_margin") || 0);

  const margin = platformMargin + storeMargin;

  let price = base * (1 + margin);

  const minProfit = window.QM_CONFIG?.pricing?.minProfit || 1;

  if(price - base < minProfit){
    price = base + minProfit;
  }

  if(mode === "detal" && window.QM_CONFIG?.pricing?.retailEnds99){
    price = Math.floor(price) + 0.99;
  }

  return round2(price);
}

window.QM_PRICE = {
  priceFromBuy,
  formatPLN,
  round2
};

})();
