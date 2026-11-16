'use strict';
const crypto = require('crypto');
const { requireAuth } = require('../security/rbac.middleware');

/**
 * CONNECT – TÌM BẠN THỰC HÀNH & NHẮN TIN ĐỒNG THUẬN 02 BÊN (PHẦN IX)
 * - Tìm kiếm theo 8 tiêu chí: Ngôn ngữ đang học, Trình độ, Ngôn ngữ có thể hỗ trợ, Mục tiêu, Chủ đề quan tâm, Thời gian rảnh, Hình thức thực hành, Sở thích học tập.
 * - Tính năng: Gửi lời mời kết nối, Chấp nhận/Từ chối, Hủy kết nối, Danh sách bạn học, Gợi ý bạn phù hợp, Lưu hồ sơ yêu thích, Lịch sử kết nối, Nhắn tin sau khi đủ điều kiện, Nhóm thực hành nhỏ, Phòng thực hành theo chủ đề.
 * - Bảo vệ người dùng: Không công khai vị trí chính xác, không tự động công khai email và số điện thoại, có chặn và báo cáo, giới hạn tin nhắn chống spam.
 */
class ConnectionsAndChatModule {
  constructor(db, realtimeHub) {
    this.db = db;
    this.realtimeHub = realtimeHub;
  }

  searchStudyPartners(user, filters = {}) {
    requireAuth(user);
    const {
      q,
      language_code,
      level,
      support_language,
      goal,
      interest,
      available_hours,
      practice_mode,
      study_preferences
    } = filters;

    const blockedRows = this.db.query(
      `SELECT blocked_id AS uid FROM user_blocks WHERE blocker_id = ?
       UNION
       SELECT blocker_id AS uid FROM user_blocks WHERE blocked_id = ?`,
      [user.id, user.id]
    );
    const blockedSet = new Set(blockedRows.map(b => b.uid));

    const savedRows = this.db.query(`SELECT partner_user_id FROM saved_partners WHERE user_id = ?`, [user.id]);
    const savedSet = new Set(savedRows.map(s => s.partner_user_id));

    const rows = this.db.query(`SELECT * FROM users WHERE id != ? AND status = 'active'`, [user.id]);
    return rows
      .filter(r => {
        if (blockedSet.has(r.id)) return false;
        const privacy = JSON.parse(r.privacy_settings || '{}');
        if (privacy.profile_visibility === 'private') return false;

        if (q) {
          const needle = String(q).toLowerCase();
          if (!r.full_name.toLowerCase().includes(needle) && !r.username.toLowerCase().includes(needle)) {
            return false;
          }
        }
        const langs = JSON.parse(r.learning_languages || '[]');
        if (language_code && !langs.includes(language_code)) return false;
        if (level && r.proficiency_level !== level) return false;
        if (support_language) {
          const supLangs = privacy.native_or_support_languages || ['vi'];
          if (!supLangs.includes(support_language)) return false;
        }
        if (goal && !String(r.learning_goals).toLowerCase().includes(String(goal).toLowerCase())) return false;
        if (interest) {
          const ints = JSON.parse(r.interests || '[]').map(x => String(x).toLowerCase());
          if (!ints.some(x => x.includes(String(interest).toLowerCase()))) return false;
        }
        if (available_hours && !String(r.available_hours).toLowerCase().includes(String(available_hours).toLowerCase())) return false;
        if (practice_mode && !String(privacy.practice_mode || '').toLowerCase().includes(String(practice_mode).toLowerCase())) return false;
        if (study_preferences && !String(privacy.study_preferences || '').toLowerCase().includes(String(study_preferences).toLowerCase())) return false;
        return true;
      })
      .map(r => {
        const privacy = JSON.parse(r.privacy_settings || '{}');
        return {
          id: r.id,
          full_name: r.full_name,
          username: r.username,
          learning_languages: JSON.parse(r.learning_languages || '[]'),
          native_or_support_languages: privacy.native_or_support_languages || ['vi'],
          proficiency_level: r.proficiency_level,
          learning_goals: r.learning_goals,
          interests: JSON.parse(r.interests || '[]'),
          available_hours: r.available_hours,
          practice_mode: privacy.practice_mode || 'Trực tuyến qua tin nhắn và bài tập nhóm',
          study_preferences: privacy.study_preferences || 'Thực hành phản xạ ngắn mỗi ngày',
          is_saved_favorite: savedSet.has(r.id),
          // Bảo vệ tuyệt đối: Không trả về vị trí chính xác, số điện thoại hay email tự động
          phone: undefined,
          email: undefined,
          exact_location: undefined
        };
      });
  }

