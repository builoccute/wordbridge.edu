/* ==========================================================================
   WORD BRIDGE — Unified Learning Hub Application (v0.9.0)
   Fixes all v0.8.0 defects:
   - Skill-specific layouts (Listening, Speaking Studio, Reading Split, Writing Desk, Pronunciation Lab)
   - Full 4-group navigation (Section V.2) + mobile responsive drawer
   - Real MediaRecorder 7-state machine with live timer (Speaking & Pronunciation)
   - Fixes q.explanation_vi in Listening/Reading, search input focus loss,
     course integrated lessons (40 lessons + 770 examples loaded),
     specialty term saving with normalized entryId/domain/term,
     Flashcard session resume & history, honest D1 sync vs localStorage status.
   ========================================================================== */
(function () {
  "use strict";

  const Adapter = window.WBApiAdapter;

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

  function formatDuration(sec) {
    const s = Math.max(0, Math.floor(sec || 0));
    const mm = String(Math.floor(s / 60)).padStart(2, "0");
    const ss = String(s % 60).padStart(2, "0");
    return mm + ":" + ss;
  }

  function formatShortDate(iso) {
    if (!iso) return "";
    try {
      const d = new Date(iso);
      return d.toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
    } catch (e) {
      return String(iso).slice(0, 16);
    }
  }

  // ==================== REAL MEDIARECORDER 7-STATE MACHINE ====================
  // States: IDLE | REQUESTING_PERMISSION | RECORDING | STOPPED | PLAYING | ERROR | PERMISSION_DENIED
  const REC_STATUS_LABELS = {
    IDLE: "Sẵn sàng ghi âm (IDLE)",
    REQUESTING_PERMISSION: "Đang xin quyền truy cập Micro...",
    RECORDING: "Đang ghi âm thực tế...",
    STOPPED: "Đã dừng ghi âm — sẵn sàng nghe lại",
    PLAYING: "Đang phát lại bản ghi của bạn",
    PERMISSION_DENIED: "Quyền Micro bị từ chối (PERMISSION_DENIED)",
    ERROR: "Lỗi thiết bị hoặc trình duyệt không hỗ trợ ghi âm"
  };

  const recorder = {
    status: "IDLE",
    mediaRecorder: null,
    stream: null,
    chunks: [],
    audioUrl: null,
    audioEl: null,
    errorMsg: "",
    ownerKey: null,
    elapsedSec: 0,
    timerId: null,

    stopTimer() {
      if (this.timerId) {
        clearInterval(this.timerId);
        this.timerId = null;
      }
    },

    reset(ownerKey) {
      this.stopTimer();
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
      this.elapsedSec = 0;
      this.ownerKey = ownerKey || null;
    },

    stopTracks() {
      if (this.stream) {
        this.stream.getTracks().forEach((t) => t.stop());
        this.stream = null;
      }
    },

    async start(ownerKey, onChange) {
      this.reset(ownerKey);
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || typeof MediaRecorder === "undefined") {
        this.status = "ERROR";
        this.errorMsg = "Trình duyệt hiện tại không hỗ trợ MediaRecorder. Vui lòng dùng Chrome, Edge hoặc Safari phiên bản mới qua HTTPS/localhost.";
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
          this.stopTimer();
          const mime = (this.mediaRecorder && this.mediaRecorder.mimeType) || "audio/webm";
          const blob = new Blob(this.chunks, { type: mime });
          if (this.audioUrl) URL.revokeObjectURL(this.audioUrl);
          this.audioUrl = URL.createObjectURL(blob);
          this.stopTracks();
          this.status = "STOPPED";
          onChange();
        };
        this.mediaRecorder.onerror = () => {
          this.stopTimer();
          this.stopTracks();
          this.status = "ERROR";
          this.errorMsg = "Có lỗi xảy ra trong quá trình ghi âm. Vui lòng thử lại.";
          onChange();
        };
        this.mediaRecorder.start();
        if (this.mediaRecorder.state === "recording") {
          this.status = "RECORDING";
          this.elapsedSec = 0;
          this.timerId = setInterval(() => {
            this.elapsedSec += 1;
            const tEl = document.getElementById("wb-rec-timer");
            if (tEl) tEl.textContent = formatDuration(this.elapsedSec);
          }, 1000);
        }
        onChange();
      } catch (err) {
        this.stopTimer();
        this.stopTracks();
        if (err && (err.name === "NotAllowedError" || err.name === "PermissionDeniedError")) {
          this.status = "PERMISSION_DENIED";
          this.errorMsg = "Quyền Micro đang bị từ chối. Bấm biểu tượng ổ khóa trên thanh địa chỉ → Micro → Cho phép, rồi thử lại.";
        } else {
          this.status = "ERROR";
          this.errorMsg = "Không tìm thấy thiết bị Micro khả dụng trên máy này.";
        }
        onChange();
      }
    },

    stop(onChange) {
      if (this.mediaRecorder && this.mediaRecorder.state === "recording") {
        this.mediaRecorder.stop();
      } else {
        this.stopTimer();
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
      this.audioEl.onerror = () => {
        this.status = "ERROR";
        this.errorMsg = "Không thể phát lại bản ghi trên trình duyệt này.";
        onChange();
      };
      this.audioEl.play().catch(() => {
        this.status = "ERROR";
        this.errorMsg = "Trình duyệt chặn tự động phát lại bản ghi.";
        onChange();
      });
    },

    remove(ownerKey, onChange) {
      this.reset(ownerKey);
      onChange();
    }
  };

  function renderRecorderBooth(ownerKey) {
    const isOwner = recorder.ownerKey === ownerKey;
    const st = isOwner ? recorder.status : "IDLE";
    const hasRec = isOwner && Boolean(recorder.audioUrl);
    const dotClass = st === "RECORDING" ? "recording" : (st === "PLAYING" ? "playing" : "");
    return `
      <div class="wb-recorder" data-rec-state="${st}">
        <div class="wb-rec-status">
          <div class="wb-rec-status-left">
            <span class="wb-rec-dot ${dotClass}"></span>
            <span>${esc(REC_STATUS_LABELS[st] || REC_STATUS_LABELS.IDLE)}</span>
          </div>
          <span class="wb-rec-timer" id="wb-rec-timer">${formatDuration(isOwner ? recorder.elapsedSec : 0)}</span>
        </div>
        ${isOwner && recorder.errorMsg ? `<div class="wb-callout wb-callout-warn" style="margin-bottom:0.75rem;">${esc(recorder.errorMsg)}</div>` : ""}
        <div class="wb-controls-row">
          <button type="button" class="wb-btn wb-btn-accent" id="wb-rec-start" data-owner="${esc(ownerKey)}" ${st === "RECORDING" || st === "REQUESTING_PERMISSION" ? "disabled" : ""}>
            ${hasRec ? "Ghi lại" : "Bắt đầu ghi âm"}
          </button>
          <button type="button" class="wb-btn wb-btn-outline" id="wb-rec-stop" ${st !== "RECORDING" ? "disabled" : ""}>Dừng</button>
          <button type="button" class="wb-btn wb-btn-ghost" id="wb-rec-play" ${!hasRec || st === "RECORDING" ? "disabled" : ""}>Nghe lại</button>
          <button type="button" class="wb-btn wb-btn-outline" id="wb-rec-clear" ${!hasRec || st === "RECORDING" ? "disabled" : ""}>Xóa bản ghi</button>
        </div>
        <p style="margin:0.65rem 0 0;font-size:0.8rem;color:var(--ink-muted);">Ghi âm thực tế bằng MediaRecorder trên trình duyệt; bản ghi lưu tạm tại máy để bạn tự đối chiếu (không giả lập chấm điểm AI).</p>
      </div>
    `;
  }

  // ==================== 4-GROUP NAVIGATION (Section V.2) ====================
  const NAV_GROUPS = [
    {
      id: "hub",
      label: "Trung tâm học tập",
      subs: [
        { id: "overview", label: "Tổng quan" },
        { id: "continue", label: "Tiếp tục học" },
        { id: "mycourses", label: "Khóa học của tôi" },
        { id: "courses", label: "Lộ trình" }
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
        { id: "assessments", label: "Đánh giá" },
        { id: "lessons", label: "Bài học tích hợp" }
      ]
    },
    {
      id: "vocab",
      label: "Từ vựng",
      subs: [
        { id: "dictionary", label: "Từ điển" },
        { id: "myvocab", label: "Sổ từ cá nhân" },
        { id: "vocabsets", label: "Bộ từ vựng" },
        { id: "flashcards", label: "Flashcard" },
        { id: "srs", label: "Ôn tập SRS" },
        { id: "domains", label: "Chuyên ngành" }
      ]
    },
    {
      id: "tracking",
      label: "Theo dõi học tập",
      subs: [
        { id: "mistakes", label: "My Mistakes" },
        { id: "insights", label: "Practice Insights" },
        { id: "history", label: "Lịch sử học tập" }
      ]
    }
  ];

  const app = {
    data: null,
    state: Adapter.loadLocalState(),
    group: "hub",
    sub: "overview",
    langFilter: "all",
    domainFilter: "all",
    pronCatFilter: "all",
    exFormatFilter: "all",
    vocabSetFilter: "all",
    historySkillFilter: "all",
    searchQuery: "",
    activeCourseContext: null, // { courseId, lessonId, activityId }
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
      lessonId: null,
      domainId: null
    },
    ui: {
      showTranscript: false,
      showModelDialogue: false,
      showWritingModel: false,
      showReadingTrans: false,
      readingFocus: false,
      readingFont: "md", // sm | md | lg
      fcIndex: 0,
      fcFlipped: false,
      srsIndex: 0,
      srsFlipped: false,
      dictPage: 1,
      selectedSaveSet: "Học hàng ngày",
      mobileNavOpen: false
    },
    toastTimer: null
  };

  // Restore saved Flashcard session position
  if (app.state.flashcardSession && typeof app.state.flashcardSession.lastIndex === "number") {
    app.ui.fcIndex = app.state.flashcardSession.lastIndex;
  }

  function persistState() {
    Adapter.saveLocalState(app.state);
  }

  function domainName(id) {
    const found = (app.data.specialties || []).find((d) => Number(d.id) === Number(id));
    return found ? found.name_vi : "Chủ đề tổng hợp";
  }

  function langLabel(code) {
    if (code === "en") return "Tiếng Anh";
    if (code === "zh" || code === "zh-CN") return "Tiếng Trung giản thể";
    return "Song ngữ EN – ZH";
  }

  function skillLabel(skill) {
    const map = {
      listening: "Nghe", speaking: "Nói", reading: "Đọc", writing: "Viết",
      pronunciation: "Phát âm", grammar: "Ngữ pháp", exercises: "Bài tập",
      assessments: "Đánh giá", lessons: "Bài học tích hợp", flashcard: "Flashcard", course: "Khóa học"
    };
    return map[skill] || skill;
  }

  function filterByLang(items) {
    if (app.langFilter === "all") return items;
    return items.filter((x) => {
      const lg = x.language || "en-zh";
      if (app.langFilter === "zh") return lg === "zh" || lg === "zh-CN";
      return lg === app.langFilter;
    });
  }

  function updateSyncBadge() {
    const badge = document.getElementById("wb-sync-badge");
    if (!badge) return;
    badge.textContent = Adapter.syncBadgeLabel();
    badge.className = "wb-sync-badge" + (Adapter.syncMode === "SYNCED_ACCOUNT" ? " synced" : "");
  }

  function logSession(skill, sourceId, language, domainId, score, maxScore, title) {
    const entry = {
      id: "SES-" + Date.now() + "-" + Math.floor(Math.random() * 1000),
      skill,
      sourceId,
      title: title || sourceId,
      language: language || "en",
      domainId: domainId || 1,
      score: score !== undefined ? score : null,
      maxScore: maxScore !== undefined ? maxScore : null,
      completedAt: new Date().toISOString()
    };
    app.state.sessions.unshift(entry);
    if (app.state.sessions.length > 300) app.state.sessions.length = 300;
    app.state.lastVisited = { group: app.group, sub: app.sub, sourceId, title: entry.title, at: entry.completedAt };
    if (app.activeCourseContext && app.activeCourseContext.courseId) {
      markCourseActivityDone(app.activeCourseContext.courseId, app.activeCourseContext.activityId || sourceId);
    }
    persistState();
    Adapter.pushEvent("/sessions", entry);
  }

  function logMistake(skill, sourceId, language, promptExcerpt, userAnswer, expectedAnswer, explanationVi) {
    const existing = app.state.mistakes.find(
      (m) => m.skill === skill && m.sourceId === sourceId && m.promptExcerpt === promptExcerpt && !m.resolved
    );
    const nowIso = new Date().toISOString();
    if (existing) {
      existing.occurrenceCount += 1;
      existing.userAnswer = userAnswer;
      existing.lastSeenAt = nowIso;
      if (explanationVi) existing.explanationVi = explanationVi;
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
        firstSeenAt: nowIso,
        lastSeenAt: nowIso
      });
    }
    persistState();
    Adapter.pushEvent("/mistakes", { skill, sourceId, language, promptExcerpt, userAnswer, expectedAnswer, explanationVi });
  }

  function markCourseActivityDone(courseId, activityId) {
    if (!courseId || !activityId) return;
    if (!app.state.courseProgress[courseId]) {
      app.state.courseProgress[courseId] = {
        completedLessons: [],
        completedActivities: [],
        lastLessonId: null,
        startedAt: new Date().toISOString(),
        lastAccessedAt: new Date().toISOString()
      };
    }
    const p = app.state.courseProgress[courseId];
    if (!Array.isArray(p.completedActivities)) p.completedActivities = [];
    if (!p.completedActivities.includes(activityId)) p.completedActivities.push(activityId);
    p.lastAccessedAt = new Date().toISOString();
  }

  // Normalized Vocabulary & Specialty Term Save (Fixes production missing entryId/domain/term bug)
  function saveToMyVocab(item, setName) {
    const chosenSet = setName || app.ui.selectedSaveSet || app.state.vocabSets[0] || "Học hàng ngày";
    const norm = Adapter.normalizeVocabPayload(item, domainName, chosenSet);
    if (!norm.entryId || !norm.term) {
      showToast("Không thể lưu: thiếu mã mục từ (entryId) hoặc thuật ngữ hợp lệ.");
      return false;
    }
    const exists = app.state.myVocab.some((v) => v.entryId === norm.entryId);
    if (exists) {
      showToast("Thuật ngữ \"" + norm.term + "\" đã có trong sổ từ cá nhân.");
      return false;
    }
    const record = Object.assign({}, norm, { savedAt: new Date().toISOString() });
    app.state.myVocab.unshift(record);
    persistState();
    Adapter.pushEvent("/vocab/save", record);
    showToast("Đã lưu \"" + norm.term + "\" vào bộ \"" + chosenSet + "\".");
    return true;
  }

  function navigate(groupId, subId, selectId, courseCtx) {
    app.group = groupId;
    const grp = NAV_GROUPS.find((g) => g.id === groupId) || NAV_GROUPS[0];
    app.sub = subId || grp.subs[0].id;
    app.ui.mobileNavOpen = false;
    app.ui.showTranscript = false;
    app.ui.showModelDialogue = false;
    app.ui.showWritingModel = false;
    app.ui.showReadingTrans = false;
    app.activeCourseContext = courseCtx || null;
    recorder.reset(null);
    if (selectId) {
      if (app.sub === "courses" || app.sub === "mycourses") app.selected.courseId = selectId;
      if (app.sub === "listening") app.selected.listeningId = selectId;
      if (app.sub === "speaking") app.selected.speakingId = selectId;
      if (app.sub === "reading") app.selected.readingId = selectId;
      if (app.sub === "writing") app.selected.writingId = selectId;
      if (app.sub === "pronunciation") app.selected.pronunciationId = selectId;
      if (app.sub === "grammar") app.selected.grammarId = selectId;
      if (app.sub === "exercises") app.selected.exerciseId = selectId;
      if (app.sub === "assessments") app.selected.assessmentId = selectId;
      if (app.sub === "lessons") app.selected.lessonId = selectId;
      if (app.sub === "domains") app.selected.domainId = selectId;
    }
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function renderNav() {
    const navEl = document.getElementById("wb-nav");
    const subEl = document.getElementById("wb-subnav");
    const toggleBtn = document.getElementById("wb-mobile-toggle");
    navEl.className = "wb-nav" + (app.ui.mobileNavOpen ? " open" : "");
    if (toggleBtn) toggleBtn.setAttribute("aria-expanded", String(app.ui.mobileNavOpen));

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

  function renderCourseBreadcrumb() {
    if (!app.activeCourseContext || !app.activeCourseContext.courseId) return "";
    const c = (app.data.courses || []).find((x) => x.id === app.activeCourseContext.courseId);
    if (!c) return "";
    return `
      <div class="wb-breadcrumb">
        <span>Đang học trong khóa: <strong>${esc(c.title)}</strong></span>
        <button type="button" class="wb-btn wb-btn-sm wb-btn-outline" style="margin-left:auto;" data-open-course="${esc(c.id)}">Quay lại lộ trình khóa học</button>
      </div>
    `;
  }

  function getDueFlashcards() {
    const now = Date.now();
    return (app.data.flashcards || []).filter((c) => {
      const s = app.state.flashcardSrs[c.id];
      return s && (!s.nextReviewAt || new Date(s.nextReviewAt).getTime() <= now || s.state === "REVIEW_AGAIN");
    });
  }

  // ==================== 1. HUB: OVERVIEW, CONTINUE, MY COURSES, ROADMAP ====================
  function renderOverview() {
    const enrolledIds = Object.keys(app.state.courseProgress);
    const completedCount = app.state.sessions.length;
    const openMistakes = app.state.mistakes.filter((m) => !m.resolved).length;
    const dueCards = getDueFlashcards().length;
    const reviewedCards = Object.keys(app.state.flashcardSrs).length;

    return `
      <div class="wb-page-head">
        <div>
          <h1>Trung tâm học tập</h1>
          <p>Lộ trình tự học có cấu trúc cho Tiếng Anh và Tiếng Trung giản thể, kết nối trực tiếp giữa khóa học, các kỹ năng và ôn tập cá nhân.</p>
        </div>
        <div class="wb-controls-row">
          <button type="button" class="wb-btn wb-btn-primary" data-jump="hub:courses">Mở lộ trình khóa học</button>
          <button type="button" class="wb-btn wb-btn-outline" data-jump="vocab:flashcards">Luyện Flashcard</button>
        </div>
      </div>

      <div class="wb-grid-4" style="margin-bottom:1.25rem;">
        <div class="wb-panel">
          <div class="wb-list-item-meta">Phiên luyện tập thực tế</div>
          <div style="font-size:1.6rem;font-weight:800;color:var(--brand-teal);margin:0.2rem 0;">${completedCount}</div>
          <div class="wb-list-item-meta">${completedCount === 0 ? "Chưa có lượt học nào." : "Ghi nhận từ các bài đã nộp."}</div>
        </div>
        <div class="wb-panel">
          <div class="wb-list-item-meta">Khóa học đang theo</div>
          <div style="font-size:1.6rem;font-weight:800;color:var(--brand-teal);margin:0.2rem 0;">${enrolledIds.length}</div>
          <div class="wb-list-item-meta">${enrolledIds.length === 0 ? "Chọn khóa học để bắt đầu." : "Tiến độ lưu theo từng bài."}</div>
        </div>
        <div class="wb-panel">
          <div class="wb-list-item-meta">Thẻ cần ôn (SRS)</div>
          <div style="font-size:1.6rem;font-weight:800;color:var(--brand-teal);margin:0.2rem 0;">${dueCards}</div>
          <div class="wb-list-item-meta">Đã ôn tổng cộng ${reviewedCards} thẻ.</div>
        </div>
        <div class="wb-panel">
          <div class="wb-list-item-meta">Lỗi cần khắc phục</div>
          <div style="font-size:1.6rem;font-weight:800;color:${openMistakes > 0 ? "var(--brand-vermilion)" : "var(--brand-teal)"};margin:0.2rem 0;">${openMistakes}</div>
          <div class="wb-list-item-meta">Từ My Mistakes thực tế.</div>
        </div>
      </div>

      <div class="wb-grid-2">
        <div class="wb-panel">
          <h2 class="wb-panel-title">Không gian luyện tập theo từng kỹ năng</h2>
          <p style="margin:0 0 0.85rem;color:var(--ink-secondary);font-size:0.9rem;">Mỗi kỹ năng có bố cục thực hành riêng phù hợp phương pháp học:</p>
          <div class="wb-controls-row">
            <button type="button" class="wb-btn wb-btn-ghost" data-jump="practice:listening">Luyện Nghe</button>
            <button type="button" class="wb-btn wb-btn-ghost" data-jump="practice:speaking">Luyện Nói</button>
            <button type="button" class="wb-btn wb-btn-ghost" data-jump="practice:reading">Luyện Đọc</button>
            <button type="button" class="wb-btn wb-btn-ghost" data-jump="practice:writing">Luyện Viết</button>
            <button type="button" class="wb-btn wb-btn-ghost" data-jump="practice:pronunciation">Phát âm</button>
            <button type="button" class="wb-btn wb-btn-ghost" data-jump="practice:grammar">Ngữ pháp</button>
            <button type="button" class="wb-btn wb-btn-ghost" data-jump="practice:exercises">Bài tập</button>
          </div>
        </div>

        <div class="wb-panel">
          <h2 class="wb-panel-title">Khóa học tự học tiêu biểu</h2>
          ${(app.data.courses || []).slice(0, 3).map((c) => {
            const prog = app.state.courseProgress[c.id];
            const totalLessons = c.chapters.reduce((s, ch) => s + ch.lessons.length, 0);
            const done = prog ? (prog.completedLessons || []).length : 0;
            const pct = totalLessons ? Math.round((done / totalLessons) * 100) : 0;
            return `
              <div style="padding:0.65rem 0;border-bottom:1px solid var(--border-subtle);display:flex;justify-content:space-between;align-items:center;gap:0.75rem;">
                <div>
                  <div style="font-weight:600;font-size:0.92rem;">${esc(c.title)}</div>
                  <div class="wb-list-item-meta">${esc(langLabel(c.language))} · ${esc(c.entry_level)} → ${esc(c.target_level)} · ${pct}%</div>
                </div>
                <button type="button" class="wb-btn wb-btn-sm wb-btn-outline" data-open-course="${esc(c.id)}">${prog ? "Tiếp tục" : "Xem lộ trình"}</button>
              </div>
            `;
          }).join("")}
        </div>
      </div>
    `;
  }

  function renderContinueLearning() {
    const enrolled = Object.entries(app.state.courseProgress)
      .map(([cid, prog]) => ({ course: (app.data.courses || []).find((c) => c.id === cid), prog }))
      .filter((x) => x.course);
    const last = app.state.lastVisited;
    const dueCount = getDueFlashcards().length;
    const openMistakes = app.state.mistakes.filter((m) => !m.resolved).length;

    return `
      <div class="wb-page-head">
        <div>
          <h1>Tiếp tục học</h1>
          <p>Quay lại đúng bài học, khóa học hoặc phiên ôn tập bạn đang thực hiện gần nhất.</p>
        </div>
      </div>

      ${!last && enrolled.length === 0 ? `
        <div class="wb-empty">
          <p style="margin:0 0 0.85rem;">Bạn chưa có phiên học gần đây. Hãy bắt đầu từ một khóa học hoặc bài luyện kỹ năng.</p>
          <div class="wb-controls-row" style="justify-content:center;">
            <button type="button" class="wb-btn wb-btn-primary" data-jump="hub:courses">Chọn khóa học</button>
            <button type="button" class="wb-btn wb-btn-outline" data-jump="practice:reading">Luyện đọc ngay</button>
          </div>
        </div>
      ` : `
        <div class="wb-grid-2">
          ${last ? `
            <div class="wb-panel">
              <h2 class="wb-panel-title">Hoạt động gần nhất</h2>
              <p style="margin:0 0 0.6rem;"><strong>${esc(last.title || last.sourceId)}</strong></p>
              <div class="wb-list-item-meta" style="margin-bottom:0.85rem;">Cập nhật lúc: ${esc(formatShortDate(last.at))}</div>
              <button type="button" class="wb-btn wb-btn-primary" data-resume-last="1">Mở lại nội dung này</button>
            </div>
          ` : ""}

          <div class="wb-panel">
            <h2 class="wb-panel-title">Việc cần ôn hôm nay</h2>
            <p style="margin:0 0 0.75rem;color:var(--ink-secondary);font-size:0.92rem;">
              Bạn có <strong>${dueCount}</strong> thẻ Flashcard đến hạn SRS và <strong>${openMistakes}</strong> lỗi cần xem lại trong My Mistakes.
            </p>
            <div class="wb-controls-row">
              <button type="button" class="wb-btn wb-btn-ghost" data-jump="vocab:srs">Ôn tập SRS</button>
              <button type="button" class="wb-btn wb-btn-outline" data-jump="tracking:mistakes">Xem My Mistakes</button>
            </div>
          </div>
        </div>

        ${enrolled.length > 0 ? `
          <div class="wb-panel" style="margin-top:1rem;">
            <h2 class="wb-panel-title">Khóa học đang dở</h2>
            ${enrolled.map(({ course, prog }) => {
              const totalLessons = course.chapters.reduce((s, ch) => s + ch.lessons.length, 0);
              const done = (prog.completedLessons || []).length;
              const pct = totalLessons ? Math.round((done / totalLessons) * 100) : 0;
              return `
                <div style="padding:0.75rem 0;border-bottom:1px solid var(--border-subtle);display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:0.75rem;">
                  <div style="flex:1;min-width:220px;">
                    <strong>${esc(course.title)}</strong>
                    <div class="wb-list-item-meta">${done}/${totalLessons} bài (${pct}%) · Truy cập gần nhất: ${esc(formatShortDate(prog.lastAccessedAt || prog.startedAt))}</div>
                    <div class="wb-progress-track" style="margin-top:0.4rem;"><div class="wb-progress-fill" style="width:${pct}%"></div></div>
                  </div>
                  <button type="button" class="wb-btn wb-btn-primary" data-open-course="${esc(course.id)}">Tiếp tục khóa học</button>
                </div>
              `;
            }).join("")}
          </div>
        ` : ""}
      `}
    `;
  }

  function renderMyCourses() {
    const enrolled = Object.entries(app.state.courseProgress)
      .map(([cid, prog]) => ({ course: (app.data.courses || []).find((c) => c.id === cid), prog }))
      .filter((x) => x.course);

    return `
      <div class="wb-page-head">
        <div>
          <h1>Khóa học của tôi</h1>
          <p>Theo dõi tiến độ các khóa học tự học bạn đã tham gia và kết quả từng bài học.</p>
        </div>
        <button type="button" class="wb-btn wb-btn-primary" data-jump="hub:courses">Khám phá toàn bộ 8 khóa học</button>
      </div>

      ${enrolled.length === 0 ? `
        <div class="wb-empty">
          <p style="margin:0 0 0.8rem;">Bạn chưa bắt đầu khóa học nào. Hãy mở mục Lộ trình để chọn khóa học phù hợp trình độ.</p>
          <button type="button" class="wb-btn wb-btn-primary" data-jump="hub:courses">Xem danh mục khóa học</button>
        </div>
      ` : `
        <div class="wb-grid-2">
          ${enrolled.map(({ course, prog }) => {
            const totalLessons = course.chapters.reduce((s, ch) => s + ch.lessons.length, 0);
            const done = (prog.completedLessons || []).length;
            const actsDone = (prog.completedActivities || []).length;
            const pct = totalLessons ? Math.round((done / totalLessons) * 100) : 0;
            return `
              <div class="wb-panel" style="margin-top:0;">
                <span class="wb-pill">${esc(langLabel(course.language))}</span>
                <span class="wb-pill wb-pill-ivory">${esc(course.entry_level)} → ${esc(course.target_level)}</span>
                <h2 style="margin:0.5rem 0 0.35rem;font-size:1.15rem;">${esc(course.title)}</h2>
                <p style="margin:0 0 0.75rem;color:var(--ink-secondary);font-size:0.9rem;">${esc(course.description)}</p>
                <div style="font-size:0.84rem;color:var(--ink-secondary);margin-bottom:0.35rem;">
                  Hoàn thành: <strong>${done}/${totalLessons} bài (${pct}%)</strong> · ${actsDone} hoạt động đã làm
                </div>
                <div class="wb-progress-track" style="margin-bottom:0.85rem;"><div class="wb-progress-fill" style="width:${pct}%"></div></div>
                <button type="button" class="wb-btn wb-btn-primary" data-open-course="${esc(course.id)}">Mở khóa học</button>
              </div>
            `;
          }).join("")}
        </div>
      `}
    `;
  }

  function renderCourses() {
    const list = filterByLang(app.data.courses || []);
    const active = list.find((c) => c.id === app.selected.courseId) || list[0];
    if (active) app.selected.courseId = active.id;

    const prog = active ? app.state.courseProgress[active.id] : null;
    const totalLessons = active ? active.chapters.reduce((s, ch) => s + ch.lessons.length, 0) : 0;
    const doneLessons = prog ? (prog.completedLessons || []) : [];
    const doneActivities = prog ? (prog.completedActivities || []) : [];
    const pct = totalLessons ? Math.round((doneLessons.length / totalLessons) * 100) : 0;

    return `
      <div class="wb-page-head">
        <div>
          <h1>Lộ trình khóa học tự học</h1>
          <p>8 khóa học tự học chuẩn hóa theo CEFR (Tiếng Anh) và HSK (Tiếng Trung giản thể): Khóa học → Chương → Bài học → Hoạt động → Bài tập → Đánh giá.</p>
        </div>
        <div class="wb-controls-row">${renderLangSelect()}</div>
      </div>

      <div class="wb-workspace">
        <aside class="wb-list-sidebar">
          <div class="wb-list-head">Danh mục khóa học (${list.length})</div>
          <div class="wb-list-scroll">
            ${list.map((c) => {
              const p = app.state.courseProgress[c.id];
              const tl = c.chapters.reduce((s, ch) => s + ch.lessons.length, 0);
              const d = p ? (p.completedLessons || []).length : 0;
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
                  <div><strong>Hình thức:</strong> Tự học độc lập (không lớp học giáo viên, không cấp chứng chỉ)</div>
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
                        <button type="button" class="wb-btn wb-btn-sm ${isDone ? "wb-btn-outline" : "wb-btn-ghost"}" data-toggle-lesson="${esc(active.id)}::${esc(ls.id)}">
                          ${isDone ? "Đã hoàn thành" : "Đánh dấu hoàn thành"}
                        </button>
                      </div>
                      <div style="margin-top:0.65rem;display:flex;flex-wrap:wrap;gap:0.45rem;">
                        ${ls.activities.map((a) => {
                          const aDone = doneActivities.includes(a.source_id);
                          return `
                            <button type="button" class="wb-sub-btn ${aDone ? "active" : ""}" data-open-activity="${esc(a.source_module)}::${esc(a.source_id)}::${esc(active.id)}::${esc(ls.id)}">
                              ${aDone ? "✓ " : ""}${esc(skillLabel(a.source_module))}: ${esc(a.title)}
                            </button>
                          `;
                        }).join("")}
                        ${(ls.exercise_ids || []).map((exId) => `
                          <button type="button" class="wb-sub-btn" data-open-activity="exercises::${esc(exId)}::${esc(active.id)}::${esc(ls.id)}">
                            Bài tập ${esc(exId)}
                          </button>
                        `).join("")}
                      </div>
                    </div>
                  `;
                }).join("")}
                <div style="margin-top:0.5rem;">
                  <button type="button" class="wb-btn wb-btn-outline" data-open-activity="assessments::${esc(ch.chapter_assessment_id)}::${esc(active.id)}::">
                    Làm bài đánh giá cuối chương (${esc(ch.chapter_assessment_id)})
                  </button>
                </div>
              </div>
            `).join("")}
          ` : `<div class="wb-empty">Chưa có khóa học phù hợp bộ lọc.</div>`}
        </div>
      </div>
    `;
  }

  // ==================== 2. LISTENING (Distinct Stage + Side Quiz Layout) ====================
  function renderListening() {
    const list = filterByLang(app.data.listening || []);
    const item = list.find((x) => x.id === app.selected.listeningId) || list[0];
    if (item) app.selected.listeningId = item.id;
    const binding = item ? (app.data.audioBindings || []).find((b) => b.source_id === item.id && b.module === "listening") : null;
    const hasAudio = binding && binding.allow_playback_button && binding.audio_url;

    return `
      ${renderCourseBreadcrumb()}
      <div class="wb-page-head">
        <div>
          <h1>Luyện Nghe</h1>
          <p>Nghe hiểu theo tình huống thực tế, câu hỏi kiểm tra và đối chiếu kịch bản chi tiết.</p>
        </div>
        <div class="wb-controls-row">${renderLangSelect()}</div>
      </div>

      <div class="wb-lesson-strip" role="tablist" aria-label="Chọn bài nghe">
        ${list.map((x) => `
          <button type="button" class="wb-strip-card ${item && x.id === item.id ? "active" : ""}" data-select-listening="${esc(x.id)}">
            <div class="wb-list-item-title">${esc(x.title)}</div>
            <div class="wb-list-item-meta">${esc(langLabel(x.language))} · ${esc(x.level)} · ${x.minutes} phút</div>
          </button>
        `).join("")}
      </div>

      ${item ? `
        <div class="wb-listening-grid">
          <div class="wb-panel">
            <span class="wb-pill">${esc(langLabel(item.language))}</span>
            <span class="wb-pill wb-pill-ivory">${esc(item.level)} · ${esc(item.topic)}</span>
            <h2 style="margin:0.5rem 0 0.4rem;">${esc(item.title)}</h2>
            <p style="margin:0 0 0.7rem;color:var(--ink-secondary);"><strong>Mục tiêu:</strong> ${esc(item.objective)}</p>

            <div class="wb-callout">
              <strong>Hướng dẫn luyện nghe:</strong> ${esc(item.practice_instructions || item.activity)}
              <div style="margin-top:0.3rem;font-size:0.86rem;color:var(--ink-secondary);"><strong>Chiến lược:</strong> ${esc(item.teaching)}</div>
            </div>

            ${hasAudio ? `
              <div style="padding:0.9rem;background:#f4fafa;border:1px solid var(--border-strong);border-radius:10px;margin-bottom:1rem;">
                <audio controls src="${esc(binding.audio_url)}" style="width:100%;"></audio>
              </div>
            ` : `
              <div class="wb-callout wb-callout-warn">
                <strong>Trạng thái âm thanh: TEXT_SCRIPT_ONLY (chưa có tệp audio R2).</strong>
                <div style="margin-top:0.25rem;font-size:0.86rem;">Hệ thống không tạo nút phát âm giả. Khi tệp âm thanh được tải lên R2 (${esc(binding ? binding.r2_object_key : "audio/listening/...")}), trình phát sẽ tự động kích hoạt.</div>
              </div>
            `}

            <div style="margin-bottom:0.9rem;">
              <strong style="font-size:0.88rem;">Từ vựng trọng tâm:</strong>
              ${(item.vocabulary || []).map((w) => `<span class="wb-pill" style="margin:0.2rem 0.25rem 0 0;">${esc(w)}</span>`).join("")}
            </div>

            <button type="button" class="wb-btn wb-btn-outline" id="wb-toggle-transcript">
              ${app.ui.showTranscript ? "Ẩn kịch bản hội thoại" : "Mở kịch bản hội thoại (Transcript)"}
            </button>

            ${app.ui.showTranscript ? `
              <div style="margin-top:1rem;">
                ${(item.dialogue || []).map((d) => `
                  <div class="wb-dialogue-bubble">
                    <div style="font-size:0.8rem;font-weight:700;color:var(--brand-teal);">${esc(d.role)}</div>
                    <div>${esc(d.utterance)}</div>
                  </div>
                `).join("")}
                <div style="margin-top:0.75rem;padding:0.8rem;background:#fbfcfa;border:1px dashed var(--border-strong);border-radius:8px;font-size:0.88rem;color:var(--ink-secondary);">
                  <strong>Dịch nghĩa tham khảo:</strong> ${esc(item.translation_vi)}
                </div>
              </div>
            ` : ""}
          </div>

          <div class="wb-panel">
            <h3 class="wb-panel-title">Câu hỏi kiểm tra nghe hiểu</h3>
            <form id="wb-listening-form" data-id="${esc(item.id)}">
              ${(item.questions || []).map((q, qi) => `
                <div style="margin-bottom:1.1rem;">
                  <div style="font-weight:600;margin-bottom:0.45rem;">Câu ${qi + 1}: ${esc(q.prompt)}</div>
                  ${(q.options || []).map((opt, oi) => `
                    <label class="wb-option" data-lq="${qi}" data-lo="${oi}">
                      <input type="radio" name="lq_${qi}" value="${oi}">
                      <span>${esc(opt)}</span>
                    </label>
                  `).join("")}
                  <div id="wb-lq-fb-${qi}" style="font-size:0.86rem;margin-top:0.35rem;"></div>
                </div>
              `).join("")}
              <button type="submit" class="wb-btn wb-btn-primary">Nộp bài &amp; xem giải thích</button>
            </form>
            <div id="wb-listening-result" style="margin-top:0.85rem;"></div>
          </div>
        </div>
      ` : `<div class="wb-empty">Không có bài nghe phù hợp.</div>`}
    `;
  }

  // ==================== 3. SPEAKING STUDIO (Roleplay Stage + Voice Booth) ====================
  function renderSpeaking() {
    const list = filterByLang(app.data.speaking || []);
    const item = list.find((x) => x.id === app.selected.speakingId) || list[0];
    if (item) app.selected.speakingId = item.id;

    return `
      ${renderCourseBreadcrumb()}
      <div class="wb-page-head">
        <div>
          <h1>Phòng luyện Nói (Speaking Studio)</h1>
          <p>Thực hành hội thoại theo tình huống, vai nói, câu hỏi gợi ý, ghi âm thật qua MediaRecorder và tự đánh giá tiêu chí.</p>
        </div>
        <div class="wb-controls-row">${renderLangSelect()}</div>
      </div>

      <div class="wb-speaking-studio">
        <aside class="wb-list-sidebar">
          <div class="wb-list-head">Tình huống giao tiếp (${list.length})</div>
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
            <div class="wb-role-banner">
              <div>
                <span class="wb-role-tag">${esc(langLabel(item.language))}</span>
                <span class="wb-role-tag">${esc(item.level)}</span>
                <span class="wb-role-tag">${esc(domainName(item.domain))}</span>
              </div>
              <h2>${esc(item.title)}</h2>
              <p><strong>Tình huống:</strong> ${esc(item.situation)}</p>
              <p style="margin-top:0.35rem;"><strong>Vai nói:</strong> ${(item.roles || []).map(esc).join(" ↔ ")} · <strong>Mục tiêu:</strong> ${esc(item.objective)}</p>
            </div>

            <div class="wb-speaking-stage">
              <div>
                <div class="wb-panel">
                  <div class="wb-callout" style="margin-bottom:0.9rem;">
                    <strong>Nhiệm vụ thực hành của bạn:</strong> ${esc(item.task)}
                  </div>
                  <div class="wb-grid-2">
                    <div>
                      <strong>Câu hỏi gợi ý</strong>
                      <ul style="margin:0.4rem 0 0;padding-left:1.15rem;font-size:0.9rem;">
                        ${(item.guiding_questions || []).map((q) => `<li>${esc(q)}</li>`).join("")}
                      </ul>
                    </div>
                    <div>
                      <strong>Cấu trúc &amp; cụm từ hỗ trợ</strong>
                      <p style="margin:0.35rem 0;font-size:0.87rem;color:var(--ink-secondary);">${esc(item.language_structure || item.teaching)}</p>
                      <div style="display:flex;flex-wrap:wrap;gap:0.35rem;">
                        ${(item.focus_phrases || []).map((p) => `<span class="wb-pill">${esc(p)}</span>`).join("")}
                      </div>
                    </div>
                  </div>
                </div>

                <div class="wb-panel">
                  <div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:0.5rem;margin-bottom:0.75rem;">
                    <h3 class="wb-panel-title" style="margin:0;">Hội thoại mẫu đối chiếu</h3>
                    <button type="button" class="wb-btn wb-btn-sm wb-btn-outline" id="wb-toggle-model-dialogue">
                      ${app.ui.showModelDialogue ? "Ẩn hội thoại mẫu" : "Xem hội thoại mẫu"}
                    </button>
                  </div>
                  ${app.ui.showModelDialogue ? `
                    <div>
                      ${(item.model_dialogue || []).map((line, i) => `
                        <div class="wb-dialogue-bubble">
                          <div style="font-weight:600;">${esc(line)}</div>
                          ${item.pinyin && item.pinyin[i] ? `<div style="font-size:0.84rem;color:var(--brand-teal);">${esc(item.pinyin[i])}</div>` : ""}
                          ${item.translation_vi && item.translation_vi[i] ? `<div style="font-size:0.86rem;color:var(--ink-secondary);">${esc(item.translation_vi[i])}</div>` : ""}
                        </div>
                      `).join("")}
                      <div style="font-size:0.85rem;color:var(--ink-muted);margin-top:0.5rem;"><strong>Ghi chú:</strong> ${esc(item.explanation)}</div>
                    </div>
                  ` : `<p style="margin:0;font-size:0.88rem;color:var(--ink-muted);">Hãy thử nói và ghi âm trước khi mở hội thoại mẫu để tự đối chiếu.</p>`}
                </div>
              </div>

              <div>
                <div class="wb-panel">
                  <h3 class="wb-panel-title">Buồng ghi âm thực hành</h3>
                  ${renderRecorderBooth(item.id)}
                </div>

                <div class="wb-panel">
                  <h3 class="wb-panel-title">Tiêu chí tự đánh giá</h3>
                  ${(item.self_assessment || ["Đúng nội dung", "Độ rõ ràng", "Tính mạch lạc"]).map((cr, idx) => `
                    <label class="wb-option">
                      <input type="checkbox" class="wb-sp-check" value="${idx}">
                      <span>${esc(cr)}</span>
                    </label>
                  `).join("")}
                  <button type="button" class="wb-btn wb-btn-primary" id="wb-complete-speaking" data-id="${esc(item.id)}" style="width:100%;margin-top:0.5rem;">
                    Hoàn thành lượt luyện nói
                  </button>
                </div>
              </div>
            </div>
          ` : `<div class="wb-empty">Không có bài luyện nói phù hợp.</div>`}
        </div>
      </div>
    `;
  }

  // ==================== 4. READING (Editorial Split + Focus Mode + Font Controls) ====================
  function renderReading() {
    const list = filterByLang(app.data.reading || []);
    const item = list.find((x) => x.id === app.selected.readingId) || list[0];
    if (item) app.selected.readingId = item.id;

    return `
      ${renderCourseBreadcrumb()}
      <div class="wb-page-head">
        <div>
          <h1>Không gian Luyện Đọc</h1>
          <p>Đọc văn bản hoàn chỉnh trong bố cục báo chí tập trung, điều chỉnh cỡ chữ, đối chiếu từ vựng và trả lời câu hỏi đọc hiểu.</p>
        </div>
        <div class="wb-controls-row">
          ${renderLangSelect()}
          <select class="wb-select" id="wb-reading-select" aria-label="Chọn bài đọc">
            ${list.map((x) => `<option value="${esc(x.id)}" ${item && x.id === item.id ? "selected" : ""}>${esc(x.title)} (${esc(x.level)})</option>`).join("")}
          </select>
          <button type="button" class="wb-btn wb-btn-sm wb-btn-outline" id="wb-reading-font-dec" title="Giảm cỡ chữ">A-</button>
          <button type="button" class="wb-btn wb-btn-sm wb-btn-outline" id="wb-reading-font-inc" title="Tăng cỡ chữ">A+</button>
          <button type="button" class="wb-btn wb-btn-sm ${app.ui.readingFocus ? "wb-btn-primary" : "wb-btn-outline"}" id="wb-reading-focus">
            ${app.ui.readingFocus ? "Thoát chế độ tập trung" : "Chế độ đọc tập trung"}
          </button>
        </div>
      </div>

      ${item ? `
        <div class="wb-reading-layout ${app.ui.readingFocus ? "focus-mode" : ""}">
          <div class="wb-panel">
            <div style="margin-bottom:0.75rem;">
              <span class="wb-pill">${esc(langLabel(item.language))}</span>
              <span class="wb-pill wb-pill-ivory">${esc(item.level)} · ${esc(item.topic)} · ${item.minutes} phút</span>
            </div>
            <h2 style="margin:0 0 0.45rem;font-size:1.45rem;">${esc(item.title)}</h2>
            <p style="margin:0 0 1.1rem;color:var(--ink-secondary);font-size:0.92rem;"><strong>Mục tiêu đọc:</strong> ${esc(item.objective)}</p>

            <article class="wb-reading-prose font-${app.ui.readingFont}">${esc(item.passage || item.example)}</article>

            <div style="margin-top:1rem;display:flex;flex-wrap:wrap;gap:0.45rem;align-items:center;">
              <strong style="font-size:0.88rem;">Từ vựng trọng tâm:</strong>
              ${(item.vocabulary || []).map((w) => `<span class="wb-pill">${esc(w)}</span>`).join("")}
              <button type="button" class="wb-btn wb-btn-sm wb-btn-outline" style="margin-left:auto;" id="wb-toggle-reading-trans">
                ${app.ui.showReadingTrans ? "Ẩn bản dịch" : "Xem bản dịch đối chiếu"}
              </button>
            </div>

            ${app.ui.showReadingTrans ? `
              <div class="wb-callout" style="margin-top:0.85rem;">
                <strong>Bản dịch tham khảo:</strong> ${esc(item.translation_vi)}
              </div>
            ` : ""}

            <div style="margin-top:0.85rem;font-size:0.88rem;color:var(--ink-secondary);">
              <strong>Ngữ pháp chú ý:</strong> ${esc(item.grammar)} — ${esc(item.teaching)}
            </div>
          </div>

          <div class="wb-panel">
            <h3 class="wb-panel-title">Câu hỏi đọc hiểu</h3>
            <form id="wb-reading-form" data-id="${esc(item.id)}">
              ${(item.questions || []).map((q, qi) => `
                <div style="margin-bottom:1.1rem;">
                  <div style="font-weight:600;margin-bottom:0.45rem;">Câu ${qi + 1}: ${esc(q.prompt)}</div>
                  ${(q.options || []).map((opt, oi) => `
                    <label class="wb-option" data-rq="${qi}" data-ro="${oi}">
                      <input type="radio" name="rq_${qi}" value="${oi}">
                      <span>${esc(opt)}</span>
                    </label>
                  `).join("")}
                  <div id="wb-rq-fb-${qi}" style="font-size:0.86rem;margin-top:0.35rem;"></div>
                </div>
              `).join("")}
              <button type="submit" class="wb-btn wb-btn-primary">Nộp đáp án &amp; xem giải thích</button>
            </form>
            <div id="wb-reading-result" style="margin-top:0.85rem;"></div>
            <div style="margin-top:1rem;padding-top:0.85rem;border-top:1px solid var(--border-subtle);font-size:0.88rem;color:var(--ink-secondary);">
              <strong>Hoạt động mở rộng:</strong> ${esc(item.activity)}
            </div>
          </div>
        </div>
      ` : `<div class="wb-empty">Không có bài đọc phù hợp.</div>`}
    `;
  }

  // ==================== 5. WRITING STUDIO (2-Column Writer's Desk) ====================
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
      ${renderCourseBreadcrumb()}
      <div class="wb-page-head">
        <div>
          <h1>Phòng luyện Viết (Writing Studio)</h1>
          <p>Quy trình viết hoàn chỉnh: phân tích đề bài và đối tượng người đọc, lập dàn ý, soạn thảo với bộ đếm từ, tự rà soát tiêu chí và đối chiếu bài mẫu.</p>
        </div>
        <div class="wb-controls-row">
          ${renderLangSelect()}
          <select class="wb-select" id="wb-writing-select" aria-label="Chọn đề bài viết">
            ${list.map((x) => `<option value="${esc(x.id)}" ${item && x.id === item.id ? "selected" : ""}>${esc(x.title)} (${esc(x.level)})</option>`).join("")}
          </select>
        </div>
      </div>

      ${item ? `
        <div class="wb-panel" style="margin-bottom:1.1rem;">
          <div style="display:flex;flex-wrap:wrap;gap:0.4rem;margin-bottom:0.45rem;">
            <span class="wb-pill">${esc(langLabel(item.language))}</span>
            <span class="wb-pill wb-pill-ivory">${esc(item.level)} · Dung lượng gợi ý: ${esc(item.suggested_length)} · ${item.minutes} phút</span>
            <span class="wb-pill wb-pill-ivory">Lĩnh vực: ${esc(domainName(item.domain))}</span>
          </div>
          <h2 style="margin:0.25rem 0 0.45rem;">${esc(item.title)}</h2>
          <p style="margin:0 0 0.65rem;color:var(--ink-secondary);"><strong>Mục tiêu:</strong> ${esc(item.objective)} · <strong>Hướng dẫn:</strong> ${esc(item.activity)}</p>
          <div class="wb-callout" style="margin-bottom:0;">
            <strong>Đề bài &amp; Bối cảnh:</strong> ${esc(item.prompt || item.task)}
          </div>
        </div>

        <div class="wb-writing-desk">
          <div>
            <div class="wb-panel">
              <h3 class="wb-panel-title">Bước 1: Lập dàn ý</h3>
              <textarea class="wb-textarea" id="wb-writing-outline" style="min-height:84px;" placeholder="Ghi nhanh các ý chính theo từng yêu cầu của đề bài...">${esc(saved.outline || "")}</textarea>

              <div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:0.5rem;margin:1.1rem 0 0.5rem;">
                <h3 class="wb-panel-title" style="margin:0;">Bước 2: Trình soạn thảo</h3>
                <span class="wb-word-badge" id="wb-word-counter">${wordCount} ${unitLabel} · Gợi ý: ${esc(item.suggested_length)}</span>
              </div>
              <textarea class="wb-textarea" id="wb-writing-draft" style="min-height:220px;" placeholder="Viết bài hoàn chỉnh của bạn tại đây...">${esc(textVal)}</textarea>

              <div class="wb-controls-row" style="margin-top:0.85rem;">
                <button type="button" class="wb-btn wb-btn-outline" id="wb-save-draft" data-id="${esc(item.id)}">Lưu nháp</button>
                <button type="button" class="wb-btn wb-btn-primary" id="wb-submit-writing" data-id="${esc(item.id)}">Nộp bài &amp; mở bài mẫu</button>
                <button type="button" class="wb-btn wb-btn-ghost" id="wb-toggle-writing-model">
                  ${app.ui.showWritingModel ? "Ẩn bài mẫu" : "Xem bài mẫu"}
                </button>
              </div>
              ${saved.submittedAt ? `<div class="wb-list-item-meta" style="margin-top:0.55rem;">Đã nộp lần cuối: ${esc(formatShortDate(saved.submittedAt))}</div>` : ""}
            </div>

            ${app.ui.showWritingModel ? `
              <div class="wb-panel">
                <h3 class="wb-panel-title">Bài mẫu &amp; Giải thích</h3>
                <div style="background:#fbfcfa;border:1px solid var(--border-subtle);border-radius:10px;padding:1rem;">
                  <p style="margin:0 0 0.6rem;white-space:pre-line;font-size:0.98rem;">${esc(item.model_text || item.example)}</p>
                  <p style="margin:0 0 0.5rem;font-size:0.88rem;color:var(--ink-secondary);"><strong>Dịch nghĩa:</strong> ${esc(item.translation_vi)}</p>
                  <p style="margin:0;font-size:0.88rem;color:var(--brand-teal);"><strong>Giải thích bài mẫu:</strong> ${esc(item.model_explanation || item.explanation)}</p>
                </div>
              </div>
            ` : ""}
          </div>

          <div>
            <div class="wb-panel">
              <h3 class="wb-panel-title">Yêu cầu bắt buộc</h3>
              <ul style="margin:0;padding-left:1.2rem;font-size:0.9rem;">
                ${(item.writing_requirements || []).map((r) => `<li style="margin-bottom:0.35rem;">${esc(r)}</li>`).join("")}
              </ul>
            </div>

            <div class="wb-panel">
              <h3 class="wb-panel-title">Từ vựng &amp; Cấu trúc gợi ý</h3>
              <p style="margin:0 0 0.6rem;font-size:0.88rem;color:var(--ink-secondary);">${esc(item.suggested_grammar || item.teaching)}</p>
              <div style="display:flex;flex-wrap:wrap;gap:0.35rem;">
                ${(item.suggested_vocabulary || []).map((v) => `<span class="wb-pill">${esc(v)}</span>`).join("")}
              </div>
            </div>

            <div class="wb-panel">
              <h3 class="wb-panel-title">Tiêu chí tự đánh giá</h3>
              ${(item.assessment_criteria || []).map((c) => `
                <label class="wb-option"><input type="checkbox"><span>${esc(c)}</span></label>
              `).join("")}
              <div style="margin-top:0.85rem;">
                <strong style="font-size:0.88rem;color:var(--brand-vermilion);">Lỗi thường gặp cần tránh:</strong>
                <ul style="margin:0.35rem 0 0;padding-left:1.15rem;font-size:0.86rem;color:var(--ink-secondary);">
                  ${(item.common_errors || []).map((e) => `<li>${esc(e)}</li>`).join("")}
                </ul>
              </div>
            </div>
          </div>
        </div>
      ` : `<div class="wb-empty">Không có bài luyện viết phù hợp.</div>`}
    `;
  }

  // ==================== 6. PRONUNCIATION LAB (Independent Module with Category Filter) ====================
  function classifyPron(item) {
    const t = (item.title + " " + (item.pronunciation_guide || "")).toLowerCase();
    if (t.includes("thanh điệu") || t.includes("biến điệu") || t.includes("thanh nhẹ") || t.includes("dấu thanh")) return "tones";
    if (t.includes("trọng âm") || t.includes("ngữ điệu") || t.includes("nhịp") || t.includes("ngắt")) return "stress";
    if (t.includes("nối")) return "linking";
    if (t.includes("nguyên âm") || t.includes("schwa") || t.includes("vận mẫu")) return "vowels";
    return "consonants";
  }

  function renderPronunciation() {
    let list = filterByLang(app.data.pronunciation || []);
    if (app.pronCatFilter !== "all") {
      list = list.filter((x) => classifyPron(x) === app.pronCatFilter);
    }
    const item = list.find((x) => x.id === app.selected.pronunciationId) || list[0];
    if (item) app.selected.pronunciationId = item.id;
    const binding = item ? (app.data.audioBindings || []).find((b) => b.source_id === item.id && b.module === "pronunciation") : null;
    const hasAudio = binding && binding.allow_playback_button && binding.audio_url;

    return `
      ${renderCourseBreadcrumb()}
      <div class="wb-page-head">
        <div>
          <h1>Phòng thí nghiệm Phát âm</h1>
          <p>Module phát âm độc lập: IPA, Pinyin, nguyên âm, phụ âm, thanh điệu, trọng âm, ngữ điệu, nối âm và Minimal Pairs.</p>
        </div>
        <div class="wb-controls-row">
          ${renderLangSelect()}
          <select class="wb-select" id="wb-pron-cat" aria-label="Lọc nhóm phát âm">
            <option value="all" ${app.pronCatFilter === "all" ? "selected" : ""}>Tất cả chủ điểm</option>
            <option value="vowels" ${app.pronCatFilter === "vowels" ? "selected" : ""}>Nguyên âm &amp; Vận mẫu</option>
            <option value="consonants" ${app.pronCatFilter === "consonants" ? "selected" : ""}>Phụ âm &amp; Minimal Pairs</option>
            <option value="tones" ${app.pronCatFilter === "tones" ? "selected" : ""}>Thanh điệu &amp; Biến điệu (ZH)</option>
            <option value="stress" ${app.pronCatFilter === "stress" ? "selected" : ""}>Trọng âm &amp; Ngữ điệu</option>
            <option value="linking" ${app.pronCatFilter === "linking" ? "selected" : ""}>Nối âm</option>
          </select>
        </div>
      </div>

      <div class="wb-workspace">
        <aside class="wb-list-sidebar">
          <div class="wb-list-head">Chủ điểm phát âm (${list.length})</div>
          <div class="wb-list-scroll">
            ${list.map((x) => `
              <button type="button" class="wb-list-item ${item && x.id === item.id ? "active" : ""}" data-select-pron="${esc(x.id)}">
                <div class="wb-list-item-title">${esc(x.title)}</div>
                <div class="wb-list-item-meta">${esc(langLabel(x.language))} · ${esc(x.level)}</div>
              </button>
            `).join("")}
          </div>
        </aside>

        <div>
          ${item ? `
            <div class="wb-panel">
              <div class="wb-phonetic-hero">
                <span class="wb-pill">${esc(langLabel(item.language))} · ${esc(item.level)}</span>
                <div class="wb-phonetic-symbol">${esc(item.pronunciation_guide || item.title)}</div>
                <div style="font-size:0.9rem;color:var(--ink-secondary);">${esc(item.title)}</div>
              </div>

              <p style="margin:0 0 0.75rem;"><strong>Hướng dẫn khẩu hình &amp; bản chất âm:</strong> ${esc(item.teaching)}</p>
              <div class="wb-callout">
                <strong>Ví dụ luyện đọc:</strong> ${esc(item.example)}
                <div style="font-size:0.88rem;color:var(--ink-secondary);margin-top:0.25rem;">${esc(item.example_vi)}</div>
              </div>

              ${hasAudio ? `
                <div style="margin-bottom:1rem;"><audio controls src="${esc(binding.audio_url)}" style="width:100%;"></audio></div>
              ` : `
                <div class="wb-callout wb-callout-warn">
                  <strong>Lỗi thường gặp:</strong> ${esc(item.common_error_vi)}
                  <div style="font-size:0.83rem;color:var(--ink-secondary);margin-top:0.25rem;">Chưa gắn tệp âm thanh mẫu R2 (TEXT_SCRIPT_ONLY) — không hiển thị nút phát âm giả.</div>
                </div>
              `}

              ${renderRecorderBooth(item.id)}
            </div>

            <div class="wb-panel">
              <h3 class="wb-panel-title">Luyện phân biệt &amp; kiểm tra</h3>
              <p style="margin:0 0 0.65rem;">${esc(item.task)}</p>
              <div class="wb-controls-row">
                <input type="text" class="wb-input" id="wb-pron-input" placeholder="Nhập câu trả lời của bạn..." style="flex:1;min-width:220px;">
                <button type="button" class="wb-btn wb-btn-primary" id="wb-check-pron" data-id="${esc(item.id)}">Kiểm tra đáp án</button>
              </div>
              <div id="wb-pron-result" style="margin-top:0.8rem;"></div>
            </div>
          ` : `<div class="wb-empty">Không có chủ điểm phát âm phù hợp.</div>`}
        </div>
      </div>
    `;
  }

  // ==================== 7. GRAMMAR, EXERCISES, ASSESSMENTS, INTEGRATED LESSONS ====================
  function renderGrammar() {
    const list = filterByLang(app.data.grammar || []);
    const item = list.find((x) => x.id === app.selected.grammarId) || list[0];
    if (item) app.selected.grammarId = item.id;

    return `
      ${renderCourseBreadcrumb()}
      <div class="wb-page-head">
        <div>
          <h1>Ngữ pháp hệ thống</h1>
          <p>51 chủ điểm ngữ pháp Anh – Trung giản thể kèm quy tắc, cấu trúc, ví dụ, lỗi sai phổ biến và bài tập vận dụng.</p>
        </div>
        <div class="wb-controls-row">${renderLangSelect()}</div>
      </div>

      <div class="wb-workspace">
        <aside class="wb-list-sidebar">
          <div class="wb-list-head">Chủ điểm ngữ pháp (${list.length})</div>
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
              <div class="wb-callout"><strong>Cấu trúc trọng tâm:</strong> <code>${esc(item.structure)}</code></div>
              <div style="border:1px solid var(--border-subtle);border-radius:10px;padding:0.9rem;margin-bottom:0.85rem;">
                <div><strong>Ví dụ:</strong> ${esc(item.example)}</div>
                <div style="color:var(--ink-secondary);font-size:0.9rem;margin-top:0.25rem;">${esc(item.example_vi)}</div>
              </div>
              <div style="font-size:0.9rem;color:var(--brand-vermilion);"><strong>Lỗi phổ biến:</strong> ${esc(item.common_error_vi)}</div>
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

  function renderExercises() {
    let list = filterByLang(app.data.exercises || []);
    const formats = Array.from(new Set((app.data.exercises || []).map((x) => x.format_vi).filter(Boolean)));
    if (app.exFormatFilter !== "all") {
      list = list.filter((x) => x.format_vi === app.exFormatFilter);
    }
    const item = list.find((x) => x.id === app.selected.exerciseId) || list[0];
    if (item) app.selected.exerciseId = item.id;

    return `
      ${renderCourseBreadcrumb()}
      <div class="wb-page-head">
        <div>
          <h1>Bài tập thực hành</h1>
          <p>64 bài tập đa dạng dạng bài, có đáp án, giải thích chi tiết và tự động ghi lỗi sai vào My Mistakes.</p>
        </div>
        <div class="wb-controls-row">
          ${renderLangSelect()}
          <select class="wb-select" id="wb-ex-format" aria-label="Lọc dạng bài">
            <option value="all">Tất cả dạng bài</option>
            ${formats.map((f) => `<option value="${esc(f)}" ${app.exFormatFilter === f ? "selected" : ""}>${esc(f)}</option>`).join("")}
          </select>
        </div>
      </div>

      <div class="wb-workspace">
        <aside class="wb-list-sidebar">
          <div class="wb-list-head">Kho bài tập (${list.length})</div>
          <div class="wb-list-scroll">
            ${list.map((x) => `
              <button type="button" class="wb-list-item ${item && x.id === item.id ? "active" : ""}" data-select-ex="${esc(x.id)}">
                <div class="wb-list-item-title">${esc(x.id)} · ${esc(x.format_vi)}</div>
                <div class="wb-list-item-meta">${esc(langLabel(x.language))} · ${esc(x.level)} · ${esc(domainName(x.domain))}</div>
              </button>
            `).join("")}
          </div>
        </aside>

        <div>
          ${item ? `
            <div class="wb-panel">
              <span class="wb-pill">${esc(item.format_vi)}</span>
              <span class="wb-pill wb-pill-ivory">${esc(langLabel(item.language))} · ${esc(item.level)} · ${esc(item.module)}</span>
              <div class="wb-callout" style="margin-top:0.85rem;">${esc(item.stimulus)}</div>
              <p style="font-weight:600;">${esc(item.task)}</p>

              ${item.options && item.options.length ? `
                <div id="wb-ex-options">
                  ${item.options.map((opt) => `
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
                <button type="button" class="wb-btn wb-btn-primary" id="wb-check-ex" data-id="${esc(item.id)}">Kiểm tra &amp; xem giải thích</button>
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
      ${renderCourseBreadcrumb()}
      <div class="wb-page-head">
        <div>
          <h1>Đánh giá tự học</h1>
          <p>14 bài tự đánh giá theo thang tiêu chí minh bạch (phục vụ tự kiểm tra tiến bộ, không cấp chứng chỉ năng lực ngôn ngữ).</p>
        </div>
        <div class="wb-controls-row">${renderLangSelect()}</div>
      </div>

      <div class="wb-workspace">
        <aside class="wb-list-sidebar">
          <div class="wb-list-head">Bộ đánh giá (${list.length})</div>
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
              <textarea class="wb-textarea" id="wb-as-input" style="min-height:110px;" placeholder="Ghi câu trả lời của bạn trước khi đối chiếu tiêu chí và đáp án..."></textarea>

              <div style="margin-top:1rem;">
                <strong>Tự đối chiếu tiêu chí (Thang ${item.max_score} điểm):</strong>
                <div style="margin-top:0.45rem;">
                  ${(item.criteria || []).map((c) => `
                    <label class="wb-option">
                      <input type="checkbox" class="wb-as-crit" value="${c.points || 1}">
                      <span><strong>+${c.points || 1}đ:</strong> ${esc(c.observable)} <em style="color:var(--ink-muted);">(${esc(c.if_missing_vi || "")})</em></span>
                    </label>
                  `).join("")}
                </div>
              </div>

              <button type="button" class="wb-btn wb-btn-primary" id="wb-submit-as" data-id="${esc(item.id)}" style="margin-top:0.65rem;">Ghi nhận kết quả &amp; xem đáp án</button>
              <div id="wb-as-result" style="margin-top:0.85rem;"></div>
            </div>
          ` : `<div class="wb-empty">Không có bộ đánh giá phù hợp.</div>`}
        </div>
      </div>
    `;
  }

  function renderLessons() {
    const list = filterByLang(app.data.lessons || []);
    const item = list.find((x) => x.id === app.selected.lessonId) || list[0];
    if (item) app.selected.lessonId = item.id;

    return `
      ${renderCourseBreadcrumb()}
      <div class="wb-page-head">
        <div>
          <h1>Bài học tích hợp</h1>
          <p>40 bài học tình huống đa kỹ năng gắn trực tiếp với các khóa học tự học.</p>
        </div>
        <div class="wb-controls-row">${renderLangSelect()}</div>
      </div>

      <div class="wb-workspace">
        <aside class="wb-list-sidebar">
          <div class="wb-list-head">Danh sách bài học (${list.length})</div>
          <div class="wb-list-scroll">
            ${list.map((x) => `
              <button type="button" class="wb-list-item ${item && x.id === item.id ? "active" : ""}" data-select-lesson="${esc(x.id)}">
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
              <span class="wb-pill wb-pill-ivory">${esc(item.level)} · ${esc(domainName(item.domain))} · ${item.minutes} phút</span>
              <h2 style="margin:0.5rem 0 0.4rem;">${esc(item.title)}</h2>
              <p style="margin:0 0 0.7rem;"><strong>Mục tiêu:</strong> ${esc(item.objective)}</p>
              <div class="wb-callout"><strong>Trọng tâm ngôn ngữ:</strong> ${esc(item.teaching)}</div>
              <div class="wb-reading-prose" style="margin-bottom:1rem;font-size:1rem;">${esc(item.example)}</div>
              <p style="margin:0 0 0.6rem;font-size:0.9rem;color:var(--ink-secondary);"><strong>Hoạt động chuẩn bị:</strong> ${esc(item.activity)}</p>
            </div>

            <div class="wb-panel">
              <h3 class="wb-panel-title">Nhiệm vụ thực hành</h3>
              <p style="margin:0 0 0.65rem;font-weight:600;">${esc(item.task)}</p>
              <textarea class="wb-textarea" id="wb-lesson-input" style="min-height:100px;" placeholder="Viết câu trả lời của bạn tại đây..."></textarea>
              <div class="wb-controls-row" style="margin-top:0.8rem;">
                <button type="button" class="wb-btn wb-btn-primary" id="wb-complete-lesson-item" data-id="${esc(item.id)}">Hoàn thành &amp; xem lời giải gợi ý</button>
              </div>
              <div id="wb-lesson-result" style="margin-top:0.85rem;"></div>
            </div>
          ` : `<div class="wb-empty">Không có bài học tích hợp phù hợp.</div>`}
        </div>
      </div>
    `;
  }

  // ==================== 8. VOCABULARY: DICTIONARY, MY VOCAB, SETS, FLASHCARDS, SRS, SPECIALTIES ====================
  function buildDictionaryResultsHtml() {
    const q = app.searchQuery.trim().toLowerCase();
    const dom = app.domainFilter;
    const filtered = (app.data.vocabulary || []).filter((v) => {
      const matchDom = dom === "all" || String(v.domain) === String(dom);
      if (!matchDom) return false;
      if (!q) return true;
      return (v.en || "").toLowerCase().includes(q)
        || (v.zh || "").includes(q)
        || (v.vi || "").toLowerCase().includes(q)
        || (v.pinyin || "").toLowerCase().includes(q);
    });
    const perPage = 12;
    const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
    if (app.ui.dictPage > totalPages) app.ui.dictPage = 1;
    const slice = filtered.slice((app.ui.dictPage - 1) * perPage, app.ui.dictPage * perPage);

    if (slice.length === 0) {
      return `<div class="wb-empty">Không tìm thấy mục từ phù hợp với từ khóa hiện tại.</div>`;
    }
    const examplesByVocab = app.data.examplesByVocab || {};
    return `
      <div class="wb-grid-2">
        ${slice.map((v) => {
          const isSaved = app.state.myVocab.some((m) => m.entryId === v.id);
          const extraEx = examplesByVocab[v.id];
          return `
            <div class="wb-panel" style="margin-top:0;">
              <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:0.5rem;">
                <div>
                  <div style="font-size:1.1rem;font-weight:700;color:var(--brand-teal);">${esc(v.en)} <span style="font-weight:500;color:var(--ink-muted);font-size:0.85rem;">${esc(v.ipa)}</span></div>
                  <div style="font-size:1rem;font-weight:600;margin-top:0.15rem;">${esc(v.zh)} <span style="font-weight:400;color:var(--ink-secondary);font-size:0.86rem;">${esc(v.pinyin)}</span></div>
                </div>
                <button type="button" class="wb-btn wb-btn-sm ${isSaved ? "wb-btn-outline" : "wb-btn-ghost"}" data-save-vocab="${esc(v.id)}">
                  ${isSaved ? "Đã lưu" : "Lưu từ"}
                </button>
              </div>
              <div style="margin-top:0.5rem;font-weight:600;">${esc(v.vi)} <span class="wb-pill wb-pill-ivory" style="margin-left:0.3rem;">${esc(v.pos)} · ${esc(v.level)}</span></div>
              <div class="wb-list-item-meta" style="margin-top:0.3rem;">Lĩnh vực: ${esc(domainName(v.domain))}</div>
              ${v.example_en ? `
                <div style="margin-top:0.65rem;padding-top:0.55rem;border-top:1px solid var(--border-subtle);font-size:0.86rem;">
                  <div>${esc(v.example_en)}</div>
                  <div style="color:var(--ink-secondary);">${esc(v.example_zh || "")}</div>
                  <div style="color:var(--ink-muted);">${esc(v.example_vi || "")}</div>
                </div>
              ` : (extraEx ? `
                <div style="margin-top:0.65rem;padding-top:0.55rem;border-top:1px solid var(--border-subtle);font-size:0.86rem;">
                  <div>${esc(extraEx.original)}</div>
                  <div style="color:var(--ink-secondary);">${esc(extraEx.translation_zh || "")}</div>
                  <div style="color:var(--ink-muted);">${esc(extraEx.translation_vi || "")}</div>
                </div>
              ` : "")}
            </div>
          `;
        }).join("")}
      </div>
      <div class="wb-controls-row" style="justify-content:center;margin-top:1.25rem;">
        <button type="button" class="wb-btn wb-btn-outline" id="wb-dict-prev" ${app.ui.dictPage <= 1 ? "disabled" : ""}>Trang trước</button>
        <span style="font-size:0.88rem;color:var(--ink-secondary);">Trang ${app.ui.dictPage} / ${totalPages} (${filtered.length} mục từ)</span>
        <button type="button" class="wb-btn wb-btn-outline" id="wb-dict-next" ${app.ui.dictPage >= totalPages ? "disabled" : ""}>Trang sau</button>
      </div>
    `;
  }

  function renderDictionary() {
    return `
      <div class="wb-page-head">
        <div>
          <h1>Từ điển đa ngôn ngữ</h1>
          <p>Tra cứu song ngữ Anh – Trung giản thể – Việt kèm IPA, Pinyin, ví dụ ngữ cảnh và lưu vào sổ từ cá nhân.</p>
        </div>
      </div>

      <div class="wb-panel" style="margin-bottom:1rem;">
        <div class="wb-controls-row">
          <input type="search" class="wb-input" id="wb-dict-search" value="${esc(app.searchQuery)}" placeholder="Tìm theo tiếng Anh, chữ Hán, Pinyin hoặc nghĩa tiếng Việt..." style="flex:1;min-width:220px;">
          <select class="wb-select" id="wb-domain-filter" aria-label="Lọc lĩnh vực">
            <option value="all">Tất cả lĩnh vực</option>
            ${(app.data.specialties || []).map((d) => `<option value="${d.id}" ${String(app.domainFilter) === String(d.id) ? "selected" : ""}>${esc(d.name_vi)}</option>`).join("")}
          </select>
          <select class="wb-select" id="wb-save-set-select" aria-label="Chọn bộ từ khi lưu">
            ${app.state.vocabSets.map((s) => `<option value="${esc(s)}" ${app.ui.selectedSaveSet === s ? "selected" : ""}>Lưu vào: ${esc(s)}</option>`).join("")}
          </select>
        </div>
      </div>

      <div id="wb-dict-results">${buildDictionaryResultsHtml()}</div>
    `;
  }

  function renderMyVocab() {
    const filtered = app.vocabSetFilter === "all"
      ? app.state.myVocab
      : app.state.myVocab.filter((m) => m.setName === app.vocabSetFilter);

    return `
      <div class="wb-page-head">
        <div>
          <h1>Sổ từ cá nhân</h1>
          <p>Các từ vựng và thuật ngữ chuyên ngành bạn đã lưu để ôn tập chủ động.</p>
        </div>
        <div class="wb-controls-row">
          <select class="wb-select" id="wb-vocab-set-filter" aria-label="Lọc theo bộ từ">
            <option value="all" ${app.vocabSetFilter === "all" ? "selected" : ""}>Tất cả bộ từ (${app.state.myVocab.length})</option>
            ${app.state.vocabSets.map((s) => `<option value="${esc(s)}" ${app.vocabSetFilter === s ? "selected" : ""}>${esc(s)}</option>`).join("")}
          </select>
          <button type="button" class="wb-btn wb-btn-outline" data-jump="vocab:vocabsets">Quản lý bộ từ</button>
        </div>
      </div>

      ${filtered.length === 0 ? `
        <div class="wb-empty">
          <p style="margin:0 0 0.75rem;">Chưa có mục từ nào trong nhóm này.</p>
          <button type="button" class="wb-btn wb-btn-primary" data-jump="vocab:dictionary">Tra cứu và lưu từ đầu tiên</button>
        </div>
      ` : `
        <div class="wb-grid-2">
          ${filtered.map((m) => `
            <div class="wb-panel" style="margin-top:0;">
              <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:0.5rem;">
                <div>
                  <strong style="color:var(--brand-teal);font-size:1.05rem;">${esc(m.term)}</strong> <span class="wb-list-item-meta">${esc(m.ipa)}</span>
                  <div>${esc(m.zh)} <span class="wb-list-item-meta">${esc(m.pinyin)}</span></div>
                </div>
                <button type="button" class="wb-btn wb-btn-sm wb-btn-outline" data-remove-vocab="${esc(m.entryId)}">Gỡ</button>
              </div>
              <div style="margin-top:0.4rem;">${esc(m.vi)}</div>
              <div class="wb-list-item-meta" style="margin-top:0.35rem;">${esc(m.domainName)} · Bộ: <strong>${esc(m.setName)}</strong></div>
            </div>
          `).join("")}
        </div>
      `}
    `;
  }

  function renderVocabSets() {
    return `
      <div class="wb-page-head">
        <div>
          <h1>Bộ từ vựng</h1>
          <p>Phân loại sổ từ cá nhân thành các bộ chủ đề riêng để dễ ôn tập.</p>
        </div>
        <div class="wb-controls-row">
          <input type="text" class="wb-input" id="wb-new-set-name" placeholder="Tên bộ từ mới...">
          <button type="button" class="wb-btn wb-btn-primary" id="wb-add-set">Tạo bộ từ</button>
        </div>
      </div>

      <div class="wb-grid-3">
        ${app.state.vocabSets.map((s) => {
          const cnt = app.state.myVocab.filter((m) => m.setName === s).length;
          return `
            <div class="wb-panel" style="margin-top:0;">
              <h2 class="wb-panel-title">${esc(s)}</h2>
              <p class="wb-list-item-meta" style="margin:0 0 0.9rem;">${cnt} mục từ đã lưu</p>
              <button type="button" class="wb-btn wb-btn-sm wb-btn-ghost" data-open-vocab-set="${esc(s)}">Mở danh sách từ</button>
            </div>
          `;
        }).join("")}
      </div>
    `;
  }

  function renderFlashcardsView(isSrsOnly) {
    const allCards = app.data.flashcards || [];
    let pool = isSrsOnly ? getDueFlashcards() : allCards;
    if (app.domainFilter !== "all") {
      pool = pool.filter((c) => String(c.domain) === String(app.domainFilter));
    }
    const idxKey = isSrsOnly ? "srsIndex" : "fcIndex";
    const flipKey = isSrsOnly ? "srsFlipped" : "fcFlipped";
    if (app.ui[idxKey] >= pool.length) app.ui[idxKey] = 0;
    const card = pool[app.ui[idxKey]];

    const knownCnt = Object.values(app.state.flashcardSrs).filter((s) => s.state === "KNOWN").length;
    const againCnt = Object.values(app.state.flashcardSrs).filter((s) => s.state === "REVIEW_AGAIN").length;
    const history = (app.state.flashcardSession && app.state.flashcardSession.history) || [];

    return `
      <div class="wb-page-head">
        <div>
          <h1>${isSrsOnly ? "Ôn tập SRS (Spaced Repetition)" : "Flashcard 2.000 thẻ"}</h1>
          <p>${isSrsOnly
            ? "Danh sách thẻ đến hạn ôn tập hoặc đánh dấu chưa biết theo thuật toán giãn cách SM-2."
            : "Kho 2.000 thẻ học từ vựng (FLASHCARD_ONLY, tách biệt hoàn toàn khỏi từ điển công khai)."}</p>
        </div>
        <div class="wb-controls-row">
          <select class="wb-select" id="wb-domain-filter" aria-label="Lọc lĩnh vực">
            <option value="all">Tất cả 40 lĩnh vực</option>
            ${(app.data.specialties || []).map((d) => `<option value="${d.id}" ${String(app.domainFilter) === String(d.id) ? "selected" : ""}>${esc(d.name_vi)}</option>`).join("")}
          </select>
          <button type="button" class="wb-btn wb-btn-outline" data-jump="vocab:${isSrsOnly ? "flashcards" : "srs"}">
            ${isSrsOnly ? "Mở kho 2.000 Flashcard" : "Mở hàng đợi SRS (" + getDueFlashcards().length + ")"}
          </button>
        </div>
      </div>

      ${Adapter.syncMode !== "SYNCED_ACCOUNT" ? `
        <div class="wb-callout" style="margin-bottom:1rem;">
          <strong>Trạng thái đồng bộ:</strong> Tiến độ Flashcard &amp; SRS hiện lưu trên trình duyệt cục bộ. Khi tích hợp vào Cloudflare Worker production cùng D1, tiến độ sẽ tự động đồng bộ theo tài khoản người dùng.
        </div>
      ` : ""}

      ${!card ? `
        <div class="wb-empty">
          <p style="margin:0 0 0.75rem;">${isSrsOnly ? "Hiện không có thẻ nào đến hạn ôn tập SRS. Hãy học thêm thẻ mới trong mục Flashcard." : "Không có thẻ nào khớp bộ lọc lĩnh vực hiện tại."}</p>
          <button type="button" class="wb-btn wb-btn-primary" data-jump="vocab:flashcards">Mở toàn bộ kho Flashcard</button>
        </div>
      ` : `
        <div style="max-width:700px;margin:0 auto;">
          <div style="display:flex;flex-wrap:wrap;justify-content:space-between;font-size:0.86rem;color:var(--ink-secondary);margin-bottom:0.65rem;gap:0.5rem;">
            <span>Thẻ ${app.ui[idxKey] + 1} / ${pool.length} (${esc(card.id)})</span>
            <span>Đã biết: <strong>${knownCnt}</strong> · Cần ôn lại: <strong>${againCnt}</strong></span>
          </div>

          <div class="wb-flashcard" id="wb-fc-card" data-srs-mode="${isSrsOnly ? "1" : "0"}" role="button" tabindex="0" aria-label="Lật thẻ Flashcard">
            <div style="display:flex;flex-wrap:wrap;justify-content:center;gap:0.4rem;margin-bottom:0.5rem;">
              <span class="wb-pill">${esc(card.pos)}</span>
              <span class="wb-pill wb-pill-ivory">${esc(card.level_en)} · ${esc(card.level_zh)}</span>
              <span class="wb-pill wb-pill-ivory">${esc(card.topic)}</span>
            </div>

            ${!app.ui[flipKey] ? `
              <div class="wb-fc-word">${esc(card.en)}</div>
              <div class="wb-fc-phonetic">${esc(card.ipa)}</div>
              <div class="wb-fc-zh" style="margin-top:0.5rem;">${esc(card.zh)}</div>
              <div class="wb-fc-phonetic">${esc(card.pinyin)}</div>
              <p style="margin-top:1.25rem;font-size:0.84rem;color:var(--ink-muted);">Bấm vào thẻ để lật xem nghĩa tiếng Việt và câu ví dụ</p>
            ` : `
              <div style="font-size:1.45rem;font-weight:800;color:var(--brand-teal);margin:0.4rem 0;">${esc(card.vi)}</div>
              <div style="font-size:0.94rem;color:var(--ink-secondary);margin-bottom:1rem;">${esc(card.en)} (${esc(card.ipa)}) · ${esc(card.zh)} (${esc(card.pinyin)})</div>
              <div style="text-align:left;width:100%;background:#f7fafa;border:1px solid var(--border-subtle);border-radius:10px;padding:0.9rem;font-size:0.89rem;">
                <div><strong>EN:</strong> ${esc(card.example_en)}</div>
                <div style="margin-top:0.25rem;"><strong>ZH:</strong> ${esc(card.example_zh)} <span style="color:var(--ink-muted);">(${esc(card.example_pinyin)})</span></div>
                <div style="margin-top:0.25rem;color:var(--ink-secondary);"><strong>VI:</strong> ${esc(card.example_vi)}</div>
              </div>
            `}
          </div>

          <div class="wb-controls-row" style="justify-content:center;margin-top:1.1rem;">
            <button type="button" class="wb-btn wb-btn-outline" id="wb-fc-flip" data-srs-mode="${isSrsOnly ? "1" : "0"}">Lật thẻ</button>
            <button type="button" class="wb-btn wb-btn-accent" id="wb-fc-again" data-id="${esc(card.id)}" data-srs-mode="${isSrsOnly ? "1" : "0"}">Chưa biết · Ôn lại</button>
            <button type="button" class="wb-btn wb-btn-primary" id="wb-fc-known" data-id="${esc(card.id)}" data-srs-mode="${isSrsOnly ? "1" : "0"}">Đã biết (SRS)</button>
            <button type="button" class="wb-btn wb-btn-outline" id="wb-fc-next" data-srs-mode="${isSrsOnly ? "1" : "0"}">Thẻ tiếp</button>
          </div>

          ${history.length > 0 ? `
            <div class="wb-panel" style="margin-top:1.25rem;">
              <h3 class="wb-panel-title">Lịch sử ôn Flashcard gần đây</h3>
              ${history.slice(0, 6).map((h) => `
                <div style="padding:0.4rem 0;border-bottom:1px solid var(--border-subtle);font-size:0.86rem;display:flex;justify-content:space-between;gap:0.5rem;">
                  <span><strong>${esc(h.en)}</strong> (${esc(h.zh)}) — ${esc(h.vi)}</span>
                  <span class="wb-pill ${h.state === "KNOWN" ? "wb-pill-success" : "wb-pill-alert"}">${h.state === "KNOWN" ? "Đã biết" : "Ôn lại"}</span>
                </div>
              `).join("")}
            </div>
          ` : ""}
        </div>
      `}
    `;
  }

  function renderSpecialties() {
    const domains = app.data.specialties || [];
    const active = domains.find((d) => String(d.id) === String(app.selected.domainId)) || domains[0];
    if (active) app.selected.domainId = active.id;
    const relatedVocab = active ? (app.data.vocabulary || []).filter((v) => Number(v.domain) === Number(active.id)) : [];

    return `
      <div class="wb-page-head">
        <div>
          <h1>Thuật ngữ Chuyên ngành (40 lĩnh vực)</h1>
          <p>Tra cứu thuật ngữ đối chiếu Anh – Trung giản thể – Việt theo lĩnh vực chuyên môn và lưu trực tiếp vào sổ từ cá nhân.</p>
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
                <button type="button" class="wb-btn wb-btn-primary" data-domain-to-dict="${active.id}">Mở trong Từ điển</button>
                <button type="button" class="wb-btn wb-btn-outline" data-domain-to-fc="${active.id}">Học Flashcard lĩnh vực này</button>
              </div>
            </div>

            <div class="wb-panel">
              <h3 class="wb-panel-title">Thuật ngữ trong lĩnh vực (${relatedVocab.length})</h3>
              <div class="wb-grid-2">
                ${relatedVocab.slice(0, 12).map((v) => {
                  const isSaved = app.state.myVocab.some((m) => m.entryId === v.id);
                  return `
                    <div style="border:1px solid var(--border-subtle);border-radius:10px;padding:0.85rem;">
                      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:0.5rem;">
                        <div>
                          <div style="font-weight:700;color:var(--brand-teal);">${esc(v.en)} <span class="wb-list-item-meta">${esc(v.ipa)}</span></div>
                          <div>${esc(v.zh)} <span class="wb-list-item-meta">${esc(v.pinyin)}</span></div>
                        </div>
                        <button type="button" class="wb-btn wb-btn-sm ${isSaved ? "wb-btn-outline" : "wb-btn-ghost"}" data-save-vocab="${esc(v.id)}">
                          ${isSaved ? "Đã lưu" : "Lưu từ"}
                        </button>
                      </div>
                      <div style="font-size:0.9rem;margin-top:0.3rem;">${esc(v.vi)}</div>
                    </div>
                  `;
                }).join("")}
              </div>
            </div>
          ` : ""}
        </div>
      </div>
    `;
  }

  // ==================== 9. TRACKING: MY MISTAKES, PRACTICE INSIGHTS, HISTORY ====================
  function renderMistakes() {
    const open = app.state.mistakes.filter((m) => !m.resolved);
    const resolved = app.state.mistakes.filter((m) => m.resolved);

    return `
      <div class="wb-page-head">
        <div>
          <h1>My Mistakes</h1>
          <p>Ghi nhận tự động các lỗi thực tế từ bài nghe, đọc, phát âm, ngữ pháp và bài tập để luyện lại có trọng tâm.</p>
        </div>
      </div>

      ${app.state.mistakes.length === 0 ? `
        <div class="wb-empty">
          <p style="margin:0 0 0.75rem;">Chưa có lỗi nào được ghi nhận. Hệ thống không tạo lỗi mẫu; lỗi chỉ xuất hiện khi bạn làm sai trong bài luyện thực tế.</p>
          <button type="button" class="wb-btn wb-btn-primary" data-jump="practice:exercises">Làm bài tập thực hành</button>
        </div>
      ` : `
        <div class="wb-panel">
          <h2 class="wb-panel-title">Lỗi cần khắc phục (${open.length})</h2>
          ${open.length === 0 ? `<p style="color:var(--ink-secondary);">Bạn đã khắc phục toàn bộ lỗi hiện có.</p>` : open.map((m) => `
            <div style="border:1px solid var(--border-subtle);border-radius:10px;padding:0.9rem;margin-bottom:0.75rem;">
              <div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:0.5rem;">
                <div><span class="wb-pill wb-pill-alert">${esc(skillLabel(m.skill))}</span> <span class="wb-list-item-meta">Lặp lại ${m.occurrenceCount} lần · ${esc(formatShortDate(m.lastSeenAt))}</span></div>
                <div class="wb-controls-row">
                  <button type="button" class="wb-btn wb-btn-sm wb-btn-ghost" data-open-activity="${esc(m.skill)}::${esc(m.sourceId)}::::">Luyện lại</button>
                  <button type="button" class="wb-btn wb-btn-sm wb-btn-outline" data-resolve-mistake="${esc(m.id)}">Đã khắc phục</button>
                </div>
              </div>
              <p style="margin:0.5rem 0 0.3rem;font-weight:600;">${esc(m.promptExcerpt)}</p>
              <div style="font-size:0.88rem;">Bạn chọn: <strong style="color:var(--brand-vermilion);">${esc(m.userAnswer || "(Trống)")}</strong> · Đáp án đúng: <strong style="color:var(--brand-teal);">${esc(m.expectedAnswer)}</strong></div>
              ${m.explanationVi ? `<div style="font-size:0.86rem;color:var(--ink-secondary);margin-top:0.25rem;">Giải thích: ${esc(m.explanationVi)}</div>` : ""}
            </div>
          `).join("")}
        </div>
        ${resolved.length > 0 ? `
          <div class="wb-panel">
            <h2 class="wb-panel-title">Đã khắc phục (${resolved.length})</h2>
            ${resolved.slice(0, 12).map((m) => `<div style="padding:0.45rem 0;border-bottom:1px solid var(--border-subtle);font-size:0.86rem;color:var(--ink-secondary);">[${esc(skillLabel(m.skill))}] ${esc(m.promptExcerpt)} — Đáp án: ${esc(m.expectedAnswer)}</div>`).join("")}
          </div>
        ` : ""}
      `}
    `;
  }

  function renderInsights() {
    const sessions = app.state.sessions;
    const dueCards = getDueFlashcards().length;
    const openMistakes = app.state.mistakes.filter((m) => !m.resolved).length;

    if (sessions.length === 0) {
      return `
        <div class="wb-page-head">
          <div>
            <h1>Practice Insights</h1>
            <p>Chỉ hiển thị số liệu từ lịch sử luyện tập thực tế của bạn — không tạo phần trăm hay biểu đồ giả.</p>
          </div>
        </div>
        <div class="wb-empty">
          <p style="margin:0 0 0.75rem;">Chưa có dữ liệu học tập thực tế để tổng hợp. Hãy hoàn thành ít nhất một bài Nghe, Nói, Đọc, Viết, Phát âm, Ngữ pháp hoặc Flashcard.</p>
          <button type="button" class="wb-btn wb-btn-primary" data-jump="practice:reading">Bắt đầu bài luyện đọc</button>
        </div>
      `;
    }

    const bySkill = {};
    const byDay = {};
    let totalScore = 0, totalMax = 0;
    sessions.forEach((s) => {
      bySkill[s.skill] = (bySkill[s.skill] || 0) + 1;
      const dayKey = String(s.completedAt || "").slice(0, 10) || "Không rõ";
      byDay[dayKey] = (byDay[dayKey] || 0) + 1;
      if (s.score !== null && s.maxScore) {
        totalScore += s.score;
        totalMax += s.maxScore;
      }
    });
    const avgPct = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : null;
    const dayEntries = Object.entries(byDay).sort((a, b) => a[0].localeCompare(b[0])).slice(-7);
    const maxDay = Math.max(1, ...dayEntries.map((d) => d[1]));

    return `
      <div class="wb-page-head">
        <div>
          <h1>Practice Insights</h1>
          <p>Thống kê hoàn toàn từ dữ liệu làm bài thực tế (${Adapter.syncMode === "SYNCED_ACCOUNT" ? "đồng bộ tài khoản" : "lưu cục bộ trên trình duyệt"}).</p>
        </div>
      </div>

      <div class="wb-grid-4" style="margin-bottom:1rem;">
        <div class="wb-panel">
          <div class="wb-list-item-meta">Bài đã hoàn thành</div>
          <div style="font-size:1.6rem;font-weight:800;color:var(--brand-teal);">${sessions.length}</div>
        </div>
        <div class="wb-panel">
          <div class="wb-list-item-meta">Kỹ năng đã luyện</div>
          <div style="font-size:1.6rem;font-weight:800;color:var(--brand-teal);">${Object.keys(bySkill).length}</div>
        </div>
        <div class="wb-panel">
          <div class="wb-list-item-meta">Độ chính xác trung bình</div>
          <div style="font-size:1.6rem;font-weight:800;color:var(--brand-teal);">${avgPct !== null ? avgPct + "%" : "—"}</div>
        </div>
        <div class="wb-panel">
          <div class="wb-list-item-meta">Nội dung cần ôn</div>
          <div style="font-size:1.35rem;font-weight:800;color:${openMistakes > 0 ? "var(--brand-vermilion)" : "var(--brand-teal)"};">${openMistakes} lỗi · ${dueCards} SRS</div>
        </div>
      </div>

      <div class="wb-grid-2">
        <div class="wb-panel">
          <h2 class="wb-panel-title">Phân bổ kỹ năng đã luyện</h2>
          ${Object.entries(bySkill).map(([k, v]) => {
            const pct = Math.round((v / sessions.length) * 100);
            return `
              <div style="margin-bottom:0.75rem;">
                <div style="display:flex;justify-content:space-between;font-size:0.88rem;margin-bottom:0.25rem;">
                  <strong>${esc(skillLabel(k))}</strong>
                  <span>${v} lượt (${pct}%)</span>
                </div>
                <div class="wb-progress-track"><div class="wb-progress-fill" style="width:${pct}%"></div></div>
              </div>
            `;
          }).join("")}
        </div>

        <div class="wb-panel">
          <h2 class="wb-panel-title">Xu hướng học tập theo ngày (dữ liệu thật)</h2>
          ${dayEntries.map(([day, cnt]) => {
            const pct = Math.round((cnt / maxDay) * 100);
            return `
              <div style="margin-bottom:0.65rem;">
                <div style="display:flex;justify-content:space-between;font-size:0.86rem;margin-bottom:0.2rem;">
                  <span>${esc(day)}</span>
                  <strong>${cnt} phiên</strong>
                </div>
                <div class="wb-progress-track"><div class="wb-progress-fill" style="width:${pct}%;background:var(--brand-aqua);"></div></div>
              </div>
            `;
          }).join("")}
        </div>
      </div>
    `;
  }

  function renderHistory() {
    const all = app.state.sessions || [];
    const list = app.historySkillFilter === "all" ? all : all.filter((s) => s.skill === app.historySkillFilter);
    const skills = Array.from(new Set(all.map((s) => s.skill)));

    return `
      <div class="wb-page-head">
        <div>
          <h1>Lịch sử học tập</h1>
          <p>Nhật ký chi tiết các bài học, lượt luyện tập và kết quả đã thực hiện.</p>
        </div>
        <div class="wb-controls-row">
          <select class="wb-select" id="wb-history-filter" aria-label="Lọc theo kỹ năng">
            <option value="all">Tất cả kỹ năng (${all.length})</option>
            ${skills.map((k) => `<option value="${esc(k)}" ${app.historySkillFilter === k ? "selected" : ""}>${esc(skillLabel(k))}</option>`).join("")}
          </select>
        </div>
      </div>

      ${list.length === 0 ? `
        <div class="wb-empty">Chưa có lịch sử học tập nào được ghi nhận.</div>
      ` : `
        <div class="wb-panel">
          ${list.slice(0, 50).map((s) => `
            <div style="padding:0.65rem 0;border-bottom:1px solid var(--border-subtle);display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:0.5rem;">
              <div>
                <span class="wb-pill">${esc(skillLabel(s.skill))}</span>
                <strong style="margin-left:0.4rem;">${esc(s.title || s.sourceId)}</strong>
                <div class="wb-list-item-meta" style="margin-top:0.2rem;">${esc(formatShortDate(s.completedAt))} · ${esc(langLabel(s.language))}</div>
              </div>
              <span class="wb-pill wb-pill-ivory">${s.score !== null && s.maxScore ? s.score + " / " + s.maxScore + " điểm" : "Đã hoàn thành"}</span>
            </div>
          `).join("")}
        </div>
      `}
    `;
  }

  // ==================== ROUTER & EVENT BINDING ====================
  function renderMain() {
    const mainEl = document.getElementById("wb-main");
    let html = "";
    switch (app.sub) {
      case "overview": html = renderOverview(); break;
      case "continue": html = renderContinueLearning(); break;
      case "mycourses": html = renderMyCourses(); break;
      case "courses": html = renderCourses(); break;
      case "listening": html = renderListening(); break;
      case "speaking": html = renderSpeaking(); break;
      case "reading": html = renderReading(); break;
      case "writing": html = renderWriting(); break;
      case "pronunciation": html = renderPronunciation(); break;
      case "grammar": html = renderGrammar(); break;
      case "exercises": html = renderExercises(); break;
      case "assessments": html = renderAssessments(); break;
      case "lessons": html = renderLessons(); break;
      case "dictionary": html = renderDictionary(); break;
      case "myvocab": html = renderMyVocab(); break;
      case "vocabsets": html = renderVocabSets(); break;
      case "flashcards": html = renderFlashcardsView(false); break;
      case "srs": html = renderFlashcardsView(true); break;
      case "domains": html = renderSpecialties(); break;
      case "mistakes": html = renderMistakes(); break;
      case "insights": html = renderInsights(); break;
      case "history": html = renderHistory(); break;
      default: html = renderOverview();
    }
    mainEl.innerHTML = html;
    bindViewEvents();
  }

  function bindViewEvents() {
    const main = document.getElementById("wb-main");

    const bindChange = (id, fn) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener("change", fn);
    };

    bindChange("wb-lang-filter", (e) => { app.langFilter = e.target.value; render(); });
    bindChange("wb-domain-filter", (e) => {
      app.domainFilter = e.target.value;
      app.ui.dictPage = 1;
      app.ui.fcIndex = 0;
      app.ui.srsIndex = 0;
      if (app.sub === "dictionary") {
        const res = document.getElementById("wb-dict-results");
        if (res) res.innerHTML = buildDictionaryResultsHtml();
      } else {
        renderMain();
      }
    });
    bindChange("wb-save-set-select", (e) => { app.ui.selectedSaveSet = e.target.value; });
    bindChange("wb-vocab-set-filter", (e) => { app.vocabSetFilter = e.target.value; renderMain(); });
    bindChange("wb-pron-cat", (e) => { app.pronCatFilter = e.target.value; renderMain(); });
    bindChange("wb-ex-format", (e) => { app.exFormatFilter = e.target.value; renderMain(); });
    bindChange("wb-history-filter", (e) => { app.historySkillFilter = e.target.value; renderMain(); });
    bindChange("wb-reading-select", (e) => { app.selected.readingId = e.target.value; app.ui.showReadingTrans = false; renderMain(); });
    bindChange("wb-writing-select", (e) => { app.selected.writingId = e.target.value; app.ui.showWritingModel = false; renderMain(); });

    // Dictionary search: update ONLY #wb-dict-results so input NEVER loses focus!
    const dictSearch = document.getElementById("wb-dict-search");
    if (dictSearch) {
      dictSearch.addEventListener("input", (e) => {
        app.searchQuery = e.target.value;
        app.ui.dictPage = 1;
        const res = document.getElementById("wb-dict-results");
        if (res) res.innerHTML = buildDictionaryResultsHtml();
      });
    }

    // Listening form (uses q.explanation_vi || q.explanation + highlights correct/wrong options)
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
          const expText = q.explanation_vi || q.explanation || "";
          lForm.querySelectorAll(`label[data-lq="${qi}"]`).forEach((lb) => {
            lb.classList.remove("correct", "wrong");
            const oi = Number(lb.dataset.lo);
            if (oi === ansIdx) lb.classList.add("correct");
            else if (picked && Number(picked.value) === oi) lb.classList.add("wrong");
          });
          if (picked && Number(picked.value) === ansIdx) {
            correct++;
            fb.innerHTML = `<span style="color:var(--success);font-weight:600;">Chính xác.</span> ${esc(expText)}`;
          } else {
            const userTxt = picked ? q.options[Number(picked.value)] : "(Chưa chọn)";
            fb.innerHTML = `<span style="color:var(--brand-vermilion);font-weight:600;">Chưa đúng.</span> Đáp án: <strong>${esc(q.options[ansIdx])}</strong>. ${esc(expText)}`;
            logMistake("listening", item.id, item.language, q.prompt, userTxt, q.options[ansIdx], expText);
          }
        });
        logSession("listening", item.id, item.language, item.domain, correct, (item.questions || []).length, item.title);
        document.getElementById("wb-listening-result").innerHTML = `<div class="wb-callout wb-callout-ok">Kết quả: <strong>${correct} / ${(item.questions || []).length}</strong> câu đúng. Đã ghi vào Practice Insights.</div>`;
      });
    }

    // Reading form (uses q.explanation_vi || q.explanation + highlights correct/wrong options)
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
          const expText = q.explanation_vi || q.explanation || "";
          rForm.querySelectorAll(`label[data-rq="${qi}"]`).forEach((lb) => {
            lb.classList.remove("correct", "wrong");
            const oi = Number(lb.dataset.ro);
            if (oi === ansIdx) lb.classList.add("correct");
            else if (picked && Number(picked.value) === oi) lb.classList.add("wrong");
          });
          if (picked && Number(picked.value) === ansIdx) {
            correct++;
            fb.innerHTML = `<span style="color:var(--success);font-weight:600;">Chính xác.</span> ${esc(expText)}`;
          } else {
            const userTxt = picked ? q.options[Number(picked.value)] : "(Chưa chọn)";
            fb.innerHTML = `<span style="color:var(--brand-vermilion);font-weight:600;">Chưa đúng.</span> Đáp án: <strong>${esc(q.options[ansIdx])}</strong>. ${esc(expText)}`;
            logMistake("reading", item.id, item.language, q.prompt, userTxt, q.options[ansIdx], expText);
          }
        });
        logSession("reading", item.id, item.language, item.domain, correct, (item.questions || []).length, item.title);
        document.getElementById("wb-reading-result").innerHTML = `<div class="wb-callout wb-callout-ok">Kết quả đọc hiểu: <strong>${correct} / ${(item.questions || []).length}</strong> câu đúng.</div>`;
      });
    }

    // Writing live word/character counter
    const wDraft = document.getElementById("wb-writing-draft");
    if (wDraft) {
      wDraft.addEventListener("input", () => {
        const item = app.data.writing.find((x) => x.id === app.selected.writingId);
        const val = wDraft.value;
        const cnt = item && item.language === "zh" ? val.replace(/\s+/g, "").length : (val.trim() ? val.trim().split(/\s+/).length : 0);
        const unit = item && item.language === "zh" ? "ký tự" : "từ";
        const el = document.getElementById("wb-word-counter");
        if (el) el.textContent = `${cnt} ${unit} · Gợi ý: ${item ? item.suggested_length : ""}`;
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
      if (btn.dataset.resumeLast && app.state.lastVisited) {
        navigate(app.state.lastVisited.group || "hub", app.state.lastVisited.sub || "overview", app.state.lastVisited.sourceId);
        return;
      }
      if (btn.dataset.openCourse) { navigate("hub", "courses", btn.dataset.openCourse); return; }
      if (btn.dataset.selectCourse) { app.selected.courseId = btn.dataset.selectCourse; renderMain(); return; }
      if (btn.dataset.selectListening) { app.selected.listeningId = btn.dataset.selectListening; app.ui.showTranscript = false; renderMain(); return; }
      if (btn.dataset.selectSpeaking) { app.selected.speakingId = btn.dataset.selectSpeaking; app.ui.showModelDialogue = false; recorder.reset(null); renderMain(); return; }
      if (btn.dataset.selectPron) { app.selected.pronunciationId = btn.dataset.selectPron; recorder.reset(null); renderMain(); return; }
      if (btn.dataset.selectGrammar) { app.selected.grammarId = btn.dataset.selectGrammar; renderMain(); return; }
      if (btn.dataset.selectEx) { app.selected.exerciseId = btn.dataset.selectEx; renderMain(); return; }
      if (btn.dataset.selectAs) { app.selected.assessmentId = btn.dataset.selectAs; renderMain(); return; }
      if (btn.dataset.selectLesson) { app.selected.lessonId = btn.dataset.selectLesson; renderMain(); return; }
      if (btn.dataset.selectDomain) { app.selected.domainId = btn.dataset.selectDomain; renderMain(); return; }

      if (btn.dataset.openActivity) {
        const parts = btn.dataset.openActivity.split("::");
        const mod = parts[0], sid = parts[1], cid = parts[2] || null, lid = parts[3] || null;
        const valid = ["listening", "speaking", "reading", "writing", "pronunciation", "grammar", "exercises", "assessments", "lessons"];
        if (valid.includes(mod)) {
          const ctx = cid ? { courseId: cid, lessonId: lid, activityId: sid } : null;
          navigate("practice", mod, sid, ctx);
        }
        return;
      }

      if (btn.id === "wb-enroll-course") {
        const cid = btn.dataset.courseId;
        if (!app.state.courseProgress[cid]) {
          app.state.courseProgress[cid] = {
            completedLessons: [],
            completedActivities: [],
            lastLessonId: null,
            startedAt: new Date().toISOString(),
            lastAccessedAt: new Date().toISOString()
          };
          persistState();
          Adapter.pushEvent("/courses/progress", { courseId: cid, progress: app.state.courseProgress[cid] });
          showToast("Đã bắt đầu khóa học. Tiến độ sẽ được tự động lưu.");
          renderMain();
        }
        return;
      }

      if (btn.dataset.toggleLesson) {
        const [cid, lid] = btn.dataset.toggleLesson.split("::");
        if (!app.state.courseProgress[cid]) {
          app.state.courseProgress[cid] = { completedLessons: [], completedActivities: [], lastLessonId: lid, startedAt: new Date().toISOString(), lastAccessedAt: new Date().toISOString() };
        }
        const p = app.state.courseProgress[cid];
        const arr = p.completedLessons;
        const idx = arr.indexOf(lid);
        if (idx >= 0) arr.splice(idx, 1);
        else { arr.push(lid); p.lastLessonId = lid; logSession("course", lid, "en", 1, 1, 1, "Hoàn thành bài " + lid); }
        p.lastAccessedAt = new Date().toISOString();
        persistState();
        Adapter.pushEvent("/courses/progress", { courseId: cid, progress: p });
        renderMain();
        return;
      }

      if (btn.id === "wb-toggle-transcript") { app.ui.showTranscript = !app.ui.showTranscript; renderMain(); return; }
      if (btn.id === "wb-toggle-model-dialogue") { app.ui.showModelDialogue = !app.ui.showModelDialogue; renderMain(); return; }
      if (btn.id === "wb-toggle-reading-trans") { app.ui.showReadingTrans = !app.ui.showReadingTrans; renderMain(); return; }
      if (btn.id === "wb-toggle-writing-model") { app.ui.showWritingModel = !app.ui.showWritingModel; renderMain(); return; }
      if (btn.id === "wb-reading-focus") { app.ui.readingFocus = !app.ui.readingFocus; renderMain(); return; }
      if (btn.id === "wb-reading-font-inc") { app.ui.readingFont = app.ui.readingFont === "sm" ? "md" : "lg"; renderMain(); return; }
      if (btn.id === "wb-reading-font-dec") { app.ui.readingFont = app.ui.readingFont === "lg" ? "md" : "sm"; renderMain(); return; }

      // Real Micro Recorder controls
      if (btn.id === "wb-rec-start") { recorder.start(btn.dataset.owner, renderMain); return; }
      if (btn.id === "wb-rec-stop") { recorder.stop(renderMain); return; }
      if (btn.id === "wb-rec-play") { recorder.play(renderMain); return; }
      if (btn.id === "wb-rec-clear") { recorder.remove(recorder.ownerKey, renderMain); return; }

      if (btn.id === "wb-complete-speaking") {
        const item = app.data.speaking.find((x) => x.id === btn.dataset.id);
        const checked = document.querySelectorAll(".wb-sp-check:checked").length;
        const total = document.querySelectorAll(".wb-sp-check").length;
        logSession("speaking", item.id, item.language, item.domain, checked, total, item.title);
        showToast("Đã ghi nhận lượt luyện nói (" + checked + "/" + total + " tiêu chí).");
        return;
      }

      if (btn.id === "wb-save-draft" || btn.id === "wb-submit-writing") {
        const wid = btn.dataset.id;
        const outline = (document.getElementById("wb-writing-outline") || {}).value || "";
        const draft = (document.getElementById("wb-writing-draft") || {}).value || "";
        const nowIso = new Date().toISOString();
        const prev = app.state.writingDrafts[wid] || {};
        app.state.writingDrafts[wid] = {
          outline,
          draft,
          updatedAt: nowIso,
          submittedAt: btn.id === "wb-submit-writing" ? nowIso : (prev.submittedAt || null)
        };
        persistState();
        Adapter.pushEvent("/writing/drafts", Object.assign({ writingId: wid }, app.state.writingDrafts[wid]));
        if (btn.id === "wb-submit-writing") {
          const item = app.data.writing.find((x) => x.id === wid);
          logSession("writing", wid, item.language, item.domain, null, null, item.title);
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
        logSession("pronunciation", item.id, item.language, item.domain, isOk ? 1 : 0, 1, item.title);
        document.getElementById("wb-pron-result").innerHTML = `<div class="wb-callout ${isOk ? "wb-callout-ok" : "wb-callout-warn"}"><strong>${isOk ? "Chính xác!" : "Cần đối chiếu lại:"}</strong> Đáp án: <strong>${esc(item.answer)}</strong>. ${esc(item.explanation)}</div>`;
        return;
      }

      if (btn.id === "wb-check-grammar") {
        const item = app.data.grammar.find((x) => x.id === btn.dataset.id);
        const ans = ((document.getElementById("wb-grammar-input") || {}).value || "").trim();
        const isOk = ans && ans.toLowerCase() === item.answer.trim().toLowerCase();
        if (!isOk) logMistake("grammar", item.id, item.language, item.task, ans, item.answer, item.explanation);
        logSession("grammar", item.id, item.language, item.domain, isOk ? 1 : 0, 1, item.title);
        document.getElementById("wb-grammar-result").innerHTML = `<div class="wb-callout ${isOk ? "wb-callout-ok" : "wb-callout-warn"}"><strong>${isOk ? "Chính xác!" : "Chưa chính xác."}</strong> Đáp án: <strong>${esc(item.answer)}</strong>. ${esc(item.explanation)}</div>`;
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
        logSession("exercises", item.id, item.language, item.domain, isOk ? 1 : 0, 1, item.id + " (" + item.format_vi + ")");
        document.getElementById("wb-ex-result").innerHTML = `<div class="wb-callout ${isOk ? "wb-callout-ok" : "wb-callout-warn"}"><strong>${isOk ? "Chính xác!" : "Đối chiếu đáp án:"}</strong> ${esc(item.answer)}. ${esc(item.explanation)}</div>`;
        return;
      }

      if (btn.id === "wb-submit-as") {
        const item = app.data.assessments.find((x) => x.id === btn.dataset.id);
        let score = 0;
        document.querySelectorAll(".wb-as-crit:checked").forEach((c) => { score += Number(c.value || 1); });
        logSession("assessments", item.id, item.language, item.domain, score, item.max_score, item.title);
        const ansStr = Array.isArray(item.answer) ? item.answer.join(" | ") : String(item.answer);
        document.getElementById("wb-as-result").innerHTML = `<div class="wb-callout wb-callout-ok"><strong>Điểm tự đối chiếu: ${score}/${item.max_score}.</strong><br>Đáp án chuẩn: ${esc(ansStr)}<br>Giải thích: ${esc(item.explanation)}</div>`;
        return;
      }

      if (btn.id === "wb-complete-lesson-item") {
        const item = app.data.lessons.find((x) => x.id === btn.dataset.id);
        logSession("lessons", item.id, item.language, item.domain, null, null, item.title);
        document.getElementById("wb-lesson-result").innerHTML = `<div class="wb-callout wb-callout-ok"><strong>Gợi ý đáp án:</strong> ${esc(item.answer)}<br><strong>Giải thích:</strong> ${esc(item.explanation)}</div>`;
        return;
      }

      if (btn.dataset.saveVocab) {
        const v = app.data.vocabulary.find((x) => x.id === btn.dataset.saveVocab);
        if (v && saveToMyVocab(v)) {
          if (app.sub === "dictionary") {
            const res = document.getElementById("wb-dict-results");
            if (res) res.innerHTML = buildDictionaryResultsHtml();
          } else {
            renderMain();
          }
        }
        return;
      }

      if (btn.dataset.removeVocab) {
        app.state.myVocab = app.state.myVocab.filter((m) => m.entryId !== btn.dataset.removeVocab);
        persistState();
        showToast("Đã gỡ khỏi sổ từ cá nhân.");
        renderMain();
        return;
      }

      if (btn.id === "wb-add-set") {
        const inp = document.getElementById("wb-new-set-name");
        const val = (inp ? inp.value : "").trim();
        if (val && !app.state.vocabSets.includes(val)) {
          app.state.vocabSets.push(val);
          persistState();
          showToast("Đã tạo bộ từ \"" + val + "\".");
          renderMain();
        }
        return;
      }

      if (btn.dataset.openVocabSet) {
        app.vocabSetFilter = btn.dataset.openVocabSet;
        navigate("vocab", "myvocab");
        return;
      }

      if (btn.id === "wb-dict-prev") {
        app.ui.dictPage = Math.max(1, app.ui.dictPage - 1);
        const res = document.getElementById("wb-dict-results");
        if (res) res.innerHTML = buildDictionaryResultsHtml();
        return;
      }
      if (btn.id === "wb-dict-next") {
        app.ui.dictPage += 1;
        const res = document.getElementById("wb-dict-results");
        if (res) res.innerHTML = buildDictionaryResultsHtml();
        return;
      }

      // Flashcards & SM-2 SRS
      const isSrs = btn.dataset.srsMode === "1";
      const idxKey = isSrs ? "srsIndex" : "fcIndex";
      const flipKey = isSrs ? "srsFlipped" : "fcFlipped";

      if (btn.id === "wb-fc-card" || btn.id === "wb-fc-flip") {
        app.ui[flipKey] = !app.ui[flipKey];
        renderMain();
        return;
      }
      if (btn.id === "wb-fc-next") {
        app.ui[idxKey] += 1;
        app.ui[flipKey] = false;
        if (!isSrs) { app.state.flashcardSession.lastIndex = app.ui.fcIndex; persistState(); }
        renderMain();
        return;
      }
      if (btn.id === "wb-fc-known" || btn.id === "wb-fc-again") {
        const cid = btn.dataset.id;
        const cardObj = (app.data.flashcards || []).find((c) => c.id === cid);
        const prev = app.state.flashcardSrs[cid] || { ease: 2.5, interval: 0, reps: 0, lapses: 0 };
        const nowIso = new Date().toISOString();
        let srsRec;
        if (btn.id === "wb-fc-known") {
          const reps = prev.reps + 1;
          const interval = reps === 1 ? 1 : (reps === 2 ? 6 : Math.round(prev.interval * prev.ease));
          srsRec = {
            state: "KNOWN",
            ease: Math.max(1.3, Number((prev.ease + 0.1).toFixed(2))),
            interval,
            reps,
            lapses: prev.lapses || 0,
            nextReviewAt: new Date(Date.now() + interval * 86400000).toISOString(),
            lastReviewedAt: nowIso
          };
          logSession("flashcard", cid, "en-zh", cardObj ? cardObj.domain : 1, 1, 1, cardObj ? cardObj.en : cid);
          showToast("Đã đánh dấu Đã biết · Ôn lại sau " + interval + " ngày.");
        } else {
          srsRec = {
            state: "REVIEW_AGAIN",
            ease: Math.max(1.3, Number((prev.ease - 0.2).toFixed(2))),
            interval: 0,
            reps: 0,
            lapses: (prev.lapses || 0) + 1,
            nextReviewAt: nowIso,
            lastReviewedAt: nowIso
          };
          logSession("flashcard", cid, "en-zh", cardObj ? cardObj.domain : 1, 0, 1, cardObj ? cardObj.en : cid);
          showToast("Đã đánh dấu Chưa biết · Đưa vào hàng đợi ôn tập SRS.");
        }
        app.state.flashcardSrs[cid] = srsRec;
        if (cardObj) {
          app.state.flashcardSession.history.unshift({ id: cid, en: cardObj.en, zh: cardObj.zh, vi: cardObj.vi, state: srsRec.state, at: nowIso });
          if (app.state.flashcardSession.history.length > 50) app.state.flashcardSession.history.length = 50;
        }
        if (!isSrs) {
          app.ui.fcIndex += 1;
          app.state.flashcardSession.lastIndex = app.ui.fcIndex;
        }
        app.ui[flipKey] = false;
        persistState();
        Adapter.pushEvent("/flashcards/srs", Object.assign({ flashcardId: cid }, srsRec));
        renderMain();
        return;
      }

      if (btn.dataset.resolveMistake) {
        const m = app.state.mistakes.find((x) => x.id === btn.dataset.resolveMistake);
        if (m) {
          m.resolved = true;
          persistState();
          Adapter.pushEvent("/mistakes/resolve", { id: m.id });
          showToast("Đã đánh dấu khắc phục lỗi.");
          renderMain();
        }
        return;
      }
      if (btn.dataset.domainToDict) { app.domainFilter = btn.dataset.domainToDict; navigate("vocab", "dictionary"); return; }
      if (btn.dataset.domainToFc) { app.domainFilter = btn.dataset.domainToFc; navigate("vocab", "flashcards"); return; }
    };
  }

  function render() {
    updateSyncBadge();
    renderNav();
    renderMain();
  }

  async function loadModularData() {
    if (window.WB_BOOTSTRAP_DATA) return window.WB_BOOTSTRAP_DATA;
    const base = (window.WB_CONFIG && window.WB_CONFIG.dataBase) || "../data/";
    const fetchJson = (p) => fetch(base + p).then((r) => {
      if (!r.ok) throw new Error("HTTP " + r.status + " for " + p);
      return r.json();
    });
    const [
      courses, listening, speaking, reading, writing, grammar, pronunciation,
      exercises, assessments, lessons, specialties, audioBindings,
      fc1, fc2, fc3, fc4,
      v1, v2, v3, v4, v5, v6, v7, v8, v9, v10,
      e1, e2, e3, e4, e5, e6, e7, e8, e9, e10
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
      fetchJson("lessons/lessons-001.json"),
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
      fetchJson("vocabulary/vocabulary-010.json"),
      fetchJson("examples/examples-001.json"),
      fetchJson("examples/examples-002.json"),
      fetchJson("examples/examples-003.json"),
      fetchJson("examples/examples-004.json"),
      fetchJson("examples/examples-005.json"),
      fetchJson("examples/examples-006.json"),
      fetchJson("examples/examples-007.json"),
      fetchJson("examples/examples-008.json"),
      fetchJson("examples/examples-009.json"),
      fetchJson("examples/examples-010.json")
    ]);
    const examples = [...e1, ...e2, ...e3, ...e4, ...e5, ...e6, ...e7, ...e8, ...e9, ...e10];
    const examplesByVocab = {};
    examples.forEach((ex) => {
      if (ex.focus_vocabulary_id && !examplesByVocab[ex.focus_vocabulary_id]) {
        examplesByVocab[ex.focus_vocabulary_id] = ex;
      }
    });
    return {
      courses, listening, speaking, reading, writing, grammar, pronunciation,
      exercises, assessments, lessons, specialties, audioBindings,
      flashcards: [...fc1, ...fc2, ...fc3, ...fc4],
      vocabulary: [...v1, ...v2, ...v3, ...v4, ...v5, ...v6, ...v7, ...v8, ...v9, ...v10],
      examples,
      examplesByVocab
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
      await Adapter.probeProductionApi();
      app.state = await Adapter.hydrateState(app.state);
      app.data = await loadModularData();
      render();
    } catch (err) {
      document.getElementById("wb-main").innerHTML = `<div class="wb-empty">Không thể tải dữ liệu học liệu (${esc(err.message)}). Vui lòng chạy qua máy chủ HTTP cục bộ hoặc Cloudflare Worker.</div>`;
    }
  });
})();
