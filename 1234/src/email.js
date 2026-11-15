import {uid,clean,escapeHtml,json,fail,readJson,sha256,audit} from './core.js';

const specs = [
['verify-email','Xác minh địa chỉ email','Xác nhận email WORD BRIDGE','Dùng mã xác minh bên dưới để hoàn tất bước xác minh địa chỉ email.','Xác minh email','account'],
['login-otp','Mã OTP đăng nhập','Mã xác thực đăng nhập','Bạn vừa yêu cầu mã xác thực để đăng nhập WORD BRIDGE. Không chia sẻ mã này với bất kỳ ai.','Dùng mã đăng nhập','security'],
['register-otp','Mã OTP đăng ký','Hoàn tất đăng ký','Nhập mã một lần để xác nhận email đã đăng ký.','Xác nhận đăng ký','account'],
['reset-password','Khôi phục mật khẩu','Yêu cầu đặt lại mật khẩu','Nếu bạn yêu cầu thao tác này, hãy sử dụng liên kết an toàn để đặt mật khẩu mới.','Đặt lại mật khẩu','security'],
['security-alert','Cảnh báo bảo mật','Cảnh báo bảo mật tài khoản','WORD BRIDGE ghi nhận một hoạt động bảo mật cần bạn kiểm tra. Nếu không phải bạn, hãy thu hồi phiên và đổi mật khẩu.','Kiểm tra bảo mật','security'],
['account-update','Cập nhật tài khoản','Thông tin tài khoản đã thay đổi','Một thông tin trong hồ sơ WORD BRIDGE vừa được cập nhật. Hãy kiểm tra nếu bạn không thực hiện thao tác này.','Xem hồ sơ','account'],
['payment-success','Thanh toán thành công','Đã xác nhận thanh toán','Giao dịch của bạn đã được đối soát và xác nhận. Thông tin đơn hàng được lưu trong lịch sử thanh toán.','Xem giao dịch','billing'],
['payment-failed','Thanh toán thất bại','Chưa thể xác nhận giao dịch','Giao dịch chưa được xác nhận. Vui lòng kiểm tra nội dung chuyển khoản hoặc liên hệ bộ phận chăm sóc khách hàng.','Xem thanh toán','billing'],
['invoice','Hóa đơn WORD BRIDGE','Thông tin hóa đơn','Đây là thông báo liên quan đến chứng từ của giao dịch. Tệp hóa đơn chỉ được đính kèm khi đã được phát hành hợp lệ.','Xem hóa đơn','billing'],
['service-activated','Dịch vụ đã kích hoạt','Quyền dịch vụ đã được cập nhật','Gói dịch vụ đã được kích hoạt theo trạng thái đơn hàng đã xác minh.','Quản lý dịch vụ','billing'],
['learning-notification','Thông báo học tập','Tiếp tục hành trình thực hành','Có cập nhật liên quan đến mục tiêu và hoạt động thực hành ngoại ngữ của bạn.','Mở trung tâm học tập','learning'],
['community-notification','Thông báo cộng đồng','Cộng đồng WORD BRIDGE','Bạn có cập nhật mới từ bạn bè, nhóm hoặc cộng đồng mà bạn tham gia.','Mở cộng đồng','community'],
['support-update','Cập nhật hỗ trợ','Yêu cầu hỗ trợ có phản hồi mới','Bộ phận chăm sóc khách hàng đã cập nhật yêu cầu hỗ trợ của bạn.','Theo dõi ticket','support'],
['system-announcement','Thông báo hệ thống','Thông báo từ WORD BRIDGE','Đây là thông báo chính thức về dịch vụ hoặc vận hành nền tảng.','Xem thông báo','system'],
['welcome','Chào mừng đến WORD BRIDGE','Chào mừng bạn đến với WORD BRIDGE','Bắt đầu bằng việc chọn ngôn ngữ đang học, thử một công cụ thực hành và thiết lập mục tiêu cá nhân.','Bắt đầu thực hành','account'],
['login-alert','Thông báo đăng nhập','Tài khoản vừa đăng nhập','Một phiên đăng nhập mới vừa được tạo. Hãy kiểm tra thời gian và thiết bị nếu bạn không nhận ra hoạt động này.','Quản lý phiên','security'],
['logout-alert','Đăng xuất thiết bị','Một phiên khác đã được đăng xuất','Một phiên đăng nhập khác của tài khoản đã bị thu hồi theo yêu cầu.','Kiểm tra phiên','security'],
['password-changed','Đổi mật khẩu thành công','Mật khẩu đã được thay đổi','Mật khẩu tài khoản đã được cập nhật. Nếu đây không phải thao tác của bạn, hãy liên hệ ngay CSKH.','Bảo vệ tài khoản','security'],
['email-changed','Đổi email tài khoản','Địa chỉ email đã thay đổi','Email đăng nhập của bạn đã được thay đổi sau bước xác minh.','Xem cài đặt','account'],
['phone-changed','Đổi số điện thoại','Số điện thoại đã thay đổi','Thông tin số điện thoại trong hồ sơ đã được cập nhật.','Xem hồ sơ','account'],
['account-locked','Tài khoản tạm khóa','Tài khoản cần được kiểm tra','Tài khoản đã bị tạm khóa theo quy trình bảo vệ an toàn. Liên hệ CSKH để được hướng dẫn.','Liên hệ CSKH','security'],
['account-restored','Khôi phục tài khoản','Tài khoản đã được khôi phục','Quyền truy cập tài khoản đã được khôi phục sau khi hoàn tất quy trình xác minh.','Đăng nhập','account'],
['payment-pending','Thanh toán chờ xác minh','Đã tiếp nhận thông tin thanh toán','Đơn hàng đang ở trạng thái chờ đối soát. Dịch vụ chưa được kích hoạt trước khi xác minh giao dịch.','Theo dõi đơn hàng','billing'],
['payment-refund','Thông báo hoàn tiền','Yêu cầu hoàn tiền đã được cập nhật','Trạng thái xử lý hoàn tiền được ghi nhận tại lịch sử giao dịch.','Xem trạng thái','billing'],
['order-created','Đơn hàng đã được tạo','Thông tin đơn hàng WORD BRIDGE','Đơn hàng đã được tạo và đang chờ thanh toán hoặc xác minh theo phương thức đã chọn.','Xem đơn hàng','billing'],
['subscription-expiring','Gói dịch vụ sắp hết hạn','Gói dịch vụ sắp đến ngày kết thúc','Hãy kiểm tra thời hạn và lựa chọn gia hạn nếu bạn muốn tiếp tục sử dụng quyền lợi.','Quản lý gói','billing'],
['subscription-expired','Gói dịch vụ đã hết hạn','Quyền lợi gói đã kết thúc','Tài khoản đã chuyển về quyền lợi tương ứng với gói hiện tại. Lịch sử thực hành được giữ nguyên.','Xem các gói','billing'],
['ticket-created','Tiếp nhận yêu cầu hỗ trợ','WORD BRIDGE đã nhận yêu cầu','Yêu cầu của bạn đã được ghi nhận với mã ticket. Hãy dùng mã này khi trao đổi về cùng một vấn đề.','Theo dõi yêu cầu','support'],
['ticket-resolved','Yêu cầu hỗ trợ đã giải quyết','Ticket đã được xử lý','Yêu cầu hỗ trợ đã được đánh dấu hoàn tất. Nếu vấn đề vẫn còn, bạn có thể mở lại theo hướng dẫn trong Trung tâm trợ giúp.','Xem ticket','support']
];
const esc = escapeHtml;
function codeBlock(v){return `<div style="font:700 28px/1.3 ui-monospace,monospace;letter-spacing:8px;text-align:center;color:#146466;background:#eef7f5;border:1px dashed #5aaba9;border-radius:12px;padding:18px">${esc(v.code||'')}</div>`;}
function contentFor(code,v){
  const custom={
    'verify-email':`${codeBlock(v)}<p style="color:#5d6b6b;text-align:center">Mã hết hạn sau ${esc(v.expires||'10 phút')}.</p>`,
    'login-otp':`${codeBlock(v)}<p style="color:#b13a2a">Không chia sẻ mã này. WORD BRIDGE không bao giờ yêu cầu bạn gửi mã qua tin nhắn.</p>`,
    'register-otp':`${codeBlock(v)}<p>Hoàn tất đăng ký để mở hồ sơ và lưu kết quả thực hành.</p>`,
    'reset-password':`${codeBlock(v)}<p style="color:#5d6b6b">Mã khôi phục chỉ dùng một lần và hết hạn sau ${esc(v.expires||'10 phút')}.</p>`,
    'payment-success':`<table role="presentation" style="width:100%;border-collapse:collapse"><tr><td style="padding:8px;border-bottom:1px solid #dce6e3">Mã giao dịch</td><th style="text-align:right">${esc(v.reference||'Đang cập nhật')}</th></tr><tr><td style="padding:8px">Số tiền</td><th style="text-align:right">${esc(v.amount||'')}</th></tr></table>`,
    'payment-pending':`<div style="padding:14px;background:#fff7e7;border-left:4px solid #d28a22">Đơn hàng chưa được coi là thanh toán thành công. Không chia sẻ ảnh biên lai công khai.</div>`,
    'ticket-created':`<div style="font-size:13px;color:#6c7b78">MÃ YÊU CẦU</div><div style="font-size:24px;font-weight:800;color:#146466">${esc(v.ticketCode||'')}</div>`,
    'ticket-resolved':`<div style="padding:12px 16px;border-radius:12px;background:#edf7f1;color:#176b4b">Trạng thái: Đã giải quyết</div>`
  };
  return custom[code] || `<p>${esc(v.message||'Thông tin chi tiết được lưu trong tài khoản WORD BRIDGE của bạn.')}</p>`;
}
export async function renderTemplate(env,code,vars={}){
  const spec=specs.find(x=>x[0]===code);if(!spec)throw new Error('Mẫu email không tồn tại.');
  if(!env?.ASSETS?.fetch)throw new Error('Không thể tải mẫu email HTML từ Assets binding.');
  const request=new Request(`https://wordbridge.io.vn/email-templates/${code}.html`);
  const response=await env.ASSETS.fetch(request);
  if(!response.ok)throw new Error(`Không tải được mẫu email ${code} (${response.status}).`);
  let html=await response.text();
  const [key,subject,heading,intro,cta]=spec;
  const defaultPath=code.includes('ticket')||code==='support-update'?'/ho-tro':code.startsWith('payment')||code==='invoice'||code==='order-created'?'/thanh-toan/lich-su':code==='verify-email'?'/dang-nhap':code==='reset-password'?'/quen-mat-khau':code==='subscription-expiring'||code==='subscription-expired'||code==='service-activated'?'/goi-dich-vu':code==='learning-notification'?'/hoc-tap':code==='community-notification'?'/cong-dong':'/';
  const baseOrigin=new URL(env.APP_ORIGIN||'https://wordbridge.io.vn').origin;
  let target;try{target=new URL(String(vars.url||defaultPath),baseOrigin);}catch{throw new Error('Đường dẫn CTA email không hợp lệ.');}
  if(target.origin!==baseOrigin||target.username||target.password)throw new Error('CTA email chỉ được trỏ về website WORD BRIDGE.');
  const values={PREHEADER:esc(subject),NAME:esc(vars.name||'bạn'),HEADING:esc(heading),INTRO:esc(vars.message||intro),CONTENT:contentFor(code,vars),CTA_URL:esc(target.href),CTA_LABEL:esc(cta)};
  for(const [token,value] of Object.entries(values)){html=html.replaceAll(`{{{${token}}}}`,value);html=html.replaceAll(`{{${token}}}`,value);}
  if(/\{\{+[A-Z_]+\}\}+/i.test(html))throw new Error(`Mẫu email ${code} còn placeholder chưa xử lý.`);
  return html;
}

