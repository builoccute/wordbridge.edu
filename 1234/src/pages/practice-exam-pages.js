/** WORD BRIDGE — Practice Studios, Insights and Examination discovery. */
import { renderPublicPage } from '../layouts/site-layout.js';
import { signInUrl } from '../config/constants.js';
import { escapeHtml, htmlResponse, redirectResponse } from '../utils/http.js';

const SKILL_LABELS = {
  listening: 'Nghe', speaking: 'Nói', reading: 'Đọc', writing: 'Viết', vocabulary: 'Từ vựng', grammar: 'Ngữ pháp',
};
const SKILL_EN = { listening: 'Listening', speaking: 'Speaking', reading: 'Reading', writing: 'Writing', vocabulary: 'Vocabulary', grammar: 'Grammar' };
function scorePercent(row) {
  if (row?.grading_status === 'partially_graded' || row?.score == null || !Number(row.max_score)) return null;
  return Math.round((Number(row.score) / Number(row.max_score)) * 100);
}
function safeJson(value, fallback = []) { try { return JSON.parse(value || ''); } catch { return fallback; } }
function optionField(q) {
  const options = Array.isArray(q.options) ? q.options : [];
  if (options.length) return `<fieldset class="wb-choice-group"><legend data-learning-content>${escapeHtml(q.prompt_text)}</legend>${options.map((opt) => `<label><input type="radio" name="answer_${escapeHtml(q.id)}" value="${escapeHtml(opt)}" required /> <span>${escapeHtml(opt)}</span></label>`).join('')}</fieldset>`;
  return `<label class="wb-field"><span data-learning-content>${escapeHtml(q.prompt_text)}</span><textarea class="wb-textarea wb-writing-editor" name="answer_${escapeHtml(q.id)}" required data-wb-counter="cnt-${escapeHtml(q.id)}" placeholder="Nhập câu trả lời của bạn..."></textarea><span id="cnt-${escapeHtml(q.id)}" class="wb-muted">Số từ: 0 · Hán tự: 0 · Tổng ký tự: 0</span></label>`;
}
function audioControls(q) {
  if (!q.audio_asset_id) return `<div class="wb-alert wb-alert-info">Bài này chưa có audio asset đã được xác minh. Không có audio/timestamp giả được tạo.</div>`;
  return `<div class="wb-audio-studio" data-wb-audio><audio controls preload="metadata" src="/api/v1/audio/${encodeURIComponent(q.audio_asset_id)}/stream"></audio><div class="wb-audio-controls"><button type="button" class="wb-btn wb-btn-primary wb-btn-sm" data-audio-action="play">Play</button><button type="button" class="wb-btn wb-btn-ghost wb-btn-sm" data-audio-action="pause">Pause</button><button type="button" class="wb-btn" data-audio-action="replay">Phát lại</button><button type="button" class="wb-btn wb-btn-ghost wb-btn-sm" data-audio-action="back">−5s</button><button type="button" class="wb-btn wb-btn-ghost wb-btn-sm" data-audio-action="forward">+5s</button><button type="button" class="wb-btn wb-btn-outline wb-btn-sm" data-audio-action="loop">Loop</button><button type="button" class="wb-btn wb-btn-ghost wb-btn-sm" data-audio-speed="0.75">0.75×</button><button type="button" class="wb-btn wb-btn-ghost wb-btn-sm" data-audio-speed="1">1×</button><button type="button" class="wb-btn wb-btn-ghost wb-btn-sm" data-audio-speed="1.25">1.25×</button></div><p class="wb-muted" data-audio-status role="status">Audio được phát trực tiếp từ asset đã đăng ký; transcript chỉ hiển thị khi source có dữ liệu.</p></div>`;
}
function skillPresentation(ex, skill, user) {
  const qs = ex.questions || [];
  const form = user ? `<form class="wb-form" data-api-endpoint="/api/v1/practice/submit" data-redirect-practice-result ${skill==='writing' ? `data-draft-key="wb-draft:${escapeHtml(user.accountId)}:${escapeHtml(ex.id)}"` : ''}><input type="hidden" name="exerciseId" value="${escapeHtml(ex.id)}"/>${qs.map(optionField).join('')}<div data-form-status class="wb-form-status" aria-live="polite"></div><button type="submit" class="wb-btn wb-btn-primary">Nộp bài & xem kết quả</button></form>` : `<a class="wb-btn wb-btn-primary" href="${signInUrl(`/practice/${skill}`, `practice.${skill}.start`)}">Đăng nhập để bắt đầu</a>`;
  if (skill === 'listening') return `<section class="wb-audio-studio"><p class="wb-eyebrow">LISTENING STUDIO</p><h2 data-learning-content>${escapeHtml(ex.title_vi)}</h2><p data-learning-content>${escapeHtml(ex.instructions_vi)}</p>${user ? qs.map(audioControls).join('') : ''}${form}</section>`;
  if (skill === 'speaking') return `<section class="wb-recorder-studio"><p class="wb-eyebrow">SPEAKING STUDIO</p><h2 data-learning-content>${escapeHtml(ex.title_vi)}</h2><div class="wb-recorder-steps"><span>Prompt</span><span>Prepare</span><span>Record</span><span>Playback</span><span>Feedback</span><span>Retry</span></div>${qs.map(q => `<div class="wb-task-prompt"><strong>Prompt:</strong> ${escapeHtml(q.prompt_text)}</div>`).join('')}${user ? '<div class="wb-practice-actions"><button type="button" class="wb-btn wb-btn-primary" data-wb-record-toggle>Ghi âm</button><button type="button" class="wb-btn wb-btn-ghost" data-wb-record-retry>Ghi lại</button></div><p data-wb-record-status class="wb-muted" role="status">Chưa ghi âm.</p><audio id="wb-local-playback" controls hidden></audio>' : `<a class="wb-btn wb-btn-primary" href="${signInUrl('/practice/speaking','practice.speaking.record')}">Đăng nhập để ghi âm</a>`}<div class="wb-alert wb-alert-info">Backend hiện không cung cấp pronunciation score đã được chứng minh. Recording chỉ dùng để tự nghe lại; submission theo rubric chỉ thực hiện khi bài có question thật.</div>${form}</section>`;
  if (skill === 'reading') return `<section class="wb-reader-layout"><article class="wb-reader-surface"><p class="wb-eyebrow">READING</p><h2 data-learning-content>${escapeHtml(ex.title_vi)}</h2>${qs.map(q => `<p data-learning-content>${escapeHtml(q.prompt_text)}</p>`).join('')}</article><aside class="wb-reader-aside"><h3>Comprehension</h3><p data-learning-content>${escapeHtml(ex.instructions_vi)}</p>${form}<p><a href="/dictionary">Tra từ trong Dictionary</a></p></aside></section>`;
  if (skill === 'writing') return `<section class="wb-editor-studio"><div><p class="wb-eyebrow">WRITING EDITOR</p><h2 data-learning-content>${escapeHtml(ex.title_vi)}</h2><p data-learning-content>${escapeHtml(ex.instructions_vi)}</p>${form}</div><aside class="wb-editor-panel"><h3>Workflow</h3><p>Đọc đề → Viết nháp → Nộp bài</p><p class="wb-muted">Nếu backend trả pending manual review, giao diện không tạo feedback tự động giả.</p></aside></section>`;
  return `<section class="wb-card"><p class="wb-eyebrow">${escapeHtml(SKILL_EN[skill].toUpperCase())} PRACTICE</p><h2 data-learning-content>${escapeHtml(ex.title_vi)}</h2><p data-learning-content>${escapeHtml(ex.instructions_vi)}</p>${form}</section>`;
}

