/**
 * WORD BRIDGE V4 — Client Interactive Runtime
 * - Unified Auth Gate (window.WB_AUTH) with safeReturnUrl, intent & locale preservation
 * - VI / EN live locale switching without losing URL query, flashcard reveal state, or form inputs
 * - Flashcard Studio: reveal, keyboard (Space, Arrows, 1-4), touch swipe, shuffle/restart, honest retry on failure
 * - Microphone Recorder: unsupported/denied/missing handling, cancel-while-waiting track cleanup, playback & retry
 * - Real HTML5 Audio player controls, Writing counter, Passkey/SSO launcher, Toast notifications
 */
(function () {
  const PORTAL_LOGIN = '/login';
  const MAIN_ORIGIN = 'https://wordbridge.io.vn';
  const ALLOWED_ORIGINS = [
    MAIN_ORIGIN,
  ];

  function currentLocale() {
    const sel = document.querySelector('[data-wb-locale]');
    const raw = (sel && sel.value) || document.documentElement.lang || (localStorage && localStorage.getItem('wb_locale')) || 'vi';
    return String(raw).toLowerCase() === 'en' ? 'en' : 'vi';
  }

  function safeReturnUrl(input) {
    const fallback = MAIN_ORIGIN + '/';
    const raw = String(input || '').trim();
    if (!raw) return fallback;
    try {
      const origin = (window.location && window.location.origin && window.location.origin !== 'null') ? window.location.origin : MAIN_ORIGIN;
      const parsed = raw.startsWith('/') && !raw.startsWith('//') ? new URL(raw, origin) : new URL(raw);
      if (ALLOWED_ORIGINS.includes(parsed.origin) || parsed.origin === origin) return parsed.toString();
      return fallback;
    } catch {
      return fallback;
    }
  }

  function buildSignInUrl(nextTarget, intent) {
    const origin = (window.location && window.location.origin && window.location.origin !== 'null') ? window.location.origin : MAIN_ORIGIN;
    const url = new URL(PORTAL_LOGIN, origin);
    url.searchParams.set('next', safeReturnUrl(nextTarget || (window.location ? window.location.href : MAIN_ORIGIN + '/')));
    if (intent) url.searchParams.set('intent', String(intent));
    url.searchParams.set('locale', currentLocale());
    return url.toString();
  }

  function openAuthGate(nextTarget, intent) {
    const loginHref = buildSignInUrl(nextTarget, intent);
    const gate = document.getElementById('wb-auth-gate');
    const cta = document.getElementById('wb-auth-gate-cta');
    if (cta) cta.setAttribute('href', loginHref);
    if (gate && typeof gate.showModal === 'function') {
      gate.showModal();
      return;
    }
    if (window.location) window.location.href = loginHref;
  }

  function closeAuthGate() {
    const gate = document.getElementById('wb-auth-gate');
    if (gate && typeof gate.close === 'function') gate.close();
  }

  window.WB_AUTH = Object.freeze({
    portalLogin: PORTAL_LOGIN,
    safeReturnUrl,
    buildSignInUrl,
    openAuthGate,
    closeAuthGate,
  });

  // Restore saved theme & font scale safely
  try {
    const savedTheme = localStorage.getItem('wb_theme');
    if (savedTheme) document.documentElement.setAttribute('data-theme', savedTheme);
    const savedFont = localStorage.getItem('wb_font_scale');
    if (savedFont) document.documentElement.style.fontSize = `${savedFont}px`;
  } catch {}

  function applyLocale(locale) {
    const norm = String(locale || '').toLowerCase() === 'en' ? 'en' : 'vi';
    document.documentElement.lang = norm;
    try { localStorage.setItem('wb_locale', norm); } catch {}
    const i18n = window.WB_I18N;
    if (!i18n) return;
    if (typeof i18n.apply === 'function') {
      i18n.apply(norm);
      return;
    }
    const dict = norm === 'en' ? i18n.en : i18n.vi;
    if (dict) {
      document.querySelectorAll('[data-i18n]').forEach((el) => {
        const key = el.getAttribute('data-i18n');
        if (key && dict[key]) el.textContent = dict[key];
      });
    }
  }

  document.addEventListener('change', (ev) => {
    const sel = ev.target && ev.target.closest ? ev.target.closest('[data-wb-locale]') : null;
    if (!sel) return;
    applyLocale(sel.value);
  });

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
    if (isError && el.style) el.style.borderLeftColor = '#CB0203';
    el.textContent = msg;
    root.appendChild(el);
    setTimeout(() => el.remove(), 4000);
  }

  async function apiRequest(url, payload, method = 'POST') {
    const headers = { 'Content-Type': 'application/json' };
    const csrf = getCsrfToken();
    if (csrf) headers['X-CSRF-Token'] = csrf;
    try {
      const res = await fetch(url, {
        method,
        headers,
        body: method === 'GET' || method === 'DELETE' ? undefined : JSON.stringify(payload || {}),
      });
      const data = await res.json().catch(() => ({ ok: false, error: { message: 'Lỗi phản hồi máy chủ.' } }));
      return { status: res.status, data };
    } catch {
      return { status: 0, data: { ok: false, error: { message: 'Không thể kết nối máy chủ. Kết quả chưa được lưu; hãy thử lại.' } } };
    }
  }

  // ---- Flashcard Deck Helpers ----
  function getAllCards() {
    return Array.from(document.querySelectorAll('[data-wb-study-card]') || []);
  }

  function getActiveCard() {
    const cards = getAllCards();
    return cards.find((c) => !c.hidden) || document.querySelector('[data-wb-study-card]') || null;
  }

  function revealCard(card) {
    if (!card) return;
    const back = card.querySelector('[data-wb-back]');
    const form = card.querySelector('[data-wb-review-form]');
    if (back) back.hidden = false;
    if (form) form.hidden = false;
  }

  function resetCard(card) {
    if (!card) return;
    const back = card.querySelector('[data-wb-back]');
    const form = card.querySelector('[data-wb-review-form]');
    if (back) back.hidden = true;
    if (form) form.hidden = true;
  }

  function updateDeckProgress() {
    const deck = document.querySelector('[data-wb-study-deck]');
    if (!deck) return;
    const cards = getAllCards();
    const prog = deck.querySelector('[data-wb-deck-progress]');
    if (!cards.length) {
      deck.textContent = 'Đã hoàn thành tất cả thẻ trong phiên học!';
      return;
    }
    const activeIdx = Math.max(0, cards.findIndex((c) => !c.hidden));
    if (prog) prog.textContent = `Thẻ ${activeIdx + 1} / ${cards.length}`;
  }

  function stepDeck(delta) {
    const cards = getAllCards();
    if (cards.length < 2) return;
    const currentIdx = Math.max(0, cards.findIndex((c) => !c.hidden));
    const nextIdx = (currentIdx + delta + cards.length) % cards.length;
    cards[currentIdx].hidden = true;
    resetCard(cards[currentIdx]);
    cards[nextIdx].hidden = false;
    resetCard(cards[nextIdx]);
    updateDeckProgress();
  }

  // Keyboard controls for Flashcard Studio (Space = reveal, Arrows = prev/next, 1-4 = grade)
  const KEY_TO_GRADE = { '1': '1', '2': '2', '3': '4', '4': '5' };
  document.addEventListener('keydown', (ev) => {
    const tag = (ev.target && ev.target.tagName || '').toUpperCase();
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (ev.target && ev.target.isContentEditable)) return;
    const card = getActiveCard();
    if (!card) return;

    if (ev.code === 'Space' || ev.key === ' ') {
      if (typeof ev.preventDefault === 'function') ev.preventDefault();
      revealCard(card);
      return;
    }
    if (ev.key === 'ArrowRight') {
      if (typeof ev.preventDefault === 'function') ev.preventDefault();
      stepDeck(1);
      return;
    }
    if (ev.key === 'ArrowLeft') {
      if (typeof ev.preventDefault === 'function') ev.preventDefault();
      stepDeck(-1);
      return;
    }
    const gradeVal = KEY_TO_GRADE[ev.key];
    if (gradeVal) {
      const btn = card.querySelector(`[data-wb-grade="${gradeVal}"]`);
      if (btn && typeof btn.click === 'function') {
        if (typeof ev.preventDefault === 'function') ev.preventDefault();
        btn.click();
      }
    }
  });

  // Touch swipe controls for mobile Flashcards
  let touchStartX = null;
  document.addEventListener('touchstart', (ev) => {
    const card = ev.target && ev.target.closest ? ev.target.closest('[data-wb-study-card]') : null;
    if (!card) return;
    const t = ev.changedTouches && ev.changedTouches[0];
    if (t) touchStartX = t.screenX;
  });

  document.addEventListener('touchend', (ev) => {
    if (touchStartX === null) return;
    const card = ev.target && ev.target.closest ? ev.target.closest('[data-wb-study-card]') : null;
    const t = ev.changedTouches && ev.changedTouches[0];
    const startX = touchStartX;
    touchStartX = null;
    if (!card || !t) return;
    const dx = t.screenX - startX;
    if (Math.abs(dx) >= 50) {
      stepDeck(dx < 0 ? 1 : -1);
    }
  });

  // Live Word & Character Counter for Writing exercises (CJK / Latin / Cyrillic)
  document.addEventListener('input', (ev) => {
    const ta = ev.target && ev.target.closest ? ev.target.closest('textarea[data-wb-counter]') : null;
    if (!ta) return;
    const out = document.getElementById(ta.getAttribute('data-wb-counter'));
    if (!out) return;
    const text = ta.value.trim();
    const words = text ? text.split(/\s+/).length : 0;
    const cjk = (text.match(/[\u4e00-\u9fff]/g) || []).length;
    out.textContent = `Số từ: ${words} · Hán tự: ${cjk} · Tổng ký tự: ${text.length}`;
  });

  // Form submissions: Auth Gate interception + API submission
  document.addEventListener('submit', async (ev) => {
    const authForm = ev.target && ev.target.closest ? ev.target.closest('form[data-auth-intent]') : null;
    if (authForm && document.body.getAttribute('data-wb-authenticated') !== 'true') {
      ev.preventDefault();
      const action = authForm.getAttribute('action') || (window.location ? window.location.pathname : '/');
      const fd = new FormData(authForm);
      const params = new URLSearchParams();
      for (const [k, v] of fd.entries()) {
        if (String(v).trim()) params.set(k, String(v).trim());
      }
      const nextTarget = params.toString() ? `${action}?${params.toString()}` : action;
      openAuthGate(nextTarget, authForm.getAttribute('data-auth-intent'));
      return;
    }

    const form = ev.target && ev.target.closest ? ev.target.closest('form[data-api-endpoint]') : null;
    if (!form) return;
    ev.preventDefault();
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
      statusBox.textContent = 'Đang xử lý yêu cầu...';
    }

    const { status, data } = await apiRequest(endpoint, payload, method);
    if (status === 401) {
      const msg = 'Bạn cần đăng nhập tài khoản thành viên để sử dụng tính năng này.';
      if (statusBox) {
        statusBox.className = 'wb-alert wb-alert-warn';
        statusBox.textContent = msg;
      }
      openAuthGate(window.location ? window.location.href : '/', 'api.auth_required');
      showToast(msg, true);
      return;
    }

    if (status >= 200 && status < 300 && data.ok) {
      if (statusBox) {
        statusBox.className = 'wb-alert wb-alert-ok';
        statusBox.textContent = data.message || 'Thao tác thành công.';
      }
      showToast(data.message || 'Đã lưu thành công.');

      // Flashcard SM-2 review form: remove card ONLY after server confirms!
      if (form.hasAttribute('data-wb-review-form')) {
        const card = form.closest('[data-wb-study-card]');
        if (card) card.remove();
        const remaining = getAllCards();
        if (remaining.length) {
          remaining[0].hidden = false;
          resetCard(remaining[0]);
          updateDeckProgress();
        } else {
          const deck = document.querySelector('[data-wb-study-deck]');
          if (deck) deck.textContent = 'Đã hoàn thành phiên ôn tập Flashcard!';
        }
        return;
      }

      const targetRedirect = redirectTo || data.redirectTo;
      if (targetRedirect) {
        window.location.href = targetRedirect;
      } else if (form.getAttribute('data-reload-on-success') === 'true') {
        window.location.reload();
      } else if (form.hasAttribute('data-render-json')) {
        const out = document.getElementById(form.getAttribute('data-render-json'));
        if (out) {
          if (data.resultId) {
            window.location.assign('/practice/results/' + encodeURIComponent(data.resultId));
          } else if (data.output) {
            const heading = document.createElement('h3');
            heading.textContent = data.system?.nameVi || 'Kết quả phân tích';
            const values = document.createElement('pre');
            values.style.whiteSpace = 'pre-wrap';
            values.textContent = JSON.stringify(data.output, null, 2);
            out.replaceChildren(heading, values);
          } else {
            out.textContent = data.message || 'Đã lưu.';
          }
        }
      }
    } else {
      const errMsg = data?.error?.message || data?.error || 'Không thể thực hiện yêu cầu.';
      if (statusBox) {
        statusBox.className = 'wb-alert wb-alert-error';
        statusBox.textContent = errMsg;
      }
      showToast(errMsg, true);
    }
  });

  // ---- Local MediaRecorder (Honest Self-Review — Zero Fake ASR) ----
  let activeRecorder = null;
  let activeStream = null;
  let recordedChunks = [];
  let recordRequestToken = 0;

  function stopTracks(stream) {
    if (!stream || typeof stream.getTracks !== 'function') return;
    stream.getTracks().forEach((t) => {
      if (t && typeof t.stop === 'function') t.stop();
    });
  }

  document.addEventListener('click', async (ev) => {
    const target = ev.target;
    if (!target || typeof target.closest !== 'function') return;

    // Close Auth Gate dialog
    if (target.closest('[data-wb-auth-gate-close]')) {
      closeAuthGate();
      return;
    }

    // Intercept Portal login links to ensure locale & safe return_to are attached
    const loginLink = target.closest('a[href^="/login"]');
    if (loginLink && document.body.getAttribute('data-wb-authenticated') !== 'true') {
      const href = loginLink.getAttribute('href') || PORTAL_LOGIN;
      try {
        const origin = (window.location && window.location.origin && window.location.origin !== 'null') ? window.location.origin : MAIN_ORIGIN;
        const parsed = new URL(href, origin);
        parsed.searchParams.set('next', safeReturnUrl(parsed.searchParams.get('next') || (window.location ? window.location.href : MAIN_ORIGIN + '/')));
        parsed.searchParams.set('locale', currentLocale());
        loginLink.setAttribute('href', parsed.pathname + parsed.search);
      } catch {}
    }

    // Mobile Drawer Toggle
    const menuBtn = target.closest('[data-wb-menu-toggle]');
    if (menuBtn) {
      const nav = document.getElementById('wb-main-nav');
      if (nav && nav.classList) nav.classList.toggle('open');
      return;
    }

    // Flashcard reveal / nav / shuffle / restart / grade
    const revealBtn = target.closest('[data-wb-reveal]');
    if (revealBtn) {
      revealCard(revealBtn.closest('[data-wb-study-card]'));
      return;
    }
    if (target.closest('[data-wb-deck-prev]')) {
      stepDeck(-1);
      return;
    }
    if (target.closest('[data-wb-deck-next]')) {
      stepDeck(1);
      return;
    }
    if (target.closest('[data-wb-deck-restart]')) {
      const cards = getAllCards();
      cards.forEach((c, i) => {
        c.hidden = i > 0;
        resetCard(c);
      });
      updateDeckProgress();
      return;
    }
    if (target.closest('[data-wb-deck-shuffle]')) {
      const deck = document.querySelector('[data-wb-study-deck]');
      const cards = getAllCards();
      if (deck && cards.length > 1) {
        for (let i = cards.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [cards[i], cards[j]] = [cards[j], cards[i]];
        }
        cards.forEach((c, i) => {
          deck.appendChild(c);
          c.hidden = i > 0;
          resetCard(c);
        });
        updateDeckProgress();
      }
      return;
    }

    const gradeBtn = target.closest('[data-wb-grade]');
    if (gradeBtn) {
      const card = gradeBtn.closest('[data-wb-study-card]');
      const form = card && card.querySelector('[data-wb-review-form]');
      if (form) {
        const qInput = form.querySelector('[name=quality]');
        if (qInput) qInput.value = gradeBtn.getAttribute('data-wb-grade') || '4';
        if (typeof form.requestSubmit === 'function') form.requestSubmit();
      }
      return;
    }

    // Web Speech API Reference Pronunciation (authenticated only)
    const ttsBtn = target.closest('[data-wb-tts]');
    if (ttsBtn) {
      if (document.body.getAttribute('data-wb-authenticated') !== 'true') {
        openAuthGate(window.location ? window.location.href : '/', 'audio.tts');
        return;
      }
      if (!('speechSynthesis' in window)) {
        showToast('Trình duyệt không hỗ trợ đọc mẫu Web Speech.', true);
        return;
      }
      const text = ttsBtn.getAttribute('data-wb-tts') || '';
      const langMap = { zh: 'zh-CN', en: 'en-US' };
      const u = new SpeechSynthesisUtterance(text);
      u.lang = langMap[ttsBtn.getAttribute('data-wb-lang')] || 'en-US';
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
      return;
    }

    // Local MediaRecorder: Retry / Cancel
    const retryBtn = target.closest('[data-wb-record-retry]');
    if (retryBtn) {
      recordRequestToken += 1;
      const scope = retryBtn.closest('.wb-recorder-studio,.wb-pronunciation-lab') || document;
      const audio = scope.querySelector('audio');
      const statusEl = scope.querySelector('[data-wb-record-status]');
      const toggleBtn = scope.querySelector('[data-wb-record-toggle]');
      if (activeRecorder && activeRecorder.state === 'recording') {
        try { activeRecorder.stop(); } catch {}
      }
      stopTracks(activeStream);
      activeStream = null;
      activeRecorder = null;
      if (audio) {
        audio.hidden = true;
        audio.src = '';
      }
      if (toggleBtn) toggleBtn.textContent = 'Ghi âm';
      if (statusEl) statusEl.textContent = 'Đã hủy bản ghi. Sẵn sàng ghi lại.';
      return;
    }

    // Local MediaRecorder: Start / Stop
    const recBtn = target.closest('[data-wb-record-toggle]');
    if (recBtn) {
      const scope = recBtn.closest('.wb-recorder-studio,.wb-pronunciation-lab') || document;
      const outAudio = scope.querySelector('audio') || document.getElementById('wb-local-playback');
      const statusEl = scope.querySelector('[data-wb-record-status]');

      if (activeRecorder && activeRecorder.state === 'recording') {
        activeRecorder.stop();
        recBtn.textContent = 'Ghi âm';
        return;
      }

      if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== 'function' || typeof MediaRecorder === 'undefined') {
        if (statusEl) statusEl.textContent = 'Trình duyệt hoặc thiết bị hiện không hỗ trợ ghi âm.';
        return;
      }

      const myToken = ++recordRequestToken;
      if (statusEl) statusEl.textContent = 'Đang xin quyền truy cập Microphone...';
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (myToken !== recordRequestToken) {
          stopTracks(stream);
          return;
        }
        activeStream = stream;
        recordedChunks = [];
        activeRecorder = new MediaRecorder(stream);
        activeRecorder.ondataavailable = (e) => {
          if (e && e.data && e.data.size > 0) recordedChunks.push(e.data);
        };
        activeRecorder.onstop = () => {
          stopTracks(stream);
          activeStream = null;
          const blob = new Blob(recordedChunks, { type: activeRecorder?.mimeType || 'audio/webm' });
          const blobUrl = (URL && typeof URL.createObjectURL === 'function') ? URL.createObjectURL(blob) : 'blob:wordbridge-local-recording';
          if (outAudio) {
            outAudio.src = blobUrl;
            outAudio.hidden = false;
            if (outAudio.style) outAudio.style.display = 'block';
          }
          if (statusEl) statusEl.textContent = 'Đã lưu bản ghi âm cục bộ để tự nghe lại (không tạo điểm phát âm giả).';
        };
        activeRecorder.start();
        recBtn.textContent = 'Dừng ghi âm';
        if (statusEl) statusEl.textContent = 'Đang ghi âm...';
      } catch (err) {
        const errName = err && err.name;
        if (errName === 'NotAllowedError') {
          if (statusEl) statusEl.textContent = 'Bạn đã từ chối quyền Microphone. Vui lòng cấp quyền để ghi âm.';
        } else if (errName === 'NotFoundError') {
          if (statusEl) statusEl.textContent = 'Không tìm thấy Microphone khả dụng trên thiết bị này.';
        } else {
          if (statusEl) statusEl.textContent = 'Không thể khởi động Microphone.';
        }
      }
      return;
    }

    // 1-Click SSO Launcher
    const ssoBtn = target.closest('[data-wb-sso-launch]');
    if (ssoBtn) {
      const targetApp = ssoBtn.getAttribute('data-wb-sso-launch');
      const { status, data } = await apiRequest('/api/v1/sso/reader/issue', { target: targetApp });
      if (status === 401) {
        openAuthGate(window.location ? window.location.href : '/', 'sso.launch');
        return;
      }
      if (data.ok && data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        showToast(data?.error?.message || 'Thư viện đọc đã tích hợp trực tiếp tại /reader.', true);
      }
      return;
    }

    // Logout
    const logoutBtn = target.closest('[data-wb-logout]');
    if (logoutBtn) {
      ev.preventDefault();
      await apiRequest('/api/v1/auth/logout', {});
      window.location.href = '/';
      return;
    }

    // 1-Click Save Vocabulary (general or specialized)
    const saveVocabBtn = target.closest('[data-save-vocab]');
    if (saveVocabBtn) {
      const entryId = saveVocabBtn.getAttribute('data-save-vocab');
      const { status, data } = await apiRequest('/api/v1/vocabulary/notebook', { entryId });
      if (status === 401) {
        openAuthGate(window.location ? window.location.href : '/', 'vocabulary.save');
        return;
      }
      saveVocabBtn.textContent = status < 300 && data.ok ? 'Đã lưu Sổ từ' : (data?.error?.message || 'Lỗi');
      return;
    }

    // Delete Vocabulary item or Set
    const delVocabBtn = target.closest('[data-delete-vocab]');
    if (delVocabBtn) {
      const id = delVocabBtn.getAttribute('data-delete-vocab');
      const { status, data } = await apiRequest(`/api/v1/vocabulary/notebook/${encodeURIComponent(id)}`, null, 'DELETE');
      if (status >= 200 && status < 300 && data.ok) {
        const card = delVocabBtn.closest('.wb-card');
        if (card) card.remove();
        showToast('Đã xóa mục từ khỏi sổ cá nhân.');
      }
      return;
    }
    const delSetBtn = target.closest('[data-delete-set]');
    if (delSetBtn) {
      const id = delSetBtn.getAttribute('data-delete-set');
      const { status, data } = await apiRequest(`/api/v1/vocabulary/sets/${encodeURIComponent(id)}`, null, 'DELETE');
      if (status >= 200 && status < 300 && data.ok) {
        window.location.reload();
      }
      return;
    }

    // HTML5 Audio Player Controls
    const player = target.closest('[data-wb-audio]');
    if (player) {
      const audio = player.querySelector('audio');
      const statusEl = player.querySelector('[data-audio-status]');
      const actionBtn = target.closest('[data-audio-action]');
      const speedBtn = target.closest('[data-audio-speed]');
      const segBtn = target.closest('[data-audio-segment-start]');
      if (audio && speedBtn) {
        const rate = Number(speedBtn.getAttribute('data-audio-speed')) || 1.0;
        audio.playbackRate = rate;
        const label = player.querySelector('[data-speed-label]');
        if (label) label.textContent = `${rate}x`;
      }
      if (audio && actionBtn) {
        const act = actionBtn.getAttribute('data-audio-action');
        if (act === 'play') audio.play().catch(() => { if (statusEl) statusEl.textContent = 'Tệp audio chính thức đang chờ tải lên kho lưu trữ R2.'; });
        if (act === 'pause') audio.pause();
        if (act === 'stop') { audio.pause(); audio.currentTime = 0; }
        if (act === 'replay') { audio.currentTime = 0; audio.play().catch(() => {}); }
        if (act === 'back') audio.currentTime = Math.max(0, audio.currentTime - 5);
        if (act === 'forward') audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + 5);
        if (act === 'loop') {
          audio.loop = !audio.loop;
          actionBtn.textContent = audio.loop ? 'Lặp: Bật' : 'Lặp: Tắt';
        }
      }
      if (audio && segBtn) {
        const startSec = Number(segBtn.getAttribute('data-audio-segment-start')) / 1000;
        audio.currentTime = startSec;
        audio.play().catch(() => { if (statusEl) statusEl.textContent = 'Đang chọn đoạn nghe (chờ tệp audio R2).'; });
      }
    }
  });
})();

