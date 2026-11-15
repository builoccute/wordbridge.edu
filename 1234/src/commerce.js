import {json,fail,readJson,clean,uid,audit,addNotification,sha256} from './core.js';
import {constantTimeEqual} from './core.js';

const PLANS=['personal_free','personal_plus_month','personal_plus_year','org_plus_month','org_plus_year'];
const canManageFinance=u=>['super_admin','admin','finance_admin'].includes(u?.role);
export async function handleCommerce(req,env,path,url,user){
  if(path==='/api/plans'&&req.method==='GET'){
    const rows=await env.DB.prepare('SELECT code,name_vi,amount_vnd,billing_period,member_limit,features_json FROM plans WHERE enabled=1 ORDER BY sort_order').all();return json({plans:rows.results.map(x=>({...x,features:JSON.parse(x.features_json||'[]')}))});
  }
  if(path==='/api/subscriptions'&&req.method==='GET'){
    const rows=await env.DB.prepare(`SELECT s.id,s.plan_code,s.status,s.starts_at,s.ends_at,s.auto_renew,p.name_vi,p.amount_vnd,p.billing_period
      FROM subscriptions s JOIN plans p ON p.code=s.plan_code WHERE s.user_id=? ORDER BY s.created_at DESC LIMIT 50`).bind(user.id).all();return json({subscriptions:rows.results});
  }
  if(path==='/api/checkout/orders'&&req.method==='POST'){
    const d=await readJson(req),plan=clean(d.planCode,40);if(!PLANS.includes(plan)||plan==='personal_free')return fail('Gói dịch vụ không hợp lệ.');
    const p=await env.DB.prepare('SELECT code,name_vi,amount_vnd,billing_period,member_limit FROM plans WHERE code=? AND enabled=1').bind(plan).first();if(!p)return fail('Gói dịch vụ hiện không khả dụng.',404);
    const code=`WB${Date.now().toString(36).toUpperCase()}${crypto.getRandomValues(new Uint32Array(1))[0].toString(36).toUpperCase().slice(0,5)}`;
    const id=uid(),transfer=`WORD BRIDGE ${code}`,expires=new Date(Date.now()+24*3600000).toISOString();
    await env.DB.prepare('INSERT INTO payment_orders(id,user_id,order_code,plan_code,amount_vnd,transfer_content,expires_at) VALUES(?,?,?,?,?,?,?)').bind(id,user.id,code,plan,p.amount_vnd,transfer,expires).run();
    const qrReady=!!(env.BANK_BIN&&env.BANK_ACCOUNT&&env.BANK_ACCOUNT_NAME);
    let qrUrl=null;if(qrReady){const params=new URLSearchParams({amount:String(p.amount_vnd),addInfo:transfer,accountName:env.BANK_ACCOUNT_NAME});qrUrl=`https://img.vietqr.io/image/${encodeURIComponent(env.BANK_BIN)}-${encodeURIComponent(env.BANK_ACCOUNT)}-compact2.png?${params}`;}
    return json({ok:true,order:{id,orderCode:code,plan:p,amountVnd:p.amount_vnd,transferContent:transfer,expiresAt:expires,status:'pending',qrUrl,bankConfigured:qrReady},message:qrReady?'Đơn hàng đang chờ xác minh giao dịch.':'Thông tin ngân hàng chưa cấu hình; đơn đã tạo nhưng chưa thể thanh toán.'},201);
  }
  if(path==='/api/payments/webhook'&&req.method==='POST'){
    if(!env.PAYMENT_WEBHOOK_SECRET)return fail('Webhook thanh toán chưa được cấu hình.',503);
    const raw=await req.text(),sig=req.headers.get('X-WB-Signature')||'';const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(env.PAYMENT_WEBHOOK_SECRET),{name:'HMAC',hash:'SHA-256'},false,['sign']);const digest=await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(raw));const expected=[...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('');
    if(!constantTimeEqual(sig,expected))return fail('Chữ ký webhook không hợp lệ.',401);
    let d;try{d=JSON.parse(raw)}catch{return fail('Webhook payload không hợp lệ.');}
    const order=await env.DB.prepare("SELECT id,user_id,plan_code,amount_vnd,status FROM payment_orders WHERE order_code=?").bind(clean(d.orderCode,100)).first();
    if(!order||order.status!=='pending')return json({ok:true,ignored:true});
    if(Number(d.amountVnd)!==order.amount_vnd)return fail('Số tiền giao dịch không khớp.',409);
    await confirmPayment(env,order,{provider:clean(d.provider,40)||'webhook',providerRef:clean(d.transactionId,120),payload:d},null);
    return json({ok:true});
  }
  if(path==='/api/payments/orders'&&req.method==='GET'){
    const rows=await env.DB.prepare('SELECT id,order_code,plan_code,amount_vnd,transfer_content,status,expires_at,created_at,paid_at FROM payment_orders WHERE user_id=? ORDER BY created_at DESC LIMIT 100').bind(user.id).all();return json({orders:rows.results});
  }
  if(path==='/api/refunds'&&req.method==='POST'){
    const d=await readJson(req),order=await env.DB.prepare("SELECT id,amount_vnd,status FROM payment_orders WHERE id=? AND user_id=? AND status='paid'").bind(clean(d.orderId,80),user.id).first();if(!order)return fail('Không tìm thấy đơn hàng đủ điều kiện gửi yêu cầu.',404);
    const id=uid();await env.DB.prepare('INSERT INTO refunds(id,order_id,amount_vnd,reason,requested_by) VALUES(?,?,?,?,?)').bind(id,order.id,order.amount_vnd,clean(d.reason,1000),user.id).run();return json({ok:true,id,status:'requested'},201);
  }
  if(path==='/api/aid/applications'&&req.method==='POST'){
    const d=await readJson(req),program=clean(d.program,40);if(!['student_plus','community_access','hardship','nonprofit_discount'].includes(program))return fail('Chương trình hỗ trợ không hợp lệ.');
    if(program==='student_plus'&&!/^[^\s@]+@[^\s@]+\.(edu|edu\.vn|ac\.uk|edu\.us)$/i.test(user.email))return fail('Chương trình sinh viên chỉ xác minh bằng email sinh viên do trường cấp.');
    const id=uid();await env.DB.prepare('INSERT INTO aid_applications(id,user_id,program,details_json) VALUES(?,?,?,?)').bind(id,user.id,program,JSON.stringify({details:clean(d.details,2000),studentEmail:program==='student_plus'?user.email:null})).run();return json({ok:true,id,status:'pending'},201);
  }
  if(path==='/api/admin/payments/verify'&&req.method==='POST'){
    if(!canManageFinance(user))return fail('Bạn không có quyền đối soát giao dịch.',403);
    const d=await readJson(req),order=await env.DB.prepare("SELECT id,user_id,plan_code,amount_vnd,status FROM payment_orders WHERE id=?").bind(clean(d.orderId,80)).first();if(!order)return fail('Không tìm thấy đơn hàng.',404);if(order.status!=='pending')return fail('Đơn hàng đã được xử lý.',409);if(Number(d.amountVnd)!==order.amount_vnd)return fail('Số tiền đối soát không khớp.',409);
    await confirmPayment(env,order,{provider:'manual_admin',providerRef:clean(d.reference,120),payload:{note:clean(d.note,500)}},user);
    await audit(env,user,'payment.verify.manual','payment_order',order.id,{amountVnd:order.amount_vnd},req);return json({ok:true});
  }
  if(path==='/api/admin/refunds'&&req.method==='GET'){
    if(!canManageFinance(user))return fail('Bạn không có quyền xem yêu cầu hoàn tiền.',403);
    const rows=await env.DB.prepare('SELECT r.id,r.amount_vnd,r.reason,r.status,r.created_at,o.order_code,u.email FROM refunds r JOIN payment_orders o ON o.id=r.order_id JOIN users u ON u.id=r.requested_by ORDER BY r.created_at DESC LIMIT 100').all();return json({refunds:rows.results});
  }
  if(path==='/api/admin/refunds/review'&&req.method==='POST'){
    if(!canManageFinance(user))return fail('Bạn không có quyền duyệt hoàn tiền.',403);
    const d=await readJson(req),status=['approved','rejected'].includes(d.status)?d.status:null;if(!status)return fail('Trạng thái hoàn tiền không hợp lệ.');
    const r=await env.DB.prepare("UPDATE refunds SET status=?,reviewed_by=?,reviewed_at=CURRENT_TIMESTAMP WHERE id=? AND status='requested'").bind(status,user.id,clean(d.id,80)).run();return json({ok:r.meta.changes===1});
  }
  return null;
}
async function confirmPayment(env,order,info,admin){
  const duplicate=info.providerRef?await env.DB.prepare('SELECT id FROM payment_transactions WHERE provider_ref=?').bind(info.providerRef).first():null;if(duplicate)return;
  await env.DB.batch([
    env.DB.prepare("INSERT INTO payment_transactions(id,order_id,provider,provider_ref,amount_vnd,payload_json,status,verified_by,verified_at) VALUES(?,?,?,?,?,?,'verified',?,CURRENT_TIMESTAMP)").bind(uid(),order.id,info.provider,info.providerRef||null,order.amount_vnd,JSON.stringify(info.payload||{}),admin?.id||null),
    env.DB.prepare("UPDATE payment_orders SET status='paid',paid_at=CURRENT_TIMESTAMP WHERE id=? AND status='pending'").bind(order.id)
  ]);
  const plan=await env.DB.prepare('SELECT billing_period FROM plans WHERE code=?').bind(order.plan_code).first();const now=Date.now(),end=new Date(now+(plan?.billing_period==='year'?365:30)*86400000).toISOString();
  await env.DB.prepare("INSERT INTO subscriptions(id,user_id,plan_code,status,starts_at,ends_at) VALUES(?,?,?,'active',?,?)").bind(uid(),order.user_id,order.plan_code,new Date(now).toISOString(),end).run();
  await env.DB.prepare('UPDATE users SET plan=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').bind(order.plan_code,order.user_id).run();
  await addNotification(env,order.user_id,'billing','Thanh toán đã được xác nhận','Đơn hàng của bạn đã được đối soát và dịch vụ được kích hoạt.','/thanh-toan/lich-su');
}