export const EMAIL_TEMPLATES = Object.fromEntries(specs.map(([code,subject,heading,intro,cta,kind])=>[code,{code,subject,heading,intro,cta,kind}]));
export function listEmailTemplates(){return specs.map(([code,subject,heading,intro,cta,kind])=>({code,subject,heading,intro,cta,kind}));}
export async function queueTemplateEmail(env,recipient,code,vars={},dedupeKey=null,req=null){
  const s=EMAIL_TEMPLATES[code];if(!s)throw new Error(`Unknown email template: ${code}`);
  const body=await renderTemplate(env,code,vars);const id=uid();
  await env.DB.prepare(`INSERT OR IGNORE INTO email_queue(id,recipient,reply_to,template_code,subject,html_body,payload_json,dedupe_key,status) VALUES(?,?,?,?,?,?,?,?, 'queued')`)
    .bind(id,clean(recipient,254),code.includes('ticket')||code==='support-update'?'cskh@wordbridge.io.vn':null,code,s.subject,body,JSON.stringify(vars).slice(0,10000),dedupeKey).run();
  return id;
}
export async function sendQueuedEmail(env,limit=10){
  if(!env.EMAIL_API_KEY)return {sent:0,skipped:true,reason:'EMAIL_API_KEY chưa cấu hình'};
  const from=env.EMAIL_FROM||'WORD BRIDGE – Email tự động <noreply@wordbridge.io.vn>';
  const rows=await env.DB.prepare("SELECT id,recipient,reply_to,subject,html_body,attempts FROM email_queue WHERE status IN ('queued','retry') AND (next_attempt_at IS NULL OR next_attempt_at<=CURRENT_TIMESTAMP) ORDER BY created_at LIMIT ?").bind(limit).all();
  let sent=0;
  for(const r of rows.results){
    try{
      const resp=await fetch(env.EMAIL_API_URL||'https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${env.EMAIL_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({from,to:[r.recipient],reply_to:r.reply_to||undefined,subject:r.subject,html:r.html_body})});
      const out=await resp.json().catch(()=>({}));
      if(!resp.ok)throw new Error(out.message||`Email provider ${resp.status}`);
      await env.DB.batch([env.DB.prepare("UPDATE email_queue SET status='sent',sent_at=CURRENT_TIMESTAMP,provider_ref=?,last_error=NULL WHERE id=?").bind(out.id||null,r.id),env.DB.prepare('INSERT INTO email_logs(id,queue_id,recipient_hash,status,provider,provider_ref) VALUES(?,?,?,\'sent\',\'resend\',?)').bind(uid(),r.id,await sha256(r.recipient),out.id||null)]);sent++;
    }catch(e){
      const attempts=r.attempts+1,status=attempts>=5?'failed':'retry',delay=Math.min(3600,60*2**attempts);
      await env.DB.prepare('UPDATE email_queue SET status=?,attempts=?,next_attempt_at=datetime(\'now\',?),last_error=? WHERE id=?').bind(status,attempts,`+${delay} seconds`,clean(e.message,300),r.id).run();
      await env.DB.prepare('INSERT INTO email_logs(id,queue_id,recipient_hash,status,provider,error_code) VALUES(?,?,?,\'failed\',\'resend\',?)').bind(uid(),r.id,await sha256(r.recipient),String(e.message).slice(0,100)).run();
    }
  }
  return {sent,processed:rows.results.length};
}
export async function handleEmail(req,env,path,user){
  if(path==='/api/admin/email/templates'&&req.method==='GET')return json({templates:listEmailTemplates()});
  if(path==='/api/admin/email/preview'&&req.method==='POST'){
    const d=await readJson(req);if(!EMAIL_TEMPLATES[d.code])return fail('Không tìm thấy mẫu email.',404);
    return new Response(await renderTemplate(env,d.code,d.vars||{}),{headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store'}});
  }
  if(path==='/api/admin/email/test'&&req.method==='POST'){
    const d=await readJson(req);if(!EMAIL_TEMPLATES[d.code]||!/^\S+@\S+\.\S+$/.test(d.recipient||''))return fail('Mẫu hoặc email nhận thử không hợp lệ.');
    await queueTemplateEmail(env,d.recipient,d.code,d.vars||{},`test:${user.id}:${uid()}`,req);
    return json({ok:true,queued:true,providerConfigured:!!env.EMAIL_API_KEY});
  }
  if(path==='/api/admin/email/queue'&&req.method==='GET'){
    const rows=await env.DB.prepare('SELECT id,recipient,template_code,subject,status,attempts,next_attempt_at,created_at,sent_at,last_error FROM email_queue ORDER BY created_at DESC LIMIT 100').all();return json({items:rows.results,providerConfigured:!!env.EMAIL_API_KEY});
  }
  if(path==='/api/admin/email/retry'&&req.method==='POST'){
    const d=await readJson(req);const r=await env.DB.prepare("UPDATE email_queue SET status='queued',next_attempt_at=NULL,last_error=NULL WHERE id=? AND status IN ('failed','retry')").bind(clean(d.id,80)).run();return json({ok:r.meta.changes===1});
  }
  return null;
}
