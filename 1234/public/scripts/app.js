/**
 * WORD BRIDGE — Client Interactive Runtime (V3.1)
 * - Auto-attaches X-CSRF-Token from <meta name="wb-csrf-token">
 * - Full HTML5 Audio Player controls (Play/Pause/Resume/Stop/Replay/Seek/Volume/0.75x-1.5x/Loop/Sentence-by-sentence)
 * - Explicit microphone consent for Read-Aloud & Learner Meet device check
 */

(function () {
  function getCsrfToken() {
    const meta = document.querySelector('meta[name="wb-csrf-token"]');
    return meta ? meta.getAttribute('content') || '' : '';
  }

  async function apiRequest(url, payload, method = 'POST') {
    const headers = { 'Content-Type': 'application/json' };
    const csrf = getCsrfToken();
    if (csrf) headers['X-CSRF-Token'] = csrf;
    const res = await fetch(url, {
      method,
      headers,
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({ ok: false, error: { message: 'Lỗi phản hồi máy chủ.' } }));
    return { status: res.status, data };
  }

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
      if (k.startsWith('answer_')) {
        answers[k.slice('answer_'.length)] = v;
      } else {
        payload[k] = v;
      }
    }
    if (Object.keys(answers).length > 0) payload.answers = answers;

    if (statusBox) {
      statusBox.className = 'wb-alert wb-alert-info';
      statusBox.textContent = 'Đang xử lý yêu cầu...';
    }

    const { status, data } = await apiRequest(endpoint, payload, method);
    if (status >= 200 && status < 300 && data.ok) {
      if (statusBox) {
        statusBox.className = 'wb-alert wb-alert-ok';
        statusBox.textContent = data.message || 'Thao tác thành công.';
      }
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
        if (out) out.textContent = JSON.stringify(data, null, 2);
      }
    } else if (statusBox) {
      statusBox.className = 'wb-alert wb-alert-error';
      statusBox.textContent = data?.error?.message || 'Không thể thực hiện yêu cầu.';
    }
  });

  // HTML5 Audio Player Controls
  document.addEventListener('click', async (ev) => {
    const logoutBtn = ev.target.closest('[data-wb-logout]');
    if (logoutBtn) {
      ev.preventDefault();
      await apiRequest('/api/v1/auth/logout', {});
      window.location.href = '/';
      return;
    }

    const saveVocabBtn = ev.target.closest('[data-save-vocab]');
    if (saveVocabBtn) {
      const entryId = saveVocabBtn.getAttribute('data-save-vocab');
      const { status, data } = await apiRequest('/api/v1/vocabulary/notebook', { entryId });
      saveVocabBtn.textContent = status < 300 && data.ok ? 'Đã lưu vào Sổ từ vựng' : (data?.error?.message || 'Cần đăng nhập');
      return;
    }

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
        if (act === 'play') audio.play().catch(() => { if (statusEl) statusEl.textContent = 'Tệp audio chính thức đang chờ tải lên R2 bucket `word`.'; });
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
        audio.play().catch(() => { if (statusEl) statusEl.textContent = 'Đang chọn câu để phát (chờ tệp audio R2 chính thức).'; });
      }
    }

    // Explicit microphone consent
    const micBtn = ev.target.closest('[data-wb-mic-check]');
    if (micBtn) {
      const out = document.getElementById('wb-mic-status');
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        if (out) out.textContent = 'Trình duyệt không hỗ trợ truy cập microphone.';
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((t) => t.stop());
        if (out) out.textContent = 'Đã cấp quyền microphone. Bạn có thể tự luyện đọc thành tiếng (lưu ý: chấm phát âm tự động đang ở trạng thái BLOCKED_UNCONFIGURED).';
      } catch {
        if (out) out.textContent = 'Quyền microphone chưa được cấp hoặc bị từ chối.';
      }
    }

    // Learner Meet explicit device check
    const devBtn = ev.target.closest('[data-wb-device-check]');
    if (devBtn) {
      const out = document.getElementById('wb-device-status');
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        if (out) out.textContent = 'Trình duyệt không hỗ trợ kiểm tra thiết bị âm thanh/hình ảnh.';
        return;
      }
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const mics = devices.filter((d) => d.kind === 'audioinput').length;
        const cams = devices.filter((d) => d.kind === 'videoinput').length;
        if (out) out.textContent = `Phát hiện ${mics} micro và ${cams} camera. Learner Meet không có chat, chia sẻ màn hình hay ghi hình.`;
      } catch {
        if (out) out.textContent = 'Không thể kiểm tra thiết bị lúc này.';
      }
    }
  });
})();
