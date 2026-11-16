'use strict';
const crypto = require('crypto');
const { requirePermission } = require('../security/rbac.middleware');
const { sanitizeHtmlForCms } = require('../security/defense.middleware');

/**
 * TRUNG TÂM NỘI DUNG CMS, TIN TỨC CHÍNH THỨC (PHẦN XIV) & TÌM KIẾM TOÀN NỀN TẢNG (PHẦN XIII & XXI.16)
 * - Tin tức (/tin-tuc): Danh sách bài viết, Phân loại, Trang chi tiết, Tìm kiếm bài viết, Bài viết liên quan, Hướng dẫn sử dụng, Cập nhật sản phẩm, Tin tức cộng đồng. Admin có CMS tạo/sửa/xem trước/lưu nháp/xuất bản.
 * - Tìm kiếm toàn nền tảng (/tim-kiem & /api/search): Tìm kiếm thống nhất trên 10 nhóm (Ngoại ngữ, Bài thực hành, Từ vựng, Tài liệu, Bài viết cộng đồng, Nhóm, Tổ chức, Người học cho phép tìm thấy, Tin tức, Trang hướng dẫn) kèm 5 bộ lọc (Ngôn ngữ, Trình độ, Chủ đề, Loại nội dung, Thời gian). Không hiển thị dữ liệu riêng tư.
 */
class CmsModule {
  constructor(db) {
    this.db = db;
  }

  listPages() {
    return this.db.query(`SELECT * FROM cms_pages ORDER BY slug ASC`);
  }

  getPageBySlug(slug) {
    return this.db.get(`SELECT * FROM cms_pages WHERE slug = ?`, [slug]);
  }