export async function renderPracticePage({ services, user, skill = '', url }) {
  let exercises = [];
  exercises = await services.practice.listExercises({ skill });
  exercises = (exercises || []).filter(ex => !skill || ex.skill === skill);
  const heading = skill ? SKILL_LABELS[skill] : 'Practice Center';

  if (!skill) {
    let recent = [], due = 0;
    if (user) {
      recent = (await services.practice.db.prepare(`SELECT r.*, e.title_vi FROM wb_practice_results r LEFT JOIN wb_practice_exercises e ON e.id=r.exercise_id WHERE r.account_id=? ORDER BY r.submitted_at DESC LIMIT 20`).bind(user.accountId).all()).results || [];
      const dueRow = await services.practice.db.prepare(`SELECT COUNT(*) cnt FROM wb_vocabulary_notebook WHERE account_id=? AND datetime(next_review_at) <= datetime('now')`).bind(user.accountId).first();
      due = Number(dueRow?.cnt || 0);
    }
    const scored = recent.filter(r => scorePercent(r) != null);
    const skillAverages = Object.keys(SKILL_LABELS).map(s => { const rows=scored.filter(r=>r.skill===s); return { skill:s, count:rows.length, avg:rows.length ? Math.round(rows.reduce((n,r)=>n+scorePercent(r),0)/rows.length) : null }; });
    const weakest = skillAverages.filter(s=>s.avg!=null && s.avg<80).sort((a,b)=>a.avg-b.avg)[0] || null;
    const recommended = due ? { href:'/vocabulary/review', label:`Ôn ${due} mục từ đến hạn`, reason:'Dựa trên next_review_at thật.' } : weakest ? { href:`/practice/${weakest.skill}`, label:`Luyện ${SKILL_LABELS[weakest.skill]}`, reason:`Điểm trung bình evidence hiện tại ${weakest.avg}%.` } : null;
    const counts = Object.fromEntries(Object.keys(SKILL_LABELS).map(s => [s, exercises.filter(e => e.skill===s).length]));
    const contentHtml = `<section class="wb-learning-landing"><p class="wb-eyebrow">PRACTICE · REVIEW · IMPROVE</p><h1>Practice Center</h1><p>${user ? 'Dashboard ưu tiên evidence và việc cần làm thật từ dữ liệu cá nhân.' : 'Xem các studio luyện tập công khai; đăng nhập trước khi bắt đầu, nộp bài hoặc lưu tiến độ.'}</p></section>
      <div class="wb-practice-dashboard"><section><h2>Explore Practice</h2><div class="wb-practice-stream">${Object.entries(SKILL_LABELS).map(([s,label])=>`<article><p class="wb-eyebrow">${escapeHtml(SKILL_EN[s].toUpperCase())}</p><h3><a href="/practice/${s}">${escapeHtml(label)}</a></h3><p class="wb-muted">${counts[s]} exercise đã phát hành.</p></article>`).join('')}</div></section><aside>${user ? `<div class="wb-card"><h2>Review Due</h2><p><strong>${due}</strong> mục notebook đến hạn.</p><a href="/vocabulary/review" class="wb-btn wb-btn-primary">Ôn tập</a></div><div class="wb-card"><h2>Needs Improvement</h2>${weakest ? `<p>${escapeHtml(SKILL_LABELS[weakest.skill])}: <strong>${weakest.avg}%</strong> từ ${weakest.count} lượt có điểm.</p><a class="wb-btn wb-btn-outline" href="/practice/${weakest.skill}">Luyện kỹ năng này</a>`:'<p class="wb-muted">Chưa có đủ kết quả có điểm để xác định skill cần cải thiện.</p>'}</div>` : `<div class="wb-card"><h2>Sign in to do</h2><p>Practice submission, recording và history là dữ liệu cá nhân.</p><a class="wb-btn wb-btn-primary" href="${signInUrl('/practice','practice.start')}">Đăng nhập</a></div>`}</aside></div>
      ${recommended ? `<section class="wb-next-action"><h2>Recommended</h2><p>${escapeHtml(recommended.reason)}</p><a href="${recommended.href}" class="wb-btn wb-btn-primary">${escapeHtml(recommended.label)}</a></section>` : '<section class="wb-empty-state"><h2>Chưa có recommendation evidence-based</h2><p>Hoàn thành một bài practice hoặc thêm từ vào notebook để hệ thống có evidence thật.</p></section>'}`;
    return htmlResponse(renderPublicPage({ title: heading, currentPath: '/practice', breadcrumbs: [{label:'Luyện tập'}], user, contentHtml }));
  }

  let lessonStudio = '';
  if (['speaking','reading','listening'].includes(skill)) {
    const { results } = await services.practice.db.prepare("SELECT title_vi,slug,components_json FROM wb_lessons WHERE review_status='published' ORDER BY language_code,slug").all();
    const readings = results.map(row => ({...row,content:safeJson(row.components_json,{})})).filter(row => row.content[skill] && (skill!=='reading' || row.content.examples?.length));
    const index=Math.max(0,readings.findIndex(row=>row.slug===url?.searchParams.get('lesson')));
    const chosen=readings.slice(index,index+1);
    lessonStudio = chosen.map(({title_vi,slug,content}) => `<article class="wb-reader-surface"><h2 data-learning-content>${escapeHtml(title_vi)}</h2><p>${escapeHtml(content[skill])}</p>${(content.examples || []).map(line => `<blockquote>${escapeHtml(line)}</blockquote>`).join('')}<a href="/lessons/${encodeURIComponent(slug)}">Mở bài học</a>${skill === 'reading' ? ' · <a href="/dictionary">Từ điển</a>' : ''}</article>`).join('');
    if(readings.length>1){
      const link=(row,label)=>row ? `<a class="wb-btn" href="/practice/${skill}?lesson=${encodeURIComponent(row.slug)}">${label}</a>` : '';
      lessonStudio+=`<nav class="wb-filter-strip" aria-label="Bài học">${link(readings[index-1],'Bài trước')}<span>${index+1} / ${readings.length}</span>${link(readings[index+1],'Bài tiếp theo')}</nav>`;
    }
    if(skill==='listening'){
      const assets=(await services.practice.db.prepare("SELECT id,language_code,voice_label,transcript_text,sync_segments_json FROM wb_audio_assets WHERE review_status='published' ORDER BY language_code,id").all()).results;
      lessonStudio=assets.map(asset=>{
        const segments=safeJson(asset.sync_segments_json,[]).filter(s=>Number.isFinite(s.startMs) && s.endMs>s.startMs);
        const player=user ? audioControls({audio_asset_id:asset.id}).replace('</audio>',`</audio>${segments.map(s=>`<button type="button" class="wb-btn" data-audio-segment-start="${Number(s.startMs)}" data-audio-segment-end="${Number(s.endMs)}">${escapeHtml(s.text)}</button>`).join('')}`) : `<a href="${signInUrl('/practice/listening','listening.play')}">Đăng nhập để nghe</a>`;
        return `<section><h2 data-learning-content>${escapeHtml(asset.voice_label)}</h2>${player}${asset.transcript_text ? `${user ? '<label class="wb-field">Chép chính tả<textarea></textarea></label>' : ''}<details><summary>Bản chép lời</summary><p data-learning-content>${escapeHtml(asset.transcript_text)}</p></details>` : ''}</section>`;
      }).join('')+lessonStudio;
    }
    if (skill === 'speaking' && !exercises.length) lessonStudio = (user ? '<section class="wb-recorder-studio"><button type="button" class="wb-btn" data-wb-record-toggle>Ghi âm</button><button type="button" class="wb-btn" data-wb-record-retry>Ghi lại</button><p role="status" data-wb-record-status></p><audio controls hidden id="wb-local-playback"></audio></section>' : `<a class="wb-btn" href="${signInUrl('/practice/speaking','practice.speaking.record')}">Đăng nhập để ghi âm</a>`) + lessonStudio;
  }
  const contentHtml = `<section class="wb-learning-landing"><p class="wb-eyebrow">${escapeHtml(SKILL_EN[skill].toUpperCase())} STUDIO</p><h1>${escapeHtml(heading)}</h1></section>
    <nav class="wb-skill-strip" aria-label="Practice skills"><a href="/practice">Tổng quan</a>${Object.entries(SKILL_LABELS).map(([s,label])=>`<a href="/practice/${s}" ${s===skill?'aria-current="page"':''}>${escapeHtml(label)}</a>`).join('')}<a href="/vocabulary/review">Ôn tập</a><a href="/my-mistakes">My Mistakes</a></nav>
    ${lessonStudio}
    ${exercises.length ? exercises.map(ex => skillPresentation(ex, skill, user)).join('') : lessonStudio ? '' : `<section class="wb-empty-state"><h2>Chưa có bài ${escapeHtml(SKILL_LABELS[skill])} đã phát hành</h2><p>Không tạo exercise, audio, transcript hoặc feedback giả. Bạn có thể mở Skill Center để xem evidence hiện có.</p><a class="wb-btn wb-btn-outline" href="/skills/${skill}">Mở Skill Center</a></section>`}
    <section class="wb-next-action"><h2>Bridge</h2><a href="/my-mistakes" class="wb-btn wb-btn-outline">My Mistakes</a><a href="/vocabulary/review" class="wb-btn wb-btn-outline">Review</a><a href="/learning/path" class="wb-btn wb-btn-outline">Learning Path</a></section>`;
  return htmlResponse(renderPublicPage({ title: heading, currentPath: `/practice/${skill}`, breadcrumbs: [{label:'Luyện tập',href:'/practice'},{label:SKILL_LABELS[skill]}], user, contentHtml }));
}

