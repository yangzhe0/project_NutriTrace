'use strict';
const KEY='shiji-food-ledger-v3';
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icon=name=>`<svg aria-hidden="true"><use href="#i-${name}"/></svg>`;
const today=()=>new Date().toLocaleDateString('en-CA');
const clone=x=>JSON.parse(JSON.stringify(x));
const seed=()=>({schema:3,records:clone(window.SHIJI_DEMO_SEED),history:[],chat:[]});
function initialState(){
 try{const saved=JSON.parse(localStorage.getItem(KEY));if(saved&&Array.isArray(saved.records))return {...seed(),...saved};}catch{}
 const fresh=seed();
 try{
  const old=JSON.parse(localStorage.getItem('food-ledger-prototype-v1'));
  if(Array.isArray(old?.records)){
   const preserved=old.records.filter(r=>!['meal-01','meal-02','meal-03'].includes(r.id)||r.version>1);
   fresh.records.push(...preserved.map(r=>({...r,origin:'user',photo:typeof r.photo==='string'?r.photo.replace(/^\.\.\//,'/'):''})));
   fresh.history=Array.isArray(old.history)?old.history:[];
  }
 }catch{}
 return fresh;
}
let state=initialState(),busy=false,editingId=null,filter='全部',dateFilter='',activeView='home',toastTimer;
let memory=[];
function photoUrl(r){const p=String(r?.photo||'');return /^(\/demo\/meals\/|\/assets\/|data:image\/(jpeg|png|webp);base64,)/.test(p)?p:'';}
function thumbnail(r){return photoUrl(r).replace('/demo/meals/meal-','/demo/meals/thumb-meal-');}
function toast(text){$('#toast').textContent=text;$('#toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').hidden=true,3200);}
function save(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch{toast('浏览器存储空间不足，可先导出台账保存。');}render();}
function inferredTags(r){
 if(Array.isArray(r.tags)&&r.tags.length)return r.tags;
 const s=r.foods||'',tags=[];
 if(/饭|面|饼|包|薯|粥|粉/.test(s))tags.push('谷薯');
 if(/肉|蛋|鱼|鸡|豆腐|豆皮|毛豆/.test(s))tags.push('蛋白质');
 if(/菜|瓜|笋|豆芽|海带|木耳/.test(s))tags.push('蔬菜');
 if(/奶|豆浆|豆奶|豆皮|豆腐|毛豆/.test(s))tags.push('奶豆');
 if(/苹果|橙|香蕉|水果/.test(s))tags.push('水果');
 return tags;
}
function sortedRecords(){return [...state.records].sort((a,b)=>(b.date||'').localeCompare(a.date||'')||mealRank(b.mealType)-mealRank(a.mealType));}
function mealRank(s){return {早餐:1,午餐:2,下午茶:3,晚餐:4,其他:5}[s]||0;}
function label(r){return r.date?`${r.date.slice(5).replace('-','/')} ${r.mealType||'餐食'}`:r.label||'餐食记录';}
function title(r){return r.title||r.foods?.split(/[、，,]/).slice(0,2).join('与')||'餐食记录';}
function navigate(view){
 activeView=view;document.body.dataset.view=view;
 if(view!=='assistant'){$('#homeView').hidden=view!=='home';$('#ledgerView').hidden=view!=='ledger';}
 document.querySelectorAll('.side-nav [data-view],.mobile-nav [data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===view));
 $('#breadcrumb').textContent=view==='ledger'?'我的饮食台账':'我的饮食空间';
 if(view==='assistant'){requestAnimationFrame(scrollChat);if(innerWidth>900)$('#message').focus({preventScroll:true});}
 else window.scrollTo({top:0,behavior:'instant'});
}
function render(){
 const n=state.records.length;$('#navCount').textContent=n;$('#recordCount').textContent=n+' 笔记录';$('#contextCount').textContent='已带入 '+n+' 笔饮食记录';
 const days=[...new Set(state.records.map(r=>r.date).filter(Boolean))].sort();const week=days.slice(-7);
 $('#dateRange').textContent=window.ShijiHealth?'营养摄入 · 身体自评':week.length?`${Number(week[0].slice(5,7))} 月 ${Number(week[0].slice(8))} 日—${Number(week.at(-1).slice(5,7))} 月 ${Number(week.at(-1).slice(8))} 日`:'从今天开始记录';
 const weekRecords=state.records.filter(r=>week.includes(r.date));$('#weekTotal').textContent=weekRecords.length+' 笔记录';
 $('#recentPhotos').innerHTML=sortedRecords().slice(0,3).map(r=>`<button class="story-card" data-edit="${esc(r.id)}"><div class="story-image">${photoUrl(r)?`<img src="${esc(thumbnail(r))}" alt="${esc(title(r))}" fetchpriority="high">`:icon('book')}<span class="story-label">${esc(label(r))}</span></div><div class="story-caption"><h3>${esc(title(r))}</h3><p>${esc(r.amount||'随时补充食用量')}</p></div></button>`).join('');
 const max=Math.max(3,...week.map(d=>weekRecords.filter(r=>r.date===d).length));
 $('#weekChart').innerHTML=week.map(d=>{const count=weekRecords.filter(r=>r.date===d).length;return `<button class="day-column" data-date="${d}" aria-label="${d}，${count}笔记录"><span class="day-count">${count}</span><span class="day-bar" style="height:${count/max*70}px"></span><span class="day-label">${Number(d.slice(5,7))}/${Number(d.slice(8))}</span></button>`;}).join('');
 $('#foodPattern').innerHTML=['谷薯','蛋白质','蔬菜','奶豆','水果'].map(t=>`<span>${t} <b>${weekRecords.filter(r=>inferredTags(r).includes(t)).length}</b> 餐</span>`).join('');
 const veg=weekRecords.filter(r=>inferredTags(r).includes('蔬菜')).length;
 $('#nextStepText').textContent=weekRecords.length?`这 ${weekRecords.length} 笔记录里，${veg} 餐提到了蔬菜。下一次点面或套餐，可以加一份绿叶菜，让搭配丰富一点。`:'从你喜欢的主食开始，搭配一份蔬菜，慢慢找到适合自己的吃法。';
 const noted=sortedRecords().find(r=>r.note&&/困|精神|睡眠|饱|撑/.test(r.note));$('#moodPreview').textContent=noted?'“'+noted.note+'”':'留下进餐后的感受，下次复盘时一起回顾。';
 renderLedger();$('#history').textContent=state.history.length?'已保存 '+state.history.length+' 次补记与修正':'';
}
function renderLedger(){
 const query=$('#search').value.trim().toLowerCase();
 const records=sortedRecords().filter(r=>(filter==='全部'||r.mealType===filter)&&(dateFilter===''||r.date===dateFilter)&&(!query||[r.foods,r.title,r.note,r.amount].join(' ').toLowerCase().includes(query)));
 $('#ledger').innerHTML=records.map(r=>`<article class="meal-card"><button type="button" data-edit="${esc(r.id)}" aria-label="查看${esc(title(r))}"><div class="meal-image ${photoUrl(r)?'':'no-photo'}">${photoUrl(r)?`<img src="${esc(thumbnail(r))}" alt="${esc(title(r))}" loading="lazy" decoding="async">`:icon('book')}<span class="story-label">${esc(label(r))}</span></div><div class="meal-copy"><h3>${esc(title(r))}</h3><p>${esc(r.foods)}</p><div class="meal-amount">${esc(r.amount||'点击补充食用量')}</div><div class="meal-bottom"><span>${r.origin==='demo'?'饮食故事':r.status==='用户确认'?'已补充':'我的记录'}${r.version>1?' · 已修正':''}</span>${icon('edit')}</div></div></button></article>`).join('');
 $('#emptyState').hidden=records.length>0;
 $('#activeDate').innerHTML=dateFilter?`<div class="date-filter">正在查看 ${esc(dateFilter)} <button class="text-button" id="clearDate">显示全部日期 ×</button></div>`:'';
 if($('#clearDate'))$('#clearDate').onclick=()=>{dateFilter='';renderLedger();};
}
document.addEventListener('click',e=>{
 const nav=e.target.closest('[data-view]');if(nav)navigate(nav.dataset.view);
 const editButton=e.target.closest('[data-edit]');if(editButton)edit(editButton.dataset.edit);
 const day=e.target.closest('[data-date]');if(day){dateFilter=day.dataset.date;filter='全部';updateFilters();renderLedger();navigate('ledger');}
 const f=e.target.closest('[data-filter]');if(f){filter=f.dataset.filter;updateFilters();renderLedger();}
 const prompt=e.target.closest('[data-prompt]');if(prompt){navigate('assistant');send(prompt.dataset.prompt);}
});
function updateFilters(){document.querySelectorAll('[data-filter]').forEach(b=>b.classList.toggle('active',b.dataset.filter===filter));}
$('#search').oninput=renderLedger;
document.querySelectorAll('.add-trigger').forEach(b=>b.onclick=()=>$('#addDialog').showModal());
$('#closeAdd').onclick=()=>$('#addDialog').close();
$('#addPhoto').onclick=()=>{$('#addDialog').close();navigate('assistant');$('#mealPhoto').click();};
$('#addText').onclick=()=>{$('#addDialog').close();edit(null);};
function edit(id){
 editingId=id;const r=state.records.find(r=>r.id===id);
 $('#editTitle').textContent=r?'餐食详情':'补记一餐';$('#recordDate').value=r?.date||today();$('#recordMeal').value=r?.mealType||'午餐';$('#recordTitle').value=r?title(r):'';$('#recordFoods').value=r?.foods||'';$('#recordAmount').value=r?.amount||'';$('#recordNote').value=r?.note||'';
 $('#editPhoto').hidden=!photoUrl(r);$('#editPhoto').src=photoUrl(r)||'';$('#inspectPhoto').hidden=!photoUrl(r);
 $('#editOrigin').textContent=r?.origin==='demo'?'演示情境中的餐食，可自由调整。':'餐次、份量和感受都可以随时补充。';$('#editor').showModal();
}
$('#cancelEdit').onclick=()=>$('#editor').close();
$('#editForm').onsubmit=e=>{
 e.preventDefault();const date=$('#recordDate').value,mealType=$('#recordMeal').value;
 const patch={date,mealType,label:date.slice(5)+' '+mealType,title:$('#recordTitle').value.trim(),foods:$('#recordFoods').value.trim(),amount:$('#recordAmount').value.trim(),note:$('#recordNote').value.trim(),status:'用户确认'};
 const record=state.records.find(r=>r.id===editingId);
 if(record){state.history.push({id:record.id,at:new Date().toISOString(),before:clone(record),reason:'手工修正'});Object.assign(record,patch,{tags:[],version:(record.version||1)+1});}
 else{const id='manual-'+crypto.randomUUID().slice(0,10);state.records.push({id,...patch,origin:'user',photo:'',version:1});state.history.push({id,at:new Date().toISOString(),reason:'文字补记'});}
 save();$('#editor').close();toast('餐食记录已保存');
};
$('#recordFeeling').onclick=()=>{const r=sortedRecords()[0];edit(r?.id||null);setTimeout(()=>$('#recordNote').focus(),100);};
document.querySelectorAll('.export-trigger').forEach(b=>b.onclick=()=>{
 const blob=new Blob([JSON.stringify({project:'食迹',demoNotice:'origin=demo 的记录为照片素材编排的演示情境',exportedAt:new Date().toISOString(),...state},null,2)],{type:'application/json'});
 const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='食迹_饮食台账.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('台账已导出');
});
$('#reset').onclick=()=>{if(confirm('恢复演示台账会清除当前补记、修改与对话。需要的话请先导出，确定恢复吗？')){state=seed();memory=[];save();$('#chatLog').replaceChildren();welcome();toast('已恢复 7 天 15 笔演示记录');}};
function inline(text){return esc(text).replace(/\*\*([\s\S]+?)\*\*/g,'<strong>$1</strong>').replace(/`([^`]+)`/g,'<code>$1</code>');}
function markdown(text){
 const decode=document.createElement('textarea');decode.innerHTML=String(text).replace(/</g,'&lt;');
 const lines=decode.value.replace(/\r/g,'').split('\n');let html='',para=[],listType='';
 const flush=()=>{if(para.length){html+='<p>'+para.map(inline).join('<br>')+'</p>';para=[];}};
 const closeList=()=>{if(listType){html+='</'+listType+'>';listType='';}};
 for(const line of lines){
  const list=line.match(/^\s*(?:([-*•])\s+|\d+[.、)]\s+)(.+)$/),head=line.match(/^#{1,4}\s+(.+)$/);
  if(list){flush();const type=list[1]?'ul':'ol';if(listType!==type){closeList();html+='<'+type+'>';listType=type;}html+='<li>'+inline(list[2])+'</li>';}
  else{closeList();if(head){flush();html+='<h3>'+inline(head[1])+'</h3>';}else if(!line.trim()){flush();}else para.push(line);}
 }
 flush();closeList();return html;
}
function scrollChat(){const el=$('#chatLog');el.scrollTop=el.scrollHeight;}
function appendMessage(role,text,{persist=true,image=''}={}){
 const div=document.createElement('div');div.className='msg '+(role==='user'?'user':'assistant');
 div.innerHTML=`<div class="who">${role==='user'?'我':'食迹'}</div><div class="message-content">${markdown(text)}</div>`;
 if(image){const im=document.createElement('img');im.src=image;im.className='chat-photo';im.alt='本次上传的餐食';div.querySelector('.message-content').prepend(im);}
 $('#chatLog').append(div);scrollChat();
 if(persist){state.chat.push({role,content:text});state.chat=state.chat.slice(-32);try{localStorage.setItem(KEY,JSON.stringify(state));}catch{}}
 return div;
}
function welcome(){
 appendMessage('assistant','一起看看，怎么把吃饭与身体状态联系起来。\n\n台账里已经有 **'+state.records.length+' 笔餐食记录**，照片、份量和饭后感受都能一起回顾。\n\n你可以计算150克橙子的营养贡献，比较食补选项，或回顾上方情境的精力与睡眠。餐食也能继续拍照补记。');
 const options=document.createElement('button');options.className='option-button';options.textContent='看看这一周，有什么值得调整';options.onclick=()=>send($('#reviewWeek').dataset.prompt);$('#chatLog').lastChild.append(options);
}
function trace(traces){
 if(!traces.length)return;
 const div=document.createElement('div');div.className='tool';
 const summary=traces.map(t=>t.label).join('、');div.innerHTML=`${icon('leaf')}<details><summary>${esc(summary)} · 已完成</summary><pre>${traces.map(t=>esc(t.skill+'\n'+t.detail)).join('\n\n')}</pre></details>`;$('#chatLog').append(div);scrollChat();
}
function applyActions(actions,image){
 let changed=false;
 for(const a of actions){
  if(a.type==='create'&&a.record?.id&&!state.records.some(r=>r.id===a.record.id)){
   const record={...a.record,date:a.record.date||today(),mealType:a.record.mealType||'其他',photo:a.attachPhoto&&image?image:'',origin:'user',version:1};
   if(!record.title)record.title=title(record);state.records.push(record);state.history.push({id:record.id,at:new Date().toISOString(),reason:'对话记餐'});changed=true;
  }else if(a.type==='update'&&a.id&&a.changes){
   const record=state.records.find(r=>r.id===a.id);if(!record)continue;
   state.history.push({id:record.id,at:new Date().toISOString(),before:clone(record),reason:'对话修正'});
   for(const k of ['label','foods','amount','note','status','date','mealType','title'])if(typeof a.changes[k]==='string')record[k]=a.changes[k];
   if(a.changes.foods)record.tags=[];record.version=(record.version||1)+1;changed=true;
  }
 }
 if(changed)save();
}
function sampleReply(text){
 const noodles=state.records.filter(r=>/炒面|拌面|面条|米粉|河粉|面食|汤面/.test(r.foods)).length;
 if(/下一|怎么选|比较/.test(text)&&!/复盘|回顾/.test(text))return '**可以先选鸡肉饭配青菜。**\n\n这组记录里有 '+noodles+' 笔包含面食或粉类，下一餐换成米饭、鸡肉和一份蔬菜，搭配上更有变化。\n\n点单时让酱汁另放，按饥饿感决定米饭份量就好。';
 if(/感受|困|睡眠/.test(text))return '把**进餐时间、饱腹感和前一晚睡眠**一起记下来，会比只写“饭后困”更方便回顾。\n\n下次可以补一句：“午饭八分饱，饭后半小时有些困，昨晚睡了6小时。”感受记录用来观察规律，不直接判断原因。';
 return '**这组 '+state.records.length+' 笔记录里，有两点值得留意：**\n\n1. 主食选择比较集中，面食或粉类出现了 '+noodles+' 次，可以穿插米饭、杂粮或薯类。\n2. 几餐虽然有配菜，但份量设定较少，比如汉堡里的生菜、拌面的黄瓜丝。\n\n**下一餐的小调整：**保留喜欢的主食，再单独加一份绿叶菜。这样点单容易，也不必一下子改变所有习惯。';
}
async function send(text,image=null){
 if(busy||!text.trim())return;
 navigate('assistant');busy=true;$('#send').disabled=true;$('#upload').disabled=true;$('#message').value='';
 appendMessage('user',text,{image});memory.push({role:'user',content:text});
 const waiting=document.createElement('div');waiting.className='tool waiting';waiting.textContent=image?'正在看这一餐…':'正在回顾你的餐食记录…';$('#chatLog').append(waiting);scrollChat();
 try{
  let reply;
  if($('#mode').value==='sample'){
   if(/记下来|帮我记|修改|修正/.test(text)){reply='离线示例可以展示复盘与选餐。要保存这餐，请用台账里的手工编辑；也可以切换“实时 AI”直接告诉我。';}
   else reply=sampleReply(text);
  }else{
   const res=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:memory.slice(-12),ledger:state.records.map(r=>({...r,photo:!!r.photo})),image,currentDate:today(),healthContext:window.ShijiHealthContext||null,demoContext:{enabled:true,description:'预置记录为七天饮食故事；其中日期、份量、饮品名称和感受已按演示设定补齐。origin=demo为演示，origin=user为用户新增。'}}),signal:AbortSignal.timeout(150000)});
   const data=await res.json();if(!res.ok)throw new Error(data.error||'暂时没有收到回复');
   applyActions(data.actions||[],image);trace(data.traces||[]);reply=data.content;
  }
  appendMessage('assistant',reply);memory.push({role:'assistant',content:reply});
 }catch(e){const div=document.createElement('div');div.className='tool error';div.textContent='这次没有完成：'+e.message+'。你可以重试，已有台账仍会保留。';$('#chatLog').append(div);scrollChat();}
 finally{waiting.remove();busy=false;$('#send').disabled=false;$('#upload').disabled=false;}
}
$('#chatForm').onsubmit=e=>{e.preventDefault();send($('#message').value);};
$('#message').onkeydown=e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing&&innerWidth>900){e.preventDefault();$('#chatForm').requestSubmit();}};
$('#nextMeal').onclick=()=>{navigate('assistant');$('#message').value='下一餐我可以选：';$('#message').focus();toast('告诉我你面前的几种选择，我来一起比较');};
$('#reviewContext').onclick=()=>{filter='全部';dateFilter='';$('#search').value='';updateFilters();renderLedger();navigate('ledger');};
$('#newChat').onclick=()=>{if(busy)return;state.chat=[];memory=[];$('#chatLog').replaceChildren();welcome();toast('已开始新对话，饮食台账仍保留');};
$('#upload').onclick=()=>{if(!busy)$('#mealPhoto').click();};
$('#mealPhoto').onchange=async e=>{
 const file=e.target.files?.[0];if(!file||busy)return;
 if(!file.type.startsWith('image/')){toast('请选择 JPG、PNG 或 WebP 餐食图片');return;}
 try{
  const bitmap=await createImageBitmap(file),scale=Math.min(1,1024/Math.max(bitmap.width,bitmap.height)),canvas=document.createElement('canvas');canvas.width=Math.round(bitmap.width*scale);canvas.height=Math.round(bitmap.height*scale);canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();
  $('#mode').value='live';$('#mode').dispatchEvent(new Event('change'));
  await send('帮我把这张餐食照片记进台账。今天是'+today()+'。先记录看得到的食物；实际吃了多少我可以随后补充。',canvas.toDataURL('image/jpeg',.8));
 }catch{toast('照片没能读取，请换一张 JPG、PNG 或 WebP 图片');}finally{e.target.value='';}
};
$('#inspectPhoto').onclick=async()=>{
 const r=state.records.find(r=>r.id===editingId);if(!r||busy)return;$('#editor').close();navigate('assistant');
 try{const blob=await(await fetch(photoUrl(r))).blob();const image=await new Promise((resolve,reject)=>{const fr=new FileReader();fr.onload=()=>resolve(fr.result);fr.onerror=reject;fr.readAsDataURL(blob);});await send('一起看看 '+r.id+' 这餐的搭配。请结合台账中已有的份量与补充信息，给一个具体的小调整。',image);}catch{toast('图片暂时无法读取，可以直接聊聊这餐。');}
};
for(const id of ['aboutButton','demoInfo'])$('#'+id).onclick=()=>$('#aboutDialog').showModal();
for(const id of ['closeAbout','startExperience'])$('#'+id).onclick=()=>$('#aboutDialog').close();
$('#mode').onchange=()=>$('#modeNote').textContent=$('#mode').value==='live'?'结合台账，让建议更贴近日常':'离线示例 · 可切换实时 AI';
async function init(){
 render();
 if(state.chat.length){for(const m of state.chat)appendMessage(m.role,m.content,{persist:false});memory=state.chat.slice(-12);}else welcome();
 try{const r=await fetch('/api/status');const data=await r.json();$('#apiStatus').textContent=data.configured?'AI 已连接':'离线体验';if(!data.configured)$('#mode').value='sample';}
 catch{$('#apiStatus').textContent='离线体验';$('#mode').value='sample';}
 $('#mode').dispatchEvent(new Event('change'));try{localStorage.setItem(KEY,JSON.stringify(state));}catch{}
}
window.ShijiApp={send,toast};
init();
