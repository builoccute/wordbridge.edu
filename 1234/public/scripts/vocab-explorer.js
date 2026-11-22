/**
 * WORD BRIDGE — Interactive Word-by-Word Specialized Vocabulary Explorer (12,104 words / 12 domains)
 * Loads per-domain structured JSON from /data/vocab/<slug>.json (NO PDF/XLSX/EXE files).
 * Supports source-backed preview, authenticated search/topic filtering, pagination and browser pronunciation playback.
 */
(function () {
  const root = document.getElementById('wb-vocab-explorer');
  if (!root) return;

  const slug = root.getAttribute('data-domain-slug');
  const authenticated = root.getAttribute('data-is-authenticated') === 'true';
  const searchInput = document.getElementById('wb-vocab-search');
  const topicSelect = document.getElementById('wb-vocab-topic');
  const listEl = document.getElementById('wb-vocab-list');
  const statsEl = document.getElementById('wb-vocab-stats');
  const pagerEl = document.getElementById('wb-vocab-pager');

  let words = [], topics = [], total = 0, currentPage = 1;
  let requestNumber = 0;
  const PAGE_SIZE = 50;
  const isEnglish = () => document.documentElement.lang === 'en';
  function esc(s) {
    return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
  async function loadPage(page) {
    const sequence=++requestNumber;
    const params=new URLSearchParams({domain:slug,q:searchInput?.value || '',topic:topicSelect?.value || '',page});
    const endpoint=authenticated ? '/api/v1/specialized/terms?'+params : '/data/vocab/'+encodeURIComponent(slug)+'.json';
    try {
      const response=await fetch(endpoint);
      if(sequence!==requestNumber) return;
      if(response.status===401) {window.WB_AUTH.open('specialized.search',location.href);return;}
      if(!response.ok) throw new Error('DATA_UNAVAILABLE');
      const data=await response.json();
      if(sequence!==requestNumber) return;
      words=authenticated ? data.words : data.words.slice(0,10);
      topics=data.topics || [];
      currentPage=authenticated ? data.page : 1;
      total=authenticated ? data.total : words.length;
      renderPage();
    } catch {
      if(sequence!==requestNumber) return;
      statsEl.textContent=isEnglish()?'Vocabulary unavailable.':'Không thể tải từ vựng.';
      listEl.replaceChildren();
      pagerEl.replaceChildren();
    }
  }
  function applyFilter(){
    if(!authenticated){window.WB_AUTH.open('specialized.search',location.href);return;}
    loadPage(1);
  }
  document.addEventListener('wb-locale-change',renderPage);
  function renderPage() {
    if (!listEl) return;
    if (topicSelect) {
      const selected=topicSelect.value;
      topicSelect.innerHTML=`<option value="">${isEnglish()?'All topics':'Tất cả chủ đề'}</option>`+topics.map(t=>`<option value="${esc(t)}">${esc(t)}</option>`).join('');
      topicSelect.value=selected;
    }
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    currentPage = Math.min(currentPage, totalPages);
    const start = (currentPage - 1) * PAGE_SIZE;
    const slice = words;

    if (statsEl) {
      statsEl.textContent = isEnglish() ? `Showing ${total ? start + 1 : 0}–${Math.min(start + PAGE_SIZE, total)} of ${total.toLocaleString('en-US')} specialized terms` : `Đang hiển thị ${total ? start + 1 : 0}–${Math.min(start + PAGE_SIZE, total)} trên tổng số ${total.toLocaleString('vi-VN')} từ vựng chuyên ngành`;
    }

    if (!slice.length) {
      listEl.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:24px;">${isEnglish() ? 'No vocabulary matches the current filters.' : 'Không tìm thấy từ vựng phù hợp với bộ lọc hiện tại.'}</td></tr>`;
    } else {
      listEl.innerHTML = slice.map((item) => `
        <tr>
          <td><strong>${item.n}</strong></td>
          <td>
            <strong style="color:var(--wb-teal);font-size:1rem;">${esc(item.w)}</strong>
            <div class="wb-muted" style="font-size:0.8rem;">${esc(item.p)}</div>
          </td>
          <td style="font-family:var(--wb-font-mono);font-size:0.86rem;">${esc(item.i)}</td>
          <td>${esc(item.m)}</td>
          <td><span class="wb-badge">${esc(item.t)}</span></td>
          <td style="white-space:nowrap;">
            ${authenticated ? `<button type="button" class="wb-btn wb-btn-ghost wb-btn-sm" data-wb-tts="${esc(item.w)}" data-wb-lang="en" aria-label="${isEnglish() ? 'Play pronunciation' : 'Nghe phát âm'}"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9zM17 8a6 6 0 0 1 0 8"/></svg></button>` : ''}
            ${authenticated ? `<button type="button" class="wb-btn wb-btn-primary" data-save-vocab="" data-domain="${esc(slug)}" data-term="${Number(item.n)}">${isEnglish() ? 'Add to learning' : 'Thêm vào sổ từ'}</button>` : `<button type="button" class="wb-btn" data-auth-intent="specialized.save">${isEnglish() ? 'Sign in to save' : 'Đăng nhập để lưu'}</button>`}
            <a class="wb-btn wb-btn-outline wb-btn-sm" href="/dictionary?q=${encodeURIComponent(item.w)}">${isEnglish() ? 'Look up' : 'Tra từ'}</a>
          </td>
        </tr>`).join('');
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
  topicSelect?.addEventListener('change', applyFilter);

  loadPage(1);
})();
