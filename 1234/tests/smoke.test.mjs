import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { pathToFileURL } from 'node:url';
import { renderTemplate, listEmailTemplates } from '../src/email.js';
import { sanitizeHtml } from '../src/core.js';

const root = new URL('../', import.meta.url).pathname;
const read = p => readFile(join(root,p),'utf8');
async function allFiles(dir=root){
  const out=[];
  for(const ent of await readdir(dir,{withFileTypes:true})){
    const abs=join(dir,ent.name);
    if(ent.isDirectory())out.push(...await allFiles(abs)); else out.push(relative(root,abs));
  }
  return out;
}

test('package stays within 70 files and contains no reference PDF/page renders',async()=>{
  const files=await allFiles();
  assert.ok(files.length<=70,`expected <=70 files, got ${files.length}`);
  assert.equal(files.some(f=>/design-reference|WORD_BRIDGE_42|page-\d+\.(png|jpe?g|webp)$/i.test(f)),false);
  assert.equal(files.some(f=>/\.(pdf|webp|png|jpe?g)$/i.test(f)),false,'No PDF or extracted reference images should be shipped');
  assert.equal(files.some(f=>f.includes('node_modules/')||f.startsWith('.git/')),false);
});

test('Cloudflare bindings use the owner-supplied existing resources',async()=>{
  const c=await read('wrangler.toml');
  assert.match(c,/^name\s*=\s*"wordbridge"/m);
  assert.match(c,/^workers_dev\s*=\s*false/m);
  assert.match(c,/^preview_urls\s*=\s*false/m);
  assert.match(c,/binding\s*=\s*"ASSETS"/);
  assert.match(c,/binding\s*=\s*"DB"[\s\S]*?database_name\s*=\s*"word"[\s\S]*?database_id\s*=\s*"ce84cc48-6d49-409b-b45a-13ba3bc4a771"/);
  assert.match(c,/binding\s*=\s*"R2"[\s\S]*?bucket_name\s*=\s*"word"/);
  assert.doesNotMatch(c,/REPLACE_WITH|word-bridge/);
});

