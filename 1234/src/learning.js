import {json,fail,readJson,clean,uid,now} from './core.js';

const langs=['zh','en','ko','ja','ru'];
export async function handleLearning(req,env,path,url,user){
  if(path==='/api/languages'&&req.method==='GET'){
    const r=await env.DB.prepare('SELECT code,name_vi,native_name,script_hint FROM languages WHERE enabled=1 ORDER BY sort_order').all();return json({languages:r.results});
  }
  if(path==='/api/practice/sets'&&req.method==='GET'){
    const lang=clean(url.searchParams.get('language')||'en',5),skill=clean(url.searchParams.get('skill')||'',30);
    if(!langs.includes(lang))return fail('Ngôn ngữ không hợp lệ.');
    const rows=await env.DB.prepare(`SELECT id,language_code,skill,title,level,topic,content_json FROM practice_sets WHERE language_code=? AND status='published' AND (owner_id IS NULL OR owner_id=?) AND (?='' OR skill=?) ORDER BY title LIMIT 100`).bind(lang,user?.id||'',skill,skill).all();
    return json({sets:rows.results.map(r=>({id:r.id,language:r.language_code,skill:r.skill,title:r.title,level:r.level,topic:r.topic,questions:safeQuestions(r.content_json)}))});
  }
  const setMatch=path.match(/^\/api\/practice\/sets\/([a-zA-Z0-9_-]+)$/);
  if(setMatch&&req.method==='GET'){
    const row=await env.DB.prepare("SELECT id,language_code,skill,title,level,topic,content_json FROM practice_sets WHERE id=? AND status='published'").bind(setMatch[1]).first();
    if(!row)return fail('Không tìm thấy bài thực hành.',404);
    return json({set:{id:row.id,language:row.language_code,skill:row.skill,title:row.title,level:row.level,topic:row.topic,questions:safeQuestions(row.content_json)}});
  }
  if(path==='/api/practice/submit'&&req.method==='POST'){
    const d=await readJson(req),set=await env.DB.prepare("SELECT id,language_code,skill,content_json FROM practice_sets WHERE id=? AND status='published'").bind(clean(d.setId,80)).first();
    if(!set)return fail('Bài thực hành không tồn tại.',404);
    const content=JSON.parse(set.content_json||'{}'),questions=Array.isArray(content.questions)?content.questions:[],answers=d.answers&&typeof d.answers==='object'?d.answers:{};
    if(!questions.length)return fail('Bài thực hành chưa có câu hỏi.',422);
    let correct=0;const details=[];
    for(const q of questions){const supplied=answers[q.id];const expected=q.answer;const ok=compareAnswer(supplied,expected);if(ok)correct++;
      details.push({questionId:q.id,correct:ok,expected:q.answer,explanation:q.explanation||''});}
    const score=Math.round(correct/questions.length*100),duration=Math.max(0,Math.min(86400,Number(d.durationSeconds)||0));
    const resultId=uid();await env.DB.prepare('INSERT INTO practice_results(id,user_id,set_id,language_code,skill,score,correct_count,total_count,duration_seconds,details_json) VALUES(?,?,?,?,?,?,?,?,?,?)')
      .bind(resultId,user.id,set.id,set.language_code,set.skill,score,correct,questions.length,duration,JSON.stringify(details)).run();
    return json({ok:true,result:{id:resultId,score,correct,total:questions.length,details}});
  }
  if(path==='/api/progress'&&req.method==='GET'){
    const [totals,skills,history,goals]=await Promise.all([
      env.DB.prepare('SELECT COUNT(*) attempts,COALESCE(AVG(score),0) average_score,COALESCE(SUM(duration_seconds),0) total_seconds,COUNT(DISTINCT language_code) languages FROM practice_results WHERE user_id=?').bind(user.id).first(),
      env.DB.prepare('SELECT language_code,skill,COUNT(*) attempts,ROUND(AVG(score),1) average_score,MAX(created_at) last_practice FROM practice_results WHERE user_id=? GROUP BY language_code,skill ORDER BY language_code,skill').bind(user.id).all(),
      env.DB.prepare('SELECT id,language_code,skill,score,correct_count,total_count,duration_seconds,created_at FROM practice_results WHERE user_id=? ORDER BY created_at DESC LIMIT 50').bind(user.id).all(),
      env.DB.prepare('SELECT language_code,weekly_minutes,target_days,active FROM learning_goals WHERE user_id=? ORDER BY language_code').bind(user.id).all()
    ]);
    return json({totals,bySkill:skills.results,history:history.results,goals:goals.results});
  }
  if(path==='/api/progress/goals'&&req.method==='PUT'){
    const d=await readJson(req),items=Array.isArray(d.goals)?d.goals:[];
    for(const g of items.slice(0,5)){if(!langs.includes(g.language))continue;await env.DB.prepare(`INSERT INTO learning_goals(id,user_id,language_code,weekly_minutes,target_days) VALUES(?,?,?,?,?) ON CONFLICT(user_id,language_code) DO UPDATE SET weekly_minutes=excluded.weekly_minutes,target_days=excluded.target_days,active=1`)
      .bind(uid(),user.id,g.language,Math.max(15,Math.min(2000,Number(g.weeklyMinutes)||60)),Math.max(1,Math.min(7,Number(g.targetDays)||5))).run();}
    return json({ok:true});
  }
  if(path==='/api/vocabulary/decks'&&req.method==='GET'){
    const rows=await env.DB.prepare(`SELECT d.id,d.language_code,d.name,d.description,COUNT(c.id) card_count FROM vocabulary_decks d LEFT JOIN vocabulary_cards c ON c.deck_id=d.id WHERE d.owner_id IS NULL OR d.owner_id=? GROUP BY d.id ORDER BY d.created_at DESC LIMIT 100`).bind(user.id).all();return json({decks:rows.results});
  }
  if(path==='/api/vocabulary/decks'&&req.method==='POST'){
    const d=await readJson(req),lang=clean(d.language,5),name=clean(d.name,100);if(!langs.includes(lang)||name.length<2)return fail('Tên bộ từ hoặc ngôn ngữ không hợp lệ.');
    const id=uid();await env.DB.prepare('INSERT INTO vocabulary_decks(id,owner_id,language_code,name,description) VALUES(?,?,?,?,?)').bind(id,user.id,lang,name,clean(d.description,500)).run();
    return json({ok:true,id},201);
  }
  const deck=path.match(/^\/api\/vocabulary\/decks\/([\w-]+)$/);
  if(deck&&req.method==='GET'){
    const d=await env.DB.prepare('SELECT id,language_code,name,description FROM vocabulary_decks WHERE id=? AND (owner_id IS NULL OR owner_id=?)').bind(deck[1],user.id).first();if(!d)return fail('Không tìm thấy bộ từ.',404);
    const cards=await env.DB.prepare('SELECT id,term,pronunciation,meaning,example,audio_key FROM vocabulary_cards WHERE deck_id=? ORDER BY sort_order').bind(deck[1]).all();return json({deck:d,cards:cards.results});
  }
  if(deck&&req.method==='POST'){
    const d=await readJson(req),cardId=uid();const own=await env.DB.prepare('SELECT id FROM vocabulary_decks WHERE id=? AND owner_id=?').bind(deck[1],user.id).first();if(!own)return fail('Bạn không có quyền sửa bộ từ này.',403);
    if(!clean(d.term,100)||!clean(d.meaning,500))return fail('Cần có từ vựng và nghĩa.');
    await env.DB.prepare('INSERT INTO vocabulary_cards(id,deck_id,term,pronunciation,meaning,example,sort_order) VALUES(?,?,?,?,?,?,?)').bind(cardId,deck[1],clean(d.term,100),clean(d.pronunciation,100),clean(d.meaning,500),clean(d.example,700),Number(d.sortOrder)||0).run();return json({ok:true,id:cardId},201);
  }
  const review=path.match(/^\/api\/vocabulary\/cards\/([\w-]+)\/review$/);
  if(review&&req.method==='POST'){
    const d=await readJson(req),q=Math.max(0,Math.min(5,Number(d.quality)||0));const card=await env.DB.prepare('SELECT c.id FROM vocabulary_cards c JOIN vocabulary_decks d ON d.id=c.deck_id WHERE c.id=? AND (d.owner_id IS NULL OR d.owner_id=?)').bind(review[1],user.id).first();if(!card)return fail('Không tìm thấy thẻ từ.',404);
    await env.DB.prepare('INSERT INTO vocabulary_reviews(id,user_id,card_id,quality) VALUES(?,?,?,?)').bind(uid(),user.id,card.id,q).run();return json({ok:true});
  }
  return null;
}
function safeQuestions(raw){const c=JSON.parse(raw||'{}');return (c.questions||[]).map(({answer,answers,explanation,audioText,...q})=>q);}
function norm(v){return String(v??'').normalize('NFKC').trim().toLocaleLowerCase().replace(/[\s\p{P}\p{S}]+/gu,' ').trim();}
function compareAnswer(given,expected){if(Array.isArray(expected)){const a=Array.isArray(given)?given.map(norm).sort():[norm(given)].sort();return JSON.stringify(a)===JSON.stringify(expected.map(norm).sort());}return norm(given)===norm(expected);}
