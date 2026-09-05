(() => {
  const root = document.querySelector('[data-component="gh-track"]');
  if (!root) return;

  const isAr = false;
  const API_BASE = root.dataset.apiBase || 'https://build-apply.brainsait.org';
  const lookupEl = document.getElementById('gh-track-lookup');
  const dashEl = document.getElementById('gh-track-dash');
  const refInput = document.getElementById('gh-track-ref');
  const goBtn = document.getElementById('gh-track-go');
  if (!lookupEl || !dashEl || !refInput || !goBtn) return;

  const t = (en, ar) => (isAr ? ar : en);

  const BADGE_ICONS = {
    Onboarded: '🌱', Activated: '⚡', Builder: '🔨',
    'Launch Ready': '🚀', Launched: '🎉', Verified: '✅', Paid: '💳',
  };

  let currentRef = '';

  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const card = (inner) => `<div class="track-card">${inner}</div>`;

  const renderLoading = () => {
    dashEl.hidden = false;
    dashEl.innerHTML = `<div class="track-loading">⏳ ${t('Loading…', 'جارٍ التحميل…')}</div>`;
  };

  const renderError = (msg) => {
    dashEl.hidden = false;
    dashEl.innerHTML = `
      <div class="track-error">
        <h2>${t('Application not found', 'تعذر العثور على الطلب')}</h2>
        <p>${esc(msg)}</p>
        <a class="button secondary" href="/pages/build">${t('Back to Build', 'العودة إلى البناء')}</a>
      </div>`;
  };

  const renderDash = (data, installment) => {
    const pct = Math.round((data.percent || 0) * 100);
    const cap = data.capabilities;
    const levelLabel = cap
      ? cap.level === 'full'
        ? t('Full access', 'وصول كامل')
        : cap.level === 'suspended'
          ? t('Suspended', 'معلّق')
          : t('Limited · 14 days', 'وصول محدود · ١٤ يوم')
      : '';
    const levelClass = cap ? (cap.level === 'full' ? 'full' : cap.level) : '';

    let html = `
      <div class="track-dash">
        <div class="track-head">
          <h1>${t('Your Progress Dashboard', 'لوحة تقدمك')}</h1>
          <p>${esc(data.name || '')} · ${esc(data.track || '')}</p>
          <button type="button" class="button secondary sm" id="gh-track-refresh">🔄 ${t('Refresh', 'تحديث')}</button>
          <p class="track-ref-now">${t('Ref:', 'رقم الطلب:')} <code id="gh-track-copy">${esc(currentRef)}</code></p>
        </div>`;

    if (data.nextTask) {
      html += `
        <div class="track-next">
          <span>✨</span>
          <div>
            <small>${t('Your next step', 'خطوتك التالية')}</small>
            <b>${esc(data.nextTask)}</b>
          </div>
        </div>`;
    }

    html += card(`
      <div class="track-progress-row"><span>${t('Overall Progress', 'التقدم الكلي')}</span><span>${pct}%</span></div>
      <div class="track-bar"><div class="track-bar-fill" style="width:${pct}%"></div></div>
      <p class="track-muted">${data.doneTasks || 0} / ${data.totalTasks || 0} ${t('tasks completed', 'مهمة مكتملة')}</p>`);

    if (data.badges && data.badges.length > 0) {
      html += card(`
        <h3>🏆 ${t('Badges', 'الأوسمة')}</h3>
        <div class="track-badges">${data.badges.map((b) => `<span class="track-badge"><span>${BADGE_ICONS[b] || '🏅'}</span> ${esc(b)}</span>`).join('')}</div>`);
    }

    html += `
      <div class="track-stats">
        <div class="track-stat"><p>${t('Application', 'حالة الطلب')}</p><b>${esc(data.applicationStatus || '—')}</b></div>
        <div class="track-stat"><p>${t('Payment', 'حالة الدفع')}</p><b>${esc(data.paymentStatus || '—')}</b></div>
        <div class="track-stat"><p>${t('Track', 'المسار')}</p><b>${esc(data.track || '—')}</b></div>
      </div>`;

    if (cap) {
      const rows = [
        ['buildResources', '🛠️ ' + t('Building resources (14-day)', 'موارد البناء (١٤ يوم)')],
        ['deploy', '🚀 ' + t('Deploy', 'النشر')],
        ['launch', '🛫 ' + t('Launch', 'الإطلاق')],
        ['marketing', '📣 ' + t('Marketing', 'التسويق')],
        ['secondBrainPublic', '🧠 ' + t('Second Brain (public link)', 'العقل الثاني (رابط عام)')],
      ];
      html += card(`
        <h3>✨ ${t('Access', 'صلاحيات الوصول')}<span class="track-level ${levelClass}">${levelLabel}</span></h3>
        <p class="track-muted" style="margin-bottom:0.8rem">${t(
          'The BUILD Ticket grants limited building resources for 14 days. Deploy, launch and marketing unlock after full payment.',
          'تذكرة BUILD تمنح وصولاً محدوداً لموارد البناء لمدة ١٤ يوماً. يفتح النشر والإطلاق والتسويق بعد اكتمال الدفع.'
        )}</p>
        ${rows.map(([key, label]) => `
          <div class="track-access-row ${cap[key] ? 'on' : 'off'}">
            ${cap[key]
              ? '<span class="ico-ok">✔</span>'
              : '<span class="ico-lock">🔒</span>'}
            <span class="lbl">${label}</span>
            ${key === 'secondBrainPublic' && cap[key] && cap.secondBrainUrl
              ? `<a class="button secondary sm" href="${esc(cap.secondBrainUrl)}" target="_blank" rel="noopener noreferrer">${t('Open', 'افتح')}</a>`
              : ''}
          </div>`).join('')}`);
    }

    if (installment && installment.ok && installment.plan) {
      const planData = installment.plan;
      html += card(`
        <h3>💳 ${t('Payment plan', 'خطة الدفع')}
          ${planData.status === 'SUSPENDED' ? `<span class="track-suspend-flag">⛔ ${t('SUSPENDED', 'معلَّقة')}</span>` : ''}
        </h3>
        <p class="track-muted" style="margin-bottom:1rem">${t('Total', 'الإجمالي')} ${Number(planData.total || 0).toLocaleString(isAr ? 'ar-SA' : 'en-SA')} SAR</p>
        ${planData.installments.map((it) => {
          const paid = it.status === 'PAID';
          const overdue = it.status === 'OVERDUE' || (it.status === 'PENDING' && new Date(it.dueAt) < new Date());
          return `
          <div class="track-installment">
            ${paid ? '<span class="ico-ok">✔</span>' : overdue ? '<span class="ico-warn">⚠️</span>' : '<span class="ico-pending">○</span>'}
            <div class="info">
              <b>${esc(it.label)}</b>
              <small>${paid
                ? t('Paid', 'مدفوع') + (it.paidAt ? ` · ${String(it.paidAt).slice(0, 10)}` : '')
                : t('due', 'يستحق') + ' ' + String(it.dueAt).slice(0, 10)}</small>
            </div>
            <div class="amount ${paid ? 'paid' : ''}">${Number(it.amount || 0).toLocaleString(isAr ? 'ar-SA' : 'en-SA')} SAR</div>
            ${!paid && it.payUrl ? `<a class="button secondary sm" href="${esc(it.payUrl)}" target="_blank" rel="noopener noreferrer">${t('Pay', 'ادفع')}</a>` : ''}
          </div>`;
        }).join('')}`);
    }

    html += card(`
      <h3>${t('Tasks', 'المهام')}</h3>
      ${data.tasks && data.tasks.length === 0
        ? `<p class="track-muted">${t('No tasks yet', 'لا توجد مهام بعد')}</p>`
        : `<div>${(data.tasks || []).map((task) => `
          <div class="track-task ${task.status === 'Done' ? 'done' : ''}">
            ${task.status === 'Done' ? '<span class="ico-ok">✔</span>' : '<span class="ico-pending">○</span>'}
            <span class="name">${esc(task.name)}</span>
            <span class="channel">${esc(task.channel || '')}</span>
          </div>`).join('')}</div>`}`);

    if (data.milestones && data.milestones.length > 0) {
      html += card(`
        <h3>🎖️ ${t('Milestones', 'الأهداف')}</h3>
        <div>${data.milestones.map((m) => `
          <div class="track-milestone">
            <span>${esc(m.name)}</span>
            <span class="status ${m.status === 'Completed' ? 'done' : 'pending'}">${esc(m.status)}</span>
          </div>`).join('')}</div>`);
    }

    const links = [
      [`https://build-apply.brainsait.org/certificate/${encodeURIComponent(currentRef)}`, '🎖️ ' + t('Your certificate', 'شهادتك'), 'primary'],
      [`https://build-apply.brainsait.org/badge/${encodeURIComponent(currentRef)}`, '🏆 ' + t('Your badge', 'شارتك الرقمية'), 'secondary'],
    ];
    if (data.notionUrl) links.push([data.notionUrl, t('View in Notion', 'عرض في Notion'), 'secondary']);
    if (data.trackUrl) links.push([data.trackUrl, t('Open your track', 'افتح مسارك'), 'secondary']);
    if (data.repoUrl) links.push([data.repoUrl, t('Your GitHub repo', 'مستودعك على GitHub'), 'secondary']);

    html += `<div class="track-links">${links.map(([href, label, kind]) => `<a class="button ${kind}" href="${esc(href)}" target="_blank" rel="noopener noreferrer">${label}</a>`).join('')}</div>`;
    html += '</div>';

    dashEl.innerHTML = html;
    dashEl.hidden = false;

    const refresh = document.getElementById('gh-track-refresh');
    if (refresh) refresh.addEventListener('click', load);
    const copy = document.getElementById('gh-track-copy');
    if (copy) copy.addEventListener('click', () => {
      try {
        navigator.clipboard.writeText(currentRef);
      } catch { /* ignore */ }
    });
  };

  const load = () => {
    const ref = currentRef;
    if (!ref) return;
    renderLoading();
    Promise.all([
      fetch(`${API_BASE}/progress/${encodeURIComponent(ref)}`).then((r) => r.json()).catch(() => ({ ok: false, error: 'network' })),
      fetch(`${API_BASE}/installment/${encodeURIComponent(ref)}`).then((r) => r.json()).catch(() => ({ ok: false })),
    ]).then(([data, installment]) => {
      if (data.ok) renderDash(data, installment);
      else renderError(data.error || t('Not found', 'غير موجود'));
    });
  };

  goBtn.addEventListener('click', () => {
    const ref = refInput.value.trim();
    if (!ref) return;
    currentRef = ref;
    history.replaceState(null, '', '?ref=' + encodeURIComponent(ref));
    load();
  });
  refInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') goBtn.click();
  });

  const params = new URLSearchParams(window.location.search);
  const ref = params.get('ref');
  if (ref) {
    currentRef = ref;
    refInput.value = ref;
    load();
  }
})();