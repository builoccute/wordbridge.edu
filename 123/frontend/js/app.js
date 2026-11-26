/* WORD BRIDGE — Unified Learning System Frontend (No fake data, no internal labels) */
(function () {
  "use strict";

  const STORAGE_KEY = "wb_learner_state_v2";
  const DEFAULT_STATE = {
    courseProgress: {},     // { [courseId]: { completedLessons: [], completedActivities: [], lastLessonId } }
    myVocab: [],            // [{ entryId, term, zh, pinyin, ipa, vi, domain, setName, savedAt }]
    vocabSets: ["Học hàng ngày", "Chuyên ngành"],
    flashcardSrs: {},       // { [cardId]: { state, ease, interval, reps, nextReviewAt } }
    writingDrafts: {},      // { [writingId]: { outline, draft, submittedAt } }
    mistakes: [],           // Real learner mistakes only
    sessions: [],           // Real completed practice sessions only
    lastVisited: null
  };

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return JSON.parse(JSON.stringify(DEFAULT_STATE));
      const parsed = JSON.parse(raw);
      return Object.assign(JSON.parse(JSON.stringify(DEFAULT_STATE)), parsed);
    } catch (e) {
      return JSON.parse(JSON.stringify(DEFAULT_STATE));
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(app.state));
    } catch (e) {
      // Ignore storage quota errors in restricted preview frames
    }
  }

  function esc(str) {
    if (str === null || str === undefined) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function showToast(msg) {
    const el = document.getElementById("wb-toast");
    if (!el) return;
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(app.toastTimer);
    app.toastTimer = setTimeout(() => el.classList.remove("show"), 2600);
  }

  // Real MediaRecorder state machine (IDLE | REQUESTING_PERMISSION | RECORDING | STOPPED | PLAYING | ERROR | PERMISSION_DENIED)
  const recorder = {
    status: "IDLE",
    mediaRecorder: null,
    stream: null,
    chunks: [],
    audioUrl: null,
    audioEl: null,
    errorMsg: "",
    ownerKey: null,

    reset(ownerKey) {
      this.stopTracks();
      if (this.audioEl) {
        this.audioEl.pause();
        this.audioEl = null;
      }
      if (this.audioUrl) {
        URL.revokeObjectURL(this.audioUrl);
        this.audioUrl = null;
      }
      this.chunks = [];
      this.status = "IDLE";
      this.errorMsg = "";
      this.ownerKey = ownerKey || null;
    },

    stopTracks() {
      if (this.stream) {
        this.stream.getTracks().forEach((t) => t.stop());
        this.stream = null;
      }
    },

    async start(ownerKey, onChange) {
      if (this.ownerKey !== ownerKey) this.reset(ownerKey);
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || typeof MediaRecorder === "undefined") {
        this.status = "ERROR";
        this.errorMsg = "Trình duyệt hiện tại không hỗ trợ ghi âm trực tiếp (MediaRecorder). Hãy thử trên Chrome, Edge hoặc Safari phiên bản mới.";
        onChange();
        return;
      }
      this.status = "REQUESTING_PERMISSION";
      this.errorMsg = "";
      onChange();
      try {
        this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.chunks = [];
        this.mediaRecorder = new MediaRecorder(this.stream);
        this.mediaRecorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) this.chunks.push(e.data);
        };
        this.mediaRecorder.onstop = () => {
          const blob = new Blob(this.chunks, { type: "audio/webm" });
          if (this.audioUrl) URL.revokeObjectURL(this.audioUrl);
          this.audioUrl = URL.createObjectURL(blob);
          this.stopTracks();
          this.status = "STOPPED";
          onChange();
        };
        this.mediaRecorder.onerror = () => {
          this.stopTracks();
          this.status = "ERROR";
          this.errorMsg = "Có lỗi xảy ra trong quá trình ghi âm. Vui lòng thử lại.";
          onChange();
        };
        this.mediaRecorder.start();
        if (this.mediaRecorder.state === "recording") {
          this.status = "RECORDING";
        }
        onChange();
      } catch (err) {
        this.stopTracks();
        if (err && (err.name === "NotAllowedError" || err.name === "PermissionDeniedError")) {
          this.status = "PERMISSION_DENIED";
          this.errorMsg = "Quyền Micro đang bị từ chối. Hãy bấm biểu tượng ổ khóa trên thanh địa chỉ trình duyệt → Micro → Cho phép, rồi tải lại trang.";
        } else {
          this.status = "ERROR";
          this.errorMsg = "Không tìm thấy thiết bị Micro hoặc trình duyệt chưa cấp quyền truy cập âm thanh.";
        }
        onChange();
      }
    },

    stop(onChange) {
      if (this.mediaRecorder && this.mediaRecorder.state === "recording") {
        this.mediaRecorder.stop();
      } else {
        this.status = "IDLE";
        onChange();
      }
    },

    play(onChange) {
      if (!this.audioUrl) return;
      if (this.audioEl) this.audioEl.pause();
      this.audioEl = new Audio(this.audioUrl);
      this.status = "PLAYING";
      onChange();
      this.audioEl.onended = () => {
        this.status = "STOPPED";
        onChange();
      };
      this.audioEl.play().catch(() => {
        this.status = "ERROR";
        this.errorMsg = "Không thể phát lại bản ghi trên trình duyệt này.";
        onChange();
      });
    },

    remove(ownerKey, onChange) {
      this.reset(ownerKey);
      onChange();
    }
  };

  const NAV_GROUPS = [
    {
      id: "hub",
      label: "Trung tâm học tập",
      subs: [
        { id: "overview", label: "Tổng quan" },
        { id: "courses", label: "Khóa học & Lộ trình" }
      ]
    },
    {
      id: "practice",
      label: "Luyện tập",
      subs: [
        { id: "listening", label: "Nghe" },
        { id: "speaking", label: "Nói" },
        { id: "reading", label: "Đọc" },
        { id: "writing", label: "Viết" },
        { id: "pronunciation", label: "Phát âm" },
        { id: "grammar", label: "Ngữ pháp" },
        { id: "exercises", label: "Bài tập" },
        { id: "assessments", label: "Đánh giá" }
      ]
    },
    {
      id: "vocab",
      label: "Từ vựng",
      subs: [
        { id: "dictionary", label: "Tra cứu từ điển" },
        { id: "myvocab", label: "Từ vựng cá nhân" },
        { id: "flashcards", label: "Flashcard & SRS" }
      ]
    },
    {
      id: "tracking",
      label: "Theo dõi học tập",
      subs: [
        { id: "mistakes", label: "My Mistakes" },
        { id: "insights", label: "Practice Insights" }
      ]
    },
    {
      id: "specialties",
      label: "Ngôn ngữ & Chuyên ngành",
      subs: [
        { id: "domains", label: "Lĩnh vực chuyên môn" }
      ]
    }
  ];

  const app = {
    data: null,
    state: loadState(),
    group: "hub",
    sub: "overview",
    langFilter: "all",
    levelFilter: "all",
    domainFilter: "all",
    searchQuery: "",
    selected: {
      courseId: null,
      listeningId: null,
      speakingId: null,
      readingId: null,
      writingId: null,
      pronunciationId: null,
      grammarId: null,
      exerciseId: null,
      assessmentId: null,
      domainId: null
    },
    ui: {
      showTranscript: false,
      showModelDialogue: false,
      showWritingModel: false,
      showReadingTrans: false,
      fcIndex: 0,
      fcFlipped: false,
      fcMode: "all",
      dictPage: 1,
      mobileNavOpen: false
    },
    toastTimer: null
  };

  function domainName(id) {
    const found = (app.data.specialties || []).find((d) => Number(d.id) === Number(id));
    return found ? found.name_vi : "Chủ đề tổng hợp";
  }

  function langLabel(code) {
    if (code === "en") return "Tiếng Anh";
    if (code === "zh" || code === "zh-CN") return "Tiếng Trung giản thể";
    return "Song ngữ EN – ZH";
  }

  function logSession(skill, sourceId, language, domainId, score, maxScore) {
    app.state.sessions.unshift({
      id: "SES-" + Date.now(),
      skill,
      sourceId,
      language: language || "en",
      domainId: domainId || 1,
      score: score !== undefined ? score : null,
      maxScore: maxScore !== undefined ? maxScore : null,
      completedAt: new Date().toISOString()
    });
    if (app.state.sessions.length > 200) app.state.sessions.length = 200;
    app.state.lastVisited = { group: app.group, sub: app.sub, sourceId, at: new Date().toISOString() };
    saveState();
  }

  function logMistake(skill, sourceId, language, promptExcerpt, userAnswer, expectedAnswer, explanationVi) {
    const existing = app.state.mistakes.find(
      (m) => m.skill === skill && m.sourceId === sourceId && m.promptExcerpt === promptExcerpt && !m.resolved
    );
    if (existing) {
      existing.occurrenceCount += 1;
      existing.userAnswer = userAnswer;
      existing.lastSeenAt = new Date().toISOString();
    } else {
      app.state.mistakes.unshift({
        id: "MST-" + Date.now() + "-" + Math.floor(Math.random() * 1000),
        skill,
        sourceId,
        language: language || "en",
        promptExcerpt,
        userAnswer,
        expectedAnswer,
        explanationVi: explanationVi || "",
        occurrenceCount: 1,
        resolved: false,
        lastSeenAt: new Date().toISOString()
      });
    }
    saveState();
  }

  // Save vocabulary entry with normalized entryId + domain + term mapping (Fixes production bug)
  function saveToMyVocab(item, setName) {
    const entryId = item.entryId || item.id;
    const term = item.term || item.en || item.zh;
    const dom = item.domain || 1;
    if (!entryId || !term) {
      showToast("Không thể lưu: thiếu mã mục từ hoặc thuật ngữ hợp lệ.");
      return;
    }
    const exists = app.state.myVocab.some((v) => v.entryId === entryId);
    if (exists) {
      showToast("Mục từ đã có trong sổ từ vựng cá nhân.");
      return;
    }
    app.state.myVocab.unshift({
      entryId,
      term,
      zh: item.zh || "",
      pinyin: item.pinyin || "",
      ipa: item.ipa || "",
      vi: item.vi || "",
      domain: dom,
      domainName: domainName(dom),
      setName: setName || app.state.vocabSets[0],
      savedAt: new Date().toISOString()
    });
    saveState();
    showToast("Đã lưu \"" + term + "\" vào Từ vựng cá nhân.");
    render();
  }

  function navigate(groupId, subId, selectId) {
    app.group = groupId;
    const grp = NAV_GROUPS.find((g) => g.id === groupId) || NAV_GROUPS[0];
    app.sub = subId || grp.subs[0].id;
    app.ui.mobileNavOpen = false;
    app.ui.showTranscript = false;
    app.ui.showModelDialogue = false;
    app.ui.showWritingModel = false;
    app.ui.showReadingTrans = false;
    recorder.reset(null);
    if (selectId) {
      if (app.sub === "courses") app.selected.courseId = selectId;
      if (app.sub === "listening") app.selected.listeningId = selectId;
      if (app.sub === "speaking") app.selected.speakingId = selectId;
      if (app.sub === "reading") app.selected.readingId = selectId;
      if (app.sub === "writing") app.selected.writingId = selectId;
      if (app.sub === "pronunciation") app.selected.pronunciationId = selectId;
      if (app.sub === "grammar") app.selected.grammarId = selectId;
      if (app.sub === "exercises") app.selected.exerciseId = selectId;
      if (app.sub === "assessments") app.selected.assessmentId = selectId;
    }
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function filterByLang(items) {
    if (app.langFilter === "all") return items;
    return items.filter((x) => {
      const lg = x.language || "en-zh";
      if (app.langFilter === "zh") return lg === "zh" || lg === "zh-CN";
      return lg === app.langFilter;
    });
  }

  function renderNav() {
    const navEl = document.getElementById("wb-nav");
    const subEl = document.getElementById("wb-subnav");
    navEl.className = "wb-nav" + (app.ui.mobileNavOpen ? " open" : "");
    navEl.innerHTML = NAV_GROUPS.map(
      (g) => `<button type="button" class="wb-nav-btn ${g.id === app.group ? "active" : ""}" data-nav-group="${g.id}">${esc(g.label)}</button>`
    ).join("");
    const activeGroup = NAV_GROUPS.find((g) => g.id === app.group) || NAV_GROUPS[0];
    subEl.innerHTML = activeGroup.subs.map(
      (s) => `<button type="button" class="wb-sub-btn ${s.id === app.sub ? "active" : ""}" data-nav-sub="${s.id}">${esc(s.label)}</button>`
    ).join("");
  }

  function renderLangSelect() {
    return `
      <select class="wb-select" id="wb-lang-filter" aria-label="Lọc ngôn ngữ">
        <option value="all" ${app.langFilter === "all" ? "selected" : ""}>Tất cả ngôn ngữ</option>
        <option value="en" ${app.langFilter === "en" ? "selected" : ""}>Tiếng Anh</option>
        <option value="zh" ${app.langFilter === "zh" ? "selected" : ""}>Tiếng Trung giản thể</option>
      </select>
    `;
  }

  // ==================== 1. LEARNING HUB OVERVIEW ====================
  function renderOverview() {
    const enrolledIds = Object.keys(app.state.courseProgress);
    const completedCount = app.state.sessions.length;
    const openMistakes = app.state.mistakes.filter((m) => !m.resolved).length;
    const reviewedCards = Object.keys(app.state.flashcardSrs).length;

    return `
      <div class="wb-page-head">
        <div>
          <h1>Trung tâm học tập</h1>
          <p>Lộ trình tự học có cấu trúc cho Tiếng Anh và Tiếng Trung giản thể, kết nối trực tiếp giữa khóa học, 4 kỹ năng và ôn tập cá nhân.</p>
        </div>
        <div class="wb-controls-row">
          <button type="button" class="wb-btn wb-btn-primary" data-jump="hub:courses">Mở danh mục khóa học</button>
          <button type="button" class="wb-btn wb-btn-outline" data-jump="vocab:flashcards">Ôn Flashcard SRS</button>
        </div>
      </div>

      <div class="wb-grid-3" style="margin-bottom:1.25rem;">
        <div class="wb-panel">
          <div class="wb-list-item-meta">Lượt luyện tập đã ghi nhận</div>
          <div style="font-size:1.65rem;font-weight:800;color:var(--brand-teal);margin:0.2rem 0;">${completedCount}</div>
          <div class="wb-list-item-meta">${completedCount === 0 ? "Chưa có lịch sử luyện tập — hãy bắt đầu một bài học." : "Dựa trên hoạt động thực tế của bạn."}</div>
        </div>
        <div class="wb-panel">
          <div class="wb-list-item-meta">Khóa học đang theo dõi</div>
          <div style="font-size:1.65rem;font-weight:800;color:var(--brand-teal);margin:0.2rem 0;">${enrolledIds.length}</div>
          <div class="wb-list-item-meta">${enrolledIds.length === 0 ? "Chọn khóa học phù hợp trình độ để bắt đầu." : "Tiến độ được lưu tự động trên thiết bị."}</div>
        </div>
        <div class="wb-panel">
          <div class="wb-list-item-meta">Điểm cần ôn lại</div>
          <div style="font-size:1.65rem;font-weight:800;color:${openMistakes > 0 ? "var(--brand-vermilion)" : "var(--brand-teal)"};margin:0.2rem 0;">${openMistakes} lỗi · ${reviewedCards} thẻ</div>
          <div class="wb-list-item-meta">Từ My Mistakes và hệ thống ôn tập SRS.</div>
        </div>
      </div>

      <div class="wb-grid-2">
        <div class="wb-panel">
          <h2 class="wb-panel-title">Luyện từng kỹ năng theo đúng phương pháp</h2>
          <p style="margin-top:0;color:var(--ink-secondary);font-size:0.92rem;">Mỗi kỹ năng có không gian thực hành riêng thay vì dùng chung thẻ từ vựng:</p>
          <div class="wb-controls-row" style="margin-top:0.85rem;">
            <button type="button" class="wb-btn wb-btn-ghost" data-jump="practice:listening">Luyện Nghe</button>
            <button type="button" class="wb-btn wb-btn-ghost" data-jump="practice:speaking">Luyện Nói</button>
            <button type="button" class="wb-btn wb-btn-ghost" data-jump="practice:reading">Luyện Đọc</button>
            <button type="button" class="wb-btn wb-btn-ghost" data-jump="practice:writing">Luyện Viết</button>
            <button type="button" class="wb-btn wb-btn-ghost" data-jump="practice:pronunciation">Phát âm</button>
            <button type="button" class="wb-btn wb-btn-ghost" data-jump="practice:grammar">Ngữ pháp</button>
          </div>
        </div>

        <div class="wb-panel">
          <h2 class="wb-panel-title">Tiếp tục học & Khóa học nổi bật</h2>
          ${app.data.courses.slice(0, 3).map((c) => {
            const prog = app.state.courseProgress[c.id];
            const totalLessons = c.chapters.reduce((s, ch) => s + ch.lessons.length, 0);
            const done = prog ? prog.completedLessons.length : 0;
            const pct = totalLessons ? Math.round((done / totalLessons) * 100) : 0;
            return `
              <div style="padding:0.65rem 0;border-bottom:1px solid var(--border-subtle);display:flex;justify-content:space-between;align-items:center;gap:0.75rem;">
                <div>
                  <div style="font-weight:600;font-size:0.93rem;">${esc(c.title)}</div>
                  <div class="wb-list-item-meta">${esc(langLabel(c.language))} · ${esc(c.entry_level)} → ${esc(c.target_level)} · ${pct}%</div>
                </div>
                <button type="button" class="wb-btn wb-btn-outline" data-open-course="${esc(c.id)}">${prog ? "Tiếp tục" : "Xem"}</button>
              </div>
            `;
          }).join("")}
        </div>
      </div>
    `;
  }

  // ==================== 2. SELF-STUDY COURSES ====================
  function renderCourses() {
    const list = filterByLang(app.data.courses || []);
    const active = list.find((c) => c.id === app.selected.courseId) || list[0];
    if (active) app.selected.courseId = active.id;

    const prog = active ? app.state.courseProgress[active.id] : null;
    const totalLessons = active ? active.chapters.reduce((s, ch) => s + ch.lessons.length, 0) : 0;
    const doneLessons = prog ? prog.completedLessons : [];
    const pct = totalLessons ? Math.round((doneLessons.length / totalLessons) * 100) : 0;

    return `
      <div class="wb-page-head">
        <div>
          <h1>Khóa học & Lộ trình tự học</h1>
          <p>Hệ thống tự học phân cấp từ khóa học, chương, bài học đến hoạt động kỹ năng và bài đánh giá cuối chương.</p>
        </div>
        <div class="wb-controls-row">${renderLangSelect()}</div>
      </div>

      <div class="wb-workspace">
        <aside class="wb-list-sidebar">
          <div class="wb-list-head">Danh mục khóa học tự học</div>
          <div class="wb-list-scroll">
            ${list.map((c) => {
              const p = app.state.courseProgress[c.id];
              const tl = c.chapters.reduce((s, ch) => s + ch.lessons.length, 0);
              const d = p ? p.completedLessons.length : 0;
              return `
                <button type="button" class="wb-list-item ${active && c.id === active.id ? "active" : ""}" data-select-course="${esc(c.id)}">
                  <div class="wb-list-item-title">${esc(c.title)}</div>
                  <div class="wb-list-item-meta">${esc(c.category)} · ${esc(c.entry_level)} → ${esc(c.target_level)} · ${d}/${tl} bài</div>
                </button>
              `;
            }).join("")}
          </div>
        </aside>

        <div>
          ${active ? `
            <div class="wb-panel">
              <div style="display:flex;flex-wrap:wrap;justify-content:space-between;gap:0.75rem;align-items:flex-start;">
                <div>
                  <span class="wb-pill">${esc(langLabel(active.language))}</span>
                  <span class="wb-pill wb-pill-ivory">${esc(active.entry_level)} → ${esc(active.target_level)}</span>
                  <h2 style="margin:0.5rem 0 0.3rem;font-size:1.3rem;">${esc(active.title)}</h2>
                  <p style="margin:0;color:var(--ink-secondary);">${esc(active.description)}</p>
                </div>
                <button type="button" class="wb-btn wb-btn-primary" id="wb-enroll-course" data-course-id="${esc(active.id)}">
                  ${prog ? "Đang theo học" : "Bắt đầu khóa học"}
                </button>
              </div>

              <div style="margin-top:1rem;">
                <div style="display:flex;justify-content:space-between;font-size:0.84rem;color:var(--ink-secondary);margin-bottom:0.35rem;">
                  <span>Tiến độ hoàn thành</span>
                  <strong>${doneLessons.length}/${totalLessons} bài (${pct}%)</strong>
                </div>
                <div class="wb-progress-track"><div class="wb-progress-fill" style="width:${pct}%"></div></div>
              </div>

              <div class="wb-callout" style="margin-top:1rem;">
                <strong>Hệ quy chiếu trình độ:</strong> ${esc(active.proficiency_scale)}. ${esc(active.scale_note_vi || "")}
              </div>

              <div class="wb-grid-2" style="margin-top:0.75rem;">
                <div>
                  <strong>Mục tiêu khóa học</strong>
                  <ul style="margin:0.4rem 0 0;padding-left:1.2rem;font-size:0.9rem;">
                    ${active.objectives.map((o) => `<li>${esc(o)}</li>`).join("")}
                  </ul>
                </div>
                <div style="font-size:0.9rem;color:var(--ink-secondary);">
                  <div><strong>Đối tượng:</strong> ${esc(active.target_audience)}</div>
                  <div><strong>Thời lượng dự kiến:</strong> ${active.estimated_hours} giờ tự học</div>
                  <div><strong>Hình thức:</strong> Tự học theo lộ trình (không cấp chứng chỉ)</div>
                </div>
              </div>
            </div>

            ${active.chapters.map((ch) => `
              <div class="wb-panel">
                <h3 class="wb-panel-title">${esc(ch.title)}</h3>
                <p style="margin:0 0 0.85rem;font-size:0.9rem;color:var(--ink-secondary);">${esc(ch.objective)}</p>
                ${ch.lessons.map((ls) => {
                  const isDone = doneLessons.includes(ls.id);
                  return `
                    <div style="border:1px solid var(--border-subtle);border-radius:10px;padding:0.9rem;margin-bottom:0.75rem;background:${isDone ? "#f3faf7" : "#fff"};">
                      <div style="display:flex;flex-wrap:wrap;justify-content:space-between;gap:0.5rem;align-items:center;">
                        <div>
                          <strong>${esc(ls.title)}</strong>
                          <div class="wb-list-item-meta">${esc(ls.objective)} · ${ls.estimated_minutes} phút</div>
                        </div>
                        <button type="button" class="wb-btn ${isDone ? "wb-btn-outline" : "wb-btn-ghost"}" data-toggle-lesson="${esc(active.id)}::${esc(ls.id)}">
                          ${isDone ? "Đã hoàn thành" : "Đánh dấu hoàn thành"}
                        </button>
                      </div>
                      <div style="margin-top:0.65rem;display:flex;flex-wrap:wrap;gap:0.45rem;">
                        ${ls.activities.map((a) => `
                          <button type="button" class="wb-sub-btn" data-open-activity="${esc(a.source_module)}::${esc(a.source_id)}">
                            Mở ${esc(a.type)}: ${esc(a.title)}
                          </button>
                        `).join("")}
                        ${ls.exercise_ids.map((exId) => `
                          <button type="button" class="wb-sub-btn" data-open-activity="exercises::${esc(exId)}">
                            Bài tập ${esc(exId)}
                          </button>
                        `).join("")}
                      </div>
                    </div>
                  `;
                }).join("")}
                <div style="margin-top:0.5rem;">
                  <button type="button" class="wb-btn wb-btn-outline" data-open-activity="assessments::${esc(ch.chapter_assessment_id)}">
                    Làm bài đánh giá cuối chương
                  </button>
                </div>
              </div>
            `).join("")}
          ` : `<div class="wb-empty">Chưa có khóa học phù hợp bộ lọc.</div>`}
        </div>
      </div>
    `;
  }

  // ==================== 3. LISTENING (Honest audio state, no fake Play button) ====================
  function renderListening() {
    const list = filterByLang(app.data.listening || []);
    const item = list.find((x) => x.id === app.selected.listeningId) || list[0];
    if (item) app.selected.listeningId = item.id;
    const binding = item ? (app.data.audioBindings || []).find((b) => b.source_id === item.id) : null;
    const hasAudio = binding && binding.allow_playback_button && binding.audio_url;

    return `
      <div class="wb-page-head">
        <div>
          <h1>Luyện Nghe</h1>
          <p>Thực hành nghe hiểu theo tình huống, mục tiêu nghe, câu hỏi kiểm tra và đối chiếu kịch bản sau lượt làm bài.</p>
        </div>
        <div class="wb-controls-row">${renderLangSelect()}</div>
      </div>

      <div class="wb-workspace">
        <aside class="wb-list-sidebar">
          <div class="wb-list-head">Danh sách bài nghe</div>
          <div class="wb-list-scroll">
            ${list.map((x) => `
              <button type="button" class="wb-list-item ${item && x.id === item.id ? "active" : ""}" data-select-listening="${esc(x.id)}">
                <div class="wb-list-item-title">${esc(x.title)}</div>
                <div class="wb-list-item-meta">${esc(langLabel(x.language))} · ${esc(x.level)} · ${x.minutes} phút</div>
              </button>
            `).join("")}
          </div>
        </aside>

        <div>
          ${item ? `
            <div class="wb-panel">
              <span class="wb-pill">${esc(langLabel(item.language))}</span>
              <span class="wb-pill wb-pill-ivory">${esc(item.topic)} · ${item.minutes} phút</span>
              <h2 style="margin:0.5rem 0 0.4rem;">${esc(item.title)}</h2>
              <p style="margin:0 0 0.75rem;color:var(--ink-secondary);"><strong>Mục tiêu:</strong> ${esc(item.objective)}</p>
              <div class="wb-callout">
                <strong>Hướng dẫn trước khi nghe:</strong> ${esc(item.practice_instructions || item.activity)}
                <div style="margin-top:0.35rem;font-size:0.86rem;color:var(--ink-secondary);"><strong>Mẹo nghe:</strong> ${esc(item.teaching)}</div>
              </div>

              ${hasAudio ? `
                <div class="wb-panel" style="background:#f5fafa;">
                  <audio controls src="${esc(binding.audio_url)}" style="width:100%;"></audio>
                </div>
              ` : `
                <div class="wb-callout wb-callout-warn">
                  <strong>Trạng thái âm thanh: Chưa có tệp audio thực tế (Kịch bản văn bản).</strong>
                  <div style="margin-top:0.25rem;font-size:0.87rem;">Bài học hiện lưu dưới dạng kịch bản (${item.estimated_audio_seconds || 25} giây dự kiến). Hệ thống không hiển thị nút phát âm thanh giả; bạn có thể luyện đọc theo vai hoặc mở kịch bản sau khi thử trả lời câu hỏi bên dưới.</div>
                </div>
              `}

              <div style="margin:0.85rem 0;">
                <strong>Từ vựng trọng tâm:</strong>
                ${(item.vocabulary || []).map((w) => `<span class="wb-pill" style="margin-left:0.3rem;">${esc(w)}</span>`).join("")}
              </div>

              <div style="margin-top:1rem;">
                <button type="button" class="wb-btn wb-btn-outline" id="wb-toggle-transcript">
                  ${app.ui.showTranscript ? "Ẩn kịch bản (Transcript)" : "Mở kịch bản để luyện nghe / đối chiếu"}
                </button>
              </div>

              ${app.ui.showTranscript ? `
                <div style="margin-top:1rem;padding:1rem;background:#fbfcfa;border:1px solid var(--border-subtle);border-radius:10px;">
                  <strong>Kịch bản hội thoại</strong>
                  <div style="margin-top:0.5rem;">
                    ${(item.dialogue || []).map((d) => `<p style="margin:0.35rem 0;"><strong>${esc(d.role)}:</strong> ${esc(d.utterance)}</p>`).join("")}
                  </div>
                  <div style="margin-top:0.75rem;padding-top:0.65rem;border-top:1px dashed var(--border-subtle);font-size:0.9rem;color:var(--ink-secondary);">
                    <strong>Dịch nghĩa tham khảo:</strong> ${esc(item.translation_vi)}
                  </div>
                </div>
              ` : ""}
            </div>

            <div class="wb-panel">
              <h3 class="wb-panel-title">Câu hỏi kiểm tra nghe hiểu</h3>
              <form id="wb-listening-form" data-id="${esc(item.id)}">
                ${(item.questions || []).map((q, qi) => `
                  <div style="margin-bottom:1rem;">
                    <div style="font-weight:600;margin-bottom:0.45rem;">Câu ${qi + 1}: ${esc(q.prompt)}</div>
                    ${(q.options || []).map((opt, oi) => `
                      <label class="wb-option" data-q="${qi}" data-o="${oi}">
                        <input type="radio" name="lq_${qi}" value="${oi}">
                        <span>${esc(opt)}</span>
                      </label>
                    `).join("")}
                    <div class="wb-q-feedback" id="wb-lq-fb-${qi}" style="font-size:0.86rem;margin-top:0.3rem;"></div>
                  </div>
                `).join("")}
                <button type="submit" class="wb-btn wb-btn-primary">Nộp bài & xem giải thích</button>
              </form>
              <div id="wb-listening-result" style="margin-top:0.85rem;"></div>
            </div>
          ` : `<div class="wb-empty">Không có bài nghe phù hợp.</div>`}
        </div>
      </div>
    `;
  }

  // ==================== 4. SPEAKING (Complete communicative studio + real MediaRecorder) ====================
  function renderSpeaking() {
    const list = filterByLang(app.data.speaking || []);
    const item = list.find((x) => x.id === app.selected.speakingId) || list[0];
    if (item) app.selected.speakingId = item.id;

    const statusLabels = {
      IDLE: "Sẵn sàng ghi âm (Chưa ghi âm)",
      REQUESTING_PERMISSION: "Đang xin quyền truy cập Micro...",
      RECORDING: "Đang ghi âm thực tế...",
      STOPPED: "Đã dừng ghi âm — sẵn sàng nghe lại",
      PLAYING: "Đang phát lại bản ghi của bạn",
      PERMISSION_DENIED: "Quyền Micro bị từ chối",
      ERROR: "Không thể ghi âm trên thiết bị hiện tại"
    };

    const isOwner = item && recorder.ownerKey === item.id;
    const recState = isOwner ? recorder.status : "IDLE";

    return `
      <div class="wb-page-head">
        <div>
          <h1>Luyện Nói</h1>
          <p>Thực hành giao tiếp và diễn đạt qua tình huống thực tế, câu hỏi gợi ý, ghi âm trực tiếp và tự đánh giá theo tiêu chí.</p>
        </div>
        <div class="wb-controls-row">${renderLangSelect()}</div>
      </div>

      <div class="wb-workspace">
        <aside class="wb-list-sidebar">
          <div class="wb-list-head">Tình huống luyện nói</div>
          <div class="wb-list-scroll">
            ${list.map((x) => `
              <button type="button" class="wb-list-item ${item && x.id === item.id ? "active" : ""}" data-select-speaking="${esc(x.id)}">
                <div class="wb-list-item-title">${esc(x.title)}</div>
                <div class="wb-list-item-meta">${esc(langLabel(x.language))} · ${esc(x.level)} · ${x.minutes} phút</div>
              </button>
            `).join("")}
          </div>
        </aside>

        <div>
          ${item ? `
            <div class="wb-panel">
              <span class="wb-pill">${esc(langLabel(item.language))}</span>
              <span class="wb-pill wb-pill-ivory">${esc(domainName(item.domain))} · ${item.minutes} phút</span>
              <h2 style="margin:0.5rem 0 0.4rem;">${esc(item.title)}</h2>
              <p style="margin:0 0 0.6rem;"><strong>Tình huống giao tiếp:</strong> ${esc(item.situation)}</p>
              <p style="margin:0 0 0.6rem;color:var(--ink-secondary);"><strong>Mục tiêu:</strong> ${esc(item.objective)} · <strong>Vai nói:</strong> ${(item.roles || []).map(esc).join(" / ")}</p>

              <div class="wb-callout">
                <strong>Nhiệm vụ nói của bạn:</strong> ${esc(item.task)}
              </div>

              <div class="wb-grid-2" style="margin-bottom:1rem;">
                <div style="border:1px solid var(--border-subtle);border-radius:10px;padding:0.9rem;">
                  <strong>Câu hỏi gợi ý</strong>
                  <ul style="margin:0.45rem 0 0;padding-left:1.2rem;font-size:0.92rem;">
                    ${(item.guiding_questions || []).map((q) => `<li>${esc(q)}</li>`).join("")}
                  </ul>
                </div>
                <div style="border:1px solid var(--border-subtle);border-radius:10px;padding:0.9rem;">
                  <strong>Cấu trúc & cụm từ hỗ trợ</strong>
                  <p style="margin:0.4rem 0;font-size:0.88rem;color:var(--ink-secondary);">${esc(item.language_structure || item.teaching)}</p>
                  <div style="display:flex;flex-wrap:wrap;gap:0.35rem;">
                    ${(item.focus_phrases || []).map((p) => `<span class="wb-pill">${esc(p)}</span>`).join("")}
                  </div>
                </div>
              </div>

              <div class="wb-recorder">
                <div class="wb-rec-status">
                  <span class="wb-rec-dot ${recState === "RECORDING" ? "recording" : ""}"></span>
                  <span>Trạng thái Micro: ${esc(statusLabels[recState])}</span>
                </div>
                ${isOwner && recorder.errorMsg ? `<div class="wb-callout wb-callout-warn" style="margin-bottom:0.75rem;">${esc(recorder.errorMsg)}</div>` : ""}
                <div class="wb-controls-row">
                  <button type="button" class="wb-btn wb-btn-accent" id="wb-rec-start" data-owner="${esc(item.id)}" ${recState === "RECORDING" || recState === "REQUESTING_PERMISSION" ? "disabled" : ""}>Bắt đầu ghi âm</button>
                  <button type="button" class="wb-btn wb-btn-outline" id="wb-rec-stop" ${recState !== "RECORDING" ? "disabled" : ""}>Dừng ghi âm</button>
                  <button type="button" class="wb-btn wb-btn-ghost" id="wb-rec-play" ${!(isOwner && recorder.audioUrl) || recState === "RECORDING" ? "disabled" : ""}>Nghe lại bản ghi</button>
                  <button type="button" class="wb-btn wb-btn-outline" id="wb-rec-clear" ${!(isOwner && recorder.audioUrl) ? "disabled" : ""}>Xóa bản ghi</button>
                </div>
                <p style="margin:0.65rem 0 0;font-size:0.82rem;color:var(--ink-muted);">Bản ghi được xử lý cục bộ trên trình duyệt để bạn tự nghe lại và đối chiếu (không tuyên bố chấm điểm phát âm tự động).</p>
              </div>
            </div>

            <div class="wb-panel">
              <div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:0.5rem;margin-bottom:0.75rem;">
                <h3 class="wb-panel-title" style="margin:0;">Hội thoại mẫu & Tự đánh giá</h3>
                <button type="button" class="wb-btn wb-btn-outline" id="wb-toggle-model-dialogue">
                  ${app.ui.showModelDialogue ? "Ẩn hội thoại mẫu" : "Xem hội thoại mẫu"}
                </button>
              </div>

              ${app.ui.showModelDialogue ? `
                <div style="background:#fbfcfa;border:1px solid var(--border-subtle);border-radius:10px;padding:1rem;margin-bottom:1rem;">
                  ${(item.model_dialogue || []).map((line, i) => `
                    <div style="margin-bottom:0.6rem;">
                      <div style="font-weight:600;">${esc(line)}</div>
                      ${item.pinyin && item.pinyin[i] ? `<div style="font-size:0.84rem;color:var(--brand-teal);">${esc(item.pinyin[i])}</div>` : ""}
                      ${item.translation_vi && item.translation_vi[i] ? `<div style="font-size:0.86rem;color:var(--ink-secondary);">${esc(item.translation_vi[i])}</div>` : ""}
                    </div>
                  `).join("")}
                  <div style="font-size:0.86rem;color:var(--ink-muted);border-top:1px dashed var(--border-subtle);padding-top:0.5rem;">
                    <strong>Ghi chú sư phạm:</strong> ${esc(item.explanation)}
                  </div>
                </div>
              ` : ""}

              <div>
                <strong>Tiêu chí tự đánh giá sau khi nghe lại bản ghi:</strong>
                <div style="margin-top:0.5rem;">
                  ${(item.self_assessment || ["Đúng nội dung", "Độ rõ ràng", "Tính mạch lạc"]).map((cr, idx) => `
                    <label class="wb-option">
                      <input type="checkbox" class="wb-sp-check" value="${idx}">
                      <span>${esc(cr)}</span>
                    </label>
                  `).join("")}
                </div>
                <button type="button" class="wb-btn wb-btn-primary" id="wb-complete-speaking" data-id="${esc(item.id)}" style="margin-top:0.5rem;">Hoàn thành lượt luyện nói</button>
              </div>
            </div>
          ` : `<div class="wb-empty">Không có bài luyện nói phù hợp.</div>`}
        </div>
      </div>
    `;
  }

  // ==================== 5. READING (Clean typography + separate questions) ====================
  function renderReading() {
    const list = filterByLang(app.data.reading || []);
    const item = list.find((x) => x.id === app.selected.readingId) || list[0];
    if (item) app.selected.readingId = item.id;

    return `
      <div class="wb-page-head">
        <div>
          <h1>Luyện Đọc</h1>
          <p>Đọc văn bản hoàn chỉnh trong không gian tập trung, nắm từ vựng trọng tâm và kiểm tra đọc hiểu kèm giải thích.</p>
        </div>
        <div class="wb-controls-row">${renderLangSelect()}</div>
      </div>

      <div class="wb-workspace">
        <aside class="wb-list-sidebar">
          <div class="wb-list-head">Bài đọc hiểu</div>
          <div class="wb-list-scroll">
            ${list.map((x) => `
              <button type="button" class="wb-list-item ${item && x.id === item.id ? "active" : ""}" data-select-reading="${esc(x.id)}">
                <div class="wb-list-item-title">${esc(x.title)}</div>
                <div class="wb-list-item-meta">${esc(langLabel(x.language))} · ${esc(x.level)} · ${x.minutes} phút</div>
              </button>
            `).join("")}
          </div>
        </aside>

        <div>
          ${item ? `
            <div class="wb-panel">
              <span class="wb-pill">${esc(langLabel(item.language))}</span>
              <span class="wb-pill wb-pill-ivory">${esc(item.topic)} · ${item.minutes} phút</span>
              <h2 style="margin:0.5rem 0 0.4rem;">${esc(item.title)}</h2>
              <p style="margin:0 0 1rem;color:var(--ink-secondary);"><strong>Mục tiêu đọc:</strong> ${esc(item.objective)}</p>

              <article class="wb-reading-prose">${esc(item.passage || item.example)}</article>

              <div style="margin-top:1rem;display:flex;flex-wrap:wrap;gap:0.5rem;align-items:center;">
                <strong style="font-size:0.9rem;">Từ vựng trọng tâm:</strong>
                ${(item.vocabulary || []).map((w) => `<span class="wb-pill">${esc(w)}</span>`).join("")}
                <span style="margin-left:auto;">
                  <button type="button" class="wb-btn wb-btn-outline" id="wb-toggle-reading-trans">
                    ${app.ui.showReadingTrans ? "Ẩn bản dịch" : "Xem bản dịch đối chiếu"}
                  </button>
                </span>
              </div>

              ${app.ui.showReadingTrans ? `
                <div class="wb-callout" style="margin-top:0.85rem;">
                  <strong>Bản dịch tham khảo:</strong> ${esc(item.translation_vi)}
                </div>
              ` : ""}

              <div style="margin-top:0.85rem;font-size:0.9rem;color:var(--ink-secondary);">
                <strong>Ngữ pháp chú ý:</strong> ${esc(item.grammar)} — ${esc(item.teaching)}
              </div>
            </div>

            <div class="wb-panel">
              <h3 class="wb-panel-title">Câu hỏi đọc hiểu</h3>
              <form id="wb-reading-form" data-id="${esc(item.id)}">
                ${(item.questions || []).map((q, qi) => `
                  <div style="margin-bottom:1rem;">
                    <div style="font-weight:600;margin-bottom:0.45rem;">Câu ${qi + 1}: ${esc(q.prompt)}</div>
                    ${(q.options || []).map((opt, oi) => `
                      <label class="wb-option" data-rq="${qi}" data-ro="${oi}">
                        <input type="radio" name="rq_${qi}" value="${oi}">
                        <span>${esc(opt)}</span>
                      </label>
                    `).join("")}
                    <div id="wb-rq-fb-${qi}" style="font-size:0.86rem;margin-top:0.3rem;"></div>
                  </div>
                `).join("")}
                <button type="submit" class="wb-btn wb-btn-primary">Nộp đáp án & xem giải thích</button>
              </form>
              <div id="wb-reading-result" style="margin-top:0.85rem;"></div>
              <div style="margin-top:1rem;padding-top:0.85rem;border-top:1px solid var(--border-subtle);font-size:0.88rem;color:var(--ink-secondary);">
                <strong>Nhiệm vụ mở rộng:</strong> ${esc(item.activity)}
              </div>
            </div>
          ` : `<div class="wb-empty">Không có bài đọc phù hợp.</div>`}
        </div>
      </div>
    `;
  }

  // ==================== 6. WRITING (Full 5-step Writing Studio — NO vocab-card + textarea!) ====================
  function renderWriting() {
    const list = filterByLang(app.data.writing || []);
    const item = list.find((x) => x.id === app.selected.writingId) || list[0];
    if (item) app.selected.writingId = item.id;

    const saved = item ? (app.state.writingDrafts[item.id] || { outline: "", draft: "", submittedAt: null }) : { outline: "", draft: "" };
    const textVal = saved.draft || "";
    const wordCount = item && item.language === "zh"
      ? textVal.replace(/\s+/g, "").length
      : (textVal.trim() ? textVal.trim().split(/\s+/).length : 0);
    const unitLabel = item && item.language === "zh" ? "ký tự" : "từ";

    return `
      <div class="wb-page-head">
        <div>
          <h1>Luyện Viết</h1>
          <p>Không gian thực hành viết bài bản: đọc bối cảnh, lập dàn ý, soạn bản nháp có bộ đếm dung lượng, tự kiểm tra tiêu chí và đối chiếu bài mẫu.</p>
        </div>
        <div class="wb-controls-row">${renderLangSelect()}</div>
      </div>

      <div class="wb-workspace">
        <aside class="wb-list-sidebar">
          <div class="wb-list-head">Đề bài luyện viết</div>
          <div class="wb-list-scroll">
            ${list.map((x) => `
              <button type="button" class="wb-list-item ${item && x.id === item.id ? "active" : ""}" data-select-writing="${esc(x.id)}">
                <div class="wb-list-item-title">${esc(x.title)}</div>
                <div class="wb-list-item-meta">${esc(langLabel(x.language))} · ${esc(x.level)} · ${esc(x.suggested_length)}</div>
              </button>
            `).join("")}
          </div>
        </aside>

        <div>
          ${item ? `
            <div class="wb-panel">
              <span class="wb-pill">${esc(langLabel(item.language))}</span>
              <span class="wb-pill wb-pill-ivory">Dung lượng gợi ý: ${esc(item.suggested_length)} · ${item.minutes} phút</span>
              <h2 style="margin:0.5rem 0 0.4rem;">${esc(item.title)}</h2>
              <p style="margin:0 0 0.75rem;color:var(--ink-secondary);"><strong>Mục tiêu:</strong> ${esc(item.objective)}</p>

              <div class="wb-callout">
                <strong>Đề bài & Bối cảnh:</strong> ${esc(item.prompt || item.task)}
              </div>

              <div class="wb-grid-2">
                <div style="border:1px solid var(--border-subtle);border-radius:10px;padding:0.9rem;">
                  <strong>Yêu cầu nội dung bắt buộc</strong>
                  <ul style="margin:0.45rem 0 0;padding-left:1.2rem;font-size:0.9rem;">
                    ${(item.writing_requirements || []).map((r) => `<li>${esc(r)}</li>`).join("")}
                  </ul>
                </div>
                <div style="border:1px solid var(--border-subtle);border-radius:10px;padding:0.9rem;">
                  <strong>Từ vựng & Ngữ pháp gợi ý</strong>
                  <p style="margin:0.4rem 0;font-size:0.88rem;color:var(--ink-secondary);">${esc(item.suggested_grammar || item.teaching)}</p>
                  <div style="display:flex;flex-wrap:wrap;gap:0.35rem;">
                    ${(item.suggested_vocabulary || []).map((v) => `<span class="wb-pill">${esc(v)}</span>`).join("")}
                  </div>
                </div>
              </div>
            </div>

            <div class="wb-panel">
              <h3 class="wb-panel-title">Bước 1: Lập dàn ý ngắn</h3>
              <textarea class="wb-textarea" id="wb-writing-outline" style="min-height:84px;" placeholder="Ghi nhanh 3 ý chính bạn sẽ đưa vào bài viết...">${esc(saved.outline || "")}</textarea>

              <div style="display:flex;justify-content:space-between;align-items:center;margin:1rem 0 0.5rem;">
                <h3 class="wb-panel-title" style="margin:0;">Bước 2: Trình soạn thảo bài viết</h3>
                <span id="wb-word-counter" style="font-size:0.86rem;font-weight:600;color:var(--brand-teal);">${wordCount} ${unitLabel} (Gợi ý: ${esc(item.suggested_length)})</span>
              </div>
              <textarea class="wb-textarea" id="wb-writing-draft" placeholder="Viết bài hoàn chỉnh của bạn tại đây...">${esc(textVal)}</textarea>

              <div class="wb-controls-row" style="margin-top:0.85rem;">
                <button type="button" class="wb-btn wb-btn-outline" id="wb-save-draft" data-id="${esc(item.id)}">Lưu bản nháp</button>
                <button type="button" class="wb-btn wb-btn-primary" id="wb-submit-writing" data-id="${esc(item.id)}">Nộp bài & mở đối chiếu</button>
                <button type="button" class="wb-btn wb-btn-ghost" id="wb-toggle-writing-model">
                  ${app.ui.showWritingModel ? "Ẩn bài mẫu" : "Xem bài mẫu tham khảo"}
                </button>
              </div>
            </div>

            <div class="wb-panel">
              <h3 class="wb-panel-title">Bước 3: Tự rà soát theo tiêu chí & Lỗi thường gặp</h3>
              <div class="wb-grid-2">
                <div>
                  <strong>Tiêu chí tự đánh giá</strong>
                  <div style="margin-top:0.45rem;">
                    ${(item.assessment_criteria || []).map((c) => `
                      <label class="wb-option"><input type="checkbox"><span>${esc(c)}</span></label>
                    `).join("")}
                  </div>
                </div>
                <div>
                  <strong>Lỗi thường gặp cần tránh</strong>
                  <ul style="margin:0.45rem 0 0;padding-left:1.2rem;font-size:0.9rem;color:var(--brand-vermilion);">
                    ${(item.common_errors || []).map((e) => `<li>${esc(e)}</li>`).join("")}
                  </ul>
                </div>
              </div>

              ${app.ui.showWritingModel ? `
                <div style="margin-top:1rem;padding:1.1rem;background:#fbfcfa;border:1px solid var(--border-subtle);border-radius:10px;">
                  <strong>Bài mẫu tham khảo</strong>
                  <p style="margin:0.5rem 0;white-space:pre-line;font-size:0.98rem;">${esc(item.model_text || item.example)}</p>
                  <p style="margin:0.5rem 0;font-size:0.88rem;color:var(--ink-secondary);"><strong>Dịch nghĩa:</strong> ${esc(item.translation_vi)}</p>
                  <p style="margin:0.4rem 0 0;font-size:0.88rem;color:var(--brand-teal);"><strong>Giải thích bài mẫu:</strong> ${esc(item.model_explanation || item.explanation)}</p>
                </div>
              ` : ""}
            </div>
          ` : `<div class="wb-empty">Không có bài luyện viết phù hợp.</div>`}
        </div>
      </div>
    `;
  }

  // ==================== 7. PRONUNCIATION (Separated Module EN & ZH-CN) ====================
  function renderPronunciation() {
    const list = filterByLang(app.data.pronunciation || []);
    const item = list.find((x) => x.id === app.selected.pronunciationId) || list[0];
    if (item) app.selected.pronunciationId = item.id;
    const isOwner = item && recorder.ownerKey === item.id;
    const recState = isOwner ? recorder.status : "IDLE";

    return `
      <div class="wb-page-head">
        <div>
          <h1>Luyện Phát âm</h1>
          <p>Module phát âm độc lập cho Tiếng Anh (IPA, nguyên âm/phụ âm, cặp âm tối thiểu, trọng âm) và Tiếng Trung giản thể (thanh mẫu, vận mẫu, thanh điệu, biến điệu).</p>
        </div>
        <div class="wb-controls-row">${renderLangSelect()}</div>
      </div>

      <div class="wb-workspace">
        <aside class="wb-list-sidebar">
          <div class="wb-list-head">Chủ điểm phát âm</div>
          <div class="wb-list-scroll">
            ${list.map((x) => `
              <button type="button" class="wb-list-item ${item && x.id === item.id ? "active" : ""}" data-select-pron="${esc(x.id)}">
                <div class="wb-list-item-title">${esc(x.title)}</div>
                <div class="wb-list-item-meta">${esc(langLabel(x.language))} · ${esc(x.level)} · ${x.minutes} phút</div>
              </button>
            `).join("")}
          </div>
        </aside>

        <div>
          ${item ? `
            <div class="wb-panel">
              <span class="wb-pill">${esc(langLabel(item.language))}</span>
              <span class="wb-pill wb-pill-ivory">${esc(item.pronunciation_guide || "")}</span>
              <h2 style="margin:0.5rem 0 0.4rem;">${esc(item.title)}</h2>
              <p style="margin:0 0 0.75rem;"><strong>Hướng dẫn khẩu hình & bản chất âm:</strong> ${esc(item.teaching)}</p>

              <div class="wb-callout">
                <strong>Ví dụ mẫu:</strong> ${esc(item.example)}
                <div style="font-size:0.88rem;color:var(--ink-secondary);margin-top:0.25rem;">${esc(item.example_vi)}</div>
              </div>

              <div class="wb-callout wb-callout-warn">
                <strong>Lỗi phát âm phổ biến:</strong> ${esc(item.common_error_vi)}
                <div style="font-size:0.84rem;color:var(--ink-secondary);margin-top:0.25rem;">Âm thanh mẫu R2 chưa được gắn cho bài này — không hiển thị nút phát âm giả. Hãy dùng khung ghi âm bên dưới để tự đọc và kiểm tra lại.</div>
              </div>

              <div class="wb-recorder" style="margin-top:1rem;">
                <div class="wb-rec-status">
                  <span class="wb-rec-dot ${recState === "RECORDING" ? "recording" : ""}"></span>
                  <span>Tự ghi âm đối chiếu: ${recState === "RECORDING" ? "Đang ghi âm thực tế..." : (recState === "STOPPED" ? "Đã lưu bản ghi tạm" : "Sẵn sàng")}</span>
                </div>
                ${isOwner && recorder.errorMsg ? `<div style="color:var(--brand-vermilion);font-size:0.88rem;margin-bottom:0.6rem;">${esc(recorder.errorMsg)}</div>` : ""}
                <div class="wb-controls-row">
                  <button type="button" class="wb-btn wb-btn-accent" id="wb-rec-start" data-owner="${esc(item.id)}" ${recState === "RECORDING" ? "disabled" : ""}>Ghi âm</button>
                  <button type="button" class="wb-btn wb-btn-outline" id="wb-rec-stop" ${recState !== "RECORDING" ? "disabled" : ""}>Dừng</button>
                  <button type="button" class="wb-btn wb-btn-ghost" id="wb-rec-play" ${!(isOwner && recorder.audioUrl) ? "disabled" : ""}>Nghe lại</button>
                  <button type="button" class="wb-btn wb-btn-outline" id="wb-rec-clear" ${!(isOwner && recorder.audioUrl) ? "disabled" : ""}>Xóa</button>
                </div>
              </div>
            </div>

            <div class="wb-panel">
              <h3 class="wb-panel-title">Bài luyện phân biệt & kiểm tra</h3>
              <p style="margin:0 0 0.65rem;">${esc(item.task)}</p>
              <div class="wb-controls-row">
                <input type="text" class="wb-input" id="wb-pron-input" placeholder="Nhập câu trả lời của bạn..." style="flex:1;min-width:220px;">
                <button type="button" class="wb-btn wb-btn-primary" id="wb-check-pron" data-id="${esc(item.id)}">Kiểm tra đáp án</button>
              </div>
              <div id="wb-pron-result" style="margin-top:0.8rem;"></div>
            </div>
          ` : `<div class="wb-empty">Không có bài phát âm phù hợp.</div>`}
        </div>
      </div>
    `;
  }

  // ==================== 8. GRAMMAR ====================
  function renderGrammar() {
    const list = filterByLang(app.data.grammar || []);
    const item = list.find((x) => x.id === app.selected.grammarId) || list[0];
    if (item) app.selected.grammarId = item.id;

    return `
      <div class="wb-page-head">
        <div>
          <h1>Ngữ pháp hệ thống</h1>
          <p>Học quy tắc theo chủ điểm, cấu trúc chuẩn, ví dụ đối chiếu, lỗi sai phổ biến và bài tập vận dụng ngay.</p>
        </div>
        <div class="wb-controls-row">${renderLangSelect()}</div>
      </div>

      <div class="wb-workspace">
        <aside class="wb-list-sidebar">
          <div class="wb-list-head">Chủ điểm ngữ pháp</div>
          <div class="wb-list-scroll">
            ${list.map((x) => `
              <button type="button" class="wb-list-item ${item && x.id === item.id ? "active" : ""}" data-select-grammar="${esc(x.id)}">
                <div class="wb-list-item-title">${esc(x.title)}</div>
                <div class="wb-list-item-meta">${esc(langLabel(x.language))} · ${esc(x.level)}</div>
              </button>
            `).join("")}
          </div>
        </aside>

        <div>
          ${item ? `
            <div class="wb-panel">
              <span class="wb-pill">${esc(langLabel(item.language))}</span>
              <span class="wb-pill wb-pill-ivory">${esc(item.level)}</span>
              <h2 style="margin:0.5rem 0 0.4rem;">${esc(item.title)}</h2>
              <p style="margin:0 0 0.75rem;"><strong>Quy tắc:</strong> ${esc(item.teaching)}</p>
              <div class="wb-callout">
                <strong>Cấu trúc trọng tâm:</strong> <code>${esc(item.structure)}</code>
              </div>
              <div style="border:1px solid var(--border-subtle);border-radius:10px;padding:0.9rem;margin-bottom:0.85rem;">
                <div><strong>Ví dụ:</strong> ${esc(item.example)}</div>
                <div style="color:var(--ink-secondary);font-size:0.9rem;margin-top:0.25rem;">${esc(item.example_vi)}</div>
              </div>
              <div style="font-size:0.9rem;color:var(--brand-vermilion);">
                <strong>Lỗi phổ biến cần tránh:</strong> ${esc(item.common_error_vi)}
              </div>
            </div>

            <div class="wb-panel">
              <h3 class="wb-panel-title">Bài tập vận dụng</h3>
              <p style="margin:0 0 0.65rem;">${esc(item.task)}</p>
              <div class="wb-controls-row">
                <input type="text" class="wb-input" id="wb-grammar-input" placeholder="Nhập đáp án của bạn..." style="flex:1;min-width:220px;">
                <button type="button" class="wb-btn wb-btn-primary" id="wb-check-grammar" data-id="${esc(item.id)}">Kiểm tra</button>
              </div>
              <div id="wb-grammar-result" style="margin-top:0.8rem;"></div>
            </div>
          ` : `<div class="wb-empty">Không có chủ điểm ngữ pháp phù hợp.</div>`}
        </div>
      </div>
    `;
  }

  // ==================== 9. EXERCISES & 10. ASSESSMENTS ====================
  function renderExercises() {
    const list = filterByLang(app.data.exercises || []);
    const item = list.find((x) => x.id === app.selected.exerciseId) || list[0];
    if (item) app.selected.exerciseId = item.id;

    return `
      <div class="wb-page-head">
        <div>
          <h1>Bài tập thực hành</h1>
          <p>Đa dạng dạng bài: trắc nghiệm, điền từ, sắp xếp câu, sửa lỗi và phân tích tình huống theo từng kỹ năng.</p>
        </div>
        <div class="wb-controls-row">${renderLangSelect()}</div>
      </div>

      <div class="wb-workspace">
        <aside class="wb-list-sidebar">
          <div class="wb-list-head">Kho bài tập</div>
          <div class="wb-list-scroll">
            ${list.map((x) => `
              <button type="button" class="wb-list-item ${item && x.id === item.id ? "active" : ""}" data-select-ex="${esc(x.id)}">
                <div class="wb-list-item-title">${esc(x.format_vi)} · ${esc(x.module)}</div>
                <div class="wb-list-item-meta">${esc(langLabel(x.language))} · ${esc(x.level)} · ${esc(domainName(x.domain))}</div>
              </button>
            `).join("")}
          </div>
        </aside>

        <div>
          ${item ? `
            <div class="wb-panel">
              <span class="wb-pill">${esc(item.format_vi)}</span>
              <span class="wb-pill wb-pill-ivory">${esc(langLabel(item.language))} · ${esc(item.level)}</span>
              <div class="wb-callout" style="margin-top:0.85rem;">${esc(item.stimulus)}</div>
              <p style="font-weight:600;">${esc(item.task)}</p>

              ${item.options && item.options.length ? `
                <div id="wb-ex-options">
                  ${item.options.map((opt, idx) => `
                    <label class="wb-option">
                      <input type="radio" name="wb_ex_opt" value="${esc(opt)}">
                      <span>${esc(opt)}</span>
                    </label>
                  `).join("")}
                </div>
              ` : `
                <textarea class="wb-textarea" id="wb-ex-text" style="min-height:100px;" placeholder="Nhập câu trả lời của bạn..."></textarea>
              `}

              <div class="wb-controls-row" style="margin-top:0.85rem;">
                <button type="button" class="wb-btn wb-btn-primary" id="wb-check-ex" data-id="${esc(item.id)}">Kiểm tra & xem giải thích</button>
              </div>
              <div id="wb-ex-result" style="margin-top:0.85rem;"></div>
            </div>
          ` : `<div class="wb-empty">Không có bài tập phù hợp.</div>`}
        </div>
      </div>
    `;
  }

  function renderAssessments() {
    const list = filterByLang(app.data.assessments || []);
    const item = list.find((x) => x.id === app.selected.assessmentId) || list[0];
    if (item) app.selected.assessmentId = item.id;

    return `
      <div class="wb-page-head">
        <div>
          <h1>Đánh giá năng lực học tập</h1>
          <p>Tự kiểm tra năng lực theo kỹ năng và thang điểm tiêu chí minh bạch (phục vụ tự học, không cấp chứng chỉ).</p>
        </div>
        <div class="wb-controls-row">${renderLangSelect()}</div>
      </div>

      <div class="wb-workspace">
        <aside class="wb-list-sidebar">
          <div class="wb-list-head">Bộ đánh giá</div>
          <div class="wb-list-scroll">
            ${list.map((x) => `
              <button type="button" class="wb-list-item ${item && x.id === item.id ? "active" : ""}" data-select-as="${esc(x.id)}">
                <div class="wb-list-item-title">${esc(x.title)}</div>
                <div class="wb-list-item-meta">${esc(langLabel(x.language))} · ${esc(x.level)} · Tối đa ${x.max_score} điểm</div>
              </button>
            `).join("")}
          </div>
        </aside>

        <div>
          ${item ? `
            <div class="wb-panel">
              <span class="wb-pill">${esc(langLabel(item.language))}</span>
              <span class="wb-pill wb-pill-ivory">${esc(item.assessment_purpose_vi || "Tự đánh giá")} · ${item.minutes} phút</span>
              <h2 style="margin:0.5rem 0 0.5rem;">${esc(item.title)}</h2>
              <div class="wb-callout">${esc(item.stimulus)}</div>
              <p style="font-weight:600;">${esc(item.task)}</p>
              <textarea class="wb-textarea" id="wb-as-input" style="min-height:110px;" placeholder="Ghi câu trả lời của bạn trước khi đối chiếu đáp án và tự chấm điểm..."></textarea>

              <div style="margin-top:1rem;">
                <strong>Tự đối chiếu tiêu chí (Thang ${item.max_score} điểm):</strong>
                <div style="margin-top:0.45rem;">
                  ${(item.criteria || []).map((c, idx) => `
                    <label class="wb-option">
                      <input type="checkbox" class="wb-as-crit" value="${c.points || 1}">
                      <span><strong>+${c.points || 1}đ:</strong> ${esc(c.observable)} <em style="color:var(--ink-muted);">(${esc(c.if_missing_vi || "")})</em></span>
                    </label>
                  `).join("")}
                </div>
              </div>

              <button type="button" class="wb-btn wb-btn-primary" id="wb-submit-as" data-id="${esc(item.id)}" style="margin-top:0.65rem;">Ghi nhận kết quả & xem đáp án</button>
              <div id="wb-as-result" style="margin-top:0.85rem;"></div>
            </div>
          ` : `<div class="wb-empty">Không có bộ đánh giá phù hợp.</div>`}
        </div>
      </div>
    `;
  }

  // ==================== 11. DICTIONARY, MY VOCAB & FLASHCARD SRS ====================
  function renderDictionary() {
    const q = app.searchQuery.trim().toLowerCase();
    const dom = app.domainFilter;
    const filtered = (app.data.vocabulary || []).filter((v) => {
      const matchDom = dom === "all" || String(v.domain) === String(dom);
      if (!matchDom) return false;
      if (!q) return true;
      return (v.en || "").toLowerCase().includes(q) || (v.zh || "").includes(q) || (v.vi || "").toLowerCase().includes(q) || (v.pinyin || "").toLowerCase().includes(q);
    });
    const perPage = 12;
    const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
    if (app.ui.dictPage > totalPages) app.ui.dictPage = 1;
    const slice = filtered.slice((app.ui.dictPage - 1) * perPage, app.ui.dictPage * perPage);

    return `
      <div class="wb-page-head">
        <div>
          <h1>Từ điển đa ngôn ngữ</h1>
          <p>Tra cứu song ngữ Anh – Trung giản thể – Việt kèm phiên âm IPA, Pinyin, ví dụ ngữ cảnh và lưu trực tiếp vào sổ cá nhân.</p>
        </div>
      </div>

      <div class="wb-panel" style="margin-bottom:1rem;">
        <div class="wb-controls-row">
          <input type="search" class="wb-input" id="wb-dict-search" value="${esc(app.searchQuery)}" placeholder="Tìm theo tiếng Anh, chữ Hán, Pinyin hoặc nghĩa tiếng Việt..." style="flex:1;min-width:240px;">
          <select class="wb-select" id="wb-domain-filter">
            <option value="all">Tất cả lĩnh vực</option>
            ${(app.data.specialties || []).map((d) => `<option value="${d.id}" ${String(dom) === String(d.id) ? "selected" : ""}>${esc(d.name_vi)}</option>`).join("")}
          </select>
        </div>
      </div>

      ${slice.length === 0 ? `<div class="wb-empty">Không tìm thấy mục từ phù hợp với từ khóa hiện tại.</div>` : `
        <div class="wb-grid-2">
          ${slice.map((v) => {
            const isSaved = app.state.myVocab.some((m) => m.entryId === v.id);
            return `
              <div class="wb-panel" style="margin-top:0;">
                <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:0.5rem;">
                  <div>
                    <div style="font-size:1.1rem;font-weight:700;color:var(--brand-teal);">${esc(v.en)} <span style="font-weight:500;color:var(--ink-muted);font-size:0.86rem;">${esc(v.ipa)}</span></div>
                    <div style="font-size:1rem;font-weight:600;margin-top:0.15rem;">${esc(v.zh)} <span style="font-weight:400;color:var(--ink-secondary);font-size:0.88rem;">${esc(v.pinyin)}</span></div>
                  </div>
                  <button type="button" class="wb-btn ${isSaved ? "wb-btn-outline" : "wb-btn-ghost"}" data-save-vocab="${esc(v.id)}">
                    ${isSaved ? "Đã lưu" : "Lưu từ"}
                  </button>
                </div>
                <div style="margin-top:0.5rem;font-weight:600;">${esc(v.vi)} <span class="wb-pill wb-pill-ivory" style="margin-left:0.3rem;">${esc(v.pos)} · ${esc(v.level)}</span></div>
                <div class="wb-list-item-meta" style="margin-top:0.35rem;">Lĩnh vực: ${esc(domainName(v.domain))}</div>
                ${v.example_en ? `
                  <div style="margin-top:0.65rem;padding-top:0.55rem;border-top:1px solid var(--border-subtle);font-size:0.87rem;">
                    <div>${esc(v.example_en)}</div>
                    <div style="color:var(--ink-secondary);">${esc(v.example_zh || "")}</div>
                    <div style="color:var(--ink-muted);">${esc(v.example_vi || "")}</div>
                  </div>
                ` : ""}
              </div>
            `;
          }).join("")}
        </div>
        <div class="wb-controls-row" style="justify-content:center;margin-top:1.25rem;">
          <button type="button" class="wb-btn wb-btn-outline" id="wb-dict-prev" ${app.ui.dictPage <= 1 ? "disabled" : ""}>Trang trước</button>
          <span style="font-size:0.9rem;color:var(--ink-secondary);">Trang ${app.ui.dictPage} / ${totalPages}</span>
          <button type="button" class="wb-btn wb-btn-outline" id="wb-dict-next" ${app.ui.dictPage >= totalPages ? "disabled" : ""}>Trang sau</button>
        </div>
      `}
    `;
  }

  function renderMyVocab() {
    return `
      <div class="wb-page-head">
        <div>
          <h1>Từ vựng cá nhân & Bộ từ vựng</h1>
          <p>Quản lý các thuật ngữ và từ vựng bạn đã lưu từ từ điển để ôn tập chủ động.</p>
        </div>
        <div class="wb-controls-row">
          <input type="text" class="wb-input" id="wb-new-set-name" placeholder="Tên bộ từ mới...">
          <button type="button" class="wb-btn wb-btn-primary" id="wb-add-set">Tạo bộ từ</button>
        </div>
      </div>

      <div style="margin-bottom:1rem;display:flex;flex-wrap:wrap;gap:0.4rem;">
        ${app.state.vocabSets.map((s) => `<span class="wb-pill">${esc(s)}</span>`).join("")}
      </div>

      ${app.state.myVocab.length === 0 ? `
        <div class="wb-empty">
          <p style="margin:0 0 0.75rem;">Sổ từ vựng cá nhân của bạn đang trống.</p>
          <button type="button" class="wb-btn wb-btn-primary" data-jump="vocab:dictionary">Tra cứu và lưu từ đầu tiên</button>
        </div>
      ` : `
        <div class="wb-grid-2">
          ${app.state.myVocab.map((m) => `
            <div class="wb-panel" style="margin-top:0;">
              <div style="display:flex;justify-content:space-between;align-items:flex-start;">
                <div>
                  <strong style="color:var(--brand-teal);font-size:1.05rem;">${esc(m.term)}</strong> <span class="wb-list-item-meta">${esc(m.ipa)}</span>
                  <div>${esc(m.zh)} <span class="wb-list-item-meta">${esc(m.pinyin)}</span></div>
                </div>
                <button type="button" class="wb-btn wb-btn-outline" data-remove-vocab="${esc(m.entryId)}">Gỡ</button>
              </div>
              <div style="margin-top:0.4rem;">${esc(m.vi)}</div>
              <div class="wb-list-item-meta" style="margin-top:0.3rem;">${esc(m.domainName)} · Bộ: ${esc(m.setName)}</div>
            </div>
          `).join("")}
        </div>
      `}
    `;
  }

  function renderFlashcards() {
    const allCards = app.data.flashcards || [];
    const now = Date.now();
    let pool = allCards;
    if (app.ui.fcMode === "due") {
      pool = allCards.filter((c) => {
        const s = app.state.flashcardSrs[c.id];
        return s && (!s.nextReviewAt || new Date(s.nextReviewAt).getTime() <= now || s.state === "REVIEW_AGAIN");
      });
    } else if (app.ui.fcMode === "known") {
      pool = allCards.filter((c) => app.state.flashcardSrs[c.id] && app.state.flashcardSrs[c.id].state === "KNOWN");
    }
    if (app.domainFilter !== "all") {
      pool = pool.filter((c) => String(c.domain) === String(app.domainFilter));
    }
    if (app.ui.fcIndex >= pool.length) app.ui.fcIndex = 0;
    const card = pool[app.ui.fcIndex];
    const knownCnt = Object.values(app.state.flashcardSrs).filter((s) => s.state === "KNOWN").length;
    const againCnt = Object.values(app.state.flashcardSrs).filter((s) => s.state === "REVIEW_AGAIN").length;

    return `
      <div class="wb-page-head">
        <div>
          <h1>Flashcard & Ôn tập SRS</h1>
          <p>Kho thẻ học từ vựng tách biệt khỏi từ điển chính, hỗ trợ lật thẻ, đánh dấu mức độ ghi nhớ và lập lịch ôn tập giãn cách.</p>
        </div>
        <div class="wb-controls-row">
          <select class="wb-select" id="wb-fc-mode">
            <option value="all" ${app.ui.fcMode === "all" ? "selected" : ""}>Tất cả thẻ học</option>
            <option value="due" ${app.ui.fcMode === "due" ? "selected" : ""}>Cần ôn lại (SRS)</option>
            <option value="known" ${app.ui.fcMode === "known" ? "selected" : ""}>Đã biết (${knownCnt})</option>
          </select>
          <select class="wb-select" id="wb-domain-filter">
            <option value="all">Tất cả lĩnh vực</option>
            ${(app.data.specialties || []).map((d) => `<option value="${d.id}" ${String(app.domainFilter) === String(d.id) ? "selected" : ""}>${esc(d.name_vi)}</option>`).join("")}
          </select>
        </div>
      </div>

      ${!card ? `
        <div class="wb-empty">
          <p style="margin:0 0 0.75rem;">Chưa có thẻ nào trong nhóm lọc này.</p>
          <button type="button" class="wb-btn wb-btn-primary" id="wb-fc-reset-filter">Quay về toàn bộ bộ thẻ</button>
        </div>
      ` : `
        <div style="max-width:680px;margin:0 auto;">
          <div style="display:flex;justify-content:space-between;font-size:0.86rem;color:var(--ink-secondary);margin-bottom:0.65rem;">
            <span>Thẻ ${app.ui.fcIndex + 1} / ${pool.length}</span>
            <span>Đã biết: <strong>${knownCnt}</strong> · Cần ôn lại: <strong>${againCnt}</strong></span>
          </div>

          <div class="wb-flashcard" id="wb-fc-card" role="button" tabindex="0" aria-label="Lật thẻ Flashcard">
            <div style="display:flex;gap:0.4rem;margin-bottom:0.5rem;">
              <span class="wb-pill">${esc(card.pos)}</span>
              <span class="wb-pill wb-pill-ivory">${esc(card.level_en)} · ${esc(card.level_zh)}</span>
              <span class="wb-pill wb-pill-ivory">${esc(card.topic)}</span>
            </div>

            ${!app.ui.fcFlipped ? `
              <div class="wb-fc-word">${esc(card.en)}</div>
              <div class="wb-fc-phonetic">${esc(card.ipa)}</div>
              <div class="wb-fc-zh" style="margin-top:0.5rem;">${esc(card.zh)}</div>
              <div class="wb-fc-phonetic">${esc(card.pinyin)}</div>
              <p style="margin-top:1.25rem;font-size:0.84rem;color:var(--ink-muted);">Bấm vào thẻ để lật xem nghĩa tiếng Việt và câu ví dụ</p>
            ` : `
              <div style="font-size:1.45rem;font-weight:800;color:var(--brand-teal);margin:0.4rem 0;">${esc(card.vi)}</div>
              <div style="font-size:0.95rem;color:var(--ink-secondary);margin-bottom:1rem;">${esc(card.en)} (${esc(card.ipa)}) · ${esc(card.zh)} (${esc(card.pinyin)})</div>
              <div style="text-align:left;width:100%;background:#f7fafa;border:1px solid var(--border-subtle);border-radius:10px;padding:0.9rem;font-size:0.9rem;">
                <div><strong>EN:</strong> ${esc(card.example_en)}</div>
                <div style="margin-top:0.25rem;"><strong>ZH:</strong> ${esc(card.example_zh)} <span style="color:var(--ink-muted);">(${esc(card.example_pinyin)})</span></div>
                <div style="margin-top:0.25rem;color:var(--ink-secondary);"><strong>VI:</strong> ${esc(card.example_vi)}</div>
              </div>
            `}
          </div>

          <div class="wb-controls-row" style="justify-content:center;margin-top:1.1rem;">
            <button type="button" class="wb-btn wb-btn-outline" id="wb-fc-flip">Lật thẻ</button>
            <button type="button" class="wb-btn wb-btn-accent" id="wb-fc-again" data-id="${esc(card.id)}">Chưa biết · Học lại</button>
            <button type="button" class="wb-btn wb-btn-primary" id="wb-fc-known" data-id="${esc(card.id)}">Đã biết (SRS)</button>
            <button type="button" class="wb-btn wb-btn-outline" id="wb-fc-next">Thẻ tiếp</button>
          </div>
        </div>
      `}
    `;
  }

  // ==================== 12. MY MISTAKES & 13. PRACTICE INSIGHTS ====================
  function renderMistakes() {
    const open = app.state.mistakes.filter((m) => !m.resolved);
    const resolved = app.state.mistakes.filter((m) => m.resolved);

    return `
      <div class="wb-page-head">
        <div>
          <h1>My Mistakes</h1>
          <p>Tổng hợp các lỗi bạn thực sự gặp trong quá trình làm bài nghe, đọc, ngữ pháp và bài tập để luyện lại có mục tiêu.</p>
        </div>
      </div>

      ${app.state.mistakes.length === 0 ? `
        <div class="wb-empty">
          <p style="margin:0 0 0.75rem;">Chưa có lỗi nào được ghi nhận. Hệ thống chỉ lưu các lỗi thực tế phát sinh khi bạn nộp bài luyện tập.</p>
          <button type="button" class="wb-btn wb-btn-primary" data-jump="practice:exercises">Làm bài tập thực hành</button>
        </div>
      ` : `
        <div class="wb-panel">
          <h2 class="wb-panel-title">Lỗi cần khắc phục (${open.length})</h2>
          ${open.length === 0 ? `<p style="color:var(--ink-secondary);">Bạn đã đánh dấu khắc phục toàn bộ lỗi hiện có.</p>` : open.map((m) => `
            <div style="border:1px solid var(--border-subtle);border-radius:10px;padding:0.9rem;margin-bottom:0.7rem;">
              <div style="display:flex;justify-content:space-between;align-items:center;gap:0.5rem;">
                <div><span class="wb-pill wb-pill-alert">${esc(m.skill)}</span> <span class="wb-list-item-meta">Lặp lại ${m.occurrenceCount} lần</span></div>
                <div class="wb-controls-row">
                  <button type="button" class="wb-btn wb-btn-ghost" data-open-activity="${esc(m.skill)}::${esc(m.sourceId)}">Luyện lại</button>
                  <button type="button" class="wb-btn wb-btn-outline" data-resolve-mistake="${esc(m.id)}">Đánh dấu đã khắc phục</button>
                </div>
              </div>
              <p style="margin:0.5rem 0 0.3rem;font-weight:600;">${esc(m.promptExcerpt)}</p>
              <div style="font-size:0.88rem;">Câu trả lời của bạn: <strong style="color:var(--brand-vermilion);">${esc(m.userAnswer || "(Trống)")}</strong> · Đáp án đúng: <strong style="color:var(--brand-teal);">${esc(m.expectedAnswer)}</strong></div>
              ${m.explanationVi ? `<div style="font-size:0.86rem;color:var(--ink-secondary);margin-top:0.25rem;">Giải thích: ${esc(m.explanationVi)}</div>` : ""}
            </div>
          `).join("")}
        </div>
        ${resolved.length > 0 ? `
          <div class="wb-panel">
            <h2 class="wb-panel-title">Đã khắc phục (${resolved.length})</h2>
            ${resolved.slice(0, 10).map((m) => `<div style="padding:0.45rem 0;border-bottom:1px solid var(--border-subtle);font-size:0.88rem;color:var(--ink-secondary);">[${esc(m.skill)}] ${esc(m.promptExcerpt)} — Đáp án: ${esc(m.expectedAnswer)}</div>`).join("")}
          </div>
        ` : ""}
      `}
    `;
  }

  function renderInsights() {
    const sessions = app.state.sessions;
    if (sessions.length === 0) {
      return `
        <div class="wb-page-head">
          <div>
            <h1>Practice Insights</h1>
            <p>Phản ánh hoạt động học tập thực tế, mức độ hoàn thành và xu hướng tiến bộ dựa trên dữ liệu làm bài của chính bạn.</p>
          </div>
        </div>
        <div class="wb-empty">
          <p style="margin:0 0 0.75rem;">Chưa có dữ liệu luyện tập thực tế để thống kê. Hoàn thành ít nhất một bài Nghe, Nói, Đọc, Viết, Ngữ pháp hoặc Flashcard để bắt đầu theo dõi.</p>
          <button type="button" class="wb-btn wb-btn-primary" data-jump="practice:reading">Bắt đầu bài luyện đọc đầu tiên</button>
        </div>
      `;
    }

    const bySkill = {};
    let totalScore = 0, totalMax = 0;
    sessions.forEach((s) => {
      bySkill[s.skill] = (bySkill[s.skill] || 0) + 1;
      if (s.score !== null && s.maxScore) {
        totalScore += s.score;
        totalMax += s.maxScore;
      }
    });
    const avgPct = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : null;

    return `
      <div class="wb-page-head">
        <div>
          <h1>Practice Insights</h1>
          <p>Thống kê hoàn toàn từ lịch sử luyện tập thực tế của bạn trên thiết bị này.</p>
        </div>
      </div>

      <div class="wb-grid-3" style="margin-bottom:1rem;">
        <div class="wb-panel">
          <div class="wb-list-item-meta">Tổng phiên đã hoàn thành</div>
          <div style="font-size:1.65rem;font-weight:800;color:var(--brand-teal);">${sessions.length}</div>
        </div>
        <div class="wb-panel">
          <div class="wb-list-item-meta">Kỹ năng đã luyện</div>
          <div style="font-size:1.65rem;font-weight:800;color:var(--brand-teal);">${Object.keys(bySkill).length}</div>
        </div>
        <div class="wb-panel">
          <div class="wb-list-item-meta">Tỷ lệ chính xác trung bình</div>
          <div style="font-size:1.65rem;font-weight:800;color:var(--brand-teal);">${avgPct !== null ? avgPct + "%" : "Chưa có bài chấm điểm"}</div>
        </div>
      </div>

      <div class="wb-grid-2">
        <div class="wb-panel">
          <h2 class="wb-panel-title">Phân bổ theo kỹ năng</h2>
          ${Object.entries(bySkill).map(([k, v]) => {
            const pct = Math.round((v / sessions.length) * 100);
            return `
              <div style="margin-bottom:0.75rem;">
                <div style="display:flex;justify-content:space-between;font-size:0.88rem;margin-bottom:0.25rem;">
                  <strong style="text-transform:capitalize;">${esc(k)}</strong>
                  <span>${v} lượt (${pct}%)</span>
                </div>
                <div class="wb-progress-track"><div class="wb-progress-fill" style="width:${pct}%"></div></div>
              </div>
            `;
          }).join("")}
        </div>
        <div class="wb-panel">
          <h2 class="wb-panel-title">Lịch sử luyện tập gần đây</h2>
          ${sessions.slice(0, 8).map((s) => `
            <div style="padding:0.5rem 0;border-bottom:1px solid var(--border-subtle);font-size:0.88rem;display:flex;justify-content:space-between;">
              <span><strong>${esc(s.skill)}</strong> · ${esc(s.sourceId)}</span>
              <span class="wb-list-item-meta">${s.score !== null && s.maxScore ? s.score + "/" + s.maxScore + "đ" : "Hoàn thành"}</span>
            </div>
          `).join("")}
        </div>
      </div>
    `;
  }

  // ==================== 14. SPECIALTIES (40 Domains) ====================
  function renderSpecialties() {
    const domains = app.data.specialties || [];
    const active = domains.find((d) => String(d.id) === String(app.selected.domainId)) || domains[0];
    if (active) app.selected.domainId = active.id;
    const relatedVocab = active ? (app.data.vocabulary || []).filter((v) => Number(v.domain) === Number(active.id)).slice(0, 8) : [];

    return `
      <div class="wb-page-head">
        <div>
          <h1>Ngôn ngữ chuyên ngành</h1>
          <p>Khám phá 40 lĩnh vực chuyên môn với thuật ngữ đối chiếu Anh – Trung giản thể – Việt phục vụ đọc hiểu và giao tiếp công việc.</p>
        </div>
      </div>

      <div class="wb-workspace">
        <aside class="wb-list-sidebar">
          <div class="wb-list-head">40 lĩnh vực chuyên môn</div>
          <div class="wb-list-scroll">
            ${domains.map((d) => `
              <button type="button" class="wb-list-item ${active && d.id === active.id ? "active" : ""}" data-select-domain="${d.id}">
                <div class="wb-list-item-title">${d.id}. ${esc(d.name_vi)}</div>
              </button>
            `).join("")}
          </div>
        </aside>

        <div>
          ${active ? `
            <div class="wb-panel">
              <h2 style="margin:0 0 0.4rem;">${esc(active.name_vi)}</h2>
              <p style="margin:0 0 0.85rem;color:var(--ink-secondary);">${esc(active.description_vi)}</p>
              <div style="display:flex;flex-wrap:wrap;gap:0.4rem;margin-bottom:1rem;">
                ${(active.subspecialties_vi || []).map((s) => `<span class="wb-pill wb-pill-ivory">${esc(s)}</span>`).join("")}
              </div>
              <div class="wb-controls-row">
                <button type="button" class="wb-btn wb-btn-primary" data-domain-to-dict="${active.id}">Tra từ điển lĩnh vực này</button>
                <button type="button" class="wb-btn wb-btn-outline" data-domain-to-fc="${active.id}">Học Flashcard lĩnh vực này</button>
              </div>
            </div>

            <div class="wb-panel">
              <h3 class="wb-panel-title">Thuật ngữ tiêu biểu trong lĩnh vực</h3>
              <div class="wb-grid-2">
                ${relatedVocab.map((v) => `
                  <div style="border:1px solid var(--border-subtle);border-radius:10px;padding:0.8rem;">
                    <div style="font-weight:700;color:var(--brand-teal);">${esc(v.en)} <span class="wb-list-item-meta">${esc(v.ipa)}</span></div>
                    <div>${esc(v.zh)} <span class="wb-list-item-meta">${esc(v.pinyin)}</span></div>
                    <div style="font-size:0.9rem;margin-top:0.25rem;">${esc(v.vi)}</div>
                  </div>
                `).join("")}
              </div>
            </div>
          ` : ""}
        </div>
      </div>
    `;
  }

  function renderMain() {
    const mainEl = document.getElementById("wb-main");
    let html = "";
    switch (app.sub) {
      case "overview": html = renderOverview(); break;
      case "courses": html = renderCourses(); break;
      case "listening": html = renderListening(); break;
      case "speaking": html = renderSpeaking(); break;
      case "reading": html = renderReading(); break;
      case "writing": html = renderWriting(); break;
      case "pronunciation": html = renderPronunciation(); break;
      case "grammar": html = renderGrammar(); break;
      case "exercises": html = renderExercises(); break;
      case "assessments": html = renderAssessments(); break;
      case "dictionary": html = renderDictionary(); break;
      case "myvocab": html = renderMyVocab(); break;
      case "flashcards": html = renderFlashcards(); break;
      case "mistakes": html = renderMistakes(); break;
      case "insights": html = renderInsights(); break;
      case "domains": html = renderSpecialties(); break;
      default: html = renderOverview();
    }
    mainEl.innerHTML = html;
    bindViewEvents();
  }

  function bindViewEvents() {
    const main = document.getElementById("wb-main");

    // Language & Domain filters
    const langSel = document.getElementById("wb-lang-filter");
    if (langSel) langSel.addEventListener("change", (e) => { app.langFilter = e.target.value; render(); });

    const domSel = document.getElementById("wb-domain-filter");
    if (domSel) domSel.addEventListener("change", (e) => { app.domainFilter = e.target.value; app.ui.dictPage = 1; app.ui.fcIndex = 0; render(); });

    const fcModeSel = document.getElementById("wb-fc-mode");
    if (fcModeSel) fcModeSel.addEventListener("change", (e) => { app.ui.fcMode = e.target.value; app.ui.fcIndex = 0; app.ui.fcFlipped = false; render(); });

    const dictSearch = document.getElementById("wb-dict-search");
    if (dictSearch) dictSearch.addEventListener("input", (e) => { app.searchQuery = e.target.value; app.ui.dictPage = 1; renderMain(); });

    // Listening form
    const lForm = document.getElementById("wb-listening-form");
    if (lForm) {
      lForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const item = app.data.listening.find((x) => x.id === lForm.dataset.id);
        let correct = 0;
        (item.questions || []).forEach((q, qi) => {
          const picked = lForm.querySelector(`input[name="lq_${qi}"]:checked`);
          const fb = document.getElementById(`wb-lq-fb-${qi}`);
          const ansIdx = q.correct_index;
          if (picked && Number(picked.value) === ansIdx) {
            correct++;
            fb.innerHTML = `<span style="color:#1c7c54;font-weight:600;">Chính xác.</span> ${esc(q.explanation || "")}`;
          } else {
            const userTxt = picked ? q.options[Number(picked.value)] : "(Chưa chọn)";
            fb.innerHTML = `<span style="color:var(--brand-vermilion);font-weight:600;">Chưa đúng.</span> Đáp án: <strong>${esc(q.options[ansIdx])}</strong>. ${esc(q.explanation || "")}`;
            logMistake("listening", item.id, item.language, q.prompt, userTxt, q.options[ansIdx], q.explanation);
          }
        });
        logSession("listening", item.id, item.language, item.domain, correct, (item.questions || []).length);
        document.getElementById("wb-listening-result").innerHTML = `<div class="wb-callout">Kết quả: <strong>${correct} / ${(item.questions || []).length}</strong> câu đúng. Lịch sử đã được lưu vào Practice Insights.</div>`;
      });
    }

    // Reading form
    const rForm = document.getElementById("wb-reading-form");
    if (rForm) {
      rForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const item = app.data.reading.find((x) => x.id === rForm.dataset.id);
        let correct = 0;
        (item.questions || []).forEach((q, qi) => {
          const picked = rForm.querySelector(`input[name="rq_${qi}"]:checked`);
          const fb = document.getElementById(`wb-rq-fb-${qi}`);
          const ansIdx = q.correct_index;
          if (picked && Number(picked.value) === ansIdx) {
            correct++;
            fb.innerHTML = `<span style="color:#1c7c54;font-weight:600;">Chính xác.</span> ${esc(q.explanation || "")}`;
          } else {
            const userTxt = picked ? q.options[Number(picked.value)] : "(Chưa chọn)";
            fb.innerHTML = `<span style="color:var(--brand-vermilion);font-weight:600;">Chưa đúng.</span> Đáp án: <strong>${esc(q.options[ansIdx])}</strong>. ${esc(q.explanation || "")}`;
            logMistake("reading", item.id, item.language, q.prompt, userTxt, q.options[ansIdx], q.explanation);
          }
        });
        logSession("reading", item.id, item.language, item.domain, correct, (item.questions || []).length);
        document.getElementById("wb-reading-result").innerHTML = `<div class="wb-callout">Kết quả đọc hiểu: <strong>${correct} / ${(item.questions || []).length}</strong> câu đúng.</div>`;
      });
    }

    // Writing live word counter
    const wDraft = document.getElementById("wb-writing-draft");
    if (wDraft) {
      wDraft.addEventListener("input", () => {
        const item = app.data.writing.find((x) => x.id === app.selected.writingId);
        const val = wDraft.value;
        const cnt = item && item.language === "zh" ? val.replace(/\s+/g, "").length : (val.trim() ? val.trim().split(/\s+/).length : 0);
        const unit = item && item.language === "zh" ? "ký tự" : "từ";
        const el = document.getElementById("wb-word-counter");
        if (el) el.textContent = `${cnt} ${unit} (Gợi ý: ${item ? item.suggested_length : ""})`;
      });
    }

    // Delegated click handler inside main
    main.onclick = (e) => {
      const btn = e.target.closest("button, #wb-fc-card");
      if (!btn) return;

      if (btn.dataset.jump) {
        const [g, s] = btn.dataset.jump.split(":");
        navigate(g, s);
        return;
      }
      if (btn.dataset.openCourse) { navigate("hub", "courses", btn.dataset.openCourse); return; }
      if (btn.dataset.selectCourse) { app.selected.courseId = btn.dataset.selectCourse; renderMain(); return; }
      if (btn.dataset.selectListening) { app.selected.listeningId = btn.dataset.selectListening; app.ui.showTranscript = false; renderMain(); return; }
      if (btn.dataset.selectSpeaking) { app.selected.speakingId = btn.dataset.selectSpeaking; app.ui.showModelDialogue = false; recorder.reset(null); renderMain(); return; }
      if (btn.dataset.selectReading) { app.selected.readingId = btn.dataset.selectReading; app.ui.showReadingTrans = false; renderMain(); return; }
      if (btn.dataset.selectWriting) { app.selected.writingId = btn.dataset.selectWriting; app.ui.showWritingModel = false; renderMain(); return; }
      if (btn.dataset.selectPron) { app.selected.pronunciationId = btn.dataset.selectPron; recorder.reset(null); renderMain(); return; }
      if (btn.dataset.selectGrammar) { app.selected.grammarId = btn.dataset.selectGrammar; renderMain(); return; }
      if (btn.dataset.selectEx) { app.selected.exerciseId = btn.dataset.selectEx; renderMain(); return; }
      if (btn.dataset.selectAs) { app.selected.assessmentId = btn.dataset.selectAs; renderMain(); return; }
      if (btn.dataset.selectDomain) { app.selected.domainId = btn.dataset.selectDomain; renderMain(); return; }

      if (btn.dataset.openActivity) {
        const [mod, sid] = btn.dataset.openActivity.split("::");
        const map = { listening: "practice", speaking: "practice", reading: "practice", writing: "practice", pronunciation: "practice", grammar: "practice", exercises: "practice", assessments: "practice" };
        if (map[mod]) navigate(map[mod], mod, sid);
        else showToast("Bài học tích hợp " + sid + " nằm trong gói học liệu lessons.");
        return;
      }

      if (btn.id === "wb-enroll-course") {
        const cid = btn.dataset.courseId;
        if (!app.state.courseProgress[cid]) {
          app.state.courseProgress[cid] = { completedLessons: [], startedAt: new Date().toISOString() };
          saveState();
          showToast("Đã bắt đầu khóa học. Tiến độ sẽ được tự động lưu.");
          renderMain();
        }
        return;
      }

      if (btn.dataset.toggleLesson) {
        const [cid, lid] = btn.dataset.toggleLesson.split("::");
        if (!app.state.courseProgress[cid]) app.state.courseProgress[cid] = { completedLessons: [], startedAt: new Date().toISOString() };
        const arr = app.state.courseProgress[cid].completedLessons;
        const idx = arr.indexOf(lid);
        if (idx >= 0) arr.splice(idx, 1);
        else { arr.push(lid); logSession("course", lid, "en", 1, 1, 1); }
        saveState();
        renderMain();
        return;
      }

      if (btn.id === "wb-toggle-transcript") { app.ui.showTranscript = !app.ui.showTranscript; renderMain(); return; }
      if (btn.id === "wb-toggle-model-dialogue") { app.ui.showModelDialogue = !app.ui.showModelDialogue; renderMain(); return; }
      if (btn.id === "wb-toggle-reading-trans") { app.ui.showReadingTrans = !app.ui.showReadingTrans; renderMain(); return; }
      if (btn.id === "wb-toggle-writing-model") { app.ui.showWritingModel = !app.ui.showWritingModel; renderMain(); return; }

      // Real Micro Recorder controls
      if (btn.id === "wb-rec-start") { recorder.start(btn.dataset.owner, renderMain); return; }
      if (btn.id === "wb-rec-stop") { recorder.stop(renderMain); return; }
      if (btn.id === "wb-rec-play") { recorder.play(renderMain); return; }
      if (btn.id === "wb-rec-clear") { recorder.remove(recorder.ownerKey, renderMain); return; }

      if (btn.id === "wb-complete-speaking") {
        const item = app.data.speaking.find((x) => x.id === btn.dataset.id);
        const checked = document.querySelectorAll(".wb-sp-check:checked").length;
        const total = document.querySelectorAll(".wb-sp-check").length;
        logSession("speaking", item.id, item.language, item.domain, checked, total);
        showToast("Đã ghi nhận lượt luyện nói (" + checked + "/" + total + " tiêu chí tự đánh giá).");
        return;
      }

      if (btn.id === "wb-save-draft" || btn.id === "wb-submit-writing") {
        const wid = btn.dataset.id;
        const outline = (document.getElementById("wb-writing-outline") || {}).value || "";
        const draft = (document.getElementById("wb-writing-draft") || {}).value || "";
        app.state.writingDrafts[wid] = { outline, draft, submittedAt: btn.id === "wb-submit-writing" ? new Date().toISOString() : null };
        saveState();
        if (btn.id === "wb-submit-writing") {
          const item = app.data.writing.find((x) => x.id === wid);
          logSession("writing", wid, item.language, item.domain, null, null);
          app.ui.showWritingModel = true;
          showToast("Đã nộp bài viết và mở bài mẫu đối chiếu.");
          renderMain();
        } else {
          showToast("Đã lưu bản nháp bài viết.");
        }
        return;
      }

      if (btn.id === "wb-check-pron") {
        const item = app.data.pronunciation.find((x) => x.id === btn.dataset.id);
        const ans = ((document.getElementById("wb-pron-input") || {}).value || "").trim();
        const isOk = ans && item.answer.toLowerCase().includes(ans.toLowerCase());
        if (!isOk) logMistake("pronunciation", item.id, item.language, item.task, ans, item.answer, item.explanation);
        logSession("pronunciation", item.id, item.language, item.domain, isOk ? 1 : 0, 1);
        document.getElementById("wb-pron-result").innerHTML = `<div class="wb-callout ${isOk ? "" : "wb-callout-warn"}"><strong>${isOk ? "Chính xác!" : "Cần đối chiếu lại:"}</strong> Đáp án: <strong>${esc(item.answer)}</strong>. ${esc(item.explanation)}</div>`;
        return;
      }

      if (btn.id === "wb-check-grammar") {
        const item = app.data.grammar.find((x) => x.id === btn.dataset.id);
        const ans = ((document.getElementById("wb-grammar-input") || {}).value || "").trim();
        const isOk = ans && ans.toLowerCase() === item.answer.trim().toLowerCase();
        if (!isOk) logMistake("grammar", item.id, item.language, item.task, ans, item.answer, item.explanation);
        logSession("grammar", item.id, item.language, item.domain, isOk ? 1 : 0, 1);
        document.getElementById("wb-grammar-result").innerHTML = `<div class="wb-callout ${isOk ? "" : "wb-callout-warn"}"><strong>${isOk ? "Chính xác!" : "Chưa chính xác."}</strong> Đáp án: <strong>${esc(item.answer)}</strong>. ${esc(item.explanation)}</div>`;
        return;
      }

      if (btn.id === "wb-check-ex") {
        const item = app.data.exercises.find((x) => x.id === btn.dataset.id);
        let ans = "";
        if (item.options && item.options.length) {
          const picked = document.querySelector('input[name="wb_ex_opt"]:checked');
          ans = picked ? picked.value : "";
        } else {
          ans = ((document.getElementById("wb-ex-text") || {}).value || "").trim();
        }
        const isOk = ans && ans.trim().toLowerCase() === String(item.answer).trim().toLowerCase();
        if (!isOk) logMistake("exercises", item.id, item.language, item.task, ans, String(item.answer), item.explanation);
        logSession("exercises", item.id, item.language, item.domain, isOk ? 1 : 0, 1);
        document.getElementById("wb-ex-result").innerHTML = `<div class="wb-callout ${isOk ? "" : "wb-callout-warn"}"><strong>${isOk ? "Chính xác!" : "Đối chiếu đáp án:"}</strong> ${esc(item.answer)}. ${esc(item.explanation)}</div>`;
        return;
      }

      if (btn.id === "wb-submit-as") {
        const item = app.data.assessments.find((x) => x.id === btn.dataset.id);
        let score = 0;
        document.querySelectorAll(".wb-as-crit:checked").forEach((c) => { score += Number(c.value || 1); });
        logSession("assessments", item.id, item.language, item.domain, score, item.max_score);
        const ansStr = Array.isArray(item.answer) ? item.answer.join(" | ") : String(item.answer);
        document.getElementById("wb-as-result").innerHTML = `<div class="wb-callout"><strong>Điểm tự đối chiếu: ${score}/${item.max_score}.</strong><br>Đáp án chuẩn: ${esc(ansStr)}<br>Giải thích: ${esc(item.explanation)}</div>`;
        return;
      }

      if (btn.dataset.saveVocab) {
        const v = app.data.vocabulary.find((x) => x.id === btn.dataset.saveVocab);
        if (v) saveToMyVocab(v);
        return;
      }
      if (btn.dataset.removeVocab) {
        app.state.myVocab = app.state.myVocab.filter((m) => m.entryId !== btn.dataset.removeVocab);
        saveState();
        showToast("Đã gỡ khỏi từ vựng cá nhân.");
        renderMain();
        return;
      }
      if (btn.id === "wb-add-set") {
        const inp = document.getElementById("wb-new-set-name");
        const val = (inp ? inp.value : "").trim();
        if (val && !app.state.vocabSets.includes(val)) {
          app.state.vocabSets.push(val);
          saveState();
          showToast("Đã tạo bộ từ \"" + val + "\".");
          renderMain();
        }
        return;
      }
      if (btn.id === "wb-dict-prev") { app.ui.dictPage = Math.max(1, app.ui.dictPage - 1); renderMain(); return; }
      if (btn.id === "wb-dict-next") { app.ui.dictPage += 1; renderMain(); return; }

      // Flashcards & SM-2 SRS
      if (btn.id === "wb-fc-card" || btn.id === "wb-fc-flip") { app.ui.fcFlipped = !app.ui.fcFlipped; renderMain(); return; }
      if (btn.id === "wb-fc-next") { app.ui.fcIndex += 1; app.ui.fcFlipped = false; renderMain(); return; }
      if (btn.id === "wb-fc-reset-filter") { app.ui.fcMode = "all"; app.domainFilter = "all"; app.ui.fcIndex = 0; renderMain(); return; }
      if (btn.id === "wb-fc-known" || btn.id === "wb-fc-again") {
        const cid = btn.dataset.id;
        const prev = app.state.flashcardSrs[cid] || { ease: 2.5, interval: 0, reps: 0 };
        if (btn.id === "wb-fc-known") {
          const reps = prev.reps + 1;
          const interval = reps === 1 ? 1 : (reps === 2 ? 6 : Math.round(prev.interval * prev.ease));
          app.state.flashcardSrs[cid] = {
            state: "KNOWN",
            ease: Math.max(1.3, prev.ease + 0.1),
            interval,
            reps,
            nextReviewAt: new Date(Date.now() + interval * 86400000).toISOString()
          };
          logSession("flashcard", cid, "en-zh", 1, 1, 1);
          showToast("Đã đánh dấu Đã biết · Ôn lại sau " + interval + " ngày.");
        } else {
          app.state.flashcardSrs[cid] = {
            state: "REVIEW_AGAIN",
            ease: Math.max(1.3, prev.ease - 0.2),
            interval: 0,
            reps: 0,
            nextReviewAt: new Date().toISOString()
          };
          logSession("flashcard", cid, "en-zh", 1, 0, 1);
          showToast("Đã đánh dấu Chưa biết · Đưa vào danh sách cần ôn lại.");
        }
        saveState();
        app.ui.fcIndex += 1;
        app.ui.fcFlipped = false;
        renderMain();
        return;
      }

      if (btn.dataset.resolveMistake) {
        const m = app.state.mistakes.find((x) => x.id === btn.dataset.resolveMistake);
        if (m) { m.resolved = true; saveState(); showToast("Đã đánh dấu khắc phục lỗi."); renderMain(); }
        return;
      }
      if (btn.dataset.domainToDict) { app.domainFilter = btn.dataset.domainToDict; navigate("vocab", "dictionary"); return; }
      if (btn.dataset.domainToFc) { app.domainFilter = btn.dataset.domainToFc; navigate("vocab", "flashcards"); return; }
    };
  }

  function render() {
    renderNav();
    renderMain();
  }

  async function loadModularData() {
    if (window.WB_BOOTSTRAP_DATA) return window.WB_BOOTSTRAP_DATA;
    const base = "../data/";
    const fetchJson = (p) => fetch(base + p).then((r) => r.json());
    const [
      courses, listening, speaking, reading, writing, grammar, pronunciation,
      exercises, assessments, specialties, audioBindings,
      fc1, fc2, fc3, fc4,
      v1, v2, v3, v4, v5, v6, v7, v8, v9, v10
    ] = await Promise.all([
      fetchJson("courses/courses-001.json"),
      fetchJson("listening/listening-001.json"),
      fetchJson("speaking/speaking-001.json"),
      fetchJson("reading/reading-001.json"),
      fetchJson("writing/writing-001.json"),
      fetchJson("grammar/grammar-001.json"),
      fetchJson("pronunciation/pronunciation-001.json"),
      fetchJson("exercises/exercises-001.json"),
      fetchJson("assessments/assessments-001.json"),
      fetchJson("specialties/domains.json"),
      fetchJson("audio/audio-manifest.json"),
      fetchJson("flashcards/flashcards-001.json"),
      fetchJson("flashcards/flashcards-002.json"),
      fetchJson("flashcards/flashcards-003.json"),
      fetchJson("flashcards/flashcards-004.json"),
      fetchJson("vocabulary/vocabulary-001.json"),
      fetchJson("vocabulary/vocabulary-002.json"),
      fetchJson("vocabulary/vocabulary-003.json"),
      fetchJson("vocabulary/vocabulary-004.json"),
      fetchJson("vocabulary/vocabulary-005.json"),
      fetchJson("vocabulary/vocabulary-006.json"),
      fetchJson("vocabulary/vocabulary-007.json"),
      fetchJson("vocabulary/vocabulary-008.json"),
      fetchJson("vocabulary/vocabulary-009.json"),
      fetchJson("vocabulary/vocabulary-010.json")
    ]);
    return {
      courses, listening, speaking, reading, writing, grammar, pronunciation,
      exercises, assessments, specialties, audioBindings,
      flashcards: [...fc1, ...fc2, ...fc3, ...fc4],
      vocabulary: [...v1, ...v2, ...v3, ...v4, ...v5, ...v6, ...v7, ...v8, ...v9, ...v10]
    };
  }

  function initShellEvents() {
    document.getElementById("wb-brand-home").addEventListener("click", () => navigate("hub", "overview"));
    document.getElementById("wb-mobile-toggle").addEventListener("click", () => {
      app.ui.mobileNavOpen = !app.ui.mobileNavOpen;
      renderNav();
    });
    document.getElementById("wb-nav").addEventListener("click", (e) => {
      const b = e.target.closest("[data-nav-group]");
      if (b) navigate(b.dataset.navGroup);
    });
    document.getElementById("wb-subnav").addEventListener("click", (e) => {
      const b = e.target.closest("[data-nav-sub]");
      if (b) navigate(app.group, b.dataset.navSub);
    });
  }

  window.addEventListener("DOMContentLoaded", async () => {
    initShellEvents();
    try {
      app.data = await loadModularData();
      render();
    } catch (err) {
      document.getElementById("wb-main").innerHTML = `<div class="wb-empty">Không thể tải dữ liệu học liệu. Vui lòng chạy qua máy chủ HTTP cục bộ hoặc Cloudflare Worker.</div>`;
    }
  });
})();
