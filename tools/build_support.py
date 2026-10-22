from pathlib import Path
import json
import html
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
sources={int(k):tuple(v) for k,v in json.loads((ROOT/'docs/references.json').read_text(encoding='utf-8')).items()}
notes={
1:'合理膳食的官方健康教育依据，用于界定蔬果等食物来源的改善方向。',
2:'个性化营养反馈的原始随机试验，支持服务研究背景，不代表本项目已证明健康效果。',
3:'中国食物成分表相关查询平台介绍，作为中文食物资料的候选来源；后续接入及数据使用条件仍需核实。',
4:'原型从 USDA FoodData Central 官方接口核对并整理了9个标准食物条目，按可食重量计算维生素C、叶酸与钙。去皮后150克橙子预计提供维生素C79.8毫克。其他条目来源链接保存在演示中。',
5:'多模态模型结合营养数据库的原始研究，用于条目匹配、份量估算与营养计算的技术路径参考。',
6:'持续疲劳的原因、就医时机及评估方向，用于身体线索整理与就医准备；原型规则不等同于经验证的临床分诊系统。',
7:'缺铁性贫血的症状与临床评估介绍，用于解释伴随线索下可与医生讨论的评估方向，不用于自动确诊。',
8:'水溶性维生素膳食参考摄入量。演示选择22岁成年男性情境；参照用于膳食计划，不作为营养缺乏诊断阈值。',
9:'常量元素膳食参考摄入量，用于原型成年男性情境中的钙参照；真实个体需按年龄与生理状况选择。',
}
md=['# 食迹：参考文献与公开调研','', '本资料与项目书正文的[1]—[9]编号一致。访问日期：2026-10-22。','']
items=[]
for n,(title,url) in sources.items():
    md.extend([f'## [{n}] {title}', '', url, '', notes[n], ''])
    items.append(f'<section><h2>[{n}] {html.escape(title)}</h2><p>{notes[n]}</p><a href="{url}">{url}</a></section>')
md.extend(['## 研究与调研范围','','正文中的用户需求属于项目的目标场景选择。公开政策、研究与产品资料构成桌面调研，未虚构用户访谈或问卷。产品官网用于确认功能，不作为临床效果依据。','','公开研究用于说明背景与技术路径，不直接证明本项目已取得健康改善效果。'])
(ROOT/'docs/references.md').write_text('\n'.join(md),encoding='utf-8')
css='''*{box-sizing:border-box}body{margin:0;background:#f1f3f2;color:#223345;font-family:"Microsoft YaHei",sans-serif;line-height:1.85;font-size:14px}main{max-width:1040px;margin:30px auto;padding:40px 55px;background:white;border:1px solid #e2ded7}h1{font-size:27px;font-weight:600;margin:0 0 12px}h2{font-size:16px;font-weight:600;margin:0 0 9px}section{margin-top:26px;padding-top:21px;border-top:1px solid #e2ded7}p{margin:0 0 10px}a{color:#2b5ca6;overflow-wrap:anywhere}.back{font-size:12px;display:block;margin-bottom:24px}.meta{color:#77766d;font-size:12px}@media(max-width:700px){main{margin:0;padding:25px 20px}}'''
refs_doc=f'<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>食迹 · 参考文献与调研</title><style>{css}</style><main><a class="back" href="../index.html">← 返回项目介绍</a><h1>参考文献与公开调研</h1><p class="meta">与项目书正文编号一致 / 访问日期：2026-10-22</p>'+''.join(items)+'<section><h2>研究与调研范围</h2><p>正文中的用户需求属于项目的目标场景选择。公开政策、研究与产品资料构成桌面调研，未虚构访谈或问卷数据。产品官网用于确认功能，不作为临床效果依据。</p></section></main></html>'
(ROOT/'docs/references.html').write_text(refs_doc,encoding='utf-8')
im=Image.open(ROOT/'tmp'/'pdfs'/'proposal_1.png').convert('RGB');im.thumbnail((680,1000));im.save(ROOT/'assets'/'proposal-preview.jpg',quality=92)
from build_project_index import build_index
build_index()
print('Matching references and campus project entry generated.')
