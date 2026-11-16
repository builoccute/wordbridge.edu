'use strict';

/**
 * WORD BRIDGE FRONTEND CORE (src/frontend/js/app-core.js)
 * - Quy chuẩn biểu tượng đơn sắc (WB.icon) đồng nhất độ dày nét, không sử dụng emoji thay icon.
 * - Lưu phiên xác thực an toàn qua HttpOnly Cookie và biến trạng thái phiên (không lưu wb_token lâu dài trong localStorage).
 * - Tách biệt rõ Ngôn ngữ giao diện (uiLocale) và Ngôn ngữ đang học (selectedLanguage).
 * - Không hiển thị đường dẫn Quản trị trên Header hoặc Footer công khai.
 */

const MONO_ICONS = {
  home: '<path d="M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1v-9.5z"/>',
  book: '<path d="M2 4h7a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H2V4zm20 0h-7a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h8V4z"/>',
  cap: '<path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3z"/><path d="M5 13.18v4L12 21l7-3.82v-4"/>',
  users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  userPlus: '<path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/>',
  user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  building: '<rect x="4" y="2" width="16" height="20" rx="2"/><line x1="9" y1="6" x2="9.01" y2="6"/><line x1="15" y1="6" x2="15.01" y2="6"/><line x1="9" y1="10" x2="9.01" y2="10"/><line x1="15" y1="10" x2="15.01" y2="10"/><line x1="9" y1="14" x2="9.01" y2="14"/><line x1="15" y1="14" x2="15.01" y2="14"/><path d="M9 22v-4h6v4"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
  award: '<circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>',
  headphones: '<path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>',
  layers: '<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>',
  chat: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  news: '<path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><line x1="10" y1="6" x2="18" y2="6"/><line x1="10" y1="10" x2="18" y2="10"/><line x1="10" y1="14" x2="14" y2="14"/>',
  search: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
  bell: '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>',
  lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  check: '<polyline points="20 6 9 17 4 12"/>',
  x: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
  arrowRight: '<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>',
  volume: '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>',
  pause: '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" height="16" width="4"/>',
  mic: '<path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>',
  chart: '<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>',
  folder: '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>',
  clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  flag: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>',
  mail: '<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
  sparkle: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
  heart: '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>',
  bookmark: '<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>',
  plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
  refresh: '<polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>',
  database: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>'
};

// Xóa mọi token cũ còn sót trong localStorage để tuân thủ bảo mật Cookie HttpOnly (PHẦN XVIII.3)
try {
  localStorage.removeItem('wb_token');
} catch (_) {}

