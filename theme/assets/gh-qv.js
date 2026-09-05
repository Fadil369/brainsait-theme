(() => {
  const qv = document.getElementById('gh-qv');
  if (!qv) return;

  const $ = (id) => document.getElementById(id);

  function openFrom(el) {
    const set = (id, v) => { const n = $(id); if (n) n.textContent = v ?? ''; };
    set('gh-qv-img', el.dataset.qvImg || '');
    set('gh-qv-cat', el.dataset.qvCat);
    set('gh-qv-title', el.dataset.qvTitle);
    set('gh-qv-prop', el.dataset.qvProp);
    set('gh-qv-desc', el.dataset.qvDesc);
    set('gh-qv-meta', el.dataset.qvMeta);
    set('gh-qv-price', el.dataset.qvPrice);
    set('gh-qv-compare', el.dataset.qvCompare || '');
    const cta = $('gh-qv-cta');
    if (cta) {
      cta.href = el.dataset.qvUrl || '#';
      cta.textContent = (el.dataset.qvCta || 'Buy now') + ' →';
    }
    qv.classList.add('qv-open');
    qv.hidden = false;
    document.body.style.overflow = 'hidden';
    const c = qv.querySelector('.qv-close');
    if (c) c.focus();
  }

  function close() {
    qv.classList.remove('qv-open');
    qv.hidden = true;
    document.body.style.overflow = '';
  }

  qv.hidden = true;
  qv.classList.remove('qv-open');

  document.addEventListener('click', (e) => {
    const opener = e.target.closest('[data-qv]');
    if (opener) {
      e.preventDefault();
      openFrom(opener);
      return;
    }
    if (e.target.closest('[data-qv-close]')) {
      close();
      return;
    }
  });

  qv.addEventListener('click', (e) => {
    if (e.target === qv) close();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  });

  window.addEventListener('pageshow', close);

  const form = document.getElementById('gh-build-form');
  if (form) {
    const errorEl = document.getElementById('gh-build-error');
    const submitBtn = form.querySelector('button[type="submit"]');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (errorEl) { errorEl.hidden = true; errorEl.textContent = ''; }
      const plan = form.querySelector('input[name="plan"]:checked');
      const fullName = form.querySelector('#gh-build-name')?.value?.trim();
      const email = form.querySelector('#gh-build-email')?.value?.trim();
      if (!plan || !fullName || !email) return;

      if (submitBtn) { submitBtn.disabled = true; }
      try {
        const response = await fetch('https://build-apply.brainsait.org/apply', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fullName, email, plan: plan.value }),
        });
        const data = await response.json();
        if (!response.ok || !data.checkoutUrl) {
          throw new Error(data.error || 'Could not start checkout.');
        }
        window.location.href = data.checkoutUrl;
      } catch (err) {
        if (errorEl) {
          errorEl.hidden = false;
          errorEl.textContent = err.message || 'Something went wrong — please try again or email brainsait@icloud.com.';
        }
      } finally {
        if (submitBtn) { submitBtn.disabled = false; }
      }
    });
  }
})();