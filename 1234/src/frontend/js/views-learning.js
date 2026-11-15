'use strict';

(function (WB) {
  // KHÁM PHÁ 05 NGÔN NGỮ (/ngon-ngu - PHẦN 08.1, sát thiết kế trang 1 & 9 của 42.pdf)
  WB.registerView('/ngon-ngu', async function (root) {
    const res = await WB.api('/api/learning/languages');
    const langs = res.languages || [];

    root.innerHTML = `
      <section class="wb-hero">
        <div class="wb-container wb-hero-grid">
          <div>
            <div style="font-size:13px;color:var(--wb-text-muted);margin-bottom:6px;">Trang chủ &gt; Học ngoại ngữ &gt; Khám phá ngôn ngữ</div>
            <h1 class="wb-hero-title">Khám phá ngôn ngữ</h1>
            <p style="color:var(--wb-text-muted);font-size:15px;">
              Tìm hiểu, lựa chọn và bắt đầu thực hành một trong 05 ngôn ngữ đang được hỗ trợ trên WORD BRIDGE. Mỗi ngôn ngữ có hệ chữ viết, phiên âm, dữ liệu và quy tắc ngữ pháp riêng biệt.
            </p>
          </div>
          <div>
            <img src="/assets/hero-globe-illustration.svg" alt="Khám phá 5 ngôn ngữ WORD BRIDGE" style="width:100%;max-width:440px;border-radius:14px;" />
          </div>
        </div>
      </section>

      <div class="wb-container wb-section">
        <h2 class="wb-section-title">Các ngôn ngữ hiện có (${langs.length})</h2>
        <div class="wb-grid-5">
          ${langs.map(l => `
            <div class="wb-card" style="display:flex;flex-direction:column;justify-content:space-between;">
              <div>
                <span class="wb-badge wb-badge-teal">${l.code.toUpperCase()}</span>
                <h3 style="margin:10px 0 4px 0;color:var(--wb-deep-teal);">${l.name_vi}</h3>
                <div style="font-size:16px;font-weight:700;color:var(--wb-vermilion);margin-bottom:6px;font-family:${l.font_family};">${l.native_name}</div>
                <p style="font-size:12.5px;color:var(--wb-text-muted);margin:0 0 10px 0;"><strong>Hệ chữ & Phiên âm:</strong> ${l.script_system}</p>
                <p style="font-size:12.5px;color:var(--wb-text-muted);margin:0 0 12px 0;">${l.description}</p>
                <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:14px;">
                  ${(l.levels || []).map(lv => `<span class="wb-badge wb-badge-ivory">${lv}</span>`).join('')}
                </div>
              </div>
              <button type="button" class="wb-btn wb-btn-primary wb-choose-lang-btn" data-lang="${l.code}" style="width:100%;">
                Thực hành ${l.name_vi} →
              </button>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    root.querySelectorAll('.wb-choose-lang-btn').forEach(btn => {
      btn.onclick = () => {
        WB.state.selectedLanguage = btn.getAttribute('data-lang');
        WB.navigate('/hoc-tap');
      };
    });
  });

  // TRUNG TÂM HỌC TẬP & 4 CÔNG CỤ THỰC HÀNH CỐT LÕI (/hoc-tap, /hoc-tap/nghe, /hoc-tap/tu-vung, /hoc-tap/sap-xep-cau, /hoc-tap/doc-hieu)
  const renderLearningHub = async function (root, pathname) {
    const toolMap = {
      '/hoc-tap': null,
      '/hoc-tap/nghe': 'listening',
      '/hoc-tap/tu-vung': 'vocabulary',
      '/hoc-tap/sap-xep-cau': 'sentence',
      '/hoc-tap/doc-hieu': 'reading'
    };
    const activeTool = toolMap[pathname] || null;
    const selectedLang = WB.state.selectedLanguage || 'en';

    const langsRes = await WB.api('/api/learning/languages');
    const langs = langsRes.languages || [];
    const exRes = await WB.api(`/api/learning/exercises?language_code=${encodeURIComponent(selectedLang)}${activeTool ? `&tool_type=${activeTool}` : ''}`);
    const exercises = exRes.exercises || [];

    root.innerHTML = `
      <div class="wb-container wb-section">
        <div class="wb-workspace-layout">
          <aside class="wb-sidebar">
            <div style="font-weight:800;color:var(--wb-deep-teal);margin-bottom:10px;">TRUNG TÂM HỌC TẬP</div>
            <ul class="wb-sidebar-menu">
              <li><a class="wb-sidebar-link ${pathname === '/hoc-tap' ? 'active' : ''}" data-nav="/hoc-tap">🎯 Tổng quan Thực hành</a></li>
              <li><a class="wb-sidebar-link ${pathname === '/hoc-tap/nghe' ? 'active' : ''}" data-nav="/hoc-tap/nghe">🎧 A. Nghe điền từ</a></li>
              <li><a class="wb-sidebar-link ${pathname === '/hoc-tap/tu-vung' ? 'active' : ''}" data-nav="/hoc-tap/tu-vung">🗂️ B. Từ vựng & Flashcard</a></li>
              <li><a class="wb-sidebar-link ${pathname === '/hoc-tap/sap-xep-cau' ? 'active' : ''}" data-nav="/hoc-tap/sap-xep-cau">🧩 C. Sắp xếp câu</a></li>
              <li><a class="wb-sidebar-link ${pathname === '/hoc-tap/doc-hieu' ? 'active' : ''}" data-nav="/hoc-tap/doc-hieu">📖 D. Đọc hiểu</a></li>
              <li><a class="wb-sidebar-link" data-nav="/tien-do">📊 Theo dõi Tiến độ</a></li>
              <li><a class="wb-sidebar-link" data-nav="/tai-nguyen">📚 Thư viện Tài nguyên</a></li>
            </ul>
          </aside>

          <div>
            <!-- Thanh chọn 05 ngôn ngữ -->
            <div class="wb-card" style="margin-bottom:18px;">
              <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
                <div>
                  <span class="wb-badge wb-badge-teal">WORD BRIDGE – LEARNING & PRACTICE</span>
                  <h1 style="margin:6px 0 4px 0;color:var(--wb-deep-teal);">Thực hành Ngoại ngữ Chủ động (Không phải LMS bán khóa học video)</h1>
                </div>
                <div style="display:flex;gap:8px;flex-wrap:wrap;">
                  ${langs.map(l => `
                    <button type="button" class="wb-btn ${l.code === selectedLang ? 'wb-btn-primary' : 'wb-btn-outline'} wb-lang-switch" data-lang="${l.code}">
                      ${l.name_vi} (${l.native_name})
                    </button>
                  `).join('')}
                </div>
              </div>
            </div>

            <!-- Danh sách bài thực hành tương tác thật -->
            <div id="wbExercisesContainer">
              ${exercises.map(ex => {
                const c = ex.content || {};
                let interactionHtml = '';
                if (ex.tool_type === 'listening') {
                  interactionHtml = `
                    <div style="background:var(--wb-bg-soft);padding:14px;border-radius:10px;margin-bottom:12px;">
                      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:10px;">
                        <button type="button" class="wb-btn wb-btn-primary wb-tts-play" data-text="${c.audio_text || ''}" data-lang="${ex.language_code}">🔊 Phát âm thanh</button>
                        <button type="button" class="wb-btn wb-btn-outline wb-tts-stop">⏸ Tạm dừng</button>
                        <label style="font-size:13px;">Tốc độ:
                          <select class="wb-select wb-tts-speed" style="width:auto;display:inline-block;padding:4px 8px;">
                            <option value="0.75">0.75x (Chậm)</option>
                            <option value="1" selected>1.0x (Chuẩn)</option>
                            <option value="1.25">1.25x (Nhanh)</option>
                          </select>
                        </label>
                      </div>
                      <p style="font-size:16px;font-weight:700;margin:0 0 6px 0;">Câu khuyết từ: <span style="color:var(--wb-deep-teal);">${c.transcript_masked || ''}</span></p>
                      <div style="font-size:13px;color:var(--wb-text-muted);">Phiên âm hỗ trợ: ${c.pinyin || c.ipa || c.romaji || c.translit || ''}</div>
                    </div>
                    <div class="wb-form-group">
                      <label class="wb-label">Điền từ còn thiếu vào chỗ trống:</label>
                      <input type="text" class="wb-input wb-ex-input" data-ex-id="${ex.id}" placeholder="Nhập từ còn thiếu..." />
                    </div>
                  `;
                } else if (ex.tool_type === 'vocabulary') {
                  const cards = c.cards || [];
                  interactionHtml = `
                    <div class="wb-grid-3" style="margin-bottom:14px;">
                      ${cards.map(card => `
                        <div class="wb-card" style="background:var(--wb-bg-soft);cursor:pointer;" onclick="this.querySelector('.wb-flash-back').style.display = this.querySelector('.wb-flash-back').style.display === 'none' ? 'block' : 'none'">
                          <span class="wb-badge wb-badge-teal">Nhấn để lật thẻ Flashcard</span>
                          <h4 style="font-size:20px;margin:8px 0 4px 0;color:var(--wb-deep-teal);">${card.term}</h4>
                          <div style="font-size:13px;color:var(--wb-vermilion);font-weight:600;">[${card.pronunciation}]</div>
                          <div class="wb-flash-back" style="margin-top:8px;padding-top:8px;border-top:1px dashed var(--wb-border);">
                            <div><strong>Nghĩa:</strong> ${card.meaning_vi}</div>
                            <div style="font-size:12.5px;color:var(--wb-text-muted);margin-top:4px;"><em>Ví dụ:</em> ${card.example}</div>
                          </div>
                        </div>
                      `).join('')}
                    </div>
                    <div class="wb-form-group">
                      <label class="wb-label">Kiểm tra trí nhớ: ${c.quiz_question || ''}</label>
                      <select class="wb-select wb-ex-input" data-ex-id="${ex.id}">
                        <option value="">-- Chọn đáp án đúng --</option>
                        ${(c.quiz_options || []).map(opt => `<option value="${opt}">${opt}</option>`).join('')}
                      </select>
                    </div>
                  `;
                } else if (ex.tool_type === 'sentence') {
                  const tokens = c.shuffled_tokens || [];
                  interactionHtml = `
                    <p style="font-size:13.5px;color:var(--wb-text-muted);margin:0 0 8px 0;"><strong>Nghĩa câu:</strong> ${c.translation_vi || ''}</p>
                    <div style="margin-bottom:10px;display:flex;gap:8px;flex-wrap:wrap;">
                      ${tokens.map(tok => `
                        <button type="button" class="wb-btn wb-btn-outline wb-token-pick" data-ex-id="${ex.id}" data-token="${tok}">${tok}</button>
                      `).join('')}
                      <button type="button" class="wb-btn wb-btn-outline wb-token-reset" data-ex-id="${ex.id}">↺ Xóa sắp xếp lại</button>
                    </div>
                    <div class="wb-form-group">
                      <label class="wb-label">Câu đã ghép của bạn (Bấm chọn từ ở trên hoặc nhập cách nhau bằng dấu phẩy):</label>
                      <input type="text" class="wb-input wb-ex-input" id="wbSentInput_${ex.id}" data-ex-id="${ex.id}" placeholder="Bấm chọn các từ theo đúng thứ tự..." />
                    </div>
                  `;
                } else if (ex.tool_type === 'reading') {
                  const q0 = (c.questions && c.questions[0]) || { q: '', options: [] };
                  interactionHtml = `
                    <div style="background:var(--wb-bg-soft);padding:16px;border-radius:10px;margin-bottom:12px;font-size:15.5px;line-height:1.7;">
                      ${c.passage || ''}
                    </div>
                    <div class="wb-form-group">
                      <label class="wb-label">${q0.q}</label>
                      <select class="wb-select wb-ex-input" data-ex-id="${ex.id}">
                        <option value="">-- Chọn câu trả lời --</option>
                        ${(q0.options || []).map(opt => `<option value="${opt}">${opt}</option>`).join('')}
                      </select>
                    </div>
                  `;
                }

                return `
                  <div class="wb-card" style="margin-bottom:18px;">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                      <span class="wb-badge wb-badge-teal">${ex.tool_type.toUpperCase()} • ${ex.level} • ${ex.topic}</span>
                      <span class="wb-badge wb-badge-ivory">+${ex.points} điểm</span>
                    </div>
                    <h3 style="margin:0 0 6px 0;color:var(--wb-deep-teal);">${ex.title}</h3>
                    <p style="font-size:13.5px;color:var(--wb-text-muted);margin:0 0 12px 0;">${ex.instructions}</p>
                    ${interactionHtml}
                    <div style="display:flex;gap:10px;flex-wrap:wrap;">
                      <button type="button" class="wb-btn wb-btn-accent wb-submit-ex-btn" data-ex-id="${ex.id}" data-tool="${ex.tool_type}">✓ Kiểm tra & Lưu kết quả</button>
                      <button type="button" class="wb-btn wb-btn-outline wb-ai-hint-btn" data-ex-id="${ex.id}" data-lang="${ex.language_code}">🤖 Nhờ Trợ lý AI giải thích ngữ cảnh</button>
                    </div>
                    <div id="wbExFeedback_${ex.id}" style="margin-top:12px;display:none;padding:12px;border-radius:8px;background:var(--wb-bg-mint);font-size:13.5px;"></div>
                  </div>
                `;
              }).join('')}
            </div>

            <!-- Tạo Bộ từ vựng cá nhân (PHẦN 08.2.B) -->
            <div class="wb-card">
              <h3 style="margin:0 0 10px 0;color:var(--wb-deep-teal);">+ Tạo Bộ Từ Vựng Cá Nhân Riêng</h3>
              <form id="wbCreateVocabSetForm">
                <div class="wb-grid-3">
                  <input type="text" class="wb-input" name="title" required placeholder="Tên bộ từ (VD: Từ vựng HSK 2 của tôi)" />
                  <input type="text" class="wb-input" name="term" required placeholder="Từ mới (VD: 努力)" />
                  <input type="text" class="wb-input" name="meaning_vi" required placeholder="Nghĩa Tiếng Việt (VD: Nỗ lực)" />
                </div>
                <div style="margin-top:10px;">
                  <button type="submit" class="wb-btn wb-btn-primary">Lưu vào Bộ Từ Vựng Cá Nhân</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    `;

    root.querySelectorAll('.wb-lang-switch').forEach(btn => {
      btn.onclick = () => {
        WB.state.selectedLanguage = btn.getAttribute('data-lang');
        renderLearningHub(root, pathname);
      };
    });

    // Phát âm thanh bằng Web Speech API (hoặc thông báo hỗ trợ)
    root.querySelectorAll('.wb-tts-play').forEach(btn => {
      btn.onclick = () => {
        const text = btn.getAttribute('data-text');
        const lang = btn.getAttribute('data-lang');
        const speedSel = btn.parentElement.querySelector('.wb-tts-speed');
        const rate = speedSel ? parseFloat(speedSel.value) : 1.0;
        if ('speechSynthesis' in window && text) {
          window.speechSynthesis.cancel();
          const utter = new SpeechSynthesisUtterance(text);
          const langMap = { zh: 'zh-CN', en: 'en-US', ko: 'ko-KR', ja: 'ja-JP', ru: 'ru-RU' };
          utter.lang = langMap[lang] || 'en-US';
          utter.rate = rate;
          window.speechSynthesis.speak(utter);
          WB.toast(`Đang phát âm thanh (${rate}x): "${text}"`);
        } else {
          WB.toast(`Nội dung phát âm: "${text}"`);
        }
      };
    });

    root.querySelectorAll('.wb-tts-stop').forEach(btn => {
      btn.onclick = () => {
        if ('speechSynthesis' in window) window.speechSynthesis.cancel();
        WB.toast('Đã tạm dừng phát âm thanh.');
      };
    });

    // Chọn từ trong bài Sắp xếp câu
    root.querySelectorAll('.wb-token-pick').forEach(btn => {
      btn.onclick = () => {
        const exId = btn.getAttribute('data-ex-id');
        const tok = btn.getAttribute('data-token');
        const inp = document.getElementById(`wbSentInput_${exId}`);
        if (inp) {
          const cur = inp.value ? inp.value.split(' | ') : [];
          cur.push(tok);
          inp.value = cur.join(' | ');
        }
      };
    });

    root.querySelectorAll('.wb-token-reset').forEach(btn => {
      btn.onclick = () => {
        const exId = btn.getAttribute('data-ex-id');
        const inp = document.getElementById(`wbSentInput_${exId}`);
        if (inp) inp.value = '';
      };
    });

    // Nộp bài thực hành & Chấm điểm thực tế
    root.querySelectorAll('.wb-submit-ex-btn').forEach(btn => {
      btn.onclick = async () => {
        if (!WB.state.user) {
          WB.toast('Vui lòng đăng nhập để hệ thống chấm điểm và lưu vào lịch sử Tiến độ của bạn.', 'error');
          return WB.navigate('/dang-nhap');
        }
        const exId = btn.getAttribute('data-ex-id');
        const tool = btn.getAttribute('data-tool');
        const inp = root.querySelector(`.wb-ex-input[data-ex-id="${exId}"]`);
        const rawVal = inp ? inp.value.trim() : '';
        let submission = rawVal;
        if (tool === 'listening') submission = { blank: rawVal };
        else if (tool === 'vocabulary') submission = { selected_option: rawVal };
        else if (tool === 'sentence') {
          const arr = rawVal.includes(' | ') ? rawVal.split(' | ') : rawVal.split(',').map(s => s.trim()).filter(Boolean);
          submission = { ordered_tokens: arr };
        } else if (tool === 'reading') {
          submission = { answers: [rawVal] };
        }

        try {
          const res = await WB.api('/api/learning/attempts', {
            method: 'POST',
            body: { exercise_id: exId, submission, duration_seconds: 20 }
          });
          const fb = document.getElementById(`wbExFeedback_${exId}`);
          if (fb) {
            fb.style.display = 'block';
            fb.innerHTML = `<strong>${res.result.is_correct ? '✅ Chính xác!' : '❌ Chưa chính xác'}</strong> — ${res.result.feedback}`;
          }
          WB.toast(res.result.feedback, res.result.is_correct ? 'success' : 'info');
        } catch (err) {
          WB.toast(err.message, 'error');
        }
      };
    });

    // Gọi Trợ lý AI ngữ cảnh
    root.querySelectorAll('.wb-ai-hint-btn').forEach(btn => {
      btn.onclick = async () => {
        if (!WB.state.user) {
          WB.toast('Vui lòng đăng nhập để sử dụng Trợ lý AI ngữ cảnh.', 'error');
          return WB.navigate('/dang-nhap');
        }
        const exId = btn.getAttribute('data-ex-id');
        const lang = btn.getAttribute('data-lang');
        try {
          const res = await WB.api('/api/learning/ai-assist', {
            method: 'POST',
            body: {
              exercise_id: exId,
              language_code: lang,
              assist_type: 'context',
              question: 'Giải thích ngữ cảnh và gợi ý cấu trúc cho bài thực hành này'
            }
          });
          const fb = document.getElementById(`wbExFeedback_${exId}`);
          if (fb) {
            fb.style.display = 'block';
            fb.innerHTML = `<strong>🤖 ${res.response}</strong><br/><span style="font-size:12px;color:var(--wb-text-muted);">Lượt dùng AI hôm nay: ${res.quota.used_today}/${res.quota.daily_limit}</span>`;
          }
        } catch (err) {
          WB.toast(err.message, 'error');
        }
      };
    });

    const vocabForm = document.getElementById('wbCreateVocabSetForm');
    if (vocabForm) {
      vocabForm.onsubmit = async e => {
        e.preventDefault();
        if (!WB.state.user) return WB.navigate('/dang-nhap');
        const fd = new FormData(vocabForm);
        try {
          await WB.api('/api/learning/vocabulary-sets', {
            method: 'POST',
            body: {
              language_code: selectedLang,
              title: fd.get('title'),
              items: [{
                term: fd.get('term'),
                pronunciation: selectedLang,
                meaning_vi: fd.get('meaning_vi'),
                example_sentence: fd.get('term')
              }]
            }
          });
          vocabForm.reset();
          WB.toast('Đã lưu bộ từ vựng cá nhân thành công!', 'success');
        } catch (err) {
          WB.toast(err.message, 'error');
        }
      };
    }
  };

  WB.registerView('/hoc-tap', renderLearningHub);
  WB.registerView('/hoc-tap/nghe', renderLearningHub);
  WB.registerView('/hoc-tap/tu-vung', renderLearningHub);
  WB.registerView('/hoc-tap/sap-xep-cau', renderLearningHub);
  WB.registerView('/hoc-tap/doc-hieu', renderLearningHub);

  // THEO DÕI TIẾN ĐỘ CÁ NHÂN (/tien-do - PHẦN 09, dữ liệu thực tế + biểu đồ SVG)
  WB.registerView('/tien-do', async function (root) {
    if (!WB.state.user) {
      WB.toast('Vui lòng đăng nhập để xem Theo dõi tiến độ.');
      return WB.navigate('/dang-nhap');
    }
    const res = await WB.api('/api/progress');
    const dash = res.dashboard;

    root.innerHTML = `
      <div class="wb-container wb-section">
        <div class="wb-card" style="margin-bottom:20px;">
          <span class="wb-badge wb-badge-teal">THEO DÕI TIẾN ĐỘ & PHÁT TRIỂN CÁ NHÂN (DỮ LIỆU THỰC TẾ 100%)</span>
          <h1 style="margin:8px 0;color:var(--wb-deep-teal);">Tiến độ & Kết quả Rèn luyện Ngoại ngữ</h1>
          <p style="margin:0;font-size:14px;color:var(--wb-text-muted);">${dash.practice_recommendation}</p>
        </div>

        <div class="wb-grid-3" style="margin-bottom:20px;">
          <div class="wb-card">
            <div style="font-size:13px;color:var(--wb-text-muted);">Tổng lượt thực hành đã lưu</div>
            <div style="font-size:32px;font-weight:800;color:var(--wb-deep-teal);">${dash.total_attempts}</div>
          </div>
          <div class="wb-card">
            <div style="font-size:13px;color:var(--wb-text-muted);">Tổng điểm tích lũy thực tế</div>
            <div style="font-size:32px;font-weight:800;color:var(--wb-vermilion);">${dash.total_score_earned}</div>
          </div>
          <div class="wb-card">
            <div style="font-size:13px;color:var(--wb-text-muted);">Từ vựng cá nhân đang ôn</div>
            <div style="font-size:32px;font-weight:800;color:var(--wb-deep-teal);">${dash.vocabulary_reviewing_count}</div>
          </div>
        </div>

        <div class="wb-grid-2">
          <div class="wb-card">
            <h3 style="margin:0 0 14px 0;color:var(--wb-deep-teal);">Biểu đồ Tiến độ theo Từng Kỹ năng</h3>
            ${dash.skill_breakdown.map(s => `
              <div style="margin-bottom:14px;">
                <div style="display:flex;justify-content:space-between;font-size:13.5px;font-weight:700;margin-bottom:4px;">
                  <span>Kỹ năng: ${s.skill.toUpperCase()} (${s.attempts_count} lượt)</span>
                  <span>${s.accuracy_percent}% (${s.total_score}/${s.max_score} điểm)</span>
                </div>
                <div style="height:12px;background:#E5EFEF;border-radius:999px;overflow:hidden;">
                  <div style="height:100%;width:${s.accuracy_percent}%;background:var(--wb-deep-teal);"></div>
                </div>
              </div>
            `).join('')}
          </div>

          <div class="wb-card">
            <h3 style="margin:0 0 14px 0;color:var(--wb-deep-teal);">Lịch sử Thực hành Gần đây (${dash.recent_attempts.length})</h3>
            ${dash.recent_attempts.length === 0 ? `<p style="color:var(--wb-text-muted);font-size:13.5px;">Bạn chưa có lượt làm bài nào. Hãy vào <a href="/hoc-tap" data-nav="/hoc-tap">Trung tâm học tập</a> để làm bài đầu tiên!</p>` : `
              <div class="wb-table-wrap">
                <table class="wb-table">
                  <thead>
                    <tr><th>Bài tập</th><th>Công cụ</th><th>Điểm</th><th>Thời gian</th></tr>
                  </thead>
                  <tbody>
                    ${dash.recent_attempts.map(a => `
                      <tr>
                        <td><strong>${a.exercise_title || a.exercise_id}</strong></td>
                        <td>${a.tool_type}</td>
                        <td><span class="wb-badge ${a.is_correct ? 'wb-badge-success' : 'wb-badge-red'}">${a.score}/${a.max_score}</span></td>
                        <td style="font-size:12px;">${a.created_at.slice(0, 16).replace('T', ' ')}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            `}
          </div>
        </div>
      </div>
    `;
  });

  // THƯ VIỆN TÀI NGUYÊN & HỌC LIỆU (/tai-nguyen - PHẦN 10)
  WB.registerView('/tai-nguyen', async function (root) {
    const res = await WB.api('/api/resources');
    const resources = res.resources || [];

    root.innerHTML = `
      <div class="wb-container wb-section">
        <div class="wb-card" style="margin-bottom:20px;">
          <span class="wb-badge wb-badge-teal">THƯ VIỆN TÀI NGUYÊN & HỌC LIỆU DÙNG CHUNG (/tai-nguyen)</span>
          <h1 style="margin:8px 0;color:var(--wb-deep-teal);">Kho Tài nguyên Ngoại ngữ & Học liệu Cộng đồng</h1>
          <p style="font-size:13.5px;color:var(--wb-text-muted);margin:0;">
            Hỗ trợ phân quyền 06 mức (Công khai, Cá nhân, Nhóm, Tổ chức, Thành viên, Theo gói Plus), kiểm tra định dạng tệp thực tế (Magic Bytes) và tiếp nhận khiếu nại bản quyền.
          </p>
        </div>

        <div class="wb-grid-2">
          <div class="wb-card">
            <h3 style="margin:0 0 12px 0;color:var(--wb-deep-teal);">Tải lên Học liệu Mới</h3>
            <form id="wbUploadResourceForm">
              <div class="wb-form-group">
                <label class="wb-label">Tiêu đề tài liệu <span class="req">*</span></label>
                <input type="text" class="wb-input" name="title" required placeholder="VD: Tổng hợp 50 cấu trúc câu Tiếng Nhật N5" />
              </div>
              <div class="wb-grid-2">
                <div class="wb-form-group">
                  <label class="wb-label">Ngôn ngữ</label>
                  <select class="wb-select" name="language_code">
                    <option value="en">Tiếng Anh</option>
                    <option value="zh">Tiếng Trung</option>
                    <option value="ko">Tiếng Hàn</option>
                    <option value="ja">Tiếng Nhật</option>
                    <option value="ru">Tiếng Nga</option>
                  </select>
                </div>
                <div class="wb-form-group">
                  <label class="wb-label">Phân quyền truy cập</label>
                  <select class="wb-select" name="access_scope">
                    <option value="public">Công khai</option>
                    <option value="personal">Cá nhân (Riêng tư)</option>
                    <option value="group">Nhóm</option>
                    <option value="organization">Tổ chức</option>
                    <option value="member">Thành viên đã đăng nhập</option>
                    <option value="plus_only">Theo gói dịch vụ Plus</option>
                  </select>
                </div>
              </div>
              <div class="wb-form-group">
                <label class="wb-label">Mô tả học liệu</label>
                <textarea class="wb-textarea" name="description" rows="2" placeholder="Mô tả ngắn gọn nội dung và nguồn bản quyền..."></textarea>
              </div>
              <button type="submit" class="wb-btn wb-btn-primary">Tải lên Kho Tài nguyên</button>
            </form>
          </div>

          <div class="wb-card">
            <h3 style="margin:0 0 12px 0;color:var(--wb-deep-teal);">Danh mục Tài nguyên Hiện có (${resources.length})</h3>
            ${resources.length === 0 ? `<p style="color:var(--wb-text-muted);font-size:13.5px;">Chưa có tài liệu nào được tải lên.</p>` : `
              <div class="wb-table-wrap">
                <table class="wb-table">
                  <thead>
                    <tr><th>Tiêu đề</th><th>Ngôn ngữ</th><th>Phạm vi</th><th>Báo cáo</th></tr>
                  </thead>
                  <tbody>
                    ${resources.map(r => `
                      <tr>
                        <td><strong>${r.title}</strong><br/><span style="font-size:12px;color:var(--wb-text-muted);">${r.description || ''}</span></td>
                        <td><span class="wb-badge wb-badge-teal">${r.language_code.toUpperCase()}</span></td>
                        <td>${r.access_scope}</td>
                        <td><button type="button" class="wb-btn wb-btn-outline wb-report-res-btn" data-id="${r.id}" style="padding:4px 8px;font-size:12px;">Khiếu nại</button></td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            `}
          </div>
        </div>
      </div>
    `;

    const upForm = document.getElementById('wbUploadResourceForm');
    if (upForm) {
      upForm.onsubmit = async e => {
        e.preventDefault();
        if (!WB.state.user) return WB.navigate('/dang-nhap');
        const fd = new FormData(upForm);
        try {
          await WB.api('/api/resources', { method: 'POST', body: Object.fromEntries(fd.entries()) });
          WB.toast('Đã tải lên học liệu thành công!', 'success');
          WB.navigate('/tai-nguyen', false);
        } catch (err) {
          WB.toast(err.message, 'error');
        }
      };
    }

    root.querySelectorAll('.wb-report-res-btn').forEach(btn => {
      btn.onclick = async () => {
        if (!WB.state.user) return WB.navigate('/dang-nhap');
        try {
          await WB.api('/api/resources/report', {
            method: 'POST',
            body: { resource_id: btn.getAttribute('data-id'), report_type: 'copyright', reason: 'Yêu cầu kiểm tra bản quyền học liệu' }
          });
          WB.toast('Đã gửi báo cáo bản quyền tới bộ phận kiểm duyệt.', 'success');
        } catch (err) {
          WB.toast(err.message, 'error');
        }
      };
    });
  });
})(window.WB);
