'use strict';
const crypto = require('crypto');
const { requirePermission } = require('../security/rbac.middleware');
const { sanitizeHtmlForCms } = require('../security/defense.middleware');

/**
 * WORD BRIDGE CMS – TRÌNH SOẠN THẢO DẠNG MICROSOFT WORD & CHỈNH SỬA WEBSITE (/quan-tri/cms - PHẦN 25)
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
      workflow_action = 'save_draft', // save_draft | submit_review | publish | unpublish
      change_note = 'Cập nhật nội dung từ WORD BRIDGE CMS Word Editor'
    } = body || {};

    if (!slug || !title || html_content === undefined) {
      throw new Error('Vui lòng nhập đường dẫn (slug), tiêu đề và nội dung trang CMS.');
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
    let pageId = existing ? existing.id : ('cms_' + crypto.randomBytes(8).toString('hex'));
    let nextVersion = existing ? (existing.version + 1) : 1;

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
    if (!ver) throw new Error('Không tìm thấy phiên bản CMS cần khôi phục.');
    const nowIso = new Date().toISOString();
    this.db.run(
      `UPDATE cms_pages SET title = ?, html_content = ?, blocks_json = ?, version = ?, updated_by = ?, updated_at = ? WHERE id = ?`,
      [ver.title, ver.html_content, ver.blocks_json, ver.version, editorUser.id, nowIso, page_id]
    );
    return this.db.get(`SELECT * FROM cms_pages WHERE id = ?`, [page_id]);
  }
}

module.exports = { CmsModule };
