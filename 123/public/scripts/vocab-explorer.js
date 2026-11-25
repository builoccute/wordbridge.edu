/**
 * WORD BRIDGE V4.3.0 — Interactive Bilingual Specialized Vocabulary Explorer (36,104 terms / 12 domains)
 * Supports English (EN) + Chinese (ZH), Excel Original + Authored +1,000/domain filter,
 * topic filtering, search, pagination, contextual examples & browser TTS pronunciation (en-US / zh-CN).
 */
(function () {
  const root = document.getElementById('wb-vocab-explorer');
  if (!root) return;

  const slug = root.getAttribute('data-domain-slug');
  const authenticated = root.getAttribute('data-is-authenticated') === 'true';
  const searchInput = document.getElementById('wb-vocab-search');
  const langSelect = document.getElementById('wb-vocab-lang');
  const srcSelect = document.getElementById('wb-vocab-src');
  const topicSelect = document.getElementById('wb-vocab-topic');
  const listEl = document.getElementById('wb-vocab-list');
  const statsEl = document.getElementById('wb-vocab-stats');
  const pagerEl = document.getElementById('wb-vocab-pager');

  let words = [], topics = [], total = 0, currentPage = 1, totalPages = 1;
  let cachedPublicData = null;
  let requestNumber = 0;
  const PAGE_SIZE = 50;
  const isEnglish = () => document.documentElement.lang === 'en';
  function esc(s) {
    return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
  async function loadPage(page) {
    const sequence = ++requestNumber;
    const q = (searchInput?.value || '').trim();
    const lang = (langSelect?.value || '').trim();
    const src = (srcSelect?.value || '').trim();
    const topic = (topicSelect?.value || '').trim();
    try {
      if (authenticated) {
        const params = new URLSearchParams({ domain: slug, q, lang, src, topic, page: String(page), limit: String(PAGE_SIZE) });
        const response = await fetch('/api/v1/specialized/terms?' + params);
        if (sequence !== requestNumber) return;
        if (response.status === 401) { window.WB_AUTH?.open('specialized.search', location.href); return; }
        if (!response.ok) throw new Error('DATA_UNAVAILABLE');
        const data = await response.json();
        if (sequence !== requestNumber) return;
        words = data.words || [];
        topics = data.topics || [];
        currentPage = data.page || 1;
        total = data.total || 0;
        totalPages = data.totalPages || Math.max(1, Math.ceil(total / PAGE_SIZE));
      } else {
        if (!cachedPublicData) {
          const response = await fetch('/data/vocab/' + encodeURIComponent(slug) + '.json');
          if (sequence !== requestNumber) return;
          if (!response.ok) throw new Error('DATA_UNAVAILABLE');
          cachedPublicData = await response.json();
        }
        let filtered = cachedPublicData.words || [];
        if (lang) filtered = filtered.filter((w) => (w.l || 'en') === lang);
        if (src) filtered = filtered.filter((w) => (w.src || 'excel') === src);
        if (topic) filtered = filtered.filter((w) => String(w.t || '').toLowerCase() === topic.toLowerCase());
        if (q) {
          const ql = q.toLowerCase();
          filtered = filtered.filter((w) => `${w.w || ''} ${w.m || ''} ${w.i || ''} ${w.t || ''}`.toLowerCase().includes(ql));
        }
        topics = lang === 'zh' ? (cachedPublicData.topicsZh || cachedPublicData.topics || []) : lang === 'en' ? (cachedPublicData.topicsEn || cachedPublicData.topics || []) : (cachedPublicData.topics || []);
        total = filtered.length;
        totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
        currentPage = Math.min(Math.max(1, page), totalPages);
        const startIdx = (currentPage - 1) * PAGE_SIZE;
        words = filtered.slice(startIdx, startIdx + PAGE_SIZE);
      }
      renderPage();
    } catch {
      if (sequence !== requestNumber) return;
      if (statsEl) statsEl.textContent = isEnglish() ? 'Vocabulary unavailable.' : 'Không thể tải dữ liệu từ vựng.';
      if (listEl) listEl.replaceChildren();
      if (pagerEl) pagerEl.replaceChildren();
    }
  }
  function applyFilter() { loadPage(1); }
  document.addEventListener('wb-locale-change', renderPage);
  function renderPage() {
    if (!listEl) return;
    if (topicSelect) {
      const selected = topicSelect.value;
      topicSelect.innerHTML = `<option value="">${isEnglish() ? 'All topics' : 'Tất cả chủ đề'}</option>` + topics.map((t) => `<option value="${esc(t)}">${esc(t)}</option>`).join('');
      topicSelect.value = selected;
    }
    const start = (currentPage - 1) * PAGE_SIZE;
    if (statsEl) {
      statsEl.textContent = isEnglish()
        ? `Showing ${total ? start + 1 : 0}–${Math.min(start + words.length, total)} of ${total.toLocaleString('en-US')} specialized terms`
        : `Đang hiển thị ${total ? start + 1 : 0}–${Math.min(start + words.length, total)} trên tổng số ${total.toLocaleString('vi-VN')} thuật ngữ chuyên ngành`;
    }

    if (!words.length) {
      listEl.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:24px;">${isEnglish() ? 'No vocabulary matches the current filters.' : 'Không tìm thấy thuật ngữ phù hợp với bộ lọc hiện tại.'}</td></tr>`;
    } else {
      listEl.innerHTML = words.map((item) => {
        const langCode = item.l === 'zh' ? 'zh' : 'en';
        const srcBadge = item.src === 'wb_v43'
          ? '<span class="wb-badge wb-badge-ok" style="font-size:0.72rem;margin-left:4px;">+1000 Mở rộng</span>'
          : '<span class="wb-badge" style="font-size:0.72rem;margin-left:4px;">Excel gốc</span>';
        const exHtml = item.ex
          ? `<div class="wb-muted" style="font-size:0.8rem;margin-top:4px;"><em>${esc(item.ex)}</em>${item.exVi ? `<br/>${esc(item.exVi)}` : ''}</div>`
          : '';
        return `
        <tr>
          <td><strong>${item.n}</strong><div><span class="wb-badge wb-badge-aqua">${langCode.toUpperCase()}</span></div></td>
          <td>
            <strong style="color:var(--wb-teal);font-size:1rem;">${esc(item.w)}</strong>${srcBadge}
            <div class="wb-muted" style="font-size:0.8rem;">${esc(item.p || '')}</div>
          </td>
          <td style="font-family:var(--wb-font-mono);font-size:0.86rem;">${esc(item.i || '')}</td>
          <td>${esc(item.m || '')}${exHtml}</td>
          <td><span class="wb-badge">${esc(item.t || '')}</span></td>
          <td style="white-space:nowrap;">
            <button type="button" class="wb-btn wb-btn-ghost wb-btn-sm" data-wb-tts="${esc(item.w)}" data-wb-lang="${langCode}" aria-label="${isEnglish() ? 'Play pronunciation' : 'Nghe phát âm'}"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9zM17 8a6 6 0 0 1 0 8"/></svg></button>
            ${authenticated ? `<button type="button" class="wb-btn wb-btn-primary wb-btn-sm" data-save-vocab="" data-domain="${esc(slug)}" data-term="${Number(item.n)}">${isEnglish() ? 'Save' : 'Lưu sổ từ'}</button>` : `<button type="button" class="wb-btn wb-btn-sm" data-auth-intent="specialized.save">${isEnglish() ? 'Sign in' : 'Đăng nhập lưu'}</button>`}
            <a class="wb-btn wb-btn-outline wb-btn-sm" href="/dictionary?q=${encodeURIComponent(item.w)}">${isEnglish() ? 'Look up' : 'Tra từ'}</a>
          </td>
        </tr>`;
      }).join('');
    }

    if (pagerEl) {
      pagerEl.innerHTML = `
        <button type="button" class="wb-btn wb-btn-outline wb-btn-sm" data-vpage="${Math.max(1, currentPage - 1)}" ${currentPage <= 1 ? 'disabled' : ''}>${isEnglish() ? 'Previous page' : 'Trang trước'}</button>
        <span class="wb-badge">${isEnglish() ? 'Page' : 'Trang'} ${currentPage} / ${totalPages}</span>
        <button type="button" class="wb-btn wb-btn-outline wb-btn-sm" data-vpage="${Math.min(totalPages, currentPage + 1)}" ${currentPage >= totalPages ? 'disabled' : ''}>${isEnglish() ? 'Next page' : 'Trang sau'}</button>
      `;
    }
  }

  pagerEl?.addEventListener('click', (ev) => {
    const btn = ev.target.closest('button[data-vpage]');
    if (!btn || btn.disabled) return;
    loadPage(Number(btn.getAttribute('data-vpage')) || 1);
    root.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  });

  searchInput?.addEventListener('input', applyFilter);
  langSelect?.addEventListener('change', applyFilter);
  srcSelect?.addEventListener('change', applyFilter);
  topicSelect?.addEventListener('change', applyFilter);

  loadPage(1);
})();
