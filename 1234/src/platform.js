import {json,fail,readJson,clean,uid,audit,addNotification,sha256,sanitizeHtml,escapeHtml,rateLimit} from './core.js';
import {handleEmail,sendQueuedEmail,queueTemplateEmail} from './email.js';

const adminRoles=['super_admin','admin','content_admin','support_admin','exam_admin','finance_admin','member_admin','learning_admin','community_admin','org_admin'];
const isAdmin=u=>adminRoles.includes(u?.role);
const canManageSystem=u=>['super_admin','admin'].includes(u?.role);
const canManageContent=u=>['super_admin','admin','content_admin'].includes(u?.role);
const canModerateResources=u=>['super_admin','admin','content_admin','learning_admin','community_admin'].includes(u?.role);
const services=['learning','connect','community','organizations','resources','payments','exams','chat'];
const routeService=path=>path.startsWith('/api/practice')||path.startsWith('/api/progress')||path.startsWith('/api/languages')||path.startsWith('/api/vocabulary')?'learning':path.startsWith('/api/friends')?'connect':path.startsWith('/api/community')||path.startsWith('/api/groups')?'community':path.startsWith('/api/organizations')?'organizations':path.startsWith('/api/resources')||path.startsWith('/api/files')?'resources':path.startsWith('/api/checkout')||path.startsWith('/api/payments')||path.startsWith('/api/subscriptions')||path.startsWith('/api/plans')?'payments':path.startsWith('/api/exams')?'exams':path.startsWith('/api/conversations')?'chat':null;

export async function publicSystem(req,env,path,url){
  if(path==='/api/system/status'&&req.method==='GET'){
    const settings=await env.DB.prepare("SELECT value FROM settings WHERE key='maintenance_global'").first();
    const rows=await env.DB.prepare('SELECT service_key,enabled,message FROM service_status').all();
    const servicesState=Object.fromEntries(rows.results.map(x=>[x.service_key,{enabled:!!x.enabled,message:x.message}]));
    const windows=await env.DB.prepare("SELECT title,reason,scope,service_keys_json,starts_at,ends_at,notice_text,notice_days,status FROM maintenance_windows WHERE status IN ('scheduled','active') AND (datetime(starts_at)>datetime('now') OR (datetime(starts_at)<=datetime('now') AND (ends_at IS NULL OR datetime(ends_at)>datetime('now')))) ORDER BY starts_at LIMIT 10").all();
    const scheduledGlobal=windows.results.some(w=>w.scope==='all'&&Date.parse(w.starts_at)<=Date.now()&&(!w.ends_at||Date.parse(w.ends_at)>Date.now()));
    return json({maintenance:settings?.value==='on'||scheduledGlobal,services:servicesState,scheduled:windows.results});
  }
  const cms=path.match(/^\/api\/content\/([a-z0-9-]+)$/);
  if(cms&&req.method==='GET'){
    const p=await env.DB.prepare("SELECT slug,title,body_html,excerpt,seo_json,published_at,updated_at FROM cms_pages WHERE slug=? AND status='published'").bind(cms[1]).first();
    return p?json({page:{...p,seo:JSON.parse(p.seo_json||'{}')}}):fail('Không tìm thấy nội dung.',404);
  }
  return null;
}