window.WB = {
  state: {
    bootstrap: null,
    user: null,
    token: '',
    adminToken: '',
    uiLocale: 'vi',          // Ngôn ngữ giao diện (Mặc định Tiếng Việt - Độc lập hoàn toàn với ngôn ngữ đang học)
    selectedLanguage: 'en',  // Ngôn ngữ mục tiêu trong bài thực hành
    activeExamSession: null
  },
  views: {},

  icon(name, size = 18) {
    const inner = MONO_ICONS[name] || MONO_ICONS.sparkle;
    return `<svg class="wb-icon" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;
  },

  registerView(routePath, renderFn) {
    this.views[routePath] = renderFn;
  },

  toast(message, type = 'info') {
    const container = document.getElementById('wbToastContainer');
    if (!container) return;
    const el = document.createElement('div');
    el.className = 'wb-toast';
    if (type === 'error') el.style.borderLeftColor = '#FF5A43';
    if (type === 'success') el.style.borderLeftColor = '#2CE59B';
    el.textContent = message;
    container.appendChild(el);
    setTimeout(() => el.remove(), 4500);
  },

  async api(path, options = {}) {
    const headers = Object.assign({ 'Content-Type': 'application/json' }, options.headers || {});
    const isAdmPath = path.startsWith('/api/admin') || path.startsWith('/api/cms');
    const activeToken = (isAdmPath && this.state.adminToken) ? this.state.adminToken : (this.state.token || this.state.adminToken);
    if (activeToken) {
      headers['Authorization'] = `Bearer ${activeToken}`;
    }
    const res = await fetch(path, {
      method: options.method || 'GET',
      headers,
      credentials: 'same-origin',
      body: options.body ? JSON.stringify(options.body) : undefined
    });
    const data = await res.json();
    if (!res.ok || data.ok === false) {
      const err = new Error(data.error || 'Yêu cầu không thành công.');
      err.statusCode = res.status;
      throw err;
    }
    return data;
  },

  setSession(user, token, isAdmin = false) {
    this.state.user = user;
    if (isAdmin) {
      this.state.adminToken = token || '';
    } else {
      this.state.token = token || '';
    }
    if (!user && !token) {
      this.state.token = '';
      this.state.adminToken = '';
    }
    this.renderHeaderUser();
  },

  renderHeaderUser() {
    const box = document.getElementById('wbHeaderUserArea');
    if (!box) return;
    const u = this.state.user;
    if (!u) {
      box.innerHTML = `
        <a href="/dang-nhap" class="wb-btn wb-btn-outline wb-btn-header" data-nav="/dang-nhap">Đăng nhập</a>
        <a href="/dang-ky" class="wb-btn wb-btn-accent wb-btn-header" data-nav="/dang-ky">Đăng ký</a>
      `;
      return;
    }
    // PHẦN XVIII: Tuyệt đối không đưa liên kết quản trị lên Header công khai
    box.innerHTML = `
      <a href="/thong-bao" class="wb-btn wb-btn-outline wb-btn-header" data-nav="/thong-bao" title="Thông báo của tôi">
        ${this.icon('bell', 16)}
      </a>
      <a href="/ho-so" class="wb-btn wb-btn-primary wb-btn-header" data-nav="/ho-so">
        ${this.icon('user', 16)}
        <span>${u.full_name}</span>
      </a>
      <button type="button" class="wb-btn wb-btn-outline wb-btn-header" id="wbLogoutBtn">Đăng xuất</button>
    `;
    const logoutBtn = document.getElementById('wbLogoutBtn');
    if (logoutBtn) {
      logoutBtn.onclick = async () => {
        try {
          await this.api('/api/auth/logout', { method: 'POST', body: {} });
        } catch (_) {}
        this.setSession(null, '');
        this.toast('Đã đăng xuất khỏi tài khoản WORD BRIDGE.');
        this.navigate('/');
      };
    }
  },

  updateHeaderActiveState(pathname) {
    const cleanPath = String(pathname || '/').split('?')[0];
    document.querySelectorAll('#wbMainNav .wb-nav-link').forEach(link => {
      link.classList.remove('active');
      const grp = link.getAttribute('data-nav-group');
      if (cleanPath === '/' && grp === 'home') link.classList.add('active');
      else if ((cleanPath.startsWith('/hoc-tap') || cleanPath === '/ngon-ngu' || cleanPath === '/tien-do' || cleanPath === '/tai-nguyen') && grp === 'learning') link.classList.add('active');
      else if ((cleanPath === '/cong-dong' || cleanPath.startsWith('/cong-dong/clb') || cleanPath.startsWith('/cong-dong/doi') || cleanPath.startsWith('/cong-dong/nhom') || cleanPath === '/ket-noi' || cleanPath === '/ban-be' || cleanPath === '/tin-nhan') && grp === 'community') link.classList.add('active');
      else if ((cleanPath === '/cong-dong/to-chuc' || cleanPath === '/dang-ky-to-chuc' || cleanPath === '/khong-gian-cua-toi' || cleanPath === '/to-chuc') && grp === 'organization') link.classList.add('active');
      else if (cleanPath.startsWith('/khao-thi') && grp === 'exam') link.classList.add('active');
      else if (cleanPath.startsWith('/tin-tuc') && grp === 'news') link.classList.add('active');
      else if ((cleanPath === '/ho-tro' || cleanPath === '/goi-dich-vu' || cleanPath === '/dich-vu' || cleanPath.startsWith('/thanh-toan') || cleanPath === '/phap-ly' || cleanPath === '/gioi-thieu') && grp === 'support') link.classList.add('active');
    });
  },

  closeMobileMenu() {
    const mainNav = document.getElementById('wbMainNav');
    const mobileBtn = document.getElementById('wbMobileMenuBtn');
    if (mainNav) mainNav.classList.remove('mobile-open');
    if (mobileBtn) mobileBtn.setAttribute('aria-expanded', 'false');
  },

  async navigate(rawPath, pushState = true) {
    const [pathname, queryString] = String(rawPath || '/').split('?');
    if (pathname === '/su-kien' || pathname.startsWith('/su-kien/')) {
      this.toast('Các thử thách và lịch sinh hoạt được tổ chức trực tiếp trong Nhóm hoặc Tổ chức.', 'error');
      return;
    }
    const fullUrl = queryString ? `${pathname}?${queryString}` : pathname;
    if (pushState && (window.location.pathname + window.location.search) !== fullUrl) {
      window.history.pushState({}, '', fullUrl);
    }
    this.closeMobileMenu();
    this.updateHeaderActiveState(pathname);

    const root = document.getElementById('wbAppRoot');
    if (!root) return;
    const viewFn = this.views[pathname] || this.views['*'];
    if (viewFn) {
      await viewFn(root, pathname, new URLSearchParams(queryString || window.location.search));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  },

  async init() {
    try {
      const boot = await this.api('/api/system/bootstrap');
      this.state.bootstrap = boot;
      if (boot.current_user) {
        this.state.user = boot.current_user;
      }
      this.renderHeaderUser();
    } catch (e) {
      console.error('Bootstrap error:', e);
    }

    document.body.addEventListener('click', e => {
      const navEl = e.target.closest('[data-nav]');
      if (navEl) {
        e.preventDefault();
        const targetPath = navEl.getAttribute('data-nav');
        this.navigate(targetPath);
      }
    });

    const mobileBtn = document.getElementById('wbMobileMenuBtn');
    const mainNav = document.getElementById('wbMainNav');
    if (mobileBtn && mainNav) {
      mobileBtn.onclick = () => {
        const isOpen = mainNav.classList.toggle('mobile-open');
        mobileBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      };
    }

    // PHẦN II.1: Thay đổi ngôn ngữ giao diện KHÔNG làm thay đổi ngôn ngữ đang học của tài khoản
    const uiLangSelect = document.getElementById('wbUiLocaleSelect');
    if (uiLangSelect) {
      uiLangSelect.onchange = () => {
        this.state.uiLocale = uiLangSelect.value;
        const learningLangs = this.state.user?.learning_languages || [this.state.selectedLanguage];
        this.toast(
          `Đã cập nhật ngôn ngữ giao diện hiển thị (${uiLangSelect.value.toUpperCase()}). Ngôn ngữ đang học của tài khoản (${learningLangs.join(', ').toUpperCase()}) được giữ nguyên độc lập.`
        );
      };
    }

    // PHẦN XIII: Tìm kiếm thống nhất toàn nền tảng (/tim-kiem)
    const searchForm = document.getElementById('wbGlobalSearchForm');
    if (searchForm) {
      searchForm.onsubmit = e => {
        e.preventDefault();
        const q = document.getElementById('wbGlobalSearchInput')?.value || '';
        this.navigate('/tim-kiem?q=' + encodeURIComponent(q.trim()));
      };
    }

    window.addEventListener('popstate', () => {
      this.navigate(window.location.pathname + window.location.search, false);
    });

    await this.navigate(window.location.pathname + window.location.search, false);
  }
};

document.addEventListener('DOMContentLoaded', () => window.WB.init());
