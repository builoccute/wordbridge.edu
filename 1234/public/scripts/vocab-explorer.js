/**
 * WORD BRIDGE — Interactive Word-by-Word Specialized Vocabulary Explorer (12,104 words / 12 domains)
 * Loads per-domain structured JSON from /data/vocab/<slug>.json (NO PDF/XLSX/EXE files).
 * Supports instant search, topic filtering, pagination (50/page), pronunciation, and Save-to-Notebook.
 */
(function () {
  const root = document.getElementById('wb-vocab-explorer');
  if (!root) return;

  const slug = root.getAttribute('data-domain-slug');
  const searchInput = document.getElementById('wb-vocab-search');
  const topicSelect = document.getElementById('wb-vocab-topic');
  const listEl = document.getElementById('wb-vocab-list');
  const statsEl = document.getElementById('wb-vocab-stats');
  const pagerEl = document.getElementById('wb-vocab-pager');

  let allWords = [];
  let filtered = [];
  let currentPage = 1;
  const PAGE_SIZE = 50;

  function esc(s) {
    return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function applyFilter() {
    const q = (searchInput?.value || '').trim().toLowerCase();
    const topic = topicSelect?.value || '';
    filtered = allWords.filter((item) => {
      if (topic && item.t !== topic) return false;
      if (!q) return true;
      return item.w.toLowerCase().includes(q) || item.m.toLowerCase().includes(q) || item.i.toLowerCase().includes(q) || item.t.toLowerCase().includes(q);
    });
    currentPage = 1;
    renderPage();
  }

  function renderPage() {
    if (!listEl) return;
    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    currentPage = Math.min(currentPage, totalPages);
    const start = (currentPage - 1) * PAGE_SIZE;
    const slice = filtered.slice(start, start + PAGE_SIZE);

    if (statsEl) {
      statsEl.textContent = `Đang hiển thị ${total ? start + 1 : 0}–${Math.min(start + PAGE_SIZE, total)} trên tổng số ${total.toLocaleString('vi-VN')} từ vựng chuyên ngành`;
    }

    if (!slice.length) {
      listEl.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:24px;">Không tìm thấy từ vựng phù hợp với bộ lọc hiện tại.</td></tr>';
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
            <button type="button" class="wb-btn wb-btn-ghost wb-btn-sm" data-wb-tts="${esc(item.w)}" data-wb-lang="en" title="Nghe phát âm">🔊</button>
            <button type="button" class="wb-btn wb-btn-outline wb-btn-sm" data-save-vocab="${esc(slug)}_${item.n}">Lưu</button>
          </td>
        </tr>`).join('');
    }

    if (pagerEl) {
      pagerEl.innerHTML = `
        <button type="button" class="wb-btn wb-btn-outline wb-btn-sm" data-vpage="${Math.max(1, currentPage - 1)}" ${currentPage <= 1 ? 'disabled' : ''}>◀ Trang trước</button>
        <span class="wb-badge">Trang ${currentPage} / ${totalPages}</span>
        <button type="button" class="wb-btn wb-btn-outline wb-btn-sm" data-vpage="${Math.min(totalPages, currentPage + 1)}" ${currentPage >= totalPages ? 'disabled' : ''}>Trang sau ▶</button>
      `;
    }
  }

  pagerEl?.addEventListener('click', (ev) => {
    const btn = ev.target.closest('button[data-vpage]');
    if (!btn || btn.disabled) return;
    currentPage = Number(btn.getAttribute('data-vpage')) || 1;
    renderPage();
    root.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  searchInput?.addEventListener('input', applyFilter);
  topicSelect?.addEventListener('change', applyFilter);

  async function init() {
    try {
      const res = await fetch(`/data/vocab/${encodeURIComponent(slug)}.json`);
      if (!res.ok) throw new Error('Load failed');
      const data = await res.json();
      allWords = data.words || [];
      if (topicSelect && Array.isArray(data.topics)) {
        topicSelect.innerHTML = '<option value="">Tất cả nhóm chủ đề (' + data.topics.length + ')</option>' +
          data.topics.map((t) => `<option value="${esc(t)}">${esc(t)}</option>`).join('');
      }
      applyFilter();
    } catch {
      if (listEl) listEl.innerHTML = '<tr><td colspan="6">Không thể tải dữ liệu từ vựng lúc này.</td></tr>';
    }
  }

  init();
})();