  listConnectionsOverview(user) {
    requireAuth(user);
    const friendships = this.db.query(
      `SELECT f.*,
              u1.full_name AS requester_name, u1.username AS requester_username, u1.proficiency_level AS requester_level,
              u2.full_name AS addressee_name, u2.username AS addressee_username, u2.proficiency_level AS addressee_level
       FROM friendships f
       LEFT JOIN users u1 ON f.requester_id = u1.id
       LEFT JOIN users u2 ON f.addressee_id = u2.id
       WHERE f.requester_id = ? OR f.addressee_id = ?
       ORDER BY f.updated_at DESC`,
      [user.id, user.id]
    );

    const saved = this.db.query(
      `SELECT sp.*, u.full_name, u.username, u.proficiency_level, u.learning_languages, u.available_hours
       FROM saved_partners sp
       JOIN users u ON sp.partner_user_id = u.id
       WHERE sp.user_id = ?`,
      [user.id]
    ).map(s => ({
      ...s,
      learning_languages: JSON.parse(s.learning_languages || '[]')
    }));

    const conversations = this.db.query(
      `SELECT c.*
       FROM conversations c
       JOIN conversation_members cm ON c.id = cm.conversation_id
       WHERE cm.user_id = ?
       ORDER BY c.updated_at DESC`,
      [user.id]
    );

    return {
      friends: friendships.filter(f => f.status === 'accepted'),
      pending_received: friendships.filter(f => f.status === 'pending' && f.addressee_id === user.id),
      pending_sent: friendships.filter(f => f.status === 'pending' && f.requester_id === user.id),
      connection_history: friendships,
      saved_favorites: saved,
      conversations
    };
  }

  toggleFavoritePartner(user, { partner_user_id, note = '' }) {
    requireAuth(user);
    if (!partner_user_id || partner_user_id === user.id) {
      throw new Error('Hồ sơ bạn học cần lưu không hợp lệ.');
    }
    const existing = this.db.get(
      `SELECT * FROM saved_partners WHERE user_id = ? AND partner_user_id = ?`,
      [user.id, partner_user_id]
    );
    if (existing) {
      this.db.run(`DELETE FROM saved_partners WHERE user_id = ? AND partner_user_id = ?`, [user.id, partner_user_id]);
      return { saved: false, partner_user_id };
    }
    const nowIso = new Date().toISOString();
    this.db.run(
      `INSERT INTO saved_partners (user_id, partner_user_id, note, created_at) VALUES (?, ?, ?, ?)`,
      [user.id, partner_user_id, String(note || '').trim(), nowIso]
    );
    return { saved: true, partner_user_id };
  }

  blockUser(user, { blocked_user_id, reason = 'Chặn tương tác để bảo vệ an toàn cá nhân' }) {
    requireAuth(user);
    if (!blocked_user_id || blocked_user_id === user.id) {
      throw new Error('Tài khoản cần chặn không hợp lệ.');
    }
    const nowIso = new Date().toISOString();
    this.db.run(
      `INSERT OR REPLACE INTO user_blocks (blocker_id, blocked_id, reason, created_at) VALUES (?, ?, ?, ?)`,
      [user.id, blocked_user_id, String(reason).trim(), nowIso]
    );
    this.db.run(
      `UPDATE friendships SET status = 'blocked', updated_at = ?
       WHERE (requester_id = ? AND addressee_id = ?) OR (requester_id = ? AND addressee_id = ?)`,
      [nowIso, user.id, blocked_user_id, blocked_user_id, user.id]
    );
    return { blocked: true, blocked_user_id };
  }

  sendFriendRequest(user, { addressee_id, match_note = '' }) {
    requireAuth(user);
    if (!addressee_id || addressee_id === user.id) {
      throw new Error('Người nhận lời mời kết nối không hợp lệ.');
    }
    const isBlocked = this.db.get(
      `SELECT * FROM user_blocks WHERE (blocker_id = ? AND blocked_id = ?) OR (blocker_id = ? AND blocked_id = ?)`,
      [user.id, addressee_id, addressee_id, user.id]
    );
    if (isBlocked) {
      throw new Error('Không thể gửi lời mời kết nối tới người dùng này.');
    }

    const existing = this.db.get(
      `SELECT * FROM friendships WHERE (requester_id = ? AND addressee_id = ?) OR (requester_id = ? AND addressee_id = ?)`,
      [user.id, addressee_id, addressee_id, user.id]
    );
    if (existing) {
      if (existing.status === 'blocked') {
        throw new Error('Không thể gửi lời mời kết nối tới người dùng này.');
      }
      if (['declined', 'canceled'].includes(existing.status)) {
        const now = new Date().toISOString();
        this.db.run(
          `UPDATE friendships SET requester_id = ?, addressee_id = ?, status = 'pending', match_note = ?, updated_at = ? WHERE id = ?`,
          [user.id, addressee_id, String(match_note).trim(), now, existing.id]
        );
        return this.db.get(`SELECT * FROM friendships WHERE id = ?`, [existing.id]);
      }
      return existing;
    }
    const id = 'fr_' + crypto.randomBytes(8).toString('hex');
    const now = new Date().toISOString();
    this.db.run(
      `INSERT INTO friendships (id, requester_id, addressee_id, match_note, status, is_following, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'pending', 1, ?, ?)`,
      [id, user.id, addressee_id, String(match_note).trim(), now, now]
    );

    // Thông báo kết nối cho người nhận
    this.db.run(
      `INSERT INTO notifications (id, user_id, category, title, message, link_url, is_read, created_at)
       VALUES (?, ?, 'connection', 'Lời mời kết nối bạn thực hành mới', ?, '/ban-be', 0, ?)`,
      ['ntf_' + crypto.randomBytes(8).toString('hex'), addressee_id, `${user.full_name} vừa gửi lời mời kết nối thực hành ngoại ngữ với bạn.`, now]
    );

    return this.db.get(`SELECT * FROM friendships WHERE id = ?`, [id]);
  }

