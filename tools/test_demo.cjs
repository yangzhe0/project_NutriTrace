const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const base=(process.argv[2]||'http://127.0.0.1:8771').replace(/\/$/,''),label=process.argv[3]||'v3_local',live=process.argv.includes('--live');
const root=path.resolve(__dirname,'..');
fs.mkdirSync(path.join(root,'tmp','pdfs'),{recursive:true});
(async()=>{
 const browser=await chromium.launch({...(process.env.CHROME_EXECUTABLE_PATH?{executablePath:process.env.CHROME_EXECUTABLE_PATH}:{}),headless:true,args:['--no-sandbox']});
 const checks=[],errors=[];const context=await browser.newContext({viewport:{width:1440,height:1000},acceptDownloads:true});const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 try{
 await page.goto(base+'/',{waitUntil:'networkidle'});await page.waitForFunction(()=>document.querySelectorAll('.story-card').length===3);
 const stored=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('shiji-food-ledger-v3')));
 let data=await stored();assert.equal(data.records.length,15);assert.equal(new Set(data.records.map(r=>r.photo)).size,15);assert(data.records.every(r=>r.amount&&r.origin==='demo'));checks.push('15张照片与完整演示份量');
 await page.screenshot({path:path.join(root,'tmp/pdfs',label+'_home.png'),fullPage:true,animations:'disabled'});
 await page.locator('.side-nav [data-view=ledger]').click();assert.equal(await page.locator('.meal-card').count(),15);
 for(let i=0;i<15;i++){await page.locator('.meal-card').nth(i).scrollIntoViewIfNeeded();await page.locator('.meal-card img').nth(i).waitFor({state:'visible'});await page.waitForFunction(i=>{const im=document.querySelectorAll('.meal-card img')[i];return im.complete&&im.naturalWidth>0},i);}
 checks.push('15张实图加载');await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:path.join(root,'tmp/pdfs',label+'_ledger.png'),fullPage:true,animations:'disabled'});
 await page.locator('[data-filter=早餐]').click();assert.equal(await page.locator('.meal-card').count(),3);await page.locator('[data-filter=全部]').click();await page.fill('#search','丝瓜');assert.equal(await page.locator('.meal-card').count(),1);await page.fill('#search','');checks.push('餐次筛选与搜索');
 await page.locator('#ledger [data-edit=demo-14]').click();await page.fill('#recordAmount','米饭半碗，排骨和杂蔬各一份');await page.locator('#editForm button[type=submit]').click();data=await stored();assert.equal(data.records.find(r=>r.id==='demo-14').version,2);checks.push('详情修改与保存');
 await page.reload();assert((await stored()).records.find(r=>r.id==='demo-14').amount.includes('半碗'));checks.push('刷新保留');
 const download=page.waitForEvent('download');await page.locator('#homeView .export-trigger').click();assert((await download).suggestedFilename().endsWith('.json'));checks.push('台账导出');
 await page.selectOption('#mode','sample');await page.click('#reviewWeek');await page.waitForFunction(()=>!document.querySelector('#send').disabled);
 const reply=await page.locator('.msg.assistant .message-content').last().innerText();assert(!reply.includes('均未确认'));assert(await page.locator('.msg.assistant strong').count()>0);assert(await page.locator('.msg.assistant ol').count()>0);checks.push('Markdown段落列表和加粗');
 await page.evaluate(()=>appendMessage('assistant','**加粗**\n\n- 一项\n- 二项\n\n<img src=x onerror=alert(1)> &#x8FD9;',{persist:false}));assert.equal(await page.locator('.msg:last-child img').count(),0);assert((await page.locator('.msg:last-child').innerText()).includes('这'));checks.push('格式实体处理与HTML转义');
 for(const width of [320,390,768,1024,1440]){
  await page.setViewportSize({width,height:844});
  for(const view of ['home','ledger','assistant']){await page.evaluate(v=>navigate(v),view);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'横向溢出 '+width+' '+view);}
 }
 checks.push('320/390/768/1024/1440布局');await page.setViewportSize({width:390,height:844});await page.locator('.mobile-nav [data-view=home]').click();await page.screenshot({path:path.join(root,'tmp/pdfs',label+'_mobile_home.png'),fullPage:true,animations:'disabled'});await page.locator('.mobile-nav [data-view=ledger]').click();await page.screenshot({path:path.join(root,'tmp/pdfs',label+'_mobile_ledger.png'),fullPage:true,animations:'disabled'});await page.locator('.mobile-nav [data-view=assistant]').click();
 const box=await page.locator('.composer').boundingBox(),nav=await page.locator('.mobile-nav').boundingBox();assert(box.y+box.height<=nav.y+1);await page.screenshot({path:path.join(root,'tmp/pdfs',label+'_mobile_chat.png'),fullPage:true,animations:'disabled'});checks.push('手机底部导航与可见输入');
 if(live){
  await page.selectOption('#mode','live');await page.click('#newChat');
  async function send(text){await page.fill('#message',text);await page.locator('#send').click();await page.waitForFunction(()=>!document.querySelector('#send').disabled,{},{timeout:160000});assert.equal(await page.locator('.tool.error').count(),0,await page.locator('.tool.error').allTextContents());}
  await send('请使用复盘工具回顾这组演示台账。引用两餐具体食物或份量，给一个下次点餐可以做的小调整。');
  const realReply=await page.locator('.msg.assistant .message-content').last().innerText();assert(!/均未确认|仅有\s*3|仅有三/.test(realReply));assert((await page.locator('.tool').allTextContents()).join(' ').includes('meal_profile_skill'));checks.push('真实API复盘与演示上下文');console.log('LIVE_REVIEW '+realReply);
  await send('今天午餐吃了半碗米饭、一份清炒西兰花和一份豆腐，请帮我记下来。');assert.equal((await stored()).records.length,16);checks.push('真实API自然语言记餐');
  await send('刚新增的今天午餐，米饭改成一碗，西兰花和豆腐不变，请修改这条记录。');data=await stored();assert(data.records.at(-1).version>=2);assert(data.records.at(-1).foods.includes('西兰花'));checks.push('真实API修改保留原菜品');
  await page.locator('#mealPhoto').setInputFiles(path.join(root,'demo/meals/meal-02.jpg'));await page.waitForFunction(()=>document.querySelector('#send').disabled);await page.waitForFunction(()=>!document.querySelector('#send').disabled,{},{timeout:160000});data=await stored();assert.equal(data.records.length,17);assert(data.records.at(-1).photo.startsWith('data:image/jpeg'));checks.push('真实API上传照片建账');
  await send('下一餐有鸡肉饭配青菜和炸鸡薯条，预算相同，请用选餐工具结合我的记录比较这两种选择。');assert((await page.locator('.tool').allTextContents()).join(' ').includes('food_repair_skill'));checks.push('真实API候选餐比较');
  await page.screenshot({path:path.join(root,'tmp/pdfs',label+'_live_chat.png'),fullPage:true,animations:'disabled'});
 }
 assert.deepEqual(errors,[]);const report={base,pass:true,checks};fs.writeFileSync(path.join(root,'tmp/pdfs',label+'_checks.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
