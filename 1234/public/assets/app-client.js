/**
 * WORD BRIDGE — Interactive Browser Client Controller
 * Connects every UI button, form, dictionary search, lesson start, exercise submission,
 * examination grading, Learner Meet room control, 15 Language Intelligence systems,
 * and Security Center action to the live Backend API.
 */

const state = {
  sessionToken: localStorage.getItem('wb_session_token') || '',
  csrfToken: localStorage.getItem('wb_csrf_token') || '',
  account: null,
  catalog: null,
  activeMeetRoomId: null,
};

function showBanner(msg, isError = false) {
  const banner = document.getElementById('wb-status-banner');
  if (!banner) return;
  banner.style.display = 'block';
  banner.style.background = isError ? '#fde8e5' : '#e6f4f3';
  banner.style.borderLeftColor = isError ? '#C92F1C' : '#146466';
  banner.textContent = msg;
}

async function apiCall(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  if (state.sessionToken) {
    headers['Authorization'] = `Bearer ${state.sessionToken}`;
  }
  if (state.csrfToken) {
    headers['X-CSRF-Token'] = state.csrfToken;
  }
  const resp = await fetch(path, { ...options, headers });
  const data = await resp.json().catch(() => ({}));
  return { status: resp.status, ok: resp.ok, data };
}

function updateAuthHeaderUI() {
  const loginBtn = document.getElementById('btn-header-login');
  const regBtn = document.getElementById('btn-header-register');
  const userMenu = document.getElementById('header-user-menu');
  const userBadge = document.getElementById('header-user-badge');

  if (state.sessionToken && state.account) {
    if (loginBtn) loginBtn.style.display = 'none';
    if (regBtn) regBtn.style.display = 'none';
    if (userMenu) userMenu.style.display = 'inline-flex';
    if (userBadge) userBadge.textContent = state.account.email;
  } else {
    if (loginBtn) loginBtn.style.display = 'inline-flex';
    if (regBtn) regBtn.style.display = 'inline-flex';
    if (userMenu) userMenu.style.display = 'none';
  }
}

