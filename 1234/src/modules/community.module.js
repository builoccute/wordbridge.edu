'use strict';
const crypto = require('crypto');
const { requireAuth } = require('../security/rbac.middleware');

/**
 * COMMUNITY – CỘNG ĐỒNG NGOẠI NGỮ (PHẦN X)
 * - Hỗ trợ 5 cộng đồng ngôn ngữ (Trung, Anh, Hàn, Nhật, Nga) + Cộng đồng đa ngôn ngữ ('multi').
 * - Đăng bài, Bình luận, Trả lời bình luận, Thích bài viết, Lưu bài, Chia sẻ tài liệu, Tìm kiếm bài viết, Phân loại theo ngôn ngữ/chủ đề, Theo dõi nhóm, Báo cáo vi phạm, Ẩn/Chặn tài khoản, Thông báo tương tác.
 * - Không tạo mục Sự kiện độc lập; các hoạt động và thử thách ngắn hạn được tổ chức trong nhóm hoặc tổ chức.
 */
class CommunityModule {
  constructor(db) {
    this.db = db;
  }

  listPosts({ language_code = null, topic_tag = null, group_id = null, q = null, viewer_user_id = null } = {}) {
    const clauses = ["p.moderation_status = 'published'"];
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
    if (q) {
      clauses.push('(p.title LIKE ? OR p.content LIKE ?)');
      params.push(`%${q}%`, `%${q}%`);
    }
    if (viewer_user_id) {
      clauses.push('p.author_id NOT IN (SELECT blocked_id FROM user_blocks WHERE blocker_id = ?)');
      params.push(viewer_user_id);
    }

    const posts = this.db.query(
      `SELECT p.*, u.full_name AS author_name, u.username AS author_username
       FROM community_posts p
       LEFT JOIN users u ON p.author_id = u.id
       WHERE ${clauses.join(' AND ')}
       ORDER BY p.created_at DESC`,
      params
    );

    return posts.map(p => {
      const comments = this.db.query(
        `SELECT c.*, u.full_name AS author_name, u.username AS author_username
         FROM community_comments c
         LEFT JOIN users u ON c.author_id = u.id
         WHERE c.post_id = ?
         ORDER BY c.created_at ASC`,
        [p.id]
      );
      return {
        ...p,
        comments
      };
    });
  }

