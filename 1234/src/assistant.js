import {json,fail,readJson,clean,rateLimit} from './core.js';

const LANGS=new Set(['zh','en','ko','ja','ru']);
const PLAN_DAILY_LIMIT={free:5,plus:50,organization:100};

export async function handleLearningAssistant(req,env,path,user){
  if(path!=='/api/learning/assistant'||req.method!=='POST')return null;
  if(!user)return fail('Bạn cần đăng nhập để sử dụng trợ lý học tập.',401);
  if(!env.AI_API_KEY)return fail('Trợ lý học tập chưa được kết nối nhà cung cấp AI. Quản trị viên cần cấu hình AI_API_KEY và AI_API_URL.',503,{code:'AI_PROVIDER_NOT_CONFIGURED'});
  const body=await readJson(req,12000),prompt=clean(body.prompt,1800),language=clean(body.language,5);
  if(prompt.length<3)return fail('Hãy nhập câu hỏi cụ thể hơn.');
  if(!LANGS.has(language))return fail('Ngôn ngữ học tập không hợp lệ.');
  const rl=await rateLimit(env,`ai-assistant:${user.id}`,20,3600);
  if(!rl.ok)return fail('Bạn đã sử dụng quá nhiều lượt trong thời gian ngắn. Hãy thử lại sau.',429,{retryAfter:rl.retryAfter});
  const account=await env.DB.prepare('SELECT plan FROM users WHERE id=?').bind(user.id).first();
  const plan=String(account?.plan||'free').toLowerCase();
  const tier=plan.includes('organization')||plan.includes('org')?'organization':plan.includes('plus')?'plus':'free';
  const usage=await env.DB.prepare("SELECT COUNT(*) n FROM ai_usage WHERE user_id=? AND feature='learning_assistant' AND date(created_at)=date('now')").bind(user.id).first();
  const limit=PLAN_DAILY_LIMIT[tier];
  if(Number(usage?.n||0)>=limit)return fail(`Bạn đã dùng hết ${limit} lượt trợ lý hôm nay theo gói hiện tại.`,429,{dailyLimit:limit,used:Number(usage.n)});
  const languageName={zh:'tiếng Trung',en:'tiếng Anh',ko:'tiếng Hàn',ja:'tiếng Nhật',ru:'tiếng Nga'}[language];
  const context=clean(body.context,1200);
  const messages=[
    {role:'system',content:`Bạn là trợ lý thực hành ${languageName} của WORD BRIDGE. Trả lời bằng tiếng Việt, giải thích từ vựng, ngữ pháp, ngữ cảnh và gợi ý từng bước. Ưu tiên gợi ý để người học tự làm thay vì làm hộ toàn bộ bài. Không khẳng định dữ kiện không chắc chắn. Không yêu cầu hoặc tiết lộ dữ liệu cá nhân. Giới hạn câu trả lời ở mức hữu ích, dễ hiểu.`},
    {role:'user',content:`Ngữ cảnh bài thực hành (nếu có): ${context||'Không có'}\n\nCâu hỏi của người học: ${prompt}`}
  ];
  let response;
  try{
    response=await fetch(env.AI_API_URL||'https://api.openai.com/v1/chat/completions',{
      method:'POST',headers:{Authorization:`Bearer ${env.AI_API_KEY}`,'Content-Type':'application/json'},
      body:JSON.stringify({model:env.AI_MODEL||'gpt-4o-mini',messages,temperature:0.35,max_tokens:700}),
      signal:AbortSignal.timeout(20000)
    });
  }catch(e){return fail('Không thể kết nối dịch vụ trợ lý lúc này. Vui lòng thử lại sau.',502,{providerError:clean(e?.message,160)});}
  const payload=await response.json().catch(()=>({}));
  if(!response.ok)return fail('Nhà cung cấp trợ lý đang trả lỗi. Chưa ghi nhận lượt sử dụng.',502,{providerStatus:response.status});
  const answer=clean(payload.choices?.[0]?.message?.content||payload.output_text||'',5000);
  if(!answer)return fail('Nhà cung cấp không trả về nội dung giải thích.',502);
  await env.DB.prepare('INSERT INTO ai_usage(id,user_id,feature,model,input_tokens,output_tokens) VALUES(?,?,?,?,?,?)')
    .bind(crypto.randomUUID(),user.id,'learning_assistant',clean(payload.model||env.AI_MODEL||'configured-model',100),Number(payload.usage?.prompt_tokens)||0,Number(payload.usage?.completion_tokens)||0).run();
  return json({ok:true,answer,usage:{used:Number(usage?.n||0)+1,dailyLimit:limit,plan:tier}});
}
