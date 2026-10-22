"""2026-10-22 校园版：四页 HTML 为项目书的唯一排版来源。"""
from pathlib import Path
import base64, html, json, re, sys, os
ROOT=Path(__file__).resolve().parents[1]
cfg=json.loads((ROOT/'project.config.json').read_text(encoding='utf-8'))
SOURCES={int(k):tuple(v) for k,v in json.loads((ROOT/'docs/references.json').read_text(encoding='utf-8')).items()}
def asset(name):
 p=ROOT/name
 return 'data:'+{'.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg'}[p.suffix]+';base64,'+base64.b64encode(p.read_bytes()).decode()
def cite(n):return f'<sup><a href="{SOURCES[n][1]}">[{n}]</a></sup>'
def title(n,t):return f'<h1 class="section-title"><span>{n}</span>{t}</h1>'
def sub(n,t):return f'<h2><span>{n}</span>{t}</h2>'
def school():return f'<div class="school"><img class="symbol" src="{asset("assets/sues/school-symbol.svg")}" alt="上海工程技术大学校标"><img class="school-name" src="{asset("assets/sues/school-name.svg")}" alt="上海工程技术大学"></div>'
qr=asset('assets/demo-access-qr.png')
photos=''.join(f'<img src="{asset("demo/meals/thumb-meal-"+str(i).zfill(2)+".jpg")}" alt="日常餐食素材">' for i in [2,3,5,8,11,15])
p1=f'''
<div class="cover"><div><div class="eyebrow">智能数字大健康 · 创意计划书</div><hgroup><h1>食迹</h1><p>基于个人饮食台账的营养管理智能体</p></hgroup><p class="cover-summary">面向外食青年的连续营养管理服务<br><b>记下每一餐，连接身体感受，给出下一步行动。</b></p></div><a class="demo-entry" href="https://sa.zheoi.com/"><img src="{qr}" alt="食迹在线体验二维码"><b>sa.zheoi.com</b><span>扫一扫或点击网站体验</span></a></div>
<div class="identity"><span>参赛团队 <b>2的10次幂</b></span><span>项目负责人 <b>杨哲</b></span><span>指导教师 <b>张会彦</b></span></div>
{title('01','项目背景与校园需求')}{sub('1.1','从“拍过一餐”到“知道今天怎么吃”')}
<p>食堂、外卖与便利店是学生的日常就餐场景，但吃了多少、哪些食物很少出现、近期精力与睡眠怎样，往往散落在照片和聊天里。用户需要把连续记录用于具体选择：<strong>今天在预算内加哪一种食物、吃多少、为什么选它？</strong></p>
<p>食迹拟以本校成年学生为首批用户，将餐食、实际食用量、偏好及精力与睡眠记录组织为个人台账，通过五项 Skill 串联营养估算、身体线索追问和配餐建议；不适持续时转向就医准备，帮助用户把日常记录用于下一次健康决策。</p>
{sub('1.2','三个高频场景，对应三种明确产出')}
<table class="scene-table"><thead><tr><th>使用场景</th><th>用户真正想知道</th><th>食迹提供的帮助</th></tr></thead><tbody><tr><td><b>连续外食，搭配重复</b><small>食堂 / 外卖 / 便利店</small></td><td>最近哪些营养来源比较少？</td><td>整理近期餐次与份量，展示摄入来源、记录覆盖情况及值得优先调整的食物类别。</td></tr><tr><td><b>预算有限，要买得具体</b><small>下一餐加购或替换</small></td><td>今天加什么、多少、多少钱？</td><td>按营养目标、预算与忌口比较候选食物，列出份量、预计贡献和替换选项。</td></tr><tr><td><b>饮食改善，仍然不适</b><small>乏力持续或影响日常</small></td><td>还需要补充哪些信息、怎样就医？</td><td>追问持续时间与伴随表现，生成就医沟通摘要，提示进一步专业评估。</td></tr></tbody></table>
{sub('1.3','公共健康与研究依据')}
<div class="evidence-pair"><div><b>把膳食原则变成日常选择</b><p>国家卫生健康委倡导增加蔬果、全谷物与水产品摄入，建议每天摄入新鲜水果 200—350 克。{cite(1)} 项目将这类原则转为一次可执行的加购或替换。</p></div><div><b>连续反馈具有研究基础</b><p>Food4Me 随机试验显示，基于个人信息的营养反馈有助于改善部分饮食行为。{cite(2)} 这支持服务思路，项目的实际效果仍需本土场景验证。</p></div></div>
<figure class="food-strip">{photos}<figcaption>校园外食场景素材：餐食照片是记录入口，份量与个人补充共同参与后续分析。</figcaption></figure>
'''
skills=[
('餐食解码','meal_profile_skill','照片 / 餐次 / 实际份量','识别候选食材，询问关键份量；将补记和修正写回同一餐次，保留修改历史。','可修正的餐食记录'),
('营养雷达','nutrient_radar_skill','食物条目 / 食用量 / 人群参照','检索有来源的成分值，按份量计算；汇总近期摄入与食物来源，区分记录不足和持续偏少。','有出处的摄入趋势'),
('身体线索','body_signal_skill','精力 / 睡眠 / 不适与时长','结合记录追问作息、压力及伴随表现，提示饮食调整、继续观察或专业评估的路径。','针对性追问与行动方向'),
('食补配餐','food_repair_skill','关注营养素 / 预算 / 忌口','筛选候选食物，计算份量和预计营养贡献；提供可替换选项，保存实际选择供后续复盘。','有份量的配餐建议'),
('就医准备','care_navigation_skill','持续不适 / 相关记录 / 指导资料','整理起病、变化、伴随表现及希望咨询的问题，说明可与医生讨论的评估方向。','就医沟通摘要')]
skill_rows=''.join(f'<tr><td><b>{a}</b><code>{b}</code></td><td><small>{c}</small><p>{d}</p></td><td>{e}</td></tr>' for a,b,c,d,e in skills)
p2=f'''
{title('02','产品机制与 Skill 设计')}{sub('2.1','同一份个人台账，连接五项专业任务')}
<p>用户以拍照或一句话开始记录，助手先补齐会影响判断的信息，再按任务调用 Skill。台账持续保留餐次、食用量、偏好与身体自评，使下一次建议能够沿用前次修正，而不必重新介绍自己。</p>
<div class="workflow"><div><i>01</i><b>拍照与补充</b><span>餐食 / 份量 / 感受</span></div><em>→</em><div><i>02</i><b>台账与检索</b><span>个人历史 / 来源条目</span></div><em>→</em><div><i>03</i><b>计算与追问</b><span>摄入趋势 / 身体线索</span></div><em>→</em><div><i>04</i><b>行动与跟进</b><span>配餐 / 就医准备</span></div></div>
<table class="skill-table"><thead><tr><th>Skill 名称</th><th>输入与处理任务</th><th>向用户交付</th></tr></thead><tbody>{skill_rows}</tbody></table>
{sub('2.2','模型理解语言，工具负责计算与记录')}
<p>采用<strong>多模态理解＋条目检索＋工具计算＋个人历史调用</strong>：模型理解照片与补充，工具执行有来源的计算和记录更新。DietAI24 提供了模型结合营养数据库的技术参考。{cite(5)}</p>
<div class="formula"><span>营养估算</span><b>某营养素摄入量＝每 100 克含量 × 实际食用克数 ÷ 100</b><p>同餐食物分别计算后求和。保留食物编码、生熟状态、份量及来源链接；混合菜难以判断时，先请用户补充或展示估计范围。</p></div>
<p class="data-note">中文条目拟参考《中国食物成分表》扩展并核实使用条件；原型以 USDA 条目演示。{cite(3)}{cite(4)} 膳食参照按年龄、生理状况等选择，不把参考摄入量当作营养缺乏诊断阈值。{cite(8)}{cite(9)}</p>
<p class="method-note">后续拟封装为 WorkBuddy 可复用 Skill，明确触发条件、输入输出、来源与异常处理。</p>
'''
points=' '.join(f'{15+i*17},{98-v*8}' for i,v in enumerate([8,8,7,7,7,6,6,6,5,5,4,5,4,4,4]))
chart=f'<svg viewBox="0 0 270 123" role="img" aria-label="演示精力自评从约8分下降至4分"><path d="M15 18H254M15 58H254M15 98H254"/><polyline points="{points}"/><text x="15" y="119">第1天</text><text x="217" y="119">第15天</text></svg>'
p3=f'''
{title('03','典型情境与创新价值')}{sub('3.1','外食搭配单一：从精力变化到一份具体加购')}
<p>演示情境中，用户连续外食，鲜果、奶类与深色蔬菜来源较少，近 15 天精力自评下降，最近一晚睡眠仅 5.5 小时。助手先把饮食与生活背景放在一起回顾，再询问不适持续时间；不能仅凭餐食照片断定“身体缺维生素”。</p>
<div class="scenario-grid"><figure class="battery"><figcaption>身体电量 <span>本人精力自评</span></figcaption><div class="energy">7.7 <i>→</i> 4 <small>/10</small></div>{chart}<p>起始三日均值 → 最近记录<br>最近睡眠 5.5 小时</p></figure><div class="action-card"><span class="card-kicker">食补配餐 · 一次可执行的行动</span><h3>加一份橙子<br>去皮后约 150 克</h3><div class="nutrient-number">≈ 80 <span>毫克维生素 C</span></div><p>按 USDA 橙子条目 53.2 mg/100g 计算。{cite(4)} 可在预算内换成其他候选水果，份量变化同步更新营养贡献。</p><div class="action-next">跟进：有没有实际加购？搭配是否方便？<br>精力、睡眠与不适有无继续变化？</div></div></div>
{sub('3.2','饮食较丰富仍不舒服：及时换一条服务路径')}
<p>另一情境中，饮食来源较丰富，但乏力已持续约三周、影响日常并偶有心悸。食迹继续整理起病时间、睡眠、用药和伴随表现，生成<strong>就医沟通摘要</strong>；提示尽快接受专业评估，不继续用“再补一种营养素”解释全部问题。{cite(6)}</p>
<div class="care-flow"><div><b>整理线索</b><span>持续时间、变化、伴随不适<br>饮食与作息、既往情况</span></div><em>→</em><div><b>形成摘要</b><span>就诊时需要告诉医生的信息<br>本人希望咨询的问题</span></div><em>→</em><div><b>专业评估</b><span>可讨论血常规等是否必要{cite(7)}<br>具体检查由医生结合病史决定</span></div></div>
{sub('3.3','创新点体现在“连续、可算、会转向”')}
<div class="value-list"><div><b>连续</b><p>饮食与身体自评形成可修正的个人历史，用户的一次补充能改变后续摄入估计与配餐选择。</p></div><div><b>可算</b><p>从“多吃水果”推进到具体食物、份量、预算与预计贡献，用户可查看来源并调整条件。</p></div><div><b>会转向</b><p>把生活方式建议与持续不适区分处理，必要时交付就医准备材料，避免反复输出同类食补建议。</p></div></div>
<p class="method-note">上述数值与身体自评为编排的演示情境，并非真实健康改善结果。身体电量表示本人感受；营养摄入估算不能替代体内营养状态检测。突发严重不适优先求助。</p>
'''
short_refs=['国家卫生健康委. “健康饮食、合理膳食”核心信息. 2025.','Celis-Morales C, et al. Food4Me. Int J Epidemiol. 2017;46:578–588.','中国疾控中心营养与健康所. 食物成分数据查询平台介绍. 2019.','USDA. FoodData Central: Oranges, raw. FDC 169097.','Yan R, et al. DietAI24. Commun Med. 2025;5:458.','NHS. Tiredness and fatigue. 在线健康指导.','NHS. Iron deficiency anaemia. 在线健康指导.','WS/T 578.5—2018. 水溶性维生素参考摄入量.','WS/T 578.2—2018. 常量元素参考摄入量.']
refs=''.join(f'<li><span>[{i}]</span><a href="{SOURCES[i][1]}">{t}</a></li>' for i,t in enumerate(short_refs,1))
p4=f'''
{title('04','团队协同、验证与持续推进')}{sub('4.1','工程 × 管理 × 设计：六人协作推进')}
<p>团队 <b>2的10次幂</b> · 数理与统计学院 / 设计学院 / 管理学院 · 指导教师 <b>张会彦副教授</b></p>
<div class="team-grid">
<div><h3>杨哲 <small>负责人 · 开发 / 设计</small></h3><p>系统与 Skill 开发、台账结构、交互联调及统筹。</p></div>
<div><h3>方子昊 <small>调研 / 分析</small></h3><p>食物条目整理、份量与数值核验、测试分析。</p></div>
<div><h3>邱宇强 <small>调研 / 分析</small></h3><p>外食需求梳理、营养资料核对、配餐案例分析。</p></div>
<div><h3>白璐 <small>管理 / 调研</small></h3><p>进度管理、体验招募与访谈、推广路径调研。</p></div>
<div><h3>江媛 <small>设计 / 展示</small></h3><p>信息架构、手机交互、营养与身体状态可视化。</p></div>
<div><h3>张新成 <small>设计 / 展示</small></h3><p>情境演示、交互素材与视频、可理解性记录。</p></div>
</div>
{sub('4.2','从可交互原型走向小范围体验')}
<p>已完成方案与可交互网页原型。拟招募自愿参与的本校成年外食学生开展两周体验，验证<strong>记录是否方便、计算是否可靠、建议能否执行</strong>，事先说明数据用途。</p>
<div class="plan-grid"><div><span>10月25—27日</span><b>资料与 Skill 整理</b><p>核对常见食物与参照来源；补齐 Skill 说明和关键异常任务。</p></div><div><span>10月28—31日</span><b>联调与情境验证</b><p>核验份量修正、预算与忌口筛选；完善手机体验和演示材料。</p></div><div><span>后续科创营阶段</span><b>小范围体验迭代</b><p>记录任务耗时、连续记录、建议采纳及用户理解，形成迭代清单。</p></div></div>
<p class="commitment">团队拟继续参与 Skill 开发和科创营；10月25—31日按每人每天约1—2小时安排，六人合计约42—84人时，结合课程统筹调整。</p>
{sub('4.3','怎样验证价值，怎样继续扩展')}
<p>人工核验餐次修正与计算误差，记录任务完成率、记录耗时、配餐采纳及来源解释的理解情况。持续不适情境核对是否建议专业评估、有无错误诊断；短期体验不宣称疾病改善。</p>
<p>校园验证后拟拓展职场青年与社区营养教育。个人信息最少收集，支持导出与删除；正式身体线索规则与就医提示须经专业审校。</p>
<section class="references"><h2>主要参考资料 <small>编号对应正文；完整链接与适用范围见在线资料页</small></h2><ol>{refs}</ol><p>检索日期：2026-10-22 · <a href="https://sa.zheoi.com/docs/references.html">sa.zheoi.com / 参考文献与公开调研 ↗</a></p></section>
'''
CSS=r'''
@page{size:A4;margin:0}*{box-sizing:border-box}body{margin:0;background:#e9edf4;color:#253347;font:500 10pt/1.72 "Shiji Serif","SimSun",serif}a{color:inherit;text-decoration:none}h1,h2,h3,b,strong,th{font-family:"Shiji Sans","Microsoft YaHei",sans-serif}h1,h2,h3{margin:0;font-weight:700;color:#153c81}p{margin:0 0 8px;text-align:justify}b,strong{font-weight:700}strong{color:#153f91;background:#e8f0ff;padding:0 2px;box-decoration-break:clone;-webkit-box-decoration-break:clone}sup{font:7pt "Shiji Sans",sans-serif;color:#2759af;margin-left:2px;line-height:0}small{font-size:8pt;color:#60738d}.page{width:210mm;height:297mm;background:#fff;margin:20px auto;padding:10mm 14mm 14mm;position:relative;break-after:page;overflow:hidden;box-shadow:0 8px 35px #1f37621a}.page:last-child{break-after:auto}.school{display:flex;align-items:center;gap:8px}.school .symbol{width:26px;height:32px;object-fit:contain}.school-name{width:136px;height:39px;object-fit:contain}.masthead{display:flex;justify-content:space-between;align-items:center;padding-bottom:8px}.masthead>span{font:7.5pt/1.7 "Shiji Sans",sans-serif;color:#5d6e87;text-align:right}.document-header{display:grid;grid-template-columns:1fr 1fr 1fr;align-items:center;padding:5px 0 7px;border-bottom:2px solid #254b9b;font:8pt "Shiji Sans",sans-serif;color:#52698a;margin-bottom:15px}.wordmark{text-align:center;font-size:11pt;font-weight:700;color:#20458b;letter-spacing:2px}.header-team{text-align:right}.section-title{font-size:14.2pt;line-height:1.5;background:#edf3ff;border-bottom:1.4px solid #244c9b;display:flex;align-items:center;gap:11px;padding:6px 11px;margin:0 0 12px}.section-title>span{font-size:11pt;background:#234b9a;color:white;padding:0 6px;letter-spacing:.5px}.section-title:after{content:"";width:24px;height:19px;margin-left:auto;border-left:8px solid #c8d8f5;border-right:8px solid #dce7fa;transform:skew(-29deg)}h2{font-size:10.9pt;display:flex;align-items:center;gap:7px;margin:11px 0 7px;line-height:1.6}h2>span{font-size:8.2pt;border:1px solid #bfcfed;border-radius:2px;padding:0 4px;line-height:1.35}h3{font-size:12pt}table{width:100%;border-collapse:collapse;text-align:left;font:9pt/1.75 "Shiji Sans",sans-serif}th{background:#eef4ff;font-size:8.8pt;color:#1e448c;border-top:1px solid #2752a0;border-bottom:1px solid #2752a0;padding:7px 9px}td{padding:8px 9px;border-bottom:1px solid #d9e1ec;vertical-align:top}tbody tr:last-child td{border-bottom:1px solid #5377b5}td small{display:block;font-size:7.5pt;color:#6e7d90}td b{color:#284f8d}figure{margin:0}.cover{display:grid;grid-template-columns:1fr 150px;gap:22px;align-items:center;margin:4px 0 14px}.eyebrow{font:8.7pt "Shiji Sans",sans-serif;color:#4e6c9d;letter-spacing:.7px}.cover h1{font:700 36pt/1.25 "Shiji Sans",sans-serif;letter-spacing:5px;color:#173f87;margin:5px 0}.cover hgroup>p{font:700 12pt/1.8 "Shiji Sans",sans-serif;margin:0 0 11px;color:#28466c}.cover-summary{font-size:9pt;line-height:1.9;color:#65758a;margin:0}.cover-summary b{color:#344d70;font-size:9.3pt}.demo-entry{display:flex;flex-direction:column;align-items:center;gap:4px;font-family:"Shiji Sans",sans-serif}.demo-entry img{width:140px;height:140px}.demo-entry b{font-size:10pt;color:#204c99}.demo-entry span{font-size:7.5pt;color:#65758b;white-space:nowrap}.identity{display:flex;align-items:center;justify-content:space-between;background:#f3f6fb;padding:7px 10px;font:8pt "Shiji Sans",sans-serif;color:#66758a;margin-bottom:17px}.identity b{margin-left:5px;color:#294976}.scene-table th:first-child{width:27%}.scene-table th:nth-child(2){width:30%}.scene-table{font-size:8.7pt}.scene-table td{padding:6px 8px}.evidence-pair{display:grid;grid-template-columns:1fr 1fr;gap:24px}.evidence-pair>div{border-left:2px solid #baccee;padding-left:11px}.evidence-pair b{font-size:9.3pt;color:#2b4e85}.evidence-pair p{font-size:9.3pt;line-height:1.8;margin:6px 0 0}.food-strip{display:grid;grid-template-columns:repeat(6,1fr);gap:5px;margin-top:15px}.food-strip img{width:100%;height:62px;object-fit:cover}.food-strip figcaption{grid-column:1/-1;font:7.2pt/1.8 "Shiji Sans",sans-serif;color:#7a889b;margin-top:3px}.workflow{display:flex;gap:7px;justify-content:space-between;align-items:center;background:#f3f6fc;padding:10px 12px;margin:12px 0 14px;font-family:"Shiji Sans",sans-serif}.workflow>div{min-width:0}.workflow i{font-size:7pt;font-style:normal;color:#6d8bb9;display:block}.workflow b{display:block;font-size:9.2pt;color:#234987;margin:2px 0}.workflow span{font-size:7.4pt;color:#71839c;display:block}.workflow em,.care-flow em{font-style:normal;color:#92abd0}.skill-table th:first-child{width:25%}.skill-table th:nth-child(2){width:56%}.skill-table td{padding:4px 8px}.skill-table td:first-child b{display:block;font-size:10.3pt}.skill-table code{font:6.8pt "Shiji Sans",sans-serif;color:#7689a3;overflow-wrap:anywhere;display:block;margin-top:2px}.skill-table p{font-size:8.9pt;line-height:1.65;margin:4px 0 0}.skill-table td:last-child{font-size:8.5pt;color:#3b5780;vertical-align:middle}.data-note{font-size:9.2pt;line-height:1.75;color:#526885}.formula{background:#f2f6fd;border-left:3px solid #7295ce;padding:10px 12px;margin:13px 0}.formula span{display:block;font:7.4pt "Shiji Sans",sans-serif;color:#6a7f9c}.formula b{font-size:9pt;color:#2c4e83;display:block;margin:3px 0}.formula p{font-size:8.9pt;line-height:1.8;margin:5px 0 0}.memory-examples{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin:10px 0 15px}.memory-examples>div{border-top:2px solid #8ba8d6;padding-top:8px}.memory-examples span{display:block;font:7.2pt "Shiji Sans",sans-serif;color:#8190a6}.memory-examples b{display:block;font-size:9.3pt;color:#31558b;margin:4px 0}.memory-examples p{font-size:9.1pt;line-height:1.8;margin:0}.method-note{font:7.7pt/1.85 "Shiji Sans",sans-serif;color:#7d8999;border-top:1px solid #e1e7f0;padding-top:9px;text-align:left;margin-top:15px}.scenario-grid{display:grid;grid-template-columns:235px 1fr;gap:23px;margin:15px 0 20px}.battery{padding:14px 17px;background:#f1f5fc;font-family:"Shiji Sans",sans-serif}.battery figcaption{font-size:10pt;font-weight:700;color:#2b508b}.battery figcaption span{font-size:7.2pt;font-weight:400;color:#7a8da9;display:block;margin-top:3px}.energy{font-size:25pt;font-weight:700;color:#2653a3;margin:9px 0 0;line-height:1.5}.energy i{font-size:14pt;color:#9caeca;font-style:normal;margin:0 7px}.energy small{font-size:9pt}.battery svg{display:block;width:100%;height:94px;fill:none;margin:5px 0}.battery svg path{stroke:#d8e3f4;stroke-width:1}.battery svg polyline{stroke:#3468ba;stroke-width:2.5;fill:none}.battery svg text{font:9px "Shiji Sans",sans-serif;fill:#7e92af}.battery>p{font-size:7.5pt;color:#6e82a1;line-height:1.8;margin:0}.action-card{padding:8px 0}.card-kicker{font:7.5pt "Shiji Sans",sans-serif;color:#7189ad}.action-card h3{font-size:16pt;line-height:1.6;margin:8px 0;color:#224c94}.nutrient-number{font:700 23pt "Shiji Sans",sans-serif;color:#275cbd;margin:10px 0}.nutrient-number span{font-size:10pt;font-weight:500}.action-card>p{font-size:9.2pt;line-height:1.85}.action-next{background:#edf4ff;padding:9px 11px;font:8.1pt/1.8 "Shiji Sans",sans-serif;color:#4b6a9b}.care-flow{display:flex;align-items:center;justify-content:space-between;border-top:1px solid #d6e1f1;border-bottom:1px solid #d6e1f1;padding:13px 0;margin:13px 0 18px;gap:8px;font-family:"Shiji Sans",sans-serif}.care-flow b{display:block;font-size:9.6pt;color:#365a94;margin-bottom:4px}.care-flow span{font-size:8pt;color:#6e819d;line-height:1.9;display:block}.value-list{display:grid;gap:9px;margin:10px 0 17px}.value-list>div{display:grid;grid-template-columns:58px 1fr;gap:14px}.value-list b{font-size:10pt;color:#2b579a;background:#ecf3ff;text-align:center;align-self:start;line-height:2}.value-list p{font-size:10pt;line-height:1.85;margin:0}.team-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px 25px;margin:10px 0 14px}.team-grid>div{border-bottom:1px solid #e1e8f3;padding:3px 0 8px}.team-grid h3{display:flex;align-items:center;justify-content:space-between;gap:5px;font-size:10pt;color:#284e90;line-height:1.6}.team-grid h3 small{font-size:7.6pt;font-weight:400;color:#7c90ad}.team-grid p{font-size:8.8pt;line-height:1.75;margin:5px 0 0}.plan-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin:13px 0}.plan-grid>div{border-top:2px solid #91acda;padding-top:7px}.plan-grid span{font:7.3pt "Shiji Sans",sans-serif;color:#6981a5}.plan-grid b{display:block;font-size:9.3pt;color:#2b4f8b;margin:4px 0}.plan-grid p{font-size:9pt;line-height:1.7;margin:0}.commitment{font-size:9pt;background:#f0f5fd;padding:8px 11px;line-height:1.85}.references{border-top:1px solid #d8e2f1;margin-top:13px;padding-top:7px}.references h2{font-size:9pt;margin:0 0 6px}.references h2 small{font-size:6.5pt;font-weight:400;margin-left:4px}.references ol{list-style:none;padding:0;margin:0;display:grid;grid-template-columns:1fr 1fr;gap:5px 15px;font:7pt/1.7 "Shiji Sans",sans-serif}.references li{display:flex;gap:4px}.references li>span{color:#5375ac;flex-shrink:0}.references>p{font:6.8pt "Shiji Sans",sans-serif;color:#8390a3;margin:7px 0 0}footer{position:absolute;bottom:8mm;left:14mm;right:14mm;padding-top:7px;border-top:1px solid #d5deec;display:flex;align-items:center;justify-content:space-between;font:6.9pt "Shiji Sans",sans-serif;color:#8090a8}footer b{color:#31558c;font-size:9pt;margin-right:3px}.toolbar{width:210mm;margin:20px auto 0;display:flex;align-items:center;justify-content:space-between;font:11px "Microsoft YaHei",sans-serif;color:#506789}.toolbar button{font:inherit;background:#214c9d;color:white;padding:9px 15px;border:0;cursor:pointer}@media print{body{background:#fff}.page{margin:0;box-shadow:none}.toolbar{display:none}}@media screen and (max-width:800px){.toolbar{margin-left:14px}.page{margin-left:0;margin-right:0}}
'''
def font_css():
 out=''
 for family,name,weight in [('Shiji Serif','shiji-serif.woff2','200 900'),('Shiji Sans','shiji-sans-regular.woff2','400'),('Shiji Sans','shiji-sans-medium.woff2','500'),('Shiji Sans','shiji-sans-bold.woff2','700')]:
  data=base64.b64encode((ROOT/'assets/fonts'/name).read_bytes()).decode()
  out+=f'@font-face{{font-family:"{family}";src:url(data:font/woff2;base64,{data}) format("woff2");font-weight:{weight};font-display:block}}'
 return out