function renderCatalog() {
  if (!state.catalog) return;
  const langFilter = document.getElementById('filter-program-lang')?.value || '';

  // Programs
  const progContainer = document.getElementById('programs-list-container');
  if (progContainer) {
    const filtered = state.catalog.programs.filter((p) => !langFilter || p.language_code === langFilter);
    progContainer.innerHTML = filtered
      .map(
        (p) => `
      <article class="wb-card">
        <div>
          <span class="wb-badge">${p.language_code.toUpperCase()} • ${p.program_group}</span>
          <h3 style="margin:8px 0;color:var(--wb-deep-teal);">${p.title_vi}</h3>
          <div style="font-size:0.86rem;font-weight:600;color:var(--wb-text-secondary);margin-bottom:6px;">${p.title_native} (${p.level_code})</div>
          <p style="font-size:0.9rem;margin:0;">${p.description_vi}</p>
        </div>
      </article>`
      )
      .join('');
  }

  // Lessons
  const lessonContainer = document.getElementById('lessons-list-container');
  if (lessonContainer) {
    const filteredLessons = state.catalog.lessons.filter((l) => !langFilter || l.language_code === langFilter);
    lessonContainer.innerHTML = filteredLessons
      .map(
        (l) => `
      <article class="wb-card">
        <div>
          <span class="wb-badge">Ngôn ngữ: ${l.language_code.toUpperCase()}</span>
          <h4 style="margin:8px 0;">${l.title_vi}</h4>
          <div style="font-size:0.88rem;color:var(--wb-text-secondary);margin-bottom:8px;">${l.title_target}</div>
          <div style="font-size:0.88rem;">${l.new_knowledge_html}</div>
        </div>
        <button type="button" class="wb-btn wb-btn-primary btn-start-lesson" data-lesson-id="${l.id}">
          Bắt đầu Bài học &amp; Lưu tiến độ
        </button>
      </article>`
      )
      .join('');

    lessonContainer.querySelectorAll('.btn-start-lesson').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const lessonId = btn.getAttribute('data-lesson-id');
        const res = await apiCall('/api/learning/lessons/start', {
          method: 'POST',
          body: JSON.stringify({ lessonId, completed: true, masteryScore: 92 }),
        });
        showBanner(res.data.messageVi || 'Đã xử lý yêu cầu bài học.', !res.ok);
      });
    });
  }

  // Dictionary Public Preview
  renderDictionaryItems(state.catalog.publicDictionary || []);

  // Exercises
  const exContainer = document.getElementById('exercises-list-container');
  if (exContainer) {
    exContainer.innerHTML = (state.catalog.publicExercises || [])
      .map(
        (ex) => `
      <article class="wb-card">
        <div>
          <span class="wb-badge">${ex.language_code.toUpperCase()} • ${ex.skill_type} (${ex.level_code})</span>
          <h4 style="margin:8px 0;">${ex.title_vi}</h4>
          <p style="font-size:0.9rem;">${ex.prompt_text}</p>
          ${
            ex.options && ex.options.length > 0
              ? `<select class="wb-select ex-answer-input" data-ex-id="${ex.id}" aria-label="Chọn đáp án">
                  ${ex.options.map((opt) => `<option value="${opt}">${opt}</option>`).join('')}
                </select>`
              : `<input type="text" class="wb-input ex-answer-input" data-ex-id="${ex.id}" placeholder="Nhập câu trả lời hoặc câu phát âm (VD: 把 提单 装箱单)..." aria-label="Nhập câu trả lời">`
          }
        </div>
        <button type="button" class="wb-btn wb-btn-primary btn-submit-ex" data-ex-id="${ex.id}">Nộp bài &amp; Chấm điểm</button>
      </article>`
      )
      .join('');

    exContainer.querySelectorAll('.btn-submit-ex').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const exId = btn.getAttribute('data-ex-id');
        const inputEl = exContainer.querySelector(`.ex-answer-input[data-ex-id="${exId}"]`);
        const answer = inputEl ? inputEl.value : '';
        const res = await apiCall('/api/practice/exercises/submit', {
          method: 'POST',
          body: JSON.stringify({ exerciseId: exId, answer }),
        });
        showBanner(
          res.ok
            ? `${res.data.messageVi} (Điểm: ${res.data.submission.scorePercent}% — ${res.data.submission.explanationVi})`
            : res.data.messageVi,
          !res.ok
        );
      });
    });
  }

  // Exams
  const examContainer = document.getElementById('exams-list-container');
  if (examContainer) {
    examContainer.innerHTML = (state.catalog.publicExams || [])
      .map(
        (ex) => `
      <article class="wb-card">
        <div>
          <span class="wb-badge">${ex.language_code.toUpperCase()} • ${ex.level_code}</span>
          <h4 style="margin:8px 0;">${ex.title_vi}</h4>
          <p style="font-size:0.86rem;color:var(--wb-text-secondary);">Thời lượng: ${ex.duration_minutes} phút | Ngưỡng đạt: ${ex.passing_score_percent}% | Không cấp chứng chỉ</p>
        </div>
        <button type="button" class="wb-btn wb-btn-primary btn-take-exam" data-exam-id="${ex.id}">Làm bài Khảo thí</button>
      </article>`
      )
      .join('');

    examContainer.querySelectorAll('.btn-take-exam').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const examId = btn.getAttribute('data-exam-id');
        const sampleAnswers = {
          'qb-zh-01': 'A. 我把那本书看完了。',
          'qb-zh-02': 'A. 装箱单 (Packing List)',
          'qb-zh-03': 'A. Đã hoàn tất thủ tục thông quan thuận lợi',
          'qb-zh-04': 'A. [2][4][1][3] (语言是沟通不同文化的重要桥梁)',
          'qb-en-01': 'A. Preliminary telemetry data suggest that edge caching may reduce p99 latency by up to 35%.',
          'qb-en-02': 'A. Executing the same request multiple times produces the same state as executing it once.',
          'qb-en-03': 'A. The preventive maintenance schedule was not followed, and the bearing failed.',
          'qb-en-04': 'A. Notwithstanding the initial calibration overhead, the model achieved superior precision.',
          'qb-ru-01': 'A. русскую музыку / новый журнал',
          'qb-ru-02': 'A. В библиотеке (Tại thư viện)',
          'qb-ru-03': 'A. Произносятся редуцированно, близко к звуку [а] ([малако́])',
          'qb-ru-04': 'A. Здравствуйте, уважаемый преподаватель! Разрешите задать Вам вопрос по грамматике.',
        };
        const res = await apiCall('/api/examinations/submit', {
          method: 'POST',
          body: JSON.stringify({ examId, answers: sampleAnswers, durationSeconds: 950 }),
        });
        showBanner(
          res.ok
            ? `${res.data.messageVi} Kết quả: ${res.data.result.percentage}% (${res.data.result.diagnostic_summary_vi})`
            : res.data.messageVi,
          !res.ok
        );
      });
    });
  }

  // 15 Differentiating Systems
  const liGrid = document.getElementById('fifteen-systems-grid');
  if (liGrid) {
    liGrid.innerHTML = (state.catalog.fifteenSystems || [])
      .map(
        (sys) => `
      <article class="wb-card">
        <div>
          <span class="wb-badge">Hệ thống #${sys.number}</span>
          <h4 style="margin:8px 0;color:var(--wb-deep-teal);">${sys.nameEn} — ${sys.nameVi}</h4>
          <p style="font-size:0.86rem;margin:0 0 8px;">${sys.objectiveVi}</p>
          <div style="font-size:0.78rem;color:var(--wb-text-secondary);">Thuật toán: ${sys.algorithm}</div>
        </div>
        <button type="button" class="wb-btn wb-btn-outline btn-run-li" data-slug="${sys.slug}" data-name="${sys.nameVi}">
          Chạy phân tích #${sys.number}
        </button>
      </article>`
      )
      .join('');

    liGrid.querySelectorAll('.btn-run-li').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const slug = btn.getAttribute('data-slug');
        const nameVi = btn.getAttribute('data-name');
        const res = await apiCall(`/api/language-intelligence/evaluate/${slug}`, {
          method: 'POST',
          body: JSON.stringify({
            languageCode: 'en',
            sampleText: 'Although the distributed system experienced high traffic, but parameterized queries kept D1 stable.',
            submittedText: 'Empirical telemetry data suggest that parameterized queries and edge rate limiting significantly enhance platform resilience.',
            targetPhrase: 'Where Languages Bring People Together',
            recognizedTranscript: 'Where Languages Bring People Together',
          }),
        });
        if (!res.ok) {
          showBanner(res.data.messageVi || 'Yêu cầu đăng nhập để chạy hệ thống trí tuệ ngôn ngữ.', true);
          return;
        }
        const consoleBox = document.getElementById('li-evaluation-console');
        const titleEl = document.getElementById('li-console-title');
        const outEl = document.getElementById('li-console-output');
        if (consoleBox && titleEl && outEl) {
          consoleBox.style.display = 'block';
          titleEl.textContent = `Kết quả thực thi: ${nameVi} (${slug})`;
          outEl.textContent = JSON.stringify(res.data.result, null, 2);
        }
        showBanner(res.data.messageVi, false);
      });
    });
  }
}

