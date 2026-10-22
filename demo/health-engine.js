(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./nutrition-data.js'));else root.ShijiHealth=factory(root.SHIJI_FOOD_DATA);})(typeof window!=='undefined'?window:globalThis,function(data){
'use strict';
const nutrients={vitaminC:{name:'维生素 C',unit:'mg',reference:100},folate:{name:'叶酸',unit:'μg',reference:400},calcium:{name:'钙',unit:'mg',reference:800}};
const sources={waterVitamins:'https://www.nhc.gov.cn/wjw/yingyang/201805/a61e775d223443ea822a2fb7d69476ed.shtml',calcium:'https://www.nhc.gov.cn/fzs/c100048/201805/e821444378d64bafa7283779631096ce/files/1733125378344_55137.pdf',fatigue:'https://www.nhs.uk/symptoms/tiredness-and-fatigue/',anaemia:'https://www.nhs.uk/conditions/iron-deficiency-anaemia/'};
const round=n=>Math.round(n*10)/10;
function calculate(items){
 if(!Array.isArray(items)||items.length>80)throw Error('请提供有效食材列表');
 const totals=Object.fromEntries(Object.keys(nutrients).map(k=>[k,0]));const missing={},details=[];
 for(const item of items){const food=data.foods.find(f=>f.id===item.foodId);const grams=Number(item.grams);if(!food)throw Error('当前示例食物库未包含此食物');if(!Number.isFinite(grams)||grams<=0||grams>2000)throw Error('可食重量应在 0—2000 克之间');
 const contribution={};for(const key of Object.keys(nutrients)){const v=food.per100g[key];if(typeof v!=='number'){missing[key]=true;contribution[key]=null;}else{totals[key]+=v*grams/100;contribution[key]=round(v*grams/100);}}
 details.push({foodId:food.id,name:food.name,grams,contribution,source:food.source,fdcId:food.fdcId,description:food.description});}
 for(const key of Object.keys(totals))totals[key]=round(totals[key]);return {totals,missing,details,method:'每100克营养值 × 可食重量 ÷ 100；仅估算摄入，不推算吸收或人体存量'};
}
function scenario(id='takeaway'){
 const balanced=id==='balanced';const days=[];
 for(let i=0;i<15;i++){
  const date='2026-10-'+String(i+6).padStart(2,'0');
  const items=balanced?[{foodId:'rice',grams:450},{foodId:'chicken',grams:160},{foodId:'egg',grams:50},{foodId:'spinach',grams:220},{foodId:'milk',grams:550},{foodId:'orange',grams:220}]:[{foodId:'rice',grams:500},{foodId:'chicken',grams:160},{foodId:'egg',grams:50},{foodId:'spinach',grams:30},{foodId:'milk',grams:i%5===0?100:0},{foodId:'orange',grams:i%6===0?60:0}].filter(x=>x.grams>0);
  days.push({date,items,energy:balanced?[6,6,5,6,5,5,5,4,5,4,4,5,4,4,4][i]:[8,8,7,7,7,6,6,6,5,5,4,5,4,4,4][i],sleepHours:balanced?7.5:[7.5,7,7,6.5,6,6.5,6,6,5.5,6,5.5,6,5.5,5.5,5.5][i]});
 }
 return {id:balanced?'balanced':'takeaway',name:balanced?'饮食较丰富，仍持续乏力':'外食集中，近期精力下降',origin:'demo',description:'15天标准化食材与身体自评情境；独立于照片台账，不由照片推断营养值。',days,symptom:{durationDays:balanced?21:5,affectsDailyLife:balanced,palpitations:balanced,shortBreath:false,severe:false},profile:{age:22,group:'健康成年男性情境',reference:'WS/T 578.2、578.5—2018；参考摄入量用于膳食计划，不是诊断阈值'}};
}
function summarize(sc){const results=sc.days.map(d=>calculate(d.items));const averages={};for(const k of Object.keys(nutrients))averages[k]=round(results.reduce((s,x)=>s+x.totals[k],0)/results.length);const last=sc.days.at(-1),baseline=sc.days.slice(0,3).reduce((s,d)=>s+d.energy,0)/3;return {averages,lastEnergy:last.energy,lastSleep:last.sleepHours,baseline:round(baseline),recentDrop:round(baseline-last.energy),lowSources:Object.keys(nutrients).filter(k=>averages[k]<nutrients[k].reference),days:sc.days.length};}
function assessBody(input){
 const duration=Number(input.durationDays)||0;
 if(input.severe===true)return {route:'urgent',title:'优先及时就医',reason:'出现明显或突发的严重不适，停止以食补观察替代就医。',questions:['向医务人员说明起病时间、严重程度与伴随表现。'],sources:[sources.fatigue]};
 if((duration>=14&&input.affectsDailyLife===true)||duration>=21)return {route:'care',title:'准备线下专业评估',reason:'持续乏力或已影响日常，应结合病史与查体进一步评估，饮食记录无法排除其他原因。',questions:['乏力何时开始，是否伴心悸、活动气促或体重变化？','近来睡眠、用药、疾病和失血情况如何？'],discussion:input.palpitations||input.shortBreath?'可与医生讨论是否需要血常规等贫血相关评估，其他检查按病史和查体决定。':'医生会结合情况考虑是否需要血常规、血糖或甲状腺相关评估。',sources:[sources.fatigue,sources.anaemia]};
 return {route:'observe',title:'营养搭配与作息一起调整',reason:'将近期餐食来源、精力自评与睡眠并列回看，先选择一项饮食调整并补充生活背景。',questions:['这次精力下降持续多久，是否影响日常？','前一晚睡了多久，近期压力或运动有变化吗？'],sources:[sources.fatigue]};
}
function recommend({target='vitaminC',budget=8,excluded=[]}={}){
 if(!nutrients[target])throw Error('请选择已支持的营养目标');budget=Number(budget);if(!Number.isFinite(budget)||budget<0||budget>100)throw Error('请输入有效预算');
 if(!Array.isArray(excluded))throw Error('排除条件应为列表');excluded=excluded.map(x=>({'牛奶':'milk','乳类':'milk','乳制品':'milk','鸡蛋':'egg'}[x]||x));
 const ids=target==='vitaminC'?['orange','mango']:target==='folate'?['spinach']:['milk'];
 return data.foods.filter(f=>ids.includes(f.id)&&!excluded.some(a=>f.allergens.includes(a)||f.id===a)&&f.demoPrice<=budget).map(f=>{const grams=f.defaultGrams;return {foodId:f.id,name:f.name,grams,price:f.demoPrice,target,amount:calculate([{foodId:f.id,grams}]).totals[target],unit:nutrients[target].unit,source:f.source,priceOrigin:'示例价格，需以实际候选商品为准'};}).sort((a,b)=>b.amount/b.price-a.amount/a.price);
}
function careBrief(sc){const a=assessBody(sc.symptom),s=summarize(sc);return {heading:'食迹 · 就医沟通摘要',scenario:sc.name,origin:'演示情境',durationDays:sc.symptom.durationDays,reportedEnergy:s.lastEnergy,sleepHours:s.lastSleep,dietRecord:'已整理'+sc.days.length+'天食材记录；不能据此判断人体营养状态。',symptom:sc.symptom,assessment:a,questions:a.questions,discussion:a.discussion||'如症状持续、加重或影响生活，应进一步评估。',sources:a.sources};}
return {nutrients,sources,foods:data.foods,calculate,scenario,summarize,assessBody,recommend,careBrief};
});
