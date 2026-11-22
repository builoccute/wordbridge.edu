import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import worker from '../../src/index.js';
import { createTestEnv } from '../helpers/sqlite-d1-shim.js';
import { ECOSYSTEM, signInUrl, TRANSLATIONS, normalizeUiLocale } from '../../src/config/constants.js';

async function run(path, env) {
  return worker.fetch(new Request('https://wordbridge.io.vn' + path), env, {});
}

test('V4: global shell uses monochrome SVG navigation, proper links and exactly two locale options', async () => {
  const env = await createTestEnv();
  try {
    const res = await run('/', env);
    const html = await res.text();
    assert.equal(res.status, 200);
    assert.match(html, /data-wb-locale/);
    assert.match(html, /<option value="vi">VI<\/option><option value="en">EN<\/option>/);
    assert.match(html, /<svg[^>]*stroke="currentColor"/);
    assert.match(html, /\/branding\/logo-wordbridge.svg/);
    assert.equal(html.includes('href="#"'), false);
    assert.equal(html.includes('10.000+'), false);
    assert.deepEqual(Object.keys(TRANSLATIONS).sort(), ['en','vi']);
    assert.equal(normalizeUiLocale('ru'), 'vi');
  } finally { env.DB.close(); }
});

test('V4: public practice view has no fake fallback, no guest recorder, and skill views do not mix content', async () => {
  const env = await createTestEnv();
  try {
    for (const skill of ['listening','speaking','reading','writing','vocabulary','grammar']) {
      const res = await run('/practice/' + skill, env);
      assert.equal(res.status, 200);
      const html = await res.text();
      assert.equal(html.includes('ex_fallback_'), false);
      assert.equal(html.includes('data-wb-record-toggle'), false);
    }
  } finally { env.DB.close(); }
});

test('V4: public dictionary view; interactive queries require auth and safe return_to', async () => {
  const env = await createTestEnv();
  try {
    const page = await run('/dictionary', env);
    assert.equal(page.status, 200);
    const query = await run('/dictionary?q=bridge', env);
    assert.equal(query.status, 302);
    assert.ok(query.headers.get('location').startsWith('https://portal.wordbridge.io.vn/login?'));
    const api = await run('/api/v1/dictionary/search?q=bridge', env);
    assert.equal(api.status, 401);
    const login = new URL(signInUrl('/dictionary?q=bridge', 'dictionary.search'));
    assert.equal(login.searchParams.get('next'), 'https://wordbridge.io.vn/dictionary?q=bridge');
    assert.equal(login.searchParams.get('intent'), 'dictionary.search');
    assert.equal(new URL(signInUrl('https://evil.example/')).searchParams.get('next'), ECOSYSTEM.main + '/');
  } finally { env.DB.close(); }
});

test('V4: removed legacy routes return 410 and local management forwards to control plane', async () => {
  const env = await createTestEnv();
  try {
    for (const path of ['/social','/friends','/organizations','/account/subscription']) assert.equal((await run(path, env)).status, 410);
    const admin = await run('/admin', env);
    assert.equal(admin.status, 302);
    assert.equal(admin.headers.get('location'), ECOSYSTEM.control);
    assert.equal((await run('/page-does-not-exist',env)).status, 404);
  } finally { env.DB.close(); }
});

test('V4: infrastructure exceptions surface 500, not a misleading success page', async () => {
  const res = await run('/styles/design-system.css', { ASSETS: { fetch() { throw new Error('TEST_ASSET_BACKEND_FAILED'); } } });
  assert.equal(res.status, 500);
  const html = await res.text();
  assert.match(html, /không thể xử lý yêu cầu/);
});

test('V4: all 12 specialized data sources and all SQL migrations survive cleanup', async () => {
  const folder = 'public/data/vocab/';
  const {domains} = JSON.parse(fs.readFileSync(folder+'index.json'));
  assert.equal(new Set(domains.map(domain=>domain.slug)).size,12);
  const env={STATIC_ASSETS_LOADER: async path=>({body:fs.readFileSync('.'+path)})};
  let records=0;
  for(const domain of domains) {
    const res=await run('/data/vocab/'+domain.slug+'.json',env);
    assert.equal(res.status,200);
    const parsed=await res.json();
    assert.ok(Array.isArray(parsed.words));
    assert.equal(parsed.words.length,domain.count);
    records+=parsed.words.length;
  }
  assert.equal(records,12104);
  const migrations=fs.readdirSync('database/migrations').filter(name=>name.endsWith('.sql'));
  assert.equal(migrations.length, 16);
});

