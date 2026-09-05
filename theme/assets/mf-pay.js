/*
 * mf-pay.js — MyFatoorah local-payment quick pay (STC Pay / mada / Card).
 * POSTs the product's variant to the myfatoorah-checkout Worker, which prices
 * it server-side from the Shopify catalog, creates a Shopify draft→paid flow,
 * and returns a hosted MyFatoorah invoice. We only redirect there.
 *
 * Security: the Worker ignores any client-supplied amount (server-priced), and
 * orders only complete after a verified MyFatoorah webhook — so this client
 * can only ever start a real, correctly-priced invoice.
 */
(function () {
  'use strict';
  var WORKER_URL =
    window.MF_PAY_WORKER_URL ||
    'https://myfatoorah-checkout.brainsait-fadil.workers.dev';

  function promptCustomer() {
    var email = prompt('البريد الإلكتروني | Email', '');
    if (!email) return null;
    var phone = prompt('الجوال | Mobile (05xxxxxxxx)', '');
    if (!phone) return null;
    return { email: email.trim(), phone: phone.trim() };
  }

  async function pay(variantId, btn) {
    if (!variantId) { alert('Missing product variant for payment'); return; }
    var customer = promptCustomer();
    if (!customer) return;
    if (btn) btn.classList.add('is-loading');
    try {
      var res = await fetch(WORKER_URL + '/create-payment-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lineItems: [{ variantId: String(variantId), quantity: 1 }],
          customer: customer,
          note: document.title.slice(0, 80)
        })
      });
      var data = await res.json();
      if (!res.ok || !data.invoiceURL) {
        throw new Error(data.error || 'create-payment-link failed');
      }
      window.location.href = data.invoiceURL;
    } catch (err) {
      console.error('mf-pay error:', err);
      alert('تعذّر إنشاء رابط الدفع | Could not create payment link.');
    } finally {
      if (btn) btn.classList.remove('is-loading');
    }
  }

  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.mf-pay-btn[data-mf-variant]');
    if (!btn) return;
    e.preventDefault();
    pay(btn.getAttribute('data-mf-variant'), btn);
  });
})();
