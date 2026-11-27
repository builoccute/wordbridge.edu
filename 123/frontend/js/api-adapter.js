/* ==========================================================================
   WORD BRIDGE — Production API & Account Sync Adapter (v0.9.0)
   Honest sync semantics:
   - When integrated into Cloudflare Worker `wordbridge-edu`, connects to
     /api/wb/* endpoints authenticated by the existing session/Passkey/RBAC layer.
   - When running locally or without production API, operates cleanly on
     localStorage and explicitly reports LOCAL_ONLY_NO_API (never fakes sync).
   ========================================================================== */
(function (global) {
  "use strict";

  const STORAGE_KEY = "wb_learner_state_v3";
  const DEFAULT_STATE = {
    courseProgress: {},     // { [courseId]: { completedLessons: [], completedActivities: [], lastLessonId, startedAt, lastAccessedAt } }
    myVocab: [],            // [{ entryId, term, zh, pinyin, ipa, vi, domain, domainName, setName, savedAt }]
    vocabSets: ["Học hàng ngày", "Thuật ngữ chuyên ngành"],
    flashcardSrs: {},       // { [cardId]: { state, ease, interval, reps, lapses, nextReviewAt, lastReviewedAt } }
    flashcardSession: { lastIndex: 0, mode: "all", domain: "all", history: [] },
    writingDrafts: {},      // { [writingId]: { outline, draft, submittedAt, updatedAt } }
    mistakes: [],           // Real learner mistakes only
    sessions: [],           // Real completed practice sessions only
    lastVisited: null
  };

  function cloneDefault() {
    return JSON.parse(JSON.stringify(DEFAULT_STATE));
  }

  function normalizeVocabPayload(item, domainResolver, setName) {
    const entryId = String(item.entryId || item.id || item.vocab_id || "").trim();
    const term = String(item.term || item.en || item.zh || "").trim();
    const domainId = item.domain !== undefined && item.domain !== null && item.domain !== "" ? Number(item.domain) : 1;
    const domainName = item.domainName || item.specialty_vi || (typeof domainResolver === "function" ? domainResolver(domainId) : "Chủ đề tổng hợp");
    return {
      entryId,
      term,
      zh: item.zh || "",
      pinyin: item.pinyin || "",
      ipa: item.ipa || "",
      vi: item.vi || "",
      domain: domainId,
      domainName,
      setName: setName || "Học hàng ngày"
    };
  }

  const adapter = {
    apiBase: (global.WB_CONFIG && global.WB_CONFIG.apiBase) || "/api/wb",
    syncMode: "LOCAL_ONLY_NO_API", // "SYNCED_ACCOUNT" | "LOCAL_ONLY_NO_API" | "UNAUTHENTICATED"
    user: null,

    loadLocalState() {
      try {
        const raw = global.localStorage.getItem(STORAGE_KEY);
        if (!raw) return cloneDefault();
        const parsed = JSON.parse(raw);
        const merged = Object.assign(cloneDefault(), parsed);
        if (!merged.flashcardSession) merged.flashcardSession = cloneDefault().flashcardSession;
        if (!Array.isArray(merged.flashcardSession.history)) merged.flashcardSession.history = [];
        return merged;
      } catch (e) {
        return cloneDefault();
      }
    },

    saveLocalState(state) {
      try {
        global.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (e) {
        // Ignore storage quota errors in restricted frames
      }
    },

    async probeProductionApi() {
      // Only probe if served over http/https (never file://)
      if (!global.location || (global.location.protocol !== "http:" && global.location.protocol !== "https:")) {
        this.syncMode = "LOCAL_ONLY_NO_API";
        return { mode: this.syncMode, user: null };
      }
      try {
        const res = await fetch(this.apiBase + "/me", {
          method: "GET",
          credentials: "include",
          headers: { "Accept": "application/json" }
        });
        if (res.status === 401) {
          this.syncMode = "UNAUTHENTICATED";
          this.user = null;
          return { mode: this.syncMode, user: null };
        }
        if (res.ok) {
          const ct = (res.headers.get("content-type") || "").toLowerCase();
          if (ct.includes("application/json")) {
            const payload = await res.json();
            if (payload && payload.authenticated && payload.user) {
              this.syncMode = "SYNCED_ACCOUNT";
              this.user = payload.user;
              return { mode: this.syncMode, user: this.user };
            }
          }
        }
      } catch (e) {
        // Network or 404 on local static server -> stay strictly LOCAL_ONLY_NO_API
      }
      this.syncMode = "LOCAL_ONLY_NO_API";
      this.user = null;
      return { mode: this.syncMode, user: null };
    },

    async hydrateState(localState) {
      if (this.syncMode !== "SYNCED_ACCOUNT") return localState;
      try {
        const res = await fetch(this.apiBase + "/state", {
          method: "GET",
          credentials: "include",
          headers: { "Accept": "application/json" }
        });
        if (res.ok) {
          const remote = await res.json();
          if (remote && typeof remote === "object") {
            const merged = Object.assign(cloneDefault(), localState, remote);
            this.saveLocalState(merged);
            return merged;
          }
        }
      } catch (e) {
        // Fall back to localState
      }
      return localState;
    },

    async pushEvent(endpoint, body) {
      if (this.syncMode !== "SYNCED_ACCOUNT") {
        return { synced: false, mode: this.syncMode };
      }
      try {
        const res = await fetch(this.apiBase + endpoint, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json", "Accept": "application/json" },
          body: JSON.stringify(body)
        });
        if (res.ok) return { synced: true, mode: this.syncMode, data: await res.json() };
        return { synced: false, mode: this.syncMode, status: res.status };
      } catch (e) {
        return { synced: false, mode: this.syncMode, error: String(e) };
      }
    },

    normalizeVocabPayload,

    syncBadgeLabel() {
      if (this.syncMode === "SYNCED_ACCOUNT") {
        return "Đã đồng bộ: " + (this.user && (this.user.name || this.user.email) ? (this.user.name || this.user.email) : "Tài khoản");
      }
      if (this.syncMode === "UNAUTHENTICATED") {
        return "Chưa đăng nhập · Lưu cục bộ";
      }
      return "Chế độ cục bộ (chưa kết nối D1)";
    }
  };

  global.WBApiAdapter = adapter;
})(window);
