import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname=path.dirname(fileURLToPath(import.meta.url));
const PORT=process.env.PORT||3000;
const apiKey=process.env.OPENAI_API_KEY;
const model=process.env.OPENAI_MODEL||'gpt-4.1-mini';
const server=http.createServer(async(req,res)=>{
  if(req.method==='GET' && (req.url==='/'||req.url==='/index.html')){
    res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(fs.readFileSync(path.join(__dirname,'index.html')));return;
  }
  if(req.method==='POST'&&req.url==='/api/analyze'){
    if(!apiKey){res.writeHead(503,{'Content-Type':'application/json'});res.end(JSON.stringify({error:'AI service is not configured. Set OPENAI_API_KEY on the server.'}));return;}
    let body='';req.on('data',chunk=>body+=chunk);req.on('end',async()=>{
      try{
        const input=JSON.parse(body);
        const prompt=`You are a careful international business expansion analyst. Create a practical, structured preliminary market-entry assessment for this scenario. Clearly distinguish assumptions from facts, do not invent statistics or claim live research, and identify what evidence should be gathered next.\nCompany/product: ${input.company}\nHome market: ${input.homeMarket}\nTarget market: ${input.targetMarket}\nBudget: EUR ${input.budget}\nIndustry: ${input.industry}\nInclude: executive recommendation, target customer hypotheses, market-entry route options, key risks, budget considerations, a 90-day plan, 5 research questions, and a go/no-go checklist. Use concise headings and actionable bullets.`;
        const aiRes=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{'Authorization':`Bearer ${apiKey}`,'Content-Type':'application/json'},body:JSON.stringify({model,input:prompt})});
        const data=await aiRes.json();if(!aiRes.ok)throw new Error(data.error?.message||'AI API request failed');
        const analysis=data.output?.flatMap(item=>item.content||[]).filter(c=>c.type==='output_text').map(c=>c.text).join('\n')||'No text returned.';
        res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify({analysis}));
      }catch(e){res.writeHead(500,{'Content-Type':'application/json'});res.end(JSON.stringify({error:e.message}));}
    });return;
  }
  res.writeHead(404);res.end('Not found');
});
server.listen(PORT,()=>console.log(`Expansion Intelligence running at http://localhost:${PORT}`));