export async function handlePlatform(req,env,path,url,user){
  const method=req.method;
  if(path==='/api/notifications'&&method==='GET'){
    const rows=await env.DB.prepare('SELECT id,category,title,body,href,read_at,created_at FROM notifications WHERE user_id=? ORDER BY created_at DESC LIMIT 100').bind(user.id).all();
    const count=await env.DB.prepare('SELECT COUNT(*) n FROM notifications WHERE user_id=? AND read_at IS NULL').bind(user.id).first();
    return json({notifications:rows.results,unread:count.n});
  }
  const notice=path.match(/^\/api\/notifications\/([\w-]+)\/read$/);
  if(notice&&method==='PUT'){
    await env.DB.prepare('UPDATE notifications SET read_at=CURRENT_TIMESTAMP WHERE id=? AND user_id=?').bind(notice[1],user.id).run();return json({ok:true});
  }
  if(path==='/api/notifications/read-all'&&method==='PUT'){
    await env.DB.prepare('UPDATE notifications SET read_at=CURRENT_TIMESTAMP WHERE user_id=? AND read_at IS NULL').bind(user.id).run();return json({ok:true});
  }
  if(path==='/api/resources'&&method==='GET'){
    const q=clean(url.searchParams.get('q')||'',100),lang=clean(url.searchParams.get('language')||'',5),cat=clean(url.searchParams.get('category')||'',30);
    const rows=await env.DB.prepare(`SELECT r.id,r.title,r.description,r.language_code,r.category,r.visibility,r.created_at,u.full_name owner_name
      FROM resources r JOIN users u ON u.id=r.owner_id WHERE r.status='approved' AND (r.visibility='public' OR r.owner_id=? OR r.visibility='members')
      AND (?='' OR r.title LIKE '%'||?||'%' OR r.description LIKE '%'||?||'%') AND (?='' OR r.language_code=?) AND (?='' OR r.category=?)
      ORDER BY r.created_at DESC LIMIT 80`).bind(user.id,q,q,q,lang,lang,cat,cat).all();
    return json({resources:rows.results});
  }
  if(path==='/api/resources'&&method==='POST'){
    const d=await readJson(req),title=clean(d.title,160),fileId=clean(d.fileId,80);if(title.length<2)return fail('Tên tài nguyên chưa hợp lệ.');
    const file=await env.DB.prepare('SELECT id,owner_id,scan_status FROM file_objects WHERE id=?').bind(fileId).first();if(!file||file.owner_id!==user.id)return fail('Tệp không thuộc tài khoản của bạn.',403);
    const id=uid();await env.DB.prepare('INSERT INTO resources(id,owner_id,file_id,title,description,language_code,category,visibility,status,copyright_note) VALUES(?,?,?,?,?,?,?,?,?,?)')
      .bind(id,user.id,file.id,title,clean(d.description,1500),['zh','en','ko','ja','ru'].includes(d.language)?d.language:null,clean(d.category,30)||'other',['public','members','private'].includes(d.visibility)?d.visibility:'private','pending',clean(d.copyrightNote,500)).run();
    return json({ok:true,id,status:'pending_review',fileScan:file.scan_status},201);
  }
  if(path==='/api/files'&&method==='POST'){
    if(!env.R2)return fail('Kho lưu trữ R2 chưa được gắn vào Worker.',503);
    const form=await req.formData(),file=form.get('file');if(!(file instanceof File))return fail('Thiếu tệp tải lên.');
    const allowed=new Set(['application/pdf','image/jpeg','image/png','image/webp','audio/mpeg','audio/mp4','audio/wav','audio/ogg','audio/webm','text/plain']);
    if(!allowed.has(file.type))return fail('Định dạng chưa được hỗ trợ. Cho phép PDF, ảnh, âm thanh và văn bản.',415);
    const max=file.type.startsWith('image/')?8*1024*1024:file.type.startsWith('audio/')?20*1024*1024:15*1024*1024;
    if(file.size<1||file.size>max)return fail('Dung lượng tệp vượt giới hạn cho phép.',413);
    const id=uid(),safeName=clean(file.name,160).replace(/[^\p{L}\p{N}._ -]/gu,'_'),key=`quarantine/${user.id}/${id}`;
    const bytes=await file.arrayBuffer();
    // Basic signature checks stop obvious MIME spoofing; malware scanning remains a provider integration.
    const b=new Uint8Array(bytes.slice(0,16));const starts=(...x)=>x.every((v,i)=>b[i]===v);
    const valid=file.type==='application/pdf'?starts(0x25,0x50,0x44,0x46):file.type==='image/png'?starts(0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a):file.type==='image/jpeg'?starts(0xff,0xd8,0xff):file.type==='image/webp'?String.fromCharCode(...b.slice(0,4))==='RIFF'&&String.fromCharCode(...b.slice(8,12))==='WEBP':file.type==='audio/mpeg'?starts(0x49,0x44,0x33)||starts(0xff,0xfb)||starts(0xff,0xf3):file.type==='audio/wav'?String.fromCharCode(...b.slice(0,4))==='RIFF':file.type==='audio/ogg'?String.fromCharCode(...b.slice(0,4))==='OggS':file.type==='audio/mp4'?String.fromCharCode(...b.slice(4,8))==='ftyp':file.type==='audio/webm'?starts(0x1a,0x45,0xdf,0xa3):true;
    if(!valid)return fail('Nội dung tệp không khớp định dạng khai báo.',415);
    await env.R2.put(key,bytes,{httpMetadata:{contentType:file.type,cacheControl:'private, no-store'},customMetadata:{ownerId:user.id,originalName:safeName}});
    await env.DB.prepare('INSERT INTO file_objects(id,owner_id,object_key,original_name,mime_type,size_bytes,visibility,scan_status) VALUES(?,?,?,?,?,?,?,?)').bind(id,user.id,key,safeName,file.type,file.size,'private','pending').run();
    let scanStatus='pending';
    if(env.FILE_SCAN_URL&&env.FILE_SCAN_API_KEY){
      try{
        const response=await fetch(env.FILE_SCAN_URL,{method:'POST',headers:{Authorization:`Bearer ${env.FILE_SCAN_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({objectKey:key,mimeType:file.type,sizeBytes:file.size}),signal:AbortSignal.timeout(12000)});
        if(response.ok){const verdict=(await response.json()).verdict;if(verdict==='clean'||verdict==='malicious'){scanStatus=verdict==='clean'?'clean':'rejected';await env.DB.prepare("UPDATE file_objects SET scan_status=? WHERE id=? AND scan_status='pending'").bind(scanStatus,id).run();}}
      }catch{/* Fail closed: upload remains private and pending when the scanner cannot be reached. */}
    }
    await audit(env,user,'file.upload.quarantine','file',id,{mime:file.type,size:file.size,scanStatus},req);
    return json({ok:true,file:{id,name:safeName,mime:file.type,size:file.size,scanStatus}},201);
  }
  const fileStatus=path.match(/^\/api\/files\/([\w-]+)\/status$/);
  if(fileStatus&&method==='GET'){
    const f=await env.DB.prepare('SELECT id,original_name,mime_type,size_bytes,scan_status,created_at FROM file_objects WHERE id=? AND owner_id=?').bind(fileStatus[1],user.id).first();
    return f?json({file:f}):fail('Không tìm thấy tệp.',404);
  }
  const resourceDownload=path.match(/^\/api\/resources\/([\w-]+)\/download$/);
  if(resourceDownload&&method==='GET'){
    const r=await env.DB.prepare('SELECT r.id,r.owner_id,r.visibility,r.status,f.id file_id,f.object_key,f.original_name,f.mime_type,f.scan_status FROM resources r JOIN file_objects f ON f.id=r.file_id WHERE r.id=?').bind(resourceDownload[1]).first();
    if(!r||r.status!=='approved'||r.scan_status!=='clean')return fail('Tài nguyên chưa được duyệt hoặc tệp chưa hoàn tất kiểm tra.',403);
    if(r.visibility==='private'&&r.owner_id!==user.id)return fail('Bạn không có quyền truy cập.',403);
    const obj=await env.R2.get(r.object_key);if(!obj)return fail('Tệp không còn trong kho lưu trữ.',404);
    return new Response(obj.body,{headers:{'content-type':r.mime_type,'content-disposition':`attachment; filename*=UTF-8''${encodeURIComponent(r.original_name)}`,'cache-control':'private, no-store','x-content-type-options':'nosniff'}});
  }
  const fileGet=path.match(/^\/api\/files\/([\w-]+)$/);
  if(fileGet&&method==='GET'){
    const f=await env.DB.prepare('SELECT id,owner_id,object_key,original_name,mime_type,scan_status,visibility FROM file_objects WHERE id=?').bind(fileGet[1]).first();if(!f)return fail('Không tìm thấy tệp.',404);
    const resource=await env.DB.prepare("SELECT id FROM resources WHERE file_id=? AND status='approved' AND visibility='public'").bind(f.id).first();
    if(f.owner_id!==user.id&&!resource&&f.scan_status!=='clean')return fail('Tệp đang được kiểm tra hoặc không có quyền truy cập.',403);
    if(f.owner_id!==user.id&&!resource)return fail('Bạn không có quyền truy cập tệp này.',403);
    const obj=await env.R2.get(f.object_key);if(!obj)return fail('Tệp không còn trong kho lưu trữ.',404);
    return new Response(obj.body,{headers:{'content-type':f.mime_type,'content-disposition':`inline; filename*=UTF-8''${encodeURIComponent(f.original_name)}`,'cache-control':'private, no-store','x-content-type-options':'nosniff'}});
  }
  if(path==='/api/help/tickets'&&method==='GET'){
    const rows=await env.DB.prepare('SELECT id,ticket_code,subject,category,status,created_at,updated_at FROM support_tickets WHERE user_id=? ORDER BY created_at DESC LIMIT 100').bind(user.id).all();return json({tickets:rows.results});
  }
  if(path==='/api/help/tickets'&&method==='POST'){
    const d=await readJson(req),subject=clean(d.subject,180),body=clean(d.body,6000),category=['account','learning','billing','community','exam','technical','other'].includes(d.category)?d.category:'other';
    if(subject.length<4||body.length<10)return fail('Vui lòng nhập tiêu đề và mô tả vấn đề rõ hơn.');
    const id=uid(),code=`WB-${new Date().toISOString().slice(0,10).replaceAll('-','')}-${crypto.getRandomValues(new Uint32Array(1))[0].toString(36).toUpperCase().slice(0,6)}`;
    await env.DB.prepare('INSERT INTO support_tickets(id,user_id,ticket_code,subject,body,category) VALUES(?,?,?,?,?,?)').bind(id,user.id,code,subject,body,category).run();
    await audit(env,user,'support.ticket.create','ticket',id,{category},req);
    try{await queueTemplateEmail(env,user.email,'ticket-created',{name:user.full_name,ticketCode:code,url:'/ho-tro'},`ticket-created:${id}`,req);}catch{}
    return json({ok:true,id,code,status:'new'},201);
  }
  const ticket=path.match(/^\/api\/help\/tickets\/([\w-]+)$/);
  if(ticket&&method==='GET'){
    const t=await env.DB.prepare('SELECT id,ticket_code,subject,body,category,status,created_at,updated_at FROM support_tickets WHERE id=? AND user_id=?').bind(ticket[1],user.id).first();if(!t)return fail('Không tìm thấy yêu cầu hỗ trợ.',404);
    const replies=await env.DB.prepare('SELECT r.body,r.created_at,u.full_name FROM support_replies r JOIN users u ON u.id=r.author_id WHERE r.ticket_id=? AND r.internal_note=0 ORDER BY r.created_at').bind(t.id).all();return json({ticket:t,replies:replies.results});
  }
  if(path==='/api/admin/overview'&&method==='GET'&&isAdmin(user)){
    const tables=['users','organizations','practice_results','friendships','posts','groups','resources','payment_orders','subscriptions','exams','exam_attempts','support_tickets','email_queue','audit_logs'];
    const counts=await Promise.all(tables.map(async t=>[t,(await env.DB.prepare(`SELECT COUNT(*) n FROM ${t}`).first()).n]));
    const unread=await env.DB.prepare("SELECT COUNT(*) n FROM email_queue WHERE status IN ('queued','retry')").first();
    return json({counts:Object.fromEntries(counts),queuedEmails:unread.n,integrations:{r2:!!env.R2,email:!!env.EMAIL_API_KEY,ai:!!env.AI_API_KEY,registry:!!env.REGISTRY_API_URL,payment:!!env.PAYMENT_WEBHOOK_SECRET}});
  }
  if(path==='/api/admin/services'&&method==='GET'&&isAdmin(user)){
    const rows=await env.DB.prepare('SELECT service_key,enabled,message FROM service_status ORDER BY service_key').all();return json({services:rows.results});
  }
  if(path==='/api/admin/services'&&method==='PUT'&&canManageSystem(user)){
    const d=await readJson(req);for(const k of services){if(typeof d.services?.[k]?.enabled==='boolean'||typeof d.services?.[k]==='boolean'){const enabled=typeof d.services[k]==='boolean'?d.services[k]:d.services[k].enabled;const message=typeof d.services[k]==='object'?clean(d.services[k].message,300):'';await env.DB.prepare('UPDATE service_status SET enabled=?,message=?,updated_by=?,updated_at=CURRENT_TIMESTAMP WHERE service_key=?').bind(enabled?1:0,message,user.id,k).run();}}
    await audit(env,user,'system.services.update','service','all',d.services||{},req);return json({ok:true});
  }
  if(path==='/api/admin/maintenance'&&method==='GET'&&canManageSystem(user)){
    const global=await env.DB.prepare("SELECT value FROM settings WHERE key='maintenance_global'").first();const schedule=await env.DB.prepare('SELECT * FROM maintenance_windows ORDER BY starts_at DESC LIMIT 50').all();const active=schedule.results.some(w=>w.scope==='all'&&['scheduled','active'].includes(w.status)&&Date.parse(w.starts_at)<=Date.now()&&(!w.ends_at||Date.parse(w.ends_at)>Date.now()));return json({enabled:global?.value==='on'||active,windows:schedule.results});
  }
  if(path==='/api/admin/maintenance'&&method==='PUT'&&canManageSystem(user)){
    const d=await readJson(req);await env.DB.prepare("INSERT INTO settings(key,value,updated_by) VALUES('maintenance_global',?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_by=excluded.updated_by,updated_at=CURRENT_TIMESTAMP").bind(d.enabled?'on':'off',user.id).run();await audit(env,user,d.enabled?'maintenance.enable':'maintenance.disable','system','global',{reason:clean(d.reason,300)},req);return json({ok:true,enabled:!!d.enabled});
  }
  if(path==='/api/admin/maintenance/schedule'&&method==='POST'&&canManageSystem(user)){
    const d=await readJson(req),id=uid();if(!clean(d.title,120)||!d.startsAt||Number.isNaN(Date.parse(d.startsAt)))return fail('Tên hoặc thời điểm bắt đầu chưa hợp lệ.');
    const keys=Array.isArray(d.services)?d.services.filter(x=>services.includes(x)):[];await env.DB.prepare('INSERT INTO maintenance_windows(id,title,reason,scope,service_keys_json,starts_at,ends_at,notice_text,notice_days,created_by) VALUES(?,?,?,?,?,?,?,?,?,?)').bind(id,clean(d.title,120),clean(d.reason,500),d.scope==='all'?'all':'selected',JSON.stringify(keys),new Date(d.startsAt).toISOString(),d.endsAt&&Date.parse(d.endsAt)>Date.parse(d.startsAt)?new Date(d.endsAt).toISOString():null,clean(d.notice,1000),Math.max(0,Math.min(30,Number(d.noticeDays??3))),user.id).run();await audit(env,user,'maintenance.schedule.create','maintenance',id,{},req);return json({ok:true,id},201);
  }
  if(path==='/api/admin/cms/autosave'&&method==='POST'&&canManageContent(user)){
    const d=await readJson(req),slug=clean(d.slug,80).toLowerCase().replace(/[^a-z0-9-]/g,'-'),title=clean(d.title,150);if(!slug||!title)return fail('Cần nhập slug và tiêu đề trước khi tự động lưu.');const body=sanitizeHtml(d.bodyHtml||'');const prior=await env.DB.prepare("SELECT id FROM cms_revisions WHERE slug=? AND status='autosave' ORDER BY created_at DESC LIMIT 1").bind(slug).first();if(prior)await env.DB.prepare('UPDATE cms_revisions SET title=?,body_html=?,editor_id=?,created_at=CURRENT_TIMESTAMP WHERE id=?').bind(title,body,user.id,prior.id).run();else await env.DB.prepare("INSERT INTO cms_revisions(id,slug,title,body_html,status,editor_id) VALUES(?,?,?,?,'autosave',?)").bind(uid(),slug,title,body,user.id).run();return json({ok:true,savedAt:new Date().toISOString()});
  }
  if(path==='/api/admin/cms/autosave/clear'&&method==='POST'&&canManageContent(user)){const d=await readJson(req),slug=clean(d.slug,80);await env.DB.prepare("DELETE FROM cms_revisions WHERE slug=? AND status='autosave'").bind(slug).run();return json({ok:true});}
  if(path==='/api/admin/cms/pages'&&method==='GET'&&canManageContent(user)){
    const rows=await env.DB.prepare('SELECT slug,title,excerpt,status,updated_at,published_at FROM cms_pages ORDER BY updated_at DESC').all();return json({pages:rows.results});
  }
  if(path==='/api/admin/cms/pages'&&method==='POST'&&canManageContent(user)){
    const d=await readJson(req),slug=clean(d.slug,80).toLowerCase().replace(/[^a-z0-9-]/g,'-').replace(/-+/g,'-');if(!slug||!clean(d.title,150))return fail('Cần slug và tiêu đề.');
    const body=sanitizeHtml(d.bodyHtml||''),status=d.status==='published'?'published':'draft';
    await env.DB.prepare('INSERT INTO cms_pages(slug,title,body_html,excerpt,status,seo_json,updated_by,published_at) VALUES(?,?,?,?,?,?,?,CASE WHEN ?=\'published\' THEN CURRENT_TIMESTAMP ELSE NULL END) ON CONFLICT(slug) DO UPDATE SET title=excluded.title,body_html=excluded.body_html,excerpt=excluded.excerpt,status=excluded.status,seo_json=excluded.seo_json,updated_by=excluded.updated_by,updated_at=CURRENT_TIMESTAMP,published_at=CASE WHEN excluded.status=\'published\' THEN CURRENT_TIMESTAMP ELSE NULL END').bind(slug,clean(d.title,150),body,clean(d.excerpt,500),status,JSON.stringify(d.seo||{}),user.id,status).run();
    await env.DB.prepare('INSERT INTO cms_revisions(id,slug,title,body_html,status,editor_id) VALUES(?,?,?,?,?,?)').bind(uid(),slug,clean(d.title,150),body,status,user.id).run();await audit(env,user,'cms.page.save','cms_page',slug,{status},req);return json({ok:true,slug,status});
  }
  const restore=path.match(/^\/api\/admin\/cms\/pages\/([a-z0-9-]+)\/restore$/);
  if(restore&&method==='POST'&&canManageContent(user)){
    const d=await readJson(req),revision=await env.DB.prepare('SELECT slug,title,body_html FROM cms_revisions WHERE id=? AND slug=?').bind(clean(d.revisionId,80),restore[1]).first();if(!revision)return fail('Không tìm thấy phiên bản nội dung.',404);
    await env.DB.prepare("INSERT INTO cms_pages(slug,title,body_html,status,updated_by,published_at) VALUES(?,?,?,'draft',?,NULL) ON CONFLICT(slug) DO UPDATE SET title=excluded.title,body_html=excluded.body_html,status='draft',updated_by=excluded.updated_by,updated_at=CURRENT_TIMESTAMP,published_at=NULL").bind(revision.slug,revision.title,revision.body_html,user.id).run();
    await env.DB.prepare("INSERT INTO cms_revisions(id,slug,title,body_html,status,editor_id) VALUES(?,?,?,?,'restored',?)").bind(uid(),revision.slug,revision.title,revision.body_html,user.id).run();await audit(env,user,'cms.page.restore','cms_page',revision.slug,{revisionId:d.revisionId},req);return json({ok:true,slug:revision.slug,status:'draft'});
  }
  const page=path.match(/^\/api\/admin\/cms\/pages\/([a-z0-9-]+)$/);
  if(page&&method==='GET'&&canManageContent(user)){
    const p=await env.DB.prepare('SELECT * FROM cms_pages WHERE slug=?').bind(page[1]).first();if(!p)return fail('Không tìm thấy trang.',404);const rev=await env.DB.prepare('SELECT id,title,status,created_at FROM cms_revisions WHERE slug=? ORDER BY created_at DESC LIMIT 30').bind(page[1]).all();return json({page:p,revisions:rev.results});
  }
  if(path==='/api/admin/health'&&method==='GET'&&canManageSystem(user)){
    const d1=await env.DB.prepare('SELECT 1 ok').first(),storage=!!env.R2;return json({worker:true,d1:!!d1,r2:storage,origin:env.APP_ORIGIN,appVersion:env.APP_VERSION||'source-2026.11'});
  }
  if(path==='/api/admin/audit'&&method==='GET'&&canManageSystem(user)){
    const rows=await env.DB.prepare('SELECT action,target_type,target_id,details_json,created_at FROM audit_logs ORDER BY created_at DESC LIMIT 200').all();return json({logs:rows.results});
  }
  if(path==='/api/admin/email/dispatch'&&method==='POST'&&canManageSystem(user)){
    if(!env.EMAIL_API_KEY)return fail('Chưa cấu hình EMAIL_API_KEY.',503);const result=await sendQueuedEmail(env,Math.max(1,Math.min(50,Number((await readJson(req)).limit)||10)));return json({ok:true,result});
  }
  if(path.startsWith('/api/admin/email/')||path==='/api/admin/email/templates'||path==='/api/admin/email/queue'){
    if(!canManageSystem(user))return fail('Chỉ quản trị hệ thống được truy cập nội dung hàng đợi email và công cụ gửi thử.',403);return handleEmail(req,env,path,user);
  }
  if(path==='/api/admin/resources/review'&&method==='POST'&&canModerateResources(user)){
    const d=await readJson(req);if(!['approved','rejected'].includes(d.status))return fail('Trạng thái duyệt không hợp lệ.');if(d.status==='approved'){const scan=await env.DB.prepare('SELECT f.scan_status FROM resources r JOIN file_objects f ON f.id=r.file_id WHERE r.id=?').bind(clean(d.id,80)).first();if(!scan||scan.scan_status!=='clean')return fail('Chỉ được duyệt sau khi tệp đã được kiểm tra và đánh dấu an toàn.',409);}await env.DB.prepare('UPDATE resources SET status=? WHERE id=? AND status=?').bind(d.status,clean(d.id,80),'pending').run();await audit(env,user,'resource.review','resource',d.id,{status:d.status},req);return json({ok:true});
  }
  if(path==='/api/admin/files/scan'&&method==='POST'&&canManageSystem(user)){
    if(!env.FILE_SCAN_URL||!env.FILE_SCAN_API_KEY)return fail('Chưa kết nối nhà cung cấp quét mã độc. Không thể tự đánh dấu tệp là an toàn.',503,{code:'FILE_SCAN_NOT_CONFIGURED'});
    const d=await readJson(req),file=await env.DB.prepare('SELECT id,object_key,mime_type,size_bytes FROM file_objects WHERE id=? AND scan_status=\'pending\'').bind(clean(d.id,80)).first();
    if(!file)return fail('Không tìm thấy tệp đang chờ quét.',404);
    let verdict;try{const response=await fetch(env.FILE_SCAN_URL,{method:'POST',headers:{Authorization:`Bearer ${env.FILE_SCAN_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({objectKey:file.object_key,mimeType:file.mime_type,sizeBytes:file.size_bytes}),signal:AbortSignal.timeout(15000)});if(!response.ok)return fail('Nhà cung cấp quét mã độc chưa trả kết quả hợp lệ.',502);const payload=await response.json();verdict=payload.verdict;}catch{return fail('Không thể kết nối dịch vụ quét mã độc. Tệp vẫn được giữ trong khu cách ly.',502);}
    if(!['clean','malicious'].includes(verdict))return fail('Kết quả quét không xác định. Tệp vẫn được giữ trong khu cách ly.',502);
    const status=verdict==='clean'?'clean':'rejected';await env.DB.prepare('UPDATE file_objects SET scan_status=? WHERE id=? AND scan_status=\'pending\'').bind(status,file.id).run();await audit(env,user,'file.scan.provider_result','file',file.id,{status},req);return json({ok:true,status,source:'configured_provider'});
  }
  return null;
}
