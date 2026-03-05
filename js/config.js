// js/config.js
// Globalne ustawienia platformy QualitetMarket

export const QM_CONFIG = {

  // marże platformy
  pricing: {
    retailPct: 0.08,      // DETAL +8%
    wholesalePct: 0.05,   // HURT +5%
    minProfit: 1.5,       // minimalna marża 1.50 zł
    retailEnds99: true
  },

  currency: "PLN",

  modes: {
    retail: "detal",
    wholesale: "hurt"
  }

};
