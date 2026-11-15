import {json,fail,rateLimit,ensureSameOrigin,isMutating,audit,sha256,getCookie} from './src/core.js';
import {currentUser,verifyCsrf,handleAuth} from './src/auth.js';
import {handleLearning} from './src/learning.js';
import {handleLearningAssistant} from './src/assistant.js';
import {handleCommunity} from './src/community.js';
import {handleOrganizations,syncAddressDirectory} from './src/organizations.js';
import {handleCommerce} from './src/commerce.js';
import {handleExams} from './src/exams.js';
import {publicSystem,handlePlatform} from './src/platform.js';
import {sendQueuedEmail} from './src/email.js';

const PUBLIC_AUTH=new Set(['/api/auth/register','/api/auth/login','/api/auth/verify-email','/api/auth/resend-verification','/api/auth/password/reset/request','/api/auth/password/reset/confirm']);
const NO_CSRF=new Set(['/api/payments/webhook']);
const ADMIN_ROLES=['super_admin','admin'];
const securityHeaders={
  'X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin','X-Frame-Options':'DENY',
  'Permissions-Policy':'camera=(self), microphone=(self), geolocation=()',
  'Cross-Origin-Resource-Policy':'same-origin',
  'Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: blob:; media-src 'self' blob:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'"
};
function applyHeaders(response){const h=new Headers(response.headers);for(const [k,v] of Object.entries(securityHeaders))h.set(k,v);return new Response(response.body,{status:response.status,statusText:response.statusText,headers:h});}
function isAdmin(u){return u&&ADMIN_ROLES.includes(u.role);}
function serviceFor(path){
  if(path.startsWith('/api/practice')||path.startsWith('/api/progress')||path.startsWith('/api/languages')||path.startsWith('/api/vocabulary')||path==='/api/learning/assistant')return 'learning';
  if(path.startsWith('/api/people')||path.startsWith('/api/friends'))return 'connect';
  if(path.startsWith('/api/community')||path.startsWith('/api/groups'))return 'community';
  if(path.startsWith('/api/organizations')||path.startsWith('/api/reference'))return 'organizations';
  if(path.startsWith('/api/resources')||path.startsWith('/api/files'))return 'resources';
  if(path.startsWith('/api/checkout')||path.startsWith('/api/payments')||path.startsWith('/api/subscriptions')||path.startsWith('/api/plans')||path.startsWith('/api/aid'))return 'payments';
  if(path.startsWith('/api/exams'))return 'exams';
  if(path.startsWith('/api/conversations'))return 'chat';
  return null;
}
async function serviceEnabled(env,key){
  const s=await env.DB.prepare('SELECT enabled,message FROM service_status WHERE service_key=?').bind(key).first();
  if(s&&!s.enabled)return false;
  const windows=await env.DB.prepare("SELECT service_keys_json FROM maintenance_windows WHERE scope='selected' AND status IN ('scheduled','active') AND datetime(starts_at)<=datetime('now') AND (ends_at IS NULL OR datetime(ends_at)>datetime('now'))").all();
  return !windows.results.some(w=>{try{return JSON.parse(w.service_keys_json||'[]').includes(key)}catch{return false}});
}
async function globalMaintenanceEnabled(env){
  const setting=await env.DB.prepare("SELECT value FROM settings WHERE key='maintenance_global'").first().catch(()=>null);
  if(setting?.value==='on')return true;
  const scheduled=await env.DB.prepare("SELECT id FROM maintenance_windows WHERE scope='all' AND status IN ('scheduled','active') AND datetime(starts_at)<=datetime('now') AND (ends_at IS NULL OR datetime(ends_at)>datetime('now')) LIMIT 1").first();
  return !!scheduled;
}
async function api(req,env,ctx){
  const url=new URL(req.url),path=url.pathname,method=req.method;
  if(method==='OPTIONS')return new Response(null,{status:204,headers:{'access-control-allow-methods':'GET,POST,PUT,PATCH,DELETE,OPTIONS','access-control-allow-headers':'Content-Type,X-CSRF-Token','access-control-max-age':'600'}});
  if(path==='/api/health')return json({ok:true,product:'WORD BRIDGE',version:env.APP_VERSION||'2026.11',database:!!env.DB,storage:!!env.R2});
  if(!(await ensureSameOrigin(req,env)))return fail('Nguồn yêu cầu không hợp lệ.',403);
  if(env.DB){const rl=await rateLimit(env,`api:${req.headers.get('CF-Connecting-IP')||'unknown'}`,180,60);if(!rl.ok)return fail('Bạn đang gửi quá nhiều yêu cầu. Vui lòng thử lại sau.',429,{retryAfter:rl.retryAfter});}

  const globalMaintenance=await globalMaintenanceEnabled(env);
  const service=serviceFor(path);
  const user=await currentUser(req,env);
  if(isMutating(req)&&!PUBLIC_AUTH.has(path)&&!NO_CSRF.has(path)){
    if(!user)return fail('Bạn cần đăng nhập.',401);
    if(!(await verifyCsrf(req,user)))return fail('Mã bảo vệ CSRF không hợp lệ. Tải lại trang rồi thử lại.',403);
  }
  if(globalMaintenance&&!path.startsWith('/api/admin/')&&!path.startsWith('/api/auth/')&&path!=='/api/auth/me'&&path!=='/api/system/status'&&!isAdmin(user))return json({maintenance:true,message:'WORD BRIDGE đang bảo trì. Dữ liệu của bạn vẫn được bảo vệ.'},503);
  if(service&&!(await serviceEnabled(env,service))&&!isAdmin(user))return json({servicePaused:true,service,message:'Phân hệ này đang tạm ngưng để bảo trì.'},503);

  if(path.startsWith('/api/auth/')){const r=await handleAuth(req,env,path);if(r)return r;}
  if(path==='/api/profile'||path==='/api/auth/me'||path.startsWith('/api/auth/sessions')){const r=await handleAuth(req,env,path);if(r)return r;}
  let r=await publicSystem(req,env,path,url);if(r)return r;
  if(path.startsWith('/api/admin/')||path==='/api/admin/overview'){
    if(!user)return fail('Bạn cần đăng nhập.',401);
    if(!user.role||!['super_admin','admin','content_admin','support_admin','exam_admin','finance_admin','member_admin','learning_admin','community_admin','org_admin'].includes(user.role))return fail('Bạn không có quyền quản trị.',403);
  }
  if(path.startsWith('/api/admin/')||path==='/api/admin/overview'){
    r=await handlePlatform(req,env,path,url,user);if(r)return r;
    if(path.startsWith('/api/admin/email/'))return fail('Không tìm thấy thao tác email.',404);
  }
  if(path.startsWith('/api/auth/')||path==='/api/profile')return fail('Không tìm thấy API xác thực.',404);
  if(path.startsWith('/api/')){
    if(!user&&!NO_CSRF.has(path)&&!['/api/languages','/api/practice/sets','/api/plans','/api/content','/api/reference/provinces','/api/reference/communes'].some(x=>path===x||path.startsWith(x+'/')))return fail('Bạn cần đăng nhập.',401);
    const handlers=[handleLearningAssistant,handleLearning,handleCommunity,handleOrganizations,handleCommerce,handleExams,handlePlatform];
    for(const fn of handlers){r=await fn(req,env,path,url,user);if(r)return r;}
    return fail('Không tìm thấy API.',404);
  }
  return fail('Không tìm thấy API.',404);
}

