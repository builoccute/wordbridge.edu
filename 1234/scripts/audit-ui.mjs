/** Source inventory. Print one candidate per file/value/category for human review. */
import fs from 'node:fs';
import vm from 'node:vm';

const context={window:{}};
vm.runInNewContext(fs.readFileSync('public/scripts/i18n.js','utf8'),context);
const {phrases,vi,en,vietnamese}=context.window.WB_I18N;
const registered=new Set([...Object.keys(phrases),...Object.values(phrases),
  ...Object.values(vi),...Object.values(en),...Object.keys(vietnamese),...Object.values(vietnamese)]);
function walk(path) {
  return fs.readdirSync(path,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?walk(path+'/'+entry.name):path+'/'+entry.name);
}
const patterns={
  text:/>([^<>`$\n]{1,500})</g,
  attribute:/(?:aria-label|placeholder|title|alt)="([^"$<>]+)"/g,
  title:/\btitle:\s*'([^'<>]+)'/g,
  message:/\b(?:textContent|message|error|messageVi)\s*[:=]\s*'([^'<>]+)'/g,
  template:/>([^<>\n]*?\$\{[^<>\n]+?\}[^<>\n]*?)</g,
};
const invariants=/^(?:VI|EN|ZH|RU|IPA|IP|Email:?|Passkey|WORD BRIDGE|© \d{4} WORD BRIDGE|中文|Русский|[−+\d.]+[sx×]|[a-z.]+\.vn|\/[-/\w]+|Where Languages Bring People Together\.)$/;
for(const file of [...walk('src'),...walk('public'),...walk('email')].filter(f=>/\.(?:m?js|html|css)$/.test(f) && !f.endsWith('/i18n.js'))) {
  const source=fs.readFileSync(file,'utf8'), seen=new Set();
  for(const [kind,pattern] of Object.entries(patterns)) for(const match of source.matchAll(pattern)) {
    const phrase=match[1].trim(),key=kind+phrase;
    if(!/[\p{L}]/u.test(phrase)||seen.has(key)||registered.has(phrase)||invariants.test(phrase)) continue;
    seen.add(key);
    const group=file.endsWith('.mjs')?'historical':file.startsWith('email/')?'email-template':kind==='template'?'dynamic-expression':'manual-review';
    console.log(JSON.stringify({file,line:source.slice(0,match.index).split('\n').length,kind,group,phrase}));
  }
}