  respondFriendRequest(user, { friendship_id, action }) {
    requireAuth(user);
    const fr = this.db.get(`SELECT * FROM friendships WHERE id = ?`, [friendship_id]);
    if (!fr) throw new Error('Không tìm thấy lời mời kết nối.');
    const now = new Date().toISOString();

    if (action === 'accept') {
      if (fr.addressee_id !== user.id) throw new Error('Chỉ người nhận mới có quyền chấp nhận lời mời.');
      this.db.run(`UPDATE friendships SET status = 'accepted', updated_at = ? WHERE id = ?`, [now, friendship_id]);
      const convId = 'conv_' + crypto.randomBytes(8).toString('hex');
      this.db.run(
        `INSERT INTO conversations (id, conv_type, title, topic, creator_id, created_at, updated_at)
         VALUES (?, 'direct', 'Trò chuyện thực hành ngoại ngữ', 'Luyện tập phản xạ', ?, ?, ?)`,
        [convId, user.id, now, now]
      );
      this.db.run(`INSERT OR IGNORE INTO conversation_members VALUES (?, ?, 'member', ?)`, [convId, fr.requester_id, now]);
      this.db.run(`INSERT OR IGNORE INTO conversation_members VALUES (?, ?, 'member', ?)`, [convId, fr.addressee_id, now]);
    } else if (action === 'decline') {
      this.db.run(`UPDATE friendships SET status = 'declined', updated_at = ? WHERE id = ?`, [now, friendship_id]);
    } else if (action === 'cancel' || action === 'unfriend') {
      this.db.run(`UPDATE friendships SET status = 'canceled', updated_at = ? WHERE id = ?`, [now, friendship_id]);
    } else if (action === 'block') {
      this.db.run(`UPDATE friendships SET status = 'blocked', updated_at = ? WHERE id = ?`, [now, friendship_id]);
      const targetId = fr.requester_id === user.id ? fr.addressee_id : fr.requester_id;
      this.blockUser(user, { blocked_user_id: targetId, reason: 'Chặn từ danh sách kết nối' });
    }
    return this.db.get(`SELECT * FROM friendships WHERE id = ?`, [friendship_id]);
  }

