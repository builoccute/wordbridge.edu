import {json,fail,readJson,clean,validEmail,uid,sha256,randomToken,cookie,getCookie,hashPassword,verifyPassword,passwordPolicy,rateLimit,audit,addNotification,now,maskEmail} from './core.js';
import {queueTemplateEmail} from './email.js';

export async function currentUser(req, env) {
  const token=getCookie(req,'wb_session'); if(!token) return null;
  const row=await env.DB.prepare(`SELECT u.id,u.email,u.phone,u.full_name,u.username,u.role,u.status,u.plan,u.email_verified_at,s.csrf_hash,s.expires_at
    FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.id_hash=?`).bind(await sha256(token)).first();
  if(!row || row.status!=='active' || Date.parse(row.expires_at)<=Date.now()) return null;
  return row;
}
export async function verifyCsrf(req,user) {
  if(!user || ['GET','HEAD','OPTIONS'].includes(req.method)) return true;
  const token=req.headers.get('X-CSRF-Token')||'';
  return !!token && await sha256(token)===user.csrf_hash;
}
function ip(req){return req.headers.get('CF-Connecting-IP')||'unknown';}
async function makeSession(req,env,user) {
  const raw=randomToken(32),csrf=randomToken(24),expires=new Date(Date.now()+7*86400000).toISOString();
  await env.DB.prepare('INSERT INTO sessions(id_hash,user_id,csrf_hash,user_agent,ip_hash,expires_at) VALUES(?,?,?,?,?,?)')
    .bind(await sha256(raw),user.id,await sha256(csrf),clean(req.headers.get('User-Agent'),300),await sha256(ip(req)),expires).run();
  return {raw,csrf,expires};
}
async function newOtp(env,user,purpose,req) {
  const code=String(crypto.getRandomValues(new Uint32Array(1))[0]%100000000).padStart(8,'0');
  const id=uid(),tokenHash=await sha256(code),expires=new Date(Date.now()+10*60000).toISOString();
  await env.DB.prepare('INSERT INTO auth_tokens(id,user_id,token_hash,purpose,expires_at) VALUES(?,?,?,?,?)').bind(id,user.id,tokenHash,purpose,expires).run();
  const template=purpose==='verify_email'?'verify-email':purpose==='password_reset'?'reset-password':'login-otp';
  await queueTemplateEmail(env,user.email,template,{name:user.full_name,code,expires:'10 phút'},`${purpose}:${user.id}:${Math.floor(Date.now()/600000)}`,req);
  return code;
}
export async function handleAuth(req,env,path) {
  const method=req.method;
  if(path==='/api/auth/register' && method==='POST'){
    if(env.PUBLIC_REGISTRATION==='false') return fail('Đăng ký đang tạm đóng.',403);
    const rl=await rateLimit(env,`register:${ip(req)}`,4,3600); if(!rl.ok)return fail('Bạn đã gửi quá nhiều yêu cầu đăng ký. Hãy thử lại sau.',429,{retryAfter:rl.retryAfter});
    const d=await readJson(req),email=clean(d.email,254).toLowerCase(),phone=clean(d.phone,20),name=clean(d.fullName,120),password=String(d.password||''),username=clean(d.username,32).toLowerCase();
    const policy=passwordPolicy(password);
    if(!validEmail(email)||name.length<2||phone.replace(/\D/g,'').length<8||!policy.valid) return fail('Thông tin chưa hợp lệ. Mật khẩu cần tối thiểu 15 ký tự, ít nhất 1 chữ hoa và 3 ký tự đặc biệt.',400,{passwordPolicy:policy});
    if(username && !/^[a-z0-9_]{3,32}$/.test(username)) return fail('Tên người dùng chỉ gồm chữ thường, số và dấu gạch dưới (3–32 ký tự).');
    const id=uid(),passwordHash=await hashPassword(password);
    try {
      await env.DB.batch([
        env.DB.prepare('INSERT INTO users(id,email,phone,full_name,username,password_hash) VALUES(?,?,?,?,?,?)').bind(id,email,phone,name,username||null,passwordHash),
        env.DB.prepare('INSERT INTO profiles(user_id) VALUES(?)').bind(id)
      ]);
    } catch { return fail('Email hoặc tên người dùng đã tồn tại.',409); }
    const user={id,email,full_name:name};
    const code=await newOtp(env,user,'verify_email',req);
    await audit(env,user,'auth.register','user',id,{},req);
    return json({ok:true,verificationRequired:true,delivery:env.EMAIL_API_KEY?'queued':'provider_not_configured',maskedEmail:maskEmail(email),debugCode:env.APP_ENV==='development'?code:undefined},201);
  }
  if(path==='/api/auth/verify-email' && method==='POST'){
    const d=await readJson(req),email=clean(d.email,254).toLowerCase(),code=clean(d.code,8);
    if(!validEmail(email)||!/^[0-9]{8}$/.test(code))return fail('Email hoặc mã xác minh không hợp lệ.');
    const user=await env.DB.prepare('SELECT id,email,full_name FROM users WHERE email=?').bind(email).first();if(!user)return fail('Không tìm thấy tài khoản.',404);
    const token=await env.DB.prepare("SELECT id,token_hash,expires_at,attempts FROM auth_tokens WHERE user_id=? AND purpose='verify_email' AND used_at IS NULL ORDER BY created_at DESC LIMIT 1").bind(user.id).first();
    if(!token||Date.parse(token.expires_at)<Date.now()||token.attempts>=5)return fail('Mã xác minh hết hạn hoặc đã vượt số lần nhập.',400);
    if(await sha256(code)!==token.token_hash){await env.DB.prepare('UPDATE auth_tokens SET attempts=attempts+1 WHERE id=?').bind(token.id).run();return fail('Mã xác minh không chính xác.',400);}
    await env.DB.batch([env.DB.prepare('UPDATE auth_tokens SET used_at=CURRENT_TIMESTAMP WHERE id=?').bind(token.id),env.DB.prepare('UPDATE users SET email_verified_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE id=?').bind(user.id)]);
    await addNotification(env,user.id,'account','Email đã được xác minh','Email của bạn đã được xác minh thành công.');
    return json({ok:true,message:'Email đã được xác minh.'});
  }
  if(path==='/api/auth/login' && method==='POST'){
    const d=await readJson(req),email=clean(d.email,254).toLowerCase(),password=String(d.password||'');
    const rl=await rateLimit(env,`login:${ip(req)}:${email}`,8,300);
    if(!rl.ok)return fail('Tạm khóa yêu cầu đăng nhập do vượt giới hạn. Thử lại sau.',429,{retryAfter:rl.retryAfter});
    const user=await env.DB.prepare('SELECT id,email,full_name,role,plan,password_hash,status,email_verified_at FROM users WHERE email=?').bind(email).first();
    if(!user||user.status!=='active'||!(await verifyPassword(password,user.password_hash)))return fail('Email hoặc mật khẩu không chính xác.',401);
    if(!user.email_verified_at)return fail('Vui lòng xác minh email trước khi đăng nhập.',403,{verificationRequired:true,email:user.email});
    const s=await makeSession(req,env,user);await audit(env,user,'auth.login','user',user.id,{},req);
    return json({ok:true,user:{id:user.id,email:user.email,fullName:user.full_name,role:user.role,plan:user.plan},csrf:s.csrf},200,{'set-cookie':cookie('wb_session',s.raw,604800),'x-csrf-token':s.csrf});
  }
  if(path==='/api/auth/logout' && method==='POST'){
    const u=await currentUser(req,env);if(!u)return json({ok:true},200,{'set-cookie':cookie('wb_session','',0)});
    await env.DB.prepare('DELETE FROM sessions WHERE id_hash=?').bind(await sha256(getCookie(req,'wb_session'))).run();
    await audit(env,u,'auth.logout','user',u.id,{},req);
    return json({ok:true},200,{'set-cookie':cookie('wb_session','',0)});
  }
  if(path==='/api/auth/csrf' && method==='GET'){
    const u=await currentUser(req,env);if(!u)return fail('Bạn cần đăng nhập.',401);const token=randomToken(24);
    await env.DB.prepare('UPDATE sessions SET csrf_hash=? WHERE id_hash=?').bind(await sha256(token),await sha256(getCookie(req,'wb_session'))).run();
    return json({csrf:token});
  }
  if(path==='/api/auth/me' && method==='GET'){
    const u=await currentUser(req,env);
    return json({user:u?{id:u.id,email:u.email,phone:u.phone,fullName:u.full_name,username:u.username,role:u.role,plan:u.plan,emailVerified:!!u.email_verified_at}:null});
  }
  if(path==='/api/auth/resend-verification' && method==='POST'){
    const d=await readJson(req),email=clean(d.email,254).toLowerCase(),user=await env.DB.prepare('SELECT id,email,full_name,email_verified_at FROM users WHERE email=?').bind(email).first();
    if(!user||user.email_verified_at)return json({ok:true,message:'Nếu tài khoản cần xác minh, mã mới sẽ được gửi.'});
    const rl=await rateLimit(env,`otp:${user.id}`,3,3600);if(!rl.ok)return fail('Đã vượt giới hạn gửi mã. Vui lòng thử lại sau.',429);
    await newOtp(env,user,'verify_email',req);return json({ok:true,delivery:env.EMAIL_API_KEY?'queued':'provider_not_configured'});
  }
  if(path==='/api/auth/password/reset/request' && method==='POST'){
    const d=await readJson(req),email=clean(d.email,254).toLowerCase(),user=await env.DB.prepare('SELECT id,email,full_name FROM users WHERE email=?').bind(email).first();
    if(user){const rl=await rateLimit(env,`pwreset:${user.id}`,3,3600);if(rl.ok)await newOtp(env,user,'password_reset',req);}
    return json({ok:true,message:'Nếu email tồn tại, hướng dẫn khôi phục sẽ được gửi.'});
  }
  if(path==='/api/auth/password/reset/confirm' && method==='POST'){
    const d=await readJson(req),email=clean(d.email,254).toLowerCase(),code=clean(d.code,8),password=String(d.password||'');
    if(!passwordPolicy(password).valid)return fail('Mật khẩu mới chưa đáp ứng chính sách bảo mật.');
    const user=await env.DB.prepare('SELECT id FROM users WHERE email=?').bind(email).first();if(!user)return fail('Mã khôi phục không hợp lệ.',400);
    const token=await env.DB.prepare("SELECT id,token_hash,expires_at,attempts FROM auth_tokens WHERE user_id=? AND purpose='password_reset' AND used_at IS NULL ORDER BY created_at DESC LIMIT 1").bind(user.id).first();
    if(!token||Date.parse(token.expires_at)<Date.now()||token.attempts>=5||await sha256(code)!==token.token_hash){if(token)await env.DB.prepare('UPDATE auth_tokens SET attempts=attempts+1 WHERE id=?').bind(token.id).run();return fail('Mã khôi phục không hợp lệ hoặc hết hạn.',400);}
    const ph=await hashPassword(password);await env.DB.batch([env.DB.prepare('UPDATE users SET password_hash=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').bind(ph,user.id),env.DB.prepare('UPDATE auth_tokens SET used_at=CURRENT_TIMESTAMP WHERE id=?').bind(token.id),env.DB.prepare('DELETE FROM sessions WHERE user_id=?').bind(user.id)]);
    return json({ok:true,message:'Mật khẩu đã được cập nhật. Hãy đăng nhập lại.'});
  }
  if(path==='/api/profile' && method==='GET'){
    const u=await currentUser(req,env);if(!u)return fail('Bạn cần đăng nhập.',401);
    const p=await env.DB.prepare('SELECT bio,avatar_key,languages_json,level,goals_json,interests_json,privacy,contact_discovery FROM profiles WHERE user_id=?').bind(u.id).first();
    return json({profile:{...p,languages:JSON.parse(p?.languages_json||'[]'),goals:JSON.parse(p?.goals_json||'[]'),interests:JSON.parse(p?.interests_json||'[]')}});
  }
  if(path==='/api/profile' && method==='PUT'){
    const u=await currentUser(req,env);if(!u)return fail('Bạn cần đăng nhập.',401);const d=await readJson(req);
    const languages=Array.isArray(d.languages)?d.languages.filter(x=>['zh','en','ko','ja','ru'].includes(x)).slice(0,5):[];
    const privacy=['private','members','public'].includes(d.privacy)?d.privacy:'private';
    await env.DB.prepare(`UPDATE profiles SET bio=?,languages_json=?,level=?,goals_json=?,interests_json=?,privacy=?,contact_discovery=?,updated_at=CURRENT_TIMESTAMP WHERE user_id=?`)
      .bind(clean(d.bio,700),JSON.stringify(languages),clean(d.level,40),JSON.stringify(Array.isArray(d.goals)?d.goals.slice(0,10):[]),JSON.stringify(Array.isArray(d.interests)?d.interests.slice(0,20):[]),privacy,d.contactDiscovery?1:0,u.id).run();
    return json({ok:true});
  }
  if(path==='/api/auth/sessions' && method==='GET'){
    const u=await currentUser(req,env);if(!u)return fail('Bạn cần đăng nhập.',401);
    const rows=await env.DB.prepare('SELECT created_at,last_seen_at,expires_at,user_agent FROM sessions WHERE user_id=? ORDER BY created_at DESC').bind(u.id).all();return json({sessions:rows.results});
  }
  if(path==='/api/auth/sessions/others' && method==='DELETE'){
    const u=await currentUser(req,env);if(!u)return fail('Bạn cần đăng nhập.',401);
    await env.DB.prepare('DELETE FROM sessions WHERE user_id=? AND id_hash<>?').bind(u.id,await sha256(getCookie(req,'wb_session'))).run();return json({ok:true});
  }
  return null;
}