test('product identity and primary routes stay within one origin',async()=>{
  const app=await read('public/assets/app.js');
  const worker=await read('worker.js');
  for(const route of ['/khao-thi','/quan-tri','/hoc-tap','/ket-noi','/tin-nhan','/cong-dong','/to-chuc','/tai-nguyen'])assert.ok(app.includes(route),`missing route ${route}`);
  assert.match(app,/WORD BRIDGE/);
  assert.doesNotMatch(`${app}\n${worker}`,/VIPRO|Vipro|\/su-kien/);
  const html=await read('public/index.html');
  assert.doesNotMatch(html,/<script[^>]+src=["']https?:/i);
  assert.doesNotMatch(html,/<img[^>]+src=["']https?:/i);
});

test('schema migrations are additive and provide the required domains',async()=>{
  const files=(await readdir(join(root,'migrations'))).filter(x=>x.endsWith('.sql')).sort();
  assert.deepEqual(files,['0001_initial.sql','0002_seed_practice.sql','0003_group_conversations.sql','0004_ecosystem.sql']);
  const sql=await Promise.all(files.map(x=>read(`migrations/${x}`)));
  const all=sql.join('\n');
  for(const t of ['users','sessions','profiles','practice_sets','practice_results','vocabulary_decks','posts','comments','groups','friendships','conversations','messages','organizations','organization_applications','subscriptions','payment_orders','payment_transactions','refunds','exams','question_bank','exam_attempts','exam_answers','anti_cheat_events','cms_pages','cms_revisions','maintenance_windows','email_queue','support_tickets','audit_logs'])
    assert.match(all,new RegExp(`CREATE TABLE IF NOT EXISTS ${t}\\b`),`schema missing ${t}`);
  assert.match(sql[2],/ALTER TABLE conversations ADD COLUMN group_id/);
  assert.doesNotMatch(all,/DROP\s+(TABLE|COLUMN|INDEX)/i);
});

test('29 independent email HTML templates exist and render without unresolved tokens',async()=>{
  const expected=listEmailTemplates().map(x=>x.code).sort();
  const disk=(await readdir(join(root,'public/email-templates'))).filter(x=>x.endsWith('.html')).map(x=>x.replace(/\.html$/,'')).sort();
  assert.equal(expected.length,29);
  assert.deepEqual(disk,expected);
  const contents=await Promise.all(disk.map(x=>read(`public/email-templates/${x}.html`)));
  assert.ok(new Set(contents).size===29,'Email template HTML structures must be independent');
  const env={APP_ORIGIN:'https://wordbridge.io.vn',ASSETS:{fetch:async req=>{
    const path=new URL(req.url).pathname.replace(/^\//,'');
    try{return new Response(await readFile(join(root,'public',path),'utf8'),{status:200});}
    catch{return new Response('missing',{status:404});}
  }}};
  for(const code of disk){
    const html=await renderTemplate(env,code,{name:'<script>alert(1)</script>',message:'Nội dung <b>không tin cậy</b>',code:'12345678',ticketCode:'WB-123'});
    assert.doesNotMatch(html,/\{\{\{?[A-Z_]+\}\}\}?/);
    assert.doesNotMatch(html,/<script>alert\(1\)<\/script>/);
    assert.match(html,/https:\/\/wordbridge\.io\.vn\//);
  }
  await assert.rejects(()=>renderTemplate(env,'welcome',{url:'https://evil.example/'}),/website WORD BRIDGE/);
});

test('CMS sanitizer removes script/event handlers and unsafe URLs but keeps Word-like formatting',()=>{
  const html=sanitizeHtml('<h1 style="color:#146466">Hello</h1><p onclick="steal()">Text <strong>bold</strong><a href="javascript:alert(1)">bad</a><img src="https://ok.example/a.png" onerror="steal()"></p><script>alert(1)</script><table><tr><td>Cell</td></tr></table>');
  assert.match(html,/<h1 style="color:#146466">Hello<\/h1>/);
  assert.match(html,/<strong>bold<\/strong>/);
  assert.match(html,/<table>/);
  assert.doesNotMatch(html,/script|onclick|onerror|javascript:/i);
});

test('member learning assistant is server-side and provider gated',async()=>{
  const assistant=await read('src/assistant.js');
  const app=await read('public/assets/app.js');
  assert.match(assistant,/AI_API_KEY/);
  assert.match(assistant,/api\.openai\.com|AI_API_URL/);
  assert.match(app,/assistant-ask/);
  assert.doesNotMatch(await read('public/index.html'),/openai|chatgpt/i);
});

test('friend search, chat group, message edit/recall and safe attachments have matching API handlers',async()=>{
  const community=await read('src/community.js');
  const app=await read('public/assets/app.js');
  assert.match(community,/path===\'\/api\/people\'/);
  assert.match(community,/join\|members\|conversation/);
  assert.match(community,/canAccessConversation/);
  assert.match(community,/method===\'PUT\'/);
  assert.match(community,/method===\'DELETE\'/);
  assert.match(community,/scan_status=\'clean\'/);
  assert.match(app,/group-chat/);
  assert.match(app,/send-message/);
  assert.match(app,/message-edit/);
  assert.match(app,/message-recall/);
  assert.match(app,/uploaded\.scanStatus!=='clean'/);
});

test('organization owner is pending until application approval',async()=>{
  const org=await read('src/organizations.js');
  assert.match(org,/VALUES\(\?,\?,\'owner\',\'pending\'\)/);
  assert.match(org,/organization_members SET status=\?/);
  assert.match(org,/status===\'approved\'\?'active':'pending'/);
  assert.match(org,/registryLookup/);
});

test('exam API includes server deadline, autosave/recovery and evidence-event handling',async()=>{
  const exam=await read('src/exams.js');
  const app=await read('public/assets/app.js');
  assert.match(exam,/expires_at/);
  assert.match(exam,/exam_answers/);
  assert.match(exam,/anti_cheat_events/);
  assert.match(app,/attempts\/.*\/answers/);
  assert.match(app,/visibilitychange/);
});

test('email addresses are consistently separated by business purpose',async()=>{
  const combined=[await read('src/email.js'),await read('src/platform.js'),await read('README.md'),await read('public/assets/app.js')].join('\n');
  for(const email of ['noreply@wordbridge.io.vn','wordbridge.education@gmail.com','cskh@wordbridge.io.vn','contact@wordbridge.io.vn'])assert.ok(combined.includes(email),`missing ${email}`);
});

test('maintenance uses global, per-service and scheduled D1 controls',async()=>{
  const worker=await read('worker.js');
  const platform=await read('src/platform.js');
  assert.match(worker,/maintenance_global/);
  assert.match(worker,/service_status/);
  assert.match(worker,/maintenance_windows/);
  assert.match(platform,/maintenance\/schedule/);
  assert.match(platform,/service_status/);
});
