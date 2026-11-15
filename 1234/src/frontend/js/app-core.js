'use strict';

window.WB = {
  state: {
    bootstrap: null,
    user: null,
    token: localStorage.getItem('wb_token') || '',
    selectedLanguage: 'en',
    activeExamSession: null
  },
  views: {},

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
    if (this.state.token) {
      headers['Authorization'] = `Bearer ${this.state.token}`;
    }
    const res = await fetch(path, {
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined
    });
    const data = await res.json();
    if (!res.ok || data.ok === false) {
      throw new Error(data.error || 'Yêu cầu không thành công.');
    }
    return data;
  },

  setSession(user, token) {
    this.state.user = user;
    this.state.token = token || '';
    if (token) {
      localStorage.setItem('wb_token', token);
      document.cookie = `wb_token=${encodeURIComponent(token)}; path=/; SameSite=Lax`;
    } else {
      localStorage.removeItem('wb_token');
      document.cookie = 'wb_token=; Max-Age=0; path=/';
    }
    this.renderHeaderUser();
  },

  renderHeaderUser() {
    const box = document.getElementById('wbHeaderUserArea');
    if (!box) return;
    const u = this.state.user;
    if (!u) {
      box.innerHTML = `
        <a href="/dang-nhap" class="wb-btn wb-btn-outline" data-nav="/dang-nhap">Đăng nhập</a>
        <a href="/dang-ky" class="wb-btn wb-btn-accent" data-nav="/dang-ky">Đăng ký</a>
      `;
      return;
    }
    const isAdmin = u.role && u.role !== 'user' && u.role !== 'org_owner';
    box.innerHTML = `
      <a href="/thong-bao" class="wb-btn wb-btn-outline" data-nav="/thong-bao" title="Thông báo">🔔</a>
      <a href="/ho-so" class="wb-btn wb-btn-primary" data-nav="/ho-so">👤 ${u.full_name}</a>
      ${isAdmin ? `<a href="/quan-tri" class="wb-btn wb-btn-accent" data-nav="/quan-tri">Quản trị</a>` : ''}
      <button type="button" class="wb-btn wb-btn-outline" id="wbLogoutBtn">Đăng xuất</button>
    `;
    const logoutBtn = document.getElementById('wbLogoutBtn');
    if (logoutBtn) {
      logoutBtn.onclick = () => {
        this.setSession(null, '');
        this.toast('Đã đăng xuất khỏi tài khoản WORD BRIDGE.');
        this.navigate('/');
      };
    }
  },

  async navigate(pathname, pushState = true) {
    if (pathname === '/su-kien' || pathname.startsWith('/su-kien/')) {
      this.toast('Mục Sự kiện đã được loại bỏ khỏi kiến trúc WORD BRIDGE. Vui lòng sử dụng Nhóm hoặc Tổ chức.', 'error');
      return;
    }
    if (pushState && window.location.pathname !== pathname) {
      window.history.pushState({}, '', pathname);
    }
    const root = document.getElementById('wbAppRoot');
    if (!root) return;
    const viewFn = this.views[pathname] || this.views['*'];
    if (viewFn) {
      await viewFn(root, pathname);
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
      mobileBtn.onclick = () => mainNav.classList.toggle('mobile-open');
    }

    const searchForm = document.getElementById('wbGlobalSearchForm');
    if (searchForm) {
      searchForm.onsubmit = e => {
        e.preventDefault();
        const q = document.getElementById('wbGlobalSearchInput')?.value || '';
        this.navigate('/tai-nguyen?q=' + encodeURIComponent(q));
      };
    }

    window.addEventListener('popstate', () => {
      this.navigate(window.location.pathname, false);
    });

    await this.navigate(window.location.pathname, false);
  }
};

document.addEventListener('DOMContentLoaded', () => window.WB.init());