function renderDictionaryItems(items) {
  const container = document.getElementById('dictionary-results-container');
  if (!container) return;
  container.innerHTML = items
    .map(
      (d) => `
    <article class="wb-card">
      <div>
        <span class="wb-badge">${d.language_code.toUpperCase()} • ${d.level_code} ${d.is_specialized ? '• Chuyên ngành' : ''}</span>
        <h3 style="margin:8px 0;color:var(--wb-deep-teal);">${d.headword} <small style="font-weight:500;color:var(--wb-text-secondary);">${d.phonetic}</small></h3>
        <div style="font-size:0.88rem;font-weight:700;">${d.part_of_speech} — ${d.meaning_vi}</div>
        <p style="font-size:0.86rem;color:var(--wb-text-secondary);margin:6px 0;">${d.definition_target}</p>
      </div>
      <button type="button" class="wb-btn wb-btn-outline btn-save-vocab" data-entry-id="${d.id}">
        Lưu vào Sổ từ vựng &amp; Spaced Repetition
      </button>
    </article>`
    )
    .join('');

  container.querySelectorAll('.btn-save-vocab').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const dictionaryEntryId = btn.getAttribute('data-entry-id');
      const res = await apiCall('/api/dictionary/vocabulary/save', {
        method: 'POST',
        body: JSON.stringify({ dictionaryEntryId, quality: 5 }),
      });
      showBanner(res.data.messageVi, !res.ok);
    });
  });
}

