import {json,fail,readJson,clean,uid,audit,addNotification} from './core.js';

const eventTypes=new Set(['visibility_hidden','focus_return','fullscreen_exit','copy_attempt','cut_attempt','paste_attempt','context_menu','window_blur','window_resize','network_offline','network_online','network_reconnected','camera_permission_denied','microphone_permission_denied','multiple_session_detected']);
const examManager=u=>['super_admin','admin','exam_admin'].includes(u.role);
function norm(v){return String(v??'').normalize('NFKC').trim().toLocaleLowerCase().replace(/[\s\p{P}\p{S}]+/gu,' ').trim();}
function compare(given,expected){if(Array.isArray(expected)){const a=(Array.isArray(given)?given:[given]).map(norm).sort();return JSON.stringify(a)===JSON.stringify(expected.map(norm).sort());}return norm(given)===norm(expected);}
async function getExam(env,id){return env.DB.prepare("SELECT id,title,description,language_code,starts_at,ends_at,duration_minutes,status,settings_json FROM exams WHERE id=?").bind(id).first();}
export async function handleExams(req,env,path,url,user){
  if(path==='/api/exams'&&req.method==='GET'){
    const rows=await env.DB.prepare("SELECT id,title,description,language_code,starts_at,ends_at,duration_minutes,status FROM exams WHERE status='published' AND (ends_at IS NULL OR ends_at>CURRENT_TIMESTAMP) ORDER BY starts_at LIMIT 100").all();return json({exams:rows.results});
  }
  const detail=path.match(/^\/api\/exams\/([\w-]+)$/);
  if(detail&&req.method==='GET'){
    const exam=await getExam(env,detail[1]);if(!exam||exam.status!=='published')return fail('Không tìm thấy kỳ thi.',404);
    const rows=await env.DB.prepare(`SELECT q.id,q.question_type,q.prompt,q.options_json,eq.points,q.topic,q.difficulty
      FROM exam_questions eq JOIN question_bank q ON q.id=eq.question_id WHERE eq.exam_id=? ORDER BY eq.sort_order`).bind(exam.id).all();
    return json({exam:{...exam,settings:JSON.parse(exam.settings_json||'{}'),questions:rows.results.map(q=>({...q,options:JSON.parse(q.options_json||'[]')}))}});
  }
  if(path==='/api/exams/start'&&req.method==='POST'){
    const d=await readJson(req),exam=await getExam(env,clean(d.examId,80));if(!exam||exam.status!=='published')return fail('Kỳ thi không tồn tại hoặc chưa mở.',404);
    if(exam.starts_at&&Date.parse(exam.starts_at)>Date.now())return fail('Kỳ thi chưa đến giờ bắt đầu.',409);
    if(exam.ends_at&&Date.parse(exam.ends_at)<Date.now())return fail('Kỳ thi đã kết thúc.',409);
    const existing=await env.DB.prepare("SELECT id,expires_at,status FROM exam_attempts WHERE exam_id=? AND user_id=? AND status='in_progress' ORDER BY started_at DESC LIMIT 1").bind(exam.id,user.id).first();if(existing)return json({ok:true,attemptId:existing.id,expiresAt:existing.expires_at,resumed:true});
    const count=await env.DB.prepare('SELECT COUNT(*) n FROM exam_attempts WHERE exam_id=? AND user_id=?').bind(exam.id,user.id).first();const settings=JSON.parse(exam.settings_json||'{}');if(count.n>=Number(settings.maxAttempts||1))return fail('Bạn đã sử dụng hết số lượt dự thi.',409);
    const qs=await env.DB.prepare('SELECT q.id,q.version,eq.points FROM exam_questions eq JOIN question_bank q ON q.id=eq.question_id WHERE eq.exam_id=? ORDER BY eq.sort_order').bind(exam.id).all();if(!qs.results.length)return fail('Kỳ thi chưa được cấu hình câu hỏi.',422);
    const shuffled=[...qs.results];if(settings.shuffleQuestions)shuffled.sort(()=>Math.random()-.5);
    const duration=Math.max(1,Math.min(600,exam.duration_minutes))*60000,expires=new Date(Math.min(Date.now()+duration,exam.ends_at?Date.parse(exam.ends_at):Infinity)).toISOString(),attemptId=uid();
    await env.DB.prepare('INSERT INTO exam_attempts(id,exam_id,user_id,started_at,expires_at,version_snapshot_json,max_score) VALUES(?,?,?,CURRENT_TIMESTAMP,?,?,?)').bind(attemptId,exam.id,user.id,expires,JSON.stringify(shuffled),shuffled.reduce((n,q)=>n+Number(q.points||0),0)).run();
    await audit(env,user,'exam.attempt.start','exam_attempt',attemptId,{examId:exam.id},req);return json({ok:true,attemptId,expiresAt:expires,resumed:false},201);
  }
  const saved=path.match(/^\/api\/exams\/attempts\/([\w-]+)\/answers$/);
  if(saved&&req.method==='GET'){
    const attempt=await env.DB.prepare("SELECT id,exam_id,expires_at,status FROM exam_attempts WHERE id=? AND user_id=?").bind(saved[1],user.id).first();
    if(!attempt)return fail('Không tìm thấy phiên thi.',404);
    if(attempt.status!=='in_progress')return fail('Phiên thi đã kết thúc.',409);
    const rows=await env.DB.prepare('SELECT question_id,answer_json,saved_at FROM exam_answers WHERE attempt_id=?').bind(attempt.id).all();
    return json({answers:Object.fromEntries(rows.results.map(x=>[x.question_id,JSON.parse(x.answer_json)])),serverTime:new Date().toISOString(),expiresAt:attempt.expires_at});
  }
  const save=path.match(/^\/api\/exams\/attempts\/([\w-]+)\/answers$/);
  if(save&&req.method==='PUT'){
    const d=await readJson(req),attempt=await env.DB.prepare("SELECT id,exam_id,expires_at,status FROM exam_attempts WHERE id=? AND user_id=?").bind(save[1],user.id).first();if(!attempt)return fail('Không tìm thấy phiên thi.',404);if(attempt.status!=='in_progress')return fail('Phiên thi đã kết thúc.',409);if(Date.parse(attempt.expires_at)<=Date.now())return fail('Đã hết thời gian làm bài. Hãy nộp bài để chốt kết quả.',409);
    const linked=await env.DB.prepare('SELECT q.id FROM exam_questions e JOIN question_bank q ON q.id=e.question_id WHERE e.exam_id=?').bind(attempt.exam_id).all(),allowed=new Set(linked.results.map(q=>q.id));const answers=d.answers&&typeof d.answers==='object'?d.answers:{};
    const statements=[];for(const [qid,val] of Object.entries(answers)){if(!allowed.has(qid))continue;statements.push(env.DB.prepare(`INSERT INTO exam_answers(id,attempt_id,question_id,answer_json) VALUES(?,?,?,?) ON CONFLICT(attempt_id,question_id) DO UPDATE SET answer_json=excluded.answer_json,saved_at=CURRENT_TIMESTAMP`).bind(uid(),attempt.id,qid,JSON.stringify(val).slice(0,4000)));}
    if(statements.length)await env.DB.batch(statements);return json({ok:true,saved:statements.length,serverTime:new Date().toISOString(),expiresAt:attempt.expires_at});
  }
  if(path==='/api/exams/submit'&&req.method==='POST'){
    const d=await readJson(req),attempt=await env.DB.prepare("SELECT id,exam_id,expires_at,status FROM exam_attempts WHERE id=? AND user_id=?").bind(clean(d.attemptId,80),user.id).first();if(!attempt)return fail('Không tìm thấy phiên thi.',404);if(attempt.status!=='in_progress')return fail('Bài thi đã được nộp trước đó.',409);
    const expired=Date.parse(attempt.expires_at)<=Date.now();
    const qs=await env.DB.prepare('SELECT q.id,q.answer_json,q.question_type,eq.points FROM exam_questions eq JOIN question_bank q ON q.id=eq.question_id WHERE eq.exam_id=?').bind(attempt.exam_id).all();
    const allowed=new Set(qs.results.map(q=>q.id));
    // Accept a final payload only before the server-side deadline, and only for questions on this exam.
    if(!expired&&d.answers&&typeof d.answers==='object'){
      const statements=[];
      for(const [qid,val] of Object.entries(d.answers))if(allowed.has(qid))statements.push(env.DB.prepare('INSERT INTO exam_answers(id,attempt_id,question_id,answer_json) VALUES(?,?,?,?) ON CONFLICT(attempt_id,question_id) DO UPDATE SET answer_json=excluded.answer_json,saved_at=CURRENT_TIMESTAMP').bind(uid(),attempt.id,qid,JSON.stringify(val).slice(0,4000)));
      if(statements.length)await env.DB.batch(statements);
    }
    const answers=await env.DB.prepare('SELECT question_id,answer_json FROM exam_answers WHERE attempt_id=?').bind(attempt.id).all();
    const answerMap=Object.fromEntries(answers.results.map(a=>[a.question_id,JSON.parse(a.answer_json)]));
    let earned=0,max=0,manualReview=false;
    for(const q of qs.results){const pts=Number(q.points||0);max+=pts;if(q.question_type==='essay'){manualReview=true;continue;}if(compare(answerMap[q.id],JSON.parse(q.answer_json)))earned+=pts;}
    const score=manualReview?null:(max?Math.round(earned/max*10000)/100:0);
    const submittedAnswers={};for(const q of qs.results)if(answerMap[q.id]!==undefined)submittedAnswers[q.id]=answerMap[q.id];
    const status=expired?'auto_submitted':'submitted';
    const r=await env.DB.prepare("UPDATE exam_attempts SET status=?,submitted_at=CURRENT_TIMESTAMP,answers_json=?,score=?,max_score=? WHERE id=? AND status='in_progress'").bind(status,JSON.stringify(submittedAnswers).slice(0,100000),score,max,attempt.id).run();if(!r.meta.changes)return fail('Bài thi đã được chốt.',409);
    await audit(env,user,'exam.attempt.submit','exam_attempt',attempt.id,{status,score,manualReview},req);await addNotification(env,user.id,'exam','Đã ghi nhận bài thi','Bài làm của bạn đã được nộp. Kết quả sẽ hiển thị theo quy định kỳ thi.','/khao-thi');
    return json({ok:true,status,submitted:true,resultsVisible:false,manualReview,message:manualReview?'Đã chốt bài thi. Có câu tự luận cần hội đồng chấm; kết quả chỉ hiển thị khi được công bố.':'Đã chốt bài thi. Điểm và đáp án chính thức chỉ hiển thị khi hội đồng cho phép công bố.'});
  }
  const ev=path.match(/^\/api\/exams\/attempts\/([\w-]+)\/events$/);
  if(ev&&req.method==='POST'){
    const d=await readJson(req),attempt=await env.DB.prepare("SELECT id,status FROM exam_attempts WHERE id=? AND user_id=?").bind(ev[1],user.id).first();if(!attempt||attempt.status!=='in_progress')return fail('Phiên thi không còn hoạt động.',404);
    if(!eventTypes.has(d.type))return fail('Loại sự kiện không hợp lệ.');
    const severity=['fullscreen_exit','copy_attempt','cut_attempt','paste_attempt','multiple_session_detected'].includes(d.type)?'review':'info';
    await env.DB.prepare('INSERT INTO anti_cheat_events(id,attempt_id,event_type,severity,payload_json) VALUES(?,?,?,?,?)').bind(uid(),attempt.id,d.type,severity,JSON.stringify({clientTimestamp:clean(d.clientTimestamp,60),client:'browser',visibility:clean(d.visibility,20)})).run();return json({ok:true,recorded:true});
  }
  if(path==='/api/exams/attempts'&&req.method==='GET'){
    const rows=await env.DB.prepare('SELECT a.id,a.status,a.started_at,a.submitted_at,a.score,e.title,e.language_code FROM exam_attempts a JOIN exams e ON e.id=a.exam_id WHERE a.user_id=? ORDER BY a.started_at DESC LIMIT 60').bind(user.id).all();return json({attempts:rows.results});
  }
  if(path==='/api/exams/appeals'&&req.method==='POST'){
    const d=await readJson(req),attempt=await env.DB.prepare("SELECT id,status FROM exam_attempts WHERE id=? AND user_id=? AND status IN ('submitted','auto_submitted')").bind(clean(d.attemptId,80),user.id).first();if(!attempt)return fail('Không tìm thấy bài thi đủ điều kiện phúc khảo.',404);
    const id=uid();await env.DB.prepare('INSERT INTO exam_appeals(id,attempt_id,user_id,reason) VALUES(?,?,?,?)').bind(id,attempt.id,user.id,clean(d.reason,2000)).run();return json({ok:true,id,status:'submitted'},201);
  }
  if(path==='/api/admin/exams'&&examManager(user)&&req.method==='GET'){
    const rows=await env.DB.prepare('SELECT id,title,language_code,starts_at,ends_at,duration_minutes,status,created_at FROM exams ORDER BY created_at DESC LIMIT 100').all();return json({exams:rows.results});
  }
  if(path==='/api/admin/exams'&&examManager(user)&&req.method==='POST'){
    const d=await readJson(req),title=clean(d.title,180),lang=clean(d.language,5);if(title.length<3||!['zh','en','ko','ja','ru'].includes(lang))return fail('Tên kỳ thi hoặc ngôn ngữ chưa hợp lệ.');
    const id=uid();await env.DB.prepare('INSERT INTO exams(id,title,description,language_code,starts_at,ends_at,duration_minutes,settings_json,created_by) VALUES(?,?,?,?,?,?,?,?,?)').bind(id,title,clean(d.description,1200),lang,d.startsAt||null,d.endsAt||null,Math.max(1,Math.min(600,Number(d.durationMinutes)||60)),JSON.stringify(d.settings||{}),user.id).run();await audit(env,user,'exam.create','exam',id,{},req);return json({ok:true,id},201);
  }
  if(path==='/api/admin/questions'&&examManager(user)&&req.method==='POST'){
    const d=await readJson(req);if(!clean(d.prompt,4000)||!d.answer||!['single_choice','multiple_choice','true_false','fill_blank','matching','ordering','essay'].includes(d.type))return fail('Câu hỏi chưa hợp lệ.');
    const id=uid();await env.DB.prepare('INSERT INTO question_bank(id,owner_id,language_code,question_type,prompt,options_json,answer_json,explanation,topic,difficulty,points) VALUES(?,?,?,?,?,?,?,?,?,?,?)').bind(id,user.id,clean(d.language,5),d.type,clean(d.prompt,4000),JSON.stringify(Array.isArray(d.options)?d.options.slice(0,30):[]),JSON.stringify(d.answer),clean(d.explanation,1000),clean(d.topic,100),['easy','medium','hard'].includes(d.difficulty)?d.difficulty:'medium',Math.max(0.1,Math.min(100,Number(d.points)||1))).run();return json({ok:true,id},201);
  }
  const attach=path.match(/^\/api\/admin\/exams\/([\w-]+)\/questions$/);
  if(attach&&examManager(user)&&req.method==='PUT'){
    const d=await readJson(req),items=Array.isArray(d.questions)?d.questions:[];if(items.length>300)return fail('Mỗi đề không vượt quá 300 câu.');
    await env.DB.prepare('DELETE FROM exam_questions WHERE exam_id=?').bind(attach[1]).run();
    const statements=[];items.forEach((x,i)=>statements.push(env.DB.prepare('INSERT INTO exam_questions(exam_id,question_id,sort_order,points) VALUES(?,?,?,?)').bind(attach[1],clean(x.id,80),i,Math.max(0.1,Math.min(100,Number(x.points)||1)))));
    if(statements.length)await env.DB.batch(statements);return json({ok:true,count:statements.length});
  }
  const publish=path.match(/^\/api\/admin\/exams\/([\w-]+)\/publish$/);
  if(publish&&examManager(user)&&req.method==='POST'){
    const c=await env.DB.prepare('SELECT COUNT(*) n FROM exam_questions WHERE exam_id=?').bind(publish[1]).first();if(c.n<1)return fail('Không thể xuất bản kỳ thi chưa có câu hỏi.');
    const r=await env.DB.prepare("UPDATE exams SET status='published' WHERE id=? AND status='draft'").bind(publish[1]).run();return json({ok:r.meta.changes===1});
  }
  if(path==='/api/admin/exam-events'&&examManager(user)&&req.method==='GET'){
    const rows=await env.DB.prepare(`SELECT e.id,e.event_type,e.severity,e.created_at,a.user_id,u.full_name,ex.title exam_title
      FROM anti_cheat_events e JOIN exam_attempts a ON a.id=e.attempt_id JOIN users u ON u.id=a.user_id JOIN exams ex ON ex.id=a.exam_id ORDER BY e.created_at DESC LIMIT 200`).all();return json({events:rows.results,decisionPolicy:'Tín hiệu chỉ phục vụ rà soát; không tự động kết luận gian lận.'});
  }
  const appeals=path.match(/^\/api\/exams\/appeals\/([\w-]+)$/);
  if(appeals&&req.method==='GET'){
    const r=await env.DB.prepare('SELECT id,reason,status,decision,created_at,reviewed_at FROM exam_appeals WHERE id=? AND user_id=?').bind(appeals[1],user.id).first();return r?json({appeal:r}):fail('Không tìm thấy yêu cầu.',404);
  }
  return null;
}
