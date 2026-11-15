'use strict';
const crypto = require('crypto');
const { requireAuth } = require('../security/rbac.middleware');

/**
 * CỘNG ĐỒNG & KHÔNG GIAN NHÓM / CLB / ĐỘI (PHẦN 13)
 * Lưu ý: Mọi thử thách và lịch sinh hoạt đều nằm bên trong nhóm/tổ chức,
 * tuyệt đối không tạo phân hệ Sự kiện (/su-kien) độc lập.
 */
class CommunityModule {
  constructor(db) {
    this.db = db;
  }

  listPosts({ language_code = null, topic_tag = null, group_id = null } = {}) {
    const clauses = ["moderation_status = 'published'"];
    const params = [];
    if (language_code) {
      clauses.push('p.language_code = ?');
      params.push(language_code);
    }
    if (topic_tag) {
      clauses.push('p.topic_tag = ?');
      params.push(topic_tag);
    }
    if (group_id) {
      clauses.push('p.group_id = ?');
      params.push(group_id);
    }
    return this.db.query(
      `SELECT p.*, u.full_name AS author_name, u.username AS author_username
       FROM community_posts p
       LEFT JOIN users u ON p.author_id = u.id
       WHERE ${clauses.join(' AND ')}
       ORDER BY p.created_at DESC`,
      params
    );
  }

  createPost(user, body) {
    requireAuth(user);
    // Nghị định 333/2026/NĐ-CP: Kiểm tra tài khoản đã có số điện thoại định danh trước khi đăng bài
    if (!user.phone) {
      throw new Error('Tài khoản cần cập nhật số điện thoại định danh trước khi đăng bài công khai.');
    }
    const {
      language_code = 'en',
      topic_tag = 'Thảo luận ngoại ngữ',
      group_id = null,
      org_id = null,
      visibility = 'public',
      title,
      content,
      attachment_url = ''
    } = body || {};

    if (!title || !content) {
      throw new Error('Vui lòng nhập đầy đủ tiêu đề và nội dung bài viết.');
    }
    const id = 'post_' + crypto.randomBytes(8).toString('hex');
    const now = new Date().toISOString();
    this.db.run(
      `INSERT INTO community_posts (
        id, author_id, language_code, topic_tag, group_id, org_id, visibility,
        title, content, attachment_url, likes_count, comments_count, moderation_status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 'published', ?, ?)`,
      [
        id,
        user.id,
        language_code,
        String(topic_tag).trim(),
        group_id,
        org_id,
        visibility,
        String(title).trim(),
        String(content).trim(),
        attachment_url,
        now,
        now
      ]
    );
    return this.db.get(`SELECT * FROM community_posts WHERE id = ?`, [id]);
  }

  addComment(user, { post_id, content }) {
    requireAuth(user);
    if (!content) throw new Error('Nội dung bình luận không được để trống.');
    const id = 'cmt_' + crypto.randomBytes(8).toString('hex');
    const now = new Date().toISOString();
    this.db.run(
      `INSERT INTO community_comments (id, post_id, author_id, content, created_at) VALUES (?, ?, ?, ?, ?)`,
      [id, post_id, user.id, String(content).trim(), now]
    );
    this.db.run(`UPDATE community_posts SET comments_count = comments_count + 1 WHERE id = ?`, [post_id]);
    return this.db.get(`SELECT * FROM community_comments WHERE id = ?`, [id]);
  }

  createGroup(user, { group_category = 'nhom', name, language_code = 'en', description = '', org_id = null, privacy = 'public' }) {
    requireAuth(user);
    if (!name) throw new Error('Vui lòng nhập tên Nhóm / Câu lạc bộ / Đội.');
    const id = 'grp_' + crypto.randomBytes(8).toString('hex');
    const now = new Date().toISOString();
    this.db.run(
      `INSERT INTO community_groups (id, group_category, name, language_code, description, creator_id, org_id, privacy, member_count, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
      [id, group_category, String(name).trim(), language_code, String(description).trim(), user.id, org_id, privacy, now]
    );
    this.db.run(
      `INSERT INTO group_members (group_id, user_id, role, participation_score, joined_at) VALUES (?, ?, 'leader', 10, ?)`,
      [id, user.id, now]
    );
    return this.db.get(`SELECT * FROM community_groups WHERE id = ?`, [id]);
  }

  createInternalGroupActivity(user, { group_id = null, org_id = null, activity_kind = 'challenge', title, description = '', schedule_time = '' }) {
    requireAuth(user);
    if (!title) throw new Error('Vui lòng nhập tên thử thách hoặc lịch sinh hoạt nhóm.');
    const id = 'act_' + crypto.randomBytes(8).toString('hex');
    const now = new Date().toISOString();
    this.db.run(
      `INSERT INTO group_activities (id, group_id, org_id, activity_kind, title, description, schedule_time, creator_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, group_id, org_id, activity_kind, String(title).trim(), String(description).trim(), schedule_time || now, user.id, now]
    );
    return this.db.get(`SELECT * FROM group_activities WHERE id = ?`, [id]);
  }
}

module.exports = { CommunityModule };