export async function renderPracticeHistoryPage({ db, user }) {
  if (!user) return redirectResponse(signInUrl('/practice/history', 'practice.history'));
  const rows=(await db.prepare(`SELECT r.*, e.title_vi FROM wb_practice_results r LEFT JOIN wb_practice_exercises e ON e.id=r.exercise_id WHERE r.account_id=? ORDER BY r.submitted_at DESC LIMIT 100`).bind(user.accountId).all()).results||[];
  const review=await db.prepare("SELECT COUNT(*) AS reviewed FROM wb_vocabulary_notebook WHERE account_id=? AND last_reviewed_at IS NOT NULL").bind(user.accountId).first();
  const missed=new Map();
  for(const row of rows){
    const feedback=safeJson(row.feedback_json,[]);
    const items=Array.isArray(feedback) ? feedback : feedback?.items || feedback?.breakdown || [];
    for(const item of items) {
      if(!item?.questionId || item.correct!==false) continue;
      const value=missed.get(item.questionId) || {count:0,label:item.prompt || item.questionId};
      value.count++;
      missed.set(item.questionId,value);
    }
  }
  const repeated=[...missed.values()].filter(x=>x.count>1).sort((a,b)=>b.count-a.count);
  const weekly=new Map();
  for(const row of rows){
    const day=new Date(row.submitted_at.replace(' ','T')+'Z');
    if(!Number.isFinite(day.getTime())) continue;
    day.setUTCDate(day.getUTCDate()-(day.getUTCDay()+6)%7);
    const key=day.toISOString().slice(0,10);
    weekly.set(key,(weekly.get(key)||0)+1);
  }
  const distribution=Object.keys(SKILL_LABELS).map(skill=>[skill,rows.filter(row=>row.skill===skill).length]).filter(([,count])=>count>0);
  const withPct=rows.map(r=>({...r,pct:scorePercent(r)}));
  const scored=withPct.filter(r=>r.pct!=null);
  const avg=scored.length?Math.round(scored.reduce((n,r)=>n+r.pct,0)/scored.length):null;
  const bySkill=Object.keys(SKILL_LABELS).map(s=>{const rs=scored.filter(r=>r.skill===s);return {skill:s,count:rs.length,avg:rs.length?Math.round(rs.reduce((n,r)=>n+r.pct,0)/rs.length):null};}).filter(x=>x.count);
  const contentHtml=`<section class="wb-learning-landing"><p class="wb-eyebrow">PRACTICE INSIGHTS</p><h1>Practice Insights</h1><p>Insights chỉ được tính từ kết quả practice đã lưu.</p></section><div class="wb-metric-row"><div><strong>${rows.length}</strong><span>Activity count</span></div><div><strong>${avg==null?'—':`${avg}%`}</strong><span>Accuracy evidence</span></div><div><strong>${bySkill.length}</strong><span>Skills có evidence</span></div><div><strong>${rows.filter(r=>r.grading_status==='pending_manual_review').length}</strong><span>Pending review</span></div></div>
  ${review.reviewed ? `<p><span>Mục từ đã ôn ít nhất một lần</span> · ${Number(review.reviewed)}</p>` : ''}
  ${repeated.length ? `<section><h2>Câu hỏi sai nhiều lần</h2><ol>${repeated.map(item=>`<li><span data-learning-content>${escapeHtml(item.label)}</span> · ${item.count}</li>`).join('')}</ol></section>` : ''}
  ${weekly.size ? `<section><h2>Hoạt động theo tuần</h2><dl>${[...weekly].map(([week,count])=>`<dt>${week}</dt><dd>${count}</dd>`).join('')}</dl></section><section><h2>Hoạt động theo kỹ năng</h2><dl>${distribution.map(([skill,count])=>`<dt>${SKILL_LABELS[skill]}</dt><dd>${count}</dd>`).join('')}</dl></section>` : ''}
  ${bySkill.length?`<section><h2>Skill accuracy</h2><div class="wb-skill-meter-list">${bySkill.map(s=>`<article><div><strong>${escapeHtml(SKILL_LABELS[s.skill])}</strong><span>${s.count} lượt</span></div><div class="wb-progress"><span style="width:${s.avg}%"></span></div><strong>${s.avg}%</strong></article>`).join('')}</div></section>`:''}
  <section><h2>Recent evidence</h2>${rows.length?`<div class="wb-activity-list">${withPct.map(r=>`<article><div><p class="wb-eyebrow">${escapeHtml(r.skill)} · ${escapeHtml(r.submitted_at)}</p><h3 data-learning-content>${escapeHtml(r.title_vi||r.exercise_id)}</h3><p>${r.pct==null?'Chờ đánh giá theo rubric':`Accuracy ${r.pct}%`} · ${escapeHtml(r.grading_status)}</p></div><a href="/practice/results/${escapeHtml(r.id)}" class="wb-btn wb-btn-outline wb-btn-sm">Xem chi tiết</a></article>`).join('')}</div>`:'<div class="wb-empty-state"><h3>Chưa có practice evidence</h3><a href="/practice" class="wb-btn wb-btn-primary">Bắt đầu luyện tập</a></div>'}</section><section class="wb-next-action"><h2>Next action</h2><a href="/my-mistakes" class="wb-btn wb-btn-primary">My Mistakes</a><a href="/practice" class="wb-btn wb-btn-outline">Practice</a></section>`;
  return htmlResponse(renderPublicPage({title:'Practice Insights',currentPath:'/practice/history',breadcrumbs:[{label:'Luyện tập',href:'/practice'},{label:'Insights'}],user,contentHtml}));
}

