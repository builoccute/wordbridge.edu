/**
 * WORD BRIDGE V4.0 — Client Interactive Runtime (40 User App Features)
 * Responsive Mobile Drawer, Light/Dark & Font Size, Flashcard Flip, SM-2,
 * Web Speech Reference Audio, Local MediaRecorder, Writing Word/Char Counter,
 * WebAuthn Passkey, Toast Notifications & 1-Click SSO Launcher.
 */
(function () {
  // UI locale (VI/EN) shared as a cookie across the six subdomains.
  const registry = window.WB_I18N || { vi: {}, en: {}, phrases: {} };
  let currentLocale = 'vi';
  function message(key, fallback = '') {
    return registry[currentLocale]?.[key] || registry.vi?.[key] || fallback || key;
  }
  function translatePatternText(value) {
    if (!value) return '';
    let match;
    if ((match=value.match(/^Ôn (\d+) mục từ đến hạn$/))) return 'Review due items ('+match[1]+')';
    if ((match=value.match(/^Điểm trung bình evidence hiện tại (\d+)%\.$/))) return 'Average recorded score: '+match[1]+'%.';
    if ((match=value.match(/^([\d.]+) mục từ, IPA, nghĩa nghề nghiệp và (\d+) nhóm chủ đề từ dataset hiện hữu\.$/))) return match[1].replace(/\./g,',')+' terms with IPA and professional meanings across '+match[2]+' topics.';
    if ((match=value.match(/^Ví dụ dữ liệu: (.+)\. Tìm kiếm\/lọc là action và được auth-gate khi chưa đăng nhập\.$/))) return 'Examples: '+match[1]+'. Sign in to search or filter.';
    if ((match=value.match(/^Tìm kiếm: (.*)$/))) return 'Search: '+match[1];
    if ((match=value.match(/^Luyện (\S+(?: \S+)?)$/)) && registry.phrases[match[1]]) return 'Practice '+registry.phrases[match[1]].toLowerCase();
    if ((match = value.match(/^(\d+) exercise đã phát hành\.$/))) return `${match[1]} published exercise${match[1] === '1' ? '' : 's'}.`;
    if ((match = value.match(/^(\d+) câu hỏi đã phát hành cho skill mapping hiện tại\.$/))) return `${match[1]} published question${match[1] === '1' ? '' : 's'} for the current skill mapping.`;
    if ((match = value.match(/^(\d+) mục từ khớp dữ liệu công bố\.$/))) return `${match[1]} entries match published data.`;
    if ((match = value.match(/^(\d+) mục notebook đến hạn\.$/))) return `${match[1]} notebook item${match[1] === '1' ? '' : 's'} due for review.`;
    if ((match = value.match(/^(\d+) mục từ đến hạn ôn\.$/))) return `${match[1]} vocab item${match[1] === '1' ? '' : 's'} due for review.`;
    if ((match = value.match(/^(\d+) practice evidence gần đây\.$/))) return `${match[1]} recent practice evidence record${match[1] === '1' ? '' : 's'}.`;
    if ((match = value.match(/^Số từ: (\d+) · Hán tự: (\d+) · Tổng ký tự: (\d+)$/))) return `Words: ${match[1]} · Han characters: ${match[2]} · Total characters: ${match[3]}`;
    if ((match = value.match(/^Mới bắt đầu → (.+) · (\d+) tuần · ~(\d+) giờ$/))) return `New → ${match[1]} · ${match[2]} weeks · ~${match[3]} hours`;
    if ((match = value.match(/^(.+) → (.+) · (\d+) tuần · ~(\d+) giờ$/))) return `${match[1]} → ${match[2]} · ${match[3]} weeks · ~${match[4]} hours`;
    if ((match = value.match(/^Tham chiếu (.+) · (.+)$/))) return `Reference ${match[1]} · ${match[2]}`;
    if ((match = value.match(/^Tổng hợp (.+) · (\d+) phút · (.+)$/))) return `Comprehensive ${match[1]} · ${match[2]} minutes · ${match[3]}`;
    return value
      .replace(/ · danh từ \(n\)$/,' · noun (n)')
      .replace(/ · tính từ \(adj\)$/,' · adjective (adj)')
      .replace(/ · danh từ chuyên ngành$/,' · specialized noun');
  }
  const originalText = new WeakMap();
  const originalAttributes = new WeakMap();
  const originalTitle = document.title;
  function translateExactText(root) {
    if (!registry.phrases) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach((node) => {
      if (node.parentElement?.closest('script,style,textarea,[data-i18n],[data-learning-content]')) return;
      const previous = originalText.get(node);
      const raw = previous && node.nodeValue === previous.rendered ? previous.source : node.nodeValue || '';
      const trimmed = raw.trim();
      if (!trimmed) return;
      const translated = currentLocale === 'en' ? registry.phrases[trimmed] || translatePatternText(trimmed) : registry.vietnamese?.[trimmed] || trimmed;
      if (!translated) return;
      const leading = raw.match(/^\s*/)?.[0] || '';
      const trailing = raw.match(/\s*$/)?.[0] || '';
      const rendered = `${leading}${translated}${trailing}`;
      if (rendered !== node.nodeValue) node.nodeValue = rendered;
      originalText.set(node,{source:raw,rendered});
    });
  }
  function translateDocumentTitle() {
    if (currentLocale !== 'en') { document.title = originalTitle; return; }
    const parts = originalTitle.split(' | ');
    let page = parts[0] || '';
    page = registry.phrases?.[page] || translatePatternText(page);
    page = page.replace(/^(.+) — Skill Center$/, (_, skill) => `${registry.phrases?.[skill] || skill} — Skill Center`)
      .replace(/^(.+) — Chuyên ngành$/, '$1 — Specialized')
      .replace(/^Từ điển (.+)$/, (_,lang) => 'Dictionary '+(registry.phrases[lang] || lang));
    document.title = [page, ...parts.slice(1)].join(' | ');
  }
  function translateStaticAttributes(root) {
    if (!root || !registry.phrases) return;
    const elements = root.querySelectorAll ? [root,...root.querySelectorAll('[placeholder],[aria-label],[title],[alt]')] : [];
    elements.forEach((el) => {
      for (const attr of ['placeholder','aria-label','title','alt']) {
        if (el.matches('[data-i18n-aria]') && attr === 'aria-label' || el.matches('[data-i18n-placeholder]') && attr === 'placeholder') continue;
        const attrs=originalAttributes.get(el) || {};
        const raw=attrs[attr] ?? el.getAttribute(attr);
        if (!raw) continue;
        attrs[attr]=raw;
        originalAttributes.set(el,attrs);
        el.setAttribute(attr,currentLocale==='en' ? registry.phrases[raw] || raw : registry.vietnamese?.[raw] || raw);
      }
    });
  }
  function applyTranslations(locale, root = document.body) {
    document.documentElement.lang = locale;
    document.querySelectorAll('[data-i18n]').forEach((el) => { const value = registry[locale]?.[el.dataset.i18n]; if (value) el.textContent = value; });
    document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => { const value = registry[locale]?.[el.dataset.i18nPlaceholder]; if (value) el.setAttribute('placeholder', value); });
    document.querySelectorAll('[data-i18n-aria]').forEach((el) => { const value = registry[locale]?.[el.dataset.i18nAria]; if (value) el.setAttribute('aria-label', value); });
    translateExactText(root); translateStaticAttributes(root); translateDocumentTitle();
  }
  function setUiLocale(value) {
    const locale = value === 'en' ? 'en' : 'vi';
    currentLocale = locale;
    applyTranslations(locale);
    for(const link of document.querySelectorAll('a[href^="https://portal.wordbridge.io.vn/login"]')){
      const dest=new URL(link.href);
      if(dest.origin!=='https://portal.wordbridge.io.vn' || dest.pathname!=='/login') continue;
      const next=new URL(dest.searchParams.get('next') || location.href,location.origin);
      if(next.pathname===location.pathname || link.hasAttribute('data-wb-auth-link')) dest.searchParams.set('next',safeReturnUrl(location.href));
      dest.searchParams.set('locale',locale);
      link.href=dest.href;
    }
    for(const link of document.querySelectorAll('a[data-wb-handoff]')){
      const dest=new URL(link.href);
      dest.searchParams.set('locale',locale);
      link.href=dest.href;
    }
    document.querySelectorAll('[data-wb-locale]').forEach((el) => { el.value = locale; });
    document.cookie = `wb_ui_locale=${locale}; Path=/; Domain=.wordbridge.io.vn; SameSite=Lax; Secure; Max-Age=31536000`;
    try { localStorage.setItem('wb_ui_locale', locale); } catch {}
  }
  const cookieLocale = document.cookie.match(/(?:^|;\s*)wb_ui_locale=(vi|en)(?:;|$)/)?.[1];
  let selectedLocale = new URL(location.href).searchParams.get('locale') || cookieLocale;
  try { selectedLocale ||= localStorage.getItem('wb_ui_locale'); } catch {}
  setUiLocale(selectedLocale);
  const i18nObserver = new MutationObserver((records) => {
    for (const record of records) for (const node of record.addedNodes) if (node.nodeType === Node.ELEMENT_NODE) { translateExactText(node); translateStaticAttributes(node); }
  });
  i18nObserver.observe(document.body, { childList: true, subtree: true });
  document.addEventListener('change', (event) => {
    if (event.target.matches('[data-wb-locale]')) {
      setUiLocale(event.target.value);
      // Reload so server-rendered dynamic labels can also use the selected locale as integrations evolve.
      const current = new URL(location.href);
      if (current.searchParams.has('locale')) {
        current.searchParams.set('locale',currentLocale);
        history.replaceState(history.state,'',current.href);
      }
      document.dispatchEvent(new Event('wb-locale-change'));
    }
  });

  const savedTheme = localStorage.getItem('wb_theme');
  if (savedTheme) document.documentElement.setAttribute('data-theme', savedTheme);
  const savedFont = localStorage.getItem('wb_font_scale');
  if (savedFont) document.documentElement.style.fontSize = `${savedFont}px`;

  function getCsrfToken() {
    const meta = document.querySelector('meta[name="wb-csrf-token"]');
    return meta ? meta.getAttribute('content') || '' : '';
  }

  function showToast(msg, isError = false) {
    let root = document.getElementById('wb-toast-root');
    if (!root) {
      root = document.createElement('div');
      root.id = 'wb-toast-root';
      document.body.appendChild(root);
    }
    const el = document.createElement('div');
    el.className = 'wb-toast';
    if (isError) el.style.borderLeftColor = '#CB0203';
    el.textContent = msg;
    root.appendChild(el);
    setTimeout(() => el.remove(), 4000);
  }

  async function apiRequest(url, payload, method = 'POST') {
    const headers = { 'Content-Type': 'application/json' };
    const csrf = getCsrfToken();
    if (csrf) headers['X-CSRF-Token'] = csrf;
    const res = await fetch(url, {
      method,
      headers,
      body: method === 'GET' ? undefined : JSON.stringify(payload || {}),
    }).catch(() => null);
    if (!res) return {status:0,data:{ok:false}};
    const data = await res.json().catch(() => ({ ok: false, error: { message: message('status.responseError', 'Lỗi phản hồi máy chủ.') } }));
    return { status: res.status, data: data && typeof data==='object' ? data : {ok:false} };
  }

  function safeReturnUrl(candidate = window.location.href) {
    try {
      const value = new URL(candidate, window.location.origin);
      if (value.origin !== window.location.origin) return `${window.location.origin}/`;
      return value.toString();
    } catch { return `${window.location.origin}/`; }
  }
  function buildSignInUrl(intent = 'auth.login', returnTo = window.location.href) {
    const url = new URL('https://portal.wordbridge.io.vn/login');
    url.searchParams.set('next', safeReturnUrl(returnTo));
    if (intent) url.searchParams.set('intent', String(intent).slice(0, 120));
    url.searchParams.set('locale', currentLocale === 'en' ? 'en' : 'vi');
    return url.toString();
  }
  function openAuthGate(intent = 'auth.login', returnTo = window.location.href) {
    const dialog = document.getElementById('wb-auth-gate');
    const login = dialog?.querySelector('[data-wb-auth-gate-login]');
    if (login) login.href = buildSignInUrl(intent, returnTo);
    if (dialog?.showModal) dialog.showModal();
    else window.location.href = buildSignInUrl(intent, returnTo);
  }
  window.WB_AUTH = Object.freeze({ open: openAuthGate, signInUrl: buildSignInUrl });
  document.addEventListener('click', (event) => {
    const gate = event.target.closest('[data-auth-intent]:not(form)');
    if (gate) {
      event.preventDefault();
      openAuthGate(gate.getAttribute('data-auth-intent') || 'auth.action', gate.getAttribute('data-return-to') || window.location.href);
      return;
    }
    const loginAction = event.target.closest('a[href^="https://portal.wordbridge.io.vn/login"]:not([data-wb-auth-link]):not([data-wb-auth-gate-login])');
    if (loginAction) {
      event.preventDefault();
      const loginUrl = new URL(loginAction.href);
      const next=new URL(loginUrl.searchParams.get('next') || location.href,location.origin);
      openAuthGate(loginUrl.searchParams.get('intent') || 'auth.action',next.pathname===location.pathname ? location.href : safeReturnUrl(next.href));
      return;
    }
    if (event.target.closest('[data-wb-auth-close]')) document.getElementById('wb-auth-gate')?.close();
  });
  document.addEventListener('submit', (event) => {
    const gate = event.target.closest('form[data-auth-intent]');
    if (!gate) return;
    event.preventDefault();
    const form = new FormData(gate);
    const action = new URL(gate.action || window.location.href, window.location.href);
    if(action.pathname===location.pathname) {action.search=location.search;action.hash=location.hash;}
    for (const [key, value] of form.entries()) action.searchParams.set(key, String(value));
    openAuthGate(gate.getAttribute('data-auth-intent') || 'auth.action', gate.getAttribute('data-return-to') || safeReturnUrl(action.toString()));
  });


  function studyCards() { return [...document.querySelectorAll('[data-wb-study-card]')]; }
  function activeStudyIndex() { return studyCards().findIndex(card => !card.hidden); }
  function showStudyCard(index) {
    const cards = studyCards();
    if (!cards.length || index < 0 || index >= cards.length) return;
    cards.forEach((card, i) => {
      card.hidden = i !== index;
      card.querySelector('[data-wb-back]').hidden = true;
      card.querySelector('[data-wb-front]').hidden = false;
      card.querySelector('[data-wb-review-form]').hidden = true;
      card.querySelector('[data-wb-reveal]').setAttribute('aria-expanded', 'false');
    });
    cards[index].querySelector('.wb-study-surface')?.focus();
  }
  function revealStudyCard(card) {
    card.querySelector('[data-wb-back]').hidden = false;
    card.querySelector('[data-wb-front]').hidden = true;
    card.querySelector('[data-wb-review-form]').hidden = false;
    card.querySelector('[data-wb-reveal]').setAttribute('aria-expanded', 'true');
  }
  document.addEventListener('click', event => {
    const card = event.target.closest('[data-wb-study-card]');
    if (!card) return;
    const n = activeStudyIndex();
    if (event.target.closest('[data-wb-reveal]')) revealStudyCard(card);
    if (event.target.closest('[data-wb-study-prev]')) showStudyCard(n - 1);
    if (event.target.closest('[data-wb-study-next]')) showStudyCard(n + 1);
    const grade = event.target.closest('[data-wb-grade]');
    if (grade) {
      const form = card.querySelector('[data-wb-review-form]');
      form.querySelector('[name=quality]').value = grade.getAttribute('data-wb-grade');
      form.requestSubmit();
    }
  });
  document.addEventListener('keydown', event => {
    if (document.querySelector('dialog[open]') || !document.querySelector('[data-wb-study-deck]') || /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || '') || event.ctrlKey || event.altKey) return;
    const index = activeStudyIndex();
    if (index < 0) return;
    const card = studyCards()[index];
    if (event.code === 'Space' && !event.target.closest('button,a,audio')) {event.preventDefault();revealStudyCard(card);}
    else if (event.code === 'ArrowLeft') {event.preventDefault();showStudyCard(index - 1);}
    else if (event.code === 'ArrowRight') {event.preventDefault();showStudyCard(index + 1);}
    else if (/^[1-4]$/.test(event.key) && !card.querySelector('[data-wb-review-form]').hidden) {
      const quality = ['1','3','4','5'][Number(event.key)-1];
      card.querySelector('[data-wb-grade="'+quality+'"]').click();
    }
  });
  let touchStartX = null;
  document.addEventListener('touchstart', event => {if (event.target.closest('[data-wb-study-card]')) touchStartX=event.changedTouches[0].screenX;}, {passive:true});
  document.addEventListener('touchend', event => {if (touchStartX === null || !event.target.closest('[data-wb-study-card]')) return;const delta=event.changedTouches[0].screenX-touchStartX;touchStartX=null;if(Math.abs(delta)>80) showStudyCard(activeStudyIndex() + (delta<0 ? 1:-1));}, {passive:true});

  for(const form of document.querySelectorAll('[data-draft-key]')){
    try {
      const draft=JSON.parse(sessionStorage.getItem(form.dataset.draftKey) || '{}');
      for(const field of form.querySelectorAll('textarea')) field.value=draft[field.name] || '';
    } catch {}
  }
  // Feature 20: Live Word & Character Counter for Writing exercises (CJK / Latin / Cyrillic)
  document.addEventListener('input', (ev) => {
    const ta = ev.target.closest('textarea[data-wb-counter]');
    if (!ta) return;
    const out = document.getElementById(ta.getAttribute('data-wb-counter'));
    if (!out) return;
    const draftForm=ta.closest('[data-draft-key]');
    if(draftForm) try {
      const entries=[...draftForm.querySelectorAll('textarea')].map(field=>[field.name,field.value]);
      sessionStorage.setItem(draftForm.dataset.draftKey,JSON.stringify(Object.fromEntries(entries)));
    } catch {}
    const text = ta.value.trim();
    const words = text ? text.split(/\s+/).length : 0;
    const cjk = (text.match(/[\u4e00-\u9fff]/g) || []).length;
    out.textContent = currentLocale === 'en' ? `Words: ${words} · Han characters: ${cjk} · Total characters: ${text.length}` : `Số từ: ${words} · Hán tự: ${cjk} · Tổng ký tự: ${text.length}`;
  });

  // Form submissions (Public View -> Login-to-Use prompt on 401)
  document.addEventListener('submit', async (ev) => {
    const form = ev.target.closest('form[data-api-endpoint]');
    if (!form) return;
    ev.preventDefault();
    if (form.dataset.pending) return;
    form.dataset.pending = 'true';
    const endpoint = form.getAttribute('data-api-endpoint');
    const method = form.getAttribute('data-api-method') || 'POST';
    const redirectTo = form.getAttribute('data-redirect-to');
    const statusBox = form.querySelector('[data-form-status]') || document.getElementById('wb-global-status');

    const fd = new FormData(form);
    const payload = {};
    const answers = {};
    for (const [k, v] of fd.entries()) {
      if (k.startsWith('answer_')) answers[k.slice(7)] = v;
      else payload[k] = v;
    }
    if (Object.keys(answers).length > 0) payload.answers = answers;

    if (statusBox) {
      statusBox.className = 'wb-alert wb-alert-info';
      statusBox.textContent = message('status.processing', 'Đang xử lý yêu cầu...');
    }

    const { status, data } = await apiRequest(endpoint, payload, method);
    delete form.dataset.pending;
    if (status === 401) {
      const msg = message('auth.required', 'Bạn cần đăng nhập để thực hiện hành động này.');
      if (statusBox) {
        statusBox.className = 'wb-alert wb-alert-warn';
        statusBox.textContent = msg;
      }
      showToast(msg, true);
      openAuthGate(endpoint, window.location.href);
      return;
    }

    if (status >= 200 && status < 300 && data.ok) {
      if (form.hasAttribute('data-wb-review-form')) {
        if (statusBox) {statusBox.className='wb-alert wb-alert-ok';statusBox.textContent=currentLocale === 'en' ? 'Review rating saved.' : 'Đã lưu đánh giá ôn tập.';}
        const current=activeStudyIndex();
        const card=form.closest('[data-wb-study-card]');
        card.remove();
        if (studyCards().length) showStudyCard(Math.min(current, studyCards().length-1));
        else {
          const deck=document.querySelector('[data-wb-study-deck]');
          deck.tabIndex=-1;
          deck.setAttribute('role','status');
          deck.textContent=currentLocale==='en' ? 'Review session completed.' : 'Đã hoàn thành lượt ôn tập.';
          deck.focus();
        }
        return;

      }
      if (statusBox) {
        statusBox.className = 'wb-alert wb-alert-ok';
        statusBox.textContent = currentLocale==='en' ? registry.phrases[data.message] || message('status.success') : data.message || message('status.success');
      }
      showToast(statusBox?.textContent || message('status.saved'));
      if (data.attemptId && form.hasAttribute('data-redirect-attempt')) {
        window.location.href = `/examination-attempts/${data.attemptId}`;
        return;
      }
      if (data.resultId && form.hasAttribute('data-redirect-practice-result')) {
        if(form.dataset.draftKey) try {sessionStorage.removeItem(form.dataset.draftKey);} catch {}
        window.location.href = `/practice/results/${encodeURIComponent(data.resultId)}`;
        return;
      }
      if (data.resultId && form.hasAttribute('data-redirect-exam-result')) {
        window.location.href = `/examination-results/${data.resultId}`;
        return;
      }
      if (redirectTo) {
        window.location.href = redirectTo;
      } else if (form.hasAttribute('data-render-json')) {
        const out = document.getElementById(form.getAttribute('data-render-json'));
        if (out) {
          out.innerHTML = `<div class="wb-card" style="border-left:4px solid var(--wb-aqua);"><h4 style="margin-top:0;color:var(--wb-teal);">Kết quả phân tích</h4><pre data-result-json style="white-space:pre-wrap;margin:0;font-family:var(--wb-font-mono);font-size:0.84rem;"></pre></div>`;
          out.querySelector('[data-result-json]').textContent = JSON.stringify(data, null, 2);
        }
      }
    } else if (statusBox) {
      const detail=data?.error?.message || data?.error;
      const errMsg=typeof detail==='string' ? (currentLocale==='en' ? registry.phrases[detail] || message('status.requestError') : detail) : message('status.requestError');
      statusBox.className = 'wb-alert wb-alert-error';
      statusBox.textContent = errMsg;
      showToast(errMsg, true);
    }
  });

  // Local MediaRecorder for Feature 14 (Self Read-Aloud Playback — No fake ASR scores)
  for (const event of ['loadstart','error','canplay','timeupdate']) document.addEventListener(event,e=>{
    if (!(e.target instanceof HTMLAudioElement)) return;
    const player=e.target.closest('[data-wb-audio]');
    if (!player) return;
    const status=player.querySelector('[data-audio-status]');
    if(event==='timeupdate'){
      const time=e.target.currentTime*1000;
      for(const segment of player.querySelectorAll('[data-audio-segment-end]')) segment.setAttribute('aria-current',String(time>=Number(segment.dataset.audioSegmentStart)&&time<Number(segment.dataset.audioSegmentEnd)));
    } else if(status) status.textContent=event==='error' ? message('status.requestError') : event==='loadstart' ? message('status.processing') : (currentLocale==='en'?'Ready to play':'Sẵn sàng phát');
  },true);
  let activeRecorder = null;
  let recordingAttempt = 0;
  let recordingStream;
  let playbackUrl;
  let recordingStartedAt = 0;
  let recordingTimer = null;

  document.addEventListener('click', async (ev) => {
    // Feature 33: Mobile Drawer Toggle
    const menuBtn = ev.target.closest('[data-wb-menu-toggle]');
    if (menuBtn) {
      const nav = document.getElementById('wb-main-nav');
      if (nav) { nav.classList.toggle('open'); menuBtn.setAttribute('aria-expanded', String(nav.classList.contains('open'))); }
      return;
    }

    // Feature 34: Light/Dark Mode & Font Scale
    const themeBtn = ev.target.closest('[data-wb-theme-toggle]');
    if (themeBtn) {
      const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('wb_theme', next);
      showToast(currentLocale === 'en' ? `Switched to ${next === 'dark' ? 'dark' : 'light'} appearance.` : `Đã chuyển sang giao diện ${next === 'dark' ? 'Tối' : 'Sáng'}.`);
      return;
    }
    const fontBtn = ev.target.closest('[data-wb-font-step]');
    if (fontBtn) {
      const cur = Number(localStorage.getItem('wb_font_scale') || 16);
      const next = Math.min(20, Math.max(14, cur + Number(fontBtn.getAttribute('data-wb-font-step'))));
      document.documentElement.style.fontSize = `${next}px`;
      localStorage.setItem('wb_font_scale', String(next));
      return;
    }

    // Feature 9: Interactive Flashcard Flip
    const fc = ev.target.closest('[data-wb-flashcard]');
    if (fc && !ev.target.closest('button, form, select, input')) {
      const flipped = fc.getAttribute('data-flipped') === 'true';
      fc.setAttribute('data-flipped', flipped ? 'false' : 'true');
      return;
    }

    // Feature 15: Web Speech API Reference Pronunciation (labeled non-native)
    const ttsBtn = ev.target.closest('[data-wb-tts]');
    if (ttsBtn) {
      if (!('speechSynthesis' in window)) {
        showToast(currentLocale === 'en' ? 'This browser does not support Web Speech playback.' : 'Trình duyệt không hỗ trợ đọc mẫu Web Speech.', true);
        return;
      }
      const text = ttsBtn.getAttribute('data-wb-tts') || '';
      const langMap = { zh: 'zh-CN', en: 'en-US', ru: 'ru-RU' };
      const u = new SpeechSynthesisUtterance(text);
      u.lang = langMap[ttsBtn.getAttribute('data-wb-lang')] || 'en-US';
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
      showToast(currentLocale === 'en' ? 'Playing browser-generated reference speech.' : 'Đang phát giọng tổng hợp trình duyệt (tham khảo).');
      return;
    }

    // Feature 14: Local read-aloud recorder. No fake ASR/pronunciation score.
    const retryBtn = ev.target.closest('[data-wb-record-retry]');
    const recBtn = ev.target.closest('[data-wb-record-toggle]');
    if (retryBtn || recBtn) {
      const scope = (retryBtn || recBtn).closest('.wb-recorder-studio,.wb-pronunciation-lab') || document;
      const toggle = scope.querySelector('[data-wb-record-toggle]');
      const status = scope.querySelector('[data-wb-record-status]');
      const playback = scope.querySelector('audio');
      if (retryBtn) {
        recordingAttempt++;
        if (activeRecorder?.state === 'recording') activeRecorder.stop();
        recordingStream?.getTracks().forEach(track => track.stop());
        clearInterval(recordingTimer);
        if (playbackUrl) URL.revokeObjectURL(playbackUrl);
        playback?.removeAttribute('src');
        if (playback) playback.hidden = true;
        toggle.disabled=false;
        toggle.textContent=message('media.record');
        status.textContent=currentLocale==='en' ? 'Recording cleared.' : 'Đã xóa bản ghi.';
        return;
      }
      if (activeRecorder?.state === 'recording') { activeRecorder.stop(); return; }
      const attempt=++recordingAttempt;
      let stream;
      toggle.disabled=true;
      try {
        if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) throw new DOMException('Unsupported','NotSupportedError');
        stream=await navigator.mediaDevices.getUserMedia({audio:true});
        if (attempt!==recordingAttempt) {stream.getTracks().forEach(track=>track.stop());return;}
        recordingStream=stream;
        const recorder=new MediaRecorder(stream);
        activeRecorder=recorder;
        const chunks=[];
        recorder.ondataavailable=e=>{if(e.data.size) chunks.push(e.data);};
        recorder.onerror=()=>{recordingAttempt++;stream.getTracks().forEach(track=>track.stop());clearInterval(recordingTimer);toggle.disabled=false;toggle.textContent=message('media.record');status.textContent=message('status.requestError');};
        recorder.onstop=()=>{
          stream.getTracks().forEach(track=>track.stop());
          if(attempt!==recordingAttempt) return;
          clearInterval(recordingTimer);
          toggle.disabled=false;
          toggle.textContent=message('media.record');
          const blob=new Blob(chunks,{type:recorder.mimeType});
          if(!blob.size){status.textContent=message('status.requestError');return;}
          if(playbackUrl) URL.revokeObjectURL(playbackUrl);
          playbackUrl=URL.createObjectURL(blob);
          playback.src=playbackUrl;
          playback.hidden=false;
          status.textContent=message('media.recorded');
        };
        recorder.start();
        recordingStartedAt=Date.now();
        toggle.textContent=message('media.stop');
        toggle.disabled=false;
        const elapsed=()=>{status.textContent=message('media.record')+' · '+Math.floor((Date.now()-recordingStartedAt)/1000)+' s';};
        elapsed();
        recordingTimer=setInterval(elapsed,1000);
      } catch(error) {
        stream?.getTracks().forEach(track=>track.stop());
        if(attempt!==recordingAttempt) return;
        toggle.disabled=false;
        status.textContent=error.name==='NotAllowedError' ? message('media.noMic') : error.name==='NotSupportedError' ? (currentLocale==='en'?'Recording is unavailable in this browser.':'Trình duyệt không hỗ trợ ghi âm.') : (currentLocale==='en'?'No usable microphone.':'Không có micro khả dụng.');
      }
      return;
    }

    // Feature 40: 1-Click SSO Launcher to Reader / Exam
    const ssoBtn = ev.target.closest('[data-wb-sso-launch]');
    if (ssoBtn) {
      const target = ssoBtn.getAttribute('data-wb-sso-launch');
      const { status, data } = await apiRequest('/api/v1/sso/reader/issue', { target });
      if (status === 401) {
        window.location.href = `https://portal.wordbridge.io.vn/login?next=${encodeURIComponent(window.location.href)}`;
        return;
      }
      if (data.ok && data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        showToast(data?.error?.message || (currentLocale === 'en' ? 'The SSO secret must be configured in quantri.wordbridge.io.vn.' : 'Cần cấu hình SSO secret tại quantri.wordbridge.io.vn.'), true);
      }
      return;
    }

    // Logout
    const logoutBtn = ev.target.closest('[data-wb-logout]');
    if (logoutBtn) {
      ev.preventDefault();
      const result=await apiRequest('/api/v1/auth/logout',{});
      if(result.data.ok) window.location.href='/';
      else showToast(message('status.requestError'),true);
      return;
    }

    // Feature 7: 1-Click Save Vocabulary
    const saveVocabBtn = ev.target.closest('[data-save-vocab]');
    if (saveVocabBtn) {
      const entryId = saveVocabBtn.getAttribute('data-save-vocab');
      const payload = saveVocabBtn.dataset.domain ? {domain:saveVocabBtn.dataset.domain,term:Number(saveVocabBtn.dataset.term)} : {entryId};
      saveVocabBtn.disabled = true;
      const { status, data } = await apiRequest('/api/v1/vocabulary/notebook', payload);
      saveVocabBtn.disabled = Boolean(data.ok);
      if (status === 401) {
        openAuthGate('dictionary.save',location.href);
        return;
      }
      saveVocabBtn.textContent = status < 300 && data.ok ? (currentLocale === 'en' ? 'Saved to My Vocabulary' : 'Đã lưu Sổ từ') : (currentLocale==='en' ? registry.phrases[data?.error?.message] || message('status.requestError') : data?.error?.message || message('status.requestError'));
      return;
    }

    // Feature 12 & 13: HTML5 Audio Player Controls
    const player = ev.target.closest('[data-wb-audio]');
    if (player) {
      const audio = player.querySelector('audio');
      const statusEl = player.querySelector('[data-audio-status]');
      const actionBtn = ev.target.closest('[data-audio-action]');
      const speedBtn = ev.target.closest('[data-audio-speed]');
      const segBtn = ev.target.closest('[data-audio-segment-start]');
      if (audio && speedBtn) {
        const rate = Number(speedBtn.getAttribute('data-audio-speed')) || 1.0;
        audio.playbackRate = rate;
        const label = player.querySelector('[data-speed-label]');
        if (label) label.textContent = `${rate}x`;
      }
      if (audio && actionBtn) {
        const act = actionBtn.getAttribute('data-audio-action');
        if (act === 'play') audio.play().catch(() => { if (statusEl) statusEl.textContent = currentLocale === 'en' ? 'The official audio asset is still awaiting upload through quantri.wordbridge.io.vn.' : 'Tệp audio chính thức đang chờ tải lên kho lưu trữ quantri.wordbridge.io.vn.'; });
        if (act === 'pause') audio.pause();
        if (act === 'stop') { audio.pause(); audio.currentTime = 0; }
        if (act === 'replay') { audio.currentTime = 0; audio.play().catch(() => {}); }
        if (act === 'back') audio.currentTime = Math.max(0, audio.currentTime - 5);
        if (act === 'forward') audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + 5);
        if (act === 'loop') {
          audio.loop = !audio.loop;
          actionBtn.setAttribute('aria-pressed',String(audio.loop));
          actionBtn.textContent=currentLocale==='en' ? (audio.loop?'Loop on':'Loop off') : (audio.loop?'Lặp: Bật':'Lặp: Tắt');
        }
      }
      if (audio && segBtn) {
        const startSec = Number(segBtn.getAttribute('data-audio-segment-start')) / 1000;
        audio.currentTime = startSec;
        audio.play().catch(() => { if (statusEl) statusEl.textContent = currentLocale === 'en' ? 'Sentence selected; the audio asset is still pending in quantri.' : 'Đang chọn câu để phát (chờ tệp audio tại quantri).'; });
      }
    }
  });
})();
