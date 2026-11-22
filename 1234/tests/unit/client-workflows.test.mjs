/** Event-level tests. Elements and media capabilities below are test doubles, not browser QA. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

function element() {
  const selectors=new Map();
  const attributes=new Map();
  return {
    selectors, attributes, dataset:{}, style:{}, hidden:false, disabled:false,
    querySelector:s=>selectors.get(s)||null, querySelectorAll:()=>[],
    closest:s=>selectors.get(s)||null, matches:s=>!!selectors.get(s),
    getAttribute:s=>attributes.get(s)||null, hasAttribute:s=>attributes.has(s),
    setAttribute:(s,v)=>attributes.set(s,v),removeAttribute:s=>attributes.delete(s),
    appendChild(){},remove(){},focus(){},
  };
}
function client() {
  const handlers=new Map();
  const nodes=new Map();
  const toast=element();
  const document={
    body:element(),documentElement:element(),title:'Tìm kiếm',cookie:'',
    querySelector:s=>nodes.get(s)||null,
    querySelectorAll:s=>nodes.has(s)?[nodes.get(s)]:[],
    createTreeWalker:()=>({nextNode:()=>false}),
    getElementById:s=>s==='wb-toast-root'?toast:nodes.get(s),
    createElement:element,
    addEventListener(name,fn){handlers.set(name,[...(handlers.get(name)||[]),fn]);},
    dispatchEvent(){},
  };
  const location=new URL('https://wordbridge.io.vn/vocabulary/review?mode=reverse');
  const context={document,URL,Blob,Event,Date,Math,DOMException,location,
    navigator:{},NodeFilter:{SHOW_TEXT:4},MutationObserver:class {observe(){}},
    localStorage:{getItem(){},setItem(){}},setTimeout(){},setInterval(){},clearInterval(){},
  };
  context.window=context;
  vm.createContext(context);
  for(const name of ['i18n','app'])vm.runInContext(fs.readFileSync('public/scripts/'+name+'.js','utf8'),context);
  async function emit(type,target,attributes={}) {
    for(const handle of handlers.get(type)||[]) await handle({target,preventDefault(){},...attributes});
  }
  return {emit,nodes,context,document};
}

test('V4 client: keyboard reveals, VI/EN switch preserves reveal and URL, failed grade stays retryable',async()=>{
  const {emit,nodes,context,document}=client();
  const card=element(), deck=element(), form=element(), back=element(), front=element();
  const reveal=element(),grade=element(),quality=element(),status=element(),selector=element();
  nodes.set('[data-wb-study-card]',card);
  nodes.set('[data-wb-study-deck]',deck);
  card.selectors.set('[data-wb-back]',back);
  card.selectors.set('[data-wb-front]',front);
  card.selectors.set('[data-wb-reveal]',reveal);
  card.selectors.set('[data-wb-review-form]',form);
  card.selectors.set('[data-wb-grade="4"]',grade);
  form.selectors.set('[name=quality]',quality);
  form.selectors.set('[data-form-status]',status);
  form.selectors.set('form[data-api-endpoint]',form);
  form.selectors.set('[data-wb-study-card]',card);
  form.setAttribute('data-api-endpoint','/api/v1/vocabulary/review');
  form.setAttribute('data-wb-review-form','');
  grade.setAttribute('data-wb-grade','4');
  grade.selectors.set('[data-wb-study-card]',card);
  grade.selectors.set('[data-wb-grade]',grade);
  back.hidden=form.hidden=true;
  await emit('keydown',card,{code:'Space'});
  assert.equal(back.hidden,false);
  assert.equal(form.hidden,false);
  selector.selectors.set('[data-wb-locale]',selector);
  for(const locale of ['en','vi']){
    selector.value=locale;
    await emit('change',selector);
    assert.equal(document.documentElement.lang,locale);
    assert.equal(back.hidden,false);
    assert.equal(context.location.search,'?mode=reverse');
  }
  let pending;
  grade.click=()=>{pending=emit('click',grade);};
  let submission;
  form.requestSubmit=()=>{submission=emit('submit',form);};
  context.FormData=class {entries(){return [['quality',quality.value],['notebookItemId','qa-card']];}};
  context.fetch=async()=>{throw Error('offline');};
  await emit('keydown',card,{key:'3'});await pending;await submission;
  assert.equal(quality.value,'4');
  assert.equal(status.className,'wb-alert wb-alert-error');
  assert.ok(nodes.has('[data-wb-study-card]'));
  context.fetch=async()=>Response.json({ok:true});
  card.remove=()=>nodes.delete('[data-wb-study-card]');
  await emit('keydown',card,{key:'3'});await pending;await submission;
  assert.equal(nodes.has('[data-wb-study-card]'),false);
  assert.match(deck.textContent,/hoàn thành/);
});

test('V4 client: microphone unsupported, denied, missing, cancel while waiting, stop, playback, retry',async()=>{
  const {emit,context}=client();
  const scope=element(),toggle=element(),retry=element(),audio=element(),status=element();
  for(const btn of [toggle,retry])btn.selectors.set('.wb-recorder-studio,.wb-pronunciation-lab',scope);
  toggle.selectors.set('[data-wb-record-toggle]',toggle);
  retry.selectors.set('[data-wb-record-retry]',retry);
  scope.selectors.set('[data-wb-record-toggle]',toggle);
  scope.selectors.set('[data-wb-record-status]',status);
  scope.selectors.set('audio',audio);
  await emit('click',toggle);
  assert.match(status.textContent,/không hỗ trợ/);
  let recorder,stopped=0;
  const stream={getTracks:()=>[{stop:()=>stopped++}]};
  context.MediaRecorder=class {
    constructor(){recorder=this;this.mimeType='audio/webm';}
    start(){this.state='recording';}
    stop(){this.state='inactive';this.ondataavailable({data:new Blob(['test audio bytes'])});this.onstop();}
  };
  for(const [name,expected] of [['NotAllowedError',/quyền/],['NotFoundError',/khả dụng/]]){
    context.navigator.mediaDevices={getUserMedia:async()=>{throw new DOMException('Test',name);}};
    await emit('click',toggle);
    assert.match(status.textContent,expected);
  }
  let grant;
  context.navigator.mediaDevices.getUserMedia=()=>new Promise(resolve=>{grant=resolve;});
  const waiting=emit('click',toggle);
  while(!grant) await Promise.resolve();
  await emit('click',retry);grant(stream);await waiting;
  assert.equal(stopped,1);
  context.navigator.mediaDevices.getUserMedia=async()=>stream;
  await emit('click',toggle);assert.equal(recorder.state,'recording');
  await emit('click',toggle);assert.match(audio.src,/^blob:/);assert.equal(audio.hidden,false);
  await emit('click',retry);assert.equal(audio.hidden,true);assert.equal(stopped>=2,true);
});

test('V4 client: touch swipe advances the deck and resets the revealed side',async()=>{
  const {emit,document}=client();
  const makeCard=()=>{
    const card=element();
    card.selectors.set('[data-wb-study-card]',card);
    for(const selector of ['[data-wb-back]','[data-wb-front]','[data-wb-review-form]','[data-wb-reveal]','.wb-study-surface'])card.selectors.set(selector,element());
    return card;
  };
  const cards=[makeCard(),makeCard()];
  cards[1].hidden=true;
  document.querySelectorAll=s=>s==='[data-wb-study-card]'?cards:[];
  await emit('touchstart',cards[0],{changedTouches:[{screenX:250}]});
  await emit('touchend',cards[0],{changedTouches:[{screenX:45}]});
  assert.equal(cards[0].hidden,true);
  assert.equal(cards[1].hidden,false);
  assert.equal(cards[1].querySelector('[data-wb-review-form]').hidden,true);
});