def subset_fonts():
 from fontTools.ttLib import TTFont
 from fontTools import subset
 from fontTools.varLib.instancer import instantiateVariableFont
 serif=os.environ.get('SHIJI_SERIF_FONT')
 sans=os.environ.get('SHIJI_SANS_FONT')
 if not serif or not sans:
  raise SystemExit('Set SHIJI_SERIF_FONT and SHIJI_SANS_FONT to full Noto Serif SC / Noto Sans SC variable font files. Bundled subsets are used when --fonts is omitted.')
 content=''.join([p1,p2,p3,p4])+CSS+json.dumps(cfg,ensure_ascii=False)+'上海工程技术大学2026旋创赛食迹创意计划书智能数字大健康2的10次幂0123456789 / . — ↗'
 text=html.unescape(re.sub('<[^>]+>','',content))
 for src,dst,weight in [(serif,'shiji-serif.woff2',None),(sans,'shiji-sans-regular.woff2',400),(sans,'shiji-sans-medium.woff2',500),(sans,'shiji-sans-bold.woff2',700)]:
  font=TTFont(src)
  if weight is not None and 'fvar' in font:font=instantiateVariableFont(font,{'wght':weight},inplace=True)
  opts=subset.Options();opts.layout_features=['*'];opts.name_IDs=['*'];opts.recalc_timestamp=False
  subber=subset.Subsetter(options=opts);subber.populate(text=text);subber.subset(font);font.flavor='woff2';font.save(ROOT/'assets/fonts'/dst)
