(() => {
  const root = document.querySelector('[data-component="gh-build"]');
  if (!root) return;

  const isAr = false;
  const ORIGINAL_PRICE = Number(root.dataset.originalPrice || 14960);
  const BASE_PRICE = Number(root.dataset.launchPrice || 9630);
  const APPLY_API = root.dataset.applyApi;
  const TURNSTILE_KEY = root.dataset.turnstileKey || '';
  const TRACK_URL = root.dataset.trackUrl || '/pages/track';

  const PROMOS = {
    LAUNCH10: { code: 'LAUNCH10', discountPercent: 10, titleEn: 'Early Bird — 10% off launch price', titleAr: 'خصم الطيور المبكرة — 10%' },
    FOUNDER15: { code: 'FOUNDER15', discountPercent: 15, titleEn: 'Founder Circle — 15% off launch price', titleAr: 'دائرة المؤسسين — 15%' },
  };

  const $ = (id) => document.getElementById(id);
  const el = {
    ticket: $('gh-build-ticket'),
    result: $('gh-build-result'),
    original: $('gh-bt-original'),
    price: $('gh-bt-price'),
    savings: $('gh-bt-savings'),
    promoOk: $('gh-promo-ok'),
    promoInput: $('gh-promo-input'),
    promoApply: $('gh-promo-apply'),
    promoErr: $('gh-promo-err'),
    promoClear: $('gh-promo-clear'),
    promoRemove: $('gh-promo-remove'),
    planOptions: $('gh-plan-options'),
    planHint: $('gh-plan-hint'),
    fName: $('gh-f-name'),
    fEmail: $('gh-f-email'),
    fPhone: $('gh-f-phone'),
    fCountry: $('gh-f-country'),
    fGithub: $('gh-f-github'),
    turnstileBox: $('gh-turnstile'),
    submitErr: $('gh-submit-err'),
    submit: $('gh-submit'),
    resultRef: $('gh-result-ref'),
    resultMsg: $('gh-result-msg'),
    resultTrack: $('gh-result-track'),
    resultNotion: $('gh-result-notion'),
  };

  const fmt = (n) => n.toLocaleString(isAr ? 'ar-SA' : 'en-SA', {
    minimumFractionDigits: Math.round(n * 100) % 100 !== 0 ? 2 : 0,
    maximumFractionDigits: 2,
  }) + ' SAR';

  let promo = null;
  let plan = 'FULL';
  let turnstileToken = '';
  let submitting = false;

  const finalPrice = () => (promo ? Math.round(BASE_PRICE * (1 - promo.discountPercent / 100) * 100) / 100 : BASE_PRICE);

  const renderPrice = () => {
    const p = finalPrice();
    if (!el.price) return;
    if (promo) {
      if (el.savings) { el.savings.hidden = false; el.savings.textContent = (isAr ? 'وفّرت ' : 'You save ') + fmt(ORIGINAL_PRICE - p); }
      if (el.promoOk) { el.promoOk.hidden = false; el.promoOk.textContent = '✅ ' + (isAr ? promo.titleAr : promo.titleEn); }
    } else {
      if (el.savings) el.savings.hidden = true;
      if (el.promoOk) el.promoOk.hidden = true;
    }
    el.price.textContent = fmt(p);
  };

  const planAmount = (count, no) => {
    const p = finalPrice();
    const share = Math.round((p / count) * 100) / 100;
    return no < count ? share : Math.round((p - share * (count - 1)) * 100) / 100;
  };

  const renderPlanHint = () => {
    if (!el.planHint) return;
    const opts = el.planOptions ? Array.from(el.planOptions.querySelectorAll('.plan-option')) : [];
    const opt = opts.find((o) => o.dataset.plan === plan);
    const amount = opt ? Number(opt.querySelector('.plan-price').dataset.amount) : 0;
    const count = opt ? Number(opt.querySelector('.plan-price').dataset.count) : 1;
    if (plan === 'FULL') {
      el.planHint.textContent = isAr ? 'ادفع السعر كاملاً الآن — وصول فوري.' : 'Pay the full amount now — instant access.';
      return;
    }
    const first = planAmount(count, 1);
    el.planHint.textContent = isAr
      ? `ستدفع ${first.toLocaleString('ar-SA')} ريال الآن، ثم ${count - 1} دفعات شهرية متبقية. تبقى الأقساط المسددة فقط مفعلة — إذا تأخرت ١٤ يوماً تُعلَّق صلاحية الوصول حتى التسوية.`
      : `You'll pay ${first.toLocaleString('en-SA')} SAR now, then ${count - 1} monthly payment(s). Access stays active while current — after 14 days overdue your account is suspended until settled.`;
  };

  const contactValid = () => el.fName.value.trim() && el.fEmail.value.includes('@') && el.fCountry.value.trim();

  // Safe event binding: a missing element must never kill the whole funnel.
  const on = (node, ev, fn) => { if (node) node.addEventListener(ev, fn); };

  const updateSubmit = () => {
    if (!el.submit) return;
    el.submit.disabled = !contactValid() || submitting || (TURNSTILE_KEY && !turnstileToken);
  };

  on(el.promoApply, 'click', () => {
    const code = el.promoInput.value.trim().toUpperCase();
    if (!code) return;
    const found = PROMOS[code];
    if (!found) {
      promo = null;
      el.promoErr.hidden = false;
      el.promoErr.textContent = isAr ? 'رمز الخصم غير صالح' : 'Invalid promo code';
      renderPrice();
      renderPlanHint();
      return;
    }
    promo = found;
    el.promoErr.hidden = true;
    el.promoClear.hidden = false;
    renderPrice();
    renderPlanHint();
    updateSubmit();
  });

  on(el.promoRemove, 'click', () => {
    promo = null;
    el.promoInput.value = '';
    el.promoClear.hidden = true;
    renderPrice();
    renderPlanHint();
  });

  on(el.planOptions, 'click', (e) => {
    const opt = e.target.closest('.plan-option');
    if (!opt) return;
    plan = opt.dataset.plan;
    Array.from(el.planOptions.querySelectorAll('.plan-option')).forEach((o) => o.classList.toggle('active', o === opt));
    renderPlanHint();
  });

  ['input', 'change'].forEach((ev) => {
    [el.fName, el.fEmail, el.fCountry].forEach((input) => on(input, ev, updateSubmit));
  });

  const loadTurnstile = () => {
    if (!TURNSTILE_KEY || !el.turnstileBox) return;
    const render = () => {
      if (!window.turnstile) return;
      try {
        window.turnstile.render(el.turnstileBox, {
          sitekey: TURNSTILE_KEY,
          callback: (token) => { turnstileToken = token; updateSubmit(); },
          'expired-callback': () => { turnstileToken = ''; updateSubmit(); },
          'error-callback': () => { turnstileToken = ''; updateSubmit(); },
          theme: document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark',
        });
        el.turnstileBox.hidden = false;
      } catch { /* ignore */ }
    };
    if (window.turnstile) {
      render();
    } else {
      const s = document.createElement('script');
      s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=ghTurnstileReady';
      window.ghTurnstileReady = render;
      document.head.appendChild(s);
    }
  };

  on(el.submit, 'click', async () => {
    if (!el.submit || submitting) return;
    if (TURNSTILE_KEY && !turnstileToken) {
      el.submitErr.hidden = false;
      el.submitErr.textContent = isAr ? 'يرجى إكمال التحقق الأمني' : 'Please complete the security check';
      return;
    }
    submitting = true;
    el.submitErr.hidden = true;
    updateSubmit();

    const payload = {
      lang: isAr ? 'ar' : 'en',
      fullName: el.fName.value.trim(),
      email: el.fEmail.value.trim(),
      phone: el.fPhone.value.trim(),
      country: el.fCountry.value.trim(),
      githubUsername: el.fGithub.value.trim() || undefined,
      promoCode: promo ? promo.code : undefined,
      plan,
      turnstileToken: turnstileToken || undefined,
    };

    try {
      const res = await fetch(APPLY_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!res.ok || !result.ok) {
        throw new Error(result.error || (isAr ? 'تعذر إرسال الطلب' : 'Could not submit application'));
      }

      try {
        localStorage.setItem('bs_build_ref', result.applicationId);
      } catch { /* ignore */ }

      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
        return;
      }

      el.ticket.hidden = true;
      el.result.hidden = false;
      el.resultRef.textContent = (isAr ? 'رقم الطلب: ' : 'Application ref: ') + result.applicationId;
      el.resultMsg.textContent = result.message || '';
      el.resultTrack.href = TRACK_URL + '?ref=' + encodeURIComponent(result.applicationId);
      if (result.notionUrl) {
        el.resultNotion.href = result.notionUrl;
        el.resultNotion.hidden = false;
      }
      el.result.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch (err) {
      el.submitErr.hidden = false;
      el.submitErr.textContent = err.message || (isAr ? 'حدث خطأ' : 'Something went wrong');
    } finally {
      submitting = false;
      updateSubmit();
    }
  });

  renderPrice();
  renderPlanHint();
  loadTurnstile();
})();