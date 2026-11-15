import {json,fail,readJson,clean,uid,audit,addNotification} from './core.js';

async function canAccessConversation(env,conversationId,userId){
  const c=await env.DB.prepare('SELECT kind,group_id FROM conversations WHERE id=?').bind(conversationId).first();
  if(!c)return false;
  const member=await env.DB.prepare('SELECT 1 FROM conversation_members WHERE conversation_id=? AND user_id=?').bind(conversationId,userId).first();
  if(!member)return false;
  if(c.kind==='group'&&c.group_id){
    return !!(await env.DB.prepare("SELECT 1 FROM group_members WHERE group_id=? AND user_id=? AND status='active'").bind(c.group_id,userId).first());
  }
  if(c.kind==='direct'){
    const peer=await env.DB.prepare('SELECT user_id FROM conversation_members WHERE conversation_id=? AND user_id<>? LIMIT 1').bind(conversationId,userId).first();
    if(!peer)return false;
    const [low,high]=[userId,peer.user_id].sort();
    const [friendship,blocked]=await Promise.all([
      env.DB.prepare('SELECT 1 FROM friendships WHERE user_low=? AND user_high=?').bind(low,high).first(),
      env.DB.prepare('SELECT 1 FROM user_blocks WHERE (blocker_id=? AND blocked_id=?) OR (blocker_id=? AND blocked_id=?)').bind(userId,peer.user_id,peer.user_id,userId).first()
    ]);
    return !!friendship&&!blocked;
  }
  return true;
}

