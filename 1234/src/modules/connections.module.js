'use strict';
const crypto = require('crypto');
const { requireAuth } = require('../security/rbac.middleware');

/**
 * KẾT NỐI BẠN HỌC (PHẦN 11) & CHAT CÁ NHÂN / NHÓM (PHẦN 12)
 * Quy tắc bắt buộc:
 * - Chỉ mở kết nối và trò chuyện riêng tư sau khi hai bên đồng thuận (accepted)
 * - Không công khai vị trí chính xác và số điện thoại
 * - Không tạo nút gọi video/âm thanh giả
 */
class ConnectionsAndChatModule {
  constructor(db, realtimeHub) {
    this.db = db;
    this.realtimeHub = realtimeHub;
  }

  searchStudyPartners(user, filters = {}) {
    requireAuth(user);
    const { q, language_code, level, goal, interest, available_hours } = filters;
    const rows = this.db.query(`SELECT * FROM users WHERE id != ? AND status = 'active'`, [user.id]);
    return rows
      .filter(r => {
        if (q) {
          const needle = String(q).toLowerCase();
          if (!r.full_name.toLowerCase().includes(needle) && !r.username.toLowerCase().includes(needle)) {
            return false;
          }
        }
        const langs = JSON.parse(r.learning_languages || '[]');
        if (language_code && !langs.includes(language_code)) return false;
        if (level && r.proficiency_level !== level) return false;
        if (goal && !String(r.learning_goals).toLowerCase().includes(String(goal).toLowerCase())) return false;
        if (interest) {
          const ints = JSON.parse(r.interests || '[]').map(x => String(x).toLowerCase());
          if (!ints.some(x => x.includes(String(interest).toLowerCase()))) return false;
        }
        if (available_hours && !String(r.available_hours).includes(available_hours)) return false;
        return true;
      })
      .map(r => ({
        id: r.id,
        full_name: r.full_name,
        username: r.username,
        learning_languages: JSON.parse(r.learning_languages || '[]'),
        proficiency_level: r.proficiency_level,
        learning_goals: r.learning_goals,
        interests: JSON.parse(r.interests || '[]'),
        available_hours: r.available_hours
      }));
  }

  sendFriendRequest(user, { addressee_id, match_note = '' }) {
    requireAuth(user);
    if (!addressee_id || addressee_id === user.id) {
      throw new Error('Người nhận lời mời kết bạn không hợp lệ.');
    }
    const existing = this.db.get(
      `SELECT * FROM friendships WHERE (requester_id = ? AND addressee_id = ?) OR (requester_id = ? AND addressee_id = ?)`,
      [user.id, addressee_id, addressee_id, user.id]
    );
    if (existing) {
      if (existing.status === 'blocked') {
        throw new Error('Không thể gửi lời mời kết nối tới người dùng này.');
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
    return this.db.get(`SELECT * FROM friendships WHERE id = ?`, [id]);
  }

  respondFriendRequest(user, { friendship_id, action }) {
    requireAuth(user);
    const fr = this.db.get(`SELECT * FROM friendships WHERE id = ?`, [friendship_id]);
    if (!fr) throw new Error('Không tìm thấy lời mời kết bạn.');
    const now = new Date().toISOString();

    if (action === 'accept') {
      if (fr.addressee_id !== user.id) throw new Error('Chỉ người nhận mới có quyền chấp nhận lời mời.');
      this.db.run(`UPDATE friendships SET status = 'accepted', updated_at = ? WHERE id = ?`, [now, friendship_id]);
      // Tạo phòng chat riêng tư sau khi cả hai bên đã đồng ý kết nối
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
    } else if (action === 'cancel') {
      this.db.run(`UPDATE friendships SET status = 'canceled', updated_at = ? WHERE id = ?`, [now, friendship_id]);
    } else if (action === 'block') {
      this.db.run(`UPDATE friendships SET status = 'blocked', updated_at = ? WHERE id = ?`, [now, friendship_id]);
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

    let targetConvId = conversation_id;
    if (!targetConvId && recipient_id) {
      // Kiểm tra bắt buộc hai bên đã đồng ý kết bạn chưa (PHẦN 11.2)
      const accepted = this.db.get(
        `SELECT * FROM friendships
         WHERE status = 'accepted'
           AND ((requester_id = ? AND addressee_id = ?) OR (requester_id = ? AND addressee_id = ?))`,
        [user.id, recipient_id, recipient_id, user.id]
      );
      if (!accepted) {
        throw new Error('Không thể tự động mở trò chuyện riêng tư khi hai bên chưa đồng thuận kết nối bạn học.');
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
      return existing; // Chống gửi trùng tin nhắn
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

    const members = this.db.query(`SELECT user_id FROM conversation_members WHERE conversation_id = ?`, [targetConvId]);
    const msgRecord = this.db.get(`SELECT * FROM messages WHERE id = ?`, [msgId]);
    for (const m of members) {
      this.realtimeHub.emitToUser(m.user_id, 'chat_message', msgRecord);
    }
    return msgRecord;
  }

  createGroupConversation(user, { title, topic = '', member_ids = [] }) {
    requireAuth(user);
    if (!title) throw new Error('Vui lòng nhập tên nhóm chat.');
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