document.addEventListener('click', async event => {
  const button = event.target.closest('[data-passkey]');
  if (!button) return;
  const status = document.querySelector('[data-passkey-status]');
  const action = button.dataset.passkey;
  const register = action === 'register';
  button.disabled = true;
  async function post(step, body) {
    const res = await fetch('/api/v1/account/passkeys/' + action + '/' + step, {
      method:'POST', headers:{'Content-Type':'application/json','X-CSRF-Token':document.querySelector('meta[name="wb-csrf-token"]')?.content || ''},
      body:JSON.stringify(body)});
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || 'Vui lòng thử lại.');
    return data;
  }
  try {
    const parser = register ? window.PublicKeyCredential?.parseCreationOptionsFromJSON : window.PublicKeyCredential?.parseRequestOptionsFromJSON;
    if (!parser) throw new Error('Vui lòng cập nhật trình duyệt để sử dụng Passkey.');
    const options = await post('options', {});
    const publicKey = parser.call(PublicKeyCredential, options.publicKey);
    const key = register ? await navigator.credentials.create({publicKey}) : await navigator.credentials.get({publicKey});
    await post('verify', {challengeId:options.challengeId, credential:key.toJSON()});
    location.assign(register ? '/account/passkeys' : '/my-learning');
  } catch (error) {
    status.textContent = error.name === 'NotAllowedError' ? 'Thao tác đã hủy hoặc hết thời gian.' : error.message;
  } finally { button.disabled = false; }
});


// Password visibility toggle on /login and /register
document.addEventListener('click', (ev) => {
  const btn = ev.target && ev.target.closest ? ev.target.closest('[data-wb-toggle-pw]') : null;
  if (!btn) return;
  const targetId = btn.getAttribute('data-wb-toggle-pw');
  const input = document.getElementById(targetId);
  if (!input) return;
  input.type = input.type === 'password' ? 'text' : 'password';
});
