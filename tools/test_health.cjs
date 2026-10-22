const assert=require('node:assert/strict');
const H=require('../demo/health-engine.js');
assert.equal(H.calculate([{foodId:'orange',grams:150}]).totals.vitaminC,79.8);
assert.equal(H.calculate([{foodId:'orange',grams:300}]).totals.vitaminC,159.6);
assert.throws(()=>H.calculate([{foodId:'unknown',grams:150}]));
assert.throws(()=>H.calculate([{foodId:'orange',grams:-1}]));
assert.throws(()=>H.calculate([{foodId:'orange',grams:'NaN'}]));
assert(H.recommend({target:'vitaminC',budget:3}).every(x=>x.price<=3));
assert.equal(H.recommend({target:'calcium',budget:8,excluded:['milk']}).length,0);
assert.equal(H.assessBody(H.scenario('balanced').symptom).route,'care');
assert.equal(H.assessBody(H.scenario('takeaway').symptom).route,'observe');
assert.equal(H.assessBody({severe:true,durationDays:1}).route,'urgent');
assert.equal(H.scenario('takeaway').days.length,15);
assert.equal(H.summarize(H.scenario('balanced')).lowSources.length,0);
assert(H.careBrief(H.scenario('balanced')).discussion.includes('医生'));
(async()=>{
 let calls=0;const original=global.fetch;
 global.fetch=async(url,opts)=>{const body=JSON.parse(opts.body);calls++;if(calls===1){assert(body.tools.some(t=>t.function.name==='calculate_nutrition'));return {ok:true,json:async()=>({choices:[{message:{tool_calls:[{id:'c1',type:'function',function:{name:'calculate_nutrition',arguments:JSON.stringify({items:[{food_id:'orange',grams:150}]})}}]}}]})};}
 const tool=JSON.parse(body.messages.find(m=>m.role==='tool').content);assert.equal(tool.totals.vitaminC,79.8);assert.equal(tool.details[0].fdcId,169097);return {ok:true,json:async()=>({choices:[{message:{content:'150克鲜橙预计提供79.8毫克维生素C。'}}]})};};
 try{const {runAgent}=require('../agent.cjs');const r=await runAgent({base:'http://test.invalid',key:'test-only'},{messages:[{role:'user',content:'计算150克鲜橙'}],healthContext:{scenario:'takeaway'}});assert(r.traces.some(t=>t.skill==='nutrient_radar_skill'));assert(r.content.includes('79.8'));}finally{global.fetch=original;}
 console.log('PASS: nutrient scaling, invalid input, budget/allergen constraints, two body routes, urgent route, care summary, live tool execution protocol.');
})().catch(e=>{console.error(e);process.exit(1)});
