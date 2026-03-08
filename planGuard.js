(function () {
  var PAYMENT_LINKS = {
    basic: '',
    pro: '',
    elite: ''
  };

  function redirectToCheckout(plan) {
    var url = PAYMENT_LINKS[plan];
    if (url) {
      window.location.href = url;
      return;
    }
    alert('Brak ustawionego linku płatności dla planu: ' + plan.toUpperCase() + '. Uzupełnij PAYMENT_LINKS w js/payments.js');
  }

  window.QMPayments = {
    PAYMENT_LINKS: PAYMENT_LINKS,
    redirectToCheckout: redirectToCheckout
  };
})();