  createPost(user, body) {
    requireAuth(user);
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

  addComment(user, { post_id, content, parent_comment_id = null }) {
    requireAuth(user);
    if (!content) throw new Error('Nội dung bình luận không được để trống.');
    const post = this.db.get(`SELECT * FROM community_posts WHERE id = ?`, [post_id]);
    if (!post) throw new Error('Không tìm thấy bài viết cần bình luận.');

    const id = 'cmt_' + crypto.randomBytes(8).toString('hex');
    const now = new Date().toISOString();
    const formattedContent = parent_comment_id
      ? `[Trả lời bình luận #${parent_comment_id}] ${String(content).trim()}`
      : String(content).trim();

    this.db.run(
      `INSERT INTO community_comments (id, post_id, author_id, content, created_at) VALUES (?, ?, ?, ?, ?)`,
      [id, post_id, user.id, formattedContent, now]
    );
    this.db.run(`UPDATE community_posts SET comments_count = comments_count + 1 WHERE id = ?`, [post_id]);

    if (post.author_id !== user.id) {
      this.db.run(
        `INSERT INTO notifications (id, user_id, category, title, message, link_url, is_read, created_at)
         VALUES (?, ?, 'community', 'Bình luận mới trên bài viết của bạn', ?, '/cong-dong', 0, ?)`,
        ['ntf_' + crypto.randomBytes(8).toString('hex'), post.author_id, `${user.full_name} đã bình luận vào bài viết "${post.title}".`, now]
      );
    }

    return this.db.get(`SELECT * FROM community_comments WHERE id = ?`, [id]);
  }

  toggleLikePost(user, { post_id }) {
    requireAuth(user);
    const post = this.db.get(`SELECT * FROM community_posts WHERE id = ?`, [post_id]);
    if (!post) throw new Error('Không tìm thấy bài viết.');

    const existing = this.db.get(
      `SELECT * FROM community_post_likes WHERE post_id = ? AND user_id = ?`,
      [post_id, user.id]
    );
    const nowIso = new Date().toISOString();
    if (existing) {
      this.db.run(`DELETE FROM community_post_likes WHERE post_id = ? AND user_id = ?`, [post_id, user.id]);
      this.db.run(`UPDATE community_posts SET likes_count = MAX(0, likes_count - 1) WHERE id = ?`, [post_id]);
      return { liked: false, post: this.db.get(`SELECT * FROM community_posts WHERE id = ?`, [post_id]) };
    }
    this.db.run(`INSERT INTO community_post_likes (post_id, user_id, created_at) VALUES (?, ?, ?)`, [post_id, user.id, nowIso]);
    this.db.run(`UPDATE community_posts SET likes_count = likes_count + 1 WHERE id = ?`, [post_id]);

    if (post.author_id !== user.id) {
      this.db.run(
        `INSERT INTO notifications (id, user_id, category, title, message, link_url, is_read, created_at)
         VALUES (?, ?, 'community', 'Tương tác mới trên bài viết', ?, '/cong-dong', 0, ?)`,
        ['ntf_' + crypto.randomBytes(8).toString('hex'), post.author_id, `${user.full_name} đã yêu thích bài viết "${post.title}".`, nowIso]
      );
    }

    return { liked: true, post: this.db.get(`SELECT * FROM community_posts WHERE id = ?`, [post_id]) };
  }

  toggleBookmarkPost(user, { post_id }) {
    requireAuth(user);
    const post = this.db.get(`SELECT * FROM community_posts WHERE id = ?`, [post_id]);
    if (!post) throw new Error('Không tìm thấy bài viết.');
    const existing = this.db.get(
      `SELECT * FROM community_post_bookmarks WHERE post_id = ? AND user_id = ?`,
      [post_id, user.id]
    );
    if (existing) {
      this.db.run(`DELETE FROM community_post_bookmarks WHERE post_id = ? AND user_id = ?`, [post_id, user.id]);
      return { bookmarked: false, post_id };
    }
    this.db.run(
      `INSERT INTO community_post_bookmarks (post_id, user_id, created_at) VALUES (?, ?, ?)`,
      [post_id, user.id, new Date().toISOString()]
    );
    return { bookmarked: true, post_id };
  }

  listGroups({ group_category = null, language_code = null } = {}) {
    const clauses = ['1=1'];
    const params = [];
    if (group_category) {
      clauses.push('group_category = ?');
      params.push(group_category);
    }
    if (language_code) {
      clauses.push('language_code = ?');
      params.push(language_code);
    }
    const groups = this.db.query(
      `SELECT * FROM community_groups WHERE ${clauses.join(' AND ')} ORDER BY created_at DESC`,
      params
    );
    const activities = this.db.query(`SELECT * FROM group_activities ORDER BY created_at DESC LIMIT 30`);
    return { groups, activities };
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

  joinGroup(user, { group_id }) {
    requireAuth(user);
    const grp = this.db.get(`SELECT * FROM community_groups WHERE id = ?`, [group_id]);
    if (!grp) throw new Error('Không tìm thấy nhóm cộng đồng.');
    const existing = this.db.get(`SELECT * FROM group_members WHERE group_id = ? AND user_id = ?`, [group_id, user.id]);
    if (existing) return { already_joined: true, group: grp };
    const now = new Date().toISOString();
    this.db.run(
      `INSERT INTO group_members (group_id, user_id, role, participation_score, joined_at) VALUES (?, ?, 'member', 5, ?)`,
      [group_id, user.id, now]
    );
    this.db.run(`UPDATE community_groups SET member_count = member_count + 1 WHERE id = ?`, [group_id]);
    return { joined: true, group: this.db.get(`SELECT * FROM community_groups WHERE id = ?`, [group_id]) };
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