  saveOrUpdatePage(editorUser, body) {
    requirePermission(editorUser, 'cms.manage');
    const {
      slug,
      title,
      page_group = 'public',
      html_content,
      blocks = [],
      seo_title = '',
      seo_description = '',
      workflow_action = 'save_draft',
      change_note = 'Cập nhật nội dung từ trình soạn thảo quản trị'
    } = body || {};

    if (!slug || !title || html_content === undefined) {
      throw new Error('Vui lòng nhập đường dẫn, tiêu đề và nội dung trang.');
    }

    const allowAdvancedJs = editorUser.role === 'super_admin' || editorUser.role === 'system_admin';
    const cleanHtml = sanitizeHtmlForCms(html_content, allowAdvancedJs);

    let status = 'draft';
    if (workflow_action === 'submit_review') status = 'pending_review';
    else if (workflow_action === 'publish') {
      requirePermission(editorUser, 'cms.publish');
      status = 'published';
    } else if (workflow_action === 'unpublish') {
      requirePermission(editorUser, 'cms.publish');
      status = 'unpublished';
    }

    const existing = this.db.get(`SELECT * FROM cms_pages WHERE slug = ?`, [slug]);
    const nowIso = new Date().toISOString();
    const pageId = existing ? existing.id : ('cms_' + crypto.randomBytes(8).toString('hex'));
    const nextVersion = existing ? (existing.version + 1) : 1;

    if (existing) {
      this.db.run(
        `UPDATE cms_pages
         SET title = ?, page_group = ?, html_content = ?, blocks_json = ?,
             seo_title = ?, seo_description = ?, status = ?, version = ?, updated_by = ?, updated_at = ?
         WHERE id = ?`,
        [
          String(title).trim(),
          page_group,
          cleanHtml,
          JSON.stringify(blocks),
          seo_title || title,
          seo_description || title,
          status,
          nextVersion,
          editorUser.id,
          nowIso,
          pageId
        ]
      );
    } else {
      this.db.run(
        `INSERT INTO cms_pages (
          id, slug, title, page_group, html_content, blocks_json,
          seo_title, seo_description, status, version, updated_by, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
        [
          pageId,
          slug,
          String(title).trim(),
          page_group,
          cleanHtml,
          JSON.stringify(blocks),
          seo_title || title,
          seo_description || title,
          status,
          editorUser.id,
          nowIso
        ]
      );
    }

    const verId = 'cmsv_' + crypto.randomBytes(8).toString('hex');
    this.db.run(
      `INSERT INTO cms_page_versions (id, page_id, version, title, html_content, blocks_json, editor_id, change_note, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [verId, pageId, nextVersion, String(title).trim(), cleanHtml, JSON.stringify(blocks), editorUser.id, change_note, nowIso]
    );

    return {
      page: this.db.get(`SELECT * FROM cms_pages WHERE id = ?`, [pageId]),
      versions: this.db.query(`SELECT id, version, editor_id, change_note, created_at FROM cms_page_versions WHERE page_id = ? ORDER BY version DESC`, [pageId])
    };
  }

  restorePageVersion(editorUser, { page_id, version }) {
    requirePermission(editorUser, 'cms.manage');
    const ver = this.db.get(`SELECT * FROM cms_page_versions WHERE page_id = ? AND version = ?`, [page_id, Number(version)]);
    if (!ver) throw new Error('Không tìm thấy phiên bản nội dung cần khôi phục.');
    const nowIso = new Date().toISOString();
    this.db.run(
      `UPDATE cms_pages SET title = ?, html_content = ?, blocks_json = ?, version = ?, updated_by = ?, updated_at = ? WHERE id = ?`,
      [ver.title, ver.html_content, ver.blocks_json, ver.version, editorUser.id, nowIso, page_id]
    );
    return this.db.get(`SELECT * FROM cms_pages WHERE id = ?`, [page_id]);
  }

  /**
   * PHẦN XIV: HỆ THỐNG TIN TỨC VÀ BÀI VIẾT HƯỚNG DẪN (/tin-tuc)
   */
  translateNewsCategory(cat) {
    const map = {
      cap_nhat_san_pham: 'Cập nhật sản phẩm',
      huong_dan: 'Hướng dẫn sử dụng nền tảng',
      cong_dong: 'Tin tức cộng đồng',
      kinh_nghiem: 'Kinh nghiệm tự thực hành'
    };
    return map[cat] || 'Tin tức chung';
  }

  listNewsArticles({ category = null, q = null, includeDrafts = false } = {}) {
    const clauses = includeDrafts ? ['1=1'] : ["status = 'published'"];
    const params = [];
    if (category) {
      clauses.push('category = ?');
      params.push(category);
    }
    if (q) {
      clauses.push('(title LIKE ? OR summary LIKE ? OR html_content LIKE ?)');
      params.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }
    const rows = this.db.query(
      `SELECT * FROM news_articles WHERE ${clauses.join(' AND ')} ORDER BY COALESCE(published_at, created_at) DESC`,
      params
    );
    return rows.map(r => ({
      ...r,
      category_name_vi: this.translateNewsCategory(r.category)
    }));
  }

  getNewsArticleDetail(idOrSlug) {
    const article = this.db.get(
      `SELECT * FROM news_articles WHERE (id = ? OR slug = ?) AND status = 'published'`,
      [idOrSlug, idOrSlug]
    );
    if (!article) {
      const err = new Error('Không tìm thấy bài viết tin tức.');
      err.statusCode = 404;
      throw err;
    }
    const related = this.db.query(
      `SELECT id, slug, category, title, summary, published_at, created_at
       FROM news_articles
       WHERE status = 'published' AND id != ?
       ORDER BY CASE WHEN category = ? THEN 0 ELSE 1 END, published_at DESC
       LIMIT 3`,
      [article.id, article.category]
    ).map(r => ({
      ...r,
      category_name_vi: this.translateNewsCategory(r.category)
    }));
    return {
      article: {
        ...article,
        category_name_vi: this.translateNewsCategory(article.category)
      },
      related_articles: related
    };
  }

  saveOrUpdateNewsArticle(editorUser, body) {
    requirePermission(editorUser, 'cms.manage');
    const {
      id = null,
      slug = '',
      category = 'cap_nhat_san_pham',
      title,
      summary = '',
      html_content = '',
      language_code = 'vi',
      workflow_action = 'save_draft' // save_draft | publish | archive
    } = body || {};

    if (!title || !html_content) {
      throw new Error('Vui lòng nhập đầy đủ tiêu đề và nội dung bài viết tin tức.');
    }
    const cleanHtml = sanitizeHtmlForCms(html_content, false);
    const nowIso = new Date().toISOString();
    let status = 'draft';
    let publishedAt = null;
    if (workflow_action === 'publish') {
      requirePermission(editorUser, 'cms.publish');
      status = 'published';
      publishedAt = nowIso;
    } else if (workflow_action === 'archive') {
      status = 'archived';
    }

    const cleanSlug = String(slug || title)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') + '-' + crypto.randomBytes(2).toString('hex');

    const existing = id ? this.db.get(`SELECT * FROM news_articles WHERE id = ?`, [id]) : null;
    if (existing) {
      this.db.run(
        `UPDATE news_articles
         SET category = ?, title = ?, summary = ?, html_content = ?, language_code = ?,
             status = ?, published_at = COALESCE(?, published_at), updated_at = ?
         WHERE id = ?`,
        [
          category,
          String(title).trim(),
          String(summary || title).trim(),
          cleanHtml,
          language_code,
          status,
          publishedAt,
          nowIso,
          existing.id
        ]
      );
      return this.db.get(`SELECT * FROM news_articles WHERE id = ?`, [existing.id]);
    }

    const newId = 'news_' + crypto.randomBytes(6).toString('hex');
    this.db.run(
      `INSERT INTO news_articles (
        id, slug, category, title, summary, html_content, language_code,
        author_id, status, published_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newId,
        cleanSlug,
        category,
        String(title).trim(),
        String(summary || title).trim(),
        cleanHtml,
        language_code,
        editorUser.id,
        status,
        publishedAt,
        nowIso,
        nowIso
      ]
    );
    return this.db.get(`SELECT * FROM news_articles WHERE id = ?`, [newId]);
  }

  /**
   * PHẦN XIII & XXI.16: TÌM KIẾM THỐNG NHẤT TOÀN NỀN TẢNG (/api/search)
   * Tìm trên 10 nhóm nội dung, hỗ trợ 5 bộ lọc (language_code, level, topic, content_type, time_range)
   * và bảo vệ tuyệt đối dữ liệu riêng tư (không trả về email, SĐT, vị trí chính xác hay tài liệu nội bộ trái phép).
   */
  searchPlatformUnified(viewerUser = null, query = {}) {
    const q = String(query.q || '').trim();
    const qLower = q.toLowerCase();
    const langFilter = query.language_code || '';
    const levelFilter = query.level || '';
    const topicFilter = String(query.topic || '').trim().toLowerCase();
    const typeFilter = query.content_type || 'all';
    const timeRange = query.time_range || 'all'; // today | week | month | all

    let sinceIso = null;
    const nowMs = Date.now();
    if (timeRange === 'today') sinceIso = new Date(nowMs - 24 * 3600 * 1000).toISOString();
    else if (timeRange === 'week') sinceIso = new Date(nowMs - 7 * 24 * 3600 * 1000).toISOString();
    else if (timeRange === 'month') sinceIso = new Date(nowMs - 30 * 24 * 3600 * 1000).toISOString();

    const matchText = (...fields) => {
      if (!qLower) return true;
      return fields.some(f => String(f || '').toLowerCase().includes(qLower));
    };
    const matchTime = (createdAt) => {
      if (!sinceIso || !createdAt) return true;
      return createdAt >= sinceIso;
    };

    const includeType = (t) => typeFilter === 'all' || typeFilter === t;

    // 1. Ngoại ngữ (languages)
    const languages = includeType('languages')
      ? this.db.query(`SELECT code, name_vi, native_name, script_system, description FROM languages WHERE is_active = 1`)
          .filter(l => (!langFilter || l.code === langFilter) && matchText(l.name_vi, l.native_name, l.script_system, l.description))
      : [];

    // 2. Bài thực hành (exercises)
    const exercises = includeType('exercises')
      ? this.db.query(`SELECT id, language_code, tool_type, level, topic, title, instructions, points, created_at FROM practice_exercises`)
          .filter(e =>
            (!langFilter || e.language_code === langFilter) &&
            (!levelFilter || e.level === levelFilter) &&
            (!topicFilter || String(e.topic).toLowerCase().includes(topicFilter)) &&
            matchTime(e.created_at) &&
            matchText(e.title, e.topic, e.instructions, e.level)
          )
      : [];

    // 3. Từ vựng (vocabulary)
    const vocabulary = includeType('vocabulary')
      ? this.db.query(
          `SELECT vi.id, vi.language_code, vi.term, vi.pronunciation, vi.meaning_vi, vi.example_sentence, vi.created_at
           FROM vocabulary_items vi
           JOIN vocabulary_sets vs ON vi.set_id = vs.id
           WHERE vs.is_public = 1 OR vs.user_id = ?`,
          [viewerUser ? viewerUser.id : '']
        ).filter(v =>
          (!langFilter || v.language_code === langFilter) &&
          matchTime(v.created_at) &&
          matchText(v.term, v.pronunciation, v.meaning_vi, v.example_sentence)
        )
      : [];

    // 4. Tài liệu (resources - Chỉ lấy tài liệu công khai hoặc được phép xem, không lộ tài liệu riêng tư)
    const resources = includeType('resources')
      ? this.db.query(
          `SELECT id, language_code, resource_type, title, description, access_scope, created_at
           FROM resources WHERE moderation_status = 'approved' AND access_scope = 'public'`
        ).filter(r =>
          (!langFilter || r.language_code === langFilter) &&
          matchTime(r.created_at) &&
          matchText(r.title, r.description, r.resource_type)
        )
      : [];

    // 5. Bài viết cộng đồng (community_posts - Chỉ lấy bài công khai)
    const posts = includeType('posts')
      ? this.db.query(
          `SELECT id, language_code, topic_tag, title, content, likes_count, comments_count, created_at
           FROM community_posts WHERE moderation_status = 'published' AND visibility = 'public'`
        ).filter(p =>
          (!langFilter || p.language_code === langFilter) &&
          (!topicFilter || String(p.topic_tag).toLowerCase().includes(topicFilter)) &&
          matchTime(p.created_at) &&
          matchText(p.title, p.content, p.topic_tag)
        )
      : [];

    // 6. Nhóm cộng đồng (groups - Chỉ lấy nhóm công khai)
    const groups = includeType('groups')
      ? this.db.query(
          `SELECT id, group_category, name, language_code, description, member_count, created_at
           FROM community_groups WHERE privacy = 'public'`
        ).filter(g =>
          (!langFilter || g.language_code === langFilter) &&
          matchTime(g.created_at) &&
          matchText(g.name, g.description, g.group_category)
        )
      : [];

    // 7. Tổ chức (organizations - Chỉ lấy thông tin giới thiệu công khai, tuyệt đối không lộ email/SĐT đại diện hay dữ liệu nội bộ)
    const organizations = includeType('organizations')
      ? this.db.query(
          `SELECT id, code, unit_category, name, short_name, field_of_activity, introduction, province_name, created_at
           FROM organizations WHERE status = 'active'`
        ).filter(o =>
          (!topicFilter || String(o.field_of_activity).toLowerCase().includes(topicFilter)) &&
          matchTime(o.created_at) &&
          matchText(o.name, o.short_name, o.field_of_activity, o.introduction, o.province_name)
        )
      : [];

    // 8. Người học (learners - Chỉ hiển thị người dùng active cho phép tìm thấy profile_visibility = 'public', ẩn hoàn toàn email/phone/location)
    const learners = includeType('learners')
      ? this.db.query(`SELECT * FROM users WHERE status = 'active' AND role = 'user'`)
          .filter(u => {
            const priv = JSON.parse(u.privacy_settings || '{}');
            if (priv.profile_visibility !== 'public') return false;
            const lLangs = JSON.parse(u.learning_languages || '[]');
            if (langFilter && !lLangs.includes(langFilter)) return false;
            if (levelFilter && u.proficiency_level !== levelFilter) return false;
            if (!matchTime(u.created_at)) return false;
            return matchText(u.full_name, u.username, u.learning_goals, u.bio);
          })
          .map(u => ({
            id: u.id,
            full_name: u.full_name,
            username: u.username,
            learning_languages: JSON.parse(u.learning_languages || '[]'),
            proficiency_level: u.proficiency_level,
            learning_goals: u.learning_goals,
            available_hours: u.available_hours
          }))
      : [];

    // 9. Tin tức (news)
    const news = includeType('news')
      ? this.listNewsArticles({ q: q || null }).filter(n =>
          (!langFilter || n.language_code === langFilter || n.language_code === 'vi') &&
          matchTime(n.created_at) &&
          matchText(n.title, n.summary, n.category_name_vi)
        )
      : [];

    // 10. Trang hướng dẫn (guides)
    const guides = includeType('guides')
      ? this.db.query(`SELECT id, slug, title, seo_description, updated_at FROM cms_pages WHERE status = 'published'`)
          .filter(g => matchText(g.title, g.seo_description))
      : [];

    const totalCount =
      languages.length +
      exercises.length +
      vocabulary.length +
      resources.length +
      posts.length +
      groups.length +
      organizations.length +
      learners.length +
      news.length +
      guides.length;

    return {
      query: q,
      filters: {
        language_code: langFilter,
        level: levelFilter,
        topic: topicFilter,
        content_type: typeFilter,
        time_range: timeRange
      },
      total_count: totalCount,
      empty_message: totalCount === 0
        ? 'Không tìm thấy nội dung phù hợp với từ khóa hoặc bộ lọc đã chọn. Vui lòng thử từ khóa khác hoặc mở rộng bộ lọc.'
        : null,
      results: {
        languages,
        exercises,
        vocabulary,
        resources,
        posts,
        groups,
        organizations,
        learners,
        news,
        guides
      }
    };
  }
}

module.exports = { CmsModule };
