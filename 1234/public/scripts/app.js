/**
 * WORD BRIDGE V4.0 — Client Interactive Runtime (40 User App Features)
 * Responsive Mobile Drawer, Light/Dark & Font Size, Flashcard Flip, SM-2,
 * Web Speech Reference Audio, Local MediaRecorder, Writing Word/Char Counter,
 * WebAuthn Passkey, Toast Notifications & 1-Click SSO Launcher.
 */
(function () {
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
    });
    const data = await res.json().catch(() => ({ ok: false, error: { message: 'Lỗi phản hồi máy chủ.' } }));
    return { status: res.status, data };
  }

  // Feature 20: Live Word & Character Counter for Writing exercises (CJK / Latin / Cyrillic)
  document.addEventListener('input', (ev) => {
    const ta = ev.target.closest('textarea[data-wb-counter]');
    if (!ta) return;
    const out = document.getElementById(ta.getAttribute('data-wb-counter'));
    if (!out) return;
    const text = ta.value.trim();
    const words = text ? text.split(/\s+/).length : 0;
    const cjk = (text.match(/[\u4e00-\u9fff]/g) || []).length;
    out.textContent = `Số từ: ${words} · Hán tự: ${cjk} · Tổng ký tự: ${text.length}`;
  });

  // Form submissions (Public View -> Login-to-Use prompt on 401)
  document.addEventListener('submit', async (ev) => {
    const form = ev.target.closest('form[data-api-endpoint]');
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
        statusBox.innerHTML = `${msg} <a href="https://portal.wordbridge.io.vn/login?next=${encodeURIComponent(window.location.href)}" class="wb-btn wb-btn-primary wb-btn-sm" style="margin-left:8px;">Đăng nhập ngay</a>`;
      }
      showToast(msg, true);
      return;
    }

    if (status >= 200 && status < 300 && data.ok) {
      if (statusBox) {
        statusBox.className = 'wb-alert wb-alert-ok';
        statusBox.textContent = data.message || 'Thao tác thành công.';
      }
      showToast(data.message || 'Đã lưu thành công.');
      if (data.attemptId && form.hasAttribute('data-redirect-attempt')) {
        window.location.href = `/examination-attempts/${data.attemptId}`;
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
          out.innerHTML = `<div class="wb-card" style="border-left:4px solid var(--wb-aqua);"><h4 style="margin-top:0;color:var(--wb-teal);">Kết quả phân tích</h4><pre style="white-space:pre-wrap;margin:0;font-family:var(--wb-font-mono);font-size:0.84rem;">${JSON.stringify(data, null, 2)}</pre></div>`;
        }
      }
    } else if (statusBox) {
      const errMsg = data?.error?.message || data?.error || 'Không thể thực hiện yêu cầu.';
      statusBox.className = 'wb-alert wb-alert-error';
      statusBox.textContent = errMsg;
      showToast(errMsg, true);
    }
  });

  // Local MediaRecorder for Feature 14 (Self Read-Aloud Playback — No fake ASR scores)
  let activeRecorder = null;
  let recordedChunks = [];

  document.addEventListener('click', async (ev) => {
    // Feature 33: Mobile Drawer Toggle
    const menuBtn = ev.target.closest('[data-wb-menu-toggle]');
    if (menuBtn) {
      const nav = document.getElementById('wb-main-nav');
      if (nav) nav.classList.toggle('open');
      return;
    }

    // Feature 34: Light/Dark Mode & Font Scale
    const themeBtn = ev.target.closest('[data-wb-theme-toggle]');
    if (themeBtn) {
      const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('wb_theme', next);
      showToast(`Đã chuyển sang giao diện ${next === 'dark' ? 'Tối' : 'Sáng'}.`);
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
        showToast('Trình duyệt không hỗ trợ đọc mẫu Web Speech.', true);
        return;
      }
      const text = ttsBtn.getAttribute('data-wb-tts') || '';
      const langMap = { zh: 'zh-CN', en: 'en-US', ru: 'ru-RU' };
      const u = new SpeechSynthesisUtterance(text);
      u.lang = langMap[ttsBtn.getAttribute('data-wb-lang')] || 'en-US';
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
      showToast('Đang phát giọng tổng hợp trình duyệt (tham khảo).');
      return;
    }

    // Feature 14: Local Read-Aloud Recorder
    const recBtn = ev.target.closest('[data-wb-record-toggle]');
    if (recBtn) {
      const outAudio = document.getElementById('wb-local-playback');
      if (activeRecorder && activeRecorder.state === 'recording') {
        activeRecorder.stop();
        recBtn.textContent = 'Ghi âm tự luyện đọc';
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        recordedChunks = [];
        activeRecorder = new MediaRecorder(stream);
        activeRecorder.ondataavailable = (e) => { if (e.data.size > 0) recordedChunks.push(e.data); };
        activeRecorder.onstop = () => {
          stream.getTracks().forEach((t) => t.stop());
          const blob = new Blob(recordedChunks, { type: 'audio/webm' });
          if (outAudio) {
            outAudio.src = URL.createObjectURL(blob);
            outAudio.style.display = 'block';
          }
          showToast('Đã lưu bản ghi âm cục bộ để bạn tự nghe lại (không chấm điểm ASR giả).');
        };
        activeRecorder.start();
        recBtn.textContent = 'Dừng ghi âm';
      } catch {
        showToast('Cần cấp quyền Microphone để tự luyện đọc.', true);
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
        showToast(data?.error?.message || 'Cần cấu hình SSO secret tại quantri.wordbridge.io.vn.', true);
      }
      return;
    }

    // Logout
    const logoutBtn = ev.target.closest('[data-wb-logout]');
    if (logoutBtn) {
      ev.preventDefault();
      await apiRequest('/api/v1/auth/logout', {});
      window.location.href = '/';
      return;
    }

    // Feature 7: 1-Click Save Vocabulary
    const saveVocabBtn = ev.target.closest('[data-save-vocab]');
    if (saveVocabBtn) {
      const entryId = saveVocabBtn.getAttribute('data-save-vocab');
      const { status, data } = await apiRequest('/api/v1/vocabulary/notebook', { entryId });
      if (status === 401) {
        showToast('Vui lòng đăng nhập để lưu vào Sổ từ vựng.', true);
        return;
      }
      saveVocabBtn.textContent = status < 300 && data.ok ? 'Đã lưu Sổ từ' : (data?.error?.message || 'Lỗi');
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
        if (act === 'play') audio.play().catch(() => { if (statusEl) statusEl.textContent = 'Tệp audio chính thức đang chờ tải lên kho lưu trữ quantri.wordbridge.io.vn.'; });
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
        audio.play().catch(() => { if (statusEl) statusEl.textContent = 'Đang chọn câu để phát (chờ tệp audio tại quantri).'; });
      }
    }
  });
})();