export async function renderPracticeResultPage({ db, user, resultId }) {
  if (!user) return redirectResponse(signInUrl(`/practice/results/${resultId}`, 'practice.results'));
  const r=await db.prepare(`SELECT r.*, e.title_vi, e.instructions_vi FROM wb_practice_results r LEFT JOIN wb_practice_exercises e ON e.id=r.exercise_id WHERE r.id=? AND r.account_id=?`).bind(resultId,user.accountId).first();
  if(!r)return htmlResponse(renderPublicPage({title:'Không tìm thấy kết quả',currentPath:`/practice/results/${resultId}`,user,contentHtml:'<section class="wb-alert wb-alert-error"><h1>Không tìm thấy kết quả</h1><p>Kết quả không tồn tại hoặc không thuộc tài khoản hiện tại.</p></section>'}),404);
  const feedback=safeJson(r.feedback_json,[]), percentage=scorePercent(r);
  const submission=Object.values(safeJson(r.answers_json,{})).map(value=>`<blockquote data-learning-content>${escapeHtml(String(value))}</blockquote>`).join('');
  const contentHtml=`<section class="wb-learning-landing"><p class="wb-eyebrow">${escapeHtml(r.skill.toUpperCase())} · ${escapeHtml(r.grading_status)}</p><h1 data-learning-content>${escapeHtml(r.title_vi||'Kết quả luyện tập')}</h1><p>${percentage==null?'Bài này cần đánh giá thủ công/rubric; hệ thống không tạo điểm giả.':`Điểm backend: ${r.score}/${r.max_score} (${percentage}%).`}</p></section>${submission ? `<section><h2>Trả lời của bạn</h2>${submission}</section>` : ''}${feedback.length?`<section><h2>Feedback evidence</h2><div class="wb-activity-list">${feedback.map((f,i)=>`<article><div><p class="wb-eyebrow">ITEM ${i+1}</p><h3>${f.graded?(f.correct?'Đúng':'Cần cải thiện'):'Pending manual review'}</h3><p>${escapeHtml(f.explanationVi||f.noteVi||'')}</p></div><span class="wb-badge ${f.correct?'':'wb-badge-red'}">${f.graded?(f.correct?'Correct':'Incorrect'):'Pending'}</span></article>`).join('')}</div></section>`:''}<section class="wb-next-action"><h2>Bridge</h2>${percentage!=null&&percentage<80?`<a href="/practice/${escapeHtml(r.skill)}" class="wb-btn wb-btn-primary">Luyện lại kỹ năng</a>`:'<a href="/practice" class="wb-btn wb-btn-primary">Tiếp tục Practice</a>'}<a href="/my-mistakes" class="wb-btn wb-btn-outline">My Mistakes</a><a href="/vocabulary/review" class="wb-btn wb-btn-outline">Review</a></section>`;
  return htmlResponse(renderPublicPage({title:'Kết quả luyện tập',currentPath:`/practice/results/${resultId}`,breadcrumbs:[{label:'Luyện tập',href:'/practice'},{label:'Kết quả'}],user,contentHtml}));
}