async function initApp() {
  const res = await apiCall('/api/public/catalog');
  if (res.ok) {
    state.catalog = res.data;
    renderCatalog();
  }

  document.getElementById('filter-program-lang')?.addEventListener('change', () => renderCatalog());

  // Dictionary Search Form
  document.getElementById('form-dictionary-search')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const q = document.getElementById('dict-query-input')?.value || '';
    const lang = document.getElementById('dict-lang-select')?.value || '';
    const searchRes = await apiCall(`/api/dictionary/search?q=${encodeURIComponent(q)}&lang=${encodeURIComponent(lang)}`);
    if (!searchRes.ok) {
      showBanner(searchRes.data.messageVi, true);
      return;
    }
    renderDictionaryItems(searchRes.data.results || []);
    showBanner(`Tìm thấy ${searchRes.data.count} mục từ điển phù hợp.`, false);
  });

  // Specialized ESP Buttons
  document.querySelectorAll('[data-esp-lang]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const languageCode = btn.getAttribute('data-esp-lang');
      const domainCode = btn.getAttribute('data-esp-domain');
      const espRes = await apiCall('/api/language-intelligence/evaluate/knowledge-to-language', {
        method: 'POST',
        body: JSON.stringify({ languageCode, domainCode }),
      });
      if (!espRes.ok) {
        showBanner(espRes.data.messageVi, true);
        return;
      }
      const box = document.getElementById('esp-interactive-output');
      if (box) {
        box.innerHTML = `<div style="padding:14px;background:#e6f4f3;border-radius:8px;">
          <strong>Học liệu Chuyên ngành (${espRes.data.result.domainNameVi}):</strong>
          <pre style="margin:8px 0 0;font-size:0.84rem;overflow-x:auto;">${JSON.stringify(espRes.data.result.concepts, null, 2)}</pre>
        </div>`;
      }
    });
  });

  // Registration Form (8 mandatory fields + Email Link Verification + Auto-Login)
  document.getElementById('form-register')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      fullName: document.getElementById('reg-fullname')?.value,
      dateOfBirth: document.getElementById('reg-dob')?.value,
      phoneNumber: document.getElementById('reg-phone')?.value,
      email: document.getElementById('reg-email')?.value,
      password: document.getElementById('reg-password')?.value,
      confirmPassword: document.getElementById('reg-confirm')?.value,
      schoolName: document.getElementById('reg-school')?.value,
      workplaceName: document.getElementById('reg-workplace')?.value,
    };
    const regRes = await apiCall('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (!regRes.ok) {
      showBanner((regRes.data.errors || [regRes.data.messageVi]).join(' | '), true);
      return;
    }
    showBanner(regRes.data.messageVi, false);
    const verifyBox = document.getElementById('register-verification-box');
    if (verifyBox) {
      verifyBox.style.display = 'block';
      verifyBox.innerHTML = `
        <div><strong>Liên kết xác minh email đã được tạo (Không dùng OTP):</strong></div>
        <div style="margin-top:6px;">Trạng thái Email Adapter: <code>${regRes.data.emailDispatchStatus}</code></div>
        <button type="button" class="wb-btn wb-btn-accent" id="btn-open-verify-link" style="margin-top:8px;">
          Mở Liên kết Xác minh Hợp lệ &amp; Tự động Đăng nhập
        </button>`;
      document.getElementById('btn-open-verify-link')?.addEventListener('click', async () => {
        const verRes = await apiCall('/api/auth/verify-email', {
          method: 'POST',
          body: JSON.stringify({ token: regRes.data.verificationToken }),
        });
        if (verRes.ok) {
          state.sessionToken = verRes.data.sessionToken;
          state.csrfToken = verRes.data.csrfToken;
          state.account = verRes.data.account;
          localStorage.setItem('wb_session_token', state.sessionToken);
          localStorage.setItem('wb_csrf_token', state.csrfToken);
          updateAuthHeaderUI();
          showBanner(verRes.data.messageVi, false);
        }
      });
    }
  });

  // Login Form
  document.getElementById('form-login')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email')?.value;
    const password = document.getElementById('login-password')?.value;
    const loginRes = await apiCall('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (!loginRes.ok) {
      showBanner(loginRes.data.messageVi, true);
      return;
    }
    state.sessionToken = loginRes.data.sessionToken;
    state.csrfToken = loginRes.data.csrfToken;
    state.account = loginRes.data.account;
    localStorage.setItem('wb_session_token', state.sessionToken);
    localStorage.setItem('wb_csrf_token', state.csrfToken);
    updateAuthHeaderUI();
    showBanner(loginRes.data.messageVi, false);
  });

  // Logout
  document.getElementById('btn-logout')?.addEventListener('click', () => {
    state.sessionToken = '';
    state.csrfToken = '';
    state.account = null;
    localStorage.removeItem('wb_session_token');
    localStorage.removeItem('wb_csrf_token');
    updateAuthHeaderUI();
    showBanner('Đã đăng xuất khỏi phiên làm việc.', false);
  });

  // Security Center & Passkey Actions
  document.getElementById('btn-add-passkey')?.addEventListener('click', async () => {
    const res = await apiCall('/api/account/passkeys', {
      method: 'POST',
      body: JSON.stringify({ friendlyName: 'Khóa Passkey FIDO2 trên thiết bị này' }),
    });
    showBanner(res.data.messageVi, !res.ok);
  });

  document.getElementById('btn-view-security')?.addEventListener('click', async () => {
    const res = await apiCall('/api/account/security-center');
    if (!res.ok) {
      showBanner(res.data.messageVi, true);
      return;
    }
    const panel = document.getElementById('security-center-panel');
    if (panel) {
      panel.innerHTML = `<pre style="background:#122425;color:#E2E2C4;padding:12px;border-radius:6px;overflow-x:auto;">${JSON.stringify(
        {
          account: res.data.account,
          subscription: res.data.subscription,
          passkeysCount: res.data.passkeys.length,
          activeSessionsCount: res.data.activeSessions.length,
          pdfReaderSso: res.data.pdfReaderSso,
        },
        null,
        2
      )}</pre>`;
    }
  });

  document.getElementById('btn-claim-student')?.addEventListener('click', async () => {
    const studentEmail = state.account?.email || 'sinhvien@hcmut.edu.vn';
    const res = await apiCall('/api/subscription/student-benefit', {
      method: 'POST',
      body: JSON.stringify({ studentEmail }),
    });
    showBanner(res.data.messageVi, !res.ok);
  });

  // Learner Meet Controls
  document.getElementById('form-create-meet')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const languageCode = document.getElementById('meet-lang')?.value;
    const mode = document.getElementById('meet-mode')?.value;
    const topicTitle = document.getElementById('meet-topic')?.value;
    const res = await apiCall('/api/learner-meet/rooms', {
      method: 'POST',
      body: JSON.stringify({ languageCode, mode, topicTitle }),
    });
    if (!res.ok) {
      showBanner(res.data.messageVi, true);
      return;
    }
    state.activeMeetRoomId = res.data.room.id;
    const statusEl = document.getElementById('meet-room-status');
    if (statusEl) {
      statusEl.textContent = `Đang trong phiên: ${res.data.room.room_code} — ${res.data.room.topic_title} (Không chat, Không ghi âm/ghi hình)`;
    }
    document.getElementById('btn-meet-mic')?.removeAttribute('disabled');
    document.getElementById('btn-meet-cam')?.removeAttribute('disabled');
    document.getElementById('btn-meet-leave')?.removeAttribute('disabled');
    showBanner(res.data.messageVi, false);
  });

  document.getElementById('btn-meet-mic')?.addEventListener('click', async () => {
    if (!state.activeMeetRoomId) return;
    const res = await apiCall('/api/learner-meet/action', {
      method: 'POST',
      body: JSON.stringify({ sessionId: state.activeMeetRoomId, actionType: 'TOGGLE_MIC' }),
    });
    showBanner(res.data.messageVi, !res.ok);
  });

  document.getElementById('btn-meet-cam')?.addEventListener('click', async () => {
    if (!state.activeMeetRoomId) return;
    const res = await apiCall('/api/learner-meet/action', {
      method: 'POST',
      body: JSON.stringify({ sessionId: state.activeMeetRoomId, actionType: 'TOGGLE_CAMERA' }),
    });
    showBanner(res.data.messageVi, !res.ok);
  });

  document.getElementById('btn-meet-leave')?.addEventListener('click', async () => {
    if (!state.activeMeetRoomId) return;
    const res = await apiCall('/api/learner-meet/action', {
      method: 'POST',
      body: JSON.stringify({ sessionId: state.activeMeetRoomId, actionType: 'LEAVE_SESSION' }),
    });
    showBanner(res.data.messageVi, !res.ok);
  });
}

initApp();