def generate(preview=False):
 body=''
 for i,content in enumerate([p1,p2,p3,p4],1):
  body+=f'<section class="page" id="page-{i}"><div class="masthead">{school()}<span>2026「AI赋能·三旋翼驱动」旋创赛<br>智能数字大健康</span></div><header class="document-header"><span>2026 旋创赛</span><span class="wordmark">食迹</span><span class="header-team">2的10次幂</span></header><main>{content}</main><footer><span>上海工程技术大学 · 食迹创意计划书 · 2的10次幂</span><span>{cfg["document_date"]}　 <b>{i:02d}</b> / 04</span></footer></section>'
 doc='<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>食迹 · 创意计划书 · 2的10次幂</title><style>'+font_css()+CSS+'</style></head><body><div class="toolbar"><span>食迹 · 四页创意计划书</span><button onclick="window.print()">打印 / 保存 PDF</button></div>'+body+'</body></html>'
 target=ROOT/'tmp/pdfs/C_layout_preview.html' if preview else ROOT/'docs/proposal.html';target.parent.mkdir(parents=True,exist_ok=True);target.write_text(doc,encoding='utf-8')
 if not preview:
  from sync_proposal_text import sync
  sync(ROOT,doc,SOURCES)
 print('Generated:',target);return target
if __name__=='__main__':
 if '--fonts' in sys.argv:subset_fonts()
 generate('--preview' in sys.argv)