test('V4 replacement: /admin and /help ownership handoffs are explicit and path-safe', async () => {
  const env = await createTestEnv();
  try {
    const admin = await run('/admin', env);
    assert.equal(admin.status, 302);
    assert.equal(new URL(admin.headers.get('location')).origin, ECOSYSTEM.control);
    const nested = await run('/admin/curriculum?locale=en', env);
    assert.equal(nested.status, 302);
    const target = new URL(nested.headers.get('location'));
    assert.equal(target.origin, ECOSYSTEM.control);
    assert.equal(target.pathname, '/admin/curriculum');
    const help = await run('/help', env);
    assert.equal(help.status, 302);
    assert.equal(new URL(help.headers.get('location')).origin, ECOSYSTEM.help);
  } finally { env.DB.close(); }
});

test('V4: primary learning systems render from the real Worker entrypoint', async () => {
  const env = await createTestEnv();
  try {
    for (const path of ['/learning','/learning/path','/learning/skills','/skills/vocabulary','/skills/grammar','/skills/listening','/skills/speaking','/skills/pronunciation','/skills/reading','/skills/writing','/practice','/dictionary','/specialized','/examinations','/learner-meet','/reader','/search']) {
      const res = await run(path, env);
      assert.equal(res.status, 200, path);
      const html = await res.text();
      assert.equal(/fake success/i.test(html), false, path);
    }
  } finally { env.DB.close(); }
});

test('V4: personal knowledge systems are server-protected and public actions use sign-in handoff', async () => {
  const env = await createTestEnv();
  try {
    for (const path of ['/my-knowledge','/my-mistakes','/vocabulary/notebook','/vocabulary/flashcards','/vocabulary/review','/practice/history']) {
      const res = await run(path, env);
      assert.equal(res.status, 302, path);
      const location = new URL(res.headers.get('location'));
      assert.equal(location.origin, ECOSYSTEM.portal, path);
      assert.ok(location.searchParams.get('next')?.startsWith(ECOSYSTEM.main + '/'), path);
    }
    const meet = await run('/learner-meet', env);
    const meetHtml = await meet.text();
    assert.match(meetHtml, /portal\.wordbridge\.io\.vn\/login/);
    assert.doesNotMatch(meetHtml, /href="https:\/\/portal\.wordbridge\.io\.vn\/meet" class="wb-btn wb-btn-primary"/);
    const reader = await run('/reader', env);
    assert.match(await reader.text(), /portal\.wordbridge\.io\.vn\/login/);
  } finally { env.DB.close(); }
});

test('V4: examination discovery uses existing schema and never depends on removed columns', async () => {
  const env = await createTestEnv();
  try {
    const page = await run('/examinations', env);
    assert.equal(page.status, 200);
    const html = await page.text();
    assert.match(html, /CEFR A1/);
    assert.match(html, /exam\.wordbridge\.io\.vn/);
    assert.doesNotMatch(html, /undefined/);
    const detail = await run('/examinations/cefr-a1-reference-diagnostic', env);
    assert.equal(detail.status, 200);
    assert.match(await detail.text(), /Kết quả chỉ mang tính tham chiếu|không phải chứng chỉ/i);
  } finally { env.DB.close(); }
});

test('V4: shell cross-domain links go through local discovery entries and icon UI is SVG-only', async () => {
  const env = await createTestEnv();
  try {
    const res = await run('/', env);
    const html = await res.text();
    assert.match(html, /href="\/learner-meet"/);
    assert.match(html, /href="\/reader"/);
    assert.match(html, /href="\/examinations"/);
    assert.doesNotMatch(html, /<button[^>]*wb-dialog-close[^>]*>\s*[×✕]/);
    assert.doesNotMatch(html, /href="#"/);
  } finally { env.DB.close(); }
});

test('V4: current product UI does not reintroduce legacy plans, B2B or social-network routes', async () => {
  const env = await createTestEnv();
  try {
    const accountSource = fs.readFileSync('src/pages/account-pages.js', 'utf8');
    assert.doesNotMatch(accountSource, /PERSONAL_FREE|PERSONAL_PLUS|VIP|Gói hiện tại/);
    for (const path of ['/organizations','/social','/friends','/feed','/account/subscription']) {
      assert.equal((await run(path, env)).status, 410);
    }
  } finally { env.DB.close(); }
});