export async function handleCommunity(req,env,path,url,user){
  const method=req.method;
  if(path==='/api/community/posts'&&method==='GET'){
    const groupId=clean(url.searchParams.get('groupId')||'',80);
    const rows=await env.DB.prepare(`SELECT p.id,p.body,p.visibility,p.group_id,p.org_id,p.created_at,p.updated_at,u.id author_id,u.full_name,u.username,
      (SELECT COUNT(*) FROM comments c WHERE c.post_id=p.id AND c.status='published') comment_count,
      (SELECT COUNT(*) FROM reactions r WHERE r.post_id=p.id) reaction_count,
      EXISTS(SELECT 1 FROM reactions r WHERE r.post_id=p.id AND r.user_id=?) reacted
      FROM posts p JOIN users u ON u.id=p.author_id
      WHERE p.status='published' AND (p.visibility='public' OR p.author_id=? OR (p.visibility='friends' AND EXISTS(SELECT 1 FROM friendships f WHERE (f.user_low=p.author_id AND f.user_high=?) OR (f.user_high=p.author_id AND f.user_low=?))))
      AND (?='' OR p.group_id=?) AND NOT EXISTS(SELECT 1 FROM user_blocks b WHERE (b.blocker_id=? AND b.blocked_id=p.author_id) OR (b.blocker_id=p.author_id AND b.blocked_id=?))
      ORDER BY p.created_at DESC LIMIT 60`).bind(user?.id||'',user?.id||'',user?.id||'',user?.id||'',groupId,groupId,user?.id||'',user?.id||'').all();
    return json({posts:rows.results});
  }
  if(path==='/api/community/posts'&&method==='POST'){
    const d=await readJson(req),body=clean(d.body,5000),visibility=['public','friends','private'].includes(d.visibility)?d.visibility:'public';if(body.length<2)return fail('Nội dung bài viết quá ngắn.');
    if(d.groupId){const m=await env.DB.prepare('SELECT 1 FROM group_members WHERE group_id=? AND user_id=? AND status=\'active\'').bind(clean(d.groupId,80),user.id).first();if(!m)return fail('Bạn chưa là thành viên nhóm này.',403);}
    const id=uid();await env.DB.prepare('INSERT INTO posts(id,author_id,body,visibility,group_id) VALUES(?,?,?,?,?)').bind(id,user.id,body,visibility,d.groupId?clean(d.groupId,80):null).run();
    return json({ok:true,id},201);
  }
  const post=path.match(/^\/api\/community\/posts\/([\w-]+)$/);
  if(post&&method==='DELETE'){
    const r=await env.DB.prepare("UPDATE posts SET status='deleted',updated_at=CURRENT_TIMESTAMP WHERE id=? AND author_id=?").bind(post[1],user.id).run();return json({ok:r.meta.changes===1});
  }
  const comments=path.match(/^\/api\/community\/posts\/([\w-]+)\/comments$/);
  if(comments&&method==='GET'){
    const rows=await env.DB.prepare("SELECT c.id,c.body,c.created_at,u.id author_id,u.full_name FROM comments c JOIN users u ON u.id=c.author_id WHERE c.post_id=? AND c.status='published' ORDER BY c.created_at LIMIT 100").bind(comments[1]).all();return json({comments:rows.results});
  }
  if(comments&&method==='POST'){
    const d=await readJson(req),body=clean(d.body,2000),p=await env.DB.prepare("SELECT id,author_id FROM posts WHERE id=? AND status='published'").bind(comments[1]).first();if(!p)return fail('Bài viết không tồn tại.',404);if(body.length<1)return fail('Bình luận không được để trống.');
    const id=uid();await env.DB.prepare('INSERT INTO comments(id,post_id,author_id,body) VALUES(?,?,?,?)').bind(id,p.id,user.id,body).run();if(p.author_id!==user.id)await addNotification(env,p.author_id,'community','Có bình luận mới','Một thành viên vừa bình luận bài viết của bạn.','/cong-dong');return json({ok:true,id},201);
  }
  const react=path.match(/^\/api\/community\/posts\/([\w-]+)\/reaction$/);
  if(react&&method==='POST'){
    const post=await env.DB.prepare("SELECT id FROM posts WHERE id=? AND status='published'").bind(react[1]).first();if(!post)return fail('Bài viết không tồn tại.',404);
    const prior=await env.DB.prepare('SELECT 1 FROM reactions WHERE post_id=? AND user_id=?').bind(post.id,user.id).first();
    if(prior)await env.DB.prepare('DELETE FROM reactions WHERE post_id=? AND user_id=?').bind(post.id,user.id).run();else await env.DB.prepare('INSERT INTO reactions(post_id,user_id,reaction) VALUES(?,?,\'like\')').bind(post.id,user.id).run();
    return json({ok:true,reacted:!prior});
  }
  if((path==='/api/connect/search'||path==='/api/people')&&method==='GET'){
    const q=clean(url.searchParams.get('q')||'',60).replaceAll('%',''),lang=clean(url.searchParams.get('language')||'',5);
    const rows=await env.DB.prepare(`SELECT u.id,u.full_name,u.username,p.bio,p.languages_json,p.level,p.goals_json,p.interests_json
      FROM users u JOIN profiles p ON p.user_id=u.id WHERE u.status='active' AND u.id<>? AND p.contact_discovery=1 AND p.privacy IN ('public','members')
      AND (?='' OR u.full_name LIKE '%'||?||'%' OR u.username LIKE '%'||?||'%')
      AND (?='' OR p.languages_json LIKE '%"'||?||'"%')
      AND NOT EXISTS(SELECT 1 FROM user_blocks b WHERE (b.blocker_id=? AND b.blocked_id=u.id) OR (b.blocker_id=u.id AND b.blocked_id=?)) LIMIT 40`).bind(user.id,q,q,q,lang,lang,user.id,user.id).all();
    return json({people:rows.results.map(x=>({...x,languages:JSON.parse(x.languages_json||'[]'),goals:JSON.parse(x.goals_json||'[]'),interests:JSON.parse(x.interests_json||'[]')}))});
  }
  if(path==='/api/friends/requests'&&method==='POST'){
    const d=await readJson(req),target=clean(d.userId,80);if(!target||target===user.id)return fail('Không thể gửi lời mời này.');
    const blocked=await env.DB.prepare('SELECT 1 FROM user_blocks WHERE (blocker_id=? AND blocked_id=?) OR (blocker_id=? AND blocked_id=?)').bind(user.id,target,target,user.id).first();if(blocked)return fail('Không thể kết nối với tài khoản này.',403);
    const existing=await env.DB.prepare('SELECT user_low,user_high FROM friendships WHERE (user_low=? AND user_high=?) OR (user_low=? AND user_high=?)').bind(user.id,target,target,user.id).first();if(existing)return fail('Hai tài khoản đã là bạn bè.',409);
    const id=uid();try{await env.DB.prepare('INSERT INTO friend_requests(id,sender_id,receiver_id) VALUES(?,?,?)').bind(id,user.id,target).run();}catch{return fail('Lời mời đã tồn tại hoặc không hợp lệ.',409);}
    await addNotification(env,target,'connect','Lời mời kết nối mới',`${user.full_name} muốn kết nối luyện tập với bạn.`,'/ban-be');return json({ok:true,id},201);
  }
  if(path==='/api/friends/requests'&&method==='GET'){
    const rows=await env.DB.prepare(`SELECT f.id,f.sender_id,f.receiver_id,f.status,f.created_at,u.full_name,u.username
      FROM friend_requests f JOIN users u ON u.id=CASE WHEN f.sender_id=? THEN f.receiver_id ELSE f.sender_id END
      WHERE (f.sender_id=? OR f.receiver_id=?) AND f.status='pending' ORDER BY f.created_at DESC`).bind(user.id,user.id,user.id).all();return json({requests:rows.results});
  }
  const reqMatch=path.match(/^\/api\/friends\/requests\/([\w-]+)$/);
  if(reqMatch&&method==='PUT'){
    const d=await readJson(req),status=d.status==='accepted'?'accepted':d.status==='rejected'?'rejected':null;if(!status)return fail('Trạng thái không hợp lệ.');
    const r=await env.DB.prepare('SELECT id,sender_id,receiver_id FROM friend_requests WHERE id=? AND receiver_id=? AND status=\'pending\'').bind(reqMatch[1],user.id).first();if(!r)return fail('Không tìm thấy lời mời.',404);
    await env.DB.prepare('UPDATE friend_requests SET status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').bind(status,r.id).run();
    if(status==='accepted'){
      const [low,high]=[r.sender_id,r.receiver_id].sort();await env.DB.prepare('INSERT OR IGNORE INTO friendships(user_low,user_high) VALUES(?,?)').bind(low,high).run();
      await addNotification(env,r.sender_id,'connect','Lời mời đã được chấp nhận',`${user.full_name} đã đồng ý kết nối với bạn.`,'/ban-be');
    }
    return json({ok:true,status});
  }
  if(path==='/api/friends'&&method==='GET'){
    const rows=await env.DB.prepare(`SELECT u.id,u.full_name,u.username FROM friendships f JOIN users u ON u.id=CASE WHEN f.user_low=? THEN f.user_high ELSE f.user_low END WHERE f.user_low=? OR f.user_high=? ORDER BY u.full_name`).bind(user.id,user.id,user.id).all();return json({friends:rows.results});
  }
  if(path==='/api/friends/block'&&method==='POST'){
    const d=await readJson(req),target=clean(d.userId,80);if(!target||target===user.id)return fail('Tài khoản không hợp lệ.');
    await env.DB.prepare('INSERT OR IGNORE INTO user_blocks(blocker_id,blocked_id) VALUES(?,?)').bind(user.id,target).run();
    await env.DB.prepare('DELETE FROM friendships WHERE (user_low=? AND user_high=?) OR (user_low=? AND user_high=?)').bind(user.id,target,target,user.id).run();
    return json({ok:true});
  }
  if(path==='/api/groups'&&method==='GET'){
    const rows=await env.DB.prepare(`SELECT g.id,g.name,g.description,g.language_code,g.visibility,gm.role,COUNT(allm.user_id) member_count
      FROM group_members gm JOIN groups g ON g.id=gm.group_id LEFT JOIN group_members allm ON allm.group_id=g.id AND allm.status='active'
      WHERE gm.user_id=? AND gm.status='active' GROUP BY g.id ORDER BY g.created_at DESC`).bind(user.id).all();return json({groups:rows.results});
  }
  if(path==='/api/groups'&&method==='POST'){
    const d=await readJson(req),name=clean(d.name,100),lang=clean(d.language,5);if(name.length<2)return fail('Tên nhóm không hợp lệ.');
    const id=uid();await env.DB.batch([env.DB.prepare('INSERT INTO groups(id,owner_id,name,description,language_code,visibility) VALUES(?,?,?,?,?,?)').bind(id,user.id,name,clean(d.description,500),['zh','en','ko','ja','ru'].includes(lang)?lang:null,d.visibility==='private'?'private':'public'),env.DB.prepare("INSERT INTO group_members(group_id,user_id,role) VALUES(?,?,'owner')").bind(id,user.id)]);return json({ok:true,id},201);
  }
  const group=path.match(/^\/api\/groups\/([\w-]+)(?:\/(join|members|conversation))?$/);
  if(group&&group[2]==='join'&&method==='POST'){
    const g=await env.DB.prepare("SELECT id,visibility FROM groups WHERE id=?").bind(group[1]).first();if(!g)return fail('Không tìm thấy nhóm.',404);if(g.visibility==='private')return fail('Nhóm riêng tư cần lời mời từ quản trị viên.',403);
    await env.DB.prepare('INSERT OR IGNORE INTO group_members(group_id,user_id) VALUES(?,?)').bind(g.id,user.id).run();return json({ok:true});
  }
  if(group&&group[2]==='members'&&method==='GET'){
    const own=await env.DB.prepare("SELECT role FROM group_members WHERE group_id=? AND user_id=? AND status='active'").bind(group[1],user.id).first();if(!own)return fail('Bạn không có quyền xem nhóm này.',403);
    const rows=await env.DB.prepare("SELECT u.id,u.full_name,gm.role,gm.joined_at FROM group_members gm JOIN users u ON u.id=gm.user_id WHERE gm.group_id=? AND gm.status='active'").bind(group[1]).all();return json({members:rows.results});
  }
  if(group&&group[2]==='conversation'&&method==='POST'){
    const own=await env.DB.prepare("SELECT gm.role,g.name FROM group_members gm JOIN groups g ON g.id=gm.group_id WHERE gm.group_id=? AND gm.user_id=? AND gm.status='active'").bind(group[1],user.id).first();
    if(!own)return fail('Bạn không phải thành viên đang hoạt động của nhóm.',403);
    let conv=await env.DB.prepare('SELECT id FROM conversations WHERE group_id=?').bind(group[1]).first();
    if(!conv){const id=uid();await env.DB.prepare("INSERT INTO conversations(id,kind,title,created_by,group_id) VALUES(?,'group',?,?,?)").bind(id,own.name,user.id,group[1]).run();conv={id};}
    await env.DB.prepare("INSERT OR IGNORE INTO conversation_members(conversation_id,user_id) SELECT ?,user_id FROM group_members WHERE group_id=? AND status='active'").bind(conv.id,group[1]).run();
    return json({ok:true,id:conv.id,kind:'group'});
  }
  if(path==='/api/conversations'&&method==='GET'){
    const rows=await env.DB.prepare(`SELECT c.id,c.kind,c.title,c.created_at,
      (SELECT m.body FROM messages m WHERE m.conversation_id=c.id AND m.recalled_at IS NULL ORDER BY m.created_at DESC LIMIT 1) last_message,
      (SELECT m.created_at FROM messages m WHERE m.conversation_id=c.id ORDER BY m.created_at DESC LIMIT 1) last_at
      FROM conversation_members cm JOIN conversations c ON c.id=cm.conversation_id WHERE cm.user_id=?
      AND (c.kind<>'direct' OR (
        EXISTS(SELECT 1 FROM conversation_members peer JOIN friendships f ON (f.user_low=? AND f.user_high=peer.user_id) OR (f.user_high=? AND f.user_low=peer.user_id) WHERE peer.conversation_id=c.id AND peer.user_id<>?)
        AND NOT EXISTS(SELECT 1 FROM conversation_members peer JOIN user_blocks b ON (b.blocker_id=? AND b.blocked_id=peer.user_id) OR (b.blocker_id=peer.user_id AND b.blocked_id=?) WHERE peer.conversation_id=c.id AND peer.user_id<>?)
      ))
      AND (c.kind<>'group' OR c.group_id IS NULL OR EXISTS(SELECT 1 FROM group_members gm WHERE gm.group_id=c.group_id AND gm.user_id=? AND gm.status='active'))
      ORDER BY COALESCE(last_at,c.created_at) DESC LIMIT 60`).bind(user.id,user.id,user.id,user.id,user.id,user.id,user.id,user.id).all();return json({conversations:rows.results});
  }
  if(path==='/api/conversations'&&method==='POST'){
    const d=await readJson(req),target=clean(d.userId,80);if(target===user.id||!target)return fail('Người nhận không hợp lệ.');
    const [low,high]=[user.id,target].sort();const f=await env.DB.prepare('SELECT 1 FROM friendships WHERE user_low=? AND user_high=?').bind(low,high).first();if(!f)return fail('Chỉ có thể nhắn tin sau khi hai bên đã chấp nhận kết nối.',403);
    const existing=await env.DB.prepare(`SELECT c.id FROM conversations c JOIN conversation_members a ON a.conversation_id=c.id AND a.user_id=? JOIN conversation_members b ON b.conversation_id=c.id AND b.user_id=? WHERE c.kind='direct' LIMIT 1`).bind(user.id,target).first();if(existing)return json({ok:true,id:existing.id});
    const id=uid();await env.DB.batch([env.DB.prepare('INSERT INTO conversations(id,kind,created_by) VALUES(?,\'direct\',?)').bind(id,user.id),env.DB.prepare('INSERT INTO conversation_members(conversation_id,user_id) VALUES(?,?),(?,?)').bind(id,user.id,id,target)]);return json({ok:true,id},201);
  }
  const conv=path.match(/^\/api\/conversations\/([\w-]+)\/messages$/);
  if(conv&&method==='GET'){
    if(!(await canAccessConversation(env,conv[1],user.id)))return fail('Bạn không có quyền truy cập cuộc trò chuyện này hoặc kết nối đã bị chặn.',403);
    const rows=await env.DB.prepare('SELECT m.id,m.body,m.sender_id,m.created_at,m.edited_at,m.recalled_at,m.attachment_file_id,f.original_name attachment_name,f.mime_type attachment_mime,u.full_name FROM messages m JOIN users u ON u.id=m.sender_id LEFT JOIN file_objects f ON f.id=m.attachment_file_id WHERE m.conversation_id=? ORDER BY m.created_at DESC LIMIT 100').bind(conv[1]).all();
    await env.DB.prepare('UPDATE conversation_members SET last_read_at=CURRENT_TIMESTAMP WHERE conversation_id=? AND user_id=?').bind(conv[1],user.id).run();return json({messages:rows.results.reverse().map(m=>({...m,body:m.recalled_at?'Tin nhắn đã được thu hồi.':m.body,attachmentUrl:m.attachment_file_id&&m.attachment_mime&&['image/jpeg','image/png','image/webp','application/pdf','audio/mpeg','audio/mp4','audio/wav','audio/ogg','audio/webm'].includes(m.attachment_mime)?`/api/conversations/${conv[1]}/attachments/${m.attachment_file_id}`:null}))});
  }
  if(conv&&method==='POST'){
    if(!(await canAccessConversation(env,conv[1],user.id)))return fail('Bạn không có quyền gửi vào cuộc trò chuyện này hoặc kết nối đã bị chặn.',403);
    const d=await readJson(req),body=clean(d.body,4000),fileId=clean(d.fileId,80),replyTo=clean(d.replyTo,80)||null;if(!body&&!fileId)return fail('Nhập nội dung hoặc đính kèm một tệp đã được kiểm tra.');
    let attachment=null;if(fileId){attachment=await env.DB.prepare("SELECT id,owner_id,scan_status FROM file_objects WHERE id=?").bind(fileId).first();if(!attachment||attachment.owner_id!==user.id||attachment.scan_status!=='clean')return fail('Tệp phải thuộc tài khoản và được nhà cung cấp quét xác nhận an toàn trước khi gửi.',409);}
    if(replyTo){const parent=await env.DB.prepare('SELECT id FROM messages WHERE id=? AND conversation_id=?').bind(replyTo,conv[1]).first();if(!parent)return fail('Tin nhắn được trả lời không thuộc cuộc trò chuyện này.',404);}
    const id=uid();await env.DB.prepare('INSERT INTO messages(id,conversation_id,sender_id,body,reply_to,attachment_file_id) VALUES(?,?,?,?,?,?)').bind(id,conv[1],user.id,body,fileId||null,replyTo).run();
    const recipients=await env.DB.prepare('SELECT user_id FROM conversation_members WHERE conversation_id=? AND user_id<>?').bind(conv[1],user.id).all();for(const r of recipients.results)await addNotification(env,r.user_id,'chat','Tin nhắn mới',`${user.full_name} đã gửi tin nhắn.`,'/tin-nhan');
    return json({ok:true,id,attachment:!!fileId},201);
  }
  const attachmentRoute=path.match(/^\/api\/conversations\/([\w-]+)\/attachments\/([\w-]+)$/);
  if(attachmentRoute&&method==='GET'){
    if(!(await canAccessConversation(env,attachmentRoute[1],user.id)))return fail('Bạn không có quyền truy cập tệp cuộc trò chuyện này.',403);
    const allowed=await env.DB.prepare("SELECT f.object_key,f.original_name,f.mime_type FROM messages m JOIN conversation_members cm ON cm.conversation_id=m.conversation_id JOIN file_objects f ON f.id=m.attachment_file_id WHERE m.conversation_id=? AND m.attachment_file_id=? AND cm.user_id=? AND f.scan_status='clean'").bind(attachmentRoute[1],attachmentRoute[2],user.id).first();
    if(!allowed)return fail('Tệp đính kèm không tồn tại hoặc bạn không có quyền.',404);const object=await env.R2.get(allowed.object_key);if(!object)return fail('Tệp không còn trong kho lưu trữ.',404);
    return new Response(object.body,{headers:{'content-type':allowed.mime_type,'content-disposition':`inline; filename*=UTF-8''${encodeURIComponent(allowed.original_name)}`,'cache-control':'private, no-store','x-content-type-options':'nosniff'}});
  }
  const messageRoute=path.match(/^\/api\/conversations\/([\w-]+)\/messages\/([\w-]+)$/);
  if(messageRoute&&method==='PUT'){
    if(!(await canAccessConversation(env,messageRoute[1],user.id)))return fail('Bạn không có quyền truy cập cuộc trò chuyện này.',403);
    const d=await readJson(req),body=clean(d.body,4000);if(!body)return fail('Nội dung tin nhắn không được để trống.');const r=await env.DB.prepare("UPDATE messages SET body=?,edited_at=CURRENT_TIMESTAMP WHERE id=? AND conversation_id=? AND sender_id=? AND recalled_at IS NULL").bind(body,messageRoute[2],messageRoute[1],user.id).run();return json({ok:r.meta.changes===1});
  }
  if(messageRoute&&method==='DELETE'){
    if(!(await canAccessConversation(env,messageRoute[1],user.id)))return fail('Bạn không có quyền truy cập cuộc trò chuyện này.',403);
    const r=await env.DB.prepare("UPDATE messages SET body='',recalled_at=CURRENT_TIMESTAMP WHERE id=? AND conversation_id=? AND sender_id=? AND recalled_at IS NULL").bind(messageRoute[2],messageRoute[1],user.id).run();return json({ok:r.meta.changes===1});
  }
  if(path==='/api/reports'&&method==='POST'){
    const d=await readJson(req),type=clean(d.targetType,40),target=clean(d.targetId,100),reason=clean(d.reason,100);if(!['post','comment','user','resource','message','group'].includes(type)||!target||reason.length<3)return fail('Thông tin báo cáo chưa hợp lệ.');
    const id=uid();await env.DB.prepare('INSERT INTO reports(id,reporter_id,target_type,target_id,reason,details) VALUES(?,?,?,?,?,?)').bind(id,user.id,type,target,reason,clean(d.details,1000)).run();return json({ok:true,id},201);
  }
  return null;
}