export async function renderExaminationsHub({ db, user, languageSlug = '' }) {
  const codeMap = { chinese: 'zh', english: 'en', russian: 'ru' };
  const filterCode = codeMap[languageSlug] || '';
  let exams = [];
  const sql = filterCode
    ? "SELECT * FROM wb_examinations WHERE review_status='published' AND language_code=? ORDER BY language_code,title_vi"
    : "SELECT * FROM wb_examinations WHERE review_status='published' ORDER BY language_code,title_vi";
  exams = filterCode
    ? (await db.prepare(sql).bind(filterCode).all()).results || []
    : (await db.prepare(sql).all()).results || [];

  const rows = exams.map((ex) => {
    const skills = safeJson(ex.skills_json, []);
    return `<article class="wb-exam-discovery-row"><div><p class="wb-eyebrow">${escapeHtml(ex.framework_reference)} · ${escapeHtml(ex.level_ref)}</p><h3><a href="/examinations/${escapeHtml(ex.slug)}" data-learning-content>${escapeHtml(ex.title_vi)}</a></h3><p>${escapeHtml(ex.topic)} · ${escapeHtml(String(ex.duration_minutes))} phút${skills.length ? ` · ${skills.map((s) => escapeHtml(s)).join(', ')}` : ''}</p></div><a href="/examinations/${escapeHtml(ex.slug)}" class="wb-btn wb-btn-outline wb-btn-sm">Xem mô tả</a></article>`;
  }).join('');
  const examAction = user
    ? '<a data-wb-handoff href="https://exam.wordbridge.io.vn/" class="wb-btn wb-btn-primary">Mở Cổng Khảo thí</a>'
    : `<a href="${signInUrl('/examinations', 'exam.start')}" class="wb-btn wb-btn-primary">Đăng nhập để bắt đầu đánh giá</a>`;

  return htmlResponse(renderPublicPage({
    title: 'Khảo thí năng lực', currentPath: '/examinations', breadcrumbs: [{ label: 'Khám phá', href: '/learning' }, { label: 'Khảo thí' }], user,
    contentHtml: `<section class="wb-learning-landing"><p class="wb-eyebrow">ASSESSMENT DISCOVERY · EXTERNAL OWNERSHIP</p><h1>Khảo thí năng lực</h1><p>Miền 1 chỉ hiển thị metadata đánh giá đã phát hành và chuyển giao sang <strong>exam.wordbridge.io.vn</strong>. Không nhân bản examination engine và không tạo kết quả thi giả.</p>${examAction}</section><nav class="wb-filter-strip" aria-label="Lọc theo ngôn ngữ"><a href="/examinations">Tất cả</a><a href="/examinations/english">English</a><a href="/examinations/chinese">中文</a><a href="/examinations/russian">Русский</a></nav><section><h2>Đánh giá tham chiếu đã có trong source</h2>${rows || '<div class="wb-alert wb-alert-info">Chưa có assessment đã phát hành trong dữ liệu hiện tại. Bạn vẫn có thể xem các kỳ thi khả dụng tại Cổng Khảo thí.</div>'}</section><section class="wb-next-action"><h2>Bridge</h2><p>Kết quả từ Exam chỉ có thể quay về Learning Profile khi contract tích hợp chính thức được cung cấp.</p><a href="/learning/path" class="wb-btn wb-btn-outline">Learning Path</a><a href="/practice" class="wb-btn wb-btn-outline">Practice</a></section>`,
  }));
}

