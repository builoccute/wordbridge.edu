import {json,fail,readJson,clean,uid,audit,addNotification,sha256} from './core.js';
import {queueTemplateEmail} from './email.js';

export const PROVINCES_2025=[
['01','Thành phố Hà Nội','city'],['04','Tỉnh Cao Bằng','province'],['08','Tỉnh Tuyên Quang','province'],['11','Tỉnh Điện Biên','province'],['12','Tỉnh Lai Châu','province'],['14','Tỉnh Sơn La','province'],['15','Tỉnh Lào Cai','province'],['19','Tỉnh Thái Nguyên','province'],['20','Tỉnh Lạng Sơn','province'],['22','Tỉnh Quảng Ninh','province'],['24','Tỉnh Bắc Ninh','province'],['25','Tỉnh Phú Thọ','province'],['31','Thành phố Hải Phòng','city'],['33','Tỉnh Hưng Yên','province'],['37','Tỉnh Ninh Bình','province'],['38','Tỉnh Thanh Hóa','province'],['40','Tỉnh Nghệ An','province'],['42','Tỉnh Hà Tĩnh','province'],['44','Tỉnh Quảng Trị','province'],['46','Thành phố Huế','city'],['48','Thành phố Đà Nẵng','city'],['51','Tỉnh Quảng Ngãi','province'],['52','Tỉnh Gia Lai','province'],['56','Tỉnh Khánh Hòa','province'],['66','Tỉnh Đắk Lắk','province'],['68','Tỉnh Lâm Đồng','province'],['75','Tỉnh Đồng Nai','province'],['79','Thành phố Hồ Chí Minh','city'],['80','Tỉnh Tây Ninh','province'],['82','Tỉnh Đồng Tháp','province'],['86','Tỉnh Vĩnh Long','province'],['91','Tỉnh An Giang','province'],['92','Thành phố Cần Thơ','city'],['96','Tỉnh Cà Mau','province']
].map(([code,name,type])=>({code,name,type,valid_from:'2025-07-01'}));
const fields=['name','shortName','unitType','logoFileId','fields','foundedAt','website','email','phone','socials','introduction','history','mission','vision','activities','memberScale','scope','address','hasSponsor','sponsor','representative'];
function validateApplication(d){
  const o=d.organization||{},r=d.representative||{};
  const type=d.legalType;
  if(!['non_legal','legal_entity'].includes(type))return 'Vui lòng chọn đúng loại hình tổ chức.';
  if(clean(o.name,160).length<2)return 'Tên tổ chức không được để trống.';
  if(!o.logoFileId)return 'Logo tổ chức là trường bắt buộc.';
  if(!Array.isArray(o.socials)||!o.socials.some(x=>/^https:\/\//i.test(x.url||'')))return 'Cần ít nhất một đường dẫn mạng xã hội hợp lệ.';
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(o.email||''))return 'Email tổ chức không hợp lệ.';
  if(!r.name||!r.email||!r.phone||!r.position)return 'Vui lòng nhập đầy đủ thông tin người đại diện.';
  if(!o.address?.provinceCode||!o.address?.communeCode||!o.address?.detail)return 'Cần địa chỉ cấp tỉnh, xã/phường và địa chỉ chi tiết.';
  if(type==='non_legal'&&o.hasSponsor&&!o.sponsor?.name)return 'Vui lòng khai báo thông tin đơn vị bảo trợ pháp lý.';
  if(!d.signature||!['digital','uploaded','drawn'].includes(d.signature.type))return 'Hồ sơ tổ chức cần có phương thức chữ ký xác nhận.';
  return null;
}
export async function syncAddressDirectory(env){
  const endpoint=env.ADDRESS_DATA_URL||'https://api.openadmindata.org/api/v1/vn/ward.json';
  const started=Date.now();
  try{
    const res=await fetch(endpoint,{headers:{Accept:'application/json'},cf:{cacheTtl:3600,cacheEverything:true}});
    if(!res.ok)throw new Error(`Nguồn dữ liệu trả HTTP ${res.status}`);
    const payload=await res.json();
    const rows=Array.isArray(payload)?payload:(payload.data?.ward||payload.data?.wards||payload.wards||payload.data||[]);
    if(!Array.isArray(rows)||rows.length!==3321)throw new Error(`Số bản ghi không hợp lệ: ${Array.isArray(rows)?rows.length:'không phải danh sách'} (cần 3.321)`);
    const mapped=rows.map(x=>{
      const code=String(x.id??x.code??'').trim().padStart(2,'0');
      const province=String(x.parent_id??x.parent?.id??x.parent_code??'').trim().padStart(2,'0');
      const name=clean(x.name_local??x.name?.local??x.name??'',160);
      const unitType=/^phường\s/i.test(name)?'ward':/^đặc khu\s/i.test(name)?'special_zone':'commune';
      return {code,province,name,unitType};
    });
    if(mapped.some(x=>!/^\d{2,10}$/.test(x.code)||!/^\d{2}$/.test(x.province)||!x.name))throw new Error('Có bản ghi thiếu mã hoặc tên đơn vị.');
    const parentSet=new Set(mapped.map(x=>x.province));
    if(parentSet.size!==34)throw new Error(`Dữ liệu chỉ có ${parentSet.size} tỉnh/thành liên kết.`);
    const known=new Set(PROVINCES_2025.map(x=>x.code));
    if([...parentSet].some(x=>!known.has(x)))throw new Error('Có mã tỉnh/thành không khớp danh mục 34 đơn vị đã chốt.');
    const statements=mapped.map(x=>env.DB.prepare(`INSERT INTO address_units(code,province_code,name,unit_type,active,source_name) VALUES(?,?,?,?,1,'Open Admin Data CC BY 4.0') ON CONFLICT(code) DO UPDATE SET province_code=excluded.province_code,name=excluded.name,unit_type=excluded.unit_type,active=1,source_name=excluded.source_name`).bind(x.code,x.province,x.name,x.unitType));
    for(let i=0;i<statements.length;i+=100)await env.DB.batch(statements.slice(i,i+100));
    await env.DB.prepare("INSERT INTO system_integrations(integration_key,status,public_config_json,last_checked_at) VALUES('address_directory','connected',?,CURRENT_TIMESTAMP) ON CONFLICT(integration_key) DO UPDATE SET status='connected',public_config_json=excluded.public_config_json,last_checked_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP")
      .bind(JSON.stringify({endpoint,rows:mapped.length,provinces:parentSet.size,license:'CC BY 4.0',durationMs:Date.now()-started})).run();
    return {ok:true,rows:mapped.length,provinces:parentSet.size};
  }catch(e){
    await env.DB.prepare("INSERT INTO system_integrations(integration_key,status,public_config_json,last_checked_at) VALUES('address_directory','error',?,CURRENT_TIMESTAMP) ON CONFLICT(integration_key) DO UPDATE SET status='error',public_config_json=excluded.public_config_json,last_checked_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP")
      .bind(JSON.stringify({endpoint,error:clean(e.message,300)})).run().catch(()=>{});
    return {ok:false,error:clean(e.message,300)};
  }
}
export async function handleOrganizations(req,env,path,url,user){
  const orgAdmin=['super_admin','admin','org_admin'].includes(user?.role);
  if(path==='/api/admin/organizations/applications'&&req.method==='GET'&&orgAdmin){
    const rows=await env.DB.prepare(`SELECT a.id,a.status,a.review_note,a.created_at,o.id org_id,o.name,o.short_name,o.org_type,o.status org_status,u.full_name applicant_name,u.email applicant_email
      FROM organization_applications a JOIN organizations o ON o.id=a.org_id JOIN users u ON u.id=a.applicant_id
      ORDER BY CASE WHEN a.status='pending' THEN 0 ELSE 1 END,a.created_at DESC LIMIT 100`).all();
    return json({applications:rows.results});
  }
  const review=path.match(/^\/api\/admin\/organizations\/applications\/([\w-]+)\/review$/);
  if(review&&req.method==='POST'&&orgAdmin){
    const d=await readJson(req),status=['approved','needs_info','rejected','suspended'].includes(d.status)?d.status:'';
    if(!status)return fail('Trạng thái xét duyệt không hợp lệ.');
    const app=await env.DB.prepare('SELECT id,org_id,applicant_id,application_json,signature_json FROM organization_applications WHERE id=?').bind(review[1]).first();
    if(!app)return fail('Không tìm thấy hồ sơ tổ chức.',404);
    if(status==='approved'){
      let payload={};try{payload=JSON.parse(app.application_json||'{}')}catch{return fail('Dữ liệu hồ sơ không hợp lệ; chưa thể phê duyệt.',409);}
      const fileIds=[payload.organization?.logoFileId,payload.signature?.fileId].filter(Boolean);
      if(payload.signature?.type==='digital'&&payload.signature?.verified!==true)return fail('Chữ ký số chưa được nhà cung cấp xác minh. Không thể phê duyệt hồ sơ.',409);
      if(fileIds.length){
        const placeholders=fileIds.map(()=>'?').join(',');
        const scanned=await env.DB.prepare(`SELECT id,scan_status FROM file_objects WHERE id IN (${placeholders})`).bind(...fileIds).all();
        if(scanned.results.length!==new Set(fileIds).size||scanned.results.some(f=>f.scan_status!=='clean'))return fail('Logo hoặc chữ ký vẫn đang chờ quét/không vượt qua kiểm tra an toàn. Chưa thể phê duyệt.',409);
      }
    }
    const note=clean(d.note,1000);
    const orgStatus=status==='approved'?'approved':status==='rejected'?'rejected':status==='suspended'?'suspended':'pending';
    await env.DB.batch([
      env.DB.prepare('UPDATE organization_applications SET status=?,reviewer_id=?,review_note=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').bind(status,user.id,note,app.id),
      env.DB.prepare('UPDATE organizations SET status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').bind(orgStatus,app.org_id),
      env.DB.prepare("UPDATE organization_members SET status=? WHERE org_id=? AND role='owner'").bind(status==='approved'?'active':'pending',app.org_id)
    ]);
    const notice=status==='approved'?'Hồ sơ tổ chức đã được phê duyệt. Không gian tổ chức đã được kích hoạt.':status==='needs_info'?'Hồ sơ tổ chức cần bổ sung thông tin.':status==='suspended'?'Không gian tổ chức đang tạm đình chỉ.':'Hồ sơ tổ chức chưa được chấp thuận.';
    await addNotification(env,app.applicant_id,'organization','Cập nhật hồ sơ tổ chức',`${notice}${note?' Lý do: '+note:''}`,'/khong-gian-cua-toi');
    const recipient=await env.DB.prepare('SELECT email,full_name FROM users WHERE id=?').bind(app.applicant_id).first();
    if(recipient?.email)try{await queueTemplateEmail(env,recipient.email,'system-announcement',{name:recipient.full_name,message:`${notice}${note?' Lý do: '+note:''}`},`organization-review:${app.id}:${status}`,req);}catch{}
    await audit(env,user,'organization.application.review','organization_application',app.id,{status,note},req);
    return json({ok:true,status,organizationStatus:orgStatus});
  }
  if(path==='/api/reference/provinces'&&req.method==='GET')return json({version:'QĐ 19/2025/QĐ-TTg',effectiveDate:'2025-07-01',provinces:PROVINCES_2025});
  if(path==='/api/reference/communes'&&req.method==='GET'){
    const p=clean(url.searchParams.get('province')||'',5);if(!PROVINCES_2025.some(x=>x.code===p))return fail('Mã tỉnh/thành không hợp lệ.');
    let rows=await env.DB.prepare("SELECT code,name,unit_type FROM address_units WHERE province_code=? AND active=1 ORDER BY name").bind(p).all().catch(()=>({results:[]}));
    if(!rows.results.length&&env.ADDRESS_DATA_SYNC_ON_DEMAND!=='false'){const synced=await syncAddressDirectory(env);if(synced.ok)rows=await env.DB.prepare("SELECT code,name,unit_type FROM address_units WHERE province_code=? AND active=1 ORDER BY name").bind(p).all();}
    return json({province:p,communes:rows.results,loaded:rows.results.length>0,source:'Open Admin Data CC BY 4.0; đối chiếu danh mục tỉnh theo QĐ 19/2025/QĐ-TTg'});
  }
  if(path==='/api/organizations/applications'&&req.method==='POST'){
    const d=await readJson(req,1_500_000),error=validateApplication(d);if(error)return fail(error,422);
    const file=await env.DB.prepare('SELECT id,owner_id,scan_status FROM file_objects WHERE id=?').bind(clean(d.organization.logoFileId,80)).first();if(!file||file.owner_id!==user.id)return fail('Logo chưa được tải lên bởi tài khoản này.',422);
    const sig=d.signature;if(['uploaded','drawn'].includes(sig.type)&&(!sig.fileId||!(await env.DB.prepare('SELECT id FROM file_objects WHERE id=? AND owner_id=?').bind(clean(sig.fileId,80),user.id).first())))return fail('Không tìm thấy tệp chữ ký.',422);
    const id=uid(),orgId=uid(),payload={...d,organization:{...d.organization,logoFileId:file.id},signature:{type:sig.type,verified:false,fileId:sig.fileId||null,signatureProvider:sig.type==='digital'?'not_configured':null,submittedAt:new Date().toISOString()}};
    const isEntity=d.legalType==='legal_entity';
    const lookup=clean(d.organization.registrationNumber,32);
    if(isEntity&&!lookup)return fail('Tổ chức có tư cách pháp nhân cần mã số tổ chức/doanh nghiệp.',422);
    if(isEntity&&!env.REGISTRY_API_URL){payload.registryLookup={status:'not_connected',registrationNumber:lookup,note:'Chưa cấu hình kết nối nguồn tra cứu pháp nhân; hồ sơ được chờ kiểm tra thủ công.'};}
    else if(isEntity){
      try{const res=await fetch(`${env.REGISTRY_API_URL}?code=${encodeURIComponent(lookup)}`,{headers:env.REGISTRY_API_KEY?{Authorization:`Bearer ${env.REGISTRY_API_KEY}`}:{}});payload.registryLookup={status:res.ok?'response_received':'lookup_failed',httpStatus:res.status,data:res.ok?await res.json():null};}
      catch{payload.registryLookup={status:'lookup_failed'};}
    }
    await env.DB.batch([
      env.DB.prepare('INSERT INTO organizations(id,owner_id,name,short_name,org_type,legal_status,profile_json) VALUES(?,?,?,?,?,?,?)').bind(orgId,user.id,clean(d.organization.name,160),clean(d.organization.shortName,40),clean(d.organization.unitType,40),isEntity?'legal_entity':'non_legal',JSON.stringify(payload.organization)),
      env.DB.prepare('INSERT INTO organization_applications(id,org_id,applicant_id,application_json,signature_json,status) VALUES(?,?,?,?,?,?)').bind(id,orgId,user.id,JSON.stringify(payload),JSON.stringify(payload.signature),'pending'),
      env.DB.prepare("INSERT INTO organization_members(org_id,user_id,role,status) VALUES(?,?,'owner','pending')").bind(orgId,user.id)
    ]);
    await audit(env,user,'organization.application.submit','organization_application',id,{legalType:d.legalType},req);
    return json({ok:true,id,orgId,status:'pending',registryStatus:payload.registryLookup?.status||'not_applicable',message:'Hồ sơ đã được tiếp nhận, chưa được phê duyệt pháp lý.'},201);
  }
  if(path==='/api/organizations/mine'&&req.method==='GET'){
    const rows=await env.DB.prepare(`SELECT o.id,o.name,o.short_name,o.org_type,o.status,o.member_limit,om.role,oa.id application_id,oa.status application_status,oa.review_note
      FROM organization_members om JOIN organizations o ON o.id=om.org_id LEFT JOIN organization_applications oa ON oa.org_id=o.id
      WHERE om.user_id=? ORDER BY o.created_at DESC`).bind(user.id).all();return json({organizations:rows.results});
  }
  if(path==='/api/organizations/invites'&&req.method==='POST'){
    const d=await readJson(req),orgId=clean(d.orgId,80),email=clean(d.email,254).toLowerCase();if(!/^\S+@\S+\.\S+$/.test(email))return fail('Email thành viên không hợp lệ.');
    const owner=await env.DB.prepare("SELECT om.role,o.member_limit,o.status,(SELECT COUNT(*) FROM organization_members x WHERE x.org_id=o.id AND x.status='active') member_count FROM organization_members om JOIN organizations o ON o.id=om.org_id WHERE om.org_id=? AND om.user_id=? AND om.role IN ('owner','admin') AND o.status='approved'").bind(orgId,user.id).first();
    if(!owner)return fail('Bạn không có quyền quản lý tổ chức này.',403);if(owner.member_count>=owner.member_limit)return fail('Tổ chức đã đạt giới hạn thành viên.');
    const id=uid(),token=crypto.randomUUID()+crypto.randomUUID();await env.DB.prepare('INSERT INTO organization_invites(id,org_id,email,role,token_hash,expires_at,created_by) VALUES(?,?,?,?,?,?,?)').bind(id,orgId,email,['member','manager'].includes(d.role)?d.role:'member',await sha256(token),new Date(Date.now()+7*86400000).toISOString(),user.id).run();
    return json({ok:true,id,inviteToken:token,delivery:'Chưa cấu hình kênh gửi lời mời; chỉ hiển thị token một lần cho người tạo.'},201);
  }
  if(path==='/api/organizations/invites/accept'&&req.method==='POST'){
    const d=await readJson(req),token=clean(d.token,120),hash=await sha256(token),row=await env.DB.prepare("SELECT id,org_id,email,role FROM organization_invites WHERE token_hash=? AND status='pending' AND expires_at>CURRENT_TIMESTAMP").bind(hash).first();if(!row)return fail('Lời mời không tồn tại hoặc đã hết hạn.',404);
    if(row.email.toLowerCase()!==user.email.toLowerCase())return fail('Email tài khoản không trùng với email được mời.',403);
    await env.DB.batch([env.DB.prepare('INSERT OR IGNORE INTO organization_members(org_id,user_id,role) VALUES(?,?,?)').bind(row.org_id,user.id,row.role),env.DB.prepare("UPDATE organization_invites SET status='accepted' WHERE id=?").bind(row.id)]);return json({ok:true,orgId:row.org_id});
  }
  const org=path.match(/^\/api\/organizations\/([\w-]+)\/(members|profile)$/);
  if(org&&org[2]==='members'&&req.method==='GET'){
    const m=await env.DB.prepare('SELECT role FROM organization_members WHERE org_id=? AND user_id=? AND status=\'active\'').bind(org[1],user.id).first();if(!m)return fail('Bạn không có quyền xem tổ chức này.',403);
    const rows=await env.DB.prepare('SELECT u.id,u.full_name,u.email,om.role,om.status,om.created_at FROM organization_members om JOIN users u ON u.id=om.user_id WHERE om.org_id=? ORDER BY om.created_at').bind(org[1]).all();return json({members:rows.results});
  }
  if(org&&org[2]==='profile'&&req.method==='GET'){
    const r=await env.DB.prepare('SELECT o.id,o.name,o.short_name,o.org_type,o.status,o.profile_json,om.role FROM organizations o JOIN organization_members om ON om.org_id=o.id WHERE o.id=? AND om.user_id=?').bind(org[1],user.id).first();if(!r)return fail('Không tìm thấy tổ chức.',404);return json({organization:{...r,profile:JSON.parse(r.profile_json||'{}')}});
  }
  return null;
}
