const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const readline = require('node:readline');
const {runAgent}=require('./agent.cjs');


function json(res,status,data){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data));}
async function readBody(req){let body='';for await(const chunk of req){body+=chunk;if(Buffer.byteLength(body)>8*1024*1024)throw new Error('请求内容过大');}return JSON.parse(body||'{}');}

function startServer({root=__dirname,port=8765,host='127.0.0.1',defaultEntry='index.html',publicOrigin='',getApiConfig=()=>({})}={}){
 const server=http.createServer(async(req,res)=>{
  try{
   if(req.method==='POST' && req.url==='/api/chat'){
    const origin=req.headers.origin;
    if(origin){let valid=false;try{const u=new URL(origin);valid=['http:','https:'].includes(u.protocol)&&(u.host===req.headers.host||u.origin===publicOrigin)}catch{}if(!valid)return json(res,403,{error:'不接受其他网页发起的请求。'});}
    const config=getApiConfig();
    if(!config.base||!config.key)return json(res,503,{error:'尚未配置 API。可以继续使用本地台账和预置演示。'});
    const input=await readBody(req);
    try{return json(res,200,await runAgent(config,input));}catch(e){return json(res,e.status||502,{error:e.message||'AI 服务暂时不可用。'});}
   }
   if(req.method==='GET' && req.url==='/api/status'){
    const config=getApiConfig();return json(res,200,{configured:!!(config.base&&config.key),model:config.model||'gemini-3.8-flash-high',storage:'browser-local',skills:'function-calling-prototype',version:'0.4.1',nutrition:'USDA-curated-subset',bodySignals:'self-report-demo'});
   }
   if(req.method!=='GET'&&req.method!=='HEAD')return json(res,405,{error:'Method not allowed'});
   let pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
   if(pathname==='/')pathname='/'+defaultEntry;
   if(pathname==='/proposal/'||pathname==='/proposal'){res.writeHead(302,{'Location':'/docs/proposal.html','Cache-Control':'no-store'});return res.end();}
   if(pathname==='/demo/'||pathname==='/demo')pathname='/demo/index.html';
   const legacy={'/demo/app-v3.js':'/demo/app.js','/demo/campus.css':'/demo/app.css','/demo/campus-health.css':'/demo/health.css','/C_研究论证版.html':'/docs/proposal.html','/C_项目书正文.md':'/docs/proposal.md','/C_参考文献与公开调研.html':'/docs/references.html','/C_参考文献与公开调研.md':'/docs/references.md','/output/pdf/C_研究论证版.pdf':'/docs/proposal.pdf'};
   if(legacy[pathname]){res.writeHead(302,{'Location':legacy[pathname],'Cache-Control':'no-store'});return res.end();}
   const allowed=pathname==='/index.html'||/^\/(assets|demo|docs)\//.test(pathname);
   if(!allowed)return json(res,404,{error:'Not found'});
   const file=path.resolve(root,'.'+pathname);
   if(!file.startsWith(path.resolve(root)+path.sep))return json(res,403,{error:'Forbidden'});
   const content=await fs.readFile(file);
   const types={'.html':'text/html; charset=utf-8','.md':'text/plain; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.jpg':'image/jpeg','.png':'image/png','.pdf':'application/pdf','.svg':'image/svg+xml','.woff2':'font/woff2'};
   res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Content-Length':content.length,'Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});res.end(req.method==='HEAD'?undefined:content);
  }catch(e){json(res,e.code==='ENOENT'?404:500,{error:e.code==='ENOENT'?'文件不存在。':'处理失败，请检查输入或稍后重试。'});}
 });
 server.listen(port,host);
 return server;
}
module.exports={startServer};
if(require.main===module){
 if(process.env.FOODLEDGER_SERVER_MODE==='service'){
  const server=startServer({root:process.env.FOODLEDGER_ROOT||__dirname,port:Number(process.env.FOODLEDGER_PORT||8765),host:process.env.FOODLEDGER_HOST||'127.0.0.1',defaultEntry:process.env.FOODLEDGER_DEFAULT_ENTRY||'demo/index.html',publicOrigin:process.env.FOODLEDGER_PUBLIC_ORIGIN||'',getApiConfig:()=>({base:process.env.FOODLEDGER_API_BASE||'http://127.0.0.1:8045',key:process.env.FOODLEDGER_API_KEY||'',model:process.env.FOODLEDGER_MODEL||'gemini-3.8-flash-high'})});
  server.on('listening',()=>console.log('Shiji demo ready on port '+(process.env.FOODLEDGER_PORT||8765)));
  server.on('error',e=>{console.error('Service failed: '+e.code);process.exit(1)});
 }else{
 const rl=readline.createInterface({input:process.stdin,terminal:false});
 rl.once('line',line=>{
  let config={};try{config=JSON.parse(line)}catch{}
  rl.close();
  const server=startServer({defaultEntry:'demo/index.html',getApiConfig:()=>config});
  server.on('listening',()=>console.log('食迹本地工作区：http://127.0.0.1:8765\nAPI密钥仅保存在当前进程内存；关闭窗口停止服务。'));
  server.on('error',e=>{console.error('本地服务启动失败：'+e.code);process.exit(1)});
 });
 }
}