  sendMessage(user, body) {
    requireAuth(user);
    const {
      conversation_id,
      recipient_id = null,
      msg_type = 'text',
      content,
      attachment_url = '',
      reply_to_id = null,
      forwarded_from_id = null,
      idempotency_key = null
    } = body || {};

    if (!content && !attachment_url) {
      throw new Error('Nội dung tin nhắn không được để trống.');
    }

    // Giới hạn chống spam tin nhắn (tối đa 30 tin nhắn / phút cho 1 người dùng)
    const recentMsgs = this.db.get(
      `SELECT COUNT(*) AS cnt FROM messages WHERE sender_id = ? AND created_at > datetime('now', '-1 minute')`,
      [user.id]
    );
    if (recentMsgs && recentMsgs.cnt >= 30) {
      throw new Error('Bạn đang gửi tin nhắn quá nhanh (Giới hạn chống spam). Vui lòng đợi ít giây.');
    }

    let targetConvId = conversation_id;
    if (!targetConvId && recipient_id) {
      const accepted = this.db.get(
        `SELECT * FROM friendships
         WHERE status = 'accepted'
           AND ((requester_id = ? AND addressee_id = ?) OR (requester_id = ? AND addressee_id = ?))`,
        [user.id, recipient_id, recipient_id, user.id]
      );
      if (!accepted) {
        throw new Error('Không thể tự động mở trò chuyện riêng tư khi hai bên chưa đồng thuận kết nối bạn học.');
      }
      const existingConv = this.db.get(
        `SELECT c.id FROM conversations c
         JOIN conversation_members m1 ON c.id = m1.conversation_id AND m1.user_id = ?
         JOIN conversation_members m2 ON c.id = m2.conversation_id AND m2.user_id = ?
         WHERE c.conv_type = 'direct' LIMIT 1`,
        [user.id, recipient_id]
      );
      if (existingConv) {
        targetConvId = existingConv.id;
      }
    }

    const membership = this.db.get(
      `SELECT * FROM conversation_members WHERE conversation_id = ? AND user_id = ?`,
      [targetConvId, user.id]
    );
    if (!membership) {
      throw new Error('Bạn không phải thành viên của cuộc trò chuyện này hoặc hai bên chưa đồng ý kết nối.');
    }

    const dedupKey = idempotency_key || ('msg_idem_' + crypto.randomBytes(10).toString('hex'));
    const existing = this.db.get(`SELECT * FROM messages WHERE idempotency_key = ?`, [dedupKey]);
    if (existing) {
      return existing;
    }

    const msgId = 'msg_' + crypto.randomBytes(8).toString('hex');
    const now = new Date().toISOString();
    this.db.run(
      `INSERT INTO messages (
        id, conversation_id, sender_id, msg_type, content, attachment_url,
        reply_to_id, forwarded_from_id, is_pinned, is_recalled, delivery_status, idempotency_key, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 'sent', ?, ?)`,
      [msgId, targetConvId, user.id, msg_type, String(content || '').trim(), attachment_url, reply_to_id, forwarded_from_id, dedupKey, now]
    );
    this.db.run(`UPDATE conversations SET updated_at = ? WHERE id = ?`, [now, targetConvId]);

    const members = this.db.query(`SELECT user_id FROM conversation_members WHERE conversation_id = ?`, [targetConvId]);
    const msgRecord = this.db.get(`SELECT * FROM messages WHERE id = ?`, [msgId]);
    for (const m of members) {
      this.realtimeHub.emitToUser(m.user_id, 'chat_message', msgRecord);
    }
    return msgRecord;
  }

  listMessages(user, conversationId) {
    requireAuth(user);
    const membership = this.db.get(
      `SELECT * FROM conversation_members WHERE conversation_id = ? AND user_id = ?`,
      [conversationId, user.id]
    );
    if (!membership) {
      const err = new Error('Bạn không có quyền xem tin nhắn của cuộc trò chuyện này.');
      err.statusCode = 403;
      throw err;
    }
    return this.db.query(
      `SELECT m.*, u.full_name AS sender_name, u.username AS sender_username
       FROM messages m
       LEFT JOIN users u ON m.sender_id = u.id
       WHERE m.conversation_id = ?
       ORDER BY m.created_at ASC LIMIT 100`,
      [conversationId]
    );
  }

  createGroupConversation(user, { title, topic = '', member_ids = [] }) {
    requireAuth(user);
    if (!title) throw new Error('Vui lòng nhập tên nhóm hoặc phòng thực hành.');
    const convId = 'conv_' + crypto.randomBytes(8).toString('hex');
    const now = new Date().toISOString();
    this.db.run(
      `INSERT INTO conversations (id, conv_type, title, topic, creator_id, created_at, updated_at)
       VALUES (?, 'group', ?, ?, ?, ?, ?)`,
      [convId, String(title).trim(), String(topic).trim(), user.id, now, now]
    );
    this.db.run(`INSERT INTO conversation_members VALUES (?, ?, 'owner', ?)`, [convId, user.id, now]);
    for (const uid of member_ids) {
      if (uid !== user.id) {
        this.db.run(`INSERT OR IGNORE INTO conversation_members VALUES (?, ?, 'member', ?)`, [convId, uid, now]);
      }
    }
    return this.db.get(`SELECT * FROM conversations WHERE id = ?`, [convId]);
  }

  mutateMessageState(user, { message_id, action }) {
    requireAuth(user);
    const msg = this.db.get(`SELECT * FROM messages WHERE id = ?`, [message_id]);
    if (!msg) throw new Error('Không tìm thấy tin nhắn.');
    if (action === 'recall') {
      if (msg.sender_id !== user.id) throw new Error('Chỉ người gửi mới có thể thu hồi tin nhắn.');
      this.db.run(`UPDATE messages SET is_recalled = 1, content = '[Tin nhắn đã được thu hồi]' WHERE id = ?`, [message_id]);
    } else if (action === 'pin') {
      this.db.run(`UPDATE messages SET is_pinned = 1 WHERE id = ?`, [message_id]);
    } else if (action === 'mark_read') {
      this.db.run(`UPDATE messages SET delivery_status = 'read' WHERE id = ?`, [message_id]);
    }
    return this.db.get(`SELECT * FROM messages WHERE id = ?`, [message_id]);
  }
}

module.exports = { ConnectionsAndChatModule };
