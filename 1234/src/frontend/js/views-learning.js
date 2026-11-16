'use strict';

(function (WB) {
  // 1. KHÁM PHÁ 05 NGÔN NGỮ (/ngon-ngu)
  WB.registerView('/ngon-ngu', async function (root) {
    const res = await WB.api('/api/learning/languages');
    const langs = res.languages || [];

    root.innerHTML = `
      <section class="wb-hero">
        <div class="wb-container wb-hero-grid">
          <div>
            <div style="font-size:13px;color:var(--wb-text-muted);margin-bottom:6px;">Trang chủ &gt; Học ngoại ngữ &gt; Khám phá 05 ngôn ngữ</div>
            <h1 class="wb-hero-kicker" style="color:var(--wb-deep-teal);">Khám phá 05 Ngôn ngữ Trọng tâm</h1>
            <p style="color:var(--wb-text-muted);font-size:15px;">
              Tìm hiểu, lựa chọn và bắt đầu thực hành một trong năm ngoại ngữ trên WORD BRIDGE (Tiếng Trung, Tiếng Anh, Tiếng Hàn, Tiếng Nhật, Tiếng Nga). Ngôn ngữ bài thực hành được tách biệt hoàn toàn với ngôn ngữ hiển thị giao diện.
            </p>
          </div>
          <div>
            <img src="/assets/hero-globe-illustration.svg" alt="Khám phá 5 ngôn ngữ WORD BRIDGE" style="width:100%;max-width:440px;border-radius:14px;" />
          </div>
        </div>
      </section>

      <div class="wb-container wb-section">
        <h2 class="wb-section-title">Năm ngôn ngữ được hỗ trợ (${langs.length})</h2>
        <div class="wb-grid-5">
          ${langs.map(l => `
            <div class="wb-card" style="display:flex;flex-direction:column;justify-content:space-between;">
              <div>
                <span class="wb-badge wb-badge-teal">${l.code.toUpperCase()}</span>
                <h3 style="margin:10px 0 4px 0;color:var(--wb-deep-teal);">${l.name_vi}</h3>
                <div style="font-size:16px;font-weight:700;color:var(--wb-vermilion);margin-bottom:6px;font-family:${l.font_family};">${l.native_name}</div>
                <p style="font-size:12.5px;color:var(--wb-text-muted);margin:0 0 10px 0;"><strong>Hệ chữ &amp; Phiên âm:</strong> ${l.script_system}</p>
                <p style="font-size:12.5px;color:var(--wb-text-muted);margin:0 0 12px 0;">${l.description}</p>
                <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:14px;">
                  ${(l.levels || []).map(lv => `<span class="wb-badge wb-badge-ivory">${lv}</span>`).join('')}
                </div>
              </div>
              <div style="display:flex;flex-direction:column;gap:6px;">
                <button type="button" class="wb-btn wb-btn-primary wb-choose-lang-btn" data-lang="${l.code}" style="width:100%;">
                  <span>Thực hành ${l.name_vi}</span>
                  ${WB.icon('arrowRight', 15)}
                </button>
                <button type="button" class="wb-btn wb-btn-outline wb-assess-lang-btn" data-lang="${l.code}" style="width:100%;">
                  Kiểm tra trình độ ${l.name_vi}
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    root.querySelectorAll('.wb-choose-lang-btn').forEach(btn => {
      btn.onclick = () => {
        WB.state.selectedLanguage = btn.getAttribute('data-lang');
        WB.navigate('/hoc-tap?lang=' + encodeURIComponent(WB.state.selectedLanguage));
      };
    });

    root.querySelectorAll('.wb-assess-lang-btn').forEach(btn => {
      btn.onclick = () => {
        WB.state.selectedLanguage = btn.getAttribute('data-lang');
        WB.navigate('/hoc-tap/kiem-tra-trinh-do?lang=' + encodeURIComponent(WB.state.selectedLanguage));
      };
    });
  });

  // 2. KIỂM TRA TRÌNH ĐỘ ĐẦU VÀO & LỘ TRÌNH TỰ THỰC HÀNH (/hoc-tap/kiem-tra-trinh-do - PHẦN VII)
  WB.registerView('/hoc-tap/kiem-tra-trinh-do', async function (root, pathname, searchParams) {
    const langParam = searchParams?.get('lang') || WB.state.selectedLanguage || 'en';
    WB.state.selectedLanguage = langParam;

    const langsRes = await WB.api('/api/learning/languages');
    const langs = langsRes.languages || [];
    const placementData = await WB.api(`/api/learning/placement?language_code=${encodeURIComponent(langParam)}`);
    const questions = placementData.questions || [];
    let currentRoadmap = null;
    if (WB.state.user) {
      try {
        const rmRes = await WB.api(`/api/learning/roadmap?language_code=${encodeURIComponent(langParam)}`);
        currentRoadmap = rmRes.roadmap;
      } catch (_) {}
    }

    root.innerHTML = `
      <div class="wb-container wb-section">
        <div class="wb-card" style="margin-bottom:20px;">
          <span class="wb-badge wb-badge-teal">ĐÁNH GIÁ ĐẦU VÀO &amp; LỘ TRÌNH TỰ THỰC HÀNH (PHẦN VII)</span>
          <h1 style="margin:8px 0 6px 0;color:var(--wb-deep-teal);">Kiểm tra Trình độ &amp; Xây dựng Kế hoạch Tự thực hành Cá nhân</h1>
          <p style="font-size:13.5px;color:var(--wb-text-muted);margin:0 0 12px 0;">
            ${placementData.disclaimer}
          </p>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            ${langs.map(l => `
              <button type="button" class="wb-btn ${l.code === langParam ? 'wb-btn-primary' : 'wb-btn-outline'} wb-plc-lang-btn" data-lang="${l.code}">
                ${l.name_vi} (${l.native_name})
              </button>
            `).join('')}
          </div>
        </div>

        <div class="wb-grid-2">
          <div class="wb-card">
            <h3 style="margin:0 0 12px 0;color:var(--wb-deep-teal);">Bài Đánh giá Năng lực Đầu vào (${questions.length} kỹ năng cốt lõi)</h3>
            <form id="wbPlacementTestForm">
              <div class="wb-grid-2">
                <div class="wb-form-group">
                  <label class="wb-label">Mục tiêu thực hành của bạn <span class="req">*</span></label>
                  <input type="text" class="wb-input" name="target_goal" value="Giao tiếp tự tin và đọc hiểu tài liệu thực tế" required />
                </div>
                <div class="wb-form-group">
                  <label class="wb-label">Thời lượng dự kiến mỗi ngày (phút)</label>
                  <input type="number" class="wb-input" name="daily_minutes_target" value="30" min="10" max="180" required />
                </div>
              </div>

              ${questions.map((q, idx) => {
                const c = q.content || {};
                let inputField = '';
                if (q.tool_type === 'listening') {
                  inputField = `
                    <div style="font-size:13.5px;margin-bottom:6px;">Câu nghe khuyết từ: <strong>${c.transcript_masked || ''}</strong> (${c.pinyin || c.ipa || c.romaji || c.translit || ''})</div>
                    <input type="text" class="wb-input wb-plc-ans" data-ex-id="${q.exercise_id}" data-tool="listening" placeholder="Điền từ còn thiếu..." />
                  `;
                } else if (q.tool_type === 'vocabulary') {
                  inputField = `
                    <div style="font-size:13.5px;margin-bottom:6px;">${c.quiz_question || ''}</div>
                    <select class="wb-select wb-plc-ans" data-ex-id="${q.exercise_id}" data-tool="vocabulary">
                      <option value="">-- Chọn nghĩa đúng --</option>
                      ${(c.quiz_options || []).map(o => `<option value="${o}">${o}</option>`).join('')}
                    </select>
                  `;
                } else if (q.tool_type === 'sentence') {
                  inputField = `
                    <div style="font-size:13.5px;margin-bottom:6px;">Từ gợi ý: <strong>${(c.shuffled_tokens || []).join(' | ')}</strong> (${c.translation_vi || ''})</div>
                    <input type="text" class="wb-input wb-plc-ans" data-ex-id="${q.exercise_id}" data-tool="sentence" placeholder="Nhập các từ theo thứ tự đúng, cách nhau bởi dấu | ..." />
                  `;
                } else {
                  const rq = (c.questions && c.questions[0]) || { q: '', options: [] };
                  inputField = `
                    <div style="font-size:13px;background:var(--wb-bg-soft);padding:8px;border-radius:6px;margin-bottom:6px;">${c.passage || ''}</div>
                    <div style="font-size:13.5px;margin-bottom:6px;">${rq.q}</div>
                    <select class="wb-select wb-plc-ans" data-ex-id="${q.exercise_id}" data-tool="reading">
                      <option value="">-- Chọn câu trả lời --</option>
                      ${(rq.options || []).map(o => `<option value="${o}">${o}</option>`).join('')}
                    </select>
                  `;
                }

                return `
                  <div style="padding:12px;border:1px solid var(--wb-border);border-radius:10px;margin-bottom:12px;">
                    <span class="wb-badge wb-badge-teal">Phần ${idx + 1} • ${q.tool_name_vi} (${q.level})</span>
                    <h4 style="margin:6px 0;color:var(--wb-deep-teal);">${q.title}</h4>
                    ${inputField}
                  </div>
                `;
              }).join('')}

              <button type="submit" class="wb-btn wb-btn-accent" style="width:100%;">Chấm điểm &amp; Nhận Lộ trình Tự thực hành</button>
            </form>
          </div>

          <div class="wb-card" id="wbRoadmapDisplayCard">
            <h3 style="margin:0 0 12px 0;color:var(--wb-deep-teal);">Lộ trình Tự thực hành Cá nhân Hiện tại</h3>
            ${!currentRoadmap ? `
              <p style="font-size:13.5px;color:var(--wb-text-muted);">
                Bạn chưa có lộ trình cho ngôn ngữ này. Hãy hoàn thành bài đánh giá đầu vào bên trái để hệ thống phân tích kỹ năng đang tốt, kỹ năng cần cải thiện và đề xuất lộ trình!
              </p>
            ` : `
              <div style="background:var(--wb-bg-mint);padding:14px;border-radius:10px;margin-bottom:14px;">
                <div><strong>Trình độ ước lượng hiện tại:</strong> <span class="wb-badge wb-badge-teal">${currentRoadmap.current_level}</span> → <strong>Mục tiêu tiếp theo:</strong> <span class="wb-badge wb-badge-red">${currentRoadmap.target_level}</span></div>
                <div style="margin-top:6px;font-size:13.5px;"><strong>Mục tiêu cá nhân:</strong> ${currentRoadmap.target_goal}</div>
                <div style="margin-top:4px;font-size:13.5px;"><strong>Thời lượng dự kiến:</strong> ${currentRoadmap.daily_minutes_target} phút/ngày • ${currentRoadmap.weekly_sessions_target} buổi/tuần</div>
                <div style="margin-top:4px;font-size:13.5px;"><strong>Tiến độ hoàn thành lộ trình:</strong> ${currentRoadmap.progress_percent}%</div>
                <div style="margin-top:4px;font-size:13px;color:var(--wb-text-muted);"><strong>Mốc đánh giá lại:</strong> ${currentRoadmap.reassessment_milestone}</div>
              </div>

              <h4 style="margin:0 0 8px 0;color:var(--wb-deep-teal);">Kỹ năng ưu tiên cải thiện:</h4>
              <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px;">
                ${(currentRoadmap.skills_to_improve || []).map(s => `<span class="wb-badge wb-badge-red">${s}</span>`).join('')}
              </div>

              <h4 style="margin:0 0 8px 0;color:var(--wb-deep-teal);">Bài thực hành được đề xuất trong lộ trình:</h4>
              <ul style="padding-left:18px;font-size:13.5px;margin:0 0 16px 0;">
                ${(currentRoadmap.recommended_exercises || []).map(re => `
                  <li style="margin-bottom:6px;">
                    <strong>${re.title}</strong> (${re.tool_name_vi} • ${re.level} • ~${re.estimated_minutes} phút)
                  </li>
                `).join('')}
              </ul>

              <form id="wbAdjustRoadmapForm" style="padding-top:12px;border-top:1px solid var(--wb-border);">
                <h4 style="margin:0 0 8px 0;color:var(--wb-deep-teal);">Điều chỉnh Mục tiêu Lộ trình</h4>
                <input type="hidden" name="roadmap_id" value="${currentRoadmap.id}" />
                <div class="wb-grid-2">
                  <div class="wb-form-group">
                    <label class="wb-label">Mục tiêu điều chỉnh</label>
                    <input type="text" class="wb-input" name="target_goal" value="${currentRoadmap.target_goal}" required />
                  </div>
                  <div class="wb-form-group">
                    <label class="wb-label">Phút rèn luyện / ngày</label>
                    <input type="number" class="wb-input" name="daily_minutes_target" value="${currentRoadmap.daily_minutes_target}" min="10" max="180" />
                  </div>
                </div>
                <button type="submit" class="wb-btn wb-btn-primary">Cập nhật Mục tiêu Lộ trình</button>
              </form>
            `}
          </div>
        </div>
      </div>
    `;

    root.querySelectorAll('.wb-plc-lang-btn').forEach(btn => {
      btn.onclick = () => {
        WB.navigate('/hoc-tap/kiem-tra-trinh-do?lang=' + encodeURIComponent(btn.getAttribute('data-lang')));
      };
    });

    document.getElementById('wbPlacementTestForm').onsubmit = async e => {
      e.preventDefault();
      if (!WB.state.user) {
        WB.toast('Vui lòng đăng nhập để lưu kết quả đánh giá đầu vào và nhận lộ trình cá nhân.', 'error');
        return WB.navigate('/dang-nhap');
      }
      const fd = new FormData(e.target);
      const submissions = {};
      root.querySelectorAll('.wb-plc-ans').forEach(el => {
        const exId = el.getAttribute('data-ex-id');
        submissions[exId] = el.value.trim();
      });
      try {
        const res = await WB.api('/api/learning/placement', {
          method: 'POST',
          body: {
            language_code: langParam,
            target_goal: fd.get('target_goal'),
            daily_minutes_target: Number(fd.get('daily_minutes_target') || 30),
            submissions
          }
        });
        WB.toast(`Đánh giá hoàn tất! Trình độ ước lượng: ${res.estimated_level} (${res.score}/${res.max_score} điểm).`, 'success');
        WB.navigate('/hoc-tap/kiem-tra-trinh-do?lang=' + encodeURIComponent(langParam), false);
      } catch (err) {
        WB.toast(err.message, 'error');
      }
    };

    const adjForm = document.getElementById('wbAdjustRoadmapForm');
    if (adjForm) {
      adjForm.onsubmit = async e => {
        e.preventDefault();
        const fd = new FormData(adjForm);
        try {
          await WB.api('/api/learning/roadmap', { method: 'PUT', body: Object.fromEntries(fd.entries()) });
          WB.toast('Đã cập nhật mục tiêu lộ trình tự thực hành!', 'success');
          WB.navigate('/hoc-tap/kiem-tra-trinh-do?lang=' + encodeURIComponent(langParam), false);
        } catch (err) {
          WB.toast(err.message, 'error');
        }
      };
    }
  });

  // 3. TRUNG TÂM HỌC TẬP & 4 CÔNG CỤ THỰC HÀNH CHUYÊN SÂU (/hoc-tap, /hoc-tap/nghe, /hoc-tap/tu-vung, /hoc-tap/sap-xep-cau, /hoc-tap/doc-hieu - PHẦN VI)
  const renderLearningHub = async function (root, pathname, searchParams) {
    const toolMap = {
      '/hoc-tap': null,
      '/hoc-tap/nghe': 'listening',
      '/hoc-tap/tu-vung': 'vocabulary',
      '/hoc-tap/sap-xep-cau': 'sentence',
      '/hoc-tap/doc-hieu': 'reading'
    };
    const activeTool = toolMap[pathname] || null;
    const selectedLang = searchParams?.get('lang') || WB.state.selectedLanguage || 'en';
    WB.state.selectedLanguage = selectedLang;
    const levelFilter = searchParams?.get('level') || '';
    const beginnerOnly = searchParams?.get('beginner') === '1';

    const langsRes = await WB.api('/api/learning/languages');
    const langs = langsRes.languages || [];
    const exRes = await WB.api(
      `/api/learning/exercises?language_code=${encodeURIComponent(selectedLang)}${activeTool ? `&tool_type=${activeTool}` : ''}${levelFilter ? `&level=${encodeURIComponent(levelFilter)}` : ''}${beginnerOnly ? '&beginner_only=1' : ''}`
    );
    const exercises = exRes.exercises || [];

    let vocabSetsData = { sets: [], statistics: { total_words: 0, known_words: 0, unmemorized_words: 0, difficult_marked_words: 0 } };
    if (WB.state.user) {
      try {
        vocabSetsData = await WB.api('/api/learning/vocabulary-sets');
      } catch (_) {}
    }

    root.innerHTML = `
      <div class="wb-container wb-section">
        <div class="wb-workspace-layout">
          <aside class="wb-sidebar">
            <div style="font-weight:800;color:var(--wb-deep-teal);margin-bottom:10px;">TRUNG TÂM HỌC TẬP</div>
            <ul class="wb-sidebar-menu">
              <li><a class="wb-sidebar-link ${pathname === '/hoc-tap' ? 'active' : ''}" data-nav="/hoc-tap">${WB.icon('layers', 16)} <span>Tổng quan Thực hành</span></a></li>
              <li><a class="wb-sidebar-link" data-nav="/hoc-tap/kiem-tra-trinh-do">${WB.icon('flag', 16)} <span>Kiểm tra trình độ &amp; Lộ trình</span></a></li>
              <li><a class="wb-sidebar-link ${pathname === '/hoc-tap/nghe' ? 'active' : ''}" data-nav="/hoc-tap/nghe">${WB.icon('headphones', 16)} <span>1. Nghe điền từ &amp; Chính tả</span></a></li>
              <li><a class="wb-sidebar-link ${pathname === '/hoc-tap/tu-vung' ? 'active' : ''}" data-nav="/hoc-tap/tu-vung">${WB.icon('book', 16)} <span>2. Từ vựng &amp; Flashcard</span></a></li>
              <li><a class="wb-sidebar-link ${pathname === '/hoc-tap/sap-xep-cau' ? 'active' : ''}" data-nav="/hoc-tap/sap-xep-cau">${WB.icon('layers', 16)} <span>3. Sắp xếp câu</span></a></li>
              <li><a class="wb-sidebar-link ${pathname === '/hoc-tap/doc-hieu' ? 'active' : ''}" data-nav="/hoc-tap/doc-hieu">${WB.icon('news', 16)} <span>4. Đọc hiểu ngữ cảnh</span></a></li>
              <li><a class="wb-sidebar-link" data-nav="/tien-do">${WB.icon('chart', 16)} <span>Theo dõi Tiến độ</span></a></li>
              <li><a class="wb-sidebar-link" data-nav="/tai-nguyen">${WB.icon('folder', 16)} <span>Thư viện Tài nguyên</span></a></li>
            </ul>
          </aside>

          <div>
            <!-- Thanh chọn 05 ngôn ngữ mục tiêu & bộ lọc người mới -->
            <div class="wb-card" style="margin-bottom:18px;">
              <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:12px;">
                <div>
                  <span class="wb-badge wb-badge-teal">TRUNG TÂM THỰC HÀNH NGOẠI NGỮ</span>
                  <h1 style="margin:6px 0 2px 0;color:var(--wb-deep-teal);">Rèn luyện Phản xạ Chủ động 05 Ngoại ngữ</h1>
                </div>
                <div style="display:flex;gap:6px;flex-wrap:wrap;">
                  ${langs.map(l => `
                    <button type="button" class="wb-btn ${l.code === selectedLang ? 'wb-btn-primary' : 'wb-btn-outline'} wb-lang-switch" data-lang="${l.code}">
                      ${l.name_vi} (${l.native_name})
                    </button>
                  `).join('')}
                </div>
              </div>

              <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;padding-top:10px;border-top:1px solid var(--wb-border);font-size:13px;">
                <strong>Bộ lọc nhanh:</strong>
                <button type="button" class="wb-btn ${!beginnerOnly ? 'wb-btn-primary' : 'wb-btn-outline'} wb-filter-beginner-btn" data-beginner="0" style="padding:5px 12px;font-size:12.5px;">Tất cả trình độ</button>
                <button type="button" class="wb-btn ${beginnerOnly ? 'wb-btn-primary' : 'wb-btn-outline'} wb-filter-beginner-btn" data-beginner="1" style="padding:5px 12px;font-size:12.5px;">Khu vực dành cho người mới bắt đầu</button>
                <a href="/hoc-tap/kiem-tra-trinh-do?lang=${selectedLang}" class="wb-btn wb-btn-outline" data-nav="/hoc-tap/kiem-tra-trinh-do?lang=${selectedLang}" style="padding:5px 12px;font-size:12.5px;">Đánh giá đầu vào &amp; Lộ trình</a>
              </div>
            </div>

            <!-- Danh sách bài thực hành sâu theo 4 công cụ cốt lõi -->
            <div id="wbExercisesContainer">
              ${exercises.map(ex => {
                const c = ex.content || {};
                let interactionHtml = '';

                if (ex.tool_type === 'listening') {
                  const sentences = c.sentences || [c.audio_text || ''];
                  interactionHtml = `
                    <div style="background:var(--wb-bg-soft);padding:14px;border-radius:10px;margin-bottom:12px;">
                      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:10px;">
                        <button type="button" class="wb-btn wb-btn-primary wb-tts-play" data-text="${c.audio_text || ''}" data-lang="${ex.language_code}">
                          ${WB.icon('volume', 16)} <span>Nghe toàn đoạn</span>
                        </button>
                        ${sentences.map((s, sIdx) => `
                          <button type="button" class="wb-btn wb-btn-outline wb-tts-play" data-text="${s}" data-lang="${ex.language_code}" style="padding:6px 10px;font-size:12.5px;">
                            Nghe câu ${sIdx + 1}
                          </button>
                        `).join('')}
                        <button type="button" class="wb-btn wb-btn-outline wb-tts-stop">
                          ${WB.icon('pause', 15)} <span>Dừng</span>
                        </button>
                        <label style="font-size:13px;display:inline-flex;align-items:center;gap:4px;">
                          <input type="checkbox" class="wb-tts-loop" /> Lặp lại câu
                        </label>
                        <label style="font-size:13px;">Tốc độ:
                          <select class="wb-select wb-tts-speed" style="width:auto;display:inline-block;padding:4px 8px;">
                            <option value="0.5">0.5x</option>
                            <option value="0.75">0.75x</option>
                            <option value="1" selected>1.0x</option>
                            <option value="1.25">1.25x</option>
                            <option value="1.5">1.5x</option>
                          </select>
                        </label>
                        <button type="button" class="wb-btn wb-btn-outline wb-toggle-transcript-btn" style="padding:5px 10px;font-size:12px;">Ẩn / Hiện lời thoại</button>
                      </div>

                      <div class="wb-transcript-box">
                        <p style="font-size:16px;font-weight:700;margin:0 0 6px 0;">Câu khuyết từ: <span style="color:var(--wb-deep-teal);">${c.transcript_masked || ''}</span></p>
                        <div style="font-size:13px;color:var(--wb-text-muted);">Phiên âm hỗ trợ: ${c.pinyin || c.ipa || c.romaji || c.translit || ''}</div>
                      </div>
                      <div style="font-size:11.5px;color:var(--wb-text-muted);margin-top:6px;">${c.audio_license || ''}</div>
                    </div>

                    <div class="wb-grid-2">
                      <div class="wb-form-group">
                        <label class="wb-label">Nghe điền từ hoặc Nghe chép chính tả:</label>
                        <input type="text" class="wb-input wb-ex-input" data-ex-id="${ex.id}" placeholder="Nhập từ còn thiếu hoặc chép lại cả câu..." />
                      </div>
                      <div class="wb-form-group">
                        <label class="wb-label">Luyện nói nhại theo âm thanh (Xin quyền Micro minh bạch):</label>
                        <div style="display:flex;gap:8px;align-items:center;">
                          <button type="button" class="wb-btn wb-btn-outline wb-mic-practice-btn" data-ex-id="${ex.id}">
                            ${WB.icon('mic', 16)} <span>Ghi âm đối chiếu</span>
                          </button>
                          <span id="wbMicStatus_${ex.id}" style="font-size:12px;color:var(--wb-text-muted);">Chỉ bật khi bạn cho phép</span>
                        </div>
                      </div>
                    </div>
                  `;
                } else if (ex.tool_type === 'vocabulary') {
                  const cards = c.cards || [];
                  interactionHtml = `
                    <div style="margin-bottom:10px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
                      <span style="font-size:13px;color:var(--wb-text-muted);">Bấm vào từng thẻ để lật Flashcard hai chiều (Từ ↔ Nghĩa &amp; Ví dụ):</span>
                      <button type="button" class="wb-btn wb-btn-outline wb-flip-direction-btn" style="padding:4px 10px;font-size:12px;">Đổi chiều Flashcard (Từ ↔ Nghĩa)</button>
                    </div>
                    <div class="wb-grid-3" style="margin-bottom:14px;">
                      ${cards.map(card => `
                        <div class="wb-card wb-flashcard-item" style="background:var(--wb-bg-soft);cursor:pointer;" onclick="const b=this.querySelector('.wb-flash-back'); b.style.display = b.style.display === 'none' ? 'block' : 'none';">
                          <span class="wb-badge wb-badge-teal">Thẻ ghi nhớ hai chiều</span>
                          <h4 class="wb-fc-front-term" style="font-size:20px;margin:8px 0 4px 0;color:var(--wb-deep-teal);">${card.term}</h4>
                          <div style="font-size:13px;color:var(--wb-vermilion);font-weight:600;">[${card.pronunciation}]</div>
                          <div class="wb-flash-back" style="margin-top:8px;padding-top:8px;border-top:1px dashed var(--wb-border);">
                            <div><strong>Nghĩa tiếng Việt:</strong> ${card.meaning_vi}</div>
                            <div style="font-size:12.5px;color:var(--wb-text-muted);margin-top:4px;"><em>Ví dụ:</em> ${card.example}</div>
                          </div>
                        </div>
                      `).join('')}
                    </div>
                    <div class="wb-form-group">
                      <label class="wb-label">Kiểm tra ghi nhớ từ vựng: ${c.quiz_question || ''}</label>
                      <select class="wb-select wb-ex-input" data-ex-id="${ex.id}">
                        <option value="">-- Chọn đáp án đúng --</option>
                        ${(c.quiz_options || []).map(opt => `<option value="${opt}">${opt}</option>`).join('')}
                      </select>
                    </div>
                  `;
                } else if (ex.tool_type === 'sentence') {
                  const tokens = c.shuffled_tokens || [];
                  interactionHtml = `
                    <p style="font-size:13.5px;color:var(--wb-text-muted);margin:0 0 8px 0;"><strong>Nghĩa câu mục tiêu:</strong> ${c.translation_vi || ''}</p>
                    <div style="margin-bottom:10px;display:flex;gap:8px;flex-wrap:wrap;">
                      ${tokens.map(tok => `
                        <button type="button" class="wb-btn wb-btn-outline wb-token-pick" data-ex-id="${ex.id}" data-token="${tok}">${tok}</button>
                      `).join('')}
                      <button type="button" class="wb-btn wb-btn-outline wb-token-reset" data-ex-id="${ex.id}">Làm lại câu</button>
                    </div>
                    <div class="wb-form-group">
                      <label class="wb-label">Câu bạn đã sắp xếp (Chấm tất cả các cấu trúc câu tương đương hợp lệ &amp; chỉ rõ vị trí từ sai):</label>
                      <input type="text" class="wb-input wb-ex-input" id="wbSentInput_${ex.id}" data-ex-id="${ex.id}" placeholder="Bấm chọn các từ/cụm từ ở trên theo đúng thứ tự..." />
                    </div>
                  `;
                } else if (ex.tool_type === 'reading') {
                  const q0 = (c.questions && c.questions[0]) || { q: '', options: [] };
                  const glossary = c.glossary || [];
                  interactionHtml = `
                    <div style="background:var(--wb-bg-soft);padding:16px;border-radius:10px;margin-bottom:12px;font-size:15.5px;line-height:1.75;">
                      ${c.passage || ''}
                    </div>
                    ${glossary.length > 0 ? `
                      <div style="margin-bottom:12px;padding:10px 12px;background:#FFFDF7;border:1px solid var(--wb-border);border-radius:8px;font-size:13px;">
                        <strong>Tra cứu từ nhanh ngay trong đoạn đọc:</strong>
                        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:6px;">
                          ${glossary.map(g => `<span class="wb-badge wb-badge-ivory"><strong>${g.term}</strong> (${g.pronunciation}): ${g.meaning_vi}</span>`).join('')}
                        </div>
                      </div>
                    ` : ''}
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
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;flex-wrap:wrap;gap:8px;">
                      <span class="wb-badge wb-badge-teal">${ex.tool_name_vi} • ${ex.level} • ${ex.topic}</span>
                      <div style="display:flex;gap:6px;align-items:center;">
                        ${ex.is_beginner ? `<span class="wb-badge wb-badge-success">Dành cho người mới</span>` : ''}
                        <span class="wb-badge wb-badge-ivory">+${ex.points} điểm</span>
                      </div>
                    </div>
                    <h3 style="margin:0 0 6px 0;color:var(--wb-deep-teal);">${ex.title}</h3>
                    <p style="font-size:13.5px;color:var(--wb-text-muted);margin:0 0 12px 0;">${ex.instructions}</p>
                    ${interactionHtml}
                    <div style="display:flex;gap:10px;flex-wrap:wrap;">
                      <button type="button" class="wb-btn wb-btn-accent wb-submit-ex-btn" data-ex-id="${ex.id}" data-tool="${ex.tool_type}">
                        ${WB.icon('check', 16)} <span>Kiểm tra &amp; Chấm điểm</span>
                      </button>
                      <button type="button" class="wb-btn wb-btn-outline wb-save-ex-item-btn" data-ex-id="${ex.id}" data-lang="${ex.language_code}" data-title="${ex.title}">
                        ${WB.icon('bookmark', 16)} <span>Lưu câu khó / yêu thích để ôn lại</span>
                      </button>
                      <button type="button" class="wb-btn wb-btn-outline wb-ai-hint-btn" data-ex-id="${ex.id}" data-lang="${ex.language_code}">
                        ${WB.icon('sparkle', 16)} <span>Giải thích ngữ cảnh cùng Trợ lý AI</span>
                      </button>
                    </div>
                    <div id="wbExFeedback_${ex.id}" style="margin-top:12px;display:none;padding:12px;border-radius:8px;background:var(--wb-bg-mint);font-size:13.5px;"></div>
                  </div>
                `;
              }).join('')}
            </div>

            <!-- Quản lý Bộ từ vựng cá nhân & Ôn tập ngắt quãng (PHẦN VI.2) -->
            <div class="wb-card">
              <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:12px;">
                <h3 style="margin:0;color:var(--wb-deep-teal);">Bộ Từ vựng Cá nhân &amp; Ôn tập Ngắt quãng (Đồng bộ đa thiết bị)</h3>
                <div style="font-size:13px;color:var(--wb-text-muted);">
                  Tổng số từ: <strong>${vocabSetsData.statistics.total_words}</strong> •
                  Đã nhớ: <strong>${vocabSetsData.statistics.known_words}</strong> •
                  Chưa nhớ: <strong>${vocabSetsData.statistics.unmemorized_words}</strong> •
                  Đánh dấu từ khó: <strong>${vocabSetsData.statistics.difficult_marked_words}</strong>
                </div>
              </div>

              <form id="wbCreateVocabSetForm" style="margin-bottom:16px;">
                <div class="wb-grid-4">
                  <input type="text" class="wb-input" name="title" required placeholder="Tên bộ từ (VD: Từ vựng HSK 2)" />
                  <input type="text" class="wb-input" name="term" required placeholder="Từ mới (VD: 努力)" />
                  <input type="text" class="wb-input" name="pronunciation" placeholder="Phiên âm (VD: nǔlì)" />
                  <input type="text" class="wb-input" name="meaning_vi" required placeholder="Nghĩa tiếng Việt (VD: Nỗ lực)" />
                </div>
                <div style="margin-top:10px;display:flex;gap:12px;align-items:center;flex-wrap:wrap;">
                  <label style="font-size:13px;display:inline-flex;align-items:center;gap:6px;">
                    <input type="checkbox" name="is_favorite" /> Đánh dấu là từ khó cần ưu tiên ôn tập
                  </label>
                  <button type="submit" class="wb-btn wb-btn-primary">Lưu vào Bộ Từ vựng Cá nhân</button>
                </div>
              </form>

              ${(vocabSetsData.sets || []).length > 0 ? `
                <div class="wb-table-wrap">
                  <table class="wb-table">
                    <thead>
                      <tr><th>Từ vựng</th><th>Phiên âm</th><th>Nghĩa tiếng Việt</th><th>Mức ghi nhớ</th><th>Ôn tập ngắt quãng</th></tr>
                    </thead>
                    <tbody>
                      ${vocabSetsData.sets.flatMap(s => s.items || []).map(item => `
                        <tr>
                          <td><strong>${item.term}</strong> ${item.is_favorite ? '<span class="wb-badge wb-badge-red">Từ khó</span>' : ''}</td>
                          <td>${item.pronunciation}</td>
                          <td>${item.meaning_vi}</td>
                          <td><span class="wb-badge ${item.mastery_level >= 3 ? 'wb-badge-success' : 'wb-badge-ivory'}">Cấp ${item.mastery_level}/5 (${item.mastery_level >= 3 ? 'Đã biết' : 'Chưa nhớ'})</span></td>
                          <td>
                            <button type="button" class="wb-btn wb-btn-outline wb-srs-review-btn" data-id="${item.id}" data-rem="1" style="padding:4px 8px;font-size:12px;">Đã nhớ (+1)</button>
                            <button type="button" class="wb-btn wb-btn-outline wb-srs-review-btn" data-id="${item.id}" data-rem="0" style="padding:4px 8px;font-size:12px;">Chưa nhớ</button>
                          </td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>
              ` : ''}
            </div>
          </div>
        </div>
      </div>
    `;

    root.querySelectorAll('.wb-lang-switch').forEach(btn => {
      btn.onclick = () => {
        WB.state.selectedLanguage = btn.getAttribute('data-lang');
        WB.navigate(`${pathname}?lang=${encodeURIComponent(WB.state.selectedLanguage)}`);
      };
    });

    root.querySelectorAll('.wb-filter-beginner-btn').forEach(btn => {
      btn.onclick = () => {
        const b = btn.getAttribute('data-beginner');
        WB.navigate(`${pathname}?lang=${encodeURIComponent(selectedLang)}${b === '1' ? '&beginner=1' : ''}`);
      };
    });

    // Ẩn / hiện transcript trong bài nghe
    root.querySelectorAll('.wb-toggle-transcript-btn').forEach(btn => {
      btn.onclick = () => {
        const box = btn.closest('.wb-card').querySelector('.wb-transcript-box');
        if (box) box.style.display = box.style.display === 'none' ? 'block' : 'none';
      };
    });

    // Đổi chiều Flashcard (Từ <-> Nghĩa)
    root.querySelectorAll('.wb-flip-direction-btn').forEach(btn => {
      btn.onclick = () => {
        const cardContainer = btn.closest('.wb-card');
        cardContainer.querySelectorAll('.wb-flash-back').forEach(b => {
          b.style.display = b.style.display === 'none' ? 'block' : 'none';
        });
      };
    });

    // Phát âm thanh Web Speech API (hỗ trợ tốc độ & lặp lại câu)
    root.querySelectorAll('.wb-tts-play').forEach(btn => {
      btn.onclick = () => {
        const text = btn.getAttribute('data-text');
        const lang = btn.getAttribute('data-lang');
        const parent = btn.parentElement;
        const speedSel = parent.querySelector('.wb-tts-speed');
        const loopChk = parent.querySelector('.wb-tts-loop');
        const rate = speedSel ? parseFloat(speedSel.value) : 1.0;
        const shouldLoop = loopChk ? loopChk.checked : false;

        if ('speechSynthesis' in window && text) {
          window.speechSynthesis.cancel();
          const speakOnce = () => {
            const utter = new SpeechSynthesisUtterance(text);
            const langMap = { zh: 'zh-CN', en: 'en-US', ko: 'ko-KR', ja: 'ja-JP', ru: 'ru-RU' };
            utter.lang = langMap[lang] || 'en-US';
            utter.rate = rate;
            if (shouldLoop) {
              utter.onend = () => {
                if (loopChk && loopChk.checked) window.speechSynthesis.speak(utter);
              };
            }
            window.speechSynthesis.speak(utter);
          };
          speakOnce();
          WB.toast(`Đang phát âm thanh (${rate}x): "${text}"`);
        } else {
          WB.toast(`Nội dung âm thanh: "${text}"`);
        }
      };
    });

    root.querySelectorAll('.wb-tts-stop').forEach(btn => {
      btn.onclick = () => {
        if ('speechSynthesis' in window) window.speechSynthesis.cancel();
        WB.toast('Đã dừng phát âm thanh.');
      };
    });

    // Ghi âm luyện phát âm có xin quyền micro minh bạch, cho phép từ chối và không tự tuyên bố chấm phát âm giả (PHẦN VI.5)
    root.querySelectorAll('.wb-mic-practice-btn').forEach(btn => {
      btn.onclick = async () => {
        const exId = btn.getAttribute('data-ex-id');
        const statusEl = document.getElementById(`wbMicStatus_${exId}`);
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          if (statusEl) statusEl.textContent = 'Trình duyệt hiện tại chưa hỗ trợ quyền thu âm trực tiếp.';
          return;
        }
        try {
          if (statusEl) statusEl.textContent = 'Đang xin quyền truy cập Micro từ trình duyệt...';
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach(t => t.stop());
          if (statusEl) statusEl.textContent = 'Đã ghi nhận giọng đọc mẫu để bạn tự nghe đối chiếu (Hệ thống không tự chấm điểm phát âm giả).';
        } catch (_) {
          if (statusEl) statusEl.textContent = 'Bạn đã từ chối quyền Micro; bạn vẫn có thể tiếp tục làm bài bình thường.';
        }
      };
    });

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
            fb.innerHTML = `<strong>${res.result.is_correct ? 'Chính xác!' : 'Chưa chính xác'}</strong> — ${res.result.feedback}`;
          }
          WB.toast(res.result.feedback, res.result.is_correct ? 'success' : 'info');
        } catch (err) {
          WB.toast(err.message, 'error');
        }
      };
    });

    // Lưu câu khó / bài đọc yêu thích để luyện lại
    root.querySelectorAll('.wb-save-ex-item-btn').forEach(btn => {
      btn.onclick = async () => {
        if (!WB.state.user) return WB.navigate('/dang-nhap');
        try {
          await WB.api('/api/learning/saved-items', {
            method: 'POST',
            body: {
              language_code: btn.getAttribute('data-lang'),
              item_type: 'difficult_sentence',
              reference_id: btn.getAttribute('data-ex-id'),
              content: { title: btn.getAttribute('data-title') },
              note: 'Lưu từ Trung tâm học tập để ôn tập lại'
            }
          });
          WB.toast('Đã lưu vào Sổ tay câu khó và nội dung yêu thích!', 'success');
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
            fb.innerHTML = `<strong>${res.response}</strong><br/><span style="font-size:12px;color:var(--wb-text-muted);">Lượt dùng Trợ lý AI hôm nay: ${res.quota.used_today}/${res.quota.daily_limit}</span>`;
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
                pronunciation: fd.get('pronunciation') || selectedLang,
                meaning_vi: fd.get('meaning_vi'),
                example_sentence: fd.get('term'),
                is_favorite: vocabForm.elements.is_favorite.checked
              }]
            }
          });
          vocabForm.reset();
          WB.toast('Đã lưu bộ từ vựng cá nhân và đồng bộ tiến độ!', 'success');
          renderLearningHub(root, pathname, searchParams);
        } catch (err) {
          WB.toast(err.message, 'error');
        }
      };
    }

    root.querySelectorAll('.wb-srs-review-btn').forEach(btn => {
      btn.onclick = async () => {
        const id = btn.getAttribute('data-id');
        const remembered = btn.getAttribute('data-rem') === '1';
        try {
          const res = await WB.api('/api/learning/vocabulary-items/review', {
            method: 'POST',
            body: { item_id: id, remembered }
          });
          WB.toast(`Đã cập nhật mức ghi nhớ (${res.item.mastery_level}/5). Lịch ôn ngắt quãng tiếp theo sau ${res.item.srs_interval_days} ngày!`, 'success');
          renderLearningHub(root, pathname, searchParams);
        } catch (err) {
          WB.toast(err.message, 'error');
        }
      };
    });
  };

  WB.registerView('/hoc-tap', renderLearningHub);
  WB.registerView('/hoc-tap/nghe', renderLearningHub);
  WB.registerView('/hoc-tap/tu-vung', renderLearningHub);
  WB.registerView('/hoc-tap/sap-xep-cau', renderLearningHub);
  WB.registerView('/hoc-tap/doc-hieu', renderLearningHub);

  // 4. DASHBOARD CÁ NHÂN & GROW (/tien-do - PHẦN VIII: Dữ liệu thật 100%, chuỗi ngày, sổ tay lỗi sai, huy hiệu thật, lộ trình)
  WB.registerView('/tien-do', async function (root) {
    if (!WB.state.user) {
      WB.toast('Vui lòng đăng nhập để xem Theo dõi tiến độ.');
      return WB.navigate('/dang-nhap');
    }
    const res = await WB.api('/api/progress');
    const dash = res.dashboard;
    const overview = dash.account_overview || {};

    root.innerHTML = `
      <div class="wb-container wb-section">
        <div class="wb-card" style="margin-bottom:20px;">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
            <div>
              <span class="wb-badge wb-badge-teal">DASHBOARD CÁ NHÂN &amp; PHÁT TRIỂN NĂNG LỰC (GROW)</span>
              <h1 style="margin:8px 0 4px 0;color:var(--wb-deep-teal);">Hồ sơ Năng lực &amp; Tiến độ Rèn luyện của ${overview.full_name || WB.state.user.full_name}</h1>
              <p style="margin:0;font-size:14px;color:var(--wb-text-muted);">
                Ngoại ngữ đang học: <strong>${(overview.learning_languages || ['en']).join(', ').toUpperCase()}</strong> •
                Trình độ hiện tại: <strong>${overview.current_level || 'A1'}</strong> •
                ${dash.practice_recommendation}
              </p>
            </div>
            <a href="/hoc-tap/kiem-tra-trinh-do" class="wb-btn wb-btn-primary" data-nav="/hoc-tap/kiem-tra-trinh-do">Đánh giá lại trình độ &amp; Lộ trình</a>
          </div>
        </div>

        <div class="wb-grid-4" style="margin-bottom:20px;">
          <div class="wb-card">
            <div style="font-size:13px;color:var(--wb-text-muted);">Số bài / Lượt thực hành</div>
            <div style="font-size:28px;font-weight:800;color:var(--wb-deep-teal);">${dash.completed_exercises_count || 0} / ${dash.total_attempts}</div>
          </div>
          <div class="wb-card">
            <div style="font-size:13px;color:var(--wb-text-muted);">Điểm số thực tế &amp; Thời gian</div>
            <div style="font-size:28px;font-weight:800;color:var(--wb-vermilion);">${dash.total_score_earned} điểm <span style="font-size:14px;color:var(--wb-text-muted);">(${dash.total_duration_minutes || 0} phút)</span></div>
          </div>
          <div class="wb-card">
            <div style="font-size:13px;color:var(--wb-text-muted);">Chuỗi ngày thực hành thực tế</div>
            <div style="font-size:28px;font-weight:800;color:var(--wb-deep-teal);">${dash.streak_days || 0} ngày</div>
          </div>
          <div class="wb-card">
            <div style="font-size:13px;color:var(--wb-text-muted);">Từ vựng (Đã biết / Chưa nhớ)</div>
            <div style="font-size:28px;font-weight:800;color:var(--wb-deep-teal);">${dash.vocabulary_known_count || 0} / ${dash.vocabulary_unmemorized_count || 0}</div>
          </div>
        </div>

        <div class="wb-grid-2" style="margin-bottom:20px;">
          <div class="wb-card">
            <h3 style="margin:0 0 14px 0;color:var(--wb-deep-teal);">Biểu đồ Kết quả Thực tế theo Từng Kỹ năng</h3>
            ${dash.skill_breakdown.map(s => `
              <div style="margin-bottom:14px;">
                <div style="display:flex;justify-content:space-between;font-size:13.5px;font-weight:700;margin-bottom:4px;">
                  <span>${s.skill_name_vi || s.skill} (${s.attempts_count} lượt • ${s.errors_count || 0} lỗi sai)</span>
                  <span>${s.accuracy_percent}% (${s.total_score}/${s.max_score} điểm)</span>
                </div>
                <div style="height:12px;background:#E5EFEF;border-radius:999px;overflow:hidden;">
                  <div style="height:100%;width:${s.accuracy_percent}%;background:var(--wb-deep-teal);"></div>
                </div>
              </div>
            `).join('')}

            <hr style="margin:18px 0;border:none;border-top:1px solid var(--wb-border);" />
            <h4 style="margin:0 0 10px 0;color:var(--wb-deep-teal);">Thiết lập Mục tiêu Cá nhân Hàng ngày / Hàng tuần</h4>
            <form id="wbCreateGoalForm" style="display:flex;gap:8px;flex-wrap:wrap;">
              <input type="text" class="wb-input" name="target_title" required placeholder="VD: Hoàn thành 5 bài luyện nghe và 20 từ vựng mỗi tuần" style="flex:1;" />
              <input type="number" class="wb-input" name="target_sessions_per_week" value="5" min="1" max="30" style="width:90px;" />
              <button type="submit" class="wb-btn wb-btn-primary">Lưu mục tiêu</button>
            </form>
            <div style="margin-top:10px;">
              ${(dash.personal_goals || []).map(g => `
                <div style="padding:8px 10px;background:var(--wb-bg-soft);border-radius:8px;margin-bottom:6px;font-size:13px;display:flex;justify-content:space-between;">
                  <span><strong>${g.target_title}</strong> (${g.language_code.toUpperCase()})</span>
                  <span class="wb-badge wb-badge-teal">Tiến độ: ${g.current_sessions}/${g.target_sessions_per_week} buổi</span>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="wb-card">
            <h3 style="margin:0 0 12px 0;color:var(--wb-deep-teal);">Sổ tay Lỗi sai &amp; Nội dung Cần Cải thiện (${(dash.mistake_items || []).length})</h3>
            ${(dash.mistake_items || []).length === 0 ? `
              <p style="color:var(--wb-text-muted);font-size:13.5px;">Chưa có lỗi sai hoặc câu khó nào được ghi nhận.</p>
            ` : `
              ${(dash.mistake_items || []).slice(0, 6).map(m => `
                <div style="padding:10px;border:1px solid var(--wb-border);border-radius:8px;margin-bottom:8px;font-size:13px;">
                  <strong>${m.content?.title || m.reference_id}</strong> <span class="wb-badge wb-badge-red">${m.language_code.toUpperCase()}</span>
                  <div style="color:var(--wb-text-muted);margin-top:4px;">${(m.content?.specific_errors || []).join(' ') || m.note || ''}</div>
                </div>
              `).join('')}
            `}

            <h3 style="margin:18px 0 10px 0;color:var(--wb-deep-teal);">Huy hiệu Thành tích Thực tế (${(dash.achievements || []).length})</h3>
            ${(dash.achievements || []).length === 0 ? `
              <p style="color:var(--wb-text-muted);font-size:13px;">Huy hiệu chỉ được cấp khi bạn hoàn thành các mốc bài thực hành thật.</p>
            ` : `
              <div style="display:flex;gap:8px;flex-wrap:wrap;">
                ${(dash.achievements || []).map(ac => `
                  <div style="padding:8px 12px;background:var(--wb-bg-mint);border-radius:8px;font-size:13px;">
                    <strong>${ac.badge_name}</strong>: ${ac.description}
                  </div>
                `).join('')}
              </div>
            `}
          </div>
        </div>

        <div class="wb-card">
          <h3 style="margin:0 0 14px 0;color:var(--wb-deep-teal);">Lịch sử Thực hành Gần đây (${dash.recent_attempts.length})</h3>
          ${dash.recent_attempts.length === 0 ? `<p style="color:var(--wb-text-muted);font-size:13.5px;">Bạn chưa có lượt làm bài nào. Hãy vào <a href="/hoc-tap" data-nav="/hoc-tap">Trung tâm học tập</a> để bắt đầu!</p>` : `
            <div class="wb-table-wrap">
              <table class="wb-table">
                <thead>
                  <tr><th>Bài thực hành</th><th>Ngôn ngữ</th><th>Điểm số</th><th>Thời gian làm</th><th>Thời điểm</th></tr>
                </thead>
                <tbody>
                  ${dash.recent_attempts.map(a => `
                    <tr>
                      <td><strong>${a.exercise_title || a.exercise_id}</strong></td>
                      <td><span class="wb-badge wb-badge-teal">${a.language_code.toUpperCase()}</span></td>
                      <td><span class="wb-badge ${a.is_correct ? 'wb-badge-success' : 'wb-badge-red'}">${a.score}/${a.max_score}</span></td>
                      <td>${a.duration_seconds} giây</td>
                      <td style="font-size:12px;">${a.created_at.slice(0, 16).replace('T', ' ')}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          `}
        </div>
      </div>
    `;

    const goalForm = document.getElementById('wbCreateGoalForm');
    if (goalForm) {
      goalForm.onsubmit = async e => {
        e.preventDefault();
        const fd = new FormData(goalForm);
        try {
          await WB.api('/api/progress/goals', {
            method: 'POST',
            body: {
              language_code: WB.state.selectedLanguage || 'en',
              target_title: fd.get('target_title'),
              target_sessions_per_week: Number(fd.get('target_sessions_per_week') || 5)
            }
          });
          WB.toast('Đã lưu mục tiêu thực hành cá nhân!', 'success');
          WB.navigate('/tien-do', false);
        } catch (err) {
          WB.toast(err.message, 'error');
        }
      };
    }
  });

  // 5. THƯ VIỆN TÀI NGUYÊN & HỌC LIỆU (/tai-nguyen - PHẦN III.2: Có tìm kiếm, nguồn, tác giả, quyền sử dụng, đánh dấu lưu và liên kết bài tập)
  WB.registerView('/tai-nguyen', async function (root, pathname, searchParams) {
    const q = searchParams?.get('q') || '';
    const lang = searchParams?.get('language_code') || '';
    const res = await WB.api(`/api/resources?q=${encodeURIComponent(q)}&language_code=${encodeURIComponent(lang)}`);
    const resources = res.resources || [];

    root.innerHTML = `
      <div class="wb-container wb-section">
        <div class="wb-card" style="margin-bottom:20px;">
          <span class="wb-badge wb-badge-teal">THƯ VIỆN TÀI NGUYÊN &amp; HỌC LIỆU TRA CỨU</span>
          <h1 style="margin:8px 0;color:var(--wb-deep-teal);">Kho Tài nguyên Ngoại ngữ &amp; Học liệu Thực hành</h1>
          <p style="font-size:13.5px;color:var(--wb-text-muted);margin:0 0 14px 0;">
            Tài liệu được phân loại theo ngôn ngữ, hiển thị rõ nguồn, tác giả, quyền sử dụng nội dung và liên kết trực tiếp với bài tập thực hành tương ứng.
          </p>
          <form id="wbResourceSearchForm" class="wb-grid-3">
            <input type="search" class="wb-input" name="q" value="${q}" placeholder="Tìm kiếm tài liệu, từ vựng theo chủ đề..." />
            <select class="wb-select" name="language_code">
              <option value="">Tất cả ngôn ngữ</option>
              <option value="zh" ${lang === 'zh' ? 'selected' : ''}>Tiếng Trung</option>
              <option value="en" ${lang === 'en' ? 'selected' : ''}>Tiếng Anh</option>
              <option value="ko" ${lang === 'ko' ? 'selected' : ''}>Tiếng Hàn</option>
              <option value="ja" ${lang === 'ja' ? 'selected' : ''}>Tiếng Nhật</option>
              <option value="ru" ${lang === 'ru' ? 'selected' : ''}>Tiếng Nga</option>
            </select>
            <button type="submit" class="wb-btn wb-btn-primary">Tìm kiếm Học liệu</button>
          </form>
        </div>

        <div class="wb-grid-2">
          <div class="wb-card">
            <h3 style="margin:0 0 12px 0;color:var(--wb-deep-teal);">Đóng góp &amp; Lưu trữ Tài liệu Mới</h3>
            <form id="wbUploadResourceForm">
              <div class="wb-form-group">
                <label class="wb-label">Tiêu đề tài liệu <span class="req">*</span></label>
                <input type="text" class="wb-input" name="title" required placeholder="VD: Bảng từ vựng theo chủ đề Giao tiếp Tiếng Nhật N5" />
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
                  <label class="wb-label">Phạm vi chia sẻ</label>
                  <select class="wb-select" name="access_scope">
                    <option value="public">Công khai cho cộng đồng</option>
                    <option value="personal">Lưu trữ cá nhân</option>
                    <option value="member">Thành viên đã đăng nhập</option>
                    <option value="plus_only">Thành viên gói Plus</option>
                  </select>
                </div>
              </div>
              <div class="wb-form-group">
                <label class="wb-label">Mô tả nội dung, nguồn &amp; quyền sử dụng</label>
                <textarea class="wb-textarea" name="description" rows="2" placeholder="Ghi rõ tóm tắt nội dung, tác giả biên soạn và quyền sử dụng..."></textarea>
              </div>
              <button type="submit" class="wb-btn wb-btn-primary">Tải lên Thư viện Tài nguyên</button>
            </form>
          </div>

          <div class="wb-card">
            <h3 style="margin:0 0 12px 0;color:var(--wb-deep-teal);">Danh mục Tài nguyên Hiện có (${resources.length})</h3>
            ${resources.length === 0 ? `<p style="color:var(--wb-text-muted);font-size:13.5px;">Chưa có tài liệu nào khớp với tiêu chí tìm kiếm.</p>` : `
              ${resources.map(r => `
                <div style="padding:12px;border:1px solid var(--wb-border);border-radius:10px;margin-bottom:10px;">
                  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
                    <span class="wb-badge wb-badge-teal">${r.language_code.toUpperCase()} • ${r.resource_type.toUpperCase()}</span>
                    <span style="font-size:12px;color:var(--wb-text-muted);">Lượt lưu: ${r.favorite_count || 0}</span>
                  </div>
                  <h4 style="margin:4px 0;color:var(--wb-deep-teal);">${r.title}</h4>
                  <p style="font-size:13px;color:var(--wb-text-muted);margin:0 0 6px 0;">${r.description || ''}</p>
                  <div style="font-size:12px;color:var(--wb-text-muted);margin-bottom:8px;">
                    <strong>Nguồn / Tác giả:</strong> ${r.source_attribution} • <strong>Quyền sử dụng:</strong> ${r.usage_rights_label}
                  </div>
                  ${(r.linked_exercises || []).length > 0 ? `
                    <div style="font-size:12px;margin-bottom:8px;">
                      <strong>Bài tập thực hành liên kết:</strong>
                      ${r.linked_exercises.map(le => `<a href="/hoc-tap?lang=${r.language_code}" data-nav="/hoc-tap?lang=${r.language_code}" style="margin-right:8px;text-decoration:underline;">${le.title} (${le.level})</a>`).join('')}
                    </div>
                  ` : ''}
                  <div style="display:flex;gap:8px;flex-wrap:wrap;">
                    <button type="button" class="wb-btn wb-btn-outline wb-fav-res-btn" data-id="${r.id}" style="padding:4px 10px;font-size:12px;">Lưu tài liệu yêu thích</button>
                    <button type="button" class="wb-btn wb-btn-outline wb-report-res-btn" data-id="${r.id}" style="padding:4px 10px;font-size:12px;">Báo cáo bản quyền</button>
                  </div>
                </div>
              `).join('')}
            `}
          </div>
        </div>
      </div>
    `;

    document.getElementById('wbResourceSearchForm').onsubmit = e => {
      e.preventDefault();
      const fd = new FormData(e.target);
      WB.navigate(`/tai-nguyen?q=${encodeURIComponent(fd.get('q') || '')}&language_code=${encodeURIComponent(fd.get('language_code') || '')}`);
    };

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

    root.querySelectorAll('.wb-fav-res-btn').forEach(btn => {
      btn.onclick = async () => {
        if (!WB.state.user) return WB.navigate('/dang-nhap');
        try {
          const resFav = await WB.api('/api/resources/favorite', { method: 'POST', body: { resource_id: btn.getAttribute('data-id') } });
          WB.toast(resFav.favorited ? 'Đã đánh dấu lưu tài liệu!' : 'Đã bỏ lưu tài liệu.', 'success');
          WB.navigate('/tai-nguyen', false);
        } catch (err) {
          WB.toast(err.message, 'error');
        }
      };
    });

    root.querySelectorAll('.wb-report-res-btn').forEach(btn => {
      btn.onclick = async () => {
        if (!WB.state.user) return WB.navigate('/dang-nhap');
        try {
          await WB.api('/api/resources/report', {
            method: 'POST',
            body: { resource_id: btn.getAttribute('data-id'), report_type: 'copyright', reason: 'Yêu cầu rà soát nguồn và bản quyền học liệu' }
          });
          WB.toast('Đã gửi báo cáo bản quyền tới bộ phận kiểm duyệt.', 'success');
        } catch (err) {
          WB.toast(err.message, 'error');
        }
      };
    });
  });
})(window.WB);