test('V4: central Auth Gate intercepts public actions and anonymous search forms preserve intent', async () => {
  const env = await createTestEnv();
  try {
    const home = await run('/', env);
    const homeHtml = await home.text();
    assert.match(homeHtml, /id="wb-auth-gate"/);
    assert.match(homeHtml, /portal\.wordbridge\.io\.vn\/login\?next=/);

    const search = await run('/search', env);
    assert.match(await search.text(), /data-auth-intent="global\.search"/);
    const dictionary = await run('/dictionary', env);
    assert.match(await dictionary.text(), /data-auth-intent="dictionary\.search"/);

    const client = fs.readFileSync('public/scripts/app.js', 'utf8');
    assert.match(client, /window\.WB_AUTH = Object\.freeze/);
    assert.match(client, /a\[href\^=.*portal\.wordbridge\.io\.vn\/login/);
    assert.match(client, /form\[data-auth-intent\]/);
    assert.match(client, /safeReturnUrl/);
    assert.match(client, /url\.searchParams\.set\('locale'/);
  } finally { env.DB.close(); }
});

import {AuthService} from '../../src/services/auth-service.js';

async function learnerFixture(t) {
  const env=await createTestEnv({STATIC_ASSETS_LOADER: async path => ({body:fs.readFileSync('.'+path)})});
  t.after(()=>env.DB.close());
  const auth=new AuthService(env.DB,null,env);
  const accountId='acceptance-student';
  await env.DB.prepare("INSERT INTO wb_accounts(id,email,full_name,date_of_birth,phone_number,school_name,workplace_name,status) VALUES (?,'learner@example.invalid','Acceptance','2000-01-01','','','','active')").bind(accountId).run();
  const session=await auth.createSession(accountId);
  function request(path,body) {
    return worker.fetch(new Request(ECOSYSTEM.main+path,{
      method:body?'POST':'GET',
      headers:{cookie:'wb_session='+session.rawSessionToken,'X-CSRF-Token':session.csrfToken,'Content-Type':'application/json'},
      body:body ? JSON.stringify(body) : undefined,
    }),env,{});
  }
  return {env,request,accountId};
}

test('V4 specialized term → notebook → flashcard → grade → persisted due queue and knowledge',async t=>{
  const {env,request}=await learnerFixture(t);
  const path='/api/v1/vocabulary/notebook';
  const term={domain:'cat-got-kim-loai',term:1};
  const save=await request(path,term);
  assert.equal(save.status,201);
  const {id}=await save.json();
  assert.equal((await (await request(path,term)).json()).id,id);
  const getItems=async()=> (await (await request(path)).json()).items;
  assert.equal((await getItems())[0].headword,'metal cutting');
  assert.match(await (await request('/vocabulary/review')).text(),/data-wb-study-card/);
  assert.match(await (await request('/vocabulary/flashcards?mode=specialized')).text(),/metal cutting/);
  const grade=(quality)=>request('/api/v1/vocabulary/review',{notebookItemId:id,quality});
  assert.equal((await grade(98)).status,422);
  assert.equal((await getItems())[0].repetitions,0);
  const res=await grade(4);
  assert.equal(res.status,200);
  assert.equal((await res.json()).repetitions,1);
  const [row]=await getItems();
  assert.ok(row.next_review_at>row.last_reviewed_at);
  assert.doesNotMatch(await (await request('/vocabulary/review')).text(),/data-wb-study-card/);
  assert.match(await (await request('/my-knowledge')).text(),/metal cutting/);
  assert.match(await (await request('/vocabulary/flashcards')).text(),/metal cutting/);
  const entry=await request('/dictionary/english/term-cat-got-kim-loai-1');
  assert.match(await entry.text(),/cắt gọt kim loại/);
  await env.DB.exec("CREATE TRIGGER reject_grade BEFORE UPDATE ON wb_vocabulary_notebook BEGIN SELECT RAISE(ABORT,'offline'); END;");
  const failure=await grade(5);
  assert.equal(failure.status,503);
  assert.equal((await failure.json()).ok,false);
  assert.equal((await getItems())[0].repetitions,1);
});

test('V4 published exercises stay on their own route and submissions drive errors, history, home and results',async t=>{
  const {env,request}=await learnerFixture(t);
  const rows=(await env.DB.prepare('SELECT * FROM wb_practice_exercises').all()).results;
  for (const skill of ['grammar','vocabulary','listening','reading','speaking','writing']) {
    const html=await (await request('/practice/'+skill)).text();
    for(const exercise of rows) assert.equal(html.includes('value="'+exercise.id+'"'),exercise.skill===skill,skill+' '+exercise.id);
    if(skill==='reading') assert.match(html,/<blockquote>/);
    if(skill==='speaking') assert.match(html,/data-wb-record-retry/);
  }
  const submit=(exerciseId,answers)=>request('/api/v1/practice/submit',{exerciseId,answers});
  assert.equal((await submit('pex_en_wrt_1',{qb_en_2:'  '})).status,422);
  const written=await (await submit('pex_en_wrt_1',{qb_en_2:'Please confirm receipt of the revised shipment schedule.'})).json();
  assert.equal(written.gradingStatus,'pending_manual_review');
  assert.equal(written.score,null);
  const persisted=await (await request('/api/v1/practice/results/'+written.resultId)).json();
  assert.match(JSON.stringify(persisted),/revised shipment schedule/);
  const wrong=await (await submit('pex_en_grm_1',{qb_en_1:'study'})).json();
  assert.equal(wrong.feedback[0].correct,false);
  assert.match(await (await request('/my-mistakes')).text(),/She ___ English every evening/);
  assert.match(await (await request('/practice/history')).text(),new RegExp(wrong.resultId));
  assert.match(await (await request('/learning')).text(),new RegExp(wrong.resultId));
  assert.match(await (await request('/practice/results/'+wrong.resultId)).text(),/href="\/practice\/grammar"/);
  assert.match(await (await run('/learning',env)).text(),/Khám phá trước khi đăng nhập/);
});

test('V4 course completion requires all published lessons in its course',async t=>{
  const {env,request,accountId}=await learnerFixture(t);
  const rows=(await env.DB.prepare("SELECT l.id,w.course_id FROM wb_lessons l JOIN wb_weeks w ON w.id=l.week_id WHERE l.review_status='published' ORDER BY w.course_id").all()).results;
  const group=rows.filter(r=>r.course_id===rows[0].course_id);
  assert.ok(group.length>1);
  async function add(row){await env.DB.prepare("INSERT INTO wb_learner_progress(id,account_id,course_id,lesson_id,status) VALUES (?,?,?,?,'completed')").bind('p-'+row.id,accountId,row.course_id,row.id).run();}
  await add(group[0]);
  assert.match(await (await request('/learning/path')).text(),/wb-path-step active/);
  for(const row of group.slice(1)) await add(row);
  assert.match(await (await request('/learning/path')).text(),/wb-path-step completed/);
});

test('V4 actionable requests require session and preserve locale and the original search',async t=>{
  const {env}=await learnerFixture(t);
  const search='/search?q=metal+cutting&category=dictionary&locale=en';
  const login=new URL((await run(search,env)).headers.get('location'));
  assert.equal(login.searchParams.get('next'),ECOSYSTEM.main+search);
  assert.equal(login.searchParams.get('locale'),'en');
  assert.equal(login.searchParams.get('intent'),'global.search');
  for(const path of ['vocabulary/notebook','vocabulary/review','practice/submit','support/tickets','lessons/notes']) {
    const res=await worker.fetch(new Request(ECOSYSTEM.main+'/api/v1/'+path,{method:'POST',body:'{}'}),env,{});
    assert.equal(res.status,401,path);
  }
  assert.equal((await run('/api/v1/dictionary/search?level=A1',env)).status,401);
  assert.equal((await run('/api/v1/audio/aud_en_w01_s1/stream',env)).status,401);
  for(const path of ['/admin/courses','/admin/programs','/admin/curriculum','/admin/lessons']) {
    const res=await run(path+'?locale=en',env);
    assert.equal(res.status,302);
    assert.equal(res.headers.get('location'),ECOSYSTEM.control+path+'?locale=en');
  }
});

test('V4 authenticated search and specialized filtering resolve real terms and preserve ownership',async t=>{
  const {request,env}=await learnerFixture(t);
  const path='/api/v1/specialized/terms?domain=cat-got-kim-loai&q=metal+cutting';
  assert.equal((await run(path,env)).status,401);
  const data=await (await request(path)).json();
  assert.ok(data.total>0);
  assert.equal(data.words[0].w,'metal cutting');
  const empty=await (await request(path+'&topic=no-such-topic')).json();
  assert.equal(empty.total,0);
  assert.equal((await request('/api/v1/specialized/terms?domain=unknown')).status,404);
  const first=await env.DB.prepare("SELECT headword,slug FROM wb_dictionary_entries WHERE review_status='published' ORDER BY id LIMIT 1").first();
  const search=await request('/search?category=dictionary&q='+encodeURIComponent(first.headword));
  assert.match(await search.text(),new RegExp('/'+first.slug+'"'));
  assert.equal((await (await request('/api/v1/vocabulary/notebook')).json()).items.length,0);
  const body=await (await request('/learner-meet')).text();
  assert.match(body,/data-wb-handoff href="https:\/\/portal.wordbridge.io.vn\/meet"/);
  assert.match(await (await request('/examinations')).text(),/data-wb-handoff href="https:\/\/exam.wordbridge.io.vn\//);
});

test('V4 memory thresholds and correction on retry use saved evidence', async t=>{
  const {request,env}=await learnerFixture(t);
  const entry=await env.DB.prepare("SELECT id FROM wb_dictionary_entries WHERE review_status='published' LIMIT 1").first();
  const notebook=await (await request('/api/v1/vocabulary/notebook',{entryId:entry.id})).json();
  const grade=q=>request('/api/v1/vocabulary/review',{notebookItemId:notebook.id,quality:q});
  for(let n=1;n<=4;n++) {
    const value=await (await grade(5)).json();
    assert.equal(value.repetitions,n);
    assert.equal(value.masteryStatus,n===4?'mastered':n>=2?'reviewing':'learning');
  }
  assert.equal((await (await grade(1)).json()).repetitions,0);
  for(const answer of ['study','studies']){
    assert.equal((await request('/api/v1/practice/submit',{exerciseId:'pex_en_grm_1',answers:{qb_en_1:answer}})).status,201);
  }
  assert.match(await (await request('/my-mistakes')).text(),/Correct on retest/);
  const insights=await (await request('/practice/history')).text();
  assert.match(insights,/50%/);
  assert.match(insights,/Hoạt động theo tuần/);
  assert.match(insights,/Hoạt động theo kỹ năng/);
});

test('V4 published listening assets expose real metadata, pending assets stay unavailable',async t=>{
  const {request,env}=await learnerFixture(t);
  assert.equal((await request('/api/v1/audio/aud_en_w01_s1/stream')).status,404);
  // Isolated publication fixture, never change migrations or certify an audio file.
  await env.DB.prepare("UPDATE wb_audio_assets SET review_status='published' WHERE id=?").bind('aud_en_w01_s1').run();
  const html=await (await request('/practice/listening')).text();
  assert.match(html,/Please check the updated schedule/);
  assert.match(html,/data-audio-segment-end="8000"/);
  assert.match(html,/Chép chính tả/);
  assert.match(html,/data-audio-action="replay"/);
  const res=await request('/api/v1/audio/aud_en_w01_s1/stream');
  assert.equal(res.status,404);
  assert.equal((await res.json()).error.code,'AUDIO_ASSET_PENDING_UPLOAD');
});

test('V4 review rejects stale grades and the path distinguishes a lesson needing review',async t=>{
  const {env,request}=await learnerFixture(t);
  const entry=await env.DB.prepare("SELECT id FROM wb_dictionary_entries WHERE review_status='published' LIMIT 1").first();
  const {id}=await (await request('/api/v1/vocabulary/notebook',{entryId:entry.id})).json();
  const payload={notebookItemId:id,quality:4,expectedReview:''};
  assert.equal((await request('/api/v1/vocabulary/review',payload)).status,200);
  assert.equal((await request('/api/v1/vocabulary/review',payload)).status,409);
  const state=await env.DB.prepare('SELECT repetitions FROM wb_vocabulary_notebook WHERE id=?').bind(id).first();
  assert.equal(state.repetitions,1);
  assert.equal((await request('/api/v1/learning/progress',{lessonId:'les_zh_02_2',answers:{qb_zh_1:'wrong'}})).status,201);
  assert.match(await (await request('/learning/path')).text(),/wb-path-step review-needed/);
});