export default {
  async fetch(req,env,ctx){
    const url=new URL(req.url);
    try{
      if(url.pathname==='/health')return applyHeaders(json({ok:true,service:'WORD BRIDGE',version:env.APP_VERSION||'2026.11'}));
      if(url.pathname.startsWith('/email-templates/'))return applyHeaders(new Response('Not Found',{status:404}));
      if(url.pathname.startsWith('/api/'))return applyHeaders(await api(req,env,ctx));
      const asset=await env.ASSETS.fetch(req);
      return applyHeaders(asset);
    }catch(error){
      const requestId=crypto.randomUUID();
      console.error(JSON.stringify({requestId,method:req.method,path:url.pathname,error:String(error?.message||error).slice(0,500)}));
      return applyHeaders(json({error:'Đã xảy ra lỗi hệ thống. Vui lòng thử lại hoặc liên hệ CSKH.',requestId},500));
    }
  },
  async scheduled(controller,env,ctx){
    ctx.waitUntil((async()=>{
      const now=new Date().toISOString();
      await env.DB.prepare("UPDATE maintenance_windows SET status='active' WHERE status='scheduled' AND starts_at<=? AND (ends_at IS NULL OR ends_at>?)").bind(now,now).run();
      await env.DB.prepare("UPDATE maintenance_windows SET status='completed' WHERE status='active' AND ends_at IS NOT NULL AND ends_at<=?").bind(now).run();
      const address=await env.DB.prepare("SELECT last_checked_at FROM system_integrations WHERE integration_key='address_directory'").first().catch(()=>null);
      if(!address?.last_checked_at||Date.now()-Date.parse(address.last_checked_at)>20*3600000)await syncAddressDirectory(env);
      if(env.EMAIL_API_KEY)await sendQueuedEmail(env,20);
    })());
  }
};