export async function renderExamDetailPage({ db, user, examSlug }) {
  const ex = await db.prepare("SELECT * FROM wb_examinations WHERE slug=? AND review_status='published'").bind(examSlug).first();
  if (!ex) return htmlResponse(renderPublicPage({ title: 'Không tìm thấy đánh giá', currentPath: `/examinations/${examSlug}`, user, contentHtml: '<section class="wb-alert wb-alert-info"><h1>Không tìm thấy assessment đã phát hành</h1><p>Quay lại danh sách assessment hoặc mở Cổng Khảo thí.</p><a href="/examinations" class="wb-btn wb-btn-outline">Danh sách đánh giá</a></section>' }), 404);
  const skills = safeJson(ex.skills_json, []);
  const action = user
    ? '<a data-wb-handoff href="https://exam.wordbridge.io.vn/" class="wb-btn wb-btn-primary">Tiếp tục tại Cổng Khảo thí</a>'
    : `<a href="${signInUrl(`/examinations/${ex.slug}`, 'exam.start')}" class="wb-btn wb-btn-primary">Đăng nhập để bắt đầu</a>`;
  return htmlResponse(renderPublicPage({
    title: ex.title_vi, currentPath: `/examinations/${examSlug}`, breadcrumbs: [{ label: 'Khảo thí', href: '/examinations' }, { label: ex.title_vi }], user,
    contentHtml: `<section class="wb-learning-landing"><p class="wb-eyebrow">${escapeHtml(ex.framework_reference)} · ${escapeHtml(ex.level_ref)}</p><h1 data-learning-content>${escapeHtml(ex.title_vi)}</h1><p data-learning-content>${escapeHtml(ex.instructions_vi)}</p></section><dl class="wb-reference-facts"><div><dt>Ngôn ngữ</dt><dd>${escapeHtml(ex.language_code.toUpperCase())}</dd></div><div><dt>Thời lượng tham chiếu</dt><dd>${escapeHtml(String(ex.duration_minutes))} phút</dd></div><div><dt>Chủ đề</dt><dd>${escapeHtml(ex.topic)}</dd></div><div><dt>Kỹ năng</dt><dd>${skills.length ? skills.map((s) => escapeHtml(s)).join(', ') : 'Không có metadata kỹ năng'}</dd></div></dl><section class="wb-alert wb-alert-info"><p>${escapeHtml(ex.disclaimer_vi || 'Kết quả chỉ phục vụ học tập.')}</p></section>${action}`,
  }));
}

export async function renderExamAttemptPage({ user }) {
  return redirectResponse(user ? 'https://exam.wordbridge.io.vn/' : signInUrl('/examinations', 'exam.start'));
}
export async function renderExamResultPage({ user }) {
  return redirectResponse(user ? 'https://exam.wordbridge.io.vn/tra-cuu' : signInUrl('/examinations', 'exam.results'));
}
export async function renderExamHistoryPage({ user }) {
  return redirectResponse(user ? 'https://exam.wordbridge.io.vn/my-exams' : signInUrl('/examinations', 'exam.history'));
}
